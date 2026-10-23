TaskFlow --- Distributed Job Queue

TaskFlow is a distributed background job processing system built to
demonstrate how jobs can be submitted to a queue, distributed across
multiple workers, processed asynchronously, and monitored through a live
dashboard.

🚀 Overview

TaskFlow accepts different types of computational jobs through a FastAPI
backend. Jobs are placed into a Redis queue and are picked up by
independent worker processes.

                    ┌─────────────────────┐
                    │   React Dashboard   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    FastAPI API      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Redis Queue      │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
          ┌────────────┐ ┌────────────┐ ┌────────────┐
          │  Worker 1  │ │  Worker 2  │ │  Worker 3  │
          └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
                │              │              │
                └──────────────┼──────────────┘
                               ▼
                         Output Files

✨ Features

Distributed Job Queue

Jobs are submitted to a Redis-backed queue.

Multiple worker processes can consume jobs independently.

Workers can run simultaneously and distribute the workload.

Supported Jobs

1. Image Resize

Upload an image and TaskFlow processes it through a background worker.

Input - Image file

Output - Resized image saved in the output directory

2. House Price Prediction

Runs a machine-learning prediction using a trained Linear Regression
model.

Input - Area - Number of bedrooms - Number of bathrooms

Output - Predicted house price

3. Report Generation

Accepts sales data in CSV/XLSX format and generates a PDF analysis
report.

The report can contain: - Sales statistics - Sales trends - Category
analysis - Generated charts

👷 Workers

TaskFlow supports multiple worker processes.

Example:

worker-1
worker-2
worker-3

Each worker maintains its own status in Redis.

The dashboard displays: - Online / Offline status - Idle / Processing
status - Current job - Job ID - Job type - Processing progress

📊 Worker Metrics

Each worker records runtime metrics including:

Jobs processed

Jobs failed

Success rate

Average processing time

Example:

Jobs Processed     12
Success Rate       100%
Avg Processing     14.3s

These values are maintained by the workers and displayed on the
dashboard.

🩺 System Health

TaskFlow also monitors the machine running the backend.

The dashboard displays live:

CPU usage

CPU core count

Memory usage

Memory used / total

Disk usage

Disk used / total

Example:

CPU       89%       8 cores
Memory    92.9%     10.9 / 11.7 GB
Disk      80.9%     184.5 / 228.2 GB

The system-health endpoint is:

GET /system/health

🖥️ Dashboard

The React dashboard provides:

Total job statistics

Completed / processing / failed jobs

Job creation cards

Run All Jobs

Worker monitoring

Worker metrics

Queue status

System health

Job history

Output downloads

🛠️ Technology Stack

Component           Technology

Frontend            React
Backend             FastAPI
Queue               Redis
Containerization    Docker
Workers             Python
ML                  Scikit-learn
Data Processing     Pandas
Report Generation   Matplotlib / ReportLab
Image Processing    Pillow
System Monitoring   psutil
API Server          Uvicorn

📁 Project Structure

TaskFlow/
│
├── backend/
│   ├── main.py
│   └── venv/
│
├── dashboard/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
├── input/
│   ├── images
│   └── sales datasets
│
├── ml/
│   └── house_price_model.py
│
├── output/
│   ├── resized images
│   ├── generated reports
│   └── generated charts
│
├── reports/
│   └── report_generator.py
│
└── worker/
    └── worker.py

⚙️ How It Works

1. Submit a Job

The dashboard sends a job request to FastAPI.

2. Add Job to Redis

FastAPI places the job into the Redis task_queue.

3. Worker Picks Up the Job

An available worker listens to the queue and retrieves the next job.

4. Process the Job

The worker performs the required operation.

Image Resize
     ↓
Pillow
     ↓
Resized Image

House Price
     ↓
Scikit-learn Model
     ↓
Prediction

Sales Dataset
     ↓
Pandas
     ↓
Analysis + Charts
     ↓
PDF Report

5. Update Job Status

The worker updates the job state and its own worker metrics in Redis.

Possible job states include:

Queued
Processing
Completed
Failed

6. Dashboard Updates

The dashboard periodically retrieves the latest job and worker
information and displays it in real time.

🐳 Redis with Docker

TaskFlow uses Redis as the distributed job queue.

Start the existing Redis container:

docker start taskflow-redis

Check Redis:

docker exec taskflow-redis redis-cli ping

Expected:

PONG

▶️ Running the Project

1. Start Redis

docker start taskflow-redis

2. Start the Backend

Open a terminal:

cd C:\Users\praga\TaskFlow\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload

Backend:

http://127.0.0.1:8000

3. Start Worker 1

Open another terminal:

cd C:\Users\praga\TaskFlow\worker
..\backend\venv\Scripts\Activate.ps1
$env:WORKER_ID="worker-1"
python worker.py

4. Start Worker 2

Open another terminal:

cd C:\Users\praga\TaskFlow\worker
..\backend\venv\Scripts\Activate.ps1
$env:WORKER_ID="worker-2"
python worker.py

5. Start Worker 3

Open another terminal:

cd C:\Users\praga\TaskFlow\worker
..\backend\venv\Scripts\Activate.ps1
$env:WORKER_ID="worker-3"
python worker.py

6. Start the Dashboard

Open another terminal:

cd C:\Users\praga\TaskFlow\dashboard
npm run dev

Open:

http://localhost:5173/

🔄 Job Lifecycle

Create Job
    ↓
FastAPI
    ↓
Redis Queue
    ↓
Worker receives job
    ↓
Processing
    ↓
Output generated
    ↓
Job completed
    ↓
Worker metrics updated
    ↓
Dashboard refreshed

🎯 Why TaskFlow?

TaskFlow demonstrates practical distributed-systems concepts rather than
being only a CRUD application.

It demonstrates:

Asynchronous processing

Message queues

Worker processes

Parallel job execution

Redis

Docker

REST APIs

Background processing

Machine-learning integration

File processing

Runtime monitoring

Worker health and metrics

Resource monitoring

🔮 Possible Future Improvements

Potential extensions include:

Worker auto-scaling

Job priorities

Retry policies

Scheduled jobs

Dead-letter queues

Persistent job storage

Authentication

Rate limiting

Job cancellation

Distributed worker deployment across multiple machines

Prometheus/Grafana monitoring

Kubernetes deployment

📌 Project Goal

TaskFlow was built to understand and demonstrate how distributed
background-job systems work internally, including how an API, queue,
workers, outputs, and monitoring layer work together as one system.