from datetime import datetime, timezone
from backend.database import db

class Project(db.Model):
    """
    Project model representing saved software testing estimation calculations.
    Maps directly to PostgreSQL 'projects' table (with SQLite compatibility).
    """
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_name = db.Column(db.String(200), nullable=False)
    loc = db.Column(db.Integer, nullable=False)
    test_cases = db.Column(db.Integer, nullable=False)
    coverage = db.Column(db.Float, nullable=False)
    avg_test_minutes = db.Column(db.Float, nullable=False)
    complexity = db.Column(db.String(20), nullable=False)
    qa_productivity = db.Column(db.Float, nullable=False)
    retest_buffer = db.Column(db.Float, nullable=False)
    working_hours = db.Column(db.Float, nullable=False)
    
    # Calculated metrics
    test_execution_hours = db.Column(db.Float, nullable=False)
    loc_testing_hours = db.Column(db.Float, nullable=False)
    base_effort = db.Column(db.Float, nullable=False)
    retest_hours = db.Column(db.Float, nullable=False)
    total_hours = db.Column(db.Float, nullable=False)
    person_days = db.Column(db.Float, nullable=False)
    fte = db.Column(db.Float, nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)
    
    # Timestamps (UTC)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        """Serializes the Project model into a JSON-friendly dictionary."""
        return {
            "id": self.id,
            "project_name": self.project_name,
            "loc": self.loc,
            "test_cases": self.test_cases,
            "coverage": self.coverage,
            "avg_test_minutes": self.avg_test_minutes,
            "complexity": self.complexity,
            "qa_productivity": self.qa_productivity,
            "retest_buffer": self.retest_buffer,
            "working_hours": self.working_hours,
            "test_execution_hours": round(self.test_execution_hours, 2),
            "loc_testing_hours": round(self.loc_testing_hours, 2),
            "base_effort": round(self.base_effort, 2),
            "retest_hours": round(self.retest_hours, 2),
            "total_hours": round(self.total_hours, 2),
            "person_days": round(self.person_days, 2),
            "fte": round(self.fte, 2),
            "duration_days": self.duration_days,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
