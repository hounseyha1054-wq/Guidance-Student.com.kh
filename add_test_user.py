from dotenv import load_dotenv
load_dotenv()  # Load environment variables (like DATABASE_URL)
from werkzeug.security import generate_password_hash

from App import create_app
from App.model.user import db, User  # Importing the User model

app = create_app()

with app.app_context():
    print(f"Current Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print("Attempting to save a new user...")

    # 1. Create the object
    # We are using fields seen in your account.html (first_name, last_name, etc.)
    new_user = User(
        first_name="Chheun",
        last_name="Seyha",
        email="Seyha168@gmail.com",
        username="Seyha168",  # Username is REQUIRED
        password_hash=generate_password_hash("password123"),
        phone="010868773",
        is_admin=False
    )

    # 2. Add to session
    db.session.add(new_user)

    # 3. Commit (Save)
    try:
        db.session.commit()
        print("Success! Data saved to the database.")
    except Exception as e:
        db.session.rollback()  # Undo changes if there is an error
        print(f"Error saving data: {e}")