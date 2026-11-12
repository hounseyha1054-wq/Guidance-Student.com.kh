from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255))
    is_admin = db.Column(db.Boolean, default=False)
    profile_image = db.Column(db.String(255), nullable=True)
    first_name = db.Column(db.String(80), nullable=True)
    last_name = db.Column(db.String(80), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    recommended_career = db.Column(db.String(120), nullable=True)
    secondary_career = db.Column(db.String(120), nullable=True)
    confidence_score = db.Column(db.Integer, default=0)
    assessment_completed = db.Column(db.Boolean, default=False)
    last_assessment = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'profile_image': self.profile_image,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'is_admin': self.is_admin,
            'recommended_career': self.recommended_career,
            'secondary_career': self.secondary_career,
            'confidence_score': self.confidence_score,
            'assessment_completed': self.assessment_completed,
            'last_assessment': self.last_assessment.isoformat() if self.last_assessment else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'
