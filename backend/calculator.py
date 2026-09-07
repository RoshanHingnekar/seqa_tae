import math

# Configurable Assumptions & Constants
LOC_RATE = 6.4          # Hours per 1,000 lines of code
TEST_CASE_RATE = 0.1242 # Hours per test case scenario
BASELINE_COVERAGE = 70.0 # Baseline 70% coverage

COMPLEXITY_FACTORS = {
    "low": 0.85,
    "medium": 1.00,
    "high": 1.25
}

ENV_FACTORS = {
    1: 1.00,
    2: 1.10,
    3: 1.20
}

WORKING_HOURS_PER_DAY = 8.0
PRODUCTIVE_MONTHLY_HOURS = 160.0

def validate_inputs(data):
    if not isinstance(data, dict):
        return None, "Request payload must be a JSON object"

    project_name = data.get("project_name") or data.get("projectName") or "QA Project"

    try:
        loc = int(data.get("loc", 12500))
    except (ValueError, TypeError):
        return None, "Lines of Code (LOC) must be a valid integer"

    try:
        test_cases = int(data.get("test_cases", data.get("testCases", 420)))
    except (ValueError, TypeError):
        return None, "Test cases must be a valid integer"

    try:
        coverage = float(data.get("coverage", 85.0))
    except (ValueError, TypeError):
        return None, "Target coverage must be a valid number"

    complexity = str(data.get("complexity", "medium")).lower().strip()
    if complexity not in COMPLEXITY_FACTORS:
        complexity = "medium"

    try:
        environments = int(data.get("environments", 1))
    except (ValueError, TypeError):
        environments = 1

    cleaned = {
        "project_name": str(project_name).strip(),
        "loc": max(0, loc),
        "test_cases": max(0, test_cases),
        "coverage": max(0.0, min(100.0, coverage)),
        "complexity": complexity,
        "environments": max(1, environments),
        "working_hours": WORKING_HOURS_PER_DAY
    }
    return cleaned, None

def calculate_qa_effort(data):
    cleaned, error = validate_inputs(data)
    if error:
        raise ValueError(error)

    loc = cleaned["loc"]
    test_cases = cleaned["test_cases"]
    coverage = cleaned["coverage"]
    complexity = cleaned["complexity"]
    environments = cleaned["environments"]

    # 1. Base Effort
    loc_effort = (loc / 1000.0) * LOC_RATE
    test_case_effort = test_cases * TEST_CASE_RATE
    base_effort = loc_effort + test_case_effort

    # 2. Coverage Multiplier
    coverage_multiplier = max(0.3, 1.0 + ((coverage - BASELINE_COVERAGE) / 100.0))

    # 3. Complexity Multiplier
    complexity_multiplier = COMPLEXITY_FACTORS[complexity]

    # 4. Environment Multiplier
    env_multiplier = ENV_FACTORS.get(environments, 1.20 if environments >= 3 else 1.00)

    # 5. Total QA Person Hours
    raw_total = base_effort * coverage_multiplier * complexity_multiplier * env_multiplier
    total_hours = round(raw_total, 1)
    person_days = round(total_hours / WORKING_HOURS_PER_DAY, 1)
    person_weeks = round(total_hours / 40.0, 1)

    return {
        "project_name": cleaned["project_name"],
        "loc": loc,
        "test_cases": test_cases,
        "coverage": coverage,
        "complexity": complexity.capitalize(),
        "environments": environments,
        "loc_effort": round(loc_effort, 1),
        "test_case_effort": round(test_case_effort, 1),
        "base_effort": round(base_effort, 1),
        "coverage_multiplier": round(coverage_multiplier, 2),
        "complexity_multiplier": complexity_multiplier,
        "env_multiplier": env_multiplier,
        "total_hours": total_hours,
        "person_days": person_days,
        "person_weeks": person_weeks,
        "recommended_team": {
            "qa_lead": 1,
            "qa_engineers": 2 if total_hours > 80 else 1,
            "automation_engineers": 1,
            "total_size": 4 if total_hours > 80 else 3
        },
        "breakdown": {
            "manual_testing": round(total_hours * 0.42, 1),
            "automation_testing": round(total_hours * 0.28, 1),
            "defect_retesting": round(total_hours * 0.15, 1),
            "planning_and_setup": round(total_hours * 0.10, 1),
            "reporting": round(total_hours * 0.05, 1)
        }
    }

def simulate_coverage_impact(data):
    cleaned, _ = validate_inputs(data)
    tiers = [60, 70, 80, 85, 90, 100]
    results = []
    for tier in tiers:
        copy_data = dict(cleaned)
        copy_data["coverage"] = tier
        res = calculate_qa_effort(copy_data)
        results.append({
            "coverage": tier,
            "total_hours": res["total_hours"],
            "person_days": res["person_days"]
        })
    return results
