
const mongoose = require("mongoose");

const Order = require("../models/order.model");
const OrderProductItem = require("../models/orderProductItem.model");
const OrderDealItem = require("../models/orderDealItem.model");
const OrderWorkflow = require("../models/orderWorkflow.model");

const STATUS_TEXT = {
  pending: "Order Pending",
  confirmed: "Order Confirmed",
  preparing: "Order Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Order Delivered",
  cancelled: "Order Cancelled",
};

/**
 * Generate order number
 */
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `ORD-${timestamp}-${random}`;
}

/**
 * Create Order
 *
 * Creates:
 * 1. Order
 * 2. OrderProductItem records
 * 3. OrderDealItem records
 * 4. Initial OrderWorkflow record
 */
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      user,
      products = [],
      deals = [],
      delivery,
      subtotal,
      deliveryCharge,
      total,
      paymentMethod = "COD",
    } = req.body;

    if (!user) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "User is required.",
      });
    }

    if (
      (!Array.isArray(products) || products.length === 0) &&
      (!Array.isArray(deals) || deals.length === 0)
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Order must contain at least one product or deal.",
      });
    }

    if (!delivery) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Delivery information is required.",
      });
    }

    const orderNumber = generateOrderNumber();

    /**
     * Create parent order
     */
    const order = await Order.create(
      [
        {
          orderNumber,
          user,

          delivery: {
            address: delivery.address,
            distanceKm: delivery.distanceKm,
            slotId: delivery.slotId,
            slotText: delivery.slotText,
          },

          subtotal,
          deliveryCharge,
          total,

          status: "pending",
          statusText: STATUS_TEXT.pending,

          paymentStatus: "pending",
          paymentMethod,
        },
      ],
      { session }
    );

    const createdOrder = order[0];

    /**
     * Create product items
     */
    const productItems = [];

    if (Array.isArray(products)) {
      for (const item of products) {
        if (!item.product) {
          throw new Error("Product ID is required.");
        }

        const quantity = Number(item.quantity);

        const unitPrice = Number(item.unitPrice);

        if (!quantity || quantity < 1) {
          throw new Error("Product quantity must be at least 1.");
        }

        if (unitPrice < 0) {
          throw new Error("Product price cannot be negative.");
        }

        productItems.push({
          order: createdOrder._id,
          product: item.product,

          name: item.name,
          image: item.image || "",

          quantity,
          unitPrice,

          lineTotal:
            item.lineTotal !== undefined
              ? Number(item.lineTotal)
              : quantity * unitPrice,
        });
      }
    }

    if (productItems.length > 0) {
      await OrderProductItem.insertMany(productItems, {
        session,
      });
    }

    /**
     * Create deal items
     */
    const dealItems = [];

    if (Array.isArray(deals)) {
      for (const item of deals) {
        if (!item.deal) {
          throw new Error("Deal ID is required.");
        }

        const quantity = Number(item.quantity);
        const dealPrice = Number(item.dealPrice);

        if (!quantity || quantity < 1) {
          throw new Error("Deal quantity must be at least 1.");
        }

        if (dealPrice < 0) {
          throw new Error("Deal price cannot be negative.");
        }

        const includedProducts = Array.isArray(item.products)
          ? item.products.map((product) => ({
              product: product.product,
              name: product.name,
              image: product.image || "",
              quantity: Number(product.quantity),
              unitPrice: Number(product.unitPrice),
            }))
          : [];

        dealItems.push({
          order: createdOrder._id,
          deal: item.deal,

          name: item.name,
          image: item.image || "",

          quantity,
          dealPrice,

          lineTotal:
            item.lineTotal !== undefined
              ? Number(item.lineTotal)
              : quantity * dealPrice,

          products: includedProducts,
        });
      }
    }

    if (dealItems.length > 0) {
      await OrderDealItem.insertMany(dealItems, {
        session,
      });
    }

    /**
     * Create initial workflow entry
     */
    await OrderWorkflow.create(
      [
        {
          order: createdOrder._id,

          fromStatus: "",

          toStatus: "pending",

          statusText: STATUS_TEXT.pending,

          changedBy: req.user?._id || user,

          note: "Order created.",

          source: "customer",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    /**
     * Return complete order
     */
    const result = await getCompleteOrder(createdOrder._id);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: result,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order.",
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get complete order
 */
async function getCompleteOrder(orderId) {
  const order = await Order.findById(orderId)
    .populate("user", "firstName lastName phone email")
    .lean();

  if (!order) {
    return null;
  }

  const [products, deals, workflow] = await Promise.all([
    OrderProductItem.find({
      order: orderId,
    })
      .populate("product")
      .lean(),

    OrderDealItem.find({
      order: orderId,
    })
      .populate("deal")
      .lean(),

    OrderWorkflow.find({
      order: orderId,
    })
      .populate("changedBy", "firstName lastName phone")
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  return {
    ...order,
    productItems: products,
    dealItems: deals,
    workflow,
  };
}

/**
 * Get single order
 */
exports.getOrder = async (req, res) => {
  try {
    //const { id } = req.user._id || req.user?.id || {}   ;
    const id = req.params.id;

    const order = await getCompleteOrder(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get order.",
    });
  }
};

/**
 * Get orders for a user
 */
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const orders = await Order.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const result = [];

    for (const order of orders) {
      const [products, deals] = await Promise.all([
        OrderProductItem.find({
          order: order._id,
        })
          .populate("product")
          .lean(),

        OrderDealItem.find({
          order: order._id,
        })
          .populate("deal")
          .lean(),
      ]);

      result.push({
        ...order,
        productItems: products,
        dealItems: deals,
      });
    }

    return res.json({
      success: true,
      orders: result,
    });
  } catch (error) {
    console.error("Get user orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get user orders.",
    });
  }
};

/**
 * Get all orders
 */
exports.getOrders = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "firstName lastName phone email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Order.countDocuments(filter),
    ]);

    const result = [];

    for (const order of orders) {
      const [products, deals] = await Promise.all([
        OrderProductItem.find({
          order: order._id,
        })
          .populate("product")
          .lean(),

        OrderDealItem.find({
          order: order._id,
        })
          .populate("deal")
          .lean(),
      ]);

      result.push({
        ...order,
        productItems: products,
        dealItems: deals,
      });
    }

    return res.json({
      success: true,
      orders: result,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get orders.",
    });
  }
};

