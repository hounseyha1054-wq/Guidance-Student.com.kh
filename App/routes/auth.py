from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, Response,json
from datetime import datetime
import os
from werkzeug.utils import secure_filename
import csv
import io
import secrets
from ..extensions import oauth
from ..model.user import User, db
from ..model.activity import UserActivity
from ..model.teacher import Teacher, StudentNote
from ..model.fact import Fact
from ..model.rule import Rule
from ..model.career import Career
from functools import wraps
from collections import OrderedDict

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            flash('You do not have permission to access this page')
            return redirect(url_for('auth.dashboard'))
        return f(*args, **kwargs)
    return decorated_function

def teacher_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'teacher_id' not in session:
            return redirect(url_for('auth.login'))
        teacher = Teacher.query.get(session['teacher_id'])
        if not teacher:
            flash('You do not have permission to access this page')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user_type = request.form.get('user_type', 'user')  # 'admin', 'teacher', or 'user'
        
        # Try student/admin login
        if user_type in ['user', 'admin']:
            user = User.query.filter_by(username=username).first()
            
            if user and user.check_password(password):
                # Check if login type matches user role
                if user_type == 'admin' and not user.is_admin:
                    flash('This account is not an admin account')
                    return redirect(url_for('auth.login'))
                elif user_type == 'user' and user.is_admin:
                    flash('Please use admin login for admin accounts')
                    return redirect(url_for('auth.login'))
                
                session['user_id'] = user.id
                session['username'] = user.username
                session['is_admin'] = user.is_admin
                session.pop('teacher_id', None)
                
                if user.is_admin:
                    return redirect(url_for('auth.admin_dashboard'))
                else:
                    return redirect(url_for('auth.account'))
            else:
                flash('Invalid username or password')
        
        # Try teacher login
        elif user_type == 'teacher':
            teacher = Teacher.query.filter_by(username=username).first()
            
            if teacher and teacher.check_password(password):
                session['teacher_id'] = teacher.id
                session['teacher_name'] = teacher.get_full_name()
                session['teacher_email'] = teacher.email
                session.pop('user_id', None)
                session.pop('is_admin', None)
                
                return redirect(url_for('auth.teacher_dashboard'))
            else:
                flash('Invalid username or password')
    
    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        phone = request.form.get('phone')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Passwords do not match')
            return redirect(url_for('auth.register'))
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return redirect(url_for('auth.register'))
            
        if User.query.filter_by(email=email).first():
            flash('Email already registered')
            return redirect(url_for('auth.register'))
        
        new_user = User(username=username, email=email, first_name=first_name, last_name=last_name, phone=phone)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registration successful! Please log in.')
        return redirect(url_for('auth.login'))
    
    return render_template('register.html')

def get_dashboard_data():
    """Helper to get common dashboard data"""
    # 1. Career Stats for Table
    # Group users by recommended career
    users_with_career = User.query.filter(User.recommended_career.isnot(None)).all()
    total_recommendations = len(users_with_career)
    
    career_counts = {}
    for u in users_with_career:
        career_counts[u.recommended_career] = career_counts.get(u.recommended_career, 0) + 1
        
    career_stats = []
    for name, count in career_counts.items():
        # Try to find career details
        career_obj = Career.query.filter_by(title=name).first()
        avg_salary = "N/A"
        if career_obj and career_obj.min_salary and career_obj.max_salary:
            avg_salary = f"${(career_obj.min_salary + career_obj.max_salary) // 2000}K"
            
        career_stats.append({
            'name': name,
            'count': count,
            'percentage': int((count / total_recommendations) * 100) if total_recommendations > 0 else 0,
            'avg_salary': avg_salary
        })
    
    # Sort by count desc
    career_stats.sort(key=lambda x: x['count'], reverse=True)
    
    # 2. Recent Students
    recent_students = User.query.filter_by(is_admin=False).order_by(User.created_at.desc()).limit(5).all()
    
    # 3. Chart Data (Simplified for demo)
    # Pie Chart: Categories
    categories = {}
    for u in users_with_career:
        # If we had categories in User, we'd use them. For now, map career name to category via Career model
        c = Career.query.filter_by(title=u.recommended_career).first()
        cat = c.category if c else 'Other'
        categories[cat] = categories.get(cat, 0) + 1
        
    # 4. Area Chart: Registrations by Month (Current Year)
    monthly_counts = OrderedDict()
    for m in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']:
        monthly_counts[m] = 0
        
    all_users = User.query.all()
    current_year = datetime.now().year
    for u in all_users:
        if u.created_at and u.created_at.year == current_year:
            m = u.created_at.strftime('%b')
            if m in monthly_counts:
                monthly_counts[m] += 1
        
    return career_stats, recent_students, categories, {'labels': list(monthly_counts.keys()), 'data': list(monthly_counts.values())}

