# 人才库管理模块说明

## 功能概述

人才库管理模块提供了以下功能：

1. **手动添加人才** - 可以手动录入人才信息
2. **文件导入** - 支持通过PDF、Word、Excel文件导入并解析人才信息
3. **网站爬取** - 支持从招聘网站爬取人才信息（需要安装相关库）
4. **关联招聘职位** - 可以将人才关联到具体的招聘职位
5. **转为入职申请** - 可以将人才库中的人才直接转为入职申请

## 数据库表结构

人才库表 `talent_pool` 包含以下字段：
- id: 主键
- name: 姓名（必填）
- email: 邮箱
- phone: 手机号
- gender: 性别
- age: 年龄
- education: 学历
- experience_years: 工作经验（年）
- current_position: 当前职位
- current_company: 当前公司
- expected_salary: 期望薪资
- skills: 技能
- work_experience: 工作经历
- education_background: 教育背景
- resume_file: 简历文件路径
- source: 来源（manual/import/crawl）
- source_url: 来源URL
- recruitment_position_id: 关联的招聘职位ID
- status: 状态（1-待处理，2-已入职，3-已拒绝）
- notes: 备注
- created_at: 创建时间
- updated_at: 更新时间

## 安装依赖

### 文件解析库（可选）

如果需要实现文件解析功能，需要安装以下npm包：

```bash
cd server
npm install pdf-parse mammoth xlsx
```

- `pdf-parse`: 用于解析PDF文件
- `mammoth`: 用于解析Word文件（.docx）
- `xlsx`: 用于解析Excel文件

### 网站爬取库（可选）

如果需要实现网站爬取功能，需要安装以下npm包：

```bash
cd server
npm install puppeteer cheerio
```

- `puppeteer`: 用于浏览器自动化，可以爬取动态网页
- `cheerio`: 用于解析HTML，可以爬取静态网页

## 文件上传配置

文件上传功能使用 `multer` 中间件，配置文件保存在 `server/uploads/talent-pool/` 目录下。

上传限制：
- 文件大小：最大 10MB
- 支持格式：PDF、Word（.doc, .docx）、Excel（.xls, .xlsx）

## API接口

### 获取人才库列表
- **GET** `/api/hr/talent-pool/talents`
- 参数：page, limit, keyword, status, source

### 获取人才详情
- **GET** `/api/hr/talent-pool/talents/:id`

### 创建人才（手动添加）
- **POST** `/api/hr/talent-pool/talents`
- 参数：name（必填），其他字段可选

### 文件上传并解析
- **POST** `/api/hr/talent-pool/talents/upload`
- 参数：file（文件），recruitment_position_id（可选）

### 爬取招聘网站
- **POST** `/api/hr/talent-pool/talents/crawl`
- 参数：url（必填），position_keywords（可选）

### 更新人才信息
- **PUT** `/api/hr/talent-pool/talents/:id`
- 参数：name（必填），其他字段可选

### 删除人才
- **DELETE** `/api/hr/talent-pool/talents/:id`

### 关联招聘职位
- **POST** `/api/hr/talent-pool/talents/:id/link-recruitment`
- 参数：recruitment_position_id（必填）

### 转为入职申请
- **POST** `/api/hr/talent-pool/talents/:id/convert-to-onboarding`
- 参数：position_id（必填），org_id（必填），start_date（必填），salary, contract_type, notes

### 下载简历文件
- **GET** `/api/hr/talent-pool/talents/:id/download`

## 实现文件解析功能

在 `server/modules/hr/controllers/talentPoolController.js` 中的 `parseResumeFile` 函数需要实现实际的解析逻辑。

示例代码（需要安装相应库后取消注释）：

```javascript
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const fs = require('fs');

const parseResumeFile = async (filePath, fileType) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    let text = '';

    if (fileType === '.pdf') {
      const data = await pdfParse(fileBuffer);
      text = data.text;
    } else if (fileType === '.docx') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value;
    } else if (fileType === '.xlsx' || fileType === '.xls') {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      text = XLSX.utils.sheet_to_csv(worksheet);
    }

    // 使用正则表达式或NLP库提取信息
    // 这里需要根据实际简历格式编写解析逻辑
    const nameMatch = text.match(/姓名[：:]\s*(\S+)/);
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const phoneMatch = text.match(/(1[3-9]\d{9})/);

    return {
      name: nameMatch ? nameMatch[1] : '',
      email: emailMatch ? emailMatch[1] : '',
      phone: phoneMatch ? phoneMatch[1] : '',
      experience: text,
      education: '',
      skills: ''
    };
  } catch (error) {
    console.error('解析文件失败:', error);
    return {
      name: '',
      email: '',
      phone: '',
      experience: '',
      education: '',
      skills: ''
    };
  }
};
```

## 实现网站爬取功能

在 `server/modules/hr/controllers/talentPoolController.js` 中的 `crawlJobSite` 函数需要实现实际的爬取逻辑。

示例代码（需要安装相应库后实现）：

```javascript
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

exports.crawlJobSite = [
  body('url').notEmpty().withMessage('URL不能为空'),
  async (req, res) => {
    try {
      const { url, position_keywords } = req.body;
      
      // 使用puppeteer爬取动态网页
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);
      const content = await page.content();
      await browser.close();

      // 使用cheerio解析HTML
      const $ = cheerio.load(content);
      // 根据网站结构提取人才信息
      // ...

      // 保存到数据库
      // ...

      res.json({ message: '爬取成功', data: [] });
    } catch (error) {
      res.status(500).json({ message: '爬取失败', error: error.message });
    }
  }
];
```

## 注意事项

1. 文件解析功能需要根据实际简历格式编写解析逻辑，不同格式的简历结构可能不同
2. 网站爬取需要遵守网站的robots.txt和使用条款，建议仅用于学习和测试
3. 文件上传需要确保服务器有足够的磁盘空间
4. 转为入职申请功能会自动创建用户账号（如果不存在），需要确保人才信息中有邮箱

## 前端路由

前端路由已配置为：`/hr/talent-pool`，页面组件位于 `client/src/views/hr/TalentPool.vue`

## 样式说明

前端页面样式参考了招聘管理模块的设计，使用了相同的布局和样式风格，包括：
- 搜索表单区域
- 操作按钮区域
- 数据表格区域
- 分页组件
- 对话框样式

