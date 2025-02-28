// // controllers/paymentController.js
// const SSLCommerzPayment = require('sslcommerz-lts');

// const store_id = 'your_store_id';
// const store_passwd = 'your_store_password';
// const is_live = false; //true for live, false for sandbox

// const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

// exports.initPayment = async (req, res) => {
//   const { total_amount, currency, tran_id, product_name, cus_name, cus_email, cus_phone } = req.body;

//   const data = {
//     total_amount,
//     currency,
//     tran_id,
//     success_url: 'http://localhost:3000/payment/success',
//     fail_url: 'http://localhost:3000/payment/fail',
//     cancel_url: 'http://localhost:3000/payment/cancel',
//     ipn_url: 'http://localhost:3000/payment/ipn',
//     shipping_method: 'NO',
//     product_name,
//     product_category: 'Agricultural Products',
//     product_profile: 'physical-goods',
//     cus_name,
//     cus_email,
//     cus_add1: 'Dhaka',
//     cus_city: 'Dhaka',
//     cus_state: 'Dhaka',
//     cus_postcode: '1000',
//     cus_country: 'Bangladesh',
//     cus_phone,
//     ship_name: cus_name,
//     ship_add1: 'Dhaka',
//     ship_city: 'Dhaka',
//     ship_state: 'Dhaka',
//     ship_postcode: '1000',
//     ship_country: 'Bangladesh',
//   };

//   try {
//     const response = await sslcz.init(data);
//     return res.json(response);
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// exports.paymentSuccess = async (req, res) => {
//   // Verify payment with SSLCommerz
//   // Update order status in database
//   return res.redirect('yourapp://payment/success');
// };

// exports.paymentFail = async (req, res) => {
//   return res.redirect('yourapp://payment/fail');
// };

// exports.paymentCancel = async (req, res) => {
//   return res.redirect('yourapp://payment/fail');
// };