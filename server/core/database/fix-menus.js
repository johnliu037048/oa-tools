#!/usr/bin/env node

/**
 * 修复菜单数据脚本
 * 用于快速添加缺失的菜单（HR子菜单和字典管理）
 */

const db = require('./db-connection');
const path = require('path');

console.log('========================================');
console.log('        修复菜单数据');
console.log('========================================');
console.log('');

// 要插入或更新的菜单数据
const menus = [
  // 主菜单项
  { id: 7, name: 'HR管理', path: '/hr', component: null, icon: 'Users', parent_id: 0, level: 1, sort_order: 2, type: 1, status: 1 },
  { id: 20, name: '财务管理', path: '/finance', component: null, icon: 'CreditCard', parent_id: 0, level: 1, sort_order: 3, type: 1, status: 1 },
  { id: 30, name: '工具箱', path: '/tools', component: null, icon: 'Tool', parent_id: 0, level: 1, sort_order: 4, type: 1, status: 1 },

  // HR管理子菜单
  { id: 8, name: '招聘管理', path: '/hr/recruitment', component: 'hr/Recruitment', icon: 'UserPlus', parent_id: 7, level: 2, sort_order: 1, type: 1, status: 1 },
  { id: 14, name: '人才库管理', path: '/hr/talent-pool', component: 'hr/TalentPool', icon: 'Briefcase', parent_id: 7, level: 2, sort_order: 2, type: 1, status: 1 },
  { id: 9, name: '入职离职管理', path: '/hr/onboarding', component: 'hr/Onboarding', icon: 'UserCheck', parent_id: 7, level: 2, sort_order: 3, type: 1, status: 1 },
  { id: 10, name: '考勤、请假', path: '/hr/attendance', component: 'hr/Attendance', icon: 'Clock', parent_id: 7, level: 2, sort_order: 4, type: 1, status: 1 },
  { id: 11, name: '薪酬福利管理', path: '/hr/salary', component: 'hr/Salary', icon: 'CurrencyDollar', parent_id: 7, level: 2, sort_order: 5, type: 1, status: 1 },
  { id: 12, name: '档案管理', path: '/hr/employee', component: 'hr/Employee', icon: 'DocumentText', parent_id: 7, level: 2, sort_order: 6, type: 1, status: 1 },
  { id: 13, name: '报表分析', path: '/hr/reports', component: 'hr/Report', icon: 'ChartBar', parent_id: 7, level: 2, sort_order: 7, type: 1, status: 1 },
  { id: 15, name: '绩效管理', path: '/hr/performance', component: 'hr/Performance', icon: 'Star', parent_id: 7, level: 2, sort_order: 8, type: 1, status: 1 },
  // 系统管理子菜单 - 字典管理
  { id: 26, name: '字典管理', path: '/system/dictionary', component: 'system/Dictionary', icon: 'Notebook', parent_id: 2, level: 2, sort_order: 5, type: 1, status: 1 },
  
  // 财务管理子菜单
  { id: 21, name: '总账', path: '/finance/general-ledger', component: 'finance/GeneralLedger', icon: 'Book', parent_id: 20, level: 2, sort_order: 1, type: 1, status: 1 },
  { id: 22, name: '应收账款', path: '/finance/accounts-receivable', component: 'finance/AccountsReceivable', icon: 'ArrowDownTray', parent_id: 20, level: 2, sort_order: 2, type: 1, status: 1 },
  { id: 23, name: '应付账款', path: '/finance/accounts-payable', component: 'finance/AccountsPayable', icon: 'ArrowUpTray', parent_id: 20, level: 2, sort_order: 3, type: 1, status: 1 },
  { id: 24, name: '固定资产', path: '/finance/fixed-assets', component: 'finance/FixedAssets', icon: 'Building', parent_id: 20, level: 2, sort_order: 4, type: 1, status: 1 },
  { id: 25, name: '资金管理', path: '/finance/cash-management', component: 'finance/CashManagement', icon: 'CurrencyDollar', parent_id: 20, level: 2, sort_order: 5, type: 1, status: 1 },
  { id: 27, name: '成本管理', path: '/finance/cost-accounting', component: 'finance/CostAccounting', icon: 'Calculator', parent_id: 20, level: 2, sort_order: 6, type: 1, status: 1 },
  { id: 28, name: '预算管理', path: '/finance/budgeting', component: 'finance/Budgeting', icon: 'ChartPie', parent_id: 20, level: 2, sort_order: 7, type: 1, status: 1 },
  { id: 29, name: '税务管理', path: '/finance/tax-management', component: 'finance/TaxManagement', icon: 'Document', parent_id: 20, level: 2, sort_order: 8, type: 1, status: 1 },
  { id: 37, name: '费用管理', path: '/finance/expense-management', component: 'finance/ExpenseManagement', icon: 'Receipt', parent_id: 20, level: 2, sort_order: 9, type: 1, status: 1 },
  { id: 38, name: '报表与分析', path: '/finance/financial-reporting', component: 'finance/FinancialReporting', icon: 'ChartBar', parent_id: 20, level: 2, sort_order: 10, type: 1, status: 1 },

  // 工具子菜单（用于快速修复/添加）
  { id: 31, name: 'HTTP调试', path: '/tools/http-debug', component: 'tools/HttpDebug', icon: 'Document', parent_id: 30, level: 2, sort_order: 1, type: 1, status: 1 },
  { id: 32, name: 'JSON格式化', path: '/tools/json-formatter', component: 'tools/JsonFormatter', icon: 'Document', parent_id: 30, level: 2, sort_order: 2, type: 1, status: 1 },
  { id: 33, name: '文档转换', path: '/tools/convert-docs', component: 'tools/ConvertDocuments', icon: 'Document', parent_id: 30, level: 2, sort_order: 3, type: 1, status: 1 },
  { id: 34, name: '图片/视频转换', path: '/tools/media-converter', component: 'tools/MediaConverter', icon: 'Document', parent_id: 30, level: 2, sort_order: 4, type: 1, status: 1 },
  { id: 35, name: '绘图', path: '/tools/drawing', component: 'tools/Drawing', icon: 'Document', parent_id: 30, level: 2, sort_order: 5, type: 1, status: 1 },
  { id: 36, name: '本地文件检索', path: '/tools/local-file-search', component: 'tools/LocalFileSearch', icon: 'Document', parent_id: 30, level: 2, sort_order: 6, type: 1, status: 1 },
];

