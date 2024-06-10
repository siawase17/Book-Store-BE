const express = require('express');
const router = express.Router();
const LikeController = require('../controllers/LikeController');

router.use(express.json());

router.post('/:id', LikeController.addLike);
router.delete('/:id', LikeController.removeLike);

module.exports = router;