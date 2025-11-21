const axios = require('axios');
const crypto = require('crypto');

class ToolsController {
  // JSON格式化工具
  async formatJson(req, res) {
    try {
      const { data, pretty = true } = req.body;
      
      if (!data) {
        return res.status(400).json({ message: '缺少JSON数据' });
      }

      let parsedData;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (error) {
          return res.status(400).json({ message: '无效的JSON格式', error: error.message });
        }
      } else {
        parsedData = data;
      }

      const formatted = pretty ? JSON.stringify(parsedData, null, 2) : JSON.stringify(parsedData);
      
      res.json({
        success: true,
        data: formatted,
        size: formatted.length
      });
    } catch (error) {
      res.status(500).json({ message: 'JSON格式化失败', error: error.message });
    }
  }

  // JSON验证
  async validateJson(req, res) {
    try {
      const { data } = req.body;
      
      if (!data) {
        return res.status(400).json({ message: '缺少JSON数据' });
      }

      try {
        const parsed = JSON.parse(data);
        res.json({
          success: true,
          valid: true,
          message: 'JSON格式有效',
          data: parsed
        });
      } catch (error) {
        res.json({
          success: true,
          valid: false,
          message: 'JSON格式无效',
          error: error.message
        });
      }
    } catch (error) {
      res.status(500).json({ message: 'JSON验证失败', error: error.message });
    }
  }

  // HTTP调试工具 - 发送HTTP请求
  async httpRequest(req, res) {
    try {
      const { method = 'GET', url, headers = {}, data, timeout = 30000 } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: '缺少请求URL' });
      }

      const config = {
        method: method.toUpperCase(),
        url,
        headers,
        timeout,
        validateStatus: () => true // 接受所有状态码
      };

      if (method.toUpperCase() !== 'GET' && data) {
        config.data = data;
      }

      const response = await axios(config);
      
      res.json({
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          request: {
            method: config.method,
            url: config.url,
            headers: config.headers
          }
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'HTTP请求失败', 
        error: error.message 
      });
    }
  }

  // 文件搜索（简化版本）
  async searchFiles(req, res) {
    try {
      const { directory = '.', pattern = '*' } = req.body;
      res.json({
        success: true,
        data: { message: '文件搜索功能开发中' }
      });
    } catch (error) {
      res.status(500).json({ message: '文件搜索失败', error: error.message });
    }
  }

  // 文本替换（简化版本）
  async replaceText(req, res) {
    try {
      const { text, search, replace } = req.body;
      if (!text || search === undefined) {
        return res.status(400).json({ message: '缺少必要参数' });
      }
      
      const result = text.replace(new RegExp(search, 'g'), replace || '');
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ message: '文本替换失败', error: error.message });
    }
  }

  // Base64编码
  async base64Encode(req, res) {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: '缺少数据' });
      }
      
      const encoded = Buffer.from(data, 'utf8').toString('base64');
      res.json({
        success: true,
        data: encoded
      });
    } catch (error) {
      res.status(500).json({ message: 'Base64编码失败', error: error.message });
    }
  }

  // Base64解码
  async base64Decode(req, res) {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: '缺少数据' });
      }
      
      const decoded = Buffer.from(data, 'base64').toString('utf8');
      res.json({
        success: true,
        data: decoded
      });
    } catch (error) {
      res.status(500).json({ message: 'Base64解码失败', error: error.message });
    }
  }

  // URL编码
  async urlEncode(req, res) {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: '缺少数据' });
      }
      
      const encoded = encodeURIComponent(data);
      res.json({
        success: true,
        data: encoded
      });
    } catch (error) {
      res.status(500).json({ message: 'URL编码失败', error: error.message });
    }
  }

  // URL解码
  async urlDecode(req, res) {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: '缺少数据' });
      }
      
      const decoded = decodeURIComponent(data);
      res.json({
        success: true,
        data: decoded
      });
    } catch (error) {
      res.status(500).json({ message: 'URL解码失败', error: error.message });
    }
  }

  // 时间戳转换
  async timestampToDate(req, res) {
    try {
      const { timestamp } = req.body;
      if (!timestamp) {
        return res.status(400).json({ message: '缺少时间戳' });
      }
      
      const date = new Date(parseInt(timestamp));
      res.json({
        success: true,
        data: date.toLocaleString()
      });
    } catch (error) {
      res.status(500).json({ message: '时间戳转换失败', error: error.message });
    }
  }

  // 日期转时间戳
  async dateToTimestamp(req, res) {
    try {
      const { date } = req.body;
      if (!date) {
        return res.status(400).json({ message: '缺少日期' });
      }
      
      const timestamp = new Date(date).getTime();
      res.json({
        success: true,
        data: timestamp
      });
    } catch (error) {
      res.status(500).json({ message: '日期转换失败', error: error.message });
    }
  }

  // HTML编码
  async htmlEncode(req, res) {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: '缺少数据' });
      }
      
      const encoded = data.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
      res.json({
        success: true,
        data: encoded
      });
    } catch (error) {
      res.status(500).json({ message: 'HTML编码失败', error: error.message });
    }
  }

  // HTML解码
  async htmlDecode(req, res) {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: '缺少数据' });
      }
      
      const decoded = data.replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#039;/g, "'");
      res.json({
        success: true,
        data: decoded
      });
    } catch (error) {
      res.status(500).json({ message: 'HTML解码失败', error: error.message });
    }
  }

  // Unicode编码
  async unicodeEncode(req, res) {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: '缺少数据' });
      }
      
      let encoded = '';
      for (let i = 0; i < data.length; i++) {
        encoded += '\\u' + data.charCodeAt(i).toString(16).padStart(4, '0');
      }
      res.json({
        success: true,
        data: encoded
      });
    } catch (error) {
      res.status(500).json({ message: 'Unicode编码失败', error: error.message });
    }
  }

  // Unicode解码
  async unicodeDecode(req, res) {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: '缺少数据' });
      }
      
      const decoded = data.replace(/\\u([\d\w]{4})/g, function(match, hex) {
        return String.fromCharCode(parseInt(hex, 16));
      });
      res.json({
        success: true,
        data: decoded
      });
    } catch (error) {
      res.status(500).json({ message: 'Unicode解码失败', error: error.message });
    }
  }

  // MD5哈希
  async md5Hash(req, res) {
    try {
      const { text, data } = req.body;
      const input = text || data;
      if (!input) {
        return res.status(400).json({ message: '缺少数据' });
      }
      
      const hash = crypto.createHash('md5').update(input).digest('hex');
      res.json({
        success: true,
        data: hash
      });
    } catch (error) {
      res.status(500).json({ message: 'MD5哈希计算失败', error: error.message });
    }
  }

  // SHA哈希
  async shaHash(req, res) {
    try {
      const { data, algorithm = 'sha256' } = req.body;
      if (!data) {
        return res.status(400).json({ message: '缺少数据' });
      }
      
      const hash = crypto.createHash(algorithm).update(data).digest('hex');
      res.json({
        success: true,
        data: hash
      });
    } catch (error) {
      res.status(500).json({ message: 'SHA哈希计算失败', error: error.message });
    }
  }

  // 进制转换
  async baseConverter(req, res) {
    try {
      const { value, from = 10, to = 2 } = req.body;
      if (!value) {
        return res.status(400).json({ message: '缺少数值' });
      }
      
      const result = parseInt(value.toString(), from).toString(to);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ message: '进制转换失败', error: error.message });
    }
  }
}

module.exports = new ToolsController();