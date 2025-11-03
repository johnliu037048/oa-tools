@echo off
rem ========================================
rem  环境检测脚本 - 修复ARM Windows兼容性
rem ========================================
rem 注意：不使用setlocal，以便PATH更改能传播到调用者

rem 检测并修复Node.js和npm路径
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  检测到Node.js不在PATH中，正在查找...
    
    rem 查找常见安装路径（ARM Windows兼容）
    set found=0
    
    rem 检查标准安装路径
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
        set found=1
        goto :node_found
    )
    
    if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
        set found=1
        goto :node_found
    )
    
    if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
        set found=1
        goto :node_found
    )
    
    rem 检查用户级安装
    if exist "%APPDATA%\npm\node.exe" (
        set "PATH=%APPDATA%\npm;%PATH%"
        set found=1
        goto :node_found
    )
    
    rem 检查硬编码路径（ARM Windows可能不同）
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
        set found=1
        goto :node_found
    )
    
    if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
        set found=1
        goto :node_found
    )
    
    :node_found
    if %found% equ 0 (
        echo ❌ 未找到Node.js安装路径
        echo.
        echo 请确保已安装Node.js，或手动添加到PATH环境变量中
        echo 下载地址: https://nodejs.org/
        echo.
        echo 提示: 在ARM Windows上，Node.js可能需要手动添加到PATH
        exit /b 1
    )
    
    echo ✓ Node.js路径已修复
)

rem 验证node命令现在可用
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js命令仍然不可用
    exit /b 1
)

rem 验证npm命令
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  npm命令不在PATH中，尝试查找npm.cmd...
    if exist "%ProgramFiles%\nodejs\npm.cmd" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\npm.cmd" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    ) else (
        echo ❌ npm命令不可用
        exit /b 1
    )
)

rem 显示版本信息（可选，用于调试）
if "%1"=="verbose" (
    echo.
    echo 环境信息:
    where node
    where npm
    node --version
    npm --version
    echo.
)

exit /b 0
