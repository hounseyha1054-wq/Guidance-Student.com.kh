from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from functools import wraps
from ..model.fact import Fact
from ..model.rule import Rule
from ..model.career import Career
from ..model.user import db
from ..service.fact_service import FactService
from ..service.rule_service import RuleService

manage_bp = Blueprint('manage', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function




@manage_bp.route('/facts')
@login_required
def facts_page():
    return render_template('manage_facts.html')


@manage_bp.route('/rules')
@login_required
def rules_page():
    return render_template('manage_rules.html')


@manage_bp.route('/questionnaires')
@login_required
def questionnaires_page():
    return render_template('questionnaires.html')


@manage_bp.route('/api/facts', methods=['GET', 'POST'])
def facts():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    if request.method == 'GET':
        items = Fact.query.all()
        return jsonify([i.to_dict() for i in items])

    # Restrict creation to Admins only
    if not session.get('is_admin'):
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json() or {}
    category = (data.get('category') or '').strip()
    content = (data.get('content') or '').strip()
    if not category or not content:
        return jsonify({'error': 'category and content required'}), 400
    f = FactService.create_fact(user_id, category, content)
    return jsonify(f.to_dict()), 201


@manage_bp.route('/api/facts/<int:fact_id>', methods=['PUT', 'DELETE'])
def manage_fact_item(fact_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    fact = Fact.query.get(fact_id)
    if not fact:
        return jsonify({'error': 'Fact not found'}), 404
        
    # Restrict management to Admins only
    if not session.get('is_admin'):
        return jsonify({'error': 'Permission denied'}), 403

    if request.method == 'DELETE':
        try:
            db.session.delete(fact)
            db.session.commit()
            return jsonify({'success': True})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    if request.method == 'PUT':
        data = request.get_json() or {}
        if 'category' in data:
            fact.category = (data['category'] or '').strip()
        if 'content' in data:
            fact.content = (data['content'] or '').strip()
        db.session.commit()
        return jsonify(fact.to_dict())


@manage_bp.route('/api/rules', methods=['GET', 'POST'])
def rules():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    if request.method == 'GET':
        items = Rule.query.all()
        return jsonify([i.to_dict() for i in items])

    # Restrict creation to Admins only
    if not session.get('is_admin'):
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json() or {}
    domain = (data.get('domain') or '').strip()
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    if not domain or not title:
        return jsonify({'error': 'domain and title required'}), 400
    r = RuleService.create_rule(user_id, domain, title, description)
    return jsonify(r.to_dict()), 201


@manage_bp.route('/api/rules/<int:rule_id>', methods=['PUT', 'DELETE'])
def manage_rule_item(rule_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    rule = Rule.query.get(rule_id)
    if not rule:
        return jsonify({'error': 'Rule not found'}), 404

    # Restrict management to Admins only
    if not session.get('is_admin'):
        return jsonify({'error': 'Permission denied'}), 403

    if request.method == 'DELETE':
        try:
            db.session.delete(rule)
            db.session.commit()
            return jsonify({'success': True})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    if request.method == 'PUT':
        data = request.get_json() or {}
        if 'domain' in data:
            rule.domain = (data['domain'] or '').strip()
        if 'title' in data:
            rule.title = (data['title'] or '').strip()
        if 'description' in data:
            rule.description = (data['description'] or '').strip()
        db.session.commit()
        return jsonify(rule.to_dict())


@manage_bp.route('/api/save-assessment', methods=['POST'])
def save_assessment():
    """Save user's assessment results to their profile."""
    from datetime import datetime
    from ..model.user import User
    from ..model.activity import UserActivity
    
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json() or {}
    primary_career = data.get('primary_career')
    secondary_career = data.get('secondary_career')
    confidence = data.get('confidence', 0)
    answers = data.get('answers', [])
    
    if not primary_career:
        return jsonify({'error': 'primary_career required'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.recommended_career = primary_career
    user.secondary_career = secondary_career
    user.confidence_score = confidence
    user.assessment_completed = True
    user.last_assessment = datetime.utcnow()
    
    # Removed auto-creation of Facts and Rules to prevent polluting the Knowledge Base

    # 3. Create Activity Log (UserActivity)
    # This ensures it shows up in the dashboard System Activity and Admin Logs
    activity = UserActivity(
        user_id=user_id,
        activity_type='assessment_completed',
        description=f"Career Assessment completed - Recommended: {primary_career}, Secondary: {secondary_career}",
        score=confidence
    )
    db.session.add(activity)

    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Assessment saved successfully',
        'user': user.to_dict()
    }), 200


@manage_bp.route('/api/user-profile', methods=['GET'])
def get_user_profile():
    """Get user's profile with assessment results."""
    from ..model.user import User
    
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200


@manage_bp.route('/api/assessment-questions', methods=['GET'])
def get_assessment_questions():
    """Get assessment questions based on user's facts and rules."""
    from ..model.user import User
    
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    questions = []
    idx = 1
    
    # Fetch Facts from DB (Only those created by Admins)
    facts = Fact.query.join(User).filter(User.is_admin == True).all()
    for fact in facts:
        questions.append({
            'id': idx,
            'question': fact.content,
            'category': fact.category,
            'fact': fact.content,
            'type': 'yes_no'
        })
        idx += 1

    return jsonify(questions), 200


@manage_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user and their associated data (Admin only)."""
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 403
    
    current_user_id = session.get('user_id')
    if user_id == current_user_id:
        return jsonify({'error': 'Cannot delete yourself'}), 400

    from ..model.user import User
    from ..model.activity import UserActivity
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Delete related records manually (if cascades aren't fully set up)
        from ..model.teacher import StudentNote
        StudentNote.query.filter_by(student_id=user_id).delete()
        UserActivity.query.filter_by(user_id=user_id).delete()
        Fact.query.filter_by(user_id=user_id).delete()
        Rule.query.filter_by(user_id=user_id).delete()
        
        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@manage_bp.route('/api/careers', methods=['GET', 'POST'])
def manage_careers():
    """API to get or create careers."""
    if request.method == 'GET':
        careers = Career.query.all()
        return jsonify([c.to_dict() for c in careers])
    
    # POST - Create new career (Admin only)
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    try:
        new_career = Career(
            title=data.get('title'),
            category=data.get('category'),
            min_salary=int(data.get('min_salary', 0) or 0),
            max_salary=int(data.get('max_salary', 0) or 0),
            description=data.get('description'),
            required_skills=data.get('required_skills'),
            education_requirements=data.get('education_requirements')
        )
        db.session.add(new_career)
        db.session.commit()
        return jsonify({'success': True, 'career': new_career.to_dict()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@manage_bp.route('/api/admin/create-student', methods=['POST'])
def create_student_admin():
    """Create a student from the admin dashboard."""
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json() or {}
    
    # Basic validation
    if not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
        
    from ..model.user import User
    
    # Generate username from email if not provided
    username = data.get('username') or data.get('email').split('@')[0]
    
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'error': 'Email already exists'}), 400
        
    try:
        user = User(username=username, email=data.get('email'))
        user.set_password('student123') # Default password
        db.session.add(user)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student created with default password "student123"'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
