// 박유진
const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');

router.use(express.json());

// 결제
router.post('/', OrderController.order);

// 주문 목록 조회
router.get('/', OrderController.getOrders);

// 주문 상세 상품 조회
router.get('/:id', OrderController.getOrderDetail);

module.exports = router;