# coding=utf-8

from mongoengine import BooleanField, DictField, ListField, StringField

from .common import MultipleDatabaseModelDocument

################################################################################
__all__ = ('Session',)


################################################################################
class Session(MultipleDatabaseModelDocument):
    meta = {
        'collection': 'sessions',
        }

    name = StringField(required=True,
        verbose_name='Name', help_text='The session\'s name.')

    label = StringField(required=True,
        verbose_name='Label', help_text='The sessions\'s label.')

    views = ListField(DictField(), required=False,
        verbose_name='Views', help_text='')

    attachments = ListField(DictField(), required=False,
        verbose_name='Attachments', help_text='')

    images = ListField(DictField(), required=False,
        verbose_name='Images', help_text='')

    annotations = DictField(required=False,
        verbose_name='', help_text='')

    hideAnnotations = BooleanField(required=False,
        verbose_name='', help_text='')

    # TODO: discuss this
    # some 'sessions' collections may contain a 'users' field; current values are:
    #   'all_bev1_admin', 'all_wusm_admin', 'brown_demo_admin'
    # what is the purpose of this?
    # user = StringField

    def __unicode__(self):
        return unicode(self.label)


# class StackSession(Session):
#     """
#     There's currently only 1 document of this type, in the '3dpath' database
#     """

    type = StringField(required=True, choices=('stack',),
        verbose_name='Type', help_text='')

    transformations = DictField(required=False)
