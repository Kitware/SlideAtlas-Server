
import mongoengine

from database import *
from rule import *
from user import *
from session import *
from attachment import *
from image import *

#__all__ = ['database', 'rule', 'user', 'session', 'attachment', 'image']

def init_admin_db(host, db_name):
    mongoengine.register_connection('admin', db_name, host=host)

def set_data_db(data_db):
    if not isinstance(data_db, Database):
        raise Exception()
    mongoengine.register_connection('data', data_db.dbname, host=data_db.host)
