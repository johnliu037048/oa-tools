@echo off
REM ========================================
REM 通用辅助函数 - 命令查找和路径修复
REM 解决ARM架构Win11系统命令找不到的问题
REM ========================================

REM 检测并设置Node.js和npm路径
:init_commands
setlocal enabledelayedexpansion

REM 如果变量已设置且命令可用，直接返回（避免重复查找）
if defined NODE_CMD (
    if defined NPM_CMD (
        "%NODE_CMD%" --version >nul 2>&1
        if !errorlevel! equ 0 (
            "%NPM_CMD%" --version >nul 2>&1
            if !errorlevel! equ 0 (
                endlocal & set "NODE_CMD=%NODE_CMD%" & set "NPM_CMD=%NPM_CMD%"
                exit /b 0
            )
        )
    )
)

REM 初始化变量
set "NODE_CMD="
set "NPM_CMD="

REM ===== 查找node命令 =====
echo [命令查找] 步骤1: 尝试直接执行 node 命令...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    set "NODE_CMD=node"
    echo [命令查找] ✓ 在PATH中找到 node
    goto find_npm
)

REM 先检查常见安装路径（比where命令更快更可靠）
echo [命令查找] 步骤2: 检查常见安装路径...
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "NODE_CMD=%LOCALAPPDATA%\Programs\nodejs\node.exe"
    echo [命令查找] ✓ 在用户本地目录找到: %NODE_CMD%
    goto find_npm
)
if exist "%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe" (
    set "NODE_CMD=%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe"
    echo [命令查找] ✓ 在用户目录找到: %NODE_CMD%
    goto find_npm
)
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
    echo [命令查找] ✓ 在Program Files找到: %NODE_CMD%
    goto find_npm
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles(x86)%\nodejs\node.exe"
    echo [命令查找] ✓ 在Program Files (x86)找到: %NODE_CMD%
    goto find_npm
)

REM 最后尝试使用where命令（可能较慢，在ARM系统上可能卡住）
echo [命令查找] 步骤3: 使用where命令查找（可能需要较长时间）...
timeout /t 1 /nobreak >nul 2>&1
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [命令查找] where命令找到了node，正在获取路径...
    REM 使用临时文件来避免for /f卡住
    set "TEMP_WHERE=%TEMP%\node_path_%RANDOM%.tmp"
    where node > "%TEMP_WHERE%" 2>nul
    if exist "%TEMP_WHERE%" (
        for /f "usebackq delims=" %%i in ("%TEMP_WHERE%") do (
            set "NODE_CMD=%%i"
            del "%TEMP_WHERE%" >nul 2>&1
            goto find_npm
        )
        del "%TEMP_WHERE%" >nul 2>&1
    )
)

REM 未找到node命令
echo.
echo ========================================
echo ❌ 错误: 未找到 node 命令
echo ========================================
echo.
echo 请确保已安装 Node.js:
echo 1. 访问 https://nodejs.org/ 下载并安装 Node.js
echo 2. 安装时选择"添加到PATH"选项
echo 3. 如果已安装，请重启命令行窗口
echo 4. 或者手动添加Node.js安装目录到系统PATH环境变量
echo.
echo [调试信息]
echo   当前PATH: %PATH%
echo   检查的路径:
echo     - %ProgramFiles%\nodejs\node.exe
echo     - %ProgramFiles(x86)%\nodejs\node.exe
echo     - %LOCALAPPDATA%\Programs\nodejs\node.exe
echo     - %USERPROFILE%\AppData\Local\Programs\nodejs\node.exe
echo.
endlocal
exit /b 1

:find_npm
REM ===== 查找npm命令 =====
echo [命令查找] 步骤4: 查找 npm 命令...

REM 如果node是通过PATH找到的（命令名为"node"），尝试在同目录找npm
if "%NODE_CMD%"=="node" (
    echo [命令查找] node在PATH中，正在查找npm...
    REM 先尝试通过常见路径查找，避免使用where命令（可能卡住）
    REM 直接检查常见路径会更快
) else (
    REM node有完整路径，直接在同目录找npm
    echo [命令查找] 步骤5: 在Node.js同目录查找npm...
    for %%p in ("%NODE_CMD%") do (
        set "NODE_DIR=%%~dp"
        if exist "!NODE_DIR!npm.cmd" (
            set "NPM_CMD=!NODE_DIR!npm.cmd"
            echo [命令查找] ✓ 在Node.js同目录找到: !NPM_CMD!
            goto verify_commands
        )
    )
)

