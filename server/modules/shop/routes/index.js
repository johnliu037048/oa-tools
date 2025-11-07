const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

router.get('/shops', shopController.listShops);
router.get('/products', shopController.listProducts);
router.get('/discounts', shopController.listDiscounts);
router.get('/promotions', shopController.listPromotions);
router.get('/salary', shopController.salaryCalc);

module.exports = router;
