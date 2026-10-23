# TaskFlow — Distributed Job Queue System

TaskFlow is a distributed background job processing system built to demonstrate how jobs can be submitted to a queue, distributed across multiple workers, processed asynchronously, and monitored through a live dashboard.

## 🚀 Overview

TaskFlow accepts different types of computational jobs through a **FastAPI backend**. Jobs are placed into a **Redis queue** and picked up by independent worker processes for asynchronous execution.

### System Architecture

```text
                  ┌─────────────────────┐
                  │   React Dashboard   │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │     FastAPI API     │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │    Redis Queue      │
                  └──────────┬──────────┘
                             │
               ┌─────────────┼─────────────┐
               ▼             ▼             ▼
         ┌───────────┐ ┌───────────┐ ┌───────────┐
         │ Worker 1  │ │ Worker 2  │ │ Worker 3  │
         └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
               │             │             │
               └─────────────┼─────────────┘
                             ▼
                       Output Files
```

## ✨ Features

### 1. Distributed Job Queue

- Jobs are submitted to a Redis-backed queue.
- Multiple independent worker processes consume jobs.
- Workers can execute jobs concurrently and distribute the workload.
- Job status and worker metrics are tracked through Redis.

### 2. Supported Job Types

#### 🖼️ Image Resizing

Upload an image and process it asynchronously through a background worker.

- **Input:** Image file
- **Processing:** Image resizing using Pillow
- **Output:** Resized image saved in the output directory

#### 🏠 House Price Prediction

Run a machine-learning prediction using a trained Linear Regression model.

- **Input:** Area, number of bedrooms, and number of bathrooms
- **Processing:** Prediction using a scikit-learn model
- **Output:** Predicted house price

#### 📊 Sales Report Generation

Upload sales data in CSV or XLSX format to generate a PDF analysis report.

Reports can include:

- Sales statistics
- Sales trends
- Category analysis
- Data visualizations and generated charts

### 3. Worker Monitoring

TaskFlow supports multiple worker processes, such as:

- `worker-1`
- `worker-2`
- `worker-3`

The dashboard displays worker information, including:

- Online or offline status
- Idle or processing status
- Current job
- Job ID and job type
- Processing progress

### 4. Worker Performance Metrics

Each worker records runtime metrics, including:

- Total jobs processed
- Failed jobs
- Success rate
- Average processing time

Example metrics are illustrative; actual values depend on workload and execution.

### 5. System Health Monitoring

TaskFlow monitors the machine running the backend and displays:

- CPU usage
- CPU core count
- Memory usage
- Memory used and total memory
- Disk usage
- Disk used and total disk capacity

**System health endpoint:**

`GET /system/health`

### 6. Interactive Dashboard

The React dashboard provides:

- Total job statistics
- Completed, processing, and failed job counts
- Job creation cards
- Run All Jobs functionality
- Worker monitoring and metrics
- Queue status
- System health information
- Job history
- Output downloads

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Backend | FastAPI |
| Queue | Redis |
| Containerization | Docker |
| Workers | Python |
| Machine Learning | scikit-learn |
| Data Processing | Pandas |
| Report Generation | Matplotlib, ReportLab |
| Image Processing | Pillow |
| System Monitoring | psutil |
| API Server | Uvicorn |

## 📁 Project Structure

```text
TaskFlow/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── dashboard/
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
├── input/                    # Local input files and datasets
├── ml/
│   └── house_price_model.py
├── output/                   # Generated files
├── reports/
│   └── report_generator.py
├── worker/
│   └── worker.py
├── .gitignore
└── README.md
```

> Note: Local input files, generated outputs, virtual environments, and sensitive configuration files may be excluded from the GitHub repository.

## ⚙️ How It Works

### Job Processing Workflow

1. **Submit a job:** The dashboard sends a request to the FastAPI backend.
2. **Queue the job:** FastAPI places the job in the Redis `task_queue`.
3. **Assign a worker:** An available worker retrieves a queued job.
4. **Process the job:** The worker performs the requested operation.
5. **Generate the output:** The processed file, prediction, or report is produced as applicable.
6. **Update job status:** The worker updates the job state and worker metrics in Redis.
7. **Refresh the dashboard:** The dashboard periodically retrieves updated job and worker information.

