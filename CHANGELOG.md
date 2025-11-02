# 更新日志

## [最新版本] - 2025-01-XX

### 🆕 新增功能

#### 字典管理系统
- ✅ 新增字典管理模块，支持系统字段的动态配置
- ✅ 字典管理采用树形结构展示，按字典编码分组
- ✅ 支持字典的增删改查和批量导入
- ✅ 提供字典工具函数库（`utils/dictionary.js`）
- ✅ 预置了46条字典数据，涵盖HR和财务模块

#### 动态菜单系统
- ✅ 菜单根据数据库配置动态生成和加载
- ✅ 菜单管理采用树形结构，便于层级化管理
- ✅ 支持菜单的动态图标配置（Element Plus Icons）
- ✅ 支持添加子菜单功能

#### 财务模块字段字典化
- ✅ **科目类型**：从字典 `finance_account_type` 读取
- ✅ **资产类别**：从字典 `finance_asset_category` 读取
- ✅ **账户类型**：从字典 `finance_account_type_cash` 读取
- ✅ **成本类型**：从字典 `finance_cost_type` 读取
- ✅ **预算类别**：从字典 `finance_budget_category` 读取
- ✅ **税种**：从字典 `finance_tax_type` 读取
- ✅ **费用类型**：从字典 `finance_expense_type` 读取
- ✅ 所有字典数据可在"系统管理 > 字典管理"中随时更新维护

#### 费用管理功能完善
- ✅ 完善费用管理新增/编辑表单，添加所有必要字段
- ✅ 费用类型下拉选择（从字典读取）
- ✅ 申请日期选择器
- ✅ 备注字段
- ✅ 表单验证规则完善

#### 电商平台接入方案
- ✅ 新增电商平台接入技术分析文档
- ✅ 分析抖音等平台的API接入可行性
- ✅ 提供完整的技术实施方案和数据库设计

### ✨ 功能优化

#### 树形结构管理
- ✅ 菜单管理改为树形结构展示
- ✅ 字典管理改为树形结构展示（按字典编码分组）
- ✅ 优化表格展示，支持展开/折叠

#### API增强
- ✅ 菜单API支持 `tree=true` 参数返回树形结构
- ✅ 字典API支持 `tree=true` 参数返回树形结构
- ✅ 新增字典管理相关API接口（CRUD + 批量操作）

#### 前端工具增强
- ✅ 新增 `getDictionary()` - 获取字典数据（带缓存）
- ✅ 新增 `getDictOptions()` - 获取字典选项列表（用于下拉框）
- ✅ 新增 `getDictLabelSync()` - 同步获取字典标签
- ✅ 字典工具支持自动缓存，提高性能

### 🐛 Bug修复

#### 数据库初始化
- ✅ 修复资金流水插入时的字段不匹配问题（7 values for 8 columns）
- ✅ 优化示例数据初始化脚本
- ✅ 添加完整的字典示例数据

#### 状态显示
- ✅ 修复所有财务模块页面状态显示不正确的问题
- ✅ 支持数字状态（兼容数据库 INTEGER 类型）和字符串状态
- ✅ 状态标签统一显示中文文字，不再显示数字

#### 日期显示
- ✅ 统一所有页面的日期格式化处理
- ✅ 添加 `formatDate()` 函数统一格式化日期显示
- ✅ 空值日期统一显示为 "-"

#### 数字显示
- ✅ 统一所有页面的金额格式化处理
- ✅ 改进 `formatCurrency()` 函数，正确处理空值和零值
- ✅ 统一数字格式（千分位分隔符，保留 2 位小数）

#### 表单字段
- ✅ 税务管理模块添加缺失的字段（申报日期、截止日期、描述）
- ✅ 费用管理模块修复创建费用申请的问题
- ✅ 统一使用日期选择器组件，规范日期输入格式

#### API路径规范
- ✅ 系统管理模块 API 路径统一使用 `/api/system/*` 前缀
- ✅ 移除系统模块的兼容性路由，避免路径混淆
- ✅ 所有前端 API 文件更新为新的路径结构

#### 数据验证
- ✅ 统一验证器定义位置（控制器中定义，不在路由中重复）
- ✅ 改进数字类型验证，支持字符串和数字两种格式
- ✅ 添加详细的错误日志记录，便于问题排查

### 📝 更新的文件

#### 后端
- ✅ `server/core/database/db-connection.js` - 添加字典表创建
- ✅ `server/core/database/system-init.js` - 添加字典示例数据
- ✅ `server/modules/system/controllers/menuController.js` - 支持树形结构
- ✅ `server/modules/system/controllers/dictionaryController.js` - 新增字典管理控制器
- ✅ `server/modules/system/routes/dictionaries.js` - 新增字典路由
- ✅ `server/modules/system/routes/index.js` - 注册字典路由

#### 前端
- ✅ `client/src/views/system/Menu.vue` - 树形结构展示
- ✅ `client/src/views/system/Dictionary.vue` - 新增字典管理页面
- ✅ `client/src/layout/Layout.vue` - 动态菜单加载
- ✅ `client/src/utils/dictionary.js` - 新增字典工具函数
- ✅ `client/src/api/dictionary.js` - 新增字典API接口
- ✅ `client/src/router/index.js` - 添加字典管理路由
- ✅ `client/src/views/finance/GeneralLedger.vue` - 字典化集成
- ✅ `client/src/views/finance/FixedAssets.vue` - 字典化集成
- ✅ `client/src/views/finance/CashManagement.vue` - 字典化集成
- ✅ `client/src/views/finance/CostAccounting.vue` - 字典化集成
- ✅ `client/src/views/finance/Budgeting.vue` - 字典化集成
- ✅ `client/src/views/finance/TaxManagement.vue` - 字典化集成
- ✅ `client/src/views/finance/ExpenseManagement.vue` - 字典化集成 + 表单完善
- ✅ `client/src/views/finance/FinancialReporting.vue` - 字典化集成

### 📚 新增文档

- ✅ `docs/电商平台接入方案分析.md` - 电商平台接入技术方案

---

## 历史版本

### [1.0.0] - 初始版本

- ✅ 基础系统管理功能（组织、用户、角色、岗位、菜单）
- ✅ HR管理模块（招聘、入职离职、考勤、请假、薪酬、档案）
- ✅ 财务管理模块（总账、应收应付、固定资产、资金、成本、预算、报表、税务、费用）
- ✅ JWT认证授权
- ✅ 基于角色的权限控制（RBAC）
