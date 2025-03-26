require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.post("/api/send-email", async (req, res) => {
  const { orderDetails, cartItems, totalAmount } = req.body;
  const { fullName, email, phone, shippingAddress } = orderDetails;

  if (!email || !fullName || !phone || !shippingAddress) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // Format order details for seller's email
  const orderItems = cartItems
    .map((item) => `• ${item.name} (x${item.quantity || 1}) - ₹${item.price * (item.quantity || 1)}`)
    .join("\n");

  const shippingInfo = `
    📍 Shipping Address:
    ${shippingAddress.houseNumber}, ${shippingAddress.street},
    ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.zipCode},
    ${shippingAddress.country}
  `;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email to Customer
  let customerMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Order Confirmation",
    text: `Dear ${fullName},\n\nThank you for your purchase! 🎉\n\nYour order of ₹${totalAmount} has been placed successfully.\n\nOrder Summary:\n${orderItems}\n\n${shippingInfo}\n\nBest regards,\nYour Store Team`,
  };

  // Email to Seller
  let ownerMailOptions = {
    from: process.env.EMAIL_USER,
    to: "codingbest307@gmail.com", // Replace with seller's email
    subject: "New Order Received",
    text: `📦 A new order has been placed!\n\n👤 Customer Name: ${fullName}\n📧 Email: ${email}\n📞 Phone: ${phone}\n\n${shippingInfo}\n\n🛒 Order Items:\n${orderItems}\n\n💰 Total Amount: ₹${totalAmount}\n\n🚀 Process this order soon!`,
  };

  try {
    await Promise.all([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(ownerMailOptions),
    ]);

    console.log("✅ Emails sent successfully!");
    res.json({ success: true, message: "Emails sent successfully" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send email", error });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