@auth_bp.route('/dashboard')
@login_required
def dashboard():
    user = User.query.get(session['user_id'])
    career_stats, recent_students, category_data, area_chart_data = get_dashboard_data()
    
    # Common stats
    total_facts = Fact.query.count()
    total_rules = Rule.query.count()
    total_careers = Career.query.count()
    
    # If user is a student, render the dashboard with stats
    if not user.is_admin:
        return redirect(url_for('auth.account'))

    # Redirect admins to the admin dashboard view
    return redirect(url_for('auth.admin_dashboard'))

@auth_bp.route('/assessment')
@login_required
def assessment():
    """Career Assessment page for students"""
    user = User.query.get(session['user_id'])
    return render_template('assessment.html', user=user)

@auth_bp.route('/account')
@login_required
def account():
    """User Account/Profile page"""
    user = User.query.get(session['user_id'])
    return render_template('account.html', user=user)

@auth_bp.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    # Filtering / sorting parameters
    activity_type = request.args.get('activity_type', None)
    search = request.args.get('search', '').strip()
    sort_by = request.args.get('sort_by', 'latest')  # 'latest' or 'username' or 'count'
    sort_dir = request.args.get('sort_dir', 'desc')

    # Get users (apply username search if provided)
    users_q = User.query.filter_by(is_admin=False)
    if search:
        users_q = users_q.filter(User.username.ilike(f"%{search}%"))
    users = users_q.all()

    # All activities (for stats) - apply optional activity_type filter
    activities_q = UserActivity.query
    if activity_type:
        activities_q = activities_q.filter_by(activity_type=activity_type)
    all_activities = activities_q.order_by(UserActivity.created_at.desc()).all()

    # Build latest activity mapping and counts per user
    latest_activities = {}
    activity_counts = {}
    for u in users:
        latest = UserActivity.query.filter_by(user_id=u.id)
        if activity_type:
            latest = latest.filter_by(activity_type=activity_type)
        latest = latest.order_by(UserActivity.created_at.desc()).first()
        latest_activities[u.id] = latest

        # counts across all activities (no search filter) so admin sees full counts
        activity_counts[u.id] = UserActivity.query.filter_by(user_id=u.id).count()

    # Sort users according to requested sort
    if sort_by == 'username':
        users.sort(key=lambda u: u.username.lower(), reverse=(sort_dir == 'desc'))
    elif sort_by == 'count':
        users.sort(key=lambda u: activity_counts.get(u.id, 0), reverse=(sort_dir == 'desc'))
    else:  # latest
        def latest_key(u):
            l = latest_activities.get(u.id)
            return l.created_at if l and l.created_at else datetime.min
        users.sort(key=latest_key, reverse=(sort_dir == 'desc'))

    # Calculate stats
    total_users = User.query.filter_by(is_admin=False).count()
    total_activities = UserActivity.query.count()
    total_facts = Fact.query.count()
    total_rules = Rule.query.count()
    total_careers = Career.query.count()
    
    # Get extra data for charts/tables
    career_stats, recent_students, category_data, area_chart_data = get_dashboard_data()
    
    current_user = User.query.get(session['user_id'])

    # Reuse existing student dashboard template for admin overview (admin-only panels rendered inside template)
    return render_template('dashboard.html', 
                         users=users, 
                         activities=all_activities,
                         latest_activities=latest_activities,
                         activity_counts=activity_counts,
                         total_users=total_users,
                         total_activities=total_activities,
                         total_facts=total_facts,
                         total_rules=total_rules,
                         total_careers=total_careers,
                         filter_activity_type=activity_type,
                         search_query=search,
                         sort_by=sort_by,
                         sort_dir=sort_dir,
                         career_stats=career_stats,
                         recent_students=recent_students,
                         chart_categories=category_data,
                         area_chart_data=area_chart_data,
                         user=current_user)

