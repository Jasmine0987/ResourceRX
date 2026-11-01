# ResourceRX

AI-powered peer-to-peer medical equipment sharing network for hospitals and care facilities facing urgent equipment shortages.

ResourceRX connects facilities with idle high-value medical assets — MRI scanners, ventilators, dialysis units, CT scanners, and other critical equipment — with organizations that need them quickly. The platform is organized around four role-specific portals: clinic, owner, technician, and logistics.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-4B7BE5)](https://ollama.com/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-Open%20Source-green)](LICENSE)

## What this project does

ResourceRX is a local-first healthcare asset-sharing platform built to reduce equipment bottlenecks and improve utilization of expensive medical technology.

The core workflow is simple:
- a clinic identifies equipment it needs
- an owner lists available devices
- logistics coordinates movement
- technicians prepare and validate equipment
- the system uses local AI to support operational decisions

This is designed as a real operational prototype for shortages, urgency response, and equipment lifecycle coordination.

## Why this is useful

The problem ResourceRX addresses is common in healthcare operations:
- equipment sits idle in one facility while another faces downtime
- urgent cases can’t wait for slow, fragmented manual coordination
- field teams often lack a single interface for managing movement, service, and status

### Benefits

- Faster access to critical equipment during shortages
- Better asset utilization for high-cost infrastructure
- Stronger operational visibility across booking, route, tracking, and service
- Role-specific experiences for different stakeholders
- AI-assisted guidance using a local model with no cloud dependency
- Privacy-friendly, local-first architecture

## Project overview

```mermaid
flowchart LR
    subgraph Frontend[Frontend]
        Landing[Landing Page\nsrc/pages/LandingPage.jsx]
        Login[Login & Registration\nsrc/pages/LoginPage.jsx]
        ClinicUI[Clinic Portal\nsrc/pages/Clinic]
        OwnerUI[Owner Portal\nsrc/pages/Owner]
        TechUI[Technician Portal\nsrc/pages/Technician]
        LogisticsUI[Logistics Portal\nsrc/pages/Logistics]
        AIChat[AI Console\nsrc/components/MedGemmaChat.jsx]
    end

    subgraph App[Application Layer]
        Router[React Router\nsrc/App.jsx]
        Context[Clinic Context\nsrc/context/ClinicContext.jsx]
    end

    subgraph Backend[Backend Services]
        Server[Express API\nserver/index.js]
        AIProxy[AI Proxy\nsrc/medgemma.js]
    end

    subgraph LocalAI[Local AI Layer]
        Ollama[Ollama Service]
        Model[gemma:2b]
    end

    subgraph External[External Services]
        Weather[Open-Meteo]
        Route[OpenRouteService]
        FX[ExchangeRate-API]
    end

    Landing --> Router
    Login --> Router
    ClinicUI --> Router
    OwnerUI --> Router
    TechUI --> Router
    LogisticsUI --> Router
    AIChat --> Router

    Router --> Context
    Router --> Server
    Server --> AIProxy
    AIProxy --> Ollama
    Ollama --> Model
    Server --> Weather
    Server --> Route
    Server --> FX

    click Landing "https://github.com/Jasmine0987/ResourceRX/blob/main/src/pages/LandingPage.jsx"
    click Login "https://github.com/Jasmine0987/ResourceRX/blob/main/src/pages/LoginPage.jsx"
    click ClinicUI "https://github.com/Jasmine0987/ResourceRX/tree/main/src/pages/Clinic"
    click OwnerUI "https://github.com/Jasmine0987/ResourceRX/tree/main/src/pages/Owner"
    click TechUI "https://github.com/Jasmine0987/ResourceRX/tree/main/src/pages/Technician"
    click LogisticsUI "https://github.com/Jasmine0987/ResourceRX/tree/main/src/pages/Logistics"
    click AIChat "https://github.com/Jasmine0987/ResourceRX/blob/main/src/components/MedGemmaChat.jsx"
    click Router "https://github.com/Jasmine0987/ResourceRX/blob/main/src/App.jsx"
    click Context "https://github.com/Jasmine0987/ResourceRX/blob/main/src/context/ClinicContext.jsx"
    click Server "https://github.com/Jasmine0987/ResourceRX/blob/main/server/index.js"
    click AIProxy "https://github.com/Jasmine0987/ResourceRX/blob/main/src/medgemma.js"
```

## Role-based portal architecture

```mermaid
flowchart TB
    subgraph Clinic[Clinic Portal]
        Search[Search Equipment]
        Booking[Requests & Booking]
        Track[Tracking]
        Pay[Payments]
        Feedback[Completion & Feedback]
    end

    subgraph Owner[Owner Portal]
        Add[Add Inventory]
        Analytics[Asset Analytics]
        Dispatch[Dispatch Coordination]
        Settle[Settlements]
    end

    subgraph Tech[Technician Portal]
        Service[Service Orders]
        Diagnose[Diagnostics]
        Calibrate[Calibration]
        Inventory[Inventory]
    end

    subgraph Logistics[Logistics Portal]
        Active[Active Shipments]
        Incidents[Incident Handling]
        Map[Map View]
        Logs[Operational Logs]
    end

    Search --> Booking --> Track --> Pay --> Feedback
    Add --> Analytics --> Dispatch --> Settle
    Service --> Diagnose --> Calibrate --> Inventory
    Active --> Incidents --> Map --> Logs

    click Search "https://github.com/Jasmine0987/ResourceRX/tree/main/src/pages/Clinic"
    click Add "https://github.com/Jasmine0987/ResourceRX/tree/main/src/pages/Owner"
    click Service "https://github.com/Jasmine0987/ResourceRX/tree/main/src/pages/Technician"
    click Active "https://github.com/Jasmine0987/ResourceRX/tree/main/src/pages/Logistics"
```

## Equipment lifecycle flow

```mermaid
sequenceDiagram
    participant Clinic as Clinic
    participant Platform as ResourceRX Platform
    participant Owner as Equipment Owner
    participant Tech as Technician
    participant Logistics as Logistics Team
    participant AI as MedGemma AI

    Clinic->>Platform: Search equipment
    Platform->>Owner: Query availability
    Owner-->>Platform: List asset inventory
    Clinic->>Platform: Request booking
    Platform->>Owner: Approve or decline request
    Owner-->>Platform: Confirm asset readiness
    Platform->>Logistics: Allocate dispatch
    Logistics->>Tech: Coordinate technician handoff
    Tech-->>Platform: Service or inspection update
    Platform->>AI: Request operational guidance
    AI-->>Platform: Recommendation
    Logistics-->>Clinic: ETA and tracking updates
    Clinic-->>Platform: Complete equipment use
    Platform-->>Owner: Settlement and utilization report
```

## Runtime / deployment model

```mermaid
flowchart TB
    Browser[Browser\nhttp://localhost:5173]
    Vite[Vite Dev Server]
    React[React Frontend]
    Express[Express Backend\nhttp://localhost:5000]
    Ollama[Ollama\nhttp://127.0.0.1:11434]
    Model[gemma:2b]
    OpenMeteo[Open-Meteo API]
    ORS[OpenRouteService API]
    FXAPI[ExchangeRate-API]

    Browser --> Vite
    Vite --> React
    React --> Express
    Express --> Ollama
    Express --> OpenMeteo
    Express --> ORS
    Express --> FXAPI
    Ollama --> Model

    click Browser "https://github.com/Jasmine0987/ResourceRX/blob/main/index.html"
    click Vite "https://github.com/Jasmine0987/ResourceRX/blob/main/vite.config.js"
    click React "https://github.com/Jasmine0987/ResourceRX/blob/main/src/App.jsx"
    click Express "https://github.com/Jasmine0987/ResourceRX/blob/main/server/index.js"
```

## Feature highlights

- Four role-based portals with dedicated user journeys
- Search and booking flow for urgent equipment requests
- Real-time position tracking and ETAs
- Medical equipment inventory with typed categories
- AI-guided operations using local Ollama inference
- Logistics and technician workflows for coordination
- Weather, route, and market-aware operational context

## Technology stack

### Frontend
- React 19
- Vite
- React Router DOM
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend
- Node.js 18+
- Express 5
- Local API layer
- CORS support for frontend dev workflow

### AI and external data
- Ollama with `gemma:2b`
- Open-Meteo
- OpenRouteService
- ExchangeRate-API

## Project structure

```text
ResourceRX/
├── src/
│   ├── pages/
│   │   ├── Clinic/
│   │   ├── Logistics/
│   │   ├── Owner/
│   │   ├── Technician/
│   │   ├── LandingPage.jsx
│   │   └── LoginPage.jsx
│   ├── components/
│   │   ├── ClinicSideBar.jsx
│   │   ├── LogisticsSideBar.jsx
│   │   ├── MedGemmaChat.jsx
│   │   ├── OwnerSideBar.jsx
│   │   └── TechnicianSideBar.jsx
│   ├── context/
│   │   └── ClinicContext.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── main.jsx
│   └── medgemma.js
├── server/
│   ├── index.js
│   └── package.json
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.cjs
├── eslint.config.js
├── README.md
├── .gitignore
├── pnpm-lock.yaml
└── LICENSE
```

## Getting started

### Prerequisites
- Node.js 18+
- npm
- Ollama installed locally
- Git

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd server && npm install && cd ..
```

### 3. Install and pull the local AI model

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull gemma:2b
```

### 4. Run the application

Open three terminals.

#### Terminal 1: start Ollama

```bash
ollama serve
```

#### Terminal 2: start the backend

```bash
cd server
node index.js
```

#### Terminal 3: start the frontend

```bash
npm run dev
```

Once started:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Verify AI backend

```bash
curl http://localhost:5000/test-ai
```

The response should confirm the local AI service is online.

## Main API routes

The backend in `server/index.js` exposes a set of local and live-data endpoints:

| Method | Route | Purpose |
|---|---|---|
| GET | `/` | Backend health check |
| GET | `/api/positions` | Real-time equipment locations |
| GET | `/api/equipment` | Equipment catalog and inventory |
| GET | `/api/weather` | Weather-based ETA analysis |
| GET | `/api/route` | Distance and route estimation |
| GET | `/api/currency` | Exchange rate data |
| POST | `/api/medgemma` | Send prompt to local Ollama instance |
| GET | `/test-ai` | AI service connectivity check |

## Developer notes

This project is built to run locally with lightweight fallback data when external services are unavailable. It intentionally balances realism and demoability:
- the backend maintains in-memory equipment positions
- weather and route data are pulled from public APIs where available
- currency exchange rates are available via APIs or fallback values
- AI calls run locally using Ollama instead of a hosted model

This makes it easy to run, test, and demo without a production cloud stack.

## How users can get help

- Open a GitHub issue for bugs or feature requests
- Use discussions if enabled in the repository
- Review the code in `src/`, `src/pages/`, and `server/index.js`
- Validate behavior with the local app and backend endpoints

## Who maintains and contributes

This project welcomes contributors through GitHub pull requests. The repository owner and contributors manage the project in the GitHub ecosystem.

### Contribution workflow

1. Fork the repository
2. Create a feature branch
3. Make focused changes
4. Verify locally
5. Submit a pull request with a clear summary

## Contributing

- Keep changes small and reviewable
- Follow the existing JS/React patterns
- Validate with local development before submitting PRs
- Prefer functionality that improves equipment coordination or operational clarity

## Support

This project is best understood as a local prototype and operations tool. If it is used in a real healthcare environment, validate all workflows with local clinical, compliance, and operational review before production deployment.

## License

This repository is intended to be open source, but license details should be confirmed before broader commercial or redistribution use.

---

## Diagram-design style summary

This project fits a diagram-first product architecture pattern:
- product narrative at the top
- operational workflow in the middle
- technical runtime at the bottom
- interactive diagrams connecting directly to code and services

That combination gives ResourceRX a clean, design-forward README that is both stakeholder-friendly and engineering-accurate.
