# coding=utf-8

from .common import LoginProvider
from slideatlas import models

################################################################################
__all__ = ('register',)
# TODO: this is a temporary fix to get demo user working until the demo
    #   rule is available without login

################################################################################
def register(app, blueprint):
    # TODO: this is a temporary fix to get demo user working until the demo
    #   rule is available without login
    blueprint.add_url_rule(rule='/login/demo',
                           view_func=login_demo,
                           methods=['GET'])


def login_demo():
    demo_user = models.PasswordUser.objects.get(email='all_demo')
    return LoginProvider.login_user(demo_user)