/**
 * Update order status
 */
exports.updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const id = req.params.id; // req.user?._id || req.user?.id;

    const {
      status,
      note = "",
      source = "admin",
    } = req.body;

    if (!status) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Status is required.",
      });
    }

    const order = await Order.findById(id).session(session);

    if (!order) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const oldStatus = order.status;

    if (oldStatus === status) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Order already has this status.",
      });
    }

    /**
     * Update order
     */
    order.status = status;
    order.statusText =
      STATUS_TEXT[status] || status;

    if (status === "delivered") {
      order.deliveredAt = new Date();
    }

    if (status === "cancelled") {
      order.cancelledAt = new Date();
      order.cancellationReason = note;
    }

    await order.save({ session });

    /**
     * Add workflow history
     */
    await OrderWorkflow.create(
      [
        {
          order: order._id,

          fromStatus: oldStatus,

          toStatus: status,

          statusText:
            STATUS_TEXT[status] || status,

          changedBy:
            req.user?._id || null,

          note,

          source,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const result = await getCompleteOrder(order._id);

    return res.json({
      success: true,
      message: "Order status updated successfully.",
      order: result,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get order workflow/history
 */
exports.getOrderWorkflow = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
const id = req.params.id;

    const workflow = await OrderWorkflow.find({
      order: id,
    })
      .populate("changedBy", "firstName lastName phone")
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      workflow,
    });
  } catch (error) {
    console.error("Get workflow error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get order workflow.",
    });
  }
};

/**
 * Get the authenticated user's latest order and its workflow
 */
exports.currentStatus = async (req, res) => {

    console.log("Fetching current status for user:", req.user);
    console.log("Fetching current status for user:", req.user?.userId || req.user?.id);
  try {
    // User ID comes from authentication middleware, not request parameters.
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    console.log("User ID:", userId);
    // Find the user's latest order.
    const order = await Order.findOne({
      user: userId,
    })
      .sort({ createdAt: -1})
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "You don't have any orders yet.",
        order: null,
        workflow: [],
      });
    }

    // Fetch the latest order's workflow.
    const workflow = await OrderWorkflow.find({
      order: order._id,
    })
      .sort({ createdAt: -1, _id    : -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Current order status retrieved successfully.",
      order,
      workflow,
    });
  } catch (error) {
    console.error("Get current order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get current order status.",
    });
  }
};