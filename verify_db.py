from App import create_app
from App.model.user import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("-" * 50)
    print(f"Active Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    if 'sqlite' in app.config['SQLALCHEMY_DATABASE_URI']:
        print("WARNING: You are currently connected to SQLite.")
    else:
        print("SUCCESS: You are connected to SQL Server.")
    print("-" * 50)

    print(f"Checking database connection...")
    try:
        # Execute a raw SQL query to check the users table
        # This works even if we don't import the specific User model class
        result = db.session.execute(text("SELECT * FROM users"))
        rows = result.fetchall()
        
        if rows:
            print(f"Success! Found {len(rows)} users:")
            for row in rows:
                print(row)
        else:
            print("Success! Connected to SQL Server, but the 'users' table is empty.")
            
    except Exception as e:
        print(f"Error: {e}")