import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from backend.config import Config
from backend.database import db, init_db
from backend.models import Project
from backend.calculator import calculate_qa_effort, simulate_coverage_impact, validate_inputs

def create_app(config_class=Config):
    """Application factory for Flask REST API and static frontend serving."""
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
    
    app = Flask(__name__, static_folder=frontend_dir, static_url_path="")
    app.config.from_object(config_class)

    # Enable CORS for API routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Database
    init_db(app)

    # -------------------------------------------------------------
    # FRONTEND STATIC ROUTES
    # -------------------------------------------------------------
    @app.route("/")
    def serve_frontend():
        """Serves the single-page application dashboard."""
        return send_from_directory(frontend_dir, "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        """Serves static files (CSS, JS, assets) or falls back to index.html."""
        file_path = os.path.join(frontend_dir, path)
        if os.path.exists(file_path):
            return send_from_directory(frontend_dir, path)
        return send_from_directory(frontend_dir, "index.html")

    # -------------------------------------------------------------
    # REST API ENDPOINTS
    # -------------------------------------------------------------
    @app.route("/api/health", methods=["GET"])
    def health_check():
        """
        Health check endpoint for Render monitoring and deployment verification.
        """
        return jsonify({"status": "ok"}), 200

    @app.route("/api/estimate", methods=["POST"])
    def estimate_effort():
        """
        Calculates testing effort metrics without saving to database.
        Also returns coverage impact simulation for analytics.
        """
        payload = request.get_json(silent=True)
        if not payload:
            return jsonify({"error": "Request body must be valid JSON"}), 400

        cleaned, validation_error = validate_inputs(payload)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        try:
            result = calculate_qa_effort(cleaned)
            coverage_simulation = simulate_coverage_impact(cleaned)
            result["coverage_simulation"] = coverage_simulation
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @app.route("/api/projects", methods=["POST"])
    def save_project():
        """
        Calculates QA effort and persists the project record in PostgreSQL/SQLite.
        """
        payload = request.get_json(silent=True)
        if not payload:
            return jsonify({"error": "Request body must be valid JSON"}), 400

        cleaned, validation_error = validate_inputs(payload)
        if validation_error:
            return jsonify({"error": validation_error}), 400

        try:
            result = calculate_qa_effort(cleaned)
            
            project = Project(
                project_name=result["project_name"],
                loc=result["loc"],
                test_cases=result["test_cases"],
                coverage=result["coverage"],
                avg_test_minutes=result["avg_test_minutes"],
                complexity=result["complexity"],
                qa_productivity=result["qa_productivity"],
                retest_buffer=result["retest_buffer"],
                working_hours=result["working_hours"],
                test_execution_hours=result["test_execution_hours"],
                loc_testing_hours=result["loc_testing_hours"],
                base_effort=result["base_effort"],
                retest_hours=result["retest_hours"],
                total_hours=result["total_hours"],
                person_days=result["person_days"],
                fte=result["fte"],
                duration_days=result["duration_days"]
            )
            
            db.session.add(project)
            db.session.commit()

            response_data = project.to_dict()
            response_data["coverage_simulation"] = simulate_coverage_impact(cleaned)
            return jsonify(response_data), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Database error: {str(e)}"}), 500

    @app.route("/api/projects", methods=["GET"])
    def list_projects():
        """
        Retrieves all saved project estimations ordered chronologically descending.
        """
        try:
            projects = Project.query.order_by(Project.created_at.desc()).all()
            return jsonify([p.to_dict() for p in projects]), 200
        except Exception as e:
            return jsonify({"error": f"Database error: {str(e)}"}), 500

    @app.route("/api/projects/<int:project_id>", methods=["GET"])
    def get_project(project_id):
        """
        Retrieves a single project estimation by ID.
        """
        try:
            project = db.session.get(Project, project_id)
            if not project:
                return jsonify({"error": f"Project with ID {project_id} not found"}), 404
            
            res = project.to_dict()
            # Also calculate simulation for this project
            simulation = simulate_coverage_impact(res)
            res["coverage_simulation"] = simulation
            return jsonify(res), 200
        except Exception as e:
            return jsonify({"error": f"Database error: {str(e)}"}), 500

    @app.route("/api/projects/<int:project_id>", methods=["DELETE"])
    def delete_project(project_id):
        """
        Deletes a project estimation record from the database.
        """
        try:
            project = db.session.get(Project, project_id)
            if not project:
                return jsonify({"error": f"Project with ID {project_id} not found"}), 404
            
            db.session.delete(project)
            db.session.commit()
            return jsonify({"status": "deleted", "id": project_id}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Database error: {str(e)}"}), 500

    # -------------------------------------------------------------
    # ERROR HANDLERS
    # -------------------------------------------------------------
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request"}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500

    return app

# Application instance for Gunicorn / WSGI
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
