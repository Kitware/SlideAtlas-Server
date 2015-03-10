# coding=utf-8

from bson import ObjectId

from mongoengine import Q, EmbeddedDocument, BooleanField, DictField, \
    EmbeddedDocumentField, GenericEmbeddedDocumentField, FloatField, IntField, \
    ListField, ObjectIdField, ReferenceField, StringField
from mongoengine.errors import NotRegistered

from .common import ModelDocument, Operation, ResourceType, AdminSitePermission
from .common.model_document import ModelQuerySet
from .image_store import ImageStore
from .collection import Collection

import gridfs

################################################################################
__all__ = ('Session', 'RefItem')


################################################################################
class Annotation(EmbeddedDocument):
    meta = {
        'abstract': True,
        'allow_inheritance': True,
        }


class CircleAnnotation(Annotation):
    type = StringField(required=True, default='circle', choices=('circle',))

    origin = ListField(FloatField(), required=False)
    line_width = FloatField(required=False, db_field='linewidth')
    outline_color = ListField(FloatField(), required=False, db_field='outlinecolor') # TODO: convert int fields to float in database
    radius = FloatField(required=False)


class PolylineAnnotation(Annotation):
    type = StringField(required=True, default='polyline', choices=('polyline',))

    closed_loop = BooleanField(required=False, db_field='closedline')
    line_width = FloatField(required=False, db_field='linewidth')
    outline_color = ListField(FloatField(), required=False, db_field='outlinecolor') # TODO: convert int fields to float in database
    points = ListField(ListField(FloatField(), required=True), required=False)


class TextAnnotation(Annotation):
    type = StringField(required=True, default='text', choices=('text',))

    anchor_visibility = BooleanField(required=False, db_field='anchorVisibility')
    color = ListField(FloatField(), required=False) # TODO: convert int fields to float in database
    offset = ListField(IntField(), required=False) # TODO: make float?
    position = ListField(FloatField(), required=False) # TODO: position[2] == 'null' in some instances in database
    size = IntField(required=False) # TODO: make float?
    string = StringField(required=False)


class EmbeddedAnnotationField(GenericEmbeddedDocumentField):
    type_map = {
        'circle': CircleAnnotation,
        'polyline': PolylineAnnotation,
        'text': TextAnnotation,
    }

    def __init__(self, *args, **kwargs):
        super(EmbeddedAnnotationField, self).__init__(
            choices=tuple(self.type_map.itervalues()),
            *args, **kwargs)

    def to_python(self, value):
        try:
            value = super(EmbeddedAnnotationField, self).to_python(value)
        except KeyError:
            try:
                doc_cls = self.type_map[value['type']]
                value = doc_cls._from_son(value)
            except KeyError:
                raise NotRegistered()
        return value


class AnnotationRef(EmbeddedDocument):
    annotations = ListField(EmbeddedAnnotationField(), required=False)
    view = ObjectIdField(required=True)


################################################################################
class Transformation(EmbeddedDocument):

    class Correlation(EmbeddedDocument):
        point0 = ListField(FloatField(), required=True)
        point1 = ListField(FloatField(), required=True)

    correlations = ListField(EmbeddedDocumentField(Correlation), required=False, db_field='Correlations',
        verbose_name='', help_text='')

    delta_rotation = FloatField(required=False, db_field='DeltaRotation',
        verbose_name='', help_text='')

    view0 = ObjectIdField(required=False, db_field='View0',
        verbose_name='', help_text='')

    view1 = ObjectIdField(required=False, db_field='View1',
        verbose_name='', help_text='')


################################################################################
class RefItem(EmbeddedDocument):
    meta = {
        'allow_inheritance': False
    }
    ref = ObjectIdField(required=True)
    db = ObjectIdField(required=False)

    def __eq__(self, other):
        if isinstance(other, ObjectId):
            return self.ref == other
        return super(RefItem, self).__eq__(other)

    def __ne__(self, other):
        return not self.__eq__(other)


class RefListField(ListField):

    def __init__(self, **kwargs):
        #field = ReferenceField(document_type, dbref=False)
        field = EmbeddedDocumentField(RefItem)
        super(RefListField, self).__init__(field, **kwargs)


    def to_mongo(self, value):
        value = super(RefListField, self).to_mongo(value)
        for pos, item in enumerate(value):
            item['pos'] = pos
        return value


    def to_python(self, value):
        try:
            value = sorted(value, key=lambda item: item.pop('pos'))
        except (TypeError, KeyError):
            pass
        return super(RefListField, self).to_python(value)


