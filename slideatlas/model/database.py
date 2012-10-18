import mongokit

class Database(mongokit.Document):
    structure = {
        'label' : basestring,
        'host' : basestring,
        'dbname' : basestring,
        'copyright' : basestring
        }

    required_fields = [     'label' , 'host', 'dbname', 'copyright']

