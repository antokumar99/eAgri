const Product = require("../models/Product");
const { uploadImage } = require("../utils/cloudinary");
const { deleteImage } = require("../utils/cloudinary");
const fs = require("fs");

const productController = {
  createProduct: async (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Request file:", req.file);

      const {
        name,
        description,
        price,
        rentPrice,
        category,
        stock,
        productType,
      } = req.body;

      const seller = req.user.id;

      // Handle image upload
      let imageUrl = "";
      if (req.file) {
        try {
          const result = await uploadImage(req.file.path);
          imageUrl = result.url;
          // Clean up the temporary file
          fs.unlinkSync(req.file.path);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          return res.status(500).json({
            success: false,
            message: "Error uploading image",
            error: uploadError.message,
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Product image is required",
        });
      }

      // Validate required fields
      if (!name || !description || !category || !stock || !productType) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Create product data object
      const productData = {
        name,
        description,
        category,
        stock: parseInt(stock),
        image: imageUrl,
        seller,
        productType,
      };

      // Add prices based on product type
      if (productType === "buy" || productType === "both") {
        if (!price) {
          return res.status(400).json({
            success: false,
            message: "Price is required for buyable products",
          });
        }
        productData.price = parseFloat(price);
      }

      if (productType === "rent" || productType === "both") {
        if (!rentPrice) {
          return res.status(400).json({
            success: false,
            message: "Rent price is required for rentable products",
          });
        }
        productData.rentPrice = parseFloat(rentPrice);
      }

      // Add location if provided
      if (req.body.location) {
        productData.location = JSON.parse(req.body.location);
      }

      const newProduct = new Product(productData);
      await newProduct.save();

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: newProduct,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({
        success: false,
        message: "Error creating product",
        error: error.message,
      });
    }
  },

  // Get all products
  getAllProducts: async (req, res) => {
    try {
      const { type } = req.query;
      let query = {};

      if (type) {
        if (Array.isArray(type)) {
          query.productType = { $in: type };
        } else {
          query.productType = type;
        }
      }

      const products = await Product.find(query)
        .populate("seller", "name email")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching products",
        error: error.message,
      });
    }
  },

  // Get single product by ID
  getProductById: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id)
        .populate("seller", "name email")
        .populate("ratings.user", "name");

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching product",
        error: error.message,
      });
    }
  },

  // Update product
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        price,
        rentPrice,
        category,
        stock,
        productType,
      } = req.body;

      // Validate product ID
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if user owns the product
      if (product.seller.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this product",
        });
      }

      // Handle new image if uploaded
      let imageUrl = product.image;
      if (req.file) {
        try {
          const result = await uploadImage(req.file.path);
          imageUrl = result.url;
          fs.unlinkSync(req.file.path);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          return res.status(500).json({
            success: false,
            message: "Error uploading image",
            error: uploadError.message,
          });
        }
      }

      // Create update data object
      const updateData = {
        name,
        description,
        category,
        stock: parseInt(stock),
        image: imageUrl,
        productType,
      };

      // Add prices based on product type
      if (productType === "buy" || productType === "both") {
        if (!price) {
          return res.status(400).json({
            success: false,
            message: "Price is required for buyable products",
          });
        }
        updateData.price = parseFloat(price);
      }

      if (productType === "rent" || productType === "both") {
        if (!rentPrice) {
          return res.status(400).json({
            success: false,
            message: "Rent price is required for rentable products",
          });
        }
        updateData.rentPrice = parseFloat(rentPrice);
      }

      const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
      }).populate("seller", "name email");

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        success: false,
        message: "Error updating product",
        error: error.message,
      });
    }
  },

  // Delete product
  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if user is the seller
      if (product.seller.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this product",
        });
      }

      // Delete image from Cloudinary
      if (product.image) {
        const publicId = product.image.split("/").pop().split(".")[0];
        await deleteImage(publicId);
      }

      await Product.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting product",
        error: error.message,
      });
    }
  },

  // Add product rating and review
  addProductReview: async (req, res) => {
    try {
      const { rating, review } = req.body;
      const productId = req.params.id;
      const userId = req.user.id;

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if user already reviewed
      const existingReview = product.ratings.find(
        (r) => r.user.toString() === userId
      );

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this product",
        });
      }

      // Add new review
      product.ratings.push({ user: userId, rating, review });

      // Update average rating
      const totalRating = product.ratings.reduce(
        (sum, item) => sum + item.rating,
        0
      );
      product.averageRating = totalRating / product.ratings.length;

      await product.save();

      res.status(200).json({
        success: true,
        message: "Review added successfully",
        product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error adding review",
        error: error.message,
      });
    }
  },

  getMyProducts: async (req, res) => {
    try {
      console.log("Fetching products for user:", req.user.id);

      const products = await Product.find({ seller: req.user.id })
        .sort({ createdAt: -1 })
        .lean(); // Use lean() for better performance

      console.log("Found products:", products.length);

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      console.error("Error in getMyProducts:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching products",
        error: error.message,
      });
    }
  },
};

module.exports = { productController };
