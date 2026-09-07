/**
 * SOFTWARE TESTING RESOURCE ESTIMATOR
 * Frontend Application Controller
 * Handles form validation, asynchronous API communication,
 * digital counter animations, Chart.js visualizations, and database interactions.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Element References
  const form = document.getElementById("estimator-form");
  const btnCalculate = document.getElementById("btn-calculate");
  const btnCalcText = document.getElementById("btn-calc-text");
  const btnSave = document.getElementById("btn-save");
  const btnSaveText = document.getElementById("btn-save-text");
  const btnReset = document.getElementById("btn-reset");
  const btnLoadSample = document.getElementById("btn-load-sample");
  const btnRefreshHistory = document.getElementById("btn-refresh-history");
  const toastContainer = document.getElementById("retro-toast-container");
  const activeProjectBadge = document.getElementById("active-project-badge");

  // Readout Counter Elements
  const valTotalHours = document.getElementById("val-total-hours");
  const valPersonDays = document.getElementById("val-person-days");
  const valFte = document.getElementById("val-fte");
  const valDuration = document.getElementById("val-duration");

  // Breakdown Elements
  const txtExecHours = document.getElementById("txt-exec-hours");
  const txtLocHours = document.getElementById("txt-loc-hours");
  const txtCovFactor = document.getElementById("txt-cov-factor");
  const txtCompFactor = document.getElementById("txt-comp-factor");
  const txtRetestHours = document.getElementById("txt-retest-hours");
  const txtProdAnalysis = document.getElementById("txt-prod-analysis");

  const barExec = document.getElementById("bar-exec");
  const barLoc = document.getElementById("bar-loc");
  const barCov = document.getElementById("bar-cov");
  const barComp = document.getElementById("bar-comp");
  const barRetest = document.getElementById("bar-retest");

  const badgeDailyCap = document.getElementById("badge-daily-cap");
  const badgeExecRate = document.getElementById("badge-exec-rate");
  const badgeTeamPace = document.getElementById("badge-team-pace");

  // Simulator & History Containers
  const simulationTbody = document.getElementById("simulation-tbody");
  const historyTbody = document.getElementById("history-tbody");

  // Chart References
  let chartDistribution = null;
  let chartCoverage = null;
  let chartCategories = null;

  // Active Calculation State
  let lastCalculatedData = null;

  // ==========================================================================
  // RETRO NOTIFICATION SYSTEM
  // ==========================================================================
  function showToast(prefix, message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "alert");
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "🛑";

    toast.innerHTML = `<span>${icon}</span> <span><strong>[${prefix}]</strong> ${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => toast.remove(), 300);
    }, 4200);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ==========================================================================
  // INPUT VALIDATION (CLIENT-SIDE)
  // ==========================================================================
  function getFormData() {
    const projectName = document.getElementById("project_name").value.trim();
    const loc = parseFloat(document.getElementById("loc").value);
    const testCases = parseFloat(document.getElementById("test_cases").value);
    const coverage = parseFloat(document.getElementById("coverage").value);
    const avgTestMinutes = parseFloat(document.getElementById("avg_test_minutes").value);
    const qaProductivity = parseFloat(document.getElementById("qa_productivity").value);
    const complexity = document.getElementById("complexity").value.toLowerCase().trim();
    const retestBuffer = parseFloat(document.getElementById("retest_buffer").value);
    const workingHours = parseFloat(document.getElementById("working_hours").value);

    return {
      project_name: projectName,
      loc: isNaN(loc) ? -1 : loc,
      test_cases: isNaN(testCases) ? -1 : testCases,
      coverage: isNaN(coverage) ? -1 : coverage,
      avg_test_minutes: isNaN(avgTestMinutes) ? -1 : avgTestMinutes,
      qa_productivity: isNaN(qaProductivity) ? -1 : qaProductivity,
      complexity: complexity,
      retest_buffer: isNaN(retestBuffer) ? -1 : retestBuffer,
      working_hours: isNaN(workingHours) ? -1 : workingHours
    };
  }

  function validateFormData(data) {
    if (!data.project_name) {
      return "Project name must not be empty.";
    }
    if (data.loc < 0) {
      return "Lines of Code (LOC) must be greater than or equal to 0.";
    }
    if (data.test_cases < 0) {
      return "Test cases must be greater than or equal to 0.";
    }
    if (data.coverage < 0 || data.coverage > 100) {
      return "Target coverage must be between 0 and 100 percent.";
    }
    if (data.avg_test_minutes <= 0) {
      return "Average test execution time must be greater than 0 minutes.";
    }
    if (data.qa_productivity <= 0) {
      return "QA productivity must be greater than 0 test cases/hour.";
    }
    if (!["low", "medium", "high"].includes(data.complexity)) {
      return "Complexity must be low, medium, or high.";
    }
    if (data.retest_buffer < 0 || data.retest_buffer > 100) {
      return "Regression/Retest buffer must be between 0 and 100 percent.";
    }
    if (data.working_hours <= 0) {
      return "Working hours per day must be greater than 0.";
    }
    return null;
  }

  // ==========================================================================
  // ANIMATED DIGITAL COUNTERS
  // ==========================================================================
  function animateValue(element, start, end, duration, decimals = 1) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = end.toFixed(decimals);
      return;
    }
    let startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeProgress;
      element.textContent = current.toFixed(decimals);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = end.toFixed(decimals);
      }
    }
    requestAnimationFrame(step);
  }

  // ==========================================================================
  // RENDER ESTIMATION METRICS & BREAKDOWN
  // ==========================================================================
  function displayResults(data) {
    lastCalculatedData = data;
    activeProjectBadge.textContent = `ACTIVE: ${data.project_name.toUpperCase()}`;

    // 1. Digital Counters
    const prevTotal = parseFloat(valTotalHours.textContent) || 0;
    const prevDays = parseFloat(valPersonDays.textContent) || 0;
    const prevFte = parseFloat(valFte.textContent) || 0;
    const prevDur = parseFloat(valDuration.textContent) || 0;

    animateValue(valTotalHours, prevTotal, data.total_hours, 600, 1);
    animateValue(valPersonDays, prevDays, data.person_days, 600, 1);
    animateValue(valFte, prevFte, data.fte, 600, 2);
    animateValue(valDuration, prevDur, data.duration_days, 600, 0);

    // 2. Breakdown Values & Formulas
    txtExecHours.textContent = `${data.test_execution_hours.toFixed(1)} hrs`;
    txtLocHours.textContent = `${data.loc_testing_hours.toFixed(1)} hrs`;
    txtCovFactor.textContent = `${data.coverage_factor.toFixed(4)}× (${data.coverage}% / 80% baseline)`;
    txtCompFactor.textContent = `${data.complexity_factor.toFixed(2)}× (${data.complexity.toUpperCase()})`;
    txtRetestHours.textContent = `${data.retest_hours.toFixed(1)} hrs (${data.retest_buffer}% buffer)`;

    // 3. Horizontal Progress Bars
    const maxReference = Math.max(data.total_hours, 1);
    const execPct = Math.min((data.test_execution_hours / maxReference) * 100, 100);
    const locPct = Math.min((data.loc_testing_hours / maxReference) * 100, 100);
    const retestPct = Math.min((data.retest_hours / maxReference) * 100, 100);

    barExec.style.width = `${execPct.toFixed(1)}%`;
    barLoc.style.width = `${locPct.toFixed(1)}%`;
    barCov.style.width = `${Math.min(data.coverage, 100)}%`;
    barComp.style.width = `${(data.complexity_factor / 1.25) * 100}%`;
    barRetest.style.width = `${retestPct.toFixed(1)}%`;

    // 4. Productivity Telemetry
    if (data.productivity_metrics) {
      const pm = data.productivity_metrics;
      txtProdAnalysis.textContent = `Benchmark: ${pm.target_qa_productivity} cases/hr | Nominal: ${pm.nominal_cases_per_hour} cases/hr (${pm.productivity_variance_pct >= 0 ? '+' : ''}${pm.productivity_variance_pct}%)`;
      badgeDailyCap.textContent = `Daily Capacity: ${pm.daily_case_capacity_per_tester} cases / tester-day`;
      badgeExecRate.textContent = `Execution Rate: ${data.avg_test_minutes} min/test`;
      const reqPace = data.person_days > 0 ? (data.test_cases / data.person_days).toFixed(1) : 0;
      badgeTeamPace.textContent = `Required Pace: ${reqPace} cases/day`;
    }

    // 5. Update Charts
    updateCharts(data);

    // 6. Update Coverage Simulation Table
    if (data.coverage_simulation) {
      renderSimulationTable(data.coverage_simulation, data.coverage);
    }
  }

  // ==========================================================================
  // CHART.JS VISUALIZATION ENGINE
  // ==========================================================================
  function initCharts() {
    if (typeof Chart === "undefined") {
      console.warn("Chart.js not loaded.");
      return;
    }

    // Chart 1: Effort Distribution (Doughnut)
    const ctxDist = document.getElementById("chartDistribution");
    if (ctxDist) {
      chartDistribution = new Chart(ctxDist, {
        type: "doughnut",
        data: {
          labels: ["Direct Execution", "LOC Testing", "Regression / Retest"],
          datasets: [{
            data: [250.0, 0.0, 37.5],
            backgroundColor: ["#0F766E", "#D97706", "#BE123C"],
            borderWidth: 2,
            borderColor: "#FCFBF7"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                font: { family: "'Space Mono', monospace", size: 11 },
                color: "#1D232A"
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw} hrs`
              }
            }
          }
        }
      });
    }

    // Chart 2: Coverage Sensitivity (Line)
    const ctxCov = document.getElementById("chartCoverage");
    if (ctxCov) {
      chartCoverage = new Chart(ctxCov, {
        type: "line",
        data: {
          labels: ["60%", "70%", "80%", "90%", "100%"],
          datasets: [{
            label: "Total QA Hours",
            data: [215.6, 251.6, 287.5, 323.4, 359.4],
            borderColor: "#0F766E",
            backgroundColor: "rgba(15, 118, 110, 0.12)",
            borderWidth: 2.5,
            tension: 0.25,
            fill: true,
            pointBackgroundColor: "#D97706",
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Required: ${ctx.raw} hours`
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: "Target Coverage", font: { family: "'Space Mono', monospace" } },
              grid: { color: "rgba(214, 206, 190, 0.4)" }
            },
            y: {
              title: { display: true, text: "QA Hours", font: { family: "'Space Mono', monospace" } },
              grid: { color: "rgba(214, 206, 190, 0.4)" }
            }
          }
        }
      });
    }

    // Chart 3: Effort Categories (Bar)
    const ctxCat = document.getElementById("chartCategories");
    if (ctxCat) {
      chartCategories = new Chart(ctxCat, {
        type: "bar",
        data: {
          labels: ["Direct Execution", "LOC Testing", "Base QA Effort", "Retest Buffer", "Total QA Effort"],
          datasets: [{
            label: "Effort Hours",
            data: [250.0, 0.0, 250.0, 37.5, 287.5],
            backgroundColor: ["#0F766E", "#D97706", "#1D4ED8", "#BE123C", "#6D28D9"],
            borderRadius: 4,
            borderWidth: 1,
            borderColor: "#AFA694"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.raw} hours`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: "'Space Mono', monospace", size: 10 } }
            },
            y: {
              title: { display: true, text: "Hours", font: { family: "'Space Mono', monospace" } },
              grid: { color: "rgba(214, 206, 190, 0.4)" }
            }
          }
        }
      });
    }
  }

  function updateCharts(data) {
    if (chartDistribution) {
      chartDistribution.data.datasets[0].data = [
        data.test_execution_hours,
        data.loc_testing_hours,
        data.retest_hours
      ];
      chartDistribution.update();
    }

    if (chartCoverage && data.coverage_simulation) {
      chartCoverage.data.labels = data.coverage_simulation.map(s => `${s.coverage}%`);
      chartCoverage.data.datasets[0].data = data.coverage_simulation.map(s => s.total_hours);
      chartCoverage.update();
    }

    if (chartCategories) {
      chartCategories.data.datasets[0].data = [
        data.test_execution_hours,
        data.loc_testing_hours,
        data.base_effort,
        data.retest_hours,
        data.total_hours
      ];
      chartCategories.update();
    }
  }

  // ==========================================================================
  // COVERAGE SIMULATION TABLE
  // ==========================================================================
  function renderSimulationTable(simulations, currentCoverage) {
    simulationTbody.innerHTML = "";
    simulations.forEach(sim => {
      const tr = document.createElement("tr");
      if (Math.abs(sim.coverage - currentCoverage) < 0.01) {
        tr.className = "row-baseline";
      }

      let diffClass = "diff-neutral";
      let diffSign = "";
      if (sim.difference_hours > 0) {
        diffClass = "diff-up";
        diffSign = "+";
      } else if (sim.difference_hours < 0) {
        diffClass = "diff-down";
      }

      tr.innerHTML = `
        <td><strong>${sim.coverage}%</strong> ${sim.coverage === 80 ? '<span class="badge-tag badge-med">BASELINE</span>' : ''}</td>
        <td><strong>${sim.total_hours.toFixed(1)} hrs</strong></td>
        <td>${sim.person_days.toFixed(1)} days</td>
        <td>${sim.fte.toFixed(2)} FTE</td>
        <td class="${diffClass}">${diffSign}${sim.difference_hours.toFixed(1)} hrs (${diffSign}${sim.difference_pct}%)</td>
        <td>
          <button type="button" class="btn-action-sm btn-apply-cov" data-coverage="${sim.coverage}">
            APPLY ${sim.coverage}%
          </button>
        </td>
      `;
      simulationTbody.appendChild(tr);
    });

    // Attach click listeners to Apply buttons
    document.querySelectorAll(".btn-apply-cov").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const targetCov = e.target.getAttribute("data-coverage");
        document.getElementById("coverage").value = targetCov;
        calculateEstimate(false);
      });
    });
  }

  // ==========================================================================
  // REST API: ESTIMATE (POST /api/estimate)
  // ==========================================================================
  async function calculateEstimate(notifySuccess = true) {
    const data = getFormData();
    const validationError = validateFormData(data);
    if (validationError) {
      showToast("ERROR", validationError, "error");
      return;
    }

    btnCalcText.textContent = "CALCULATING...";
    btnCalculate.disabled = true;

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Estimation calculation failed");
      }

      displayResults(json);
      if (notifySuccess) {
        showToast("SYSTEM", "ESTIMATION COMPLETE", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("API", `REQUEST FAILED: ${err.message}`, "error");
    } finally {
      btnCalcText.textContent = "CALCULATE ESTIMATE";
      btnCalculate.disabled = false;
    }
  }

  // ==========================================================================
  // REST API: SAVE PROJECT (POST /api/projects)
  // ==========================================================================
  async function saveProject() {
    const data = getFormData();
    const validationError = validateFormData(data);
    if (validationError) {
      showToast("ERROR", validationError, "error");
      return;
    }

    btnSaveText.textContent = "SAVING...";
    btnSave.disabled = true;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to persist project in database");
      }

      displayResults(json);
      showToast("DATABASE", `PROJECT SAVED (ID: ${json.id})`, "success");
      await loadHistory();
    } catch (err) {
      console.error(err);
      showToast("DATABASE", `CONNECTION ERROR: ${err.message}`, "error");
    } finally {
      btnSaveText.textContent = "SAVE TO DATABASE";
      btnSave.disabled = false;
    }
  }

  // ==========================================================================
  // REST API: LIST PROJECTS (GET /api/projects)
  // ==========================================================================
  async function loadHistory() {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        throw new Error("Unable to retrieve project history");
      }
      const projects = await res.json();
      renderHistoryTable(projects);
    } catch (err) {
      console.error(err);
      historyTbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">
            [DATABASE] COULD NOT LOAD SAVED PROJECTS: ${escapeHtml(err.message)}
          </td>
        </tr>
      `;
    }
  }

  function renderHistoryTable(projects) {
    if (!projects || projects.length === 0) {
      historyTbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">NO SAVED PROJECTS IN DATABASE. CALCULATE AND CLICK 'SAVE TO DATABASE'.</td>
        </tr>
      `;
      return;
    }

    historyTbody.innerHTML = "";
    projects.forEach(p => {
      const tr = document.createElement("tr");

      let badgeClass = "badge-med";
      if (p.complexity === "low") badgeClass = "badge-low";
      if (p.complexity === "high") badgeClass = "badge-high";

      const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString() : "N/A";

      tr.innerHTML = `
        <td><strong>${escapeHtml(p.project_name)}</strong></td>
        <td>${p.loc.toLocaleString()}</td>
        <td>${p.test_cases.toLocaleString()}</td>
        <td>${p.coverage}%</td>
        <td><span class="badge-tag ${badgeClass}">${p.complexity.toUpperCase()}</span></td>
        <td><strong>${p.total_hours.toFixed(1)} hrs</strong></td>
        <td>${p.fte.toFixed(2)}</td>
        <td>${dateStr}</td>
        <td>
          <button type="button" class="btn-action-sm btn-view-proj" data-id="${p.id}" title="Load project into calculator">
            VIEW
          </button>
          <button type="button" class="btn-danger-sm btn-del-proj" data-id="${p.id}" title="Delete project from database">
            DELETE
          </button>
        </td>
      `;
      historyTbody.appendChild(tr);
    });

    // Attach View & Delete handlers
    document.querySelectorAll(".btn-view-proj").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        viewProject(id);
      });
    });

    document.querySelectorAll(".btn-del-proj").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        deleteProject(id);
      });
    });
  }

  // ==========================================================================
  // REST API: GET PROJECT (GET /api/projects/<id>)
  // ==========================================================================
  async function viewProject(id) {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const project = await res.json();
      if (!res.ok) throw new Error(project.error || "Failed to load project");

      // Populate Form Fields
      document.getElementById("project_name").value = project.project_name;
      document.getElementById("loc").value = project.loc;
      document.getElementById("test_cases").value = project.test_cases;
      document.getElementById("coverage").value = project.coverage;
      document.getElementById("avg_test_minutes").value = project.avg_test_minutes;
      document.getElementById("qa_productivity").value = project.qa_productivity;
      document.getElementById("complexity").value = project.complexity;
      document.getElementById("retest_buffer").value = project.retest_buffer;
      document.getElementById("working_hours").value = project.working_hours;

      displayResults(project);
      showToast("SYSTEM", `LOADED PROJECT: ${project.project_name}`, "info");

      // Smooth scroll to top of calculator
      document.getElementById("calculator-section").scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error(err);
      showToast("API", `ERROR LOADING PROJECT: ${err.message}`, "error");
    }
  }

  // ==========================================================================
  // REST API: DELETE PROJECT (DELETE /api/projects/<id>)
  // ==========================================================================
  async function deleteProject(id) {
    if (!confirm(`Are you sure you want to permanently delete Project ID #${id}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Deletion failed");

      showToast("DATABASE", `DELETED RECORD #${id}`, "info");
      await loadHistory();
    } catch (err) {
      console.error(err);
      showToast("DATABASE", `DELETE FAILED: ${err.message}`, "error");
    }
  }

  // ==========================================================================
  // EVENT LISTENERS & INITIALIZATION
  // ==========================================================================
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    calculateEstimate(true);
  });

  btnSave.addEventListener("click", (e) => {
    e.preventDefault();
    saveProject();
  });

  btnReset.addEventListener("click", () => {
    form.reset();
    showToast("SYSTEM", "FORM RESET TO DEFAULTS", "info");
  });

  btnLoadSample.addEventListener("click", () => {
    document.getElementById("project_name").value = "E-Commerce Application";
    document.getElementById("loc").value = "50000";
    document.getElementById("test_cases").value = "1250";
    document.getElementById("coverage").value = "80";
    document.getElementById("avg_test_minutes").value = "12";
    document.getElementById("qa_productivity").value = "6";
    document.getElementById("complexity").value = "medium";
    document.getElementById("retest_buffer").value = "15";
    document.getElementById("working_hours").value = "8";
    calculateEstimate(true);
  });

  btnRefreshHistory.addEventListener("click", () => {
    loadHistory();
    showToast("DATABASE", "RECORDS REFRESHED", "info");
  });

  // Initialize UI & Charts
  initCharts();
  calculateEstimate(false);
  loadHistory();
});
