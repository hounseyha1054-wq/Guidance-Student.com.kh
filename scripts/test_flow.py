import requests
import sys
BASE = 'http://127.0.0.1:5000'

def test_admin_login():
    s = requests.Session()
    resp = s.post(BASE + '/login', data={'username':'admin','password':'admin123','user_type':'admin'}, allow_redirects=False)
    loc = resp.headers.get('Location')
    print('admin login POST status', resp.status_code, 'Location->', loc)
    # Access admin dashboard
    r = s.get(BASE + '/admin/dashboard')
    print('GET /admin/dashboard status', r.status_code)
    return s

def test_student_login_and_save():
    s = requests.Session()
    resp = s.post(BASE + '/login', data={'username':'student1','password':'student123','user_type':'user'}, allow_redirects=False)
    loc = resp.headers.get('Location')
    print('student login POST status', resp.status_code, 'Location->', loc)
    # Try to access /dashboard (should redirect to /assessment)
    r = s.get(BASE + '/dashboard', allow_redirects=False)
    print('GET /dashboard for student status', r.status_code, 'Location->', r.headers.get('Location'))
    # Save an activity
    payload = {
        'activity_type': 'Career Assessment',
        'description': 'Test save from student1',
        'score': 90,
        'duration_seconds': 120,
        'metadata': {'primary_career':'Tester', 'secondary_career':'Dev'}
    }
    r2 = s.post(BASE + '/api/activity', json=payload)
    try:
        print('/api/activity ->', r2.status_code, r2.json())
    except Exception as e:
        print('/api/activity ->', r2.status_code, 'non-json response')
    return s


if __name__ == '__main__':
    try:
        admin_sess = test_admin_login()
        student_sess = test_student_login_and_save()

        # As admin, fetch all activities
        r = admin_sess.get(BASE + '/api/admin/activities')
        print('/api/admin/activities status', r.status_code)
        try:
            j = r.json()
            print('admin activities count:', len(j.get('activities', [])))
            # Print last activity description if exists
            if j.get('activities'):
                print('most recent activity desc:', j['activities'][0].get('description'))
        except Exception as e:
            print('failed to parse JSON from admin activities:', e)
    except Exception as e:
        print('Test script error:', e)
        sys.exit(1)
