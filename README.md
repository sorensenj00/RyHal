# Sportscenter Platform Monorepo

Dette er monorepoet for Sportscenter Platformen. Det indeholder:
- `SportCenter.Api`: C# .NET Backend
- `admin-dashboard`: React frontend til administration (Admin Dashboard)
- `employee-app`: React frontend til medarbejdere (Employee App)

## Lokal udvikling

Kør alle tre services fra repo-roden med:

```bash
npm run dev
```

Det starter:
- `SportCenter.Api` på `http://localhost:5172`
- `admin-dashboard` på `http://localhost:3000`
- `employee-app` på `http://localhost:5173`

Du kan også starte dem enkeltvis:

```bash
npm run dev:api
npm run dev:admin
npm run dev:employee
```
