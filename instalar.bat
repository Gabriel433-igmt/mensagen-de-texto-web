@echo off
chcp 65001 >nul
title Instalador - Transformador de Ideias
setlocal enabledelayedexpansion

echo ================================================================
echo    INSTALADOR  -  Transformador de Ideias  (Windows)
echo ================================================================
echo.
echo  Este instalador prepara tudo que o app precisa para rodar:
echo    - Verifica/instala o Python (que ja inclui o Tkinter)
echo    - Cria um atalho para abrir o app facil
echo.
pause

REM ---- 1) Verifica se o Python esta instalado ---------------------
echo.
echo [1/3] Verificando o Python...
where python >nul 2>nul
if %errorlevel%==0 (
    echo    Python encontrado:
    python --version
    goto VERIFICA_TK
)

echo    Python NAO encontrado. Tentando instalar automaticamente...

REM ---- Tenta instalar via winget (Windows 10/11) ------------------
where winget >nul 2>nul
if %errorlevel%==0 (
    echo    Instalando Python pelo winget. Aceite a janela se aparecer...
    winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
    echo.
    echo    Python instalado. FECHE esta janela e rode o instalador de novo
    echo    (para o Windows reconhecer o novo Python no PATH).
    pause
    exit /b 0
) else (
    echo.
    echo    Nao foi possivel instalar automaticamente ^(winget ausente^).
    echo    Por favor, instale o Python manualmente em:
    echo        https://www.python.org/downloads/
    echo    IMPORTANTE: marque a opcao "Add Python to PATH" durante a instalacao.
    echo.
    pause
    exit /b 1
)

:VERIFICA_TK
REM ---- 2) Verifica se o Tkinter esta disponivel -------------------
echo.
echo [2/3] Verificando a interface grafica (Tkinter)...
python -c "import tkinter" >nul 2>nul
if %errorlevel%==0 (
    echo    Tkinter OK ^(interface grafica disponivel^).
) else (
    echo    Aviso: Tkinter nao encontrado. O app ainda funciona no MODO TERMINAL.
    echo    Para a janela grafica, reinstale o Python marcando "tcl/tk and IDLE".
)

REM ---- 3) Cria o atalho/launcher --------------------------------
echo.
echo [3/3] Criando atalho na Area de Trabalho...

set "PASTA=%~dp0"
set "LAUNCHER=%PASTA%Transformador de Ideias.bat"

> "%LAUNCHER%" echo @echo off
>> "%LAUNCHER%" echo chcp 65001 ^>nul
>> "%LAUNCHER%" echo cd /d "%%~dp0"
>> "%LAUNCHER%" echo python "transformador_de_ideias.py"
>> "%LAUNCHER%" echo if errorlevel 1 pause

REM Cria atalho na area de trabalho via PowerShell
powershell -NoProfile -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Transformador de Ideias.lnk');" ^
  "$s.TargetPath='%LAUNCHER%';" ^
  "$s.WorkingDirectory='%PASTA%';" ^
  "$s.IconLocation='%SystemRoot%\System32\shell32.dll,167';" ^
  "$s.Save()" 2>nul

echo.
echo ================================================================
echo    INSTALACAO CONCLUIDA!
echo ================================================================
echo.
echo  Para abrir o app:
echo    - Use o atalho "Transformador de Ideias" na Area de Trabalho, ou
echo    - Clique duas vezes em "Transformador de Ideias.bat" nesta pasta.
echo.
set /p ABRIR="Quer abrir o app agora? (s/n): "
if /i "!ABRIR!"=="s" (
    cd /d "%PASTA%"
    python "transformador_de_ideias.py"
)
endlocal
