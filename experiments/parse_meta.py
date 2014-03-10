__author__ = 'dhanannjay.deo'

from xml.etree import cElementTree as ET


# Find DataObject who has a child with Name PIIM_PIXEL_DATA_REPRESENTATION_NUMBER
# and value 0 (Given)

levels = {}
a = ET.parse("meta.xml")
for b in a.findall(".//DataObject[@ObjectType='PixelDataRepresentation']"):
    print ET.tostring(b)
    level = int(b.find(".//*[@Name='PIIM_PIXEL_DATA_REPRESENTATION_NUMBER']").text)
    columns = int(b.find(".//*[@Name='PIIM_PIXEL_DATA_REPRESENTATION_COLUMNS']").text)
    rows = int(b.find(".//*[@Name='PIIM_PIXEL_DATA_REPRESENTATION_ROWS']").text)
    levels[level] = [columns, rows]

rows = levels[0][1]
cols = levels[0][0]

for akey in levels.keys():
    alevel = levels[akey]
    print float(alevel[0])/ cols, float(alevel[1])/rows
    rows = alevel[1]
    cols = alevel[0]



#
#a = ET.parse("meta.xml")
#b = a.find(".//*[@Name='PIM_DP_IMAGE_COLUMNS']").text
#print b
#
#for b in a.iter("Attribute"):
#    if b.attrib["Name"] == "PIM_DP_IMAGE_COLUMNS":
#        print "Found Here", b.text
#

