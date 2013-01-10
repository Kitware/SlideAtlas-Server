import Image
import ImageChops
import ImageStat
import sys

def imagecompare(path_im1, path_im2):
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
    return sum(stat.rms)

if __name__ == "__main__":
    if len(sys.argv) < 3:
           print "Usage: python imagecompare.py image1 image2"

    print "Image Match (0 is best): ", imagecompare(sys.argv[1], sys.argv[2])

