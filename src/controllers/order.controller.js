
const mongoose = require("mongoose");

const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const OrderTimeline = require("../models/orderTimeline.model");

const Product = require("../models/product.model");
const Deal = require("../models/deal.model");
const Address = require("../models/address.model");
const DeliverySlot = require("../models/deliverySlot.model");
const User = require("../models/User");

// ============================================================
// GENERATE ORDER NUMBER
// ============================================================

const generateOrderNumber = async () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const prefix = `ORD-${year}${month}${day}`;

  const count = await Order.countDocuments({
    orderNumber: {
      $regex: `^${prefix}`,
    },
  });

  return `${prefix}-${String(count + 1).padStart(
    4,
    "0"
  )}`;
};

// ============================================================
// CREATE ORDER
// ============================================================

const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    //const customerId = req.user.id;
    const {
      addressId,
      deliverySlotId,
      items,
      paymentMethod,
      customerNotes,
      customerId,
    } = req.body;

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    if (!deliverySlotId) {
      return res.status(400).json({
        success: false,
        message: "Delivery slot is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // --------------------------------------------------------
    // GET CUSTOMER ADDRESS
    // --------------------------------------------------------

    const customer = await User.findOne({
      _id: customerId,
      isActive: true,
    }).lean();

    const address = customer.addresses.find(
      (addr) => addr._id.toString() === addressId
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // --------------------------------------------------------
    // GET DELIVERY SLOT
    // --------------------------------------------------------

    const deliverySlot =
      await DeliverySlot.findOne({
        _id: deliverySlotId,
        isActive: true,
      }).lean();
    if (!deliverySlot) {
      return res.status(404).json({
        success: false,
        message: "Delivery slot not found",
      });
    }

    // --------------------------------------------------------
    // CHECK DELIVERY SLOT DAY
    // --------------------------------------------------------

    const deliveryDay =
      deliverySlot.dayOfWeek;
    if (
      ![
        0,
        1,
        2,
        3,
        4,
        5,
        6,
      ].includes(deliveryDay)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery slot day",
      });
    }

    // --------------------------------------------------------
    // PROCESS ITEMS
    // --------------------------------------------------------

    const orderItems = [];

    let subtotal = 0;
    let discount = 0;

    for (const requestedItem of items) {
      const {
        productId,
        quantity,
        dealId,
      } = requestedItem;

      // ------------------------------------------------------
      // VALIDATE PRODUCT
      // ------------------------------------------------------

      if (!productId) {
        throw new Error(
          "Product ID is required"
        );
      }

      const itemQuantity =
        Number(quantity);

      if (
        !Number.isInteger(itemQuantity) ||
        itemQuantity <= 0
      ) {
        throw new Error(
          `Invalid quantity for product ${productId}`
        );
      }

      const product =
        await Product.findById(productId).lean();

      if (!product) {
        throw new Error(
          `Product not found: ${productId}`
        );
      }

      // Optional product active check
      if (product.isActive === false) {
        throw new Error(
          `${product.nameEn} is not available`
        );
      }

      // ------------------------------------------------------
      // NORMAL PRODUCT
      // ------------------------------------------------------

      if (!dealId) {
        const unitPrice =
          Number(product.price || 0);

        const totalPrice =
          unitPrice * itemQuantity;

        subtotal += totalPrice;

        orderItems.push({
          productId: product._id,

          dealId: null,

          productNameEn:
            product.nameEn,

          productNameUr:
            product.nameUr || "",

          sku:
            product.sku || "",

          image:
            product.image || "",

          quantity: itemQuantity,

          unitPrice,

          totalPrice,

          dealPrice: null,
        });

        continue;
      }

      // ------------------------------------------------------
      // DEAL PRODUCT
      // ------------------------------------------------------

      const deal =
        await Deal.findOne({
          _id: dealId,
          isActive: true,
        }).lean();

      if (!deal) {
        throw new Error(
          `Deal not found or inactive: ${dealId}`
        );
      }

      // ------------------------------------------------------
      // CHECK PRODUCT IS ACTUALLY PART OF DEAL
      // ------------------------------------------------------

      const dealProduct =
        deal.products.find(
          (dealItem) =>
            dealItem.productId.toString() ===
            productId.toString()
        );

      if (!dealProduct) {
        throw new Error(
          `${product.nameEn} is not part of this deal`
        );
      }

      // ------------------------------------------------------
      // DEAL PRICE
      // ------------------------------------------------------

      const dealPrice =
        Number(dealProduct.dealPrice);

      if (
        Number.isNaN(dealPrice) ||
        dealPrice < 0
      ) {
        throw new Error(
          `Invalid deal price for ${product.nameEn}`
        );
      }

      const totalPrice =
        dealPrice * itemQuantity;

      const normalPrice =
        Number(product.price || 0) *
        itemQuantity;

      const itemDiscount =
        Math.max(
          0,
          normalPrice - totalPrice
        );

      subtotal += totalPrice;
      discount += itemDiscount;

      orderItems.push({
        productId: product._id,

        // VERY IMPORTANT
        dealId: deal._id,

        productNameEn:
          product.nameEn,

        productNameUr:
          product.nameUr || "",

        sku:
          product.sku || "",

        image:
          product.image || "",

        quantity: itemQuantity,

        unitPrice: dealPrice,

        totalPrice,

        dealPrice,
      });
    }

    // --------------------------------------------------------
    // DELIVERY CHARGES
    // --------------------------------------------------------

    // Change this later if you have delivery-charge logic.
    const deliveryCharges = 0;

    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    const total =
      subtotal +
      deliveryCharges;

    // --------------------------------------------------------
    // ORDER NUMBER
    // --------------------------------------------------------

    const orderNumber =
      await generateOrderNumber();

    // --------------------------------------------------------
    // ADDRESS SNAPSHOT
    // --------------------------------------------------------
    console.log("address:", address);
    console.log("customer:", customer);
    const addressSnapshot = {
      label:
        address.label || "",

      recipientName:
        customer.firstName+ " " + customer.lastName || "",

      phone:
        customer.phone,
        
      addressLine1:
        address.address,

    deliveryInstructions:
      address.deliveryInstructions || "",
    //   addressLine2:
    //     address.addressLine2 || "",

    //   area:
    //     address.area || "",

    //   city:
    //     address.city || "",

    //   postalCode:
    //     address.postalCode || "",

      location:
        address.location || "",

      latitude:
        address.latitude ?? null,

      longitude:
        address.longitude ?? null,
    };
    console.log("addressSnapshot:", addressSnapshot);

    // --------------------------------------------------------
    // DELIVERY SLOT SNAPSHOT
    // --------------------------------------------------------

    const deliverySlotSnapshot = {
      startTime:
        deliverySlot.startTime,

      endTime:
        deliverySlot.endTime,
    };

    // --------------------------------------------------------
    // CREATE EVERYTHING IN TRANSACTION
    // --------------------------------------------------------

    let createdOrder;

    await session.withTransaction(
      async () => {
        // ----------------------------------------------
        // CREATE ORDER
        // ----------------------------------------------

        const orders =
          await Order.create(
            [
              {
                orderNumber,

                customerId,

                addressId,

                address:
                  addressSnapshot,

                deliveryDay,

                deliverySlotId,

                deliverySlot:
                  deliverySlotSnapshot,

                status: "Pending",

                paymentMethod:
                  paymentMethod ||
                  "Cash on Delivery",

                paymentStatus:
                  "Pending",

                subtotal,

                discount,

                deliveryCharges,

                total,

                customerNotes:
                  customerNotes || "",
              },
            ],
            {
              session,
            }
          );

        createdOrder = orders[0];

        // ----------------------------------------------
        // CREATE ORDER ITEMS
        // ----------------------------------------------

        const itemsToCreate =
          orderItems.map((item) => ({
            ...item,

            orderId:
              createdOrder._id,
          }));

        await OrderItem.insertMany(
          itemsToCreate,
          {
            session,
          }
        );

        // ----------------------------------------------
        // CREATE INITIAL TIMELINE
        // ----------------------------------------------

        await OrderTimeline.create(
          [
            {
              orderId:
                createdOrder._id,

              status: "Pending",

              title:
                "Order placed",

              message:
                "Your order has been placed successfully.",

              changedBy:
                customerId,

              changedByType:
                "customer",
            },
          ],
          {
            session,
          }
        );
      }
    );

    // --------------------------------------------------------
    // RETURN COMPLETE ORDER
    // --------------------------------------------------------

    const completeOrder =
      await Order.findById(
        createdOrder._id
      )
        .populate(
          "customerId",
          "firstName lastName phone email"
        )
        .populate(
          "addressId"
        )
        .lean();

    const completeItems =
      await OrderItem.find({
        orderId:
          createdOrder._id,
      })
        .populate(
          "productId"
        )
        .populate(
          "dealId",
          "nameEn nameUr"
        )
        .lean();

    const timeline =
      await OrderTimeline.find({
        orderId:
          createdOrder._id,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    return res.status(201).json({
      success: true,

      message:
        "Order created successfully",

      data: {
        order:
          completeOrder,

        items:
          completeItems,

        timeline,
      },
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    next(error);
  } finally {
    await session.endSession();
  }
};

// ============================================================
// GET MY ORDERS
// ============================================================

const getMyOrders = async (
  req,
  res,
  next
) => {
  try {
    const customerId = req.user.id;

    const orders =
      await Order.find({
        customerId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET MY ORDER BY ID
// ============================================================

const getMyOrderById = async (
  req,
  res,
  next
) => {
  try {
    const customerId = req.user.id;

    const { id } =
      req.params;

    const order =
      await Order.findOne({
        _id: id,
        customerId,
      })
        .populate(
          "customerId",
          "firstName lastName phone email"
        )
        .populate(
          "addressId"
        )
        .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const items =
      await OrderItem.find({
        orderId: order._id,
      })
        .populate(
          "productId"
        )
        .populate(
          "dealId",
          "nameEn nameUr"
        )
        .lean();

    const timeline =
      await OrderTimeline.find({
        orderId: order._id,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,

      data: {
        order,
        items,
        timeline,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET ALL ORDERS - ADMIN
// ============================================================

const getAllOrders = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      customerId,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (customerId) {
      filter.customerId =
        customerId;
    }

    const skip =
      (Number(page) - 1) *
      Number(limit);

    const orders =
      await Order.find(filter)
        .populate(
          "customerId",
          "firstName lastName phone email"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(Number(limit))
        .lean();

    const total =
      await Order.countDocuments(
        filter
      );

    return res.status(200).json({
      success: true,

      data: orders,

      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(
          total / Number(limit)
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET ADMIN ORDER DETAIL
// ============================================================

const getOrderById = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const order =
      await Order.findById(id)
        .populate(
          "customerId",
          "firstName lastName phone email"
        )
        .populate(
          "addressId"
        )
        .populate(
          "deliverySlotId"
        )
        .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const items =
      await OrderItem.find({
        orderId: id,
      })
        .populate(
          "productId"
        )
        .populate(
          "dealId",
          "nameEn nameUr"
        )
        .lean();

    const timeline =
      await OrderTimeline.find({
        orderId: id,
      })
        .populate(
          "changedBy",
          "firstName lastName phone role"
        )
        .sort({
          createdAt: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,

      data: {
        order,
        items,
        timeline,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE ORDER STATUS
// ============================================================

const updateOrderStatus = async (
  req,
  res,
  next
) => {
  const session =
    await mongoose.startSession();

  try {
    const { id } =
      req.params;

    const {
      status,
      message,
      cancellationReason,
    } = req.body;

    const validStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Ready",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];
    if (
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    let updatedOrder;

    await session.withTransaction(
      async () => {
        const order =
          await Order.findById(id)
            .session(session);

        if (!order) {
          throw new Error(
            "Order not found"
          );
        }

        const oldStatus =
          order.status;

        // Don't create duplicate
        // timeline entry
        if (
          oldStatus === status
        ) {
          throw new Error(
            `Order is already ${status}`
          );
        }

        order.status =
          status;

        if (
          status === "Cancelled"
        ) {
          order.cancellationReason =
            cancellationReason ||
            "";
        }

        await order.save({
          session,
        });

        const title =
          getTimelineTitle(
            status
          );

        await OrderTimeline.create(
          [
            {
              orderId:
                order._id,

              status,

              title,

              message:
                message || "",

              changedBy:
                req.user.id,

              changedByType:
                req.user.role ===
                "admin"
                  ? "admin"
                  : "customer",
            },
          ],
          {
            session,
          }
        );

        updatedOrder =
          order;
      }
    );

    return res.status(200).json({
      success: true,

      message:
        "Order status updated successfully",

      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

// ============================================================
// TIMELINE TITLES
// ============================================================

const getTimelineTitle = (
  status
) => {
  switch (status) {
    case "Pending":
      return "Order placed";

    case "Confirmed":
      return "Order confirmed";

    case "Preparing":
      return "Order is being prepared";

    case "Ready":
      return "Order is ready";

    case "Out for Delivery":
      return "Out for Delivery";

    case "Delivered":
      return "Order delivered";

    case "Cancelled":
      return "Order cancelled";

    default:
      return "Order status updated";
  }
};

// ============================================================
// GET ORDER TIMELINE
// ============================================================

const getOrderTimeline = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const timeline =
      await OrderTimeline.find({
        orderId: id,
      })
        .populate(
          "changedBy",
          "firstName lastName role"
        )
        .sort({
          createdAt: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// DELETE ORDER - ADMIN
// ============================================================

const deleteOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    let deletedOrder;

    await session.withTransaction(async () => {
      // --------------------------------------------------------
      // FIND ORDER
      // --------------------------------------------------------

      const order = await Order.findById(id).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      // --------------------------------------------------------
      // DELETE ORDER TIMELINE
      // --------------------------------------------------------

      await OrderTimeline.deleteMany(
        {
          orderId: order._id,
        },
        {
          session,
        }
      );

      // --------------------------------------------------------
      // DELETE ORDER ITEMS
      // --------------------------------------------------------

      await OrderItem.deleteMany(
        {
          orderId: order._id,
        },
        {
          session,
        }
      );

      // --------------------------------------------------------
      // DELETE ORDER
      // --------------------------------------------------------

      await Order.deleteOne(
        {
          _id: order._id,
        },
        {
          session,
        }
      );

      deletedOrder = order;
    });

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      data: {
        orderId: deletedOrder._id,
        orderNumber: deletedOrder.orderNumber,
      },
    });
  } catch (error) {
    console.error("Delete order error:", error);
    next(error);
  } finally {
    await session.endSession();
  }
};
module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderTimeline,
  deleteOrder,
};