import Image
import ImageChops
import ImageStat
import sys
import hashlib

def sameimage(path_im1, path_im2, threshold=30):
    """
    both inputs should be strings paths to the images
    returns a numerical value comparing the images
    """

    # Open the images
    im1 = Image.open(path_im1)
    im2 = Image.open(path_im2)

    # Find the difference image
    diff = ImageChops.difference(im2, im1)

    # Compute the magnitude of the difference
    stat = ImageStat.Stat(diff)
    rms = sum(stat.rms)
    print "ImageDiff = ", rms
    # Compare the difference with the threshold
    if rms < threshold:
        return True
    else:
        return False

def md5_file(path, block_size=2 ** 20):
    md5 = hashlib.md5()
    f = open(path, "rb")

    # Update the md5 in blocks read from file
    while True:
        data = f.read(block_size)
        if not data:
            break
        md5.update(data)
    return md5.hexdigest()

def samefile(path1, path2):
    """
    Checks the file by size first and if same then by md5
    """
    md5_1 = md5_file(path1)
    md5_2 = md5_file(path2)
    print "md5 =", md5_1

    # Return whether the md5's match 
    return md5_1 == md5_2
