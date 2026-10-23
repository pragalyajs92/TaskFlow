import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  // =====================================================
  // STATE
  // =====================================================

  const [stats, setStats] = useState({
    total: 0,
    waiting: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });

  const [jobs, setJobs] = useState([]);
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    cpu: { percent: 0, cores: 0 },
    memory: { percent: 0, used_gb: 0, total_gb: 0 },
    disk: { percent: 0, used_gb: 0, total_gb: 0 },
  });

  // Image Resize jobs
  const makeJobId = () =>
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const createImageForm = () => ({
    id: makeJobId(),
    file: null,
    loading: false,
    outputUrl: "",
  });

  const createHouseForm = () => ({
    id: makeJobId(),
    area: "",
    bedrooms: "",
    bathrooms: "",
    property_age: "",
    floors: "",
    parking: "",
    furnishing: "Semi-Furnished",
    location: "Anna Nagar, Chennai",
    loading: false,
    result: null,
  });

  const [imageJobs, setImageJobs] = useState([createImageForm()]);
  const [houseJobs, setHouseJobs] = useState([createHouseForm()]);
  // Report Generation jobs
  const createReportForm = () => ({
    id: makeJobId(),
    file: null,
    reportName: "",
    loading: false,
    generated: false,
    outputFile: "",
  });

  const [reportJobs, setReportJobs] = useState([
    createReportForm(),
  ]);

  // =====================================================
  // FETCH QUEUE STATUS
  // =====================================================

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(
        `${API_URL}/queue/status`
      );

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      const data = await response.json();

      setStats({
        total: data.total ?? 0,
        waiting: data.waiting ?? 0,
        processing: data.processing ?? 0,
        completed: data.completed ?? 0,
        failed: data.failed ?? 0,
      });

      setBackendConnected(true);
    } catch (error) {
      console.error(error);
      setBackendConnected(false);
    }
  };

  // =====================================================
  // FETCH JOB HISTORY
  // =====================================================

  const fetchJobs = async () => {
    try {
      const response = await fetch(
        `${API_URL}/jobs`
      );

      if (!response.ok) {
        throw new Error("Could not fetch jobs");
      }

      const data = await response.json();

      setJobs(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);
    }
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${API_URL}/workers`);
      if (!response.ok) throw new Error("Could not fetch workers");
      const data = await response.json();
      setWorkers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/system/health`);
      if (!response.ok) throw new Error("System health request failed");
      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error("System health error:", error);
    }
  };

  const refreshDashboard = () => {
    fetchQueueStatus();
    fetchJobs();
    fetchWorkers();
    fetchSystemHealth();
  };

  // =====================================================
  // AUTO REFRESH EVERY 2 SECONDS
  // =====================================================

  useEffect(() => {
    refreshDashboard();

    const interval = setInterval(
      refreshDashboard,
      2000
    );

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // FILE UPLOAD
  // =====================================================

  const uploadFile = async (file) => {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
      `${API_URL}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("File upload failed");
    }

    return await response.json();
  };

  // =====================================================
  // CREATE JOB
  // =====================================================

  const createJob = async (type, data) => {
    const response = await fetch(
      `${API_URL}/jobs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          data,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        "Failed to create job"
      );
    }

    return await response.json();
  };

  // =====================================================
  // IMAGE SELECT / DROP
  // =====================================================

  const updateImageJob = (jobId, changes) => {
    setImageJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, ...changes } : job
      )
    );
  };

  const handleImageChange = (jobId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    updateImageJob(jobId, {
      file,
      outputUrl: "",
    });
  };

  const handleImageDrop = (jobId, event) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    updateImageJob(jobId, {
      file,
      outputUrl: "",
    });
  };

  const addAnotherImageJob = () => {
    setImageJobs((prev) => [...prev, createImageForm()]);
  };

  // =====================================================
  // REPORT SELECT / DROP
  // =====================================================

  const updateReportJob = (jobId, changes) => {
    setReportJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, ...changes } : job
      )
    );
  };

  const handleCsvChange = (jobId, event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    updateReportJob(jobId, {
      file,
      generated: false,
    });
  };

  const handleCsvDrop = (jobId, event) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    updateReportJob(jobId, {
      file,
      generated: false,
    });
  };

  const addAnotherReportJob = () => {
    setReportJobs((prev) => [...prev, createReportForm()]);
  };

  // =====================================================
  // IMAGE RESIZE
  // =====================================================

  const handleImageResize = async (jobId) => {
    const imageJob = imageJobs.find((job) => job.id === jobId);

    if (!imageJob?.file) {
      alert("Please select an image first.");
      return;
    }

    try {
      updateImageJob(jobId, { loading: true });

      const uploadResult = await uploadFile(imageJob.file);

      const job = await createJob(
        "image_resize",
        uploadResult.filename
      );

      refreshDashboard();

      // Wait for the worker to finish the image resize.
      for (let i = 0; i < 70; i++) {
        await new Promise(
          (resolve) => setTimeout(resolve, 500)
        );

        const response = await fetch(
          `${API_URL}/jobs/${job.job_id}`
        );

        if (!response.ok) continue;

        const result = await response.json();

        if (result.status === "completed") {
          const outputFilename =
            result.result?.output_file ||
            result.result?.filename ||
            result.output_file ||
            `resized_${uploadResult.filename}`;

          updateImageJob(jobId, {
            loading: false,
            outputUrl: `${API_URL}/download/${encodeURIComponent(
              outputFilename
            )}`,
          });

          refreshDashboard();
          return;
        }

        if (result.status === "failed") {
          alert(
            result.error || "Image resize failed."
          );
          return;
        }
      }

      alert("Image resize is taking longer than expected.");
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Image resize failed."
      );
    } finally {
      updateImageJob(jobId, { loading: false });
    }
  };
  // =====================================================
  // HOUSE PRICE
  // =====================================================

  const updateHouseJob = (jobId, changes) => {
    setHouseJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, ...changes } : job
      )
    );
  };

  const addAnotherHouseJob = () => {
    setHouseJobs((prev) => [...prev, createHouseForm()]);
  };

  const handlePrediction = async (jobId) => {
    const houseJob = houseJobs.find((job) => job.id === jobId);

    if (
      !houseJob?.area ||
      !houseJob?.bedrooms ||
      !houseJob?.bathrooms ||
      !houseJob?.property_age ||
      !houseJob?.floors ||
      !houseJob?.parking ||
      !houseJob?.furnishing ||
      !houseJob?.location
    ) {
      alert(
        "Please enter all house details."
      );
      return;
    }

    try {
      updateHouseJob(jobId, { loading: true });

      const job = await createJob(
        "house_price_prediction",
        {
          area: Number(houseJob.area),
          bedrooms: Number(houseJob.bedrooms),
          bathrooms: Number(houseJob.bathrooms),
          property_age: Number(houseJob.property_age),
          floors: Number(houseJob.floors),
          parking: Number(houseJob.parking),
          furnishing: houseJob.furnishing,
          location: houseJob.location,
        }
      );

      refreshDashboard();

      // Wait for worker result.
      for (let i = 0; i < 70; i++) {
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 500)
        );

        const response = await fetch(
          `${API_URL}/jobs/${job.job_id}`
        );

        if (!response.ok) continue;

        const result = await response.json();

        if (result.status === "completed") {
          updateHouseJob(jobId, {
            loading: false,
            result: result.result,
          });
          refreshDashboard();
          return;
        }

        if (result.status === "failed") {
          alert(
            result.error ||
              "Prediction failed."
          );
          return;
        }
      }

      alert("Prediction is taking longer than expected.");
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Prediction failed."
      );
    } finally {
      updateHouseJob(jobId, { loading: false });
    }
  };
  // =====================================================
  // RUN ALL IMAGE + HOUSE JOBS
  // =====================================================

  const handleRunAllJobs = async () => {
    const readyImageJobs = imageJobs.filter(
      (job) => job.file && !job.loading
    );

    const readyHouseJobs = houseJobs.filter(
      (job) =>
        job.area &&
        job.bedrooms &&
        job.bathrooms &&
        job.property_age &&
        job.floors &&
        job.parking &&
        job.furnishing &&
        job.location &&
        !job.loading
    );

    const readyReportJobs = reportJobs.filter(
      (job) => job.file && !job.loading
    );

    if (
      readyImageJobs.length === 0 &&
      readyHouseJobs.length === 0 &&
      readyReportJobs.length === 0
    ) {
      alert(
        "Add at least one Image Resize or House Price job first."
      );
      return;
    }

    // Submit all jobs without waiting for each one.
    // Redis will queue them and the available workers
    // will distribute the work automatically.
    const submissions = [];

    for (const imageJob of readyImageJobs) {
      try {
        updateImageJob(imageJob.id, { loading: true });

        const uploadResult = await uploadFile(imageJob.file);

        const job = await createJob(
          "image_resize",
          uploadResult.filename
        );

        submissions.push({
          type: "image",
          formId: imageJob.id,
          jobId: job.job_id,
          filename: uploadResult.filename,
        });
      } catch (error) {
        console.error("Image job submission failed:", error);
        updateImageJob(imageJob.id, { loading: false });
      }
    }

    for (const houseJob of readyHouseJobs) {
      try {
        updateHouseJob(houseJob.id, { loading: true });

        const job = await createJob(
          "house_price_prediction",
          {
            area: Number(houseJob.area),
            bedrooms: Number(houseJob.bedrooms),
            bathrooms: Number(houseJob.bathrooms),
          }
        );

        submissions.push({
          type: "house",
          formId: houseJob.id,
          jobId: job.job_id,
        });
      } catch (error) {
        console.error("House job submission failed:", error);
        updateHouseJob(houseJob.id, { loading: false });
      }
    }

    refreshDashboard();

    // Poll every submitted job independently.
    for (const submission of submissions) {
      (async () => {
        try {
          for (let i = 0; i < 70; i++) {
            await new Promise(
              (resolve) => setTimeout(resolve, 500)
            );

            const response = await fetch(
              `${API_URL}/jobs/${submission.jobId}`
            );

            if (!response.ok) continue;

            const result = await response.json();

            if (result.status === "completed") {
              if (submission.type === "image") {
                const outputFilename =
                  result.result?.output_file ||
                  result.result?.filename ||
                  result.output_file ||
                  `resized_${submission.filename}`;

                updateImageJob(submission.formId, {
                  loading: false,
                  outputUrl:
                    `${API_URL}/download/${encodeURIComponent(
                      outputFilename
                    )}`,
                });
              } else {
                updateHouseJob(submission.formId, {
                  loading: false,
                  result: result.result,
                });
              }

              refreshDashboard();
              return;
            }

            if (result.status === "failed") {
              if (submission.type === "image") {
                updateImageJob(submission.formId, {
                  loading: false,
                });
              } else {
                updateHouseJob(submission.formId, {
                  loading: false,
                });
              }

              refreshDashboard();
              return;
            }
          }

          if (submission.type === "image") {
            updateImageJob(submission.formId, {
              loading: false,
            });
          } else {
            updateHouseJob(submission.formId, {
              loading: false,
            });
          }
        } catch (error) {
          console.error(
            `Job ${submission.jobId} polling failed:`,
            error
          );

          if (submission.type === "image") {
            updateImageJob(submission.formId, {
              loading: false,
            });
          } else {
            updateHouseJob(submission.formId, {
              loading: false,
            });
          }
        }
      })();
    }

    for (const reportJob of readyReportJobs) {
      try {
        updateReportJob(reportJob.id, {
          loading: true,
          generated: false,
          outputFile: "",
        });

        const uploadResult =
          await uploadFile(reportJob.file);

        const job = await createJob(
          "report_generation",
          uploadResult.filename
        );

        submissions.push({
          type: "report",
          formId: reportJob.id,
          jobId: job.job_id,
        });
      } catch (error) {
        console.error(
          "Report job submission failed:",
          error
        );

        updateReportJob(reportJob.id, {
          loading: false,
        });
      }
    }

    refreshDashboard();

    for (const submission of submissions.filter(
      (item) => item.type === "report"
    )) {
      (async () => {
        try {
          for (let i = 0; i < 70; i++) {
            await new Promise(
              (resolve) => setTimeout(resolve, 500)
            );

            const response = await fetch(
              `${API_URL}/jobs/${submission.jobId}`
            );

            if (!response.ok) continue;

            const result = await response.json();

            if (result.status === "completed") {
              updateReportJob(submission.formId, {
                loading: false,
                generated: true,
                outputFile: result.output_file || result.result || "",
              });

              refreshDashboard();
              return;
            }

            if (result.status === "failed") {
              updateReportJob(submission.formId, {
                loading: false,
              });

              refreshDashboard();
              return;
            }
          }

          updateReportJob(submission.formId, {
            loading: false,
          });
        } catch (error) {
          console.error(
            `Report job ${submission.jobId} polling failed:`,
            error
          );

          updateReportJob(submission.formId, {
            loading: false,
          });
        }
      })();
    }
  };

  // =====================================================
  // REPORT GENERATION
  // =====================================================

  const handleReportGeneration = async (jobId) => {
    const reportJob = reportJobs.find(
      (job) => job.id === jobId
    );

    if (!reportJob?.file) {
      alert("Please select a CSV or XLSX file first.");
      return;
    }

    try {
      updateReportJob(jobId, {
        loading: true,
        generated: false,
        outputFile: "",
      });

      const uploadResult =
        await uploadFile(reportJob.file);

      const job = await createJob(
        "report_generation",
        uploadResult.filename
      );

      refreshDashboard();

      // Wait for the worker to finish the report.
      for (let i = 0; i < 70; i++) {
        await new Promise(
          (resolve) => setTimeout(resolve, 500)
        );

        const response = await fetch(
          `${API_URL}/jobs/${job.job_id}`
        );

        if (!response.ok) continue;

        const result = await response.json();

        if (result.status === "completed") {
          updateReportJob(jobId, {
            loading: false,
            generated: true,
            outputFile: result.output_file || result.result || "",
          });

          refreshDashboard();
          return;
        }

        if (result.status === "failed") {
          alert(
            result.error ||
              "Report generation failed."
          );
          return;
        }
      }

      alert(
        "Report generation is taking longer than expected."
      );
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Report generation failed."
      );
    } finally {
      updateReportJob(jobId, {
        loading: false,
      });
    }
  };

  // =====================================================
  // RUN ALL REPORT JOBS
  // =====================================================

  const submitAllReportJobs = async () => {
    const readyReports = reportJobs.filter(
      (job) => job.file && !job.loading
    );

    const submissions = [];

    for (const reportJob of readyReports) {
      try {
        updateReportJob(reportJob.id, {
          loading: true,
          generated: false,
          outputFile: "",
        });

        const uploadResult =
          await uploadFile(reportJob.file);

        const job = await createJob(
          "report_generation",
          uploadResult.filename
        );

        submissions.push({
          formId: reportJob.id,
          jobId: job.job_id,
        });
      } catch (error) {
        console.error(
          "Report job submission failed:",
          error
        );

        updateReportJob(reportJob.id, {
          loading: false,
        });
      }
    }

    refreshDashboard();

    // Poll every submitted report independently.
    for (const submission of submissions) {
      (async () => {
        try {
          for (let i = 0; i < 70; i++) {
            await new Promise(
              (resolve) => setTimeout(resolve, 500)
            );

            const response = await fetch(
              `${API_URL}/jobs/${submission.jobId}`
            );

            if (!response.ok) continue;

            const result = await response.json();

            if (result.status === "completed") {
              updateReportJob(submission.formId, {
                loading: false,
                generated: true,
                outputFile: result.output_file || result.result || "",
              });

              refreshDashboard();
              return;
            }

            if (result.status === "failed") {
              updateReportJob(submission.formId, {
                loading: false,
              });

              refreshDashboard();
              return;
            }
          }

          updateReportJob(submission.formId, {
            loading: false,
          });
        } catch (error) {
          console.error(
            `Report job ${submission.jobId} polling failed:`,
            error
          );

          updateReportJob(submission.formId, {
            loading: false,
          });
        }
      })();
    }
  };


  // =====================================================
  // FORMAT JOB TYPE
  // =====================================================

  const formatJobType = (type) => {
    if (type === "image_resize") {
      return "Image Resize";
    }

    if (
      type === "house_price_prediction"
    ) {
      return "House Price Prediction";
    }

    if (
      type === "report_generation"
    ) {
      return "Report Generation";
    }

    return type || "Unknown";
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(
      date
    ).toLocaleString();
  };

  // =====================================================
  // WORKER STATUS
  // =====================================================

  const getWorkerStatusLabel = (status) => {
    if (status === "processing") return "● Processing";
    if (status === "idle") return "● Idle";
    return "● Offline";
  };

  const getWorkerStatusColor = (status) => {
    if (status === "processing") return "#ffb34c";
    if (status === "idle") return "#35e6a5";
    return "#ff638f";
  };

  const getWorkerJobText = (worker) => {
    if (worker.status === "processing" && worker.job_type) {
      return formatJobType(worker.job_type);
    }
    if (worker.status === "offline") {
      return "Worker not running";
    }
    return "Waiting for jobs";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="taskflow">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="topbar">

        <div className="brand">

          <div className="brand-logo">
            <div className="logo-layer layer-one"></div>
            <div className="logo-layer layer-two"></div>
            <div className="logo-layer layer-three"></div>
          </div>

          <div>
            <h1>
              Task<span>Flow</span>
            </h1>

            <p>
              Distributed Job Queue
            </p>
          </div>

        </div>


        <div className="top-actions">

          <div className="redis-status">

            <span className="live-dot"></span>

            {backendConnected
              ? "Redis Connected"
              : "Backend Offline"}

          </div>

          <button className="top-icon-button">
            ▤
          </button>

          <button className="top-icon-button">
            ◐
          </button>

        </div>

      </header>


      {/* =================================================
          DASHBOARD
      ================================================= */}

      <main className="dashboard">

        {/* =================================================
            SYSTEM HEALTH
        ================================================= */}

        <section
          className="panel system-health-panel"
          style={{
            marginBottom: "22px",
            padding: "18px 24px 20px",
          }}
        >
          <div
            className="panel-heading"
            style={{
              marginBottom: "14px",
              minHeight: "42px",
            }}
          >
            <div className="panel-title">
              <div className="panel-icon">♥</div>
              <div>
                <h2>System Health</h2>
                <p>Live system resource usage</p>
              </div>
            </div>

            <div
              className="health-live"
              style={{
                fontSize: "14px",
                alignSelf: "center",
              }}
            >
              <span className="health-live-dot" />
              Monitoring
            </div>
          </div>

          <div
            className="system-health-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            {[
              {
                label: "CPU USAGE",
                percent: Number(systemHealth.cpu.percent) || 0,
                detail: `${systemHealth.cpu.cores || 0} cores`,
              },
              {
                label: "MEMORY USAGE",
                percent: Number(systemHealth.memory.percent) || 0,
                detail: `${Number(systemHealth.memory.used_gb || 0).toFixed(1)} / ${Number(systemHealth.memory.total_gb || 0).toFixed(1)} GB`,
              },
              {
                label: "DISK USAGE",
                percent: Number(systemHealth.disk.percent) || 0,
                detail: `${Number(systemHealth.disk.used_gb || 0).toFixed(1)} / ${Number(systemHealth.disk.total_gb || 0).toFixed(1)} GB`,
              },
            ].map((metric) => {
              const percent = Math.min(100, Math.max(0, metric.percent));
              const displayPercent =
                metric.label === "CPU USAGE"
                  ? Math.round(percent)
                  : percent.toFixed(1);

              return (
                <div
                  className="system-health-card"
                  key={metric.label}
                  style={{
                    minHeight: "142px",
                    padding: "12px 16px 14px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    className="health-card-title"
                    style={{
                      width: "100%",
                      fontSize: "11px",
                      letterSpacing: "0.6px",
                      marginBottom: "5px",
                    }}
                  >
                    {metric.label}
                  </div>

                  <div
                    className="health-ring"
                    style={{
                      width: "82px",
                      height: "82px",
                      minWidth: "82px",
                      minHeight: "82px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `conic-gradient(#8b5cf6 ${percent}%, rgba(255,255,255,0.08) ${percent}% 100%)`,
                      boxShadow: "0 0 16px rgba(139,92,246,0.12)",
                    }}
                  >
                    <div
                      className="health-ring-inner"
                      style={{
                        width: "66px",
                        height: "66px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: 800,
                        }}
                      >
                        {displayPercent}%
                      </span>
                    </div>
                  </div>

                  <div
                    className="health-detail"
                    style={{
                      fontSize: "11px",
                      marginTop: "5px",
                      lineHeight: 1.2,
                    }}
                  >
                    {metric.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </section>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="stats-grid">

          <div className="stat-card total-card">

            <div className="stat-icon">
              ◉
            </div>

            <div className="stat-content">
              <p>Total Jobs</p>
              <h2>{stats.total}</h2>
            </div>

            <div className="stat-decoration">
              ▂▃▅▇
            </div>

          </div>


          <div className="stat-card completed-card">

            <div className="stat-icon">
              ✓
            </div>

            <div className="stat-content">
              <p>Completed</p>
              <h2>{stats.completed}</h2>
            </div>

            <div className="stat-decoration">
              ◡ ◡
            </div>

          </div>


          <div className="stat-card processing-card">

            <div className="stat-icon">
              ⚙
            </div>

            <div className="stat-content">
              <p>Processing</p>
              <h2>{stats.processing}</h2>
            </div>

            <div className="stat-decoration">
              ▔⌒▔
            </div>

          </div>


          <div className="stat-card failed-card">

            <div className="stat-icon">
              ×
            </div>

            <div className="stat-content">
              <p>Failed</p>
              <h2>{stats.failed}</h2>
            </div>

            <div className="stat-decoration">
              ╲╱
            </div>

          </div>

        </section>


        {/* =================================================
            CREATE JOB
        ================================================= */}

        <section className="create-section">

          <div className="section-heading">

            <div className="lightning">
              ⚡
            </div>

            <div>
              <h2>
                Create Job
              </h2>

              <p>
                Submit a task to the distributed queue
              </p>
            </div>

          </div>


          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "22px 0 26px",
            }}
          >
            <button
              type="button"
              className="primary-button purple-button"
              onClick={handleRunAllJobs}
              style={{
                minWidth: "220px",
                fontSize: "15px",
                fontWeight: "700",
              }}
            >
              ▶ Run All Jobs
            </button>
          </div>

          <p
            style={{
              textAlign: "center",
              margin: "-14px 0 24px",
              color: "#7f96bb",
              fontSize: "12px",
            }}
          >
            Submit all added jobs to the distributed queue
          </p>

          <div className="job-grid">

            {/* =================================================
                IMAGE RESIZE
            ================================================= */}

            <div className="job-card">

              <div className="job-header">

                <div className="job-icon image-icon">
                  ▧
                </div>

                <div>
                  <h3>Image Resize</h3>

                  <p>
                    Resize an image using a background worker.
                  </p>
                </div>

              </div>

              {imageJobs.map((imageJob, index) => (
                <div
                  key={imageJob.id}
                  style={{
                    marginTop: index === 0 ? "0" : "18px",
                    paddingTop: index === 0 ? "0" : "18px",
                    borderTop:
                      index === 0
                        ? "none"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      color: "#d9e0f2",
                    }}
                  >
                    Image Job {index + 1}
                  </strong>

                  <input
                    id={`image-upload-${imageJob.id}`}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden-file-input"
                    onChange={(event) =>
                      handleImageChange(imageJob.id, event)
                    }
                  />

                  <label
                    htmlFor={`image-upload-${imageJob.id}`}
                    className="upload-box"
                    onDragOver={(e) =>
                      e.preventDefault()
                    }
                    onDrop={(event) =>
                      handleImageDrop(imageJob.id, event)
                    }
                  >
                    <div className="upload-icon">
                      ↑
                    </div>

                    <strong>
                      {imageJob.file
                        ? imageJob.file.name
                        : "Click to upload or drag and drop"}
                    </strong>

                    <span>
                      PNG, JPG, JPEG (Max 10MB)
                    </span>
                  </label>

                  <button
                    className="primary-button purple-button"
                    onClick={() =>
                      handleImageResize(imageJob.id)
                    }
                    disabled={
                      imageJob.loading ||
                      !imageJob.file
                    }
                  >
                    {imageJob.loading
                      ? "Processing..."
                      : "▶ Run Job"}
                  </button>

                  {imageJob.outputUrl && (
                    <a
                      href={imageJob.outputUrl}
                      className="primary-button purple-button"
                      download
                      style={{
                        display: "block",
                        textAlign: "center",
                        textDecoration: "none",
                        marginTop: "12px",
                      }}
                    >
                      ↓ Download Resized Image
                    </a>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="refresh-button"
                onClick={addAnotherImageJob}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "16px",
                }}
              >
                + Add Another Image Job
              </button>

            </div>

            {/* =================================================
                HOUSE PRICE
            ================================================= */}

            <div className="job-card">

              <div className="job-header">

                <div className="job-icon house-icon">
                  ⌂
                </div>

                <div>
                  <h3>House Price Prediction</h3>

                  <p>
                    Predict house price using the ML model.
                  </p>
                </div>

              </div>

              {houseJobs.map((houseJob, index) => (
                <div
                  key={houseJob.id}
                  style={{
                    marginTop: index === 0 ? "0" : "18px",
                    paddingTop: index === 0 ? "0" : "18px",
                    borderTop:
                      index === 0
                        ? "none"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      color: "#d9e0f2",
                    }}
                  >
                    Prediction {index + 1}
                  </strong>

                  <div className="prediction-inputs">

                    <input
                      type="number"
                      min="100"
                      placeholder="Area (sqft)"
                      value={houseJob.area}
                      onChange={(e) =>
                        updateHouseJob(houseJob.id, {
                          area: e.target.value,
                          result: null,
                        })
                      }
                    />

                    <input
                      type="number"
                      min="1"
                      placeholder="Bedrooms"
                      value={houseJob.bedrooms}
                      onChange={(e) =>
                        updateHouseJob(houseJob.id, {
                          bedrooms: e.target.value,
                          result: null,
                        })
                      }
                    />

                    <input
                      type="number"
                      min="1"
                      placeholder="Bathrooms"
                      value={houseJob.bathrooms}
                      onChange={(e) =>
                        updateHouseJob(houseJob.id, {
                          bathrooms: e.target.value,
                          result: null,
                        })
                      }
                    />

                    <input
                      type="number"
                      min="0"
                      placeholder="Property Age (years)"
                      value={houseJob.property_age}
                      onChange={(e) =>
                        updateHouseJob(houseJob.id, {
                          property_age: e.target.value,
                          result: null,
                        })
                      }
                    />

                    <input
                      type="number"
                      min="1"
                      placeholder="Floors"
                      value={houseJob.floors}
                      onChange={(e) =>
                        updateHouseJob(houseJob.id, {
                          floors: e.target.value,
                          result: null,
                        })
                      }
                    />

                    <input
                      type="number"
                      min="0"
                      placeholder="Parking Spaces"
                      value={houseJob.parking}
                      onChange={(e) =>
                        updateHouseJob(houseJob.id, {
                          parking: e.target.value,
                          result: null,
                        })
                      }
                    />

                    <select
                      value={houseJob.furnishing}
                      onChange={(e) =>
                        updateHouseJob(houseJob.id, {
                          furnishing: e.target.value,
                          result: null,
                        })
                      }
                    >
                      <option value="Unfurnished">Unfurnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Furnished">Furnished</option>
                    </select>

                    <select
                      value={houseJob.location}
                      onChange={(e) =>
                        updateHouseJob(houseJob.id, {
                          location: e.target.value,
                          result: null,
                        })
                      }
                    >
                      <optgroup label="Chennai">
                        <option>Anna Nagar, Chennai</option>
                        <option>Adyar, Chennai</option>
                        <option>Velachery, Chennai</option>
                        <option>Tambaram, Chennai</option>
                        <option>T. Nagar, Chennai</option>
                      </optgroup>

                      <optgroup label="Bangalore">
                        <option>Electronic City, Bangalore</option>
                        <option>Whitefield, Bangalore</option>
                        <option>Koramangala, Bangalore</option>
                        <option>Indiranagar, Bangalore</option>
                      </optgroup>

                      <optgroup label="Hyderabad">
                        <option>Miyapur, Hyderabad</option>
                        <option>Kondapur, Hyderabad</option>
                        <option>Gachibowli, Hyderabad</option>
                        <option>Banjara Hills, Hyderabad</option>
                      </optgroup>

                      <optgroup label="Mumbai">
                        <option>Borivali, Mumbai</option>
                        <option>Andheri, Mumbai</option>
                        <option>Powai, Mumbai</option>
                        <option>Bandra, Mumbai</option>
                      </optgroup>

                      <optgroup label="Delhi">
                        <option>Rohini, Delhi</option>
                        <option>Dwarka, Delhi</option>
                        <option>Saket, Delhi</option>
                        <option>Vasant Kunj, Delhi</option>
                      </optgroup>
                    </select>

                  </div>

                  <button
                    className="primary-button blue-button"
                    onClick={() =>
                      handlePrediction(houseJob.id)
                    }
                    disabled={houseJob.loading}
                  >
                    {houseJob.loading
                      ? "Processing..."
                      : "✨ Run Prediction"}
                  </button>

                  {houseJob.result !== null && (
                    <div className="prediction-result">
                      <span>Predicted House Price</span>
                      <strong>
                        ₹{houseJob.result} lakhs
                      </strong>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="refresh-button"
                onClick={addAnotherHouseJob}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "16px",
                }}
              >
                + Add Another Prediction
              </button>

            </div>

            {/* =================================================
                REPORT GENERATION
            ================================================= */}

            <div className="job-card">

              <div className="job-header">

                <div className="job-icon report-icon">
                  ▥
                </div>

                <div>
                  <h3>Report Generation</h3>

                  <p>
                    Generate a PDF report from a CSV or Excel file.
                  </p>
                </div>

              </div>

              {reportJobs.map((reportJob, index) => (
                <div
                  key={reportJob.id}
                  style={{
                    marginTop: index === 0 ? "0" : "18px",
                    paddingTop: index === 0 ? "0" : "18px",
                    borderTop:
                      index === 0
                        ? "none"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      marginBottom: "10px",
                      color: "#d9e0f2",
                    }}
                  >
                    Report Job {index + 1}
                  </strong>

                  <input
                    id={`csv-upload-${reportJob.id}`}
                    type="file"
                    accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden-file-input"
                    onChange={(event) =>
                      handleCsvChange(reportJob.id, event)
                    }
                  />

                  <label
                    htmlFor={`csv-upload-${reportJob.id}`}
                    className="upload-box report-upload"
                    onDragOver={(e) =>
                      e.preventDefault()
                    }
                    onDrop={(event) =>
                      handleCsvDrop(reportJob.id, event)
                    }
                  >
                    <div className="upload-icon">
                      ↑
                    </div>

                    <strong>
                      {reportJob.file
                        ? reportJob.file.name
                        : "Click to upload or drag and drop"}
                    </strong>

                    <span>
                      CSV / XLSX files (Max 10MB)
                    </span>
                  </label>

                  <input
                    className="report-name"
                    type="text"
                    placeholder="Report name"
                    value={reportJob.reportName}
                    onChange={(e) =>
                      updateReportJob(reportJob.id, {
                        reportName: e.target.value,
                      })
                    }
                  />

                  <button
                    className="primary-button green-button"
                    onClick={() =>
                      handleReportGeneration(reportJob.id)
                    }
                    disabled={
                      reportJob.loading ||
                      !reportJob.file
                    }
                  >
                    {reportJob.loading
                      ? "Generating..."
                      : "▣ Generate Report"}
                  </button>

                  {reportJob.generated && (
                    <a
                      href={reportJob.outputFile ? `${API_URL}/download/${encodeURIComponent(reportJob.outputFile)}` : "#"}
                      className="primary-button green-button"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        textAlign: "center",
                        textDecoration: "none",
                        marginTop: "12px",
                      }}
                    >
                      ↓ Download Report
                    </a>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="refresh-button"
                onClick={addAnotherReportJob}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "16px",
                }}
              >
                + Add Another Report Job
              </button>

            </div>

          </div>

        </section>


        {/* =================================================
            WORKERS + QUEUE
        ================================================= */}

        <section className="lower-grid">

          {/* =================================================
              WORKERS
          ================================================= */}

          <div className="panel workers-panel">
          <div className="panel-heading">
            <div className="panel-title">
              <span className="panel-icon">◉</span>
              <span>Workers</span>
            </div>

            <button
              className="refresh-button"
              onClick={fetchWorkers}
              title="Refresh workers"
            >
              ↻
            </button>
          </div>

          <div className="workers-grid">
            {workers.map((worker) => {
              const status = worker.status || "offline";
              const isProcessing = status === "processing";

              return (
                <div className="worker-card" key={worker.worker_id}>
                  <div className="worker-header">
                    <strong>{worker.worker_id}</strong>

                    <span
                      className={`worker-status ${status}`}
                      style={{ color: getWorkerStatusColor(status) }}
                    >
                      {getWorkerStatusLabel(status)}
                    </span>
                  </div>

                  <div className="worker-job">
                    <span
                      style={{
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Current Job
                    </span>
                    <strong
                      style={{
                        display: "block",
                      }}
                    >
                      {getWorkerJobText(worker)}
                    </strong>

                    {isProcessing && worker.current_job && (
                      <small
                        style={{
                          display: "block",
                          marginTop: "5px",
                          color: "#7f96bb",
                          fontSize: "11px"
                        }}
                      >
                        Job ID: {worker.current_job}
                      </small>
                    )}
                  </div>

                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: isProcessing ? "65%" : "0%"
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      marginTop: "16px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(35, 52, 88, 0.55)",
                        borderRadius: "8px",
                        padding: "10px 9px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#8da7d1",
                          textTransform: "uppercase",
                          lineHeight: "1.15",
                        }}
                      >
                        Jobs<br />Processed
                      </div>
                      <strong style={{ fontSize: "18px", display: "block", marginTop: "4px" }}>
                        {worker.jobs_processed ?? 0}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "rgba(35, 52, 88, 0.55)",
                        borderRadius: "8px",
                        padding: "10px 9px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#8da7d1",
                          textTransform: "uppercase",
                          lineHeight: "1.15",
                        }}
                      >
                        Success<br />Rate
                      </div>
                      <strong style={{ fontSize: "18px", display: "block", marginTop: "4px" }}>
                        {Number(worker.success_rate ?? 0).toFixed(0)}%
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "rgba(35, 52, 88, 0.55)",
                        borderRadius: "8px",
                        padding: "10px 9px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#8da7d1",
                          textTransform: "uppercase",
                          lineHeight: "1.15",
                        }}
                      >
                        Avg<br />Processing
                      </div>
                      <strong style={{ fontSize: "18px", display: "block", marginTop: "4px" }}>
                        {Number(worker.avg_processing_time ?? 0).toFixed(1)}s
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}

            {workers.length === 0 && (
              <div className="empty-history">
                No worker information available.
              </div>
            )}
          </div>
        </div>

        <div className="panel queue-panel">

            <div className="panel-heading">

              <div className="panel-title">

                <div className="panel-icon">
                  ≡
                </div>

                <div>

                  <h2>
                    Queue Status
                  </h2>

                  <p>
                    Current task distribution
                  </p>

                </div>

              </div>

              <button
                className="refresh-button"
                onClick={refreshDashboard}
              >
                ↻ Refresh
              </button>

            </div>


            <div className="queue-grid">

              <div className="queue-card waiting">

                <span>
                  ⏳
                </span>

                <p>
                  Waiting
                </p>

                <strong>
                  {stats.waiting}
                </strong>

              </div>


              <div className="queue-card processing">

                <span>
                  ⚙
                </span>

                <p>
                  Processing
                </p>

                <strong>
                  {stats.processing}
                </strong>

              </div>


              <div className="queue-card completed">

                <span>
                  ✓
                </span>

                <p>
                  Completed
                </p>

                <strong>
                  {stats.completed}
                </strong>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            JOB HISTORY
        ================================================= */}

        <section className="panel history-panel">

          <div className="panel-heading">

            <div className="panel-title">

              <div className="panel-icon">
                ▤
              </div>

              <div>

                <h2>
                  Job History
                </h2>

                <p>
                  Recent jobs processed by TaskFlow
                </p>

              </div>

            </div>

            <button
              className="refresh-button"
              onClick={refreshDashboard}
            >
              {jobs.length} Jobs
            </button>

          </div>


          <div className="history-table">

            {/* Header */}

            <div className="table-header">

              <span>
                Job ID
              </span>

              <span>
                Type
              </span>

              <span>
                Status
              </span>

              <span>
                Worker
              </span>

              <span>
                Created
              </span>

              <span>
                Completed
              </span>

            </div>


            {/* Rows */}

            {jobs.length === 0 ? (

              <div className="empty-history">
                No jobs yet
              </div>

            ) : (

              jobs
                .slice(0, showAllJobs ? jobs.length : 7)
                .map((job) => (

                <div
                  key={job.job_id}
                  className="table-header"
                  style={{
                    minHeight: "55px",
                    color: "#d9e0f2",
                    fontWeight: "400",
                  }}
                >

                  <span>
                    {job.job_id
                      ? job.job_id.slice(
                          0,
                          8
                        )
                      : "—"}
                  </span>

                  <span>
                    {formatJobType(
                      job.type
                    )}
                  </span>

                  <span
                    style={{
                      color:
                        job.status ===
                        "completed"
                          ? "#3eeaa5"
                          : job.status ===
                            "failed"
                          ? "#ff638f"
                          : "#ffb34c",
                      fontWeight: "700",
                    }}
                  >
                    {job.status}
                  </span>

                  <span>
                    {job.worker || "—"}
                  </span>

                  <span>
                    {formatDate(
                      job.created_at
                    )}
                  </span>

                  <span>
                    {formatDate(
                      job.completed_at
                    )}
                  </span>

                </div>

              ))

            )}

          </div>

          {jobs.length > 7 && (
            <button
              className="refresh-button"
              onClick={() => setShowAllJobs((prev) => !prev)}
              style={{
                display: "block",
                margin: "14px auto 0",
                minWidth: "140px",
              }}
            >
              {showAllJobs ? "▲ Show Less" : "▼ Show More"}
            </button>
          )}

        </section>

      </main>

    </div>
  );
}

export default App;