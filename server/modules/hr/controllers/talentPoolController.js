const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置multer文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/talent-pool');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，仅支持 PDF、Word、Excel 格式'));
    }
  }
});

// 文件解析工具函数（简化版，实际需要安装相应库）
const parseResumeFile = async (filePath, fileType) => {
  // 这里需要安装相应的解析库
  // PDF: pdf-parse
  // Word: mammoth
  // Excel: xlsx
  // 暂时返回空对象，实际使用时需要安装并实现解析逻辑
  return {
    name: '',
    email: '',
    phone: '',
    experience: '',
    education: '',
    skills: ''
  };
};

// 获取人才库列表
exports.getTalents = (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', status = '', source = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT tp.*, rp.title as recruitment_position_title 
               FROM talent_pool tp 
               LEFT JOIN recruitment_positions rp ON tp.recruitment_position_id = rp.id 
               WHERE 1=1`;
    const params = [];
    
    if (keyword) {
      sql += ` AND (tp.name LIKE ? OR tp.email LIKE ? OR tp.phone LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    if (status) {
      sql += ` AND tp.status = ?`;
      params.push(status);
    }

    if (source) {
      sql += ` AND tp.source = ?`;
      params.push(source);
    }

    sql += ` ORDER BY tp.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, talents) => {
      if (err) {
        return res.status(500).json({ message: '查询失败', error: err.message });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM talent_pool tp 
                      LEFT JOIN recruitment_positions rp ON tp.recruitment_position_id = rp.id 
                      WHERE 1=1`;
      const countParams = [];
      
      if (keyword) {
        countSql += ` AND (tp.name LIKE ? OR tp.email LIKE ? OR tp.phone LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      if (status) {
        countSql += ` AND tp.status = ?`;
        countParams.push(status);
      }

      if (source) {
        countSql += ` AND tp.source = ?`;
        countParams.push(source);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询失败', error: err.message });
        }

        res.json({
          data: talents,
          total: countResult.total,
          page: parseInt(page),
          limit: parseInt(limit)
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 创建人才（手动添加）
exports.createTalent = [
  body('name').notEmpty().withMessage('姓名不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const {
      name, email, phone, gender, age, education, experience_years,
      current_position, current_company, expected_salary, skills,
      work_experience, education_background, source, source_url,
      recruitment_position_id, notes
    } = req.body;

    db.run(
      `INSERT INTO talent_pool (name, email, phone, gender, age, education, experience_years,
        current_position, current_company, expected_salary, skills, work_experience,
        education_background, source, source_url, recruitment_position_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, gender, age, education, experience_years,
        current_position, current_company, expected_salary, skills,
        work_experience, education_background, source || 'manual', source_url,
        recruitment_position_id, notes],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败', error: err.message });
        }
        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 文件上传并解析
exports.uploadAndParse = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: '请选择要上传的文件' });
      }

      const filePath = req.file.path;
      const fileType = path.extname(req.file.originalname).toLowerCase();
      const fileName = req.file.filename;

      // 解析文件（这里需要实现实际的解析逻辑）
      // 暂时返回提示信息，需要安装解析库后实现
      const parsedData = await parseResumeFile(filePath, fileType);

      // 保存到数据库
      const {
        name = parsedData.name || '',
        email = parsedData.email || '',
        phone = parsedData.phone || '',
        gender = '',
        age = null,
        education = parsedData.education || '',
        experience_years = null,
        current_position = '',
        current_company = '',
        expected_salary = '',
        skills = parsedData.skills || '',
        work_experience = parsedData.experience || '',
        education_background = parsedData.education || '',
        recruitment_position_id = null,
        notes = ''
      } = req.body;

      db.run(
        `INSERT INTO talent_pool (name, email, phone, gender, age, education, experience_years,
          current_position, current_company, expected_salary, skills, work_experience,
          education_background, resume_file, source, recruitment_position_id, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'import', ?, ?)`,
        [name, email, phone, gender, age, education, experience_years,
          current_position, current_company, expected_salary, skills,
          work_experience, education_background, fileName,
          recruitment_position_id, notes],
        function(err) {
          if (err) {
            // 删除已上传的文件
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            return res.status(500).json({ message: '保存失败', error: err.message });
          }
          res.json({ 
            message: '上传并解析成功', 
            id: this.lastID,
            parsedData: parsedData
          });
        }
      );
    } catch (error) {
      // 删除已上传的文件
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: '处理失败', error: error.message });
    }
  }
];

// 爬取招聘网站（接口框架）
exports.crawlJobSite = [
  body('url').notEmpty().withMessage('URL不能为空'),
  async (req, res) => {
    try {
      const { url, position_keywords } = req.body;
      
      // 这里需要实现爬虫逻辑
      // 可以使用 puppeteer、cheerio 等库
      // 暂时返回提示信息
      
      res.json({ 
        message: '爬取功能待实现，需要安装相关爬虫库（如 puppeteer）',
        url: url,
        note: '此功能需要实现实际的爬虫逻辑'
      });
    } catch (error) {
      res.status(500).json({ message: '爬取失败', error: error.message });
    }
  }
];

