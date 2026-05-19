from ..model.user import db
from ..model.fact import Fact

class FactService:
    @staticmethod
    def create_fact(user_id, category, content):
        """
        Create a new fact in the database.
        """
        new_fact = Fact(
            user_id=user_id,
            category=category,
            content=content
        )
        db.session.add(new_fact)
        db.session.commit()
        return new_fact

    @staticmethod
    def get_facts_by_user(user_id):
        """
        Retrieve all facts belonging to a specific user.
        """
        return Fact.query.filter_by(user_id=user_id).order_by(Fact.created_at.desc()).all()

    @staticmethod
    def delete_fact(fact_id, user_id):
        fact = Fact.query.filter_by(id=fact_id, user_id=user_id).first()
        if fact:
            db.session.delete(fact)
            db.session.commit()
            return True
        return False

    @staticmethod
    def update_fact(fact_id, user_id, category, content):
        fact = Fact.query.filter_by(id=fact_id, user_id=user_id).first()
        if fact:
            fact.category = category
            fact.content = content
            db.session.commit()
            return fact
        return None