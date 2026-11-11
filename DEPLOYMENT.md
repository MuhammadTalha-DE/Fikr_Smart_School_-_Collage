# Deployment Guide

This project can run as three containers:

- `frontend`: Vite build served by nginx on port `3000`
- `backend`: Express API and Socket.IO on port `5000`
- `mongo`: MongoDB on port `27017`

## LAN Development (Windows)

Run the backend and frontend in separate PowerShell terminals from the repository root:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

The backend needs a working `backend/.env` with `MONGO_URI` and `JWT_SECRET`, and MongoDB must be running. The frontend proxies API requests, uploads, and Socket.IO connections to the backend.

On the server PC, run `ipconfig` and find its IPv4 address for the Wi-Fi or Ethernet adapter connected to your LAN (for example, `192.168.1.25`). From another device on that same network, open:

- Frontend: `http://192.168.1.25:3000` (replace with the server PC's IPv4 address)
- Backend health check: `http://192.168.1.25:5000/api/health`

If Windows Firewall prompts you, allow Node.js on **Private networks**. If it does not prompt, add inbound TCP rules for ports `3000` and `5000` on the Private profile. Keep the devices on the same LAN; this setup does not expose the services to the public internet. A DHCP address can change, so use a reserved LAN address if you need a stable URL.

## Local Docker Run

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/api/health`

The frontend container proxies `/api` and `/socket.io` to the backend container, so the browser uses the same origin for API calls and realtime events.

## Production Notes

Change these values before production:

- `JWT_SECRET`
- `MONGO_URI`
- `CLIENT_URL`
- Email and Cloudinary secrets

For real production hosting, keep secrets in the host/platform secret manager instead of committing them to the repository.

## GitHub Actions

The CI workflow runs:

- Backend install and tests
- Frontend install, tests, and build
- Docker Compose config validation
