@echo off
echo ====================================================
echo Starting Ardhnarishwar AI SaaS Platform
echo ====================================================
start cmd /k "echo Starting Backend Server on http://localhost:5000 && cd backend && node server.js"
start cmd /k "echo Starting Frontend Dev Server on http://localhost:5173 && cd frontend && npm run dev"
echo Both servers launched! Open your browser at http://localhost:5173/
pause
