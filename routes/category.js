const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/CategoryController');

router.use(express.json());

router.get('/', categoryController.category);

module.exports = router;