@auth_bp.route('/teacher/dashboard')
@teacher_required
def teacher_dashboard():
    teacher_id = session.get('teacher_id')
    teacher = Teacher.query.get(teacher_id)
    
    # Get all students
    students = User.query.filter_by(is_admin=False).all()
    
    # Get all activities
    all_activities = UserActivity.query.order_by(UserActivity.created_at.desc()).all()
    
    # Get teacher's notes
    notes = StudentNote.query.filter_by(teacher_id=teacher_id).all()
    
    # Calculate stats
    total_students = len(students)
    total_activities = len(all_activities)
    
    return render_template('teacher_dashboard.html',
                         teacher=teacher,
                         students=students,
                         activities=all_activities,
                         notes=notes,
                         total_students=total_students,
                         total_activities=total_activities)


# Admin: view activities for a specific user (page)
@auth_bp.route('/admin/user/<int:user_id>/activities')
@admin_required
def admin_user_activities_page(user_id):
    user = User.query.get(user_id)
    if not user:
        flash('User not found')
        return redirect(url_for('auth.admin_dashboard'))

    activities = UserActivity.query.filter_by(user_id=user_id).order_by(UserActivity.created_at.desc()).all()
    return render_template('admin_user_activities.html', user=user, activities=activities)

@auth_bp.route('/admin/employees')
@admin_required
def all_employees_page():
    """Page to list all employees (non-admin users)."""
    search = request.args.get('search', '').strip()
    
    users_q = User.query.filter_by(is_admin=False)
    if search:
        users_q = users_q.filter(User.username.ilike(f"%{search}%"))
    
    users = users_q.order_by(User.created_at.desc()).all()
    return render_template('all_employees.html', users=users, search_query=search)

@auth_bp.route('/admin/export_activities')
@admin_required
def admin_export_activities():
    """Export activities as CSV. Supports optional filters: activity_type, search (username)."""
    activity_type = request.args.get('activity_type', None)
    search = request.args.get('search', '').strip()

    # Build activities query
    q = UserActivity.query.join(User, User.id == UserActivity.user_id)
    if activity_type:
        q = q.filter(UserActivity.activity_type == activity_type)
    if search:
        q = q.filter(User.username.ilike(f"%{search}%"))

    rows = q.order_by(UserActivity.created_at.desc()).all()

    # CSV generation
    si = io.StringIO()
    writer = csv.writer(si)
    writer.writerow(['id','user_id','username','activity_type','description','score','duration_seconds','created_at','additional_data'])
    for r in rows:
        username = User.query.get(r.user_id).username if r.user_id else ''
        additional = r.additional_data if r.additional_data is not None else ''
        writer.writerow([r.id, r.user_id, username, r.activity_type, (r.description or '').replace('\n',' '), r.score or '', r.duration_seconds or '', r.created_at, json.dumps(additional) if isinstance(additional, dict) else additional])

    output = si.getvalue()
    si.close()

    headers = {
        'Content-Disposition': 'attachment; filename=activities_export.csv',
        'Content-Type': 'text/csv; charset=utf-8'
    }
    return Response(output, headers=headers)

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))

@auth_bp.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password):
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

