const Rental = require("../models/Rental");
const Product = require("../models/Product");
const User = require("../models/User");

/** Days billed per unit of duration. Also used to derive the end date, so the
 *  price a renter is quoted always matches the period they actually get. */
const DAYS_PER_UNIT = { day: 1, week: 7, month: 30 };

const rentalController = {
  // Create a new rental
  createRental: async (req, res) => {
    try {
      const {
        productId,
        durationValue,
        durationUnit,
        startDate,
        paymentMethod,
        shippingAddress,
        notes,
      } = req.body;
      const userId = req.user.id;

      // Validate duration unit
      if (!DAYS_PER_UNIT[durationUnit]) {
        return res.status(400).json({
          success: false,
          message: "Invalid duration unit. Must be day, week, or month",
        });
      }

      const duration = Number(durationValue);
      if (!Number.isInteger(duration) || duration < 1 || duration > 365) {
        return res.status(400).json({
          success: false,
          message: "Duration must be a whole number between 1 and 365",
        });
      }

      const product = await Product.findById(productId).populate("seller");
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Buy-only listings have no rentPrice, which used to produce a rental
      // with a NaN total that failed validation with an unhelpful message.
      if (product.productType !== "rent" && product.productType !== "both") {
        return res.status(400).json({
          success: false,
          message: "This product is not available for rent",
        });
      }

      if (typeof product.rentPrice !== "number" || product.rentPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "This product has no valid rental price",
        });
      }

      if (product.seller._id.toString() === userId) {
        return res.status(400).json({
          success: false,
          message: "You cannot rent your own product",
        });
      }

      const start = new Date(startDate || Date.now());
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }

      // Allow today, but not a date in the past.
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (start < startOfToday) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be in the past",
        });
      }

      // End date and price are both derived from the same day count, so a
      // one-month rental is billed for exactly the 30 days it is held. The old
      // code advanced the calendar month but charged a flat 30 days.
      const totalDays = duration * DAYS_PER_UNIT[durationUnit];
      const endDate = new Date(start);
      endDate.setDate(start.getDate() + totalDays);

      const totalPrice = product.rentPrice * totalDays;

      // Conditional decrement so two renters cannot claim the last unit.
      const claimed = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: 1 } },
        { $inc: { stock: -1 } },
        { new: true }
      );

      if (!claimed) {
        return res.status(400).json({
          success: false,
          message: "Product is currently out of stock",
        });
      }

      try {
        const rental = new Rental({
          product: productId,
          user: userId,
          seller: product.seller._id,
          startDate: start,
          endDate: endDate,
          duration: {
            value: duration,
            unit: durationUnit,
          },
          totalPrice: totalPrice,
          paymentMethod: paymentMethod || "online",
          shippingAddress: shippingAddress || {},
          notes: notes || "",
        });

        await rental.save();

        res.status(201).json({
          success: true,
          message: "Rental created successfully",
          rental: rental,
        });
      } catch (saveError) {
        // Put the unit back if the rental itself could not be persisted.
        await Product.findByIdAndUpdate(product._id, { $inc: { stock: 1 } });
        throw saveError;
      }
    } catch (error) {
      console.error("Error creating rental:", error);
      res.status(500).json({
        success: false,
        message: "Error creating rental",
        error: error.message,
      });
    }
  },

  // Get user's rentals (as renter)
  getUserRentals: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      let query = { user: userId };
      if (status) {
        query.status = status;
      }

      const rentals = await Rental.find(query)
        .populate({
          path: "product",
          select: "name description image rentPrice category",
        })
        .populate({
          path: "seller",
          select: "name email phone",
        })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: "Rentals retrieved successfully",
        rentals: rentals,
      });
    } catch (error) {
      console.error("Error fetching user rentals:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching rentals",
        error: error.message,
      });
    }
  },

  // Get received rentals (as seller)
  getReceivedRentals: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      let query = { seller: userId };
      if (status) {
        query.status = status;
      }

      const rentals = await Rental.find(query)
        .populate({
          path: "product",
          select: "name description image rentPrice category",
        })
        .populate({
          path: "user",
          select: "name email phone",
        })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: "Received rentals retrieved successfully",
        rentals: rentals,
      });
    } catch (error) {
      console.error("Error fetching received rentals:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching received rentals",
        error: error.message,
      });
    }
  },

  // Get rental by ID
  getRentalById: async (req, res) => {
    try {
      const { rentalId } = req.params;
      const userId = req.user.id;

      const rental = await Rental.findById(rentalId)
        .populate({
          path: "product",
          select: "name description image rentPrice category",
        })
        .populate({
          path: "user",
          select: "name email phone",
        })
        .populate({
          path: "seller",
          select: "name email phone",
        });

      if (!rental) {
        return res.status(404).json({
          success: false,
          message: "Rental not found",
        });
      }

      // Check if user is authorized to view this rental
      if (
        rental.user._id.toString() !== userId &&
        rental.seller._id.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this rental",
        });
      }

      res.status(200).json({
        success: true,
        message: "Rental retrieved successfully",
        rental: rental,
      });
    } catch (error) {
      console.error("Error fetching rental:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching rental",
        error: error.message,
      });
    }
  },

  // Update rental status (seller only)
  updateRentalStatus: async (req, res) => {
    try {
      const { rentalId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const rental = await Rental.findById(rentalId);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: "Rental not found",
        });
      }

      // Check if user is the seller
      if (rental.seller.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only the seller can update rental status",
        });
      }

      // Validate status
      const validStatuses = ["pending", "active", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      // Only allow sensible transitions. Without this a seller could flip a
      // completed rental back to active and return the unit to stock twice.
      const transitions = {
        pending: ["active", "cancelled"],
        active: ["completed", "cancelled", "overdue"],
        overdue: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };

      if (rental.status === status) {
        return res.status(200).json({
          success: true,
          message: "Rental status unchanged",
          rental,
        });
      }

      if (!transitions[rental.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change a ${rental.status} rental to ${status}`,
        });
      }

      const wasReserved = ["pending", "active", "overdue"].includes(rental.status);

      rental.status = status;

      // The unit goes back to the seller whether the rental ended normally or
      // was cancelled — the old code only handled "completed".
      if ((status === "completed" || status === "cancelled") && wasReserved) {
        await Product.findByIdAndUpdate(rental.product, { $inc: { stock: 1 } });
        rental.returnedAt = new Date();

        if (status === "completed") {
          rental.lateFees = rental.calculateLateFees();
        }
      }

      await rental.save();

      res.status(200).json({
        success: true,
        message: "Rental status updated successfully",
        rental: rental,
      });
    } catch (error) {
      console.error("Error updating rental status:", error);
      res.status(500).json({
        success: false,
        message: "Error updating rental status",
        error: error.message,
      });
    }
  },

  // Extend rental duration
  extendRental: async (req, res) => {
    try {
      const { rentalId } = req.params;
      const { additionalDuration, durationUnit } = req.body;
      const userId = req.user.id;

      const rental = await Rental.findById(rentalId);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: "Rental not found",
        });
      }

      // Check if user is the renter
      if (rental.user.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only the renter can extend rental",
        });
      }

      if (rental.status !== "active" && rental.status !== "overdue") {
        return res.status(400).json({
          success: false,
          message: "Can only extend active rentals",
        });
      }

      if (!DAYS_PER_UNIT[durationUnit]) {
        return res.status(400).json({
          success: false,
          message: "Invalid duration unit. Must be day, week, or month",
        });
      }

      const extra = Number(additionalDuration);
      if (!Number.isInteger(extra) || extra < 1 || extra > 365) {
        return res.status(400).json({
          success: false,
          message: "Extension must be a whole number between 1 and 365",
        });
      }

      const product = await Product.findById(rental.product);
      if (!product || typeof product.rentPrice !== "number") {
        return res.status(404).json({
          success: false,
          message: "Product is no longer available for rent",
        });
      }

      // Same day-count basis as createRental, so extending by a month costs
      // the same as renting for a month.
      const extraDays = extra * DAYS_PER_UNIT[durationUnit];
      const newEndDate = new Date(rental.endDate);
      newEndDate.setDate(newEndDate.getDate() + extraDays);

      rental.endDate = newEndDate;
      rental.totalPrice += product.rentPrice * extraDays;

      // duration.value counts units of duration.unit; adding a week's worth of
      // days to a rental booked in days would otherwise corrupt the figure.
      rental.duration.value += Math.round(
        extraDays / DAYS_PER_UNIT[rental.duration.unit]
      );

      if (rental.status === "overdue") {
        rental.status = "active";
      }

      await rental.save();

      res.status(200).json({
        success: true,
        message: "Rental extended successfully",
        rental: rental,
      });
    } catch (error) {
      console.error("Error extending rental:", error);
      res.status(500).json({
        success: false,
        message: "Error extending rental",
        error: error.message,
      });
    }
  },

  // Cancel rental
  cancelRental: async (req, res) => {
    try {
      const { rentalId } = req.params;
      const userId = req.user.id;

      const rental = await Rental.findById(rentalId);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: "Rental not found",
        });
      }

      // Check if user is authorized (renter or seller)
      if (
        rental.user.toString() !== userId &&
        rental.seller.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to cancel this rental",
        });
      }

      if (rental.status === "completed" || rental.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel completed or already cancelled rental",
        });
      }

      // The unit must be read *before* the status is overwritten. Previously
      // `rental.status = "cancelled"` ran first and the following
      // `if (rental.status === "pending")` could never be true, so cancelling
      // a rental permanently lost a unit of the seller's stock.
      const wasReserved = rental.status === "pending" || rental.status === "active";

      rental.status = "cancelled";

      if (wasReserved) {
        await Product.findByIdAndUpdate(rental.product, {
          $inc: { stock: 1 },
        });
        rental.returnedAt = new Date();
      }

      await rental.save();

      res.status(200).json({
        success: true,
        message: "Rental cancelled successfully",
        rental: rental,
      });
    } catch (error) {
      console.error("Error cancelling rental:", error);
      res.status(500).json({
        success: false,
        message: "Error cancelling rental",
        error: error.message,
      });
    }
  },

  // Complete rental (mark as returned)
  completeRental: async (req, res) => {
    try {
      const { rentalId } = req.params;
      const userId = req.user.id;

      const rental = await Rental.findById(rentalId);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: "Rental not found",
        });
      }

      // Check if user is the seller
      if (rental.seller.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only the seller can complete rental",
        });
      }

      if (rental.status !== "active" && rental.status !== "overdue") {
        return res.status(400).json({
          success: false,
          message: "Can only complete active rentals",
        });
      }

      rental.lateFees = rental.calculateLateFees();
      rental.status = "completed";
      rental.returnedAt = new Date();

      // Return product to stock
      await Product.findByIdAndUpdate(rental.product, { $inc: { stock: 1 } });

      await rental.save();

      res.status(200).json({
        success: true,
        message: "Rental completed successfully",
        rental: rental,
      });
    } catch (error) {
      console.error("Error completing rental:", error);
      res.status(500).json({
        success: false,
        message: "Error completing rental",
        error: error.message,
      });
    }
  },
};

module.exports = { rentalController };
