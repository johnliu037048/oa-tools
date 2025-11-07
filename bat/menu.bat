@echo off
:menu
cls
echo ========================================
echo        OA管理系统管理菜单
echo ========================================
echo.
echo 请选择操作:
echo 1. 初始化数据库
echo 2. 重置数据库
echo 3. 安装依赖
echo 4. 清理项目
echo 5. 修复菜单数据
echo 6. 启动系统
echo 7. 停止服务
echo 8. 测试CRUD功能
echo 9. 退出
echo.

set /p choice=请输入选择 (1-9): 

if "%choice%"=="1" goto init_db
if "%choice%"=="2" goto reset_db
if "%choice%"=="3" goto install
if "%choice%"=="4" goto clean
if "%choice%"=="5" goto fix_menus
if "%choice%"=="6" goto start
if "%choice%"=="7" goto stop
if "%choice%"=="8" goto test_crud
if "%choice%"=="9" goto exit
echo 无效选择，请重新输入
pause
goto menu

:init_db
echo.
echo 正在初始化数据库...
call bat\init-db.bat
pause
goto menu

:reset_db
echo.
echo 正在重置数据库...
call bat\reset-db.bat
pause
goto menu

:install
echo.
echo 正在安装依赖...
call bat\install.bat
pause
goto menu

:fix_menus
echo.
echo 正在修复菜单数据...
node server\core\database\fix-menus.js
pause
goto menu

:clean
echo.
echo 正在清理项目...
call bat\clean.bat
pause
goto menu

:start
echo.
echo 正在启动系统...
echo [调试] 调用启动脚本...
call bat\start.bat
set start_error=%errorlevel%
if %start_error% neq 0 (
    echo.
    echo ========================================
    echo 启动脚本执行失败，错误代码: %start_error%
    echo ========================================
    echo.
    echo 请检查上面的错误信息
)
pause
goto menu

:stop
echo.
echo 正在停止服务...
taskkill /f /im node.exe 2>nul
if errorlevel 1 (
    echo 没有运行的Node.js进程
) else (
    echo ✓ 服务已停止
)
pause
goto menu

:test_crud
echo.
echo 正在运行CRUD测试...
call bat\test-crud.bat
pause
goto menu

:exit
echo 再见！
exit /b 0
