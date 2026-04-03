const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ["day", "week", "month"],
        required: true,
      },
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled", "overdue"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["online", "cash", "bank_transfer"],
      required: true,
    },
    transactionId: {
      type: String,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    notes: {
      type: String,
    },
    returnedAt: {
      type: Date,
    },
    lateFees: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
rentalSchema.index({ user: 1, status: 1 });
rentalSchema.index({ seller: 1, status: 1 });
rentalSchema.index({ startDate: 1, endDate: 1 });

// Virtual for calculating if rental is overdue
rentalSchema.virtual("isOverdue").get(function () {
  if (this.status === "active" && new Date() > this.endDate) {
    return true;
  }
  return false;
});

// Virtual for calculating remaining days
rentalSchema.virtual("remainingDays").get(function () {
  if (this.status === "active") {
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  return 0;
});

// Method to calculate late fees
rentalSchema.methods.calculateLateFees = function () {
  if (this.status === "active" && new Date() > this.endDate) {
    const daysLate = Math.ceil(
      (new Date() - this.endDate) / (1000 * 60 * 60 * 24)
    );
    const dailyRate = this.totalPrice / this.duration.value;
    return daysLate * dailyRate * 0.1; // 10% daily late fee
  }
  return 0;
};

module.exports = mongoose.model("Rental", rentalSchema);
