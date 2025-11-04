const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const talentPoolController = require('../controllers/talentPoolController');

// 获取人才库列表
router.get('/talents', talentPoolController.getTalents);

// 获取人才详情
router.get('/talents/:id', talentPoolController.getTalentById);

// 创建人才（手动添加）
router.post('/talents', [
  body('name').notEmpty().withMessage('姓名不能为空')
], talentPoolController.createTalent);

// 文件上传并解析
router.post('/talents/upload', talentPoolController.uploadAndParse);

// 爬取招聘网站
router.post('/talents/crawl', [
  body('url').notEmpty().withMessage('URL不能为空')
], talentPoolController.crawlJobSite);

// 更新人才信息
router.put('/talents/:id', [
  body('name').notEmpty().withMessage('姓名不能为空')
], talentPoolController.updateTalent);

// 删除人才
router.delete('/talents/:id', talentPoolController.deleteTalent);

// 关联招聘职位
router.post('/talents/:id/link-recruitment', [
  body('recruitment_position_id').isInt().withMessage('招聘职位ID必须是数字')
], talentPoolController.linkToRecruitment);

// 转为入职申请
router.post('/talents/:id/convert-to-onboarding', [
  body('position_id').isInt().withMessage('岗位ID必须是数字'),
  body('org_id').isInt().withMessage('组织ID必须是数字'),
  body('start_date').notEmpty().withMessage('入职日期不能为空')
], talentPoolController.convertToOnboarding);

// 下载简历文件
router.get('/talents/:id/download', talentPoolController.downloadResume);

module.exports = router;

