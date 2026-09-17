const axios = require('axios');
const { parseResumeHeuristics } = require('./resumeFileParser');

const CHAT_URL = process.env.DEEPSEEK_CHAT_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const MODEL = process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-chat';

const stripJsonFence = (raw) => {
  const text = (raw || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    return fenced[1].trim();
  }
  return text;
};

const callChatJson = async (systemPrompt, userPrompt) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await axios.post(
    CHAT_URL,
    {
      model: MODEL,
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }
  return JSON.parse(stripJsonFence(content));
};

const STRUCTURE_SCHEMA_HINT = `返回 JSON 对象，字段：
name, email, phone, gender, age(数字或null), education, experience_years(数字或null),
job_intention, expected_city, current_position, current_company, expected_salary,
skills(专业技能，保留前后端等分类), personal_advantages(个人优势全文),
work_experience(工作经历，按公司时间线整理), project_experience(项目经历全文),
education_background(教育经历), certificates(资格证书)。
缺失字段用空字符串或 null。只输出 JSON。`;

const structureResumeFromText = async (rawText) => {
  const heuristic = parseResumeHeuristics(rawText);
  const truncated = (rawText || '').slice(0, 20000);

  try {
    const llm = await callChatJson(
      '你是简历结构化助手，从简历原文提取字段。',
      `${STRUCTURE_SCHEMA_HINT}\n\n简历原文：\n${truncated}`
    );
    if (llm && typeof llm === 'object') {
      return {
        name: llm.name || heuristic.name || '',
        email: llm.email || heuristic.email || '',
        phone: llm.phone || heuristic.phone || '',
        gender: llm.gender || heuristic.gender || '',
        age: llm.age ?? null,
        education: llm.education || heuristic.education || '',
        experience_years: llm.experience_years ?? heuristic.experience_years ?? null,
        job_intention: llm.job_intention || heuristic.job_intention || '',
        expected_city: llm.expected_city || heuristic.expected_city || '',
        current_position: llm.current_position || heuristic.current_position || '',
        current_company: llm.current_company || heuristic.current_company || '',
        expected_salary: llm.expected_salary || heuristic.expected_salary || '',
        skills: llm.skills || heuristic.skills || '',
        personal_advantages: llm.personal_advantages || heuristic.personal_advantages || '',
        project_experience: llm.project_experience || heuristic.project_experience || '',
        certificates: llm.certificates || heuristic.certificates || '',
        work_experience: llm.work_experience || heuristic.work_experience || '',
        education_background: llm.education_background || heuristic.education_background || '',
        parse_mode: 'llm'
      };
    }
  } catch (err) {
    console.warn('LLM resume structure failed:', err.message);
  }

  return {
    ...heuristic,
    age: null,
    parse_mode: 'heuristic'
  };
};

const scoreResumeAgainstJob = async ({ job, rules, talent, rawText }) => {
  const jd = [
    job.title,
    job.jd_summary || '',
    job.description || '',
    job.requirements || ''
  ].filter(Boolean).join('\n');

  const payload = {
    job_description: jd,
    screening_rules: rules || {},
    candidate: {
      name: talent.name,
      job_intention: talent.job_intention,
      education: talent.education,
      experience_years: talent.experience_years,
      skills: talent.skills,
      personal_advantages: talent.personal_advantages,
      project_experience: talent.project_experience,
      work_experience: talent.work_experience,
      expected_salary: talent.expected_salary,
      certificates: talent.certificates
    },
    resume_excerpt: (rawText || talent.work_experience || '').slice(0, 8000)
  };

  try {
    const llm = await callChatJson(
      '你是招聘筛选助手。根据职位 JD 与筛选规则评估候选人，输出 JSON：pass(boolean), score(0-1数字), summary(一句话中文), matched_skills(数组), gaps(数组), hard_fail_reasons(数组)。',
      JSON.stringify(payload, null, 2)
    );
    if (llm) {
      return {
        pass: Boolean(llm.pass),
        score: typeof llm.score === 'number' ? llm.score : parseFloat(llm.score) || 0,
        summary: llm.summary || '',
        matched_skills: llm.matched_skills || [],
        gaps: llm.gaps || [],
        hard_fail_reasons: llm.hard_fail_reasons || [],
        mode: 'llm'
      };
    }
  } catch (err) {
    console.warn('LLM resume score failed:', err.message);
  }

  return {
    pass: true,
    score: 0.5,
    summary: '未配置 DEEPSEEK_API_KEY，仅完成规则预筛',
    matched_skills: [],
    gaps: [],
    hard_fail_reasons: [],
    mode: 'rules_only'
  };
};

module.exports = {
  structureResumeFromText,
  scoreResumeAgainstJob
};
