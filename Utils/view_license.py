
import pickle
import sys
import base64

# Create a file
file = open(sys.argv[1])
print pickle.loads(base64.b64decode(file.read()))

print "Done"