### Processing Pipelines

**Image resizing**

```text
Image Upload → Redis Queue → Worker → Pillow → Resized Image
```

**House price prediction**

```text
Prediction Request → Redis Queue → Worker
                   → scikit-learn Model → Predicted Price
```

**Sales report generation**

```text
CSV/XLSX Dataset → Redis Queue → Worker
                 → Pandas Analysis
                 → Charts and Visualizations
                 → PDF Report
```

Possible job states include:

`Queued` → `Processing` → `Completed` or `Failed`

## 🐳 Redis Setup with Docker

TaskFlow uses Redis as its distributed job queue.

Start the existing Redis container:

```powershell
docker start taskflow-redis
```

Verify that Redis is running:

```powershell
docker exec taskflow-redis redis-cli ping
```

Expected output:

```text
PONG
```

## ▶️ Running the Project Locally

### Prerequisites

Install or configure the following:

- Python
- Node.js and npm
- Docker Desktop
- Redis running in Docker

### 1. Start Redis

```powershell
docker start taskflow-redis
```

If the container does not exist, create a Redis container before proceeding.

### 2. Start the FastAPI Backend

Open a PowerShell terminal:

```powershell
cd C:\Users\praga\TaskFlow\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

Backend URL:

`http://127.0.0.1:8000`

API documentation:

`http://127.0.0.1:8000/docs`

### 3. Start Worker 1

Open a new PowerShell terminal:

```powershell
cd C:\Users\praga\TaskFlow\worker
..\backend\venv\Scripts\Activate.ps1
$env:WORKER_ID = "worker-1"
python worker.py
```

### 4. Start Worker 2

Open another PowerShell terminal:

```powershell
cd C:\Users\praga\TaskFlow\worker
..\backend\venv\Scripts\Activate.ps1
$env:WORKER_ID = "worker-2"
python worker.py
```

### 5. Start Worker 3

Open another PowerShell terminal:

```powershell
cd C:\Users\praga\TaskFlow\worker
..\backend\venv\Scripts\Activate.ps1
$env:WORKER_ID = "worker-3"
python worker.py
```

### 6. Start the React Dashboard

Open another PowerShell terminal:

```powershell
cd C:\Users\praga\TaskFlow\dashboard
npm install
npm run dev
```

Open the dashboard:

`http://localhost:5173/`

> These commands assume your local virtual environment, Redis container, dependencies, and project configuration are already set up. On a new machine, install the dependencies and configure the environment first.

## 🔄 Job Lifecycle

```text
Create Job
    ↓
FastAPI Backend
    ↓
Redis Queue
    ↓
Worker Receives Job
    ↓
Job Processing
    ↓
Output Generated
    ↓
Job Status Updated
    ↓
Worker Metrics Updated
    ↓
Dashboard Refreshed
```

## 🎯 Why TaskFlow?

TaskFlow demonstrates practical distributed-systems concepts beyond a traditional CRUD application.

Key concepts demonstrated include:

- Asynchronous job processing
- Message queues
- Independent worker processes
- Concurrent job execution
- Redis integration
- Docker-based infrastructure
- REST API development
- Machine-learning integration
- File processing and report generation
- Worker performance metrics
- System resource monitoring

## 🔮 Future Improvements

Potential enhancements include:

- Worker auto-scaling
- Job priorities
- Automatic retry policies
- Scheduled jobs
- Dead-letter queues
- Persistent job storage
- Authentication and authorization
- Rate limiting
- Job cancellation
- Workers distributed across multiple machines
- Prometheus and Grafana monitoring
- Kubernetes deployment

## 📌 Project Goal

TaskFlow was built to understand and demonstrate how distributed background-job systems work internally, including how an API, queue, workers, outputs, and monitoring layer operate together as one system.
