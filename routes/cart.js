const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');

router.use(express.json());

// 장바구니 담기
router.post('/', CartController.addCart);

// 장바구니 조회 & 장바구니에서 선택한 주문 예상 상품 목록 조회
router.get('/', CartController.cartItems);

// 장바구니 도서 삭제
router.delete('/:id', CartController.deleteCartItem);

module.exports = router;