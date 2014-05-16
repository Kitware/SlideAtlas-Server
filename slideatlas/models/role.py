# coding=utf-8

from mongoengine import BooleanField, ListField, ObjectIdField,ReferenceField,\
    StringField

from .common import ModelDocument
from .image_store import ImageStore

################################################################################
__all__ = ('Role', 'UserRole', 'GroupRole')


################################################################################
class Role(ModelDocument):
    meta = {
        'db_alias': 'admin_db',
        'collection': 'rules',
        'allow_inheritance': True,
        }

    db = ReferenceField(ImageStore, dbref=False, required=True,
        verbose_name='Image Store', help_text='The image store that this role applies to.')

    label = StringField(required=True,  # TODO:make unique
        verbose_name='Name', help_text='')


    can_see = ListField(ObjectIdField(), required=False,
        verbose_name='Can See Sessions', help_text='The sessions that the user can view.')

    can_see_all = BooleanField(required=False,
        verbose_name='Can See All Sessions', help_text='The user can view all sessions in this database.')

    db_admin = BooleanField(required=False,
        verbose_name='Database Administrator', help_text='The user is a database-wide administrator for this rule\'s database.')

    site_admin = BooleanField(required=False,
        verbose_name='Site Administrator', help_text='The user is a site-wide administrator.')

    def __unicode__(self):
        return unicode(self.label)

    def can_see_session(self, session):
        if self.can_admin_session(session):
            return True
        if self.db == session.database:
            if self.can_see_all:
                return True
            if session.id in self.can_see:
                return True
        return False

    def can_admin_session(self, session):
        if self.site_admin:
            return True
        if self.db_admin and (self.db == session.database):
            return True
        return False


class UserRole(Role):
    pass


class GroupRole(Role):
    facebook_id = StringField(required=False,
        verbose_name='Facebook Group ID', help_text='The Facebook group ID that corresponds to the role.')