################################################################################
class SessionQuerySet(ModelQuerySet):
    def can_access(self, permissions_set, required_operation=Operation.view, strict_operation=False):
        """
        :param permissions_set: A set of Permission objects to filter the session query by.
        :type permissions_set: set of [common.Permission]

        :param required_operation: The minimum operation allowed on the sessions.
        :type required_operation: common.Operation

        :param strict_operation: Make 'required_operation' strictly refer to an operation type, instead of a minimum.
        :type strict_operation: bool

        :rtype: SessionQuerySet
        """
        if not isinstance(permissions_set, set):
            raise ValueError('permissions_set must be a set of Permissions')
        queryset = self.clone()
        if AdminSitePermission() in permissions_set and \
           ((not strict_operation) or (required_operation == Operation.admin)):
            return queryset.all()
        else:
            query_collections = set()
            query_sessions = set()
            for permission in permissions_set:
                if permission.operation >= required_operation:
                    if permission.resource_type == ResourceType.collection:
                        query_collections.add(permission.resource_id)
                    elif permission.resource_type == ResourceType.session:
                        query_sessions.add(permission.resource_id)
            query = Q(collection__in=list(query_collections)) | \
                    Q(id__in=list(query_sessions))
            return queryset.filter(query)


################################################################################
class Session(ModelDocument):
    meta = {
        'db_alias': 'admin_db',
        'collection': 'sessions',
        'queryset_class': SessionQuerySet,
        'indexes': [
            {
                'fields': ('collection',),
                'cls': False,
                'unique': False,
                'sparse': False,
            },
        ]
    }

    collection = ReferenceField(Collection, required=True,
        verbose_name='Collection', help_text='')

    # TODO: remove 'image_store', access it indirectly via 'collection'
    image_store = ReferenceField(ImageStore, required=False,
        verbose_name='Image Store', help_text='')

    label = StringField(required=True,
        verbose_name='Label', help_text='The sessions\'s label.')

    views = ListField(ObjectIdField(), required=False,
        verbose_name='Views', help_text='')

    attachments = RefListField(required=False,
        verbose_name='Attachments', help_text='')

    imagefiles = RefListField(required=False,
        verbose_name='Image Files', help_text='')

    annotations = ListField(DictField(), required=False,
        verbose_name='', help_text='')

    hide_annotations = BooleanField(required=False, db_field='hideAnnotations',
        verbose_name='', help_text='')

    # TODO: discuss this
    # some 'sessions' collections may contain a 'users' field; current values are:
    #   'all_bev1_admin', 'all_wusm_admin', 'brown_demo_admin'
    # what is the purpose of this?
    # user = StringField


# class StackSession(Session):
#     """
#     There's currently only 1 document of this type, in the '3dpath' database
#     """

    type = StringField(required=False, choices=('stack', 'session'),
        verbose_name='Type', help_text='')

    # TODO: this should be a 'ListField(EmbeddedDocumentField(Transformation), ..'
    transformations = ListField(DictField(), required=False,
        verbose_name='', help_text='')

    def _get_datadb(self, restype, ref_id):
        # find the requested attachment in the session

        if not restype in ["attachments", "imagefiles"]:
            # Unknown restype
            raise NotImplemented()

        # Verify that the reference indeed exists in the session
        for attachment_ref in (self.attachments + self.imagefiles):
            if attachment_ref.ref == ref_id:
                break
        else:
            raise Exception("The requested " + restype + " was not found in the requested session.")

        image_store = ImageStore.objects.get(id=attachment_ref.db)
        return image_store.to_pymongo(raw_object=True)

    def _fetch_attachment(self, restype, attachment_id):
        # find the requested attachment in the session
        # for attachment_ref in session.attachments:
        #     if attachment_ref.ref == attachment_id:
        #         break
        # else:
        #     raise Exception('The requested attachment was not found in the requested session.')

        # # use 'get' instead of 'with_id', so an exception will be thrown if not found
        # image_store = models.ImageStore.objects.get(id=attachment_ref.db)
        res_image_store = self._get_datadb(restype, attachment_id)
        attachments_fs = gridfs.GridFS(res_image_store, restype)
        try:
            attachment = attachments_fs.get(attachment_id)
        except gridfs.NoFile:
            raise Exception('The requested attachment was not found in the requested session\'s image store.')

        return res_image_store, attachments_fs, attachment

    def get_imagefiles(self):
            results = []
            for animagefile in self.imagefiles:
                data_db = self._get_datadb("imagefiles", animagefile.ref)
                file_gridfs_obj = data_db["imagefiles.files"].find_one({"_id": animagefile.ref})
                if "metadata" in file_gridfs_obj:
                    results.append({"id": animagefile.ref, "db": animagefile.db, "name": file_gridfs_obj["filename"], "metadata": file_gridfs_obj["metadata"]})

            return results
