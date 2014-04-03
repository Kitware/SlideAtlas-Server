
from bson.objectid import ObjectId
from flask import current_app

from slideatlas import models


################################################################################
def __add_default_user_rules(user):
    """
    TODO: move this logic to the security module
    """
    if ObjectId(current_app.config['DEMO_RULE']) not in user.rules:
        user.rules.append(ObjectId(current_app.config['DEMO_RULE']))

    if isinstance(user, models.PasswordUser) and (user.email.endswith('brown.edu') or user.email.endswith('kitware.com')):
        # Here grant the user with the demo_brown rule
        brownrule = ObjectId('529d244959a3aee20f8a00ae')
        if brownrule not in user.rules:
            user.rules.append(ObjectId('529d244959a3aee20f8a00ae'))
