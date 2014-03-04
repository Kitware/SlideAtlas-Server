__author__ = 'dhanannjay.deo'

i = open("c:\\Users\\dhanannjay.deo\\Downloads\\elephant.jpg","rb")

buf = i.read()
print ':'.join("%02X" % ord(buf[i])for i in range(len(buf)))
