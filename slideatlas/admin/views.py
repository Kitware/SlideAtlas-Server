# coding=utf-8

import re

from flask.ext.admin import Admin
from flask.ext.admin.contrib.mongoengine import ModelView
from flask.ext.admin.contrib.mongoengine.form import CustomModelConverter
from flask.ext.mongoengine.wtf import orm

from slideatlas import models
from slideatlas import security

################################################################################
__all__ = ('register_with_app',)


################################################################################
from bson import ObjectId
from wtforms.fields import IntegerField

class ObjectIdField(IntegerField):
    def process_formdata(self, valuelist):
        if valuelist:
            try:
                self.data = ObjectId(valuelist[0])
            except ValueError:
                self.data = None
                raise ValueError(self.gettext('Not a valid ObjectId value'))

class SlideatlasModelConverter(CustomModelConverter):
    @orm.converts('ObjectIdField')
    def conv_ObjectId(self, model, field, kwargs):
        if field.name == 'id':
            return None
        return ObjectIdField(**kwargs)


class SlideatlasModelView(ModelView):
    model_class = None
    name=None
    category = None

    model_form_converter = SlideatlasModelConverter

    def __init__(self):
        super(SlideatlasModelView, self).__init__(
            model=self.model_class,
            name=self.name,
            category=self.category,
            )

    def is_accessible(self):
        return security.AdminSiteRequirement().can()

    def get_column_name(self, field):
        try:
            return self.model._fields[field].verbose_name
        except (KeyError, AttributeError):
            return super(SlideatlasModelView, self).get_column_name(field)


################################################################################
class BaseUserView(SlideatlasModelView):
    category = 'Users'

    column_list = ('email', 'full_name', 'created_at', 'current_login_at', 'login_count')
    column_default_sort = 'full_name' # TODO: sort by last name
    column_searchable_list = ('email', 'full_name') # TODO: make search case-insensitive

    form_widget_args = dict.fromkeys(
        (
            'created_at',
            'last_login_at',
            'current_login_at',
            'last_login_ip',
            'current_login_ip',
            'login_count',
        ),
        {'disabled': True})

#     form_ajax_refs = { # the remote model fields that the auto-complete will search
#         'groups': {'fields': RuleView.column_searchable_list},
#     }

class UserView(BaseUserView):
    model_class = models.User
    name = 'All Users'

    can_create = False # Users must be a specific sub-type
    can_edit = False # TODO: link edits to the form for the proper sub-type

    column_list = ('_cls',) + BaseUserView.column_list
    column_labels = dict(_cls='Type')

    def scaffold_sortable_columns(self):
        columns = super(UserView, self).scaffold_sortable_columns()
        columns['_cls'] = '_cls'
        return columns

    column_formatters = dict(_cls=lambda view, context, model, name: re.match(r'User\.(.+)User', model._class_name).group(1))


class PasswordUserView(BaseUserView):
    model_class = models.PasswordUser
    name = 'Password Users'

    form_excluded_columns = ('password',)


class GoogleUserView(BaseUserView):
    model_class = models.GoogleUser
    name = 'Google Users'


class FacebookUserView(BaseUserView):
    model_class = models.FacebookUser
    name = 'Facebook Users'

class LinkedinUserView(BaseUserView):
    model_class = models.LinkedinUser
    name = 'Linkedin Users'


class ShibbolethUserView(BaseUserView):
    model_class = models.ShibbolethUser
    name = 'Shibboleth Users'


################################################################################
class GroupView(SlideatlasModelView):
    model_class = models.GroupRole
    name = 'Groups'

    can_delete = False # TODO: set up reverse-deletion rules for users, so this can be removed

    column_list = ('label',)
    column_default_sort = 'label'
    column_searchable_list = ('label',)
    #form_ajax_refs = {
        #'db': QueryAjaxModelLoader('db', models.Database, fields=('label',))
        #}

    # form_excluded_columns = ('permissions',) # TODO: temporary
    # form_overrides = dict(permissions=permission_convert)

#from flask.ext.admin.contrib.mongoengine.ajax import QueryAjaxModelLoader

################################################################################
class ImageStoreView(SlideatlasModelView):
    category = 'Image Stores'
    can_create = False
    can_delete = False

    column_list = ('label', 'host', 'dbname')
    column_default_sort = 'label'

class MongoImageStoreView(ImageStoreView):
    model_class = models.MongoImageStore
    name = 'MongoDB Image Stores'

class PtiffImageStoreView(ImageStoreView):
    model_class = models.PtiffImageStore
    name = 'PTIFF Image Stores'

    column_list = ImageStoreView.column_list + ('root_path',)

################################################################################
class CollectionView(SlideatlasModelView):
    model_class = models.Collection
    name = 'Collections'

    can_delete = False

    column_list = ('label', 'image_store')
    column_default_sort = 'label'
    column_searchable_list = ('label', 'copyright')


################################################################################
def register_with_app(app):
    admin = Admin(app,
                  name='SlideAtlas Admin',
                  url='/admin2',
                  # 'endpoint' is the name of the index blueprint, and needs to
                  #   be 'admin' for the default templates to work
                  endpoint='admin'
    )

    # TODO: make admin.add_view() a decorator for the class defs
    admin.add_view(UserView())
    admin.add_view(PasswordUserView())
    admin.add_view(GoogleUserView())
    admin.add_view(FacebookUserView())
    admin.add_view(LinkedinUserView())
    admin.add_view(ShibbolethUserView())

    admin.add_view(GroupView())

    admin.add_view(MongoImageStoreView())
    admin.add_view(PtiffImageStoreView())

    admin.add_view(CollectionView())
