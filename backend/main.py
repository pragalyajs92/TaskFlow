from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis
import uuid
import json
import os
import psutil
from datetime import datetime


# =====================================================
# FASTAPI
# =====================================================

app = FastAPI(
    title="TaskFlow API",
    description="Distributed Job Queue API"
)


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# REDIS
# =====================================================

redis_client = redis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True,
    socket_timeout=None
)


# =====================================================
# FOLDERS
# =====================================================

INPUT_FOLDER = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "input"
    )
)

OUTPUT_FOLDER = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "output"
    )
)

os.makedirs(
    INPUT_FOLDER,
    exist_ok=True
)

os.makedirs(
    OUTPUT_FOLDER,
    exist_ok=True
)


# =====================================================
# WORKERS
# =====================================================

WORKER_IDS = [
    "worker-1",
    "worker-2",
    "worker-3"
]

WORKER_TIMEOUT = 6


# =====================================================
# REQUEST MODEL
# =====================================================

class JobRequest(BaseModel):

    type: str

    data: dict | str


# =====================================================
# HOME
# =====================================================

@app.get("/")
def home():

    return {
        "message": "TaskFlow Job Queue API is running!"
    }


# =====================================================
# UPLOAD FILE
# =====================================================

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...)
):

    file_path = os.path.join(
        INPUT_FOLDER,
        file.filename
    )

    contents = await file.read()

    with open(
        file_path,
        "wb"
    ) as buffer:

        buffer.write(contents)

    return {
        "message": "File uploaded successfully",
        "filename": file.filename
    }


# =====================================================
# CREATE JOB
# =====================================================

@app.post("/jobs")
def create_job(
    job: JobRequest
):

    job_id = str(
        uuid.uuid4()
    )

    created_at = datetime.now().isoformat()

    job_data = {

        "job_id": job_id,

        "type": job.type,

        "data": job.data,

        "status": "pending",

        "worker": "",

        "created_at": created_at,

        "completed_at": "",

        "error": ""
    }


    # -------------------------------------------------
    # Save job in Redis
    # -------------------------------------------------

    redis_client.hset(
        f"job:{job_id}",
        mapping={

            "job_id": job_id,

            "type": job.type,

            "data": json.dumps(
                job.data
            ),

            "status": "pending",

            "worker": "",

            "created_at": created_at,

            "completed_at": "",

            "error": ""
        }
    )


    # -------------------------------------------------
    # Add job to queue
    # -------------------------------------------------

    redis_client.rpush(
        "task_queue",
        json.dumps(
            job_data
        )
    )


    # -------------------------------------------------
    # Add to history
    # -------------------------------------------------

    redis_client.lpush(
        "job_history",
        job_id
    )


    return job_data


# =====================================================
# GET SINGLE JOB
# =====================================================

@app.get("/jobs/{job_id}")
def get_job(
    job_id: str
):

    job = redis_client.hgetall(
        f"job:{job_id}"
    )

    if not job:

        return {
            "error": "Job not found"
        }


    if "data" in job:

        try:

            job["data"] = json.loads(
                job["data"]
            )

        except Exception:

            pass


    return job


# =====================================================
# GET ALL JOBS
# =====================================================

@app.get("/jobs")
def get_jobs():

    job_ids = redis_client.lrange(
        "job_history",
        0,
        49
    )

    jobs = []


    for job_id in job_ids:

        job = redis_client.hgetall(
            f"job:{job_id}"
        )

        if not job:
            continue


        if "data" in job:

            try:

                job["data"] = json.loads(
                    job["data"]
                )

            except Exception:

                pass


        jobs.append(
            job
        )


    return jobs


# =====================================================
# QUEUE STATUS
# =====================================================

@app.get("/queue/status")
def queue_status():

    waiting = redis_client.llen(
        "task_queue"
    )

    processing = 0

    completed = 0

    failed = 0


    job_ids = redis_client.lrange(
        "job_history",
        0,
        -1
    )


    for job_id in job_ids:

        job = redis_client.hgetall(
            f"job:{job_id}"
        )

        if not job:
            continue


        status = job.get(
            "status",
            ""
        )


        if status == "processing":

            processing += 1

        elif status == "completed":

            completed += 1

        elif status == "failed":

            failed += 1


    total = len(
        job_ids
    )


    return {

        "total": total,

        "waiting": waiting,

        "processing": processing,

        "completed": completed,

        "failed": failed
    }


