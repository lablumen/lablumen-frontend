# lablumen-frontend

The patient and staff web interface for LabLumen. A React single-page application built with Vite, served by nginx inside a Docker container running in EKS. The nginx container also acts as a reverse proxy, routing API calls to the appropriate backend services using Kubernetes internal DNS.

---

## What It Contains

**Patient portal** (`/app/...`)
- Home dashboard with upcoming appointments and recent reports
- Multi-step booking wizard — select tests, patients, date, and time slot
- Appointments list with status tracking
- Reports list with PDF viewer and AI chat panel
- Family profiles management

**Staff portal** (`/staff/...`)
- Operations queue — all ordered tests with current status and report upload actions
- Staff reports view

Both portals share the same Cognito login. Access to each portal is determined by the `cognito:groups` claim on the ID token (`PATIENT`, `LAB_STAFF`, or `LAB_ADMIN`).

---

## Tech Stack

| Component | Detail |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Data fetching | TanStack Query (React Query v5) |
| Routing | React Router v6 |
| Auth | `amazon-cognito-identity-js` (SRP flow — password never sent in plaintext) |
| Container | nginx:1.27-alpine (serves SPA + reverse proxies API calls) |

---

## Source Layout

```
src/
  App.tsx                          Root router with protected route guards
  main.tsx                         Entry point
  routes/
    Landing.tsx                    Public landing page
    Login.tsx / Register.tsx / ForgotPassword.tsx
    ProtectedRoute.tsx             Guards routes by auth state and role
    PatientLayout.tsx              Patient sidebar + outlet
    StaffLayout.tsx                Staff sidebar + outlet
    patient/
      Home.tsx                     Patient dashboard
      BookingWizard.tsx            Multi-step appointment booking
      Appointments.tsx             Appointment list and status
      Reports.tsx                  Report list
      ReportWorkspace.tsx          PDF viewer + AI chat panel
      Family.tsx                   Patient profile management
    staff/
      Operations.tsx               Operations queue grid with status updates and report upload
      StaffReports.tsx             Staff report view
  components/
    ui/                            Shared UI components (button, card, badge, tabs, etc.)
    PatientSidebar.tsx
    StaffSidebar.tsx
  hooks/
    useLabTests.ts                 TanStack Query hooks for lab test catalog
    usePatients.ts                 TanStack Query hooks for patient profiles
    useReports.ts                  TanStack Query hooks for reports and AI chat
    useOps.ts                      TanStack Query hooks for the operations queue
  lib/
    api.ts                         HTTP client with auth header injection and 401 redirect
    auth.ts                        Cognito session helpers (get token, sign out)
    cognito.ts                     amazon-cognito-identity-js client configuration
    AuthContext.tsx                 React context for current user state and role
    queryClient.ts                 TanStack Query client configuration
nginx.conf                         Reverse proxy routing + SPA fallback
inject-env.sh                      Injects Cognito config into the built bundle at container startup
```

---

## nginx as API Gateway

The nginx container serves the React SPA and proxies all API requests to backend services using Kubernetes internal DNS names. There is no separate API gateway.

| Request path | Backend service |
|---|---|
| `/api/v1/reports/...` | `http://report-service` |
| `/api/v1/...` | `http://appointment-service` |

File uploads (PDF reports from staff) pass through nginx with a 25 MB body limit.

---

## Configuration

Cognito credentials are injected at container startup via `inject-env.sh`, which replaces placeholder tokens in the built JavaScript bundle with values from environment variables. These values are synced from SSM Parameter Store into a Kubernetes Secret by External Secrets Operator.

| Variable | Description |
|---|---|
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `VITE_COGNITO_APP_CLIENT_ID` | Cognito App Client ID |

---

## CI/CD

| Trigger | What Happens |
|---|---|
| Pull request | TypeScript build check (`npm run build`), SAST (SonarCloud), SCA (Snyk), container scan (Trivy) |
| Merge to `main` | Build Docker image → Trivy gate → push to ECR → update `values-dev.yaml` in `lablumen-k8s` → ArgoCD deploys to dev |
| GitHub Release | Retag ECR image SHA → semver → update `values-prod.yaml` → ArgoCD deploys to production |

CI/CD logic is centralized in `lablumen-shared` and called from `.github/workflows/ci.yml`. The frontend uses the `lablumen-frontend-build` IAM role (scoped only to the frontend ECR repository).
