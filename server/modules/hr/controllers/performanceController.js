const db = require('../../../core/database/db-connection');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../../../core/utils/response');

function getPerformances(req, res) {
  try {
    const query = `
      SELECT p.*, u.name as employee_name 
      FROM performances p
      LEFT JOIN users u ON p.employee_id = u.id
      ORDER BY p.evaluation_date DESC
    `;
    db.all(query, [], (err, rows) => {
      if (err) {
        return errorResponse(res, '获取绩效列表失败', err);
      }
      return successResponse(res, rows);
    });
  } catch (error) {
    return errorResponse(res, '获取绩效列表失败', error);
  }
}

function addPerformance(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, '验证失败', errors.array());
    }
    const { employee_id, evaluation_date, score, comments } = req.body;
    const query = `
      INSERT INTO performances (employee_id, evaluation_date, score, comments)
      VALUES (?, ?, ?, ?)
    `;
    db.run(query, [employee_id, evaluation_date, score, comments], function(err) {
      if (err) {
        return errorResponse(res, '添加绩效记录失败', err);
      }
      return successResponse(res, { id: this.lastID, message: '绩效记录添加成功' });
    });
  } catch (error) {
    return errorResponse(res, '添加绩效记录失败', error);
  }
}

function updatePerformance(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, '验证失败', errors.array());
    }
    const { id } = req.params;
    const { employee_id, evaluation_date, score, comments } = req.body;
    const query = `
      UPDATE performances 
      SET employee_id = ?, evaluation_date = ?, score = ?, comments = ?
      WHERE id = ?
    `;
    db.run(query, [employee_id, evaluation_date, score, comments, id], function(err) {
      if (err) {
        return errorResponse(res, '更新绩效记录失败', err);
      }
      return successResponse(res, { message: '绩效记录更新成功' });
    });
  } catch (error) {
    return errorResponse(res, '更新绩效记录失败', error);
  }
}

function deletePerformance(req, res) {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM performances WHERE id = ?';
    db.run(query, [id], function(err) {
      if (err) {
        return errorResponse(res, '删除绩效记录失败', err);
      }
      return successResponse(res, { message: '绩效记录删除成功' });
    });
  } catch (error) {
    return errorResponse(res, '删除绩效记录失败', error);
  }
}

module.exports = {
  getPerformances,
  addPerformance,
  updatePerformance,
  deletePerformance
};