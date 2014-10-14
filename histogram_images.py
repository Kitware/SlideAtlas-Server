import numpy as np
import cv2

import matplotlib
matplotlib.rcParams['backend'] = "GTKAgg"

# import matplotlib.mlab as mlab
import matplotlib.pyplot as plt
import matplotlib.cm as cm



def get_hsv_histograms(hsv_image):
    for a in range(3):
        hist = cv2.calcHist([hsv_image], [a], None, [256], [0, 256])
        plt.plot(hist)
        plt.xlim([0, 256])
    plt.show()


def get_hsv_histograms_2(hsv_image):
        # Input image is three channels
        h = hsv_image[..., 0].flatten()
        h = h * (255.0 / 179)
        # print max(h)
        # print len(h)

        n_bins = 256

        hist, edges = np.histogram(h, n_bins)
        fig = plt.figure()
        ax = plt.subplot(111)
        hist = hist.flatten()
        edges = edges.flatten()
        colors = [matplotlib.colors.hsv_to_rgb([i / float(n_bins), 1., 1.]) for i in range(n_bins-1)]
        ax.bar(edges[range(len(hist))], hist, color=colors)
        # plt.hist(h, n_bins, range=(0, 360), color=colors)


        # fig.add_subplot(312)
        # plt.hist(hsv_image[..., 1].flatten(), 256, range=(0, 255), fc='g')
        # fig.add_subplot(313)
        # plt.hist(hsv_image[..., 2].flatten(), 256, range=(0, 255), fc='r')
        plt.show()

inp = cv2.imread("/home/dhan/Downloads/download.png")
# inp = cv2.imread("/home/dhan/Downloads/red_leaf.jpg")
# cv2.imwrite('one.png', inp[..., 0])
# cv2.imwrite('two.png', inp[..., 1])
# cv2.imwrite('three.png', inp[..., 2])
hsv = cv2.cvtColor(inp, cv2.COLOR_BGR2HSV)
hist_images = get_hsv_histograms_2(hsv)

# cv2.imshow("Input", input)
# cv2.waitKey(0)

# # Convert BGR to HSV
# lower = np.array([110, 50, 50])
# upper = np.array([130, 255, 255])

# mask = cv2.inRange(hsv, lower, upper)

# cv2.imshow("mask", mask)

# cv2.waitKey(0)
