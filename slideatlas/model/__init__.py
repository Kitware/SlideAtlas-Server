from image import  *
from session import *
from rule import *
from user import *
from database import *
#from attachments import *

# Verify access previledges
SEE_SESSION = 1
ADMIN_SESSION = 2
ADMIN_DB = 3
ADMIN_SITE = 4
# Define some utility functions 
def VerifySessionAccess(what, db=None, sessid=None):
    return True

