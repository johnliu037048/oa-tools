@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo [启动脚本] 开始执行...
echo [启动脚本] 脚本路径: %~f0
echo [启动脚本] 当前目录: %CD%

REM 确保在正确的目录下运行（项目根目录）
echo [启动脚本] 切换到项目根目录...
cd /d "%~dp0.." 2>nul
if errorlevel 1 (
    echo ❌ 错误: 无法切换到项目根目录
    echo   脚本所在目录: %~dp0
    echo   尝试切换到: %~dp0..
    pause
    exit /b 1
)
echo [启动脚本] 当前目录已切换至: %CD%

REM 初始化命令路径（解决ARM架构问题）
echo [启动脚本] 正在查找 Node.js 和 npm 命令...
call "%~dp0_common.bat" :init_commands
if errorlevel 1 (
    echo.
    echo ❌ 错误: 命令查找失败，无法继续
    echo   请确保 Node.js 已正确安装
    echo.
    pause
    exit /b 1
)
echo [启动脚本] 命令查找成功

REM 显示检测到的命令路径（调试信息）
echo [调试] 检测到的命令路径:
echo   NODE_CMD = %NODE_CMD%
echo   NPM_CMD = %NPM_CMD%
echo.

echo ========================================
echo        OA管理系统快速启动
echo ========================================
echo.

echo 正在检查系统状态...

echo 1. 检查数据库...
if not exist "server\core\database\oa.db" (
    echo ⚠️  数据库不存在，正在初始化...
    REM 传递变量给子脚本
    set "NODE_CMD=%NODE_CMD%"
    set "NPM_CMD=%NPM_CMD%"
    call bat\init-db.bat
    set init_result=%errorlevel%
    if !init_result! neq 0 (
        echo ❌ 数据库初始化失败
        pause
        exit /b 1
    )
) else (
    echo ✓ 数据库已存在
)

echo.
echo 2. 检查依赖...
if not exist "node_modules" (
    echo ⚠️  依赖未安装，正在安装...
    "%NPM_CMD%" install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

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

if not exist "client\node_modules" (
    echo ⚠️  客户端依赖未安装，正在安装...
    cd client
    "%NPM_CMD%" install
    cd ..
    if %errorlevel% neq 0 (
        echo ❌ 客户端依赖安装失败
        pause
        exit /b 1
    )
)

echo ✓ 依赖检查完成

REM 检查concurrently包（用于同时运行前后端）
if not exist "node_modules\concurrently" (
    echo.
    echo ⚠️  缺少 concurrently 包，正在安装...
    "%NPM_CMD%" install concurrently --save-dev
    if !errorlevel! neq 0 (
        echo ❌ concurrently 安装失败
        pause
        exit /b 1
    )
)

echo.
echo 3. 启动服务器...
echo.
echo ========================================
echo        系统启动中...
echo ========================================
echo.
echo 📍 前端地址: http://localhost:3000
echo 📍 后端地址: http://localhost:3001
echo 👤 默认账号: admin / admin123
echo.
echo 按 Ctrl+C 停止服务器
echo.
echo [调试] 当前工作目录: %CD%
echo [调试] 执行命令: "%NPM_CMD%" run dev
echo.

REM 设置环境变量，确保npm脚本内部也能找到命令
REM 提取nodejs目录并添加到PATH
if "%NODE_CMD:~-9%"=="node.exe" (
    for %%p in ("%NODE_CMD%") do (
        set "NODEJS_DIR=%%~dp"
        if exist "!NODEJS_DIR!npm.cmd" (
            set "PATH=!NODEJS_DIR!;%PATH%"
        )
    )
)

echo [调试] 执行启动命令...
REM 执行启动命令，如果失败会设置errorlevel
"%NPM_CMD%" run dev
REM 注意：如果命令成功运行（服务器启动），脚本会一直运行直到用户按Ctrl+C
REM 只有在命令失败时才会到这里
if !errorlevel! neq 0 (
    echo.
    echo ========================================
    echo ❌ 启动失败，错误代码: !errorlevel!
    echo ========================================
    echo.
    echo 可能的原因:
    echo 1. Node.js 或 npm 命令无法执行
    echo    - 请确认 Node.js 已正确安装
    echo    - 尝试手动运行: "%NPM_CMD%" --version
    echo    - 尝试手动运行: "%NODE_CMD%" --version
    echo.
    echo 2. 依赖未完全安装
    echo    - 请运行菜单选项 1 安装所有依赖
    echo    - 确保根目录、server 和 client 目录都有 node_modules
    echo.
    echo 3. 端口被占用
    echo    - 检查端口 3000 和 3001 是否被其他程序占用
    echo    - 可以运行菜单选项 6 停止已运行的 Node.js 进程
    echo.
    echo 4. package.json 中的脚本配置问题
    echo    - 检查 package.json 中的 dev 脚本是否正确
    echo.
    echo [调试信息]
    echo   NODE_CMD = %NODE_CMD%
    echo   NPM_CMD = %NPM_CMD%
    echo   工作目录 = %CD%
    echo.
    pause
    exit /b !errorlevel!
)
