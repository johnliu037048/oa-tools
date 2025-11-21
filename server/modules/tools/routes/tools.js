const express = require('express');
const router = express.Router();
const toolsController = require('../controllers/toolsController');

// JSON工具
router.post('/format-json', toolsController.formatJson);
router.post('/validate-json', toolsController.validateJson);

// HTTP工具
router.post('/http-request', toolsController.httpRequest);

// 文件工具
router.post('/search-files', toolsController.searchFiles);
router.post('/replace-text', toolsController.replaceText);

// 编码解码工具
router.post('/base64-encode', toolsController.base64Encode);
router.post('/base64-decode', toolsController.base64Decode);
router.post('/url-encode', toolsController.urlEncode);
router.post('/url-decode', toolsController.urlDecode);
router.post('/html-encode', toolsController.htmlEncode);
router.post('/html-decode', toolsController.htmlDecode);
router.post('/unicode-encode', toolsController.unicodeEncode);
router.post('/unicode-decode', toolsController.unicodeDecode);

// 时间工具
router.post('/timestamp-to-date', toolsController.timestampToDate);
router.post('/date-to-timestamp', toolsController.dateToTimestamp);

// 哈希工具
router.post('/md5-hash', toolsController.md5Hash);
router.post('/sha-hash', toolsController.shaHash);

// 进制转换工具
router.post('/base-converter', toolsController.baseConverter);

module.exports = router;