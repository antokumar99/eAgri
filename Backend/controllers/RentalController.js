const Rental = require("../models/Rental");
const Product = require("../models/Product");
const User = require("../models/User");

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

      const product = await Product.findById(productId).populate("seller");
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.stock < 1) {
        return res.status(400).json({
          success: false,
          message: "Product out of stock",
        });
      }

      // Validate duration unit
      if (!["day", "week", "month"].includes(durationUnit)) {
        return res.status(400).json({
          success: false,
          message: "Invalid duration unit. Must be day, week, or month",
        });
      }

      // Calculate end date based on duration
      const start = new Date(startDate || new Date());
      let endDate = new Date(start);

      switch (durationUnit) {
        case "day":
          endDate.setDate(start.getDate() + durationValue);
          break;
        case "week":
          endDate.setDate(start.getDate() + durationValue * 7);
          break;
        case "month":
          endDate.setMonth(start.getMonth() + durationValue);
          break;
      }

      // Calculate total price
      let totalPrice = 0;
      switch (durationUnit) {
        case "day":
          totalPrice = product.rentPrice * durationValue;
          break;
        case "week":
          totalPrice = product.rentPrice * durationValue * 7;
          break;
        case "month":
          totalPrice = product.rentPrice * durationValue * 30;
          break;
      }

      const rental = new Rental({
        product: productId,
        user: userId,
        seller: product.seller._id,
        startDate: start,
        endDate: endDate,
        duration: {
          value: durationValue,
          unit: durationUnit,
        },
        totalPrice: totalPrice,
        paymentMethod: paymentMethod || "online",
        shippingAddress: shippingAddress || {},
        notes: notes || "",
      });

      // Decrease product stock
      product.stock -= 1;

      await Promise.all([rental.save(), product.save()]);

      res.status(201).json({
        success: true,
        message: "Rental created successfully",
        rental: rental,
      });
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

      rental.status = status;

      // If completing rental, update product stock
      if (status === "completed") {
        const product = await Product.findById(rental.product);
        if (product) {
          product.stock += 1;
          await product.save();
        }
        rental.returnedAt = new Date();
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

      if (rental.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Can only extend active rentals",
        });
      }

      // Calculate new end date
      let newEndDate = new Date(rental.endDate);
      switch (durationUnit) {
        case "day":
          newEndDate.setDate(newEndDate.getDate() + additionalDuration);
          break;
        case "week":
          newEndDate.setDate(newEndDate.getDate() + additionalDuration * 7);
          break;
        case "month":
          newEndDate.setMonth(newEndDate.getMonth() + additionalDuration);
          break;
      }

      // Calculate additional cost
      const product = await Product.findById(rental.product);
      let additionalCost = 0;
      switch (durationUnit) {
        case "day":
          additionalCost = product.rentPrice * additionalDuration;
          break;
        case "week":
          additionalCost = product.rentPrice * additionalDuration * 7;
          break;
        case "month":
          additionalCost = product.rentPrice * additionalDuration * 30;
          break;
      }

      rental.endDate = newEndDate;
      rental.totalPrice += additionalCost;
      rental.duration.value += additionalDuration;

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

      rental.status = "cancelled";

      // Return product to stock if not yet started
      if (rental.status === "pending") {
        const product = await Product.findById(rental.product);
        if (product) {
          product.stock += 1;
          await product.save();
        }
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

      if (rental.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Can only complete active rentals",
        });
      }

      rental.status = "completed";
      rental.returnedAt = new Date();

      // Return product to stock
      const product = await Product.findById(rental.product);
      if (product) {
        product.stock += 1;
        await product.save();
      }

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
