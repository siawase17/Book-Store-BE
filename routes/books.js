const express = require('express');
const router = express.Router();
const BookController = require('../controllers/BookController');

router.use(express.json());

router.get('/', BookController.books);
router.get('/:id', BookController.book);

module.exports = router;