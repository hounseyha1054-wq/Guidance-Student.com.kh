from ..model.user import db
from ..model.rule import Rule

class RuleService:
    @staticmethod
    def create_rule(user_id, domain, title, description):
        """
        Create a new rule in the database.
        
        Args:
            user_id (int): The ID of the user creating the rule.
            domain (str): The domain/category of the rule.
            title (str): The title of the rule.
            description (str): The detailed description of the rule.
            
        Returns:
            Rule: The created rule object.
        """
        new_rule = Rule(
            user_id=user_id,
            domain=domain,
            title=title,
            description=description
        )
        db.session.add(new_rule)
        db.session.commit()
        return new_rule

    @staticmethod
    def get_rule_by_id(rule_id):
        """
        Retrieve a rule by its ID.
        """
        return Rule.query.get(rule_id)

    @staticmethod
    def get_rules_by_domain(domain):
        """
        Retrieve all rules belonging to a specific domain.
        """
        return Rule.query.filter_by(domain=domain).all()

    @staticmethod
    def get_rules_by_user(user_id):
        """
        Retrieve all rules belonging to a specific user.
        """
        return Rule.query.filter_by(user_id=user_id).order_by(Rule.created_at.desc()).all()

    @staticmethod
    def get_all_rules():
        """
        Retrieve all rules.
        """
        return Rule.query.all()

    @staticmethod
    def delete_rule(rule_id, user_id):
        rule = Rule.query.filter_by(id=rule_id, user_id=user_id).first()
        if rule:
            db.session.delete(rule)
            db.session.commit()
            return True
        return False

    @staticmethod
    def update_rule(rule_id, user_id, domain, title, description):
        rule = Rule.query.filter_by(id=rule_id, user_id=user_id).first()
        if rule:
            rule.domain = domain
            rule.title = title
            rule.description = description
            db.session.commit()
            return rule
        return None