@auth_bp.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone')
    password = data.get('password')
    confirm_password = data.get('confirm_password')
    
    if password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Username already exists'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    
    new_user = User(username=username, email=email, first_name=first_name, last_name=last_name, phone=phone)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Registration successful'})

@auth_bp.route('/api/profile', methods=['POST'])
@login_required
def update_profile():
    """Update user profile (email, password)"""
    data = request.form if request.form else (request.get_json() or {})
    user = User.query.get(session['user_id'])
    
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    if data.get('email'):
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user.id:
             return jsonify({'success': False, 'error': 'Email already exists'})
        user.email = data['email']
    
    if 'first_name' in data:
        user.first_name = data['first_name']
        
    if 'last_name' in data:
        user.last_name = data['last_name']
        
    if 'phone' in data:
        user.phone = data['phone']
        
    if data.get('password'):
        user.set_password(data['password'])
        
    # Handle profile image upload
    if 'profile_image' in request.files:
        file = request.files['profile_image']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            # Ensure unique filename
            unique_filename = f"{user.id}_{int(datetime.utcnow().timestamp())}_{filename}"
            
            # Define upload path (relative to app root)
            upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            
            file.save(os.path.join(upload_dir, unique_filename))
            user.profile_image = unique_filename

    db.session.commit()
    return jsonify({'success': True})

# Activity Tracking Endpoints
@auth_bp.route('/api/activity', methods=['POST'])
@login_required
def save_activity():
    """Save user activity/gameplay data"""
    data = request.get_json()
    # Support both `additional_data` (current) and `metadata` (older clients)
    additional = data.get('additional_data') if data.get('additional_data') is not None else data.get('metadata')

    activity = UserActivity(
        user_id=session['user_id'],
        activity_type=data.get('activity_type'),
        description=data.get('description'),
        score=data.get('score'),
        duration_seconds=data.get('duration_seconds'),
        additional_data=additional
    )
    
    db.session.add(activity)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Activity saved', 'activity_id': activity.id})

@auth_bp.route('/api/activities', methods=['GET'])
@login_required
def get_user_activities():
    """Get all activities for current user"""
    user_id = session['user_id']
    activities = UserActivity.query.filter_by(user_id=user_id).order_by(UserActivity.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'activities': [activity.to_dict() for activity in activities]
    })

@auth_bp.route('/api/admin/activities', methods=['GET'])
@admin_required
def get_all_activities():
    """Get all activities for admin view"""
    activities = UserActivity.query.order_by(UserActivity.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'activities': [activity.to_dict() for activity in activities]
    })

@auth_bp.route('/api/admin/user-activities/<int:user_id>', methods=['GET'])
@admin_required
def get_user_activities_by_id(user_id):
    """Get activities for a specific user (admin only)"""
    activities = UserActivity.query.filter_by(user_id=user_id).order_by(UserActivity.created_at.desc()).all()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    return jsonify({
        'success': True,
        'user': user.username,
        'activities': [activity.to_dict() for activity in activities]
    })

@auth_bp.route('/login/google')
def google_login():
    redirect_uri = url_for('auth.google_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route('/auth/google/callback')
def google_callback():
    token = oauth.google.authorize_access_token()
    user_info = oauth.google.userinfo()
    
    email = user_info.get('email')
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # Create new user from Google info
        username = email.split('@')[0]
        # Ensure username is unique
        if User.query.filter_by(username=username).first():
            username = f"{username}_{int(datetime.utcnow().timestamp())}"
            
        user = User(
            username=username,
            email=email,
            first_name=user_info.get('given_name'),
            last_name=user_info.get('family_name'),
            is_admin=False
        )
        # Set a random password since they use Google login
        user.set_password(secrets.token_urlsafe(16))
        db.session.add(user)
        db.session.commit()
        
    session['user_id'] = user.id
    session['username'] = user.username
    session['is_admin'] = user.is_admin
    session.pop('teacher_id', None)
    
    if user.is_admin:
        return redirect(url_for('auth.admin_dashboard'))
    else:
        return redirect(url_for('auth.account'))
