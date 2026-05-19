class BusinessRule:
    """
    Represents a logical rule definition, separate from the database entity.
    Used for defining executable business logic.
    """
    def __init__(self, name, description, condition=None, action=None):
        self.name = name
        self.description = description
        self._condition = condition
        self._action = action

    def evaluate(self, context):
        """
        Evaluates the rule against the given context.
        """
        if self._condition and self._condition(context):
            if self._action:
                return self._action(context)
            return True
        return False
