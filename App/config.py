import os
import urllib.parse

class Config:
    """
    Configuration for the application.
    Includes SQL Server connection settings.
    """
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev_key'

    # SQL Server Settings - Update these with your actual server details
    SQL_SERVER = os.environ.get('SQL_SERVER') or 'localhost'
    SQL_DATABASE = os.environ.get('SQL_DATABASE') or 'CareerAppDB'
    SQL_USER = os.environ.get('SQL_USER') or 'sa'
    SQL_PASSWORD = os.environ.get('SQL_PASSWORD') or 'your_password'
    SQL_DRIVER = os.environ.get('SQL_DRIVER') or 'ODBC Driver 17 for SQL Server'

    # Connection String Construction
    # This handles special characters in passwords and ensures correct driver usage
    params = urllib.parse.quote_plus(f'DRIVER={{{SQL_DRIVER}}};SERVER={SQL_SERVER};DATABASE={SQL_DATABASE};UID={SQL_USER};PWD={SQL_PASSWORD}')
    
    # SQLAlchemy Configuration
    SQLALCHEMY_DATABASE_URI = f"mssql+pyodbc:///?odbc_connect={params}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False