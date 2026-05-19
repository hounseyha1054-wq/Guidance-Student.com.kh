from datetime import datetime
from .user import db

class UserActivity(db.Model):
    __tablename__ = 'user_activities'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_type = db.Column(db.String(80), nullable=False)  # e.g., 'quiz_completed', 'fact_viewed', 'rule_applied'
    description = db.Column(db.Text, nullable=True)
    score = db.Column(db.Integer, nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)  # Time spent in seconds
    additional_data = db.Column(db.JSON, nullable=True)  # Additional data as JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'activity_type': self.activity_type,
            'description': self.description,
            'score': self.score,
            'duration_seconds': self.duration_seconds,
            'additional_data': self.additional_data,
            'created_at': self.created_at.isoformat()
        }
