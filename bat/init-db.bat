@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 确保在正确的目录下运行（项目根目录）
cd /d "%~dp0.." 2>nul
if errorlevel 1 (
    echo ❌ 错误: 无法切换到项目根目录
    pause
    exit /b 1
)

REM 初始化命令路径（解决ARM架构问题）
REM 如果从父脚本调用，先尝试使用父脚本传递的变量
if not defined NODE_CMD (
    call "%~dp0_common.bat" :init_commands
    if errorlevel 1 exit /b 1
) else (
    REM 验证传递的变量是否可用
    "%NODE_CMD%" --version >nul 2>&1
    if errorlevel 1 (
        call "%~dp0_common.bat" :init_commands
        if errorlevel 1 exit /b 1
    )
)

echo ========================================
echo        数据库初始化脚本
echo ========================================
echo.

echo 正在检查数据库脚本...
if not exist "server\core\database\system-init.js" (
    echo ❌ 数据库初始化脚本不存在
    pause
    exit /b 1
)

echo 正在检查依赖...
if not exist "node_modules" (
    echo ⚠️  依赖未安装，正在安装...
    "%NPM_CMD%" install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo 正在检查服务器依赖...
if not exist "server\node_modules" (
    echo ⚠️  服务器依赖未安装，正在安装...
    cd server
    "%NPM_CMD%" install
    cd ..
    if %errorlevel% neq 0 (
        echo ❌ 服务器依赖安装失败
        pause
        exit /b 1
    )
)

echo.
echo 正在初始化数据库...
"%NODE_CMD%" server\core\database\system-init.js
if %errorlevel% neq 0 (
    echo ❌ 数据库初始化失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo        数据库初始化完成
echo ========================================
echo.
echo 🔑 默认账号信息:
echo   用户名: admin
echo   密码: admin123
echo.
echo 🚀 启动命令:
echo   npm run dev        # 开发模式
echo   npm start          # 生产模式
echo.
pause
