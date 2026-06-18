# 🌤️ Climate Intelligence Assistant

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)

An AI-powered weather intelligence dashboard that bridges the gap between raw meteorological telemetry and actionable human insight.

Legacy weather applications force users to do the mental math on climate risk (e.g., *"Temperature 32°C, Humidity 81%"*). This system uses a local **Retrieval-Augmented Generation (RAG)** pipeline and a deterministic rule engine to explain exactly what those metrics mean (e.g., *"Moderate heat stress. Outdoor exercise may cause fatigue. Best outdoor window: 6:30–9:30 AM."*).

## ✨ Key Features

- **🧠 RAG-Powered AI Advisory:** Combines live telemetry from Open-Meteo with verified physiological safety thresholds, stored in a local vector database, to generate explainable, deterministic weather advisories using Llama3.
- **🎯 Activity Intelligence Scoring:** A rule-based engine that evaluates weather conditions against specific human factors to score the safety of activities such as running, driving, and general outdoor exposure.
- **📊 Forecast Validation (Accuracy Tracking):** Dynamically tracks and charts actual recorded conditions against predicted forecasts to measure model drift and accuracy over time.
- **⏱️ Smart Context Windows:** Algorithmic calculation of the "Optimal Outdoor Window" and "Worst Weather Window" based on aggregated precipitation and heat-stress probabilities.
- **☀️ Precision Sun Tracking:** A horizontal Flexbox visualizer that calculates remaining daylight percentage using exact sunrise/sunset data, avoiding standard browser timezone bugs.
- **📈 High-Density "Bento-Box" UI:** A polished, responsive React dashboard using Recharts for tabbed, multi-metric data visualization without axis pollution.

---

## 🏗️ System Architecture

The application is built on a four-layer architecture, fully containerized via Docker:

1. **Frontend (React + Tailwind + Recharts):** High-density data visualization with WebSocket integration for live updates.
2. **Backend API (FastAPI):** Asynchronous data aggregation, geocoding resolution, and WebSocket state management.
3. **Data Layer (SQLite + Open-Meteo):** Time-series storage for historical readings, combined with live REST API telemetry.
4. **AI Engine (LangChain + ChromaDB + Ollama):** Orchestrates retrieval of safety context and executes local inference via Llama3.

---

## ⚙️ Prerequisites

Before running the application, make sure you have:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

Ollama runs as a containerized service as part of this stack, so no separate local installation is required. After the containers start, pull the model into the running Ollama container:

```bash
docker exec -it climate_ollama ollama pull llama3
```

---

## 🚀 How to Run

### 1. Environment Configuration

Create a `.env` file in the project root. **The application will fail to start if this file is missing.** Add the following variables:

```env
DB_ROOT_PASSWORD=your_secure_root_password
DB_USER=climateuser
DB_PASSWORD=your_secure_password
LOCATION_LAT=9.9312   # Default latitude (e.g., Kochi)
LOCATION_LON=76.2673  # Default longitude
OLLAMA_MODEL=llama3
```

### 2. Boot the Stack

Start the entire infrastructure (database, API, frontend, Ollama) using Docker Compose:

```bash
docker compose up -d --build
```

### 3. Access the Application

Once the containers are healthy, the system is accessible at:

- **Dashboard (Frontend):** `http://localhost:3000`
- **API Swagger Docs (Backend):** `http://localhost:8000/docs`

---

## 📂 Project Structure

```text
├── backend/
│   ├── main.py          # FastAPI application & WebSocket manager
│   ├── scheduler.py     # Background tasks for Open-Meteo ingestion
│   ├── rag.py           # LangChain RAG pipeline & ChromaDB setup
│   ├── alerts.py        # Deterministic threshold-based alert engine
│   ├── database.py      # SQLAlchemy ORM setup
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # React UI components (Bento-box layout)
│   │   ├── api.js       # Axios HTTP client configuration
│   │   └── App.jsx      # Main dashboard view
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml   # Multi-container orchestration
└── .env                 # Environment variables (git-ignored)
```

---

## 🛣️ Future Roadmap

- **Infrastructure:** Migrate time-series storage to PostgreSQL/TimescaleDB to support large-scale historical ingestion.
- **Alerting:** Implement WebSocket-driven push notifications for severe weather events (e.g., flash floods, extreme heat).
- **Sensor Integration:** Expand ingestion pipelines to support hyper-local IoT weather station data.

---

*Designed and engineered by [Sreedhar Raj Kannal](https://github.com/SreedharRajKannal).*
