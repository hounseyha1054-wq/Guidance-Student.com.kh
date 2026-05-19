# run.py
from dotenv import load_dotenv
load_dotenv()

from App import create_app

app = create_app()

if __name__ == '__main__':
    # Change this line:
    app.run(debug=True, host='0.0.0.0', port=5000)