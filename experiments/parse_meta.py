__author__ = 'dhanannjay.deo'

from xml.etree import cElementTree as ET


a = ET.parse("meta.xml")
b = a.find(".//*[@Name='PIM_DP_IMAGE_COLUMNS']").text
print b

for b in a.iter("Attribute"):
    if b.attrib["Name"] == "PIM_DP_IMAGE_COLUMNS":
        print "Found Here", b.text


