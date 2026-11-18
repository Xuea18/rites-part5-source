@echo off
cd /d "%~dp0"
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --open
