const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const protect = require("../middleware/authMiddleware");

router.post("/checkout", protect, orderController.checkout);
router.get("/my-orders", protect, orderController.getMyOrders);

module.exports = router;
