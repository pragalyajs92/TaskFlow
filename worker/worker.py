import redis
import json
import os
import re
import sys
import time
import random
from datetime import datetime


# =====================================================
# IMPORT PROJECT MODULES
# =====================================================

sys.path.append("../ml")
sys.path.append("../reports")

from house_price_model import predict_price
from report_generator import generate_report


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
# WORKER ID
# =====================================================

WORKER_ID = os.getenv(
    "WORKER_ID",
    "worker-1"
)


# =====================================================
# CURRENT JOB
# =====================================================

CURRENT_JOB_ID = ""
CURRENT_JOB_TYPE = ""


# =====================================================
# WORKER STATUS + METRICS
# =====================================================

def update_worker_status(
    status,
    current_job="",
    job_type=""
):
    """
    Store the worker's current state and metrics in Redis.
    """

    worker_key = f"worker:{WORKER_ID}"

    jobs_processed = int(
        redis_client.hget(worker_key, "jobs_processed") or 0
    )

    jobs_failed = int(
        redis_client.hget(worker_key, "jobs_failed") or 0
    )

    total_processing_time = float(
        redis_client.hget(worker_key, "total_processing_time") or 0
    )

    total_finished = jobs_processed + jobs_failed

    success_rate = (
        (jobs_processed / total_finished) * 100
        if total_finished > 0
        else 0
    )

    avg_processing_time = (
        total_processing_time / total_finished
        if total_finished > 0
        else 0
    )

    redis_client.hset(
        worker_key,
        mapping={
            "worker_id": WORKER_ID,
            "status": status,
            "current_job": current_job,
            "job_type": job_type,
            "last_heartbeat": datetime.now().isoformat(),
            "jobs_processed": jobs_processed,
            "jobs_failed": jobs_failed,
            "total_processing_time": round(
                total_processing_time,
                2
            ),
            "success_rate": round(
                success_rate,
                2
            ),
            "avg_processing_time": round(
                avg_processing_time,
                2
            )
        }
    )


def record_job_metrics(
    success,
    processing_time
):
    """
    Record one finished job for this worker.
    """

    worker_key = f"worker:{WORKER_ID}"

    jobs_processed = int(
        redis_client.hget(worker_key, "jobs_processed") or 0
    )

    jobs_failed = int(
        redis_client.hget(worker_key, "jobs_failed") or 0
    )

    total_processing_time = float(
        redis_client.hget(worker_key, "total_processing_time") or 0
    )

    if success:
        jobs_processed += 1
    else:
        jobs_failed += 1

    total_processing_time += processing_time

    total_finished = jobs_processed + jobs_failed

    success_rate = (
        (jobs_processed / total_finished) * 100
        if total_finished > 0
        else 0
    )

    avg_processing_time = (
        total_processing_time / total_finished
        if total_finished > 0
        else 0
    )

    redis_client.hset(
        worker_key,
        mapping={
            "jobs_processed": jobs_processed,
            "jobs_failed": jobs_failed,
            "total_processing_time": round(
                total_processing_time,
                2
            ),
            "success_rate": round(
                success_rate,
                2
            ),
            "avg_processing_time": round(
                avg_processing_time,
                2
            )
        }
    )


def initialize_worker_metrics():
    """
    Create metric fields only if they do not exist.
    Existing metrics survive worker restarts.
    """

    worker_key = f"worker:{WORKER_ID}"

    if not redis_client.hexists(
        worker_key,
        "jobs_processed"
    ):
        redis_client.hset(
            worker_key,
            "jobs_processed",
            0
        )

    if not redis_client.hexists(
        worker_key,
        "jobs_failed"
    ):
        redis_client.hset(
            worker_key,
            "jobs_failed",
            0
        )

    if not redis_client.hexists(
        worker_key,
        "total_processing_time"
    ):
        redis_client.hset(
            worker_key,
            "total_processing_time",
            0
        )

    update_worker_status("idle")


# =====================================================
# DEMO PROCESSING DELAY
# =====================================================

def demo_processing_delay():
    """
    Artificial delay for dashboard demonstration.

    Every job takes between 10 and 30 seconds
    so that the dashboard can visibly show:

    Waiting → Processing → Completed
    """

    delay = random.randint(
        10,
        30
    )

    print(
        f"Demo processing delay: {delay} seconds"
    )

    for remaining in range(
        delay,
        0,
        -1
    ):

        print(
            f"Processing... {remaining}s remaining"
        )

        update_worker_status(
            "processing",
            CURRENT_JOB_ID,
            CURRENT_JOB_TYPE
        )

        time.sleep(1)


# =====================================================
# START WORKER
# =====================================================

initialize_worker_metrics()

print("===================================")
print("TaskFlow Worker Started")
print("Worker ID:", WORKER_ID)
print("Waiting for jobs...")
print("===================================")


# =====================================================
# WORKER LOOP
# =====================================================