let completed = 0;
let successCount = 0;
let errorCount = 0;
const errors = [];

menus.forEach(menu => {
  db.run(`
    INSERT OR REPLACE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    menu.id,
    menu.name,
    menu.path,
    menu.component,
    menu.icon,
    menu.parent_id,
    menu.level,
    menu.sort_order,
    menu.type,
    menu.status
  ], function(err) {
    completed++;
    if (err) {
      console.error(`❌ 插入菜单 "${menu.name}" 失败:`, err.message);
      errorCount++;
      errors.push({ menu: menu.name, error: err.message });
    } else {
      console.log(`✓ 插入菜单 "${menu.name}" 成功`);
      successCount++;
    }

    if (completed === menus.length) {
      console.log('');
      console.log('========================================');
      console.log('        修复完成');
      console.log('========================================');
      console.log('');
      console.log(`✓ 成功: ${successCount} 条`);
      if (errorCount > 0) {
        console.log(`❌ 失败: ${errorCount} 条`);
        errors.forEach(e => {
          console.log(`   - ${e.menu}: ${e.error}`);
        });
      }
      console.log('');
      
      // 延迟退出以确保数据库操作完成
      setTimeout(() => {
        process.exit(errorCount > 0 ? 1 : 0);
      }, 500);
    }
  });
});
