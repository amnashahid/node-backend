const mongoose = require("mongoose");

const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const OrderTimeline = require("../models/orderTimeline.model");
const Product = require("../models/product.model");
const Deal = require("../models/deal.model");
const DeliverySlot = require("../models/deliverySlot.model");
const User = require("../models/User");

// ============================================================
// GENERATE ORDER NUMBER
// ============================================================

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();

  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  return `ORD-${timestamp}-${random}`;
};

// ============================================================
// SAFE NUMBER
// ============================================================

const toSafeNumber = (
  value,
  defaultValue = 0
) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return defaultValue;
  }

  return number;
};

// ============================================================
// CREATE ORDER
// ============================================================

const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const {
      customerId,
      addressId,
      phone,
      name,
      deliverySlotId,
      items,
      total,
      subTotal,
      discount,
      paymentMethod,
      customerNotes,
      deliveryCharges,
    } = req.body;

    console.log(req.body)

    // ========================================================
    // BASIC VALIDATION
    // ========================================================

    if (
      !customerId ||
      !mongoose.Types.ObjectId.isValid(customerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customerId.",
      });
    }

    if (
      !addressId ||
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid addressId.",
      });
    }

    if (
      !deliverySlotId ||
      !mongoose.Types.ObjectId.isValid(
        deliverySlotId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid deliverySlotId.",
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item.",
      });
    }

    // ========================================================
    // CUSTOMER
    // ========================================================

    const customer = await User.findOne({
      _id: customerId,
      isActive: true,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found or inactive.",
      });
    }

    // ========================================================
    // ADDRESS
    // ========================================================

    const selectedAddress =
      customer.addresses?.find(
        (address) =>
          String(address._id) ===
          String(addressId)
      );

    if (!selectedAddress) {
      return res.status(404).json({
        success: false,
        message: "Selected address was not found.",
      });
    }

    // ========================================================
    // DELIVERY SLOT
    // ========================================================

    const deliverySlot =
      await DeliverySlot.findOne({
        _id: deliverySlotId,
        isActive: true,
      });

    if (!deliverySlot) {
      return res.status(404).json({
        success: false,
        message:
          "Delivery slot not found or inactive.",
      });
    }

    // ========================================================
    // DELIVERY CHARGES
    // ========================================================

    const safeDeliveryCharges =
      toSafeNumber(
        deliveryCharges,
        0
      );

    if (safeDeliveryCharges < 0) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery charges cannot be negative.",
      });
    }

    

    // // ========================================================
    // // PROCESS EACH ITEM
    // // ========================================================

    // for (const requestedItem of items) {
    //   if (!requestedItem) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Invalid order item.",
    //     });
    //   }

    //   const {
    //     productId,
    //     quantity,
    //     price,
    //     dealId,
    //   } = requestedItem;

    //   // ------------------------------------------------------
    //   // PRODUCT ID
    //   // ------------------------------------------------------

    //   if (
    //     !productId ||
    //     !mongoose.Types.ObjectId.isValid(
    //       productId
    //     )
    //   ) {
    //     return res.status(400).json({
    //       success: false,
    //       message: `Invalid productId: ${productId}`,
    //     });
    //   }

    //   // ------------------------------------------------------
    //   // QUANTITY
    //   // ------------------------------------------------------

    //   const itemQuantity =
    //     Number(quantity);

    //   if (
    //     !Number.isFinite(itemQuantity) ||
    //     itemQuantity < 1 ||
    //     !Number.isInteger(itemQuantity)
    //   ) {
    //     return res.status(400).json({
    //       success: false,
    //       message: `Invalid quantity for product ${productId}.`,
    //     });
    //   }

    //   // ------------------------------------------------------
    //   // UNIT PRICE
    //   // ------------------------------------------------------

    //   const unitPrice =
    //     Number(price);


    //   if (
    //     !Number.isFinite(unitPrice) ||
    //     unitPrice < 0
    //   ) {
    //     return res.status(400).json({
    //       success: false,
    //       message:
    //         `Invalid unit price for product ${productId}. ` +
    //         `Received: ${price}`,
    //     });
    //   }

    //   // ------------------------------------------------------
    //   // PRODUCT
    //   // ------------------------------------------------------

    //   const product =
    //     await Product.findOne({
    //       _id: productId,
    //       isActive: true,
    //     });

    //   if (!product) {
    //     return res.status(404).json({
    //       success: false,
    //       message:
    //         `Product ${productId} not found or inactive.`,
    //     });
    //   }

    //   // ------------------------------------------------------
    //   // ITEM TOTAL
    //   // ------------------------------------------------------

    //   const itemTotal =
    //     unitPrice * itemQuantity;

    //   if (
    //     !Number.isFinite(itemTotal) ||
    //     itemTotal < 0
    //   ) {
    //     return res.status(400).json({
    //       success: false,
    //       message:
    //         `Unable to calculate total for product ${productId}.`,
    //     });
    //   }

    //   // ======================================================
    //   // NORMAL PRODUCT
    //   // ======================================================

    //   if (!dealId) {
    //     const regularPrice =
    //       toSafeNumber(
    //         product.price,
    //         unitPrice
    //       );

    //     // Calculate discount from the actual
    //     // price being charged.
    //     if (
    //       regularPrice > unitPrice
    //     ) {
    //       discount +=
    //         (regularPrice - unitPrice) *
    //         itemQuantity;
    //     }

    //     orderItemsData.push({
    //       productId:
    //         product._id,

    //       dealId: null,

    //       quantity:
    //         itemQuantity,

    //       unitPrice,

    //       totalPrice:
    //         itemTotal,

    //       dealPrice: null,
    //     });

    //     subtotal += itemTotal;

    //     continue;
    //   }

    //   // ======================================================
    //   // DEAL VALIDATION
    //   // ======================================================

    //   if (
    //     !mongoose.Types.ObjectId.isValid(
    //       dealId
    //     )
    //   ) {
    //     return res.status(400).json({
    //       success: false,
    //       message:
    //         `Invalid dealId: ${dealId}`,
    //     });
    //   }

    //   const deal =
    //     await Deal.findOne({
    //       _id: dealId,
    //       isActive: true,
    //     });

    //   if (!deal) {
    //     return res.status(404).json({
    //       success: false,
    //       message:
    //         `Deal ${dealId} not found or inactive.`,
    //     });
    //   }

    //   // ------------------------------------------------------
    //   // FIND PRODUCT INSIDE DEAL
    //   // ------------------------------------------------------

    //   let dealProduct = null;

    //   if (Array.isArray(deal.products)) {
    //     dealProduct =
    //       deal.products.find(
    //         (dealItem) =>
    //           String(
    //             dealItem.productId
    //           ) ===
    //           String(product._id)
    //       );
    //   }

    //   if (!dealProduct) {
    //     return res.status(400).json({
    //       success: false,
    //       message:
    //         `Product ${productId} does not belong to deal ${dealId}.`,
    //     });
    //   }

    //   // ------------------------------------------------------
    //   // DEAL PRICE
    //   // ------------------------------------------------------

    //   const dealPrice =
    //     toSafeNumber(
    //       dealProduct.dealPrice ??
    //         dealProduct.price ??
    //         unitPrice,
    //       unitPrice
    //     );

    //   if (
    //     !Number.isFinite(dealPrice) ||
    //     dealPrice < 0
    //   ) {
    //     return res.status(400).json({
    //       success: false,
    //       message:
    //         `Invalid deal price for product ${productId}.`,
    //     });
    //   }

    //   // ------------------------------------------------------
    //   // DEAL DISCOUNT
    //   // ------------------------------------------------------

    //   const regularPrice =
    //     toSafeNumber(
    //       product.price,
    //       unitPrice
    //     );

    //   if (
    //     regularPrice > unitPrice
    //   ) {
    //     discount +=
    //       (regularPrice - unitPrice) *
    //       itemQuantity;
    //   }

    //   // ------------------------------------------------------
    //   // ADD DEAL ITEM
    //   // ------------------------------------------------------

    //   orderItemsData.push({
    //     productId:
    //       product._id,

    //     dealId:
    //       deal._id,

    //     quantity:
    //       itemQuantity,

    //     unitPrice,

    //     totalPrice:
    //       itemTotal,

    //     dealPrice,
    //   });

    //   subtotal += itemTotal;
    // }

    // ========================================================
    // NORMALIZE SUBTOTAL
    // ========================================================

    // subtotal = Number(
    //   subtotal.toFixed(2)
    // );

    // discount = Number(
    //   discount.toFixed(2)
    // );

    // ========================================================
    // FINAL TOTAL
    // ========================================================

    // const calculatedTotal =
    //   subtotal -
    //   discount +
    //   safeDeliveryCharges;

    // const total = Number(
    //   Math.max(
    //     calculatedTotal,
    //     0
    //   ).toFixed(2)
    // );

    // ========================================================
    // FINAL NUMBER VALIDATION
    // ========================================================

    // if (
    //   !Number.isFinite(subtotal)
    // ) {
    //   return res.status(400).json({
    //     success: false,
    //     message:
    //       "Invalid subtotal calculation.",
    //   });
    // }

    if (
      !Number.isFinite(discount)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid discount calculation.",
      });
    }

    if (
      !Number.isFinite(
        safeDeliveryCharges
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid delivery charges.",
      });
    }

    if (
      !Number.isFinite(total)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid total calculation.",
      });
    }

    // ========================================================
    // START TRANSACTION
    // ========================================================

    session.startTransaction();

    // ========================================================
    // CREATE ORDER
    // ========================================================

    const orderNumber =
      generateOrderNumber();




    const order =
      new Order({
        orderNumber,

        customerId,

        addressId,

        // Address snapshot
        address: {
          label:
            selectedAddress.label ||
            "",

          recipientName: name,
            //selectedAddress.recipientName,

          phone: phone,

          addressLine1:
            selectedAddress.address,


          area:
            selectedAddress.area ||
            "",

          city:
            selectedAddress.city ||
            "",

          postalCode:
            selectedAddress.postalCode ||
            "",

          location:
            selectedAddress.location ||
            "",

          latitude:
            selectedAddress.latitude ??
            null,

          longitude:
            selectedAddress.longitude ??
            null,
        },

        // Delivery
        deliveryDay:
          deliverySlot.dayOfWeek,

        deliverySlotId:
          deliverySlot._id,

        deliverySlot: {
          startTime:
            deliverySlot.startTime,

          endTime:
            deliverySlot.endTime,
        },

        status: "Pending",

        paymentMethod:
          paymentMethod ||
          "Cash on Delivery",

        paymentStatus: "Pending",

        subTotal,

        discount,
        total,

        deliveryCharges:
          safeDeliveryCharges,

        total,

        customerNotes:
          customerNotes || "",

        cancellationReason: "",
      });

    await order.save({
      session,
    });

    // ========================================================
    // CREATE ORDER ITEMS
    // ========================================================
    
          let orderItems = [];
    for (const requestedItem of items) {
      if (!requestedItem) {
        return res.status(400).json({
          success: false,
          message: "Invalid order item.",
        });
      }
    orderItems.push({
      orderId: order._id,
      quantity: requestedItem.quantity,
      unitPrice: requestedItem.unitPrice,
      dealId: requestedItem.dealId,
      dealPrice: requestedItem.dealPrice,
      productId: requestedItem.productId,
      totalPrice: requestedItem.quantity * requestedItem.unitPrice,
    })
    }

    await OrderItem.insertMany(
      orderItems,
      {
        session,
      }
    );

    // ========================================================
    // CREATE INITIAL TIMELINE
    // ========================================================

    await OrderTimeline.create(
      [
        {
          orderId:order._id,

          status: "Pending",

          note:
            "Order placed successfully.",
        },
      ],
      {
        session,
      }
    );

    // ========================================================
    // COMMIT
    // ========================================================

    await session.commitTransaction();

    // ========================================================
    // FETCH COMPLETE ORDER
    // ========================================================

    const createdOrder =
      await Order.findById(
        order._id
      )
        .populate(
          "customerId",
          "name email phone"
        )
        .populate(
          "deliverySlotId"
        )
        .lean();

    const createdOrderItems =
      await OrderItem.find({
        orderId:
          order._id,
      })
        .populate(
          "productId"
        )
        .populate(
          "dealId"
        )
        .lean();

    const timeline =
      await OrderTimeline.find({
        orderId:
          order._id,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,
      message:
        "Order created successfully.",
      data: {
        order:
          createdOrder,

        items:
          createdOrderItems,

        timeline,
      },
    });
  } catch (error) {
    // ========================================================
    // ABORT TRANSACTION
    // ========================================================

    if (
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    console.error(
      "CREATE ORDER ERROR:",
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
    const {
      customerId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        customerId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid customerId.",
      });
    }

    const orders =
      await Order.find({
        customerId,
      })
        .populate(
          "deliverySlotId"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    const orderIds =
      orders.map(
        (order) => order._id
      );

    const orderItems =
      await OrderItem.find({
        orderId: {
          $in: orderIds,
        },
      })
        .populate(
          "productId"
        )
        .populate(
          "dealId"
        )
        .lean();

    const timelines =
      await OrderTimeline.find({
        orderId: {
          $in: orderIds,
        },
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    const data =
      orders.map((order) => ({
        ...order,

        items:
          orderItems.filter(
            (item) =>
              String(
                item.orderId
              ) ===
              String(order._id)
          ),

        timeline:
          timelines.filter(
            (timeline) =>
              String(
                timeline.orderId
              ) ===
              String(order._id)
          ),
      }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
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
    const {
      customerId,
      orderId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        customerId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid customerId.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid orderId.",
      });
    }

    const order =
      await Order.findOne({
        _id: orderId,
        customerId,
      })
        .populate(
          "customerId",
          "name email phone"
        )
        .populate(
          "deliverySlotId"
        )
        .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    const items =
      await OrderItem.find({
        orderId:
          order._id,
      })
        .populate(
          "productId"
        )
        .populate(
          "dealId"
        )
        .lean();

    const timeline =
      await OrderTimeline.find({
        orderId:
          order._id,
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
// GET ALL ORDERS
// ============================================================

const getAllOrders = async (
  req,
  res,
  next
) => {
  try {
    const orders =
      await Order.find()
        .populate(
          "customerId",
          "name  phone"
        )
        .populate(
          "deliverySlotId"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    const orderIds =
      orders.map(
        (order) => order._id
      );

    const items =
      await OrderItem.find({
        orderId: {
          $in: orderIds,
        },
      })
        .populate(
          "productId"
        )
        .populate(
          "dealId"
        )
        .lean();

    const timelines =
      await OrderTimeline.find({
        orderId: {
          $in: orderIds,
        },
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    const data =
      orders.map((order) => ({
        ...order,

        items:
          items.filter(
            (item) =>
              String(
                item.orderId
              ) ===
              String(order._id)
          ),

        timeline:
          timelines.filter(
            (timeline) =>
              String(
                timeline.orderId
              ) ===
              String(order._id)
          ),
      }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET ORDER BY ID
// ============================================================

const getOrderById = async (
  req,
  res,
  next
) => {
  try {
    const {
      orderId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid orderId.",
      });
    }

    const order =
      await Order.findById(
        orderId
      )
        .populate(
          "customerId",
          "name email phone"
        )
        .populate(
          "deliverySlotId"
        )
        .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    const items =
      await OrderItem.find({
        orderId:
          order._id,
      })
        .populate(
          "productId"
        )
        .populate(
          "dealId"
        )
        .lean();

    const timeline =
      await OrderTimeline.find({
        orderId:
          order._id,
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
    const {
      orderId,
    } = req.params;

    const {
      status,
      note,
    } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Ready",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid orderId.",
      });
    }

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status.",
      });
    }

    session.startTransaction();

    const order =
      await Order.findById(
        orderId
      ).session(session);

    if (!order) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    order.status = status;

    if (status === "Cancelled") {
      order.cancellationReason =
        note || "";
    }

    await order.save({
      session,
    });

    await OrderTimeline.create(
      [
        {
          orderId:
            order._id,

          status,

          note:
            note ||
            `Order status changed to ${status}.`,
        },
      ],
      {
        session,
      }
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully.",
      data: order,
    });
  } catch (error) {
    if (
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    next(error);
  } finally {
    await session.endSession();
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
    const {
      orderId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid orderId.",
      });
    }

    const order =
      await Order.findById(
        orderId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    const timeline =
      await OrderTimeline.find({
        orderId,
      }).sort({
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      count: timeline.length,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE ORDER
// ============================================================

const deleteOrder = async (
  req,
  res,
  next
) => {
  const session =
    await mongoose.startSession();

  try {
    const {
      orderId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid orderId.",
      });
    }

    session.startTransaction();

    const order =
      await Order.findById(
        orderId
      ).session(session);

    if (!order) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    await OrderItem.deleteMany(
      {
        orderId:
          order._id,
      },
      {
        session,
      }
    );

    await OrderTimeline.deleteMany(
      {
        orderId:
          order._id,
      },
      {
        session,
      }
    );

    await Order.deleteOne(
      {
        _id:
          order._id,
      },
      {
        session,
      }
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message:
        "Order deleted successfully.",
    });
  } catch (error) {
    if (
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    next(error);
  } finally {
    await session.endSession();
  }
};

// ============================================================
// EXPORTS
// ============================================================

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