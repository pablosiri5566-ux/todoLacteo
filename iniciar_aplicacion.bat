@echo off
title Servidor PWA Exposiciones - Boumatic
echo =======================================================
echo Iniciando el servidor local para la Aplicacion PWA...
echo =======================================================
echo.
echo El navegador web deberia abrirse automaticamente. 
echo Si no lo hace, abre manualmente: http://localhost:3000
echo.
echo Para APAGAR el servidor cuando termines, cierra esta ventana negra.
echo.
start http://localhost:3000
npm run dev
pause