// 更新人才信息
exports.updateTalent = [
  body('name').notEmpty().withMessage('姓名不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const {
      name, email, phone, gender, age, education, experience_years,
      current_position, current_company, expected_salary, skills,
      work_experience, education_background, recruitment_position_id,
      status, notes
    } = req.body;

    db.run(
      `UPDATE talent_pool 
       SET name = ?, email = ?, phone = ?, gender = ?, age = ?, education = ?,
           experience_years = ?, current_position = ?, current_company = ?,
           expected_salary = ?, skills = ?, work_experience = ?,
           education_background = ?, recruitment_position_id = ?, status = ?,
           notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, email, phone, gender, age, education, experience_years,
        current_position, current_company, expected_salary, skills,
        work_experience, education_background, recruitment_position_id,
        status, notes, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败', error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: '人才不存在' });
        }
        res.json({ message: '更新成功' });
      }
    );
  }
];

// 删除人才
exports.deleteTalent = (req, res) => {
  const { id } = req.params;

  // 先获取文件路径
  db.get('SELECT resume_file FROM talent_pool WHERE id = ?', [id], (err, talent) => {
    if (err) {
      return res.status(500).json({ message: '查询失败', error: err.message });
    }

    if (!talent) {
      return res.status(404).json({ message: '人才不存在' });
    }

    // 删除数据库记录
    db.run('DELETE FROM talent_pool WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ message: '删除失败', error: err.message });
      }

      // 删除文件
      if (talent.resume_file) {
        const filePath = path.join(__dirname, '../../../uploads/talent-pool', talent.resume_file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.json({ message: '删除成功' });
    });
  });
};

// 关联招聘职位（设置为候选）
exports.linkToRecruitment = [
  body('recruitment_position_id').isInt().withMessage('招聘职位ID必须是整数'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { recruitment_position_id } = req.body;

    db.run(
      'UPDATE talent_pool SET recruitment_position_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [recruitment_position_id, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '关联失败', error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: '人才不存在' });
        }
        res.json({ message: '关联成功' });
      }
    );
  }
];

// 获取人才详情
exports.getTalentById = (req, res) => {
  const { id } = req.params;

  db.get('SELECT tp.*, rp.title as recruitment_position_title FROM talent_pool tp LEFT JOIN recruitment_positions rp ON tp.recruitment_position_id = rp.id WHERE tp.id = ?', [id], (err, talent) => {
    if (err) {
      return res.status(500).json({ message: '查询失败', error: err.message });
    }

    if (!talent) {
      return res.status(404).json({ message: '人才不存在' });
    }

    res.json({ data: talent });
  });
};

// 下载简历文件
exports.downloadResume = (req, res) => {
  const { id } = req.params;

  db.get('SELECT resume_file FROM talent_pool WHERE id = ?', [id], (err, talent) => {
    if (err) {
      return res.status(500).json({ message: '查询失败', error: err.message });
    }

    if (!talent || !talent.resume_file) {
      return res.status(404).json({ message: '简历文件不存在' });
    }

    const filePath = path.join(__dirname, '../../../uploads/talent-pool', talent.resume_file);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' });
    }

    res.download(filePath, (err) => {
      if (err) {
        return res.status(500).json({ message: '下载失败', error: err.message });
      }
    });
  });
};

// 转为入职申请（从人才库转为入职）
exports.convertToOnboarding = [
  body('position_id').isInt().withMessage('岗位ID必须是整数'),
  body('org_id').isInt().withMessage('组织ID必须是整数'),
  body('start_date').notEmpty().withMessage('入职日期不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { position_id, org_id, start_date, salary, contract_type, notes } = req.body;

    // 先获取人才信息
    db.get('SELECT * FROM talent_pool WHERE id = ?', [id], (err, talent) => {
      if (err) {
        return res.status(500).json({ message: '查询失败', error: err.message });
      }

      if (!talent) {
        return res.status(404).json({ message: '人才不存在' });
      }

      // 检查是否已存在用户（通过邮箱）
      if (!talent.email) {
        return res.status(400).json({ message: '人才信息缺少邮箱，无法创建用户' });
      }

      let userId = null;
      
      // 检查用户是否存在
      db.get('SELECT id FROM users WHERE email = ?', [talent.email], (err, user) => {
        if (err) {
          return res.status(500).json({ message: '查询用户失败', error: err.message });
        }

        if (user) {
          userId = user.id;
          // 用户已存在，直接创建入职申请
          createOnboardingApplication();
        } else {
          // 创建新用户
          const username = talent.email.split('@')[0] || `user_${Date.now()}`;
          db.run(
            `INSERT INTO users (username, email, password, name, status) 
             VALUES (?, ?, ?, ?, 1)`,
            [username, talent.email, '$2a$10$default', talent.name],
            function(err) {
              if (err) {
                return res.status(500).json({ message: '创建用户失败', error: err.message });
              }
              userId = this.lastID;
              // 创建入职申请
              createOnboardingApplication();
            }
          );
        }

        function createOnboardingApplication() {
          db.run(
            `INSERT INTO onboarding_applications (user_id, position_id, org_id, start_date, salary, contract_type, notes, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [userId, position_id, org_id, start_date, salary, contract_type, notes || `来自人才库: ${talent.name}`],
            function(err) {
              if (err) {
                return res.status(500).json({ message: '创建入职申请失败', error: err.message });
              }

              // 更新人才状态为已入职
              db.run(
                'UPDATE talent_pool SET status = 2, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id],
                function(updateErr) {
                  if (updateErr) {
                    console.error('更新人才状态失败:', updateErr);
                  }
                }
              );

              res.json({ 
                message: '已转为入职申请', 
                onboarding_id: this.lastID,
                user_id: userId
              });
            }
          );
        }
      });
    });
  }
];

