# coding=utf-8

from bson.son import SON
from mongoengine import queryset_manager, DoesNotExist, MultipleObjectsReturned

###############################################################################
__all__ = ()


################################################################################
class ToSonDocumentMixin(object):
    def to_son(self, include_empty=True, exclude_fields=None, only_fields=None):
        """
        Return as a SON object.

        The content is identical to the result of 'to_mongo', except that empty
        fields are included and fields use their model names, instead of
        database names (e.g. '_id' -> 'id').

        Optionally, if include_empty is True (as it is by default), empty fields
        are included.

        Optionally, either of 'exclude_fields' or 'only_fields' (but not both)
        may be specified, containing an iterable of field names to explicitly
        include or exclude from the result. The 'id' field is always included.
        """
        if exclude_fields and only_fields:
            raise Exception()

        # TODO: convert reference fields as {'id':.., 'label':..}

        # SON is ordered, so we must build a new one to change keys
        reverse_db_field_map = dict(self._reverse_db_field_map)
        reverse_db_field_map['_cls'] = 'type'
        son = SON( (reverse_db_field_map[mongo_field], value)
                   for (mongo_field, value)
                   in self.to_mongo().iteritems() )

        if include_empty:
            # 'to_mongo' omits empty fields
            for field_name in self:
                son.setdefault(field_name, None)

        if exclude_fields:
            for field in exclude_fields:
                if field != 'id':
                    # use 'pop', in case 'include_empty' is False and the field doesn't exist
                    son.pop(field, None)
        elif only_fields:
            only_fields = set(only_fields)
            only_fields.add('id')  # always include 'id'
            for field in son.iterkeys():
                if field not in only_fields:
                    del son[field]

        return son


################################################################################
class SingletonDocumentMixin(object):
    @queryset_manager
    def get(doc_cls, queryset):
        try:
            return queryset.get()
        except DoesNotExist:
            new_doc = doc_cls()
            new_doc.save()
            return new_doc
        except MultipleObjectsReturned:
            raise
