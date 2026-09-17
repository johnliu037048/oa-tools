const db = require('./db-connection');

const columns = [
  { table: 'talent_pool', name: 'raw_resume_text', sql: 'TEXT' },
  { table: 'talent_pool', name: 'ai_match_score', sql: 'REAL' },
  { table: 'talent_pool', name: 'ai_match_summary', sql: 'TEXT' },
  { table: 'talent_pool', name: 'ai_screen_result', sql: 'TEXT' },
  { table: 'talent_pool', name: 'rule_screen_pass', sql: 'INTEGER' },
  { table: 'recruitment_positions', name: 'screening_rules', sql: 'TEXT' },
  { table: 'recruitment_positions', name: 'jd_summary', sql: 'TEXT' },
  { table: 'talent_pool', name: 'job_intention', sql: 'VARCHAR(100)' },
  { table: 'talent_pool', name: 'expected_city', sql: 'VARCHAR(50)' },
  { table: 'talent_pool', name: 'personal_advantages', sql: 'TEXT' },
  { table: 'talent_pool', name: 'project_experience', sql: 'TEXT' },
  { table: 'talent_pool', name: 'certificates', sql: 'TEXT' }
];

const runHRMigrations = () => {
  columns.forEach(({ table, name, sql }) => {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${sql}`, (err) => {
      if (err && !String(err.message).includes('duplicate column')) {
        console.warn(`HR migration skip/fail ${table}.${name}:`, err.message);
      }
    });
  });
};

module.exports = { runHRMigrations };
