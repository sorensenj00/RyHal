# Sportscenter Platform Monorepo

Dette er monorepoet for Sportscenter Platformen. Det indeholder:
- `SportCenter.Api`: C# .NET Backend
- `admin-dashboard`: React frontend til administration (Admin Dashboard)
- `employee-app`: React frontend til medarbejdere (Employee App)

## Lokal udvikling

Backend skal bruge Supabase-konfiguration. `Supabase:Url` og `Supabase:Key` er projektets normale anon/public key. For at oprette medarbejder-login i Supabase Auth skal API'en ogsaa have en backend-secret fra Supabase. Brug enten den nye `Secret keys -> default` key (`sb_secret_...`) eller legacy `service_role` key. Den maa kun ligge i backend-konfiguration, aldrig i React `.env`.

Lokal opsaetning:

```bash
dotnet user-secrets set "Supabase:SecretKey" "<SUPABASE_SECRET_OR_SERVICE_ROLE_KEY>" --project SportCenter.Api
dotnet user-secrets set "Supabase:RecoveryRedirectUrl" "http://localhost:3000/reset-password" --project SportCenter.Api
```

Secret key findes i Supabase Dashboard under Project Settings -> API Keys -> Secret keys. Brug ikke publishable/anon key.

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
