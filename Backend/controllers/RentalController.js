const Rental = require("../models/Rental");
const Product = require("../models/Product");

const rentalController = {
  createRental: async (req, res) => {
    try {
      const { productId, duration } = req.body;
      const userId = req.user.id;

      const product = await Product.findById(productId);
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

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
      const totalPrice = product.rentPrice * duration;

      const rental = new Rental({
        product: productId,
        user: userId,
        startTime,
        endTime,
        duration,
        totalPrice,
      });

      // Decrease product stock
      product.stock -= 1;

      await Promise.all([rental.save(), product.save()]);

      res.status(201).json({
        success: true,
        rental,
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

  getUserRentals: async (req, res) => {
    try {
      const rentals = await Rental.find({
        user: req.user.id,
        status: "active",
      }).populate("product");

      res.status(200).json({
        success: true,
        rentals,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching rentals",
        error: error.message,
      });
    }
  },

  completeRental: async (req, res) => {
    try {
      const rental = await Rental.findById(req.params.id);

      if (!rental) {
        return res.status(404).json({
          success: false,
          message: "Rental not found",
        });
      }

      if (rental.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized",
        });
      }

      rental.status = "completed";

      // Increase product stock
      const product = await Product.findById(rental.product);
      product.stock += 1;

      await Promise.all([rental.save(), product.save()]);

      res.status(200).json({
        success: true,
        message: "Rental completed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error completing rental",
        error: error.message,
      });
    }
  },
};

module.exports = { rentalController };
