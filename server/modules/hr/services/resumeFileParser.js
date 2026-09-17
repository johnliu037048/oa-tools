const fs = require('fs');
const path = require('path');

let pdfParse;
let mammoth;
let XLSX;

try {
  pdfParse = require('pdf-parse');
} catch (_) {
  pdfParse = null;
}
try {
  mammoth = require('mammoth');
} catch (_) {
  mammoth = null;
}
try {
  XLSX = require('xlsx');
} catch (_) {
  XLSX = null;
}

const extractTextFromFile = async (filePath, fileType) => {
  const ext = (fileType || path.extname(filePath)).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === '.pdf') {
    if (!pdfParse) {
      throw new Error('未安装 pdf-parse，请在 server 目录执行 npm install pdf-parse');
    }
    const data = await pdfParse(buffer);
    return (data.text || '').trim();
  }

  if (ext === '.docx') {
    if (!mammoth) {
      throw new Error('未安装 mammoth，请在 server 目录执行 npm install mammoth');
    }
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || '').trim();
  }

  if (ext === '.doc') {
    throw new Error('暂不支持 .doc 格式，请另存为 .docx 或 PDF 后上传');
  }

  if (ext === '.xlsx' || ext === '.xls') {
    if (!XLSX) {
      throw new Error('未安装 xlsx，请在 server 目录执行 npm install xlsx');
    }
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_csv(worksheet).trim();
  }

  throw new Error(`不支持的文件类型: ${ext}`);
};

const parseResumeHeuristics = (text) => {
  if (!text) {
    return {};
  }

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?86[-\s]?)?(1[3-9]\d{9})/);
  const namePatterns = [
    /姓\s*名[：:\s]+([^\s\n|｜]{2,20})/,
    /Name[：:\s]+([^\s\n]{2,40})/i,
    /([^\s\n]{2,4}先生|[^\s\n]{2,4}女士)/
  ];
  let name = '';
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      name = m[1].replace(/[|｜]/g, '').trim();
      break;
    }
  }

  const headerLine = text.match(/[男女]\s*[|｜]\s*年龄[：:]\s*(\d+)岁[^|\n]*/);
  const ageMatch = headerLine ? headerLine[0].match(/年龄[：:]\s*(\d+)岁/) : text.match(/年龄[：:]\s*(\d+)岁/);
  const genderFromHeader = headerLine ? headerLine[0].match(/^([男女])/) : text.match(/[男女]\s*[|｜]/);
  const genderMatch = text.match(/性\s*别[：:\s]*(男|女)/);

  const eduSection = text.match(/教育经历[\s\S]*?(?=资格证书|专业技能|项目经历|$)/);
  const eduMatch = eduSection
    ? eduSection[0].match(/(博士|硕士|研究生|本科|学士|专科|大专|高中)/)
    : text.match(/(博士|硕士|研究生|本科|学士|专科|大专|高中)/);
  const expMatch = text.match(/(\d+)\s*年(?:以上)?(?:工作)?经验/);
  const salaryMatch = text.match(/期望薪资[：:\s]*([^\s|｜\n]+)/);
  const cityMatch = text.match(/期望城市[：:\s]*([^\s|｜\n]+)/);
  const intentionMatch = text.match(/求职意向[：:\s]*([^\s|｜\n]+)/);

  const companyBlock = text.match(
    /([\u4e00-\u9fa5（）()A-Za-z0-9]+(?:有限公司|公司|科技|集团)[^\n]*)\s+([^\n]{2,40})\s*\n\s*(\d{4}\.\d{2})/
  );

  const skillsBlock = text.match(/专业技能[\s\S]*?(?=项目经历|教育经历|$)/);
  let skills = '';
  if (skillsBlock) {
    skills = skillsBlock[0]
      .replace(/专业技能\s*/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  }

  const advantageBlock = text.match(/个人优势[\s\S]*?(?=工作经历|项目经历|$)/);
  const projectBlock = text.match(/项目经历[\s\S]*?(?=教育经历|资格证书|专业技能|$)/);
  const certBlock = text.match(/资格证书[\s\S]*?(?=专业技能|教育经历|$)/);
  const workBlock = text.match(/工作经历[\s\S]*?(?=项目经历|教育经历|$)/);

  const education_background = eduSection
    ? eduSection[0].replace(/教育经历\s*/g, '').trim().slice(0, 1500)
    : '';

  return {
    name,
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[1] : '',
    gender: (genderFromHeader && genderFromHeader[1]) || (genderMatch ? genderMatch[1] : ''),
    age: ageMatch ? parseInt(ageMatch[1], 10) : null,
    education: eduMatch ? eduMatch[1] : '',
    experience_years: expMatch ? parseInt(expMatch[1], 10) : null,
    job_intention: intentionMatch ? intentionMatch[1] : '',
    expected_city: cityMatch ? cityMatch[1] : '',
    expected_salary: salaryMatch ? salaryMatch[1] : '',
    skills,
    personal_advantages: advantageBlock
      ? advantageBlock[0].replace(/个人优势\s*/g, '').trim().slice(0, 2000)
      : '',
    project_experience: projectBlock
      ? projectBlock[0].replace(/项目经历\s*/g, '').trim().slice(0, 4000)
      : '',
    certificates: certBlock
      ? certBlock[0].replace(/资格证书\s*/g, '').trim().slice(0, 1000)
      : '',
    work_experience: workBlock
      ? workBlock[0].replace(/工作经历\s*/g, '').trim().slice(0, 4000)
      : text.length > 4000
        ? text.slice(0, 4000)
        : text,
    education_background,
    current_position: companyBlock ? companyBlock[2].trim() : '',
    current_company: companyBlock ? companyBlock[1].trim() : ''
  };
};

module.exports = {
  extractTextFromFile,
  parseResumeHeuristics
};
