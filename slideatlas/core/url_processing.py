# coding=utf-8

from bson import ObjectId
from bson.errors import InvalidId
from werkzeug.routing import BaseConverter, ValidationError

from slideatlas import models

################################################################################
__all__ =('add_url_converters', 'add_url_value_preprocessors')


################################################################################
def add_url_converters(app):
    app.url_map.converters['regex'] = RegexConverter
    app.url_map.converters['object_id'] = ObjectIdConverter

    app.url_map.converters.update({
        'ObjectId': ObjectIdConverter,
        'User': model_document_converter_factory(models.User),
        'GroupRole': model_document_converter_factory(models.GroupRole),
        'Organization': model_document_converter_factory(models.Organization),
        'Session': model_document_converter_factory(models.Session),
        'ImageStore': model_document_converter_factory(models.ImageStore),
        'View': model_document_converter_factory(models.View),
        'Image': model_document_converter_factory(models.Image),
        })


################################################################################
def add_url_value_preprocessors(app):
    app.url_value_preprocessor(get_models_in_url)


################################################################################
class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


################################################################################
class ObjectIdConverter(BaseConverter):
    """
    Converter to match and convert ObjectId strings in URLs.
    """
    def to_python(self, value):
        try:
            return ObjectId(value)
        except InvalidId:
            raise ValidationError()

    def to_url(self, value):
        return str(value)


################################################################################
class ModelDocumentConverter(BaseConverter):
    """
    Abstract converter to handle ModelDocument URL parameters.
    """
    model_cls = None

    def __init__(self, map):
        super(ModelDocumentConverter, self).__init__(map)

    def to_python(self, value):
        """
        Converts an an ObjectId string to a (ObjectId, ModelDocument class) tuple.

        The ModelDocument will not be instantiated here; that will be done in the
        url_value_preprocessor.
        """
        try:
            return (ObjectId(value), self.model_cls)
        except InvalidId:
            raise ValidationError()

    def to_url(self, value):
        """
        Converts a ModelDocument instance to a ObjectId string.
        """
        return str(value.id)


def model_document_converter_factory(new_model_cls):
    class NewModelDocumentConverter(ModelDocumentConverter):
        model_cls = new_model_cls
    return NewModelDocumentConverter


################################################################################
def get_models_in_url(endpoint, values):
    """
    A URL value preprocessor that replaces the output of ModelDocumentConverters
    with the model object that they reference.

    Raises a 404 error if the model object cannot be found.
    """
    if values:

        image_store_obj = None
        multiple_database_values = dict()
        for value_name, value in values.iteritems():
            if isinstance(value, tuple) and (len(value) == 2):
                object_id, model_cls = value
                if issubclass(model_cls, models.common.ModelDocument):
                    # cannot retrieve MultipleDatabaseModelDocument types until the database is known
                    if not issubclass(model_cls, models.common.MultipleDatabaseModelDocument):
                        values[value_name] = model_cls.objects.get_or_404(id=object_id)
                        if issubclass(model_cls, models.ImageStore):
                            if image_store_obj is not None:
                                pass  # TODO: error, multiple ImageStore-type values
                            image_store_obj = values[value_name]
                    else:
                        # so defer MultipleDatabaseModelDocument types now
                        multiple_database_values[value_name] = value

        if multiple_database_values:
            if not image_store_obj:
                pass  # TODO: error, MultipleDatabaseModelDocument passed without ImageStore
            with image_store_obj:
                for value_name, (object_id, model_cls) in multiple_database_values.iteritems():
                    values[value_name] = model_cls.objects.get_or_404(id=object_id)
