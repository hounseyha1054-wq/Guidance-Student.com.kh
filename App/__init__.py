from flask import Flask, redirect, url_for, render_template
import os
from dotenv import load_dotenv
from sqlalchemy import text
from .model.user import db
from .model.activity import UserActivity
from .model.teacher import Teacher, StudentNote
from .extensions import oauth
from .routes.auth import auth_bp
from .routes.manage import manage_bp

def create_app():
    # Force load .env file first - Check multiple locations to be safe
    current_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(current_dir)
    env_paths = [os.path.join(project_root, '.env'), os.path.join(os.getcwd(), '.env')]
    
    for path in env_paths:
        if os.path.exists(path):
            load_dotenv(path)
            print(f"--> Loaded .env from: {path}")
            break

    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY') or 'dev_secret_career_guidance_2026_key'
    # Ensure Flask instance folder exists and use absolute path for SQLite
    os.makedirs(app.instance_path, exist_ok=True)
    
    # Database Configuration: Normalize postgresql URL if provided, else fallback to SQLite
    db_url = os.getenv('DATABASE_URL')
    if db_url:
        # Cloud providers like Render, Supabase, Neon use postgres:// which SQLAlchemy 1.4+ rejects
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        print(f"--> CONNECTING TO DATABASE: {db_url.split('@')[-1]}")
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    else:
        print("--> WARNING: DATABASE_URL not found. Using SQLite fallback.")
        sqlite_path = os.path.join(app.instance_path, 'app.db')
        sqlite_uri = 'sqlite:///' + sqlite_path.replace('\\', '/')
        app.config['SQLALCHEMY_DATABASE_URI'] = sqlite_uri

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    # Initialize OAuth
    oauth.init_app(app)
    oauth.register(
        name='google',
        client_id=os.getenv('GOOGLE_CLIENT_ID'),
        client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(manage_bp)

    @app.route('/')
    def index():
        return redirect(url_for('auth.login'))

    @app.errorhandler(404)
    def not_found_error(e):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(e):
        return render_template('500.html'), 500
    
    with app.app_context():
        db.create_all()
        # Ensure new columns exist in older DBs (simple fallback for development)
        try:
            # Only run manual SQLite migrations if using SQLite
            if 'sqlite' in app.config.get('SQLALCHEMY_DATABASE_URI', ''):
                with db.engine.connect() as conn:
                    res = conn.execute(text("PRAGMA table_info('users')")).fetchall()
                    cols = [r[1] for r in res]
                    if 'is_admin' not in cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))
                        conn.commit()
                    if 'profile_image' not in cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255)"))
                        conn.commit()
                    if 'first_name' not in cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN first_name VARCHAR(80)"))
                        conn.commit()
                    if 'last_name' not in cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN last_name VARCHAR(80)"))
                        conn.commit()
                    if 'phone' not in cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(20)"))
                        conn.commit()
        except Exception as e:
            print(f"Migration error: {e}")
            
        # Seed default Admin, Knowledge Base Facts, Rules, and Careers if database is fresh
        from .seed import seed_default_data
        seed_default_data()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
