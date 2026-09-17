const EDU_RANK = {
  高中: 1,
  专科: 2,
  大专: 2,
  本科: 3,
  学士: 3,
  硕士: 4,
  研究生: 4,
  博士: 5
};

const normalizeRules = (raw) => {
  if (!raw) {
    return {};
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }
  return raw;
};

const parseSalaryMaxK = (expectedSalary) => {
  if (!expectedSalary) {
    return null;
  }
  const s = String(expectedSalary);
  const nums = s.match(/(\d+(?:\.\d+)?)/g);
  if (!nums || !nums.length) {
    return null;
  }
  const values = nums.map((n) => parseFloat(n));
  const max = Math.max(...values);
  if (/k|K|千/.test(s) || max < 100) {
    return max;
  }
  return max / 1000;
};

const educationRank = (edu) => {
  if (!edu) {
    return 0;
  }
  for (const [key, rank] of Object.entries(EDU_RANK)) {
    if (String(edu).includes(key)) {
      return rank;
    }
  }
  return 0;
};

const applyRuleScreen = (talent, rulesInput) => {
  const rules = normalizeRules(rulesInput);
  const failures = [];

  if (rules.min_experience_years != null && rules.min_experience_years !== '') {
    const min = parseInt(rules.min_experience_years, 10);
    const years = talent.experience_years != null ? parseInt(talent.experience_years, 10) : 0;
    if (years < min) {
      failures.push(`工作年限不足（需要≥${min}年，当前${years}年）`);
    }
  }

  if (rules.min_education) {
    const need = educationRank(rules.min_education);
    const have = educationRank(talent.education);
    if (need > 0 && have < need) {
      failures.push(`学历不满足（需要${rules.min_education}及以上）`);
    }
  }

  if (Array.isArray(rules.required_skills) && rules.required_skills.length) {
    const blob = `${talent.skills || ''} ${talent.work_experience || ''}`.toLowerCase();
    for (const skill of rules.required_skills) {
      if (skill && !blob.includes(String(skill).toLowerCase())) {
        failures.push(`缺少必备技能：${skill}`);
      }
    }
  }

  if (rules.max_expected_salary_k != null && rules.max_expected_salary_k !== '') {
    const maxK = parseFloat(rules.max_expected_salary_k);
    const candidateK = parseSalaryMaxK(talent.expected_salary);
    if (candidateK != null && candidateK > maxK) {
      failures.push(`期望薪资偏高（>${maxK}K）`);
    }
  }

  if (Array.isArray(rules.keywords_exclude)) {
    const blob = `${talent.work_experience || ''} ${talent.skills || ''}`;
    for (const kw of rules.keywords_exclude) {
      if (kw && blob.includes(kw)) {
        failures.push(`命中排除关键词：${kw}`);
      }
    }
  }

  if (Array.isArray(rules.keywords_must) && rules.keywords_must.length) {
    const blob = `${talent.work_experience || ''} ${talent.skills || ''}`;
    for (const kw of rules.keywords_must) {
      if (kw && !blob.includes(kw)) {
        failures.push(`缺少必备关键词：${kw}`);
      }
    }
  }

  return {
    pass: failures.length === 0,
    failures
  };
};

module.exports = {
  normalizeRules,
  applyRuleScreen
};