while True:

    update_worker_status(
        "idle"
    )

    result = redis_client.blpop(
        "task_queue",
        timeout=2
    )

    if not result:
        continue

    queue_name, job_data = result

    job = json.loads(
        job_data
    )

    job_id = job["job_id"]
    job_type = job["type"]

    CURRENT_JOB_ID = job_id
    CURRENT_JOB_TYPE = job_type

    print("\n-----------------------------")
    print("New job received!")
    print("Worker:", WORKER_ID)
    print("Job ID:", job_id)
    print("Job Type:", job_type)
    print("Data:", job["data"])
    print("-----------------------------")

    redis_client.hset(
        f"job:{job_id}",
        mapping={
            "status": "processing",
            "worker": WORKER_ID
        }
    )

    update_worker_status(
        "processing",
        job_id,
        job_type
    )

    # Start timing before the actual operation + demo delay.
    job_start_time = time.perf_counter()

    try:

        # =================================================
        # IMAGE RESIZE
        # =================================================

        if job_type == "image_resize":

            from PIL import Image

            filename = job["data"]

            input_path = os.path.join(
                "..",
                "input",
                filename
            )

            output_path = os.path.join(
                "..",
                "output",
                "resized_" + filename
            )

            print(
                "Processing image..."
            )

            image = Image.open(
                input_path
            )

            print(
                "Original size:",
                image.size
            )

            resized_image = image.resize(
                (800, 600)
            )

            resized_image.save(
                output_path
            )

            print(
                "Resized image saved to:",
                output_path
            )

            print(
                "New size:",
                resized_image.size
            )


        # =================================================
        # HOUSE PRICE PREDICTION
        # =================================================

        elif job_type == "house_price_prediction":

            data = job["data"]

            # New house-price inputs
            area = data["area"]
            bedrooms = data["bedrooms"]
            bathrooms = data["bathrooms"]
            property_age = data["property_age"]
            floors = data["floors"]
            parking = data["parking"]
            furnishing = data["furnishing"]
            location = data["location"]

            print(
                "Running house price prediction..."
            )

            print(
                "Area:",
                area,
                "sq ft"
            )

            print(
                "Bedrooms:",
                bedrooms
            )

            print(
                "Bathrooms:",
                bathrooms
            )

            print(
                "Property Age:",
                property_age,
                "years"
            )

            print(
                "Floors:",
                floors
            )

            print(
                "Parking:",
                parking
            )

            print(
                "Furnishing:",
                furnishing
            )

            print(
                "Location:",
                location
            )

            prediction = predict_price(
                area,
                bedrooms,
                bathrooms,
                property_age,
                floors,
                parking,
                furnishing,
                location
            )

            print(
                "Predicted house price:",
                prediction,
                "lakhs"
            )

            redis_client.hset(
                f"job:{job_id}",
                "result",
                str(prediction)
            )


        # =================================================
        # REPORT GENERATION
        # =================================================

        elif job_type == "report_generation":

            # Report jobs get their own output file so that
            # multiple reports never overwrite each other.
            report_data = job["data"]

            if isinstance(report_data, dict):
                filename = report_data.get(
                    "filename",
                    ""
                )

                requested_name = report_data.get(
                    "report_name",
                    ""
                )

            else:
                filename = report_data
                requested_name = ""

            input_path = os.path.join(
                "..",
                "input",
                filename
            )

            # Use the user's report name when provided.
            # Fall back to a clear default name.
            base_name = (
                os.path.splitext(
                    requested_name.strip()
                )[0]
                if requested_name.strip()
                else "sales_analysis_report"
            )

            # Keep the filename safe for Windows/Linux.
            safe_name = re.sub(
                r"[^A-Za-z0-9_-]+",
                "_",
                base_name
            ).strip("_")

            if not safe_name:
                safe_name = "sales_analysis_report"

            output_filename = (
                f"{safe_name}_{job_id[:8]}.pdf"
            )

            output_path = os.path.join(
                "..",
                "output",
                output_filename
            )

            print(
                "Generating report..."
            )

            generate_report(
                input_path,
                output_path,
                requested_name.strip()
                or "Sales Analysis Report"
            )

            # Store the exact output filename on this job.
            redis_client.hset(
                f"job:{job_id}",
                mapping={
                    "output_file": output_filename,
                    "result": output_filename
                }
            )

            print(
                "Report generation completed!"
            )


        # =================================================
        # UNKNOWN JOB
        # =================================================

        else:

            raise Exception(
                f"Unknown job type: {job_type}"
            )


        # =================================================
        # DEMO DELAY
        # =================================================

        demo_processing_delay()

        processing_time = (
            time.perf_counter()
            - job_start_time
        )

        record_job_metrics(
            success=True,
            processing_time=processing_time
        )

        redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": "completed",
                "worker": WORKER_ID,
                "completed_at": datetime.now().isoformat(),
                "error": ""
            }
        )

        update_worker_status(
            "idle"
        )

        CURRENT_JOB_ID = ""
        CURRENT_JOB_TYPE = ""

        print(
            f"Job completed in {processing_time:.2f}s!"
        )


    except Exception as e:

        processing_time = (
            time.perf_counter()
            - job_start_time
        )

        record_job_metrics(
            success=False,
            processing_time=processing_time
        )

        redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": "failed",
                "worker": WORKER_ID,
                "completed_at": datetime.now().isoformat(),
                "error": str(e)
            }
        )

        update_worker_status(
            "idle"
        )

        CURRENT_JOB_ID = ""
        CURRENT_JOB_TYPE = ""

        print(
            "Job failed:",
            str(e)
        )