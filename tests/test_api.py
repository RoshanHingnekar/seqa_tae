import json
import pytest
from backend.app import create_app
from backend.database import db
from backend.models import Project

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "test-key"

@pytest.fixture
def client():
    """Configures test client with in-memory SQLite database."""
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

@pytest.fixture
def sample_payload():
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

# 1. GET /api/health
def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data == {"status": "ok"}

# 2. POST /api/estimate
def test_post_estimate(client, sample_payload):
    response = client.post(
        "/api/estimate",
        data=json.dumps(sample_payload),
        content_type="application/json"
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["project_name"] == "E-Commerce Application"
    assert data["total_hours"] == 287.5
    assert data["person_days"] == 35.94
    assert data["fte"] == 1.8
    assert data["duration_days"] == 36
    assert "coverage_simulation" in data
    assert len(data["coverage_simulation"]) == 5

# 3. Invalid request
def test_invalid_estimate_request(client, sample_payload):
    # Missing project name
    bad_payload = dict(sample_payload)
    bad_payload["project_name"] = "   "
    res1 = client.post("/api/estimate", data=json.dumps(bad_payload), content_type="application/json")
    assert res1.status_code == 400
    assert "error" in json.loads(res1.data)

    # Negative LOC
    bad_payload = dict(sample_payload)
    bad_payload["loc"] = -10
    res2 = client.post("/api/estimate", data=json.dumps(bad_payload), content_type="application/json")
    assert res2.status_code == 400

    # Coverage > 100
    bad_payload = dict(sample_payload)
    bad_payload["coverage"] = 150
    res3 = client.post("/api/estimate", data=json.dumps(bad_payload), content_type="application/json")
    assert res3.status_code == 400

    # Invalid JSON
    res4 = client.post("/api/estimate", data="not json", content_type="application/json")
    assert res4.status_code == 400

# 4. POST /api/projects
def test_create_project(client, sample_payload):
    response = client.post(
        "/api/projects",
        data=json.dumps(sample_payload),
        content_type="application/json"
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert "id" in data
    assert data["id"] is not None
    assert data["project_name"] == "E-Commerce Application"
    assert data["total_hours"] == 287.5

# 5. GET /api/projects
def test_list_projects(client, sample_payload):
    # First empty
    res_empty = client.get("/api/projects")
    assert res_empty.status_code == 200
    assert json.loads(res_empty.data) == []

    # Insert two projects
    client.post("/api/projects", data=json.dumps(sample_payload), content_type="application/json")
    p2 = dict(sample_payload)
    p2["project_name"] = "FinTech Portal"
    client.post("/api/projects", data=json.dumps(p2), content_type="application/json")

    res_list = client.get("/api/projects")
    assert res_list.status_code == 200
    projects = json.loads(res_list.data)
    assert len(projects) == 2
    assert projects[0]["project_name"] == "FinTech Portal"

# 6. GET specific project
def test_get_single_project(client, sample_payload):
    create_res = client.post(
        "/api/projects",
        data=json.dumps(sample_payload),
        content_type="application/json"
    )
    project_id = json.loads(create_res.data)["id"]

    get_res = client.get(f"/api/projects/{project_id}")
    assert get_res.status_code == 200
    data = json.loads(get_res.data)
    assert data["id"] == project_id
    assert data["project_name"] == "E-Commerce Application"
    assert "coverage_simulation" in data

    # Non-existent project
    not_found_res = client.get("/api/projects/9999")
    assert not_found_res.status_code == 404

# 7. DELETE project
def test_delete_project(client, sample_payload):
    create_res = client.post(
        "/api/projects",
        data=json.dumps(sample_payload),
        content_type="application/json"
    )
    project_id = json.loads(create_res.data)["id"]

    del_res = client.delete(f"/api/projects/{project_id}")
    assert del_res.status_code == 200
    del_data = json.loads(del_res.data)
    assert del_data["status"] == "deleted"
    assert del_data["id"] == project_id

    # Verify gone
    check_res = client.get(f"/api/projects/{project_id}")
    assert check_res.status_code == 404

    # Delete non-existent
    del_404 = client.delete(f"/api/projects/{project_id}")
    assert del_404.status_code == 404
