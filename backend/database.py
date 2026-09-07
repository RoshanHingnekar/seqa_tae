from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance
db = SQLAlchemy()

def init_db(app):
    """Binds SQLAlchemy to the Flask app and creates database tables if they do not exist."""
    db.init_app(app)
    with app.app_context():
        db.create_all()
