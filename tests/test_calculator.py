import pytest
from backend.calculator import (
    calculate_qa_effort,
    simulate_coverage_impact,
    validate_inputs,
    COMPLEXITY_FACTORS,
    BASELINE_COVERAGE,
    PRODUCTIVE_MONTHLY_HOURS
)

@pytest.fixture
def valid_payload():
    """Returns standard reference payload matching Section 10 of requirements."""
    return {
        "project_name": "E-Commerce Application",
        "loc": 50000,
        "test_cases": 1250,
        "coverage": 80,
        "avg_test_minutes": 12,
        "complexity": "medium",
        "qa_productivity": 6,
        "retest_buffer": 15,
        "working_hours": 8
    }

# 1. Normal calculation
def test_normal_calculation(valid_payload):
    result = calculate_qa_effort(valid_payload)
    assert result["project_name"] == "E-Commerce Application"
    assert result["loc"] == 50000
    assert result["test_cases"] == 1250
    assert result["coverage"] == 80
    assert result["complexity"] == "medium"
    assert result["test_execution_hours"] == 250.0
    assert result["loc_testing_hours"] == 0.0
    assert result["coverage_factor"] == 1.0
    assert result["complexity_factor"] == 1.0
    assert result["base_effort"] == 250.0
    assert result["retest_hours"] == 37.5
    assert result["total_hours"] == 287.5
    assert result["person_days"] == 35.94
    assert result["fte"] == 1.8
    assert result["duration_days"] == 36

# 2. Zero LOC
def test_zero_loc(valid_payload):
    payload = dict(valid_payload)
    payload["loc"] = 0
    result = calculate_qa_effort(payload)
    assert result["loc"] == 0
    assert result["loc_testing_hours"] == 0.0
    assert result["total_hours"] == 287.5

# 3. Zero test cases
def test_zero_test_cases(valid_payload):
    payload = dict(valid_payload)
    payload["test_cases"] = 0
    result = calculate_qa_effort(payload)
    assert result["test_cases"] == 0
    assert result["test_execution_hours"] == 0.0
    assert result["total_hours"] == 0.0
    assert result["person_days"] == 0.0
    assert result["duration_days"] == 0

# 4. Invalid coverage
def test_invalid_coverage(valid_payload):
    payload = dict(valid_payload)
    payload["coverage"] = 105
    cleaned, err = validate_inputs(payload)
    assert err is not None
    with pytest.raises(ValueError, match="Target coverage"):
        calculate_qa_effort(payload)

    payload["coverage"] = -5
    with pytest.raises(ValueError, match="Target coverage"):
        calculate_qa_effort(payload)

# 5. Negative LOC
def test_negative_loc(valid_payload):
    payload = dict(valid_payload)
    payload["loc"] = -100
    with pytest.raises(ValueError, match="Lines of Code"):
        calculate_qa_effort(payload)

# 6. Invalid productivity
def test_invalid_productivity(valid_payload):
    payload = dict(valid_payload)
    payload["qa_productivity"] = 0
    with pytest.raises(ValueError, match="QA productivity"):
        calculate_qa_effort(payload)

    payload["qa_productivity"] = -2
    with pytest.raises(ValueError, match="QA productivity"):
        calculate_qa_effort(payload)

# 7. Invalid working hours
def test_invalid_working_hours(valid_payload):
    payload = dict(valid_payload)
    payload["working_hours"] = 0
    with pytest.raises(ValueError, match="Working hours per day"):
        calculate_qa_effort(payload)

    payload["working_hours"] = -8
    with pytest.raises(ValueError, match="Working hours per day"):
        calculate_qa_effort(payload)

# 8. Invalid complexity
def test_invalid_complexity(valid_payload):
    payload = dict(valid_payload)
    payload["complexity"] = "extreme"
    with pytest.raises(ValueError, match="Complexity must be one of"):
        calculate_qa_effort(payload)

# 9. Low complexity
def test_low_complexity(valid_payload):
    payload = dict(valid_payload)
    payload["complexity"] = "low"
    result = calculate_qa_effort(payload)
    assert result["complexity_factor"] == 0.85
    # base_effort = 250 * 1.0 * 0.85 = 212.5
    assert result["base_effort"] == 212.5
    # retest = 212.5 * 0.15 = 31.875 -> 31.88
    assert result["retest_hours"] == 31.88
    assert result["total_hours"] == 244.38

# 10. Medium complexity
def test_medium_complexity(valid_payload):
    payload = dict(valid_payload)
    payload["complexity"] = "medium"
    result = calculate_qa_effort(payload)
    assert result["complexity_factor"] == 1.00
    assert result["base_effort"] == 250.0

# 11. High complexity
def test_high_complexity(valid_payload):
    payload = dict(valid_payload)
    payload["complexity"] = "high"
    result = calculate_qa_effort(payload)
    assert result["complexity_factor"] == 1.25
    # base_effort = 250 * 1.0 * 1.25 = 312.5
    assert result["base_effort"] == 312.5
    # retest = 312.5 * 0.15 = 46.875 -> 46.88
    assert result["retest_hours"] == 46.88
    assert result["total_hours"] == 359.38

# 12. Retest buffer
def test_retest_buffer(valid_payload):
    payload = dict(valid_payload)
    payload["retest_buffer"] = 0
    result_zero_retest = calculate_qa_effort(payload)
    assert result_zero_retest["retest_hours"] == 0.0
    assert result_zero_retest["total_hours"] == result_zero_retest["base_effort"]

    payload["retest_buffer"] = 30
    result_30_retest = calculate_qa_effort(payload)
    assert result_30_retest["retest_hours"] == 75.0
    assert result_30_retest["total_hours"] == 325.0

# 13. Person-day calculation
def test_person_day_calculation(valid_payload):
    payload = dict(valid_payload)
    payload["working_hours"] = 7.5
    result = calculate_qa_effort(payload)
    # total_hours = 287.5 / 7.5 = 38.3333... -> 38.33
    assert result["person_days"] == 38.33

# 14. FTE calculation
def test_fte_calculation(valid_payload):
    payload = dict(valid_payload)
    result = calculate_qa_effort(payload)
    # total_hours = 287.5 / 160 = 1.796875 -> 1.8
    assert result["fte"] == 1.8

# 15. Duration calculation
def test_duration_calculation(valid_payload):
    payload = dict(valid_payload)
    result = calculate_qa_effort(payload)
    # person_days = 35.94 -> math.ceil(35.9375) = 36
    assert result["duration_days"] == 36

# 16. Coverage simulation
def test_coverage_simulation(valid_payload):
    simulation = simulate_coverage_impact(valid_payload)
    assert len(simulation) == 5
    coverages = [s["coverage"] for s in simulation]
    assert coverages == [60.0, 70.0, 80.0, 90.0, 100.0]

    # Baseline 80% should have difference 0
    sim_80 = next(s for s in simulation if s["coverage"] == 80.0)
    assert sim_80["difference_hours"] == 0.0
    assert sim_80["total_hours"] == 287.5

    # 100% should have positive difference
    sim_100 = next(s for s in simulation if s["coverage"] == 100.0)
    assert sim_100["difference_hours"] > 0
    # 100/80 = 1.25 -> 250 * 1.25 = 312.5; retest = 46.88; total = 359.38
    assert sim_100["total_hours"] == 359.38
