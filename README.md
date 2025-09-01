# AIChatBot (Frontend)

This is the AIChatBot frontend project (Vite + React + TypeScript).
The archive contains a complete frontend project which can run with `npm install` + `npm run dev`,
and can be containerized with Docker using the provided Dockerfile.

## 界面预览
1.png

## Quick start

```bash
npm install
npm run dev
```

Build & preview:
```bash
npm run build
npm run preview
```

Docker:
```bash
docker build -t aichatbot-frontend:latest .
docker run -p 8080:80 aichatbot-frontend:latest
```
demo 
https://safe.robotmusk.com

2.png

## Notes
- Backend REST/WS endpoints are not included. Use ENV variables to point to your backend if needed.
- If you specifically need a .rar archive, please convert the provided .zip locally (e.g. with WinRAR) — rar creation requires external rar tools not available here.
