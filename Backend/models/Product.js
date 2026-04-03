const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: function() {
        return this.productType === 'buy' || this.productType === 'both';
      },
      min: 0,
    },
    rentPrice: {
      // Price per day for rental
      type: Number,
      required: function() {
        return this.productType === 'rent' || this.productType === 'both';
      },
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productType: {
      type: String,
      enum: ["buy", "rent", "both"],
      required: true,
    },
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", function (next) {
  if (this.ratings.length > 0) {
    this.averageRating = this.ratings.reduce(
      (acc, item) => item.rating + acc,
      0
    );
  }
  next();
});

// Add geospatial index
productSchema.index({ location: '2dsphere' });

module.exports = mongoose.model("Product", productSchema);
