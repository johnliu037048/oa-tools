const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const performanceController = require('../controllers/performanceController');
console.log('performanceController:', performanceController);
const authMiddleware = require('../../../core/middleware/auth');
console.log('authMiddleware:', authMiddleware);

// 验证规则
const performanceValidation = [
    body('employee_id').notEmpty().withMessage('员工ID不能为空'),
    body('evaluation_date').notEmpty().withMessage('评估日期不能为空'),
    body('score').notEmpty().isFloat({ min: 0, max: 100 }).withMessage('分数必须在0-100之间'),
    body('comments').notEmpty().withMessage('评语不能为空')
];

// 获取绩效列表
router.get('/', authMiddleware, performanceController.getPerformances);

// 添加绩效记录
router.post('/', authMiddleware, performanceValidation, performanceController.addPerformance);

// 更新绩效记录
router.put('/:id', authMiddleware, performanceValidation, performanceController.updatePerformance);

// 删除绩效记录
router.delete('/:id', authMiddleware, performanceController.deletePerformance);

module.exports = router;