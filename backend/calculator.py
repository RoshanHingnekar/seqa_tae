import math

# Configurable Complexity Multipliers
COMPLEXITY_FACTORS = {
    "low": 0.85,
    "medium": 1.00,
    "high": 1.25
}

# Configurable Assumptions
DEFAULT_LOC_TESTING_FACTOR = 0.0  # Hours per line of code (customizable project assumption)
BASELINE_COVERAGE = 80.0           # Industry standard 80% coverage baseline
PRODUCTIVE_MONTHLY_HOURS = 160.0   # Standard full-time equivalent hours per month (20 days * 8 hours)


def validate_inputs(data):
    """
    Validates all calculation parameters from user input.
    Returns (cleaned_data, error_message). If error_message is not None, validation failed.
    """
    if not isinstance(data, dict):
        return None, "Request payload must be a JSON object"

    project_name = data.get("project_name")
    if not project_name or not isinstance(project_name, str) or not project_name.strip():
        return None, "Project name must not be empty"

    try:
        loc = int(data.get("loc", 0))
    except (ValueError, TypeError):
        return None, "Lines of Code (LOC) must be a valid integer"
    if loc < 0:
        return None, "Lines of Code (LOC) must be greater than or equal to 0"

    try:
        test_cases = int(data.get("test_cases", 0))
    except (ValueError, TypeError):
        return None, "Test cases must be a valid integer"
    if test_cases < 0:
        return None, "Test cases must be greater than or equal to 0"

    try:
        coverage = float(data.get("coverage", 0.0))
    except (ValueError, TypeError):
        return None, "Target coverage must be a valid number"
    if coverage < 0 or coverage > 100:
        return None, "Target coverage must be between 0 and 100 percent"

    try:
        avg_test_minutes = float(data.get("avg_test_minutes", 0.0))
    except (ValueError, TypeError):
        return None, "Average test execution time must be a valid number"
    if avg_test_minutes <= 0:
        return None, "Average test execution time must be greater than 0 minutes"

    try:
        qa_productivity = float(data.get("qa_productivity", 0.0))
    except (ValueError, TypeError):
        return None, "QA productivity must be a valid number"
    if qa_productivity <= 0:
        return None, "QA productivity must be greater than 0 test cases/hour"

    complexity = data.get("complexity", "").lower().strip()
    if complexity not in COMPLEXITY_FACTORS:
        return None, f"Complexity must be one of: {', '.join(COMPLEXITY_FACTORS.keys())}"

    try:
        retest_buffer = float(data.get("retest_buffer", 0.0))
    except (ValueError, TypeError):
        return None, "Regression/Retest buffer must be a valid number"
    if retest_buffer < 0 or retest_buffer > 100:
        return None, "Regression/Retest buffer must be between 0 and 100 percent"

    try:
        working_hours = float(data.get("working_hours", 8.0))
    except (ValueError, TypeError):
        return None, "Working hours per day must be a valid number"
    if working_hours <= 0:
        return None, "Working hours per day must be greater than 0"

    # Optional custom LOC testing factor
    try:
        loc_testing_factor = float(data.get("loc_testing_factor", DEFAULT_LOC_TESTING_FACTOR))
        if loc_testing_factor < 0:
            return None, "LOC testing factor cannot be negative"
    except (ValueError, TypeError):
        loc_testing_factor = DEFAULT_LOC_TESTING_FACTOR

    cleaned = {
        "project_name": project_name.strip(),
        "loc": loc,
        "test_cases": test_cases,
        "coverage": coverage,
        "avg_test_minutes": avg_test_minutes,
        "complexity": complexity,
        "qa_productivity": qa_productivity,
        "retest_buffer": retest_buffer,
        "working_hours": working_hours,
        "loc_testing_factor": loc_testing_factor
    }
    return cleaned, None


