#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 初始化系统核心表、HR模块表和财务模块表，并插入完整的示例数据
 * 
 * 位置: server/core/database/system-init.js
 * 运行方式: node server/core/database/system-init.js
 */

const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// 从 server/core/database 目录，引用同目录下的文件
const db = require('./db-connection');
const { initHRDatabase } = require('./hr-tables');
const { initFinanceDatabase } = require('./finance-tables');

console.log('========================================');
console.log('        数据库初始化脚本');
console.log('========================================');
console.log('');

// 检查数据库文件是否存在
const dbPath = path.join(__dirname, 'oa.db');
if (fs.existsSync(dbPath)) {
  console.log('⚠️  数据库文件已存在，将更新表结构和初始数据');
} else {
  console.log('📝 创建新的数据库文件');
}

console.log('');

// 插入系统核心模块示例数据
const insertSystemSampleData = () => {
  return new Promise((resolve, reject) => {
    console.log('正在插入系统核心模块示例数据...');
    
    // 插入更多组织数据
    db.run(`
      INSERT OR REPLACE INTO organizations (id, name, code, parent_id, level, sort_order) VALUES
      (1, '总公司', 'ROOT', 0, 1, 1),
      (2, '技术部', 'TECH', 1, 2, 1),
      (3, '销售部', 'SALES', 1, 2, 2),
      (4, '人事部', 'HR', 1, 2, 3),
      (5, '财务部', 'FINANCE', 1, 2, 4),
      (6, '前端组', 'FRONTEND', 2, 3, 1),
      (7, '后端组', 'BACKEND', 2, 3, 2)
    `, (err) => {
      if (err) {
        console.error('插入组织数据失败:', err.message);
        return reject(err);
      }
      
      // 插入更多岗位数据
      db.run(`
        INSERT OR REPLACE INTO positions (id, name, code, organization_id, level, sort_order) VALUES
        (1, '系统管理员', 'SYS_ADMIN', 1, 1, 1),
        (2, '前端开发工程师', 'FRONTEND_DEV', 6, 2, 1),
        (3, '后端开发工程师', 'BACKEND_DEV', 7, 2, 2),
        (4, '项目经理', 'PROJECT_MANAGER', 2, 2, 3),
        (5, '销售经理', 'SALES_MANAGER', 3, 2, 1),
        (6, 'HR专员', 'HR_SPECIALIST', 4, 2, 1),
        (7, '财务专员', 'FINANCE_SPECIALIST', 5, 2, 1)
      `, (err) => {
        if (err) {
          console.error('插入岗位数据失败:', err.message);
          return reject(err);
        }
        
        // 插入更多用户数据
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run(`
          INSERT OR REPLACE INTO users (id, username, password, real_name, email, phone, organization_id, position_id, status) VALUES
          (1, 'admin', ?, '系统管理员', 'admin@example.com', '13800000001', 1, 1, 1),
          (2, 'zhangsan', ?, '张三', 'zhangsan@example.com', '13800000002', 6, 2, 1),
          (3, 'lisi', ?, '李四', 'lisi@example.com', '13800000003', 7, 3, 1),
          (4, 'wangwu', ?, '王五', 'wangwu@example.com', '13800000004', 3, 5, 1),
          (5, 'zhaoliu', ?, '赵六', 'zhaoliu@example.com', '13800000005', 4, 6, 1),
          (6, 'sunqi', ?, '孙七', 'sunqi@example.com', '13800000006', 5, 7, 1)
        `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword], (err) => {
          if (err) {
            console.error('插入用户数据失败:', err.message);
            return reject(err);
          }
          
          // 插入角色数据
          db.run(`
            INSERT OR REPLACE INTO roles (id, name, code, description, status) VALUES
            (1, '系统管理员', 'ADMIN', '系统管理员，拥有所有权限', 1),
            (2, '部门经理', 'MANAGER', '部门经理，管理本部门', 1),
            (3, '普通员工', 'EMPLOYEE', '普通员工', 1),
            (4, '财务人员', 'FINANCE', '财务人员，管理财务相关', 1),
            (5, 'HR人员', 'HR', 'HR人员，管理人员相关', 1)
          `, (err) => {
            if (err) {
              console.error('插入角色数据失败:', err.message);
              return reject(err);
            }
            
            // 插入用户角色关联
            db.run(`
              INSERT OR REPLACE INTO user_roles (id, user_id, role_id) VALUES
              (1, 1, 1),
              (2, 2, 3),
              (3, 3, 3),
              (4, 4, 2),
              (5, 5, 5),
              (6, 6, 4)
            `, (err) => {
              if (err) {
                console.error('插入用户角色关联失败:', err.message);
                return reject(err);
              }
              
              // 插入菜单数据（包括财务模块）
              const menus = [
                // 主菜单
                { id: 1, name: '首页', path: '/', component: 'Dashboard', icon: 'House', parent_id: 0, level: 1, sort_order: 1, type: 1, status: 1 },
                { id: 7, name: 'HR管理', path: '/hr', component: 'Layout', icon: 'User', parent_id: 0, level: 1, sort_order: 3, type: 1, status: 1 },
                { id: 15, name: '财务管理', path: '/finance', component: 'Layout', icon: 'Money', parent_id: 0, level: 1, sort_order: 4, type: 1, status: 1 },
                { id: 30, name: '工具管理', path: '/tools', component: 'Layout', icon: 'Tools', parent_id: 0, level: 1, sort_order: 5, type: 1, status: 1 },
                // 系统管理子菜单 - 字典管理
                { id: 26, name: '字典管理', path: '/system/dictionary', component: 'system/Dictionary', icon: 'Notebook', parent_id: 2, level: 2, sort_order: 5, type: 1, status: 1 },
                // HR管理子菜单
                { id: 8, name: '招聘管理', path: '/hr/recruitment', component: 'hr/Recruitment', icon: 'UserPlus', parent_id: 7, level: 2, sort_order: 1, type: 1, status: 1 },
                { id: 14, name: '人才库管理', path: '/hr/talent-pool', component: 'hr/TalentPool', icon: 'Briefcase', parent_id: 7, level: 2, sort_order: 2, type: 1, status: 1 },
                { id: 9, name: '入职离职管理', path: '/hr/onboarding', component: 'hr/Onboarding', icon: 'UserCheck', parent_id: 7, level: 2, sort_order: 3, type: 1, status: 1 },
                { id: 10, name: '考勤、请假', path: '/hr/attendance', component: 'hr/Attendance', icon: 'Clock', parent_id: 7, level: 2, sort_order: 4, type: 1, status: 1 },
                { id: 11, name: '薪酬福利管理', path: '/hr/salary', component: 'hr/Salary', icon: 'CurrencyDollar', parent_id: 7, level: 2, sort_order: 5, type: 1, status: 1 },
                { id: 12, name: '档案管理', path: '/hr/employee', component: 'hr/Employee', icon: 'DocumentText', parent_id: 7, level: 2, sort_order: 6, type: 1, status: 1 },
                { id: 13, name: '报表分析', path: '/hr/reports', component: 'hr/Report', icon: 'ChartBar', parent_id: 7, level: 2, sort_order: 7, type: 1, status: 1 },
                // 财务子菜单
                { id: 16, name: '总账', path: '/finance/general-ledger', component: 'finance/GeneralLedger', icon: 'Document', parent_id: 15, level: 2, sort_order: 1, type: 1, status: 1 },
                { id: 17, name: '应收账款', path: '/finance/accounts-receivable', component: 'finance/AccountsReceivable', icon: 'CreditCard', parent_id: 15, level: 2, sort_order: 2, type: 1, status: 1 },
                { id: 18, name: '应付账款', path: '/finance/accounts-payable', component: 'finance/AccountsPayable', icon: 'CreditCard', parent_id: 15, level: 2, sort_order: 3, type: 1, status: 1 },
                { id: 19, name: '固定资产', path: '/finance/fixed-assets', component: 'finance/FixedAssets', icon: 'OfficeBuilding', parent_id: 15, level: 2, sort_order: 4, type: 1, status: 1 },
                { id: 20, name: '资金管理', path: '/finance/cash-management', component: 'finance/CashManagement', icon: 'Wallet', parent_id: 15, level: 2, sort_order: 5, type: 1, status: 1 },
                { id: 21, name: '成本管理', path: '/finance/cost-accounting', component: 'finance/CostAccounting', icon: 'Document', parent_id: 15, level: 2, sort_order: 6, type: 1, status: 1 },
                { id: 22, name: '预算管理', path: '/finance/budgeting', component: 'finance/Budgeting', icon: 'DataAnalysis', parent_id: 15, level: 2, sort_order: 7, type: 1, status: 1 },
                { id: 24, name: '税务管理', path: '/finance/tax-management', component: 'finance/TaxManagement', icon: 'Document', parent_id: 15, level: 2, sort_order: 8, type: 1, status: 1 },
                { id: 25, name: '费用管理', path: '/finance/expense-management', component: 'finance/ExpenseManagement', icon: 'Document', parent_id: 15, level: 2, sort_order: 9, type: 1, status: 1 },
                { id: 23, name: '报表与分析', path: '/finance/financial-reporting', component: 'finance/FinancialReporting', icon: 'Document', parent_id: 15, level: 2, sort_order: 10, type: 1, status: 1 },
                // 工具子菜单
                { id: 31, name: '文件搜索', path: '/tools/file-search', component: 'tools/FileSearch', icon: 'Document', parent_id: 30, level: 2, sort_order: 1, type: 1, status: 1 },
                { id: 32, name: '文本替换', path: '/tools/text-replace', component: 'tools/TextReplace', icon: 'Document', parent_id: 30, level: 2, sort_order: 2, type: 1, status: 1 },
                { id: 33, name: '编码解码工具', path: '/tools/encoding-tools', component: 'tools/EncodingTools', icon: 'Document', parent_id: 30, level: 2, sort_order: 3, type: 1, status: 1 },
                { id: 34, name: '时间戳转换工具', path: '/tools/timestamp-converter', component: 'tools/TimestampConverter', icon: 'Document', parent_id: 30, level: 2, sort_order: 4, type: 1, status: 1 },
                { id: 35, name: 'HTTP调试', path: '/tools/http-debug', component: 'tools/HttpDebug', icon: 'Document', parent_id: 30, level: 2, sort_order: 5, type: 1, status: 1 },
                { id: 36, name: 'JSON格式化', path: '/tools/json-formatter', component: 'tools/JsonFormatter', icon: 'Document', parent_id: 30, level: 2, sort_order: 6, type: 1, status: 1 }
              ];
              
              let menuCount = 0;
              let menuError = false;
              
              menus.forEach(menu => {
                db.run(`
                  INSERT OR REPLACE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [menu.id, menu.name, menu.path, menu.component, menu.icon, menu.parent_id, menu.level, menu.sort_order, menu.type, menu.status], (err) => {
                  if (err) {
                    console.error(`插入菜单 "${menu.name}" 失败:`, err.message);
                    menuError = true;
                  }
                  
                  menuCount++;
                  if (menuCount === menus.length) {
                    if (menuError) {
                      console.warn('⚠️ 部分菜单插入失败，但不影响主流程');
                    }
                    console.log('✓ 系统核心模块示例数据插入完成');
                    resolve();
                  }
                });
              });
            });
          });
        });
      });
    });
  });
};

// 插入字典示例数据
const insertDictionarySampleData = () => {
  return new Promise((resolve, reject) => {
    console.log('正在插入字典示例数据...');
    
    const dictionaries = [
      // 财务模块字典 - 财务报表类型
      { dict_code: 'finance_report_type', dict_name: '财务报表类型', dict_type: 'finance', dict_value: 'balance_sheet', dict_label: '资产负债表', sort_order: 1, status: 1, remark: '财务报表类型' },
      { dict_code: 'finance_report_type', dict_name: '财务报表类型', dict_type: 'finance', dict_value: 'income_statement', dict_label: '利润表', sort_order: 2, status: 1, remark: '财务报表类型' },
      { dict_code: 'finance_report_type', dict_name: '财务报表类型', dict_type: 'finance', dict_value: 'cash_flow', dict_label: '现金流量表', sort_order: 3, status: 1, remark: '财务报表类型' },
      { dict_code: 'finance_report_type', dict_name: '财务报表类型', dict_type: 'finance', dict_value: 'equity_change', dict_label: '所有者权益变动表', sort_order: 4, status: 1, remark: '财务报表类型' },
      // 财务模块字典 - 科目类型
      { dict_code: 'finance_account_type', dict_name: '科目类型', dict_type: 'finance', dict_value: 'asset', dict_label: '资产', sort_order: 1, status: 1, remark: '总账科目类型' },
      { dict_code: 'finance_account_type', dict_name: '科目类型', dict_type: 'finance', dict_value: 'liability', dict_label: '负债', sort_order: 2, status: 1, remark: '总账科目类型' },
      { dict_code: 'finance_account_type', dict_name: '科目类型', dict_type: 'finance', dict_value: 'equity', dict_label: '所有者权益', sort_order: 3, status: 1, remark: '总账科目类型' },
      { dict_code: 'finance_account_type', dict_name: '科目类型', dict_type: 'finance', dict_value: 'revenue', dict_label: '收入', sort_order: 4, status: 1, remark: '总账科目类型' },
      { dict_code: 'finance_account_type', dict_name: '科目类型', dict_type: 'finance', dict_value: 'expense', dict_label: '费用', sort_order: 5, status: 1, remark: '总账科目类型' },
      // 财务模块字典 - 资产类别
      { dict_code: 'finance_asset_category', dict_name: '资产类别', dict_type: 'finance', dict_value: 'electronics', dict_label: '电子设备', sort_order: 1, status: 1, remark: '固定资产类别' },
      { dict_code: 'finance_asset_category', dict_name: '资产类别', dict_type: 'finance', dict_value: 'furniture', dict_label: '办公家具', sort_order: 2, status: 1, remark: '固定资产类别' },
      { dict_code: 'finance_asset_category', dict_name: '资产类别', dict_type: 'finance', dict_value: 'machinery', dict_label: '机械设备', sort_order: 3, status: 1, remark: '固定资产类别' },
      { dict_code: 'finance_asset_category', dict_name: '资产类别', dict_type: 'finance', dict_value: 'vehicle', dict_label: '车辆', sort_order: 4, status: 1, remark: '固定资产类别' },
      { dict_code: 'finance_asset_category', dict_name: '资产类别', dict_type: 'finance', dict_value: 'building', dict_label: '房屋建筑物', sort_order: 5, status: 1, remark: '固定资产类别' },
      { dict_code: 'finance_asset_category', dict_name: '资产类别', dict_type: 'finance', dict_value: 'other', dict_label: '其他', sort_order: 6, status: 1, remark: '固定资产类别' },
      // 财务模块字典 - 账户类型（资金管理）
      { dict_code: 'finance_account_type_cash', dict_name: '账户类型', dict_type: 'finance', dict_value: 'cash', dict_label: '现金', sort_order: 1, status: 1, remark: '资金管理账户类型' },
      { dict_code: 'finance_account_type_cash', dict_name: '账户类型', dict_type: 'finance', dict_value: 'bank', dict_label: '银行存款', sort_order: 2, status: 1, remark: '资金管理账户类型' },
      { dict_code: 'finance_account_type_cash', dict_name: '账户类型', dict_type: 'finance', dict_value: 'other', dict_label: '其他', sort_order: 3, status: 1, remark: '资金管理账户类型' },
      // 财务模块字典 - 成本类型
      { dict_code: 'finance_cost_type', dict_name: '成本类型', dict_type: 'finance', dict_value: 'direct_material', dict_label: '直接材料', sort_order: 1, status: 1, remark: '成本管理类型' },
      { dict_code: 'finance_cost_type', dict_name: '成本类型', dict_type: 'finance', dict_value: 'direct_labor', dict_label: '直接人工', sort_order: 2, status: 1, remark: '成本管理类型' },
      { dict_code: 'finance_cost_type', dict_name: '成本类型', dict_type: 'finance', dict_value: 'manufacturing', dict_label: '制造费用', sort_order: 3, status: 1, remark: '成本管理类型' },
      { dict_code: 'finance_cost_type', dict_name: '成本类型', dict_type: 'finance', dict_value: 'indirect', dict_label: '间接费用', sort_order: 4, status: 1, remark: '成本管理类型' },
      // 财务模块字典 - 预算类别
      { dict_code: 'finance_budget_category', dict_name: '预算类别', dict_type: 'finance', dict_value: 'income', dict_label: '收入预算', sort_order: 1, status: 1, remark: '预算管理类别' },
      { dict_code: 'finance_budget_category', dict_name: '预算类别', dict_type: 'finance', dict_value: 'expense', dict_label: '支出预算', sort_order: 2, status: 1, remark: '预算管理类别' },
      { dict_code: 'finance_budget_category', dict_name: '预算类别', dict_type: 'finance', dict_value: 'capital', dict_label: '资本预算', sort_order: 3, status: 1, remark: '预算管理类别' },
      { dict_code: 'finance_budget_category', dict_name: '预算类别', dict_type: 'finance', dict_value: 'other', dict_label: '其他', sort_order: 4, status: 1, remark: '预算管理类别' },
      // 财务模块字典 - 税种
      { dict_code: 'finance_tax_type', dict_name: '税种', dict_type: 'finance', dict_value: 'vat', dict_label: '增值税', sort_order: 1, status: 1, remark: '税务管理税种' },
      { dict_code: 'finance_tax_type', dict_name: '税种', dict_type: 'finance', dict_value: 'corporate_income', dict_label: '企业所得税', sort_order: 2, status: 1, remark: '税务管理税种' },
      { dict_code: 'finance_tax_type', dict_name: '税种', dict_type: 'finance', dict_value: 'personal_income', dict_label: '个人所得税', sort_order: 3, status: 1, remark: '税务管理税种' },
      { dict_code: 'finance_tax_type', dict_name: '税种', dict_type: 'finance', dict_value: 'stamp', dict_label: '印花税', sort_order: 4, status: 1, remark: '税务管理税种' },
      { dict_code: 'finance_tax_type', dict_name: '税种', dict_type: 'finance', dict_value: 'urban_maintenance', dict_label: '城市维护建设税', sort_order: 5, status: 1, remark: '税务管理税种' },
      { dict_code: 'finance_tax_type', dict_name: '税种', dict_type: 'finance', dict_value: 'education_surcharge', dict_label: '教育费附加', sort_order: 6, status: 1, remark: '税务管理税种' },
      // 财务模块字典 - 费用类型
      { dict_code: 'finance_expense_type', dict_name: '费用类型', dict_type: 'finance', dict_value: 'travel', dict_label: '差旅费', sort_order: 1, status: 1, remark: '费用管理类型' },
      { dict_code: 'finance_expense_type', dict_name: '费用类型', dict_type: 'finance', dict_value: 'office', dict_label: '办公费', sort_order: 2, status: 1, remark: '费用管理类型' },
      { dict_code: 'finance_expense_type', dict_name: '费用类型', dict_type: 'finance', dict_value: 'communication', dict_label: '通讯费', sort_order: 3, status: 1, remark: '费用管理类型' },
      { dict_code: 'finance_expense_type', dict_name: '费用类型', dict_type: 'finance', dict_value: 'training', dict_label: '培训费', sort_order: 4, status: 1, remark: '费用管理类型' },
      // HR模块字典
      { dict_code: 'hr_status', dict_name: 'HR状态', dict_type: 'hr', dict_value: '1', dict_label: '待审核', sort_order: 1, status: 1, remark: 'HR申请状态' },
      { dict_code: 'hr_status', dict_name: 'HR状态', dict_type: 'hr', dict_value: '2', dict_label: '已通过', sort_order: 2, status: 1, remark: 'HR申请状态' },
      { dict_code: 'hr_status', dict_name: 'HR状态', dict_type: 'hr', dict_value: '3', dict_label: '已拒绝', sort_order: 3, status: 1, remark: 'HR申请状态' },
      { dict_code: 'hr_leave_type', dict_name: '请假类型', dict_type: 'hr', dict_value: '1', dict_label: '年假', sort_order: 1, status: 1, remark: '请假类型' },
      { dict_code: 'hr_leave_type', dict_name: '请假类型', dict_type: 'hr', dict_value: '2', dict_label: '病假', sort_order: 2, status: 1, remark: '请假类型' },
      { dict_code: 'hr_leave_type', dict_name: '请假类型', dict_type: 'hr', dict_value: '3', dict_label: '事假', sort_order: 3, status: 1, remark: '请假类型' },
      { dict_code: 'hr_leave_type', dict_name: '请假类型', dict_type: 'hr', dict_value: '4', dict_label: '调休', sort_order: 4, status: 1, remark: '请假类型' },
      { dict_code: 'hr_contract_type', dict_name: '合同类型', dict_type: 'hr', dict_value: 'formal', dict_label: '正式合同', sort_order: 1, status: 1, remark: '合同类型' },
      { dict_code: 'hr_contract_type', dict_name: '合同类型', dict_type: 'hr', dict_value: 'intern', dict_label: '实习合同', sort_order: 2, status: 1, remark: '合同类型' },
      { dict_code: 'hr_contract_type', dict_name: '合同类型', dict_type: 'hr', dict_value: 'temporary', dict_label: '临时合同', sort_order: 3, status: 1, remark: '合同类型' },
    ];
    
    let count = 0;
    let hasError = false;
    
    dictionaries.forEach(dict => {
      db.run(`
        INSERT OR REPLACE INTO dictionaries (dict_code, dict_name, dict_type, dict_value, dict_label, sort_order, status, remark) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [dict.dict_code, dict.dict_name, dict.dict_type, dict.dict_value, dict.dict_label, dict.sort_order, dict.status, dict.remark], (err) => {
        count++;
        if (err) {
          console.error(`插入字典 "${dict.dict_label}" 失败:`, err.message);
          hasError = true;
        }
        
        if (count === dictionaries.length) {
          if (hasError) {
            console.warn('⚠️ 部分字典插入失败，但不影响主流程');
          } else {
            console.log(`✓ 成功插入${dictionaries.length}条字典数据`);
          }
          resolve();
        }
      });
    });
  });
};

// 插入HR模块完整示例数据
const insertHRSampleData = () => {
  return new Promise((resolve, reject) => {
    console.log('正在插入HR模块完整示例数据...');
    
    // 插入招聘职位
    db.run(`
      INSERT OR REPLACE INTO recruitment_positions 
      (id, title, position_id, org_id, description, requirements, salary_range, urgent_level, status) VALUES
      (1, '高级前端开发工程师', 2, 6, '负责公司前端产品开发和维护', '5年以上前端开发经验，熟悉Vue.js、React等框架', '20K-30K', 2, 1),
      (2, 'Java后端开发工程师', 3, 7, '负责公司后端服务开发和维护', '5年以上Java开发经验，熟悉Spring框架', '18K-28K', 2, 1),
      (3, '产品经理', 4, 2, '负责产品规划和设计', '3年以上产品经验，熟悉产品设计流程', '15K-25K', 1, 1),
      (4, '销售专员', 5, 3, '负责产品销售和客户维护', '2年以上销售经验', '8K-15K', 1, 1)
    `, (err) => {
      if (err) {
        console.error('插入招聘职位失败:', err.message);
        return reject(err);
      }
      
      // 插入简历
      db.run(`
        INSERT OR REPLACE INTO resumes 
        (id, name, email, phone, position_id, experience, education, skills, status) VALUES
        (1, '张三', 'zhangsan@example.com', '13800138001', 1, '5年前端开发经验，曾在多家公司担任前端开发工程师', '本科', 'Vue.js, React, JavaScript, TypeScript, Node.js', 1),
        (2, '李四', 'lisi@example.com', '13800138002', 2, '4年Java开发经验，熟悉微服务架构', '本科', 'Java, Spring, MySQL, Redis, Docker', 1),
        (3, '王五', 'wangwu@example.com', '13800138003', 3, '3年产品经验，负责过多个产品项目', '硕士', '产品设计, 用户研究, 原型设计', 1)
      `, (err) => {
        if (err) {
          console.error('插入简历失败:', err.message);
          return reject(err);
        }
        
        // 插入入职申请
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
        db.run(`
          INSERT OR REPLACE INTO onboarding_applications 
          (id, user_id, position_id, org_id, start_date, salary, contract_type, notes, status) VALUES
          (1, 2, 2, 6, '${nextMonth.toISOString().split('T')[0]}', 20000, 'formal', '通过面试，准备入职', 1),
          (2, 3, 3, 7, '${nextMonth.toISOString().split('T')[0]}', 18000, 'formal', '通过面试，准备入职', 1)
        `, (err) => {
          if (err) {
            console.error('插入入职申请失败:', err.message);
            return reject(err);
          }
          
          // 插入离职申请
          db.run(`
            INSERT OR REPLACE INTO offboarding_applications 
            (id, user_id, leave_date, reason, handover_notes, status) VALUES
            (1, 4, '${new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString().split('T')[0]}', '个人原因', '工作已交接给王五', 1)
          `, (err) => {
            if (err) {
              console.error('插入离职申请失败:', err.message);
              return reject(err);
            }
            
            // 插入考勤记录（生成过去12个月的完整数据，覆盖所有员工）
            const attendanceRecords = [];
            let recordId = 1;
            
            // 所有用户及其岗位ID：1-admin(1), 2-zhangsan(2), 3-lisi(3), 4-wangwu(5), 5-zhaoliu(6), 6-sunqi(7)
            const users = [
              { user_id: 1, position_id: 1 }, // 系统管理员
              { user_id: 2, position_id: 2 }, // 张三-前端
              { user_id: 3, position_id: 3 }, // 李四-后端
              { user_id: 4, position_id: 5 }, // 王五-销售
              { user_id: 5, position_id: 6 }, // 赵六-HR
              { user_id: 6, position_id: 7 }  // 孙七-财务
            ];
            
            // 生成过去12个月的数据
            for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
              const monthDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
              const year = monthDate.getFullYear();
              const month = monthDate.getMonth() + 1;
              const daysInMonth = new Date(year, month, 0).getDate();
              
              // 为每个用户生成该月的工作日考勤记录
              users.forEach((user) => {
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month - 1, day);
                  const dayOfWeek = date.getDay();
                  
                  // 只生成工作日（周一到周五）的考勤，周末跳过
                  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    
                    // 随机生成不同的签到时间（8:30-10:00）和签退时间（17:30-19:30）
                    const checkinHour = 8 + Math.floor(Math.random() * 2);
                    const checkinMinute = 30 + Math.floor(Math.random() * 30);
                    const checkoutHour = 17 + Math.floor(Math.random() * 2);
                    const checkoutMinute = 30 + Math.floor(Math.random() * 30);
                    
                    // 偶尔有缺勤的情况（5%概率）
                    const isAbsent = Math.random() < 0.05;
                    
                    const checkinTime = isAbsent ? 'NULL' : `'${dateStr} ${String(checkinHour).padStart(2, '0')}:${String(checkinMinute).padStart(2, '0')}:00'`;
                    const checkoutTime = isAbsent ? 'NULL' : `'${dateStr} ${String(checkoutHour).padStart(2, '0')}:${String(checkoutMinute).padStart(2, '0')}:00'`;
                    
                    attendanceRecords.push(`(${recordId}, ${user.user_id}, ${user.position_id}, '${dateStr}', ${checkinTime}, ${checkoutTime}, '办公室', '办公室', NULL, NULL)`);
                    recordId++;
                  }
                }
              });
            }
            
            // 分批插入考勤记录（避免SQL语句过长）
            console.log(`📊 正在生成考勤记录数据（共 ${attendanceRecords.length} 条）...`);
            const batchSize = 500;
            let insertedCount = 0;
            
            const insertBatch = (batchIndex) => {
              const start = batchIndex * batchSize;
              const end = Math.min(start + batchSize, attendanceRecords.length);
              const batch = attendanceRecords.slice(start, end);
              
              if (batch.length === 0) {
                console.log(`✓ 考勤记录插入完成（共 ${insertedCount} 条）`);
                
                // 继续插入请假申请
                db.run(`
                  INSERT OR REPLACE INTO leave_applications 
                  (id, user_id, position_id, type, start_date, end_date, reason, emergency_contact, status) VALUES
                  (1, 2, 2, 'annual', '${new Date(today.getFullYear(), today.getMonth() + 1, 20).toISOString().split('T')[0]}', 
                   '${new Date(today.getFullYear(), today.getMonth() + 1, 22).toISOString().split('T')[0]}', '年假', '13800000001', 1),
                  (2, 3, 3, 'sick', '${today.toISOString().split('T')[0]}', '${today.toISOString().split('T')[0]}', '生病请假', '13800000002', 1),
                  (3, 2, 2, 'personal', '${new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString().split('T')[0]}', 
                   '${new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString().split('T')[0]}', '事假', '13800000003', 1)
                `, (err) => {
                  if (err) {
                    console.error('插入请假申请失败:', err.message);
                    return reject(err);
                  }
                  
                  // 继续插入薪酬记录...
                  insertSalaryRecords();
                });
                return;
              }
              
              db.run(`
                INSERT OR REPLACE INTO attendance_records 
                (id, user_id, position_id, date, checkin_time, checkout_time, checkin_location, checkout_location, checkin_notes, checkout_notes)
                VALUES ${batch.join(',')}
              `, (err) => {
                if (err) {
                  console.error(`插入考勤记录批次 ${batchIndex + 1} 失败:`, err.message);
                  return reject(err);
                }
                insertedCount += batch.length;
                process.stdout.write(`\r  进度: ${insertedCount}/${attendanceRecords.length} (${Math.round(insertedCount/attendanceRecords.length*100)}%)`);
                insertBatch(batchIndex + 1);
              });
            };
            
            // 插入薪酬记录函数（在考勤记录插入完成后调用）
            const insertSalaryRecords = () => {
              // 插入请假申请
              db.run(`
                INSERT OR REPLACE INTO leave_applications 
                (id, user_id, position_id, type, start_date, end_date, reason, emergency_contact, status) VALUES
                (1, 2, 2, 'annual', '${new Date(today.getFullYear(), today.getMonth() + 1, 20).toISOString().split('T')[0]}', 
                 '${new Date(today.getFullYear(), today.getMonth() + 1, 22).toISOString().split('T')[0]}', '年假', '13800000001', 1),
                (2, 3, 3, 'sick', '${today.toISOString().split('T')[0]}', '${today.toISOString().split('T')[0]}', '生病请假', '13800000002', 1),
                (3, 2, 2, 'personal', '${new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString().split('T')[0]}', 
                 '${new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString().split('T')[0]}', '事假', '13800000003', 1)
              `, (err) => {
                if (err) {
                  console.error('插入请假申请失败:', err.message);
                  return reject(err);
                }
                
                // 插入薪酬记录（生成2025年全年数据，覆盖所有员工）
                const salaryRecords = [];
                let salaryRecordId = 1;
                
                // 定义不同岗位的薪酬范围（基础工资、奖金范围、津贴、扣除）
                const salaryConfigs = {
                  1: { base: 25000, bonusRange: [3000, 8000], allowance: 3000, deduction: 1500 }, // 系统管理员
                  2: { base: 20000, bonusRange: [2000, 6000], allowance: 2000, deduction: 1000 }, // 前端开发
                  3: { base: 22000, bonusRange: [2500, 7000], allowance: 2500, deduction: 1200 }, // 后端开发
                  4: { base: 18000, bonusRange: [1500, 5000], allowance: 1500, deduction: 800 },  // 项目经理
                  5: { base: 15000, bonusRange: [1000, 8000], allowance: 1000, deduction: 500 },   // 销售经理（奖金波动大）
                  6: { base: 12000, bonusRange: [1000, 4000], allowance: 1500, deduction: 600 }, // HR专员
                  7: { base: 13000, bonusRange: [1000, 4000], allowance: 1500, deduction: 700 }    // 财务专员
                };
                
                // 所有用户及其岗位ID
                const salaryUsers = [
                  { user_id: 1, position_id: 1 }, // 系统管理员
                  { user_id: 2, position_id: 2 }, // 张三-前端
                  { user_id: 3, position_id: 3 }, // 李四-后端
                  { user_id: 4, position_id: 5 }, // 王五-销售
                  { user_id: 5, position_id: 6 }, // 赵六-HR
                  { user_id: 6, position_id: 7 }  // 孙七-财务
                ];
                
                // 生成2025年全年（1-12月）的薪酬数据
                const targetYear = 2025;
                for (let month = 1; month <= 12; month++) {
                  salaryUsers.forEach((user) => {
                    const config = salaryConfigs[user.position_id] || salaryConfigs[2];
                    
                    // 随机生成奖金（在范围内）
                    const bonus = config.bonusRange[0] + 
                      Math.floor(Math.random() * (config.bonusRange[1] - config.bonusRange[0]));
                    
                    // 偶尔有特别奖金（10%概率）
                    const hasExtraBonus = Math.random() < 0.1;
                    const finalBonus = hasExtraBonus ? bonus + 2000 : bonus;
                    
                    salaryRecords.push(
                      `(${salaryRecordId}, ${user.user_id}, ${targetYear}, ${month}, ${config.base}, ${finalBonus}, ${config.allowance}, ${config.deduction}, '${targetYear}年${month}月薪酬')`
                    );
                    salaryRecordId++;
                  });
                }
                
                console.log(`💰 正在生成薪酬记录数据（共 ${salaryRecords.length} 条）...`);
                
                // 分批插入薪酬记录（避免SQL语句过长）
                const salaryBatchSize = 500;
                let salaryInsertedCount = 0;
                
                const insertSalaryBatch = (batchIndex) => {
                  const start = batchIndex * salaryBatchSize;
                  const end = Math.min(start + salaryBatchSize, salaryRecords.length);
                  const batch = salaryRecords.slice(start, end);
                  
                  if (batch.length === 0) {
                    console.log(`✓ 薪酬记录插入完成（共 ${salaryInsertedCount} 条）`);
                    
                    // 继续插入员工档案
                    db.run(`
                      INSERT OR REPLACE INTO employee_files 
                      (id, user_id, employee_id, position_id, org_id, department, personal_info, work_info, education_info, family_info) VALUES
                      (1, 2, 'EMP001', 2, 6, '技术部-前端组', '{"age": 28, "gender": "男", "marital_status": "未婚", "id_card": "110101199001011234"}', 
                       '{"join_date": "2024-01-15", "work_years": 5, "contract_type": "formal"}', 
                       '{"education": "本科", "school": "XX大学", "major": "计算机科学"}', '{"spouse": "", "children": []}'),
                      (2, 3, 'EMP002', 3, 7, '技术部-后端组', '{"age": 26, "gender": "女", "marital_status": "已婚", "id_card": "110101199501011234"}', 
                       '{"join_date": "2024-02-01", "work_years": 4, "contract_type": "formal"}', 
                       '{"education": "本科", "school": "YY大学", "major": "软件工程"}', '{"spouse": "XXX", "children": []}'),
                      (3, 4, 'EMP003', 5, 3, '销售部', '{"age": 30, "gender": "男", "marital_status": "已婚", "id_card": "110101199001011234"}', 
                       '{"join_date": "2023-06-01", "work_years": 3, "contract_type": "formal"}', 
                       '{"education": "大专", "school": "ZZ大学", "major": "市场营销"}', '{"spouse": "YYY", "children": ["孩子1"]}')
                    `, (err) => {
                      if (err) {
                        console.error('插入员工档案失败:', err.message);
                        return reject(err);
                      }
                      
                      console.log('✓ HR模块完整示例数据插入完成');
                      resolve();
                    });
                    return;
                  }
                  
                  db.run(`
                    INSERT OR REPLACE INTO salary_records 
                    (id, user_id, year, month, base_salary, bonus, allowance, deduction, notes)
                    VALUES ${batch.join(',')}
                  `, (err) => {
                    if (err) {
                      console.error(`插入薪酬记录批次 ${batchIndex + 1} 失败:`, err.message);
                      return reject(err);
                    }
                    salaryInsertedCount += batch.length;
                    const progress = Math.round((salaryInsertedCount / salaryRecords.length) * 100);
                    process.stdout.write(`\r  进度: ${salaryInsertedCount}/${salaryRecords.length} (${progress}%)`);
                    insertSalaryBatch(batchIndex + 1);
                  });
                };
              
                // 开始分批插入薪酬记录
                insertSalaryBatch(0);
              });
            };
            
            // 开始分批插入考勤记录
            insertBatch(0);
            
            // 注意：薪酬记录和员工档案的插入会在考勤记录插入完成后自动执行
          });
        });
      });
    });
  });
};

// 插入财务模块完整示例数据
const insertFinanceSampleData = () => {
  return new Promise((resolve, reject) => {
    console.log('正在插入财务模块完整示例数据...');
    
    // 插入总账科目（已存在于finance-tables.js，这里补充更多）
    db.run(`
      INSERT OR REPLACE INTO general_ledger_accounts 
      (id, code, name, type, parent_id, level, status) VALUES
      (1, '1001', '库存现金', 'asset', 0, 1, 1),
      (2, '1002', '银行存款', 'asset', 0, 1, 1),
      (3, '1002.01', '工商银行', 'asset', 2, 2, 1),
      (4, '1002.02', '建设银行', 'asset', 2, 2, 1),
      (5, '2001', '短期借款', 'liability', 0, 1, 1),
      (6, '4001', '实收资本', 'equity', 0, 1, 1),
      (7, '5001', '主营业务收入', 'revenue', 0, 1, 1),
      (8, '6001', '主营业务成本', 'expense', 0, 1, 1),
      (9, '6002', '管理费用', 'expense', 0, 1, 1),
      (10, '6003', '销售费用', 'expense', 0, 1, 1)
    `, (err) => {
      if (err) {
        console.error('插入总账科目失败:', err.message);
        return reject(err);
      }
      
      // 插入应收账款
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 30);
      db.run(`
        INSERT OR REPLACE INTO accounts_receivable 
        (id, customer_name, invoice_number, amount, due_date, description, status) VALUES
        (1, 'ABC科技有限公司', 'INV-2025-001', 50000.00, '${nextMonth.toISOString().split('T')[0]}', '2025年1月产品采购', 1),
        (2, 'XYZ贸易公司', 'INV-2025-002', 30000.00, '${nextMonth.toISOString().split('T')[0]}', '2025年1月服务费', 1),
        (3, 'DEF制造企业', 'INV-2025-003', 80000.00, '${new Date(today.getFullYear(), today.getMonth() + 2, 15).toISOString().split('T')[0]}', '2025年2月设备销售', 1)
      `, (err) => {
        if (err) {
          console.error('插入应收账款失败:', err.message);
          return reject(err);
        }
        
        // 插入应收账款收款记录
        db.run(`
          INSERT OR REPLACE INTO accounts_receivable_payments 
          (id, account_id, amount, payment_date, payment_method, notes) VALUES
          (1, 1, 20000.00, '${today.toISOString().split('T')[0]}', 'bank_transfer', '部分收款'),
          (2, 2, 30000.00, '${today.toISOString().split('T')[0]}', 'bank_transfer', '全额收款')
        `, (err) => {
          if (err) {
            console.error('插入应收账款收款记录失败:', err.message);
            return reject(err);
          }
          
          // 插入应付账款
          db.run(`
            INSERT OR REPLACE INTO accounts_payable 
            (id, supplier_name, invoice_number, amount, due_date, description, status) VALUES
            (1, '供应商A', 'INV-SUP-001', 25000.00, '${nextMonth.toISOString().split('T')[0]}', '2025年1月原材料采购', 1),
            (2, '供应商B', 'INV-SUP-002', 15000.00, '${nextMonth.toISOString().split('T')[0]}', '2025年1月设备采购', 1),
            (3, '服务商C', 'INV-SUP-003', 10000.00, '${new Date(today.getFullYear(), today.getMonth() + 2, 10).toISOString().split('T')[0]}', '2025年2月服务费', 1)
          `, (err) => {
            if (err) {
              console.error('插入应付账款失败:', err.message);
              return reject(err);
            }
            
            // 插入应付账款付款记录
            db.run(`
              INSERT OR REPLACE INTO accounts_payable_payments 
              (id, account_id, amount, payment_date, payment_method, notes) VALUES
              (1, 1, 10000.00, '${today.toISOString().split('T')[0]}', 'bank_transfer', '部分付款'),
              (2, 2, 15000.00, '${today.toISOString().split('T')[0]}', 'bank_transfer', '全额付款')
            `, (err) => {
              if (err) {
                console.error('插入应付账款付款记录失败:', err.message);
                return reject(err);
              }
              
              // 插入固定资产
              db.run(`
                INSERT OR REPLACE INTO fixed_assets 
                (id, name, code, category, purchase_price, purchase_date, depreciation_method, useful_life, description) VALUES
                (1, '办公电脑', 'FA-001', '电子设备', 5000.00, '2024-01-15', 'straight_line', 3, 'Dell办公电脑'),
                (2, '办公桌', 'FA-002', '办公家具', 2000.00, '2024-01-20', 'straight_line', 5, '实木办公桌'),
                (3, '打印机', 'FA-003', '电子设备', 3000.00, '2024-02-01', 'straight_line', 5, 'HP激光打印机'),
                (4, '服务器', 'FA-004', '电子设备', 50000.00, '2024-03-01', 'straight_line', 5, 'Dell服务器')
              `, (err) => {
                if (err) {
                  console.error('插入固定资产失败:', err.message);
                  return reject(err);
                }
                
                // 插入固定资产折旧记录
                db.run(`
                  INSERT OR REPLACE INTO fixed_asset_depreciation 
                  (id, asset_id, depreciation_amount, depreciation_date, notes) VALUES
                  (1, 1, 138.89, '${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]}', '2025年1月折旧'),
                  (2, 2, 33.33, '${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]}', '2025年1月折旧'),
                  (3, 3, 50.00, '${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]}', '2025年1月折旧'),
                  (4, 4, 833.33, '${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]}', '2025年1月折旧')
                `, (err) => {
                  if (err) {
                    console.error('插入固定资产折旧记录失败:', err.message);
                    return reject(err);
                  }
                  
                  // 插入资金流水（最近30天）
                  const transactions = [];
                  for (let i = 0; i < 30; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const amount = Math.random() * 10000 + 1000;
                    const type = Math.random() > 0.5 ? 'income' : 'expense';
                    transactions.push(`(${i + 1}, 1, '${type}', ${amount.toFixed(2)}, '${dateStr}', '${type === 'income' ? '销售收入' : '办公费用'}', '${type === 'income' ? '销售收入' : '管理费用'}', '日常交易')`);
                  }
                  
                  db.run(`
                    INSERT OR REPLACE INTO cash_transactions 
                    (id, account_id, type, amount, transaction_date, description, category, notes)
                    VALUES ${transactions.join(',')}
                  `, (err) => {
                    if (err) {
                      console.error('插入资金流水失败:', err.message);
                      return reject(err);
                    }
                    
                    // 插入成本分配
                    db.run(`
                      INSERT OR REPLACE INTO cost_allocations 
                      (id, from_center, to_center, amount, allocation_date, description, notes) VALUES
                      (1, 1, 2, 5000.00, '${today.toISOString().split('T')[0]}', '管理部门费用分摊到销售部门', '2025年1月成本分配'),
                      (2, 1, 3, 8000.00, '${today.toISOString().split('T')[0]}', '管理部门费用分摊到生产部门', '2025年1月成本分配')
                    `, (err) => {
                      if (err) {
                        console.error('插入成本分配失败:', err.message);
                        return reject(err);
                      }
                      
                      // 插入费用申请
                      db.run(`
                        INSERT OR REPLACE INTO expense_applications 
                        (id, user_id, category, amount, application_date, description, status) VALUES
                        (1, 2, 'travel', 2000.00, '${today.toISOString().split('T')[0]}', '出差住宿费', 'pending'),
                        (2, 3, 'office', 500.00, '${today.toISOString().split('T')[0]}', '办公用品采购', 'approved'),
                        (3, 4, 'meals', 800.00, '${new Date(today.getFullYear(), today.getMonth() - 1, 25).toISOString().split('T')[0]}', '客户招待费', 'approved'),
                        (4, 5, 'training', 1500.00, '${today.toISOString().split('T')[0]}', '培训费', 'pending')
                      `, (err) => {
                        if (err) {
                          console.error('插入费用申请失败:', err.message);
                          return reject(err);
                        }
                        
                        // 插入税务申报
                        db.run(`
                          INSERT OR REPLACE INTO tax_declarations 
                          (id, tax_type, period, amount, declaration_date, due_date, description, status) VALUES
                          (1, 'vat', '2025-01', 13000.00, '${today.toISOString().split('T')[0]}', '2025-02-15', '2025年1月增值税申报', 1),
                          (2, 'corporate_income', '2024-12', 125000.00, '${today.toISOString().split('T')[0]}', '2025-05-31', '2024年12月企业所得税申报', 1),
                          (3, 'vat', '2025-02', 15000.00, NULL, '2025-03-15', '2025年2月增值税申报（待申报）', 0)
                        `, (err) => {
                          if (err) {
                            console.error('插入税务申报失败:', err.message);
                            return reject(err);
                          }
                          
                          console.log('✓ 财务模块完整示例数据插入完成');
                          resolve();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

// 等待系统核心数据库初始化完成
const waitForInit = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='organizations'", (err, row) => {
        if (err) {
          console.error('检查数据库状态失败:', err.message);
          process.exit(1);
        }
        if (!row) {
          console.error('❌ 核心数据库表未创建成功');
          process.exit(1);
        }
        resolve();
      });
    }, 500);
  });
};

// 检查表是否存在
const checkTableExists = (tableName) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
};

// 等待表创建完成
const waitForTables = async (tableNames, timeout = 10000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const allExist = await Promise.all(tableNames.map(name => checkTableExists(name)));
    if (allExist.every(exists => exists)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
};

// 设置默认管理员密码
const setAdminPassword = () => {
  console.log('正在设置默认管理员密码...');
  
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  db.run(
    `UPDATE users SET password = ? WHERE username = 'admin'`,
    [hashedPassword],
    function(err) {
      if (err) {
        console.error('❌ 设置管理员密码失败:', err.message);
        process.exit(1);
      } else {
        if (this.changes === 0) {
          db.run(
            `INSERT OR IGNORE INTO users (id, username, password, real_name, email, organization_id, position_id) 
             VALUES (1, 'admin', ?, '系统管理员', 'admin@example.com', 1, 1)`,
            [hashedPassword],
            function(err) {
              if (err) {
                console.error('❌ 创建管理员用户失败:', err.message);
                process.exit(1);
              } else {
                console.log('✓ 默认管理员密码设置完成');
                printSummary();
              }
            }
          );
        } else {
          console.log('✓ 默认管理员密码设置完成');
          printSummary();
        }
      }
    }
  );
};

// 打印初始化总结
const printSummary = () => {
  console.log('');
  console.log('========================================');
  console.log('        数据库初始化完成');
  console.log('========================================');
  console.log('');
  console.log('🔑 默认账号信息:');
  console.log('   用户名: admin');
  console.log('   密码: admin123');
  console.log('');
  console.log('📊 已初始化模块和示例数据:');
  console.log('   ✓ 系统核心模块（组织、岗位、用户、菜单、角色）- 6个组织, 7个岗位, 6个用户');
  console.log('   ✓ HR管理模块（招聘、入职、离职、考勤、请假、薪酬、档案）- 完整示例数据');
  console.log('   ✓ 财务管理模块（总账、应收应付、固定资产、现金、预算、费用、税务）- 完整示例数据');
  console.log('');
  console.log('🚀 下一步:');
  console.log('   npm run dev        # 启动开发服务器');
  console.log('   或');
  console.log('   bat\\start.bat     # 使用批处理脚本启动');
  console.log('');
  
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接时出错:', err.message);
      process.exit(1);
    } else {
      console.log('数据库连接已关闭');
      process.exit(0);
    }
  });
};

// 执行初始化流程
const runInit = async () => {
  try {
    console.log('正在初始化系统核心模块...');
    await waitForInit();
    console.log('✓ 系统核心模块初始化完成 (1/3)');
    console.log('');
    
    // 插入系统核心模块示例数据
    await insertSystemSampleData();
    console.log('');
    
    console.log('正在初始化HR模块...');
    initHRDatabase();
    
    const hrTables = [
      'recruitment_positions',
      'resumes',
      'onboarding_applications',
      'offboarding_applications',
      'attendance_records',
      'leave_applications',
      'salary_records',
      'employee_files'
    ];
    
    const hrTablesReady = await waitForTables(hrTables);
    if (!hrTablesReady) {
      console.error('❌ HR模块表创建超时');
      process.exit(1);
    }
    console.log('✓ HR模块初始化完成 (2/3)');
    console.log('');
    
    // 等待HR模块示例数据插入完成，然后插入更多数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    await insertHRSampleData();
    console.log('');
    
    console.log('正在初始化财务模块...');
    initFinanceDatabase();
    
    const financeTables = [
      'general_ledger_accounts',
      'general_ledger_vouchers',
      'general_ledger_entries',
      'accounts_receivable',
      'accounts_receivable_payments',
      'accounts_payable',
      'accounts_payable_payments',
      'fixed_assets',
      'fixed_asset_depreciation',
      'cash_accounts',
      'cash_transactions',
      'cost_centers',
      'cost_allocations',
      'budgets',
      'expense_applications',
      'tax_declarations'
    ];
    
    const financeTablesReady = await waitForTables(financeTables);
    if (!financeTablesReady) {
      console.error('❌ 财务模块表创建超时');
      process.exit(1);
    }
    console.log('✓ 财务模块初始化完成 (3/3)');
    console.log('');
    
    // 等待财务模块示例数据插入完成，然后插入更多数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    await insertFinanceSampleData();
    console.log('');
    
    // 插入字典示例数据
    await insertDictionarySampleData();
    console.log('');
    
    // 再等待一小段时间确保数据插入完成
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAdminPassword();
  } catch (error) {
    console.error('初始化过程中出错:', error.message);
    process.exit(1);
  }
};

// 开始初始化
runInit();

