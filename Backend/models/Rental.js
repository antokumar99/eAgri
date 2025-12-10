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
      unique: true,
      sparse: true,
    },
    sslcommerzValId: {
      type: String,
    },
    paidAt: {
      type: Date,
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
    // Without these the isOverdue / remainingDays virtuals below were computed
    // but never reached the API response.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient queries
rentalSchema.index({ user: 1, status: 1 });
rentalSchema.index({ seller: 1, status: 1 });
rentalSchema.index({ startDate: 1, endDate: 1 });

// Virtual for calculating if rental is overdue
const ACTIVE_STATUSES = ["active", "overdue"];

rentalSchema.virtual("isOverdue").get(function () {
  return ACTIVE_STATUSES.includes(this.status) && new Date() > this.endDate;
});

// Virtual for calculating remaining days
rentalSchema.virtual("remainingDays").get(function () {
  if (!ACTIVE_STATUSES.includes(this.status)) return 0;
  const diffDays = Math.ceil(
    (new Date(this.endDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, diffDays);
});

// Method to calculate late fees
rentalSchema.methods.calculateLateFees = function () {
  const reference = this.returnedAt || new Date();
  if (reference <= this.endDate) return 0;

  const daysLate = Math.ceil(
    (reference - this.endDate) / (1000 * 60 * 60 * 24)
  );

  // Charge against the daily rate, not totalPrice/duration.value — for a
  // rental booked in weeks or months the latter is the price of a whole
  // week or month, which inflated the fee by 7x or 30x.
  const totalDays = Math.max(
    1,
    Math.round((this.endDate - this.startDate) / (1000 * 60 * 60 * 24))
  );
  const dailyRate = this.totalPrice / totalDays;

  return Math.round(daysLate * dailyRate * 0.1 * 100) / 100; // 10% daily late fee
};

module.exports = mongoose.model("Rental", rentalSchema);