def calculate_qa_effort(data):
    """
    Executes core QA resource estimation formulas based on verified inputs.
    Returns structured results matching the specification.
    """
    cleaned, error = validate_inputs(data)
    if error:
        raise ValueError(error)

    project_name = cleaned["project_name"]
    loc = cleaned["loc"]
    test_cases = cleaned["test_cases"]
    coverage = cleaned["coverage"]
    avg_test_minutes = cleaned["avg_test_minutes"]
    complexity = cleaned["complexity"]
    qa_productivity = cleaned["qa_productivity"]
    retest_buffer = cleaned["retest_buffer"]
    working_hours = cleaned["working_hours"]
    loc_factor = cleaned["loc_testing_factor"]

    # 1. Test Execution Hours: (test_cases * avg_test_minutes) / 60
    test_execution_hours = (test_cases * avg_test_minutes) / 60.0

    # 2. Coverage Factor: baseline 80%
    coverage_factor = coverage / BASELINE_COVERAGE

    # 3. Complexity Factor
    complexity_factor = COMPLEXITY_FACTORS[complexity]

    # 4. LOC-Based Testing Effort (transparent assumption)
    loc_testing_hours = loc * loc_factor

    # 5. Base QA Effort
    base_effort = (test_execution_hours + loc_testing_hours) * coverage_factor * complexity_factor

    # 6. Regression / Retest Effort
    retest_hours = base_effort * (retest_buffer / 100.0)

    # 7. Total QA Effort
    total_hours = base_effort + retest_hours

    # 8. Person Days
    person_days = total_hours / working_hours if working_hours > 0 else 0.0

    # 9. FTE (Full-Time Equivalent based on 160 productive monthly hours)
    fte = total_hours / PRODUCTIVE_MONTHLY_HOURS

    # 10. Estimated Duration in Days (Ceiling of person-days for a single stream/tester)
    duration_days = math.ceil(person_days) if person_days > 0 else 0

    # 11. Productivity Metrics & Throughput Analytics
    nominal_cases_per_hour = round(60.0 / avg_test_minutes, 2)
    daily_case_capacity = round(qa_productivity * working_hours, 1)
    productivity_variance = round(((nominal_cases_per_hour - qa_productivity) / qa_productivity) * 100.0, 1)

    result = {
        "project_name": project_name,
        "loc": loc,
        "test_cases": test_cases,
        "coverage": coverage,
        "complexity": complexity,
        "avg_test_minutes": avg_test_minutes,
        "qa_productivity": qa_productivity,
        "retest_buffer": retest_buffer,
        "working_hours": working_hours,
        "test_execution_hours": round(test_execution_hours, 2),
        "loc_testing_hours": round(loc_testing_hours, 2),
        "coverage_factor": round(coverage_factor, 4),
        "complexity_factor": round(complexity_factor, 2),
        "base_effort": round(base_effort, 2),
        "retest_hours": round(retest_hours, 2),
        "total_hours": round(total_hours, 2),
        "person_days": round(person_days, 2),
        "fte": round(fte, 2),
        "duration_days": int(duration_days),
        # Productivity Analysis
        "productivity_metrics": {
            "nominal_cases_per_hour": nominal_cases_per_hour,
            "target_qa_productivity": qa_productivity,
            "daily_case_capacity_per_tester": daily_case_capacity,
            "productivity_variance_pct": productivity_variance
        }
    }
    return result


def simulate_coverage_impact(data):
    """
    Simulates QA effort across benchmark coverage levels: 60%, 70%, 80%, 90%, 100%.
    Computes absolute effort and delta relative to baseline (80% coverage).
    """
    cleaned, error = validate_inputs(data)
    if error:
        raise ValueError(error)

    baseline_data = dict(cleaned)
    baseline_data["coverage"] = BASELINE_COVERAGE
    baseline_result = calculate_qa_effort(baseline_data)
    baseline_hours = baseline_result["total_hours"]

    target_coverages = [60.0, 70.0, 80.0, 90.0, 100.0]
    simulation = []

    for cov in target_coverages:
        scenario_data = dict(cleaned)
        scenario_data["coverage"] = cov
        res = calculate_qa_effort(scenario_data)
        diff = round(res["total_hours"] - baseline_hours, 2)
        diff_pct = round((diff / baseline_hours) * 100.0, 1) if baseline_hours > 0 else 0.0

        simulation.append({
            "coverage": cov,
            "total_hours": res["total_hours"],
            "person_days": res["person_days"],
            "fte": res["fte"],
            "difference_hours": diff,
            "difference_pct": diff_pct
        })

    return simulation
