from .user import db

class Career(db.Model):
    __tablename__ = 'careers'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    min_salary = db.Column(db.Integer)
    max_salary = db.Column(db.Integer)
    description = db.Column(db.Text)
    required_skills = db.Column(db.String(200))
    education_requirements = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'min_salary': self.min_salary,
            'max_salary': self.max_salary,
            'description': self.description,
            'required_skills': self.required_skills,
            'education_requirements': self.education_requirements
        }