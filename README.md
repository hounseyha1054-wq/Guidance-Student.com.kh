# Guidance Student

Guidance Student is a Flask-based career guidance web application for students and administrators. It supports role-based authentication, student career assessments, activity tracking, teacher/student notes, and management of the career-guidance knowledge base.

The project is designed for local development and can also be deployed to platforms such as Render or Vercel using PostgreSQL or SQLite.

## Key Features

- **User authentication** — registration, login, logout, password handling, and optional Google OAuth
- **Student dashboard** — view profile information, career recommendations, and logged activities
- **Career guidance assessment** — collect student answers and generate career recommendations
- **Activity tracking** — record and review student activities
- **Admin dashboard** — view users and activities through role-protected routes
- **Knowledge-base management** — maintain facts and career-guidance rules
- **Teacher/student notes** — associate guidance notes with students
- **Firebase-compatible configuration** — optional frontend Firebase integration
- **SQLite fallback** — automatically uses `instance/app.db` when `DATABASE_URL` is not configured
- **PostgreSQL support** — supports hosted PostgreSQL connections through SQLAlchemy

## Technology Stack

- Python 3
- Flask
- Flask-SQLAlchemy / SQLAlchemy
- SQLite for local development
- PostgreSQL for production deployments
- Authlib and Google OAuth
- HTML, CSS, and JavaScript
- Gunicorn
- Render and Vercel deployment configuration

## Project Structure

```text
Guidance-Student.com.kh/
├── App/
│   ├── __init__.py          # Flask application factory
│   ├── config.py            # Application configuration
│   ├── extensions.py        # Shared extensions such as OAuth
│   ├── seed.py              # Default database seed data
│   ├── model/               # SQLAlchemy models
│   ├── routes/              # Authentication and management blueprints
│   ├── service/             # Application services
│   ├── Rule/                # Guidance-rule resources
│   ├── static/              # CSS, JavaScript, and public assets
│   └── templates/           # Jinja HTML templates
├── api/
│   └── index.py             # Serverless API entry point
├── scripts/                 # Database and application test utilities
├── instance/                # Local SQLite database directory
├── app.py                   # Local application entry point
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variable template
├── ARCHITECTURE.md          # System architecture documentation
├── render.yaml              # Render deployment configuration
├── vercel.json              # Vercel deployment configuration
└── Procfile                 # Gunicorn process configuration
```

## Prerequisites

- Python 3.10 or newer
- `pip`
- A virtual environment tool such as `venv`
- Optional: PostgreSQL for production or hosted database use

## Local Installation

```bash
git clone https://github.com/hounseyha1054-wq/Guidance-Student.com.kh.git
cd Guidance-Student.com.kh

python -m venv .venv
```

Activate the virtual environment:

```bash
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Environment Configuration

Create a local `.env` file from the provided example:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

The most important settings are:

```dotenv
SECRET_KEY=change_this_to_a_random_secure_value
DATABASE_URL=

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=change-this-password

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

When `DATABASE_URL` is blank, the application creates and uses a local SQLite database in `instance/app.db`.

For PostgreSQL, set `DATABASE_URL` to a connection string such as:

```text
postgresql://username:password@host:5432/database
```

If a deployment provider supplies a `postgres://` URL, the application normalizes it to `postgresql://` during startup.

## Running the Application

```bash
python app.py
```

The development server runs on:

```text
http://localhost:5000
```

Debug mode is enabled only for local development.

## Database and Initial Data

At startup, the application:

1. Creates required database tables.
2. Uses SQLite as a fallback when no PostgreSQL URL is supplied.
3. Performs limited SQLite development migrations for new user columns.
4. Seeds default administrator, facts, rules, and career data when appropriate.

Change the seeded administrator credentials before using the application in a production environment.

## Utility Scripts

The repository includes scripts for database and application checks:

```bash
python verify_db.py
python add_test_user.py
python scripts/test_sqlite.py
python scripts/test_flow.py
```

Review each script before running it because it may create or modify database records.

## Deployment

### Render

The repository includes `render.yaml` and `Procfile` for deployment-oriented configuration. Render-style deployments use Gunicorn through:

```bash
gunicorn app:app
```

Configure the environment variables in the hosting platform, especially:

- `SECRET_KEY`
- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `GOOGLE_CLIENT_ID` if Google OAuth is used
- `GOOGLE_CLIENT_SECRET` if Google OAuth is used

### Vercel

The repository also contains `vercel.json` and `api/index.py` for serverless deployment configuration.

## Security Recommendations

- Replace the default secret key and administrator password.
- Do not commit `.env` or real database credentials.
- Use HTTPS and secure session cookies in production.
- Rotate OAuth and Firebase credentials if they have been exposed.
- Restrict database access using hosting-provider network policies or credentials.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for a detailed overview of the application flow, database relationships, role-based access, and dashboard architecture.

## License

No license has been specified in this repository. Consult the repository owner before using or distributing the project.
