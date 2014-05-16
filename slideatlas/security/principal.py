# coding=utf-8

from functools import partial, wraps
from itertools import chain

from flask import abort
from flask.ext.principal import Permission, PermissionDenied, Need, ItemNeed,\
    UserNeed, identity_loaded
from flask.ext.security import current_user
from flask.ext.security.core import _on_identity_loaded as security_on_identity_loaded

from slideatlas import models

################################################################################
__all__ = ('UserPermission', 'ViewSessionPermission', 'AdminSessionPermission',
           'AdminDatabasePermission', 'AdminSitePermission')


################################################################################
# can't use 'partial' with 'method=' keyword argument, or else the final
#   function application must use a keyword too
ViewSessionNeed = partial(ItemNeed, 'view', type='session')
ViewDatabaseNeed = partial(ItemNeed, 'view', type='database')
AdminSessionNeed = partial(ItemNeed, 'admin', type='session')
AdminDatabaseNeed = partial(ItemNeed, 'admin', type='database')
AdminSiteNeed = partial(Need, 'admin', 'site')


################################################################################
class ModelProtectionMixin():
    model_type = None

    @classmethod
    def protected(cls, f):
        @wraps(f)
        def _decorated(*args, **kwargs):
            if cls.model_type:
                found_args = list()
                for arg in chain(args, kwargs.itervalues()):
                    # TODO: Session is a MultipleDatabaseModelDocument, and so its
                    #   type may be a copy of the original, so temporarily allow
                    #   comparison by name
                    if isinstance(arg, cls.model_type) or type(arg).__name__ == cls.model_type.__name__:
                        found_args.append(arg)
                if len(found_args) != 1:
                    raise TypeError('A "%s.protected" decorator must be used on a view which requires a single parameter of type %s.' % (cls.__name__, cls.model_type))
                permission = cls(found_args[0])
            else:
                permission = cls()
            with permission.require():
                return f(*args, **kwargs)

        return _decorated


################################################################################
class UserPermission(Permission, ModelProtectionMixin):
    model_type = models.User

    def __init__(self, user):
        super(UserPermission, self).__init__(
            UserNeed(user.id),
            AdminSiteNeed(),
        )


class ViewSessionPermission(Permission, ModelProtectionMixin):
    model_type = models.Session

    def __init__(self, session):
        super(ViewSessionPermission, self).__init__(
            ViewSessionNeed(session.id),
            ViewDatabaseNeed(session.database.id),
            AdminSessionNeed(session.id),
            AdminDatabaseNeed(session.database.id),
            AdminSiteNeed(),
        )


class AdminSessionPermission(Permission, ModelProtectionMixin):
    model_type = models.Session

    def __init__(self, session):
        super(AdminSessionPermission, self).__init__(
            AdminSessionNeed(session.id),
            AdminDatabaseNeed(session.database.id),
            AdminSiteNeed(),
        )


class AdminDatabasePermission(Permission, ModelProtectionMixin):
    model_type = models.ImageStore

    def __init__(self, database):
        super(AdminDatabasePermission, self).__init__(
            AdminDatabaseNeed(database.id),
            AdminSiteNeed(),
        )


class AdminSitePermission(Permission, ModelProtectionMixin):
    model_type = None

    def __init__(self):
        super(AdminSitePermission, self).__init__(
            AdminSiteNeed(),
        )


################################################################################
def on_identity_loaded(app, identity):
    if hasattr(current_user, 'id'):
        identity.provides.add(UserNeed(current_user.id))

    # when the 'roles' field is looked up, an extra level of dereferencing is
    #   automatically performed to get all of the 'role.db' objects too; this
    #   can't be easily disabled without also disabling automatic lookup of all
    #   'roles' objects, so just accept that 'role.db.id' isn't unnecessarily
    #   expensive
    for group in current_user.groups:
        if group.site_admin:
            identity.provides.add(AdminSiteNeed())
        if group.db_admin:
            identity.provides.add(AdminDatabaseNeed(group.db.id))
        if group.can_see_all:
            identity.provides.add(ViewDatabaseNeed(group.db.id))
        for session_id in group.can_see:
            identity.provides.add(ViewSessionNeed(session_id))

    identity.user = current_user


################################################################################
def on_permission_denied(error):
    if current_user.is_authenticated():
        abort(403)  # Forbidden
    else:
        # TODO: redirect to login page if this is a non-JSON GET request
        abort(401)  # Unauthorized


################################################################################
def register_principal(app, security):
    principal = security.principal

    # remove the default function for populating Identity, as it creates
    #   RoleNeeds, which are not used here
    identity_loaded.disconnect(security_on_identity_loaded)
    identity_loaded.connect(on_identity_loaded, app)

    # disable authorization for static resources
    principal.skip_static = True

    app.register_error_handler(PermissionDenied, on_permission_denied)
