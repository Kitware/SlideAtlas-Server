# coding=utf-8

import datetime
from random import SystemRandom
import string

from mongoengine import DateTimeField, ObjectIdField, ReferenceField, StringField, \
    DoesNotExist, MultipleObjectsReturned

from .common import ModelDocument
from .user import User

################################################################################
__all__ = ('Permalink',)


################################################################################
class Permalink(ModelDocument):
    meta = {
        'db_alias': 'admin_db',
        'collection': 'permalinks',
        'allow_inheritance': False,
        'indexes': [
            {
                'fields': ('code',),
                'cls': False,
                'unique': True,
                'sparse': False,
            },
            {
                'fields': ('view',),
                'cls': False,
                'unique': True,
                'sparse': False,
            },
        ]
    }

    CODE_LENGTH = 6

    @classmethod
    def generate_code(cls):
        # a collision will almost never happen, but check just to be safe
        while True:
            code = unambiguous_random_string(cls.CODE_LENGTH)
            try:
                cls.objects.get(code=code)
            except DoesNotExist:
                return code
            except MultipleObjectsReturned:
                # should not happen
                raise
            else:
                # try another code
                continue

    code = StringField(required=True,
        min_length=CODE_LENGTH, max_length=CODE_LENGTH, default=lambda: Permalink.generate_code(),
        verbose_name='Code', help_text='')

    destination = StringField(required=False,
       verbose_name='Destination URL', help_text='')

    view = ObjectIdField(required=True,
        verbose_name='Destination View', help_text='')

    created_by = ReferenceField(User, required=True,
        verbose_name='Created By', help_text='')

    created_at = DateTimeField(required=True, default=datetime.datetime.utcnow,
        verbose_name='Creation Time', help_text='')

    @property
    def label(self):
        return self.code


# TODO: move to a common utility module
def unambiguous_random_string(length):
    random = SystemRandom()
    ambiguous_chars = {
        'B', '8',
        'G', '6',
        'I', '1', 'l',
        '0', 'O', 'Q', 'D',
        'S', '5',
        'Z', '2'
    }
    choices = filter(lambda char: char not in ambiguous_chars,
                     string.digits + string.ascii_lowercase)

    return ''.join(random.choice(choices) for _ in xrange(length))
