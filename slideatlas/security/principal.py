# coding=utf-8

from functools import partial, wraps
from itertools import chain

from flask.ext.principal import Permission as Requirement
from flask.ext.principal import PermissionDenied, identity_loaded

from flask.ext.security import current_user
from flask.ext.security.core import _on_identity_loaded as security_on_identity_loaded
from werkzeug.exceptions import Forbidden, Unauthorized

from slideatlas import models
from slideatlas.models import Permission

################################################################################
# TODO: populate __all__
__all__ = ('AdminSiteRequirement', 'AdminCollectionRequirement',
           'AdminSessionRequirement', 'ViewSessionRequirement', 'UserRequirement')


################################################################################
# TODO: change the tuple values to use an enum, instead of strings
AdminSitePermission = partial(Permission, *('admin', 'site', None))
AdminCollectionPermission = partial(Permission, *('admin', 'collection'))
AdminSessionPermission = partial(Permission, *('admin', 'session'))
ViewCollectionPermission = partial(Permission, *('view', 'collection'))
ViewSessionPermission = partial(Permission, *('view', 'session'))
UserPermission = partial(Permission, *('be', 'user'))



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
class AdminSiteRequirement(Requirement, ModelProtectionMixin):
    model_type = None

    def __init__(self):
        super(AdminSiteRequirement, self).__init__(
            AdminSitePermission(),
        )


class AdminCollectionRequirement(Requirement, ModelProtectionMixin):
    model_type = models.Collection

    def __init__(self, collection):
        super(AdminCollectionRequirement, self).__init__(
            AdminSitePermission(),
            AdminCollectionPermission(collection.id),
        )


class AdminSessionRequirement(Requirement, ModelProtectionMixin):
    model_type = models.Session

    def __init__(self, session):
        super(AdminSessionRequirement, self).__init__(
            AdminSitePermission(),
            AdminCollectionPermission(session.collection.id),
            AdminSessionPermission(session.id),
        )


class ViewSessionRequirement(Requirement, ModelProtectionMixin):
    model_type = models.Session

    def __init__(self, session):
        super(ViewSessionRequirement, self).__init__(
            AdminSitePermission(),
            AdminCollectionPermission(session.collection.id),
            AdminSessionPermission(session.id),
            ViewCollectionPermission(session.collection.id),
            ViewSessionPermission(session.id),
        )


class UserRequirement(Requirement, ModelProtectionMixin):
    model_type = models.User

    def __init__(self, user):
        super(UserRequirement, self).__init__(
            AdminSitePermission(),
            UserPermission(user.id),
        )


################################################################################
def on_identity_loaded(app, identity):
    if hasattr(current_user, 'id'):
        identity.provides.add(UserPermission(current_user.id))
    identity.provides.update(current_user.effective_permissions)
    identity.user = current_user


################################################################################
def on_permission_denied(error):
    # TODO: consider calling "Permission.require" to raise an HTTP exception
    #   directly, so that this error handler can be registered for all such
    #   access control-related HTTP exceptions
    if current_user.is_authenticated():
        return Forbidden()  # 403
    else:
        # TODO: redirect to login page if this is a non-JSON GET request
        return Unauthorized()  # 401


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
