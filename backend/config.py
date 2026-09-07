import os

class Config:
    """Application configuration for local development and Render production."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-qa-estimator-2026")
    
    # Retrieve DATABASE_URL from environment variable
    database_url = os.environ.get("DATABASE_URL")
    
    if database_url:
        # Render PostgreSQL URLs may start with 'postgres://', which SQLAlchemy 1.4+ deprecates
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = database_url
    else:
        # Fallback to local SQLite for offline development if DATABASE_URL is not set
        BASE_DIR = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'estimator.db')}"
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