# =====================================================
# WORKER STATUS
# =====================================================

@app.get("/workers")
def get_workers():

    workers = []

    now = datetime.now()


    for worker_id in WORKER_IDS:

        worker_key = (
            f"worker:{worker_id}"
        )

        worker = redis_client.hgetall(
            worker_key
        )


        # ---------------------------------------------
        # Worker has never connected
        # ---------------------------------------------

        if not worker:

            workers.append({

                "worker_id": worker_id,

                "status": "offline",

                "current_job": "",

                "job_type": "",

                "last_heartbeat": ""
            })

            continue


        # ---------------------------------------------
        # Check heartbeat
        # ---------------------------------------------

        last_heartbeat = worker.get(
            "last_heartbeat",
            ""
        )


        is_online = False


        if last_heartbeat:

            try:

                heartbeat_time = (
                    datetime.fromisoformat(
                        last_heartbeat
                    )
                )

                elapsed = (
                    now - heartbeat_time
                ).total_seconds()


                if elapsed <= WORKER_TIMEOUT:

                    is_online = True

            except Exception:

                is_online = False


        # ---------------------------------------------
        # Offline
        # ---------------------------------------------

        if not is_online:

            workers.append({

                "worker_id": worker_id,

                "status": "offline",

                "current_job": "",

                "job_type": "",

                "last_heartbeat": last_heartbeat
            })

            continue


        # ---------------------------------------------
        # Online / Processing / Idle
        # ---------------------------------------------

        status = worker.get(
            "status",
            "idle"
        )

        current_job = worker.get(
            "current_job",
            ""
        )

        job_type = worker.get(
            "job_type",
            ""
        )


        workers.append({

            "worker_id": worker_id,

            "status": status,

            "current_job": current_job,

            "job_type": job_type,

            "last_heartbeat": last_heartbeat,

            "jobs_processed": int(
                worker.get("jobs_processed", 0)
            ),

            "jobs_failed": int(
                worker.get("jobs_failed", 0)
            ),

            "success_rate": float(
                worker.get("success_rate", 0)
            ),

            "avg_processing_time": float(
                worker.get("avg_processing_time", 0)
            )
        })


    return workers



# =====================================================
# SYSTEM HEALTH
# =====================================================

@app.get("/system/health")
def system_health():

    # CPU
    cpu_percent = psutil.cpu_percent(interval=0.2)
    cpu_cores = psutil.cpu_count(logical=True)

    # Memory
    memory = psutil.virtual_memory()
    memory_percent = memory.percent
    memory_used_gb = round(
        memory.used / (1024 ** 3),
        1
    )
    memory_total_gb = round(
        memory.total / (1024 ** 3),
        1
    )

    # Disk
    disk = psutil.disk_usage(os.path.abspath(os.sep))
    disk_percent = disk.percent
    disk_used_gb = round(
        disk.used / (1024 ** 3),
        1
    )
    disk_total_gb = round(
        disk.total / (1024 ** 3),
        1
    )

    return {
        "cpu": {
            "percent": cpu_percent,
            "cores": cpu_cores
        },
        "memory": {
            "percent": memory_percent,
            "used_gb": memory_used_gb,
            "total_gb": memory_total_gb
        },
        "disk": {
            "percent": disk_percent,
            "used_gb": disk_used_gb,
            "total_gb": disk_total_gb
        }
    }

# =====================================================
# DOWNLOAD OUTPUT FILE
# =====================================================

@app.get("/download/{filename}")
def download_file(
    filename: str
):

    safe_filename = os.path.basename(
        filename
    )

    file_path = os.path.join(
        OUTPUT_FOLDER,
        safe_filename
    )


    if not os.path.isfile(
        file_path
    ):

        raise HTTPException(
            status_code=404,
            detail="File not found"
        )


    return FileResponse(

        path=file_path,

        filename=safe_filename,

        media_type="application/octet-stream"
    )