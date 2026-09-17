const db = require('../../../core/database/db-connection');
const { scoreResumeAgainstJob } = require('./resumeLlmService');
const { applyRuleScreen, normalizeRules } = require('./resumeScreening');

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });

const screenOneTalent = async (talentId, recruitmentPositionId) => {
  const talent = await dbGet('SELECT * FROM talent_pool WHERE id = ?', [talentId]);
  if (!talent) {
    throw new Error('人才不存在');
  }

  const job = await dbGet('SELECT * FROM recruitment_positions WHERE id = ?', [recruitmentPositionId]);
  if (!job) {
    throw new Error('招聘职位不存在');
  }

  const rules = normalizeRules(job.screening_rules);
  const ruleResult = applyRuleScreen(talent, rules);

  let screenPayload;
  if (!ruleResult.pass) {
    screenPayload = {
      pass: false,
      score: 0,
      summary: '未通过规则预筛',
      rule_failures: ruleResult.failures,
      matched_skills: [],
      gaps: ruleResult.failures,
      hard_fail_reasons: ruleResult.failures,
      mode: 'rules'
    };
  } else {
    const llmResult = await scoreResumeAgainstJob({
      job,
      rules,
      talent,
      rawText: talent.raw_resume_text
    });
    screenPayload = {
      ...llmResult,
      rule_failures: [],
      pass: llmResult.pass !== false
    };
  }

  await dbRun(
    `UPDATE talent_pool SET
      recruitment_position_id = ?,
      rule_screen_pass = ?,
      ai_match_score = ?,
      ai_match_summary = ?,
      ai_screen_result = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      recruitmentPositionId,
      ruleResult.pass ? 1 : 0,
      screenPayload.score ?? null,
      screenPayload.summary || '',
      JSON.stringify(screenPayload),
      talentId
    ]
  );

  return screenPayload;
};

const batchScreenTalents = async ({
  recruitment_position_id,
  only_unscored = true,
  limit = 200
}) => {
  let sql = 'SELECT id FROM talent_pool WHERE 1=1';
  const params = [];
  if (only_unscored) {
    sql += ' AND ai_match_score IS NULL';
  }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit, 10));

  const rows = await dbAll(sql, params);
  const results = [];
  for (const row of rows) {
    try {
      const data = await screenOneTalent(row.id, recruitment_position_id);
      results.push({ id: row.id, ok: true, data });
    } catch (err) {
      results.push({ id: row.id, ok: false, error: err.message });
    }
  }
  return {
    total: rows.length,
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results
  };
};

module.exports = {
  screenOneTalent,
  batchScreenTalents
};
