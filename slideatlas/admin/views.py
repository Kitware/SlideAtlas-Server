# coding=utf-8

import re

from bson import ObjectId
from bson.errors import InvalidId
from flask.ext.admin import Admin, AdminIndexView
from flask.ext.admin.contrib.mongoengine import ModelView
from flask.ext.admin.contrib.mongoengine.ajax import QueryAjaxModelLoader
from flask.ext.admin.contrib.mongoengine.form import CustomModelConverter
from flask.ext.admin.model.fields import AjaxSelectMultipleField
from flask.ext.admin.helpers import get_form_data
from flask.ext.mongoengine.wtf import orm
from wtforms.fields import IntegerField

from slideatlas import models
from slideatlas import security

################################################################################
__all__ = ('register_with_app',)


################################################################################
class SlideatlasIndexView(AdminIndexView):
    def __init__(self, *args, **kwargs):
        # this will search the local template directories first
        kwargs['template'] = 'admin/slideatlas_index.html'
        super(SlideatlasIndexView, self).__init__(*args, **kwargs)

    def is_accessible(self):
        return security.AdminSiteRequirement().can()


################################################################################
class ObjectIdField(IntegerField):
    def process_formdata(self, valuelist):
        if valuelist:
            self.data = None
            if valuelist[0]:
                try:
                    self.data = ObjectId(valuelist[0])
                except InvalidId:
                    raise ValueError(self.gettext('Not a valid ObjectId value'))


class SlideatlasModelConverter(CustomModelConverter):
    @orm.converts('ObjectIdField')
    def conv_ObjectId(self, model, field, kwargs):
        if field.name == 'id':
            return None
        return ObjectIdField(**kwargs)


class SlideatlasModelView(ModelView):
    model_class = None
    name = None
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
    column_default_sort = ('created_at', True)  # latest at the top
    column_searchable_list = ('email', 'full_name')  # TODO: make search case-insensitive

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

    def get_form(self):
        form = super(BaseUserView, self).get_form()
        # fix a bug in Flask-Admin to allow '0' value for this field, even the
        #  'InputRequired' validator isn't working, so just disable validation,
        #  since the widget is disabled
        form.login_count.kwargs['validators'] = []
        return form

#     form_ajax_refs = { # the remote model fields that the auto-complete will search
#         'groups': {'fields': RuleView.column_searchable_list},
#     }


class UserView(BaseUserView):
    model_class = models.User
    name = 'All Users'

    can_create = False  # Users must be a specific sub-type
    can_edit = False  # TODO: link edits to the form for the proper sub-type

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
class BaseGroupView(SlideatlasModelView):
    category = 'Groups'


class UserAjaxSelectMultipleField(AjaxSelectMultipleField):
    def populate_obj(self, obj, name):
        group = obj
        updated_user_ids = [user.id for user in self.data]

        # remove the group from users not in 'updated_users' who have it
        models.User.objects(id__nin=updated_user_ids, groups=group).update(pull__groups=group)

        # add the group to users in 'updated_users' who are missing it
        models.User.objects(id__in=updated_user_ids).update(add_to_set__groups=group)


class GroupView(BaseGroupView):
    model_class = models.Group
    name = 'Groups'

    column_list = ('label',)
    column_default_sort = 'label'
    column_searchable_list = ('label',)

    can_delete = False  # TODO: set up reverse-deletion rules for users, so this can be removed

    _user_loader = QueryAjaxModelLoader(
        'users',
        models.User,
        fields=('email', 'full_name'),
        placeholder='Please select user')

    form_extra_fields = {
        'users': UserAjaxSelectMultipleField(
            loader=_user_loader,
            label='Users',
            validators=None,
        )
    }

    form_ajax_refs = {
        'users': _user_loader,
    }

    def get_create_form(self):
        form_class = super(GroupView, self).get_create_form()
        delattr(form_class, 'users')
        return form_class

    def edit_form(self, obj=None):
        users = models.User.objects(groups=obj)
        return self._edit_form_class(get_form_data(), obj=obj,
                                     users=users)


class PublicGroupView(BaseGroupView):
    model_class = models.PublicGroup
    name = 'Public Group'

    can_create = False
    can_delete = False


class UnlistedGroupView(BaseGroupView):
    model_class = models.UnlistedGroup
    name = 'Unlisted Group'

    can_create = False
    can_delete = False


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

    # TODO: make 'image_store' default to empty list item on new collection creation
    column_list = ('label', 'creator_codes', 'image_store')
    column_default_sort = 'label'
    column_searchable_list = ('label', 'copyright')


################################################################################
def register_with_app(app):
    admin = Admin(app,
        name='SlideAtlas Admin',
        index_view=SlideatlasIndexView(
            url='/admin2',
            # 'endpoint' is the name of the index blueprint, and needs to be
            #   'admin' for the default templates to work
            endpoint='admin'
        )
    )

    # TODO: make admin.add_view() a decorator for the class defs
    admin.add_view(UserView())
    admin.add_view(PasswordUserView())
    admin.add_view(GoogleUserView())
    admin.add_view(FacebookUserView())
    admin.add_view(LinkedinUserView())
    admin.add_view(ShibbolethUserView())

    admin.add_view(GroupView())
    admin.add_view(PublicGroupView())
    admin.add_view(UnlistedGroupView())


    admin.add_view(MongoImageStoreView())
    admin.add_view(PtiffImageStoreView())

    admin.add_view(CollectionView())
