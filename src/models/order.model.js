const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // =====================================================
    // ORDER INFORMATION
    // =====================================================

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // =====================================================
    // CUSTOMER
    // =====================================================

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =====================================================
    // CUSTOMER ADDRESS
    // =====================================================

    // ID of the address selected from the customer's
    // embedded addresses array.
    //
    // No "ref" is used because Address is not a
    // separate mongoose model.
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Address snapshot
    //
    // This is intentionally stored inside the order.
    // If the customer changes their address later,
    // the old order will still contain the original address.
    address: {
      label: {
        type: String,
        default: "",
        trim: true,
      },

      recipientName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      addressLine1: {
        type: String,
        required: true,
        trim: true,
      },

      addressLine2: {
        type: String,
        default: "",
        trim: true,
      },

      area: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        default: "",
        trim: true,
      },

      postalCode: {
        type: String,
        default: "",
        trim: true,
      },

      location: {
        type: String,
        default: "",
        trim: true,
      },

      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    // =====================================================
    // DELIVERY DAY
    // =====================================================

    // 0 = Sunday
    // 1 = Monday
    // 2 = Tuesday
    // 3 = Wednesday
    // 4 = Thursday
    // 5 = Friday
    // 6 = Saturday

    deliveryDay: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5, 6],
      required: true,
    },

    // =====================================================
    // DELIVERY SLOT
    // =====================================================

    // Reference to the original delivery slot
    deliverySlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliverySlot",
      required: true,
    },

    // Snapshot of the delivery slot
    //
    // If admin changes the slot later, the existing
    // order still shows the original selected time.
    deliverySlot: {
      startTime: {
        type: String,
        required: true,
        trim: true,
      },

      endTime: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // =====================================================
    // ORDER STATUS
    // =====================================================

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Ready",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    // =====================================================
    // PAYMENT
    // =====================================================

    paymentMethod: {
      type: String,
      enum: [
        "Cash on Delivery",
        "Card",
        "Stripe",
        "Paypal",
      ],
      default: "Cash on Delivery",
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
      ],
      default: "Pending",
    },

    // =====================================================
    // ORDER AMOUNTS
    // =====================================================

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryCharges: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // =====================================================
    // CUSTOMER NOTES
    // =====================================================

    customerNotes: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // CANCELLATION
    // =====================================================

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);