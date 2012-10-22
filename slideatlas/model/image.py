from  mongokit import Document, IS
from bson import Binary

class StartupView(Document):
    structure = {
        'zoom' : int,
        'center' : float,
        'rotation' : float
        }
    required_fields = ['zoom', 'center', 'rotation']


class Annotation(Document):
    structure = {
        'type' : basestring,
        'displayname' : basestring,
        'color' : basestring,
        'points' : [int]
        }
    required_fields = [ 'type' , 'displayname' , 'color', 'points' ]

class PointerAnnotation(Annotation):
    structure = {'type' : IS(u'pointer')}


class CircleAnnotation(Annotation):
    structure = {
        'type' :  IS(u'circle'),
        'radius' : int
        }
    required_fields = ['radius']

class Bookmark(Document):
    structure = {
        'title' : basestring,
        'details' : basestring,
        'center' : [int],
        'lens' : float,
        'zoom' : int,
        'annotation' : Annotation
        }

    required_fields = ['title', 'details', 'center', 'lens', 'annotation']


class Image(Document):
    use_schemaless = True
    structure = {
        'name' : basestring,
        'filename' : basestring,
        'label' : basestring,
        'hide':bool, # Optional
        'origin' : [float],
        'dimension' : [int],
        'spacing' : [float],
        'thumb' : Binary,
        'startup_view' : StartupView,
        'bookmarks' : [Bookmark] # Not required, but mongoengine won't allow a "required" ListField to be an empty list
         }

#    required_fields = ['filename', 'label', 'origin', 'dimension', 'spacing']
    required_fields = ['filename']


