const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const protect = require("../middleware/authMiddleware");

const { checkSuspended, checkVerified } = require("../middleware/authMiddleware");

router.post("/checkout", protect, checkSuspended, checkVerified, orderController.checkout);
router.get("/my-orders", protect, orderController.getMyOrders);
router.patch("/:id/return", protect, orderController.returnOrder);
router.patch("/:id/cancel", protect, orderController.cancelOrder);

module.exports = router;
