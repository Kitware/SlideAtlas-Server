import mongokit

class Database(mongokit.Document):
    structure = {
        'label' : basestring,
        'host' : basestring,
        'dbname' : basestring,
        'copyright' : basestring
        }

    required_fields = [ 'label' , 'host', 'dbname']
    default_values = {'copyright': 'Copyright &copy 2013, All rights reserved.',
                                   'host' : '127.0.0.1:27017'}