REM 检查常见npm路径（优先级高于直接执行npm命令）
echo [命令查找] 步骤6: 检查常见npm安装路径...
if exist "%LOCALAPPDATA%\Programs\nodejs\npm.cmd" (
    set "NPM_CMD=%LOCALAPPDATA%\Programs\nodejs\npm.cmd"
    echo [命令查找] ✓ 在用户本地目录找到: %NPM_CMD%
    goto verify_commands
)
if exist "%USERPROFILE%\AppData\Local\Programs\nodejs\npm.cmd" (
    set "NPM_CMD=%USERPROFILE%\AppData\Local\Programs\nodejs\npm.cmd"
    echo [命令查找] ✓ 在用户目录找到: %NPM_CMD%
    goto verify_commands
)
if exist "%ProgramFiles%\nodejs\npm.cmd" (
    set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
    echo [命令查找] ✓ 在Program Files找到: %NPM_CMD%
    goto verify_commands
)
if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" (
    set "NPM_CMD=%ProgramFiles(x86)%\nodejs\npm.cmd"
    echo [命令查找] ✓ 在Program Files (x86)找到: %NPM_CMD%
    goto verify_commands
)

REM 最后尝试使用where命令查找npm（可能较慢，使用临时文件避免卡住）
echo [命令查找] 步骤7: 使用where命令查找npm（可能需要较长时间，请耐心等待）...
timeout /t 1 /nobreak >nul 2>&1
set "TEMP_WHERE=%TEMP%\npm_path_%RANDOM%.tmp"
REM 直接执行where并将结果写入文件，避免for /f直接执行命令
where npm > "%TEMP_WHERE%" 2>nul
if exist "%TEMP_WHERE%" (
    REM 检查文件是否为空
    for %%A in ("%TEMP_WHERE%") do if %%~zA gtr 0 (
        for /f "usebackq delims=" %%i in ("%TEMP_WHERE%") do (
            set "NPM_CMD=%%i"
            echo [命令查找] where命令找到了npm: %%i
            del "%TEMP_WHERE%" >nul 2>&1
            goto verify_commands
        )
    )
    del "%TEMP_WHERE%" >nul 2>&1
)

REM 未找到npm命令
echo.
echo ========================================
echo ❌ 错误: 未找到 npm 命令
echo ========================================
echo.
echo 请确保已安装 Node.js（npm通常随Node.js一起安装）
echo 1. 访问 https://nodejs.org/ 下载并安装 Node.js
echo 2. 安装时选择"添加到PATH"选项
echo 3. 如果已安装，请重启命令行窗口
echo 4. 或者手动添加Node.js安装目录到系统PATH环境变量
echo.
echo [调试信息]
echo   NODE_CMD = %NODE_CMD% (已找到)
echo   检查的npm路径:
echo     - %ProgramFiles%\nodejs\npm.cmd
echo     - %ProgramFiles(x86)%\nodejs\npm.cmd
echo     - %LOCALAPPDATA%\Programs\nodejs\npm.cmd
echo     - %USERPROFILE%\AppData\Local\Programs\nodejs\npm.cmd
echo.
endlocal
exit /b 1

:verify_commands
REM 验证命令是否可用
echo [命令查找] 步骤8: 验证命令可用性...

REM 先检查文件是否存在（快速检查）
if "%NODE_CMD%"=="node" (
    REM 如果NODE_CMD是"node"，说明在PATH中，直接跳过文件检查
    echo [命令查找] node在PATH中，跳过文件检查
) else (
    if not exist "%NODE_CMD%" (
        echo.
        echo ========================================
        echo ❌ 错误: Node.js 文件不存在
        echo ========================================
        echo   路径: %NODE_CMD%
        echo.
        endlocal
        exit /b 1
    )
    echo [命令查找] ✓ Node.js文件存在: %NODE_CMD%
)

if "%NPM_CMD%"=="npm" (
    REM 如果NPM_CMD是"npm"，说明在PATH中，直接跳过文件检查
    echo [命令查找] npm在PATH中，跳过文件检查
) else (
    if not exist "%NPM_CMD%" (
        echo.
        echo ========================================
        echo ❌ 错误: npm 文件不存在
        echo ========================================
        echo   路径: %NPM_CMD%
        echo   Node.js路径: %NODE_CMD%
        echo.
        endlocal
        exit /b 1
    )
    echo [命令查找] ✓ npm文件存在: %NPM_CMD%
)

REM 跳过执行验证（避免在ARM系统上卡住）
REM 如果命令在PATH中，说明可用；如果有完整路径且文件存在，也认为可用
REM 在实际使用时如果命令不可用，会有明确的错误提示

echo [命令查找] ✓ 命令验证成功
echo [命令查找]   Node.js: %NODE_CMD%
echo [命令查找]   npm: %NPM_CMD%
echo.

REM 将变量导出到外层作用域
endlocal & set "NODE_CMD=%NODE_CMD%" & set "NPM_CMD=%NPM_CMD%"
exit /b 0

