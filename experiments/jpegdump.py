__author__ = 'dhanannjay.deo'

#i = open("c:\\Users\\dhanannjay.deo\\Downloads\\elephant.jpg","rb")
i = open("c:\\Users\\dhanannjay.deo\\Downloads\\tile.jpg","rb")
i2 = open("output_27372.jpg","rb")
buf = i.read()
print ':'.join("%02X" % ord(buf[i])for i in range(len(buf)))
buf = i2.read()
print ':'.join("%02X" % ord(buf[i])for i in range(len(buf)))
