import numpy as np
import cv2

import matplotlib
matplotlib.rcParams['backend'] = "GTKAgg"

# import matplotlib.mlab as mlab
import matplotlib.pyplot as plt
import cStringIO as StringIO
import pdb

def normalize(v):
    norm = np.linalg.norm(v)
    if norm == 0:
        return v

    return v / norm


def get_hsv_histograms(hsv_image):
    for a in range(3):
        hist = cv2.calcHist([hsv_image], [a], None, [256], [0, 256])
        plt.plot(hist)
        plt.xlim([0, 256])
    plt.show()


def get_hsv_histograms_2(hsv_image, output_format="svg"):
        # Input image is three channels
        bufs = [StringIO.StringIO() for i in range(3)]

        h = hsv_image[..., 0].flatten()
        n_bins = 360
        hist, edges = np.histogram(h, n_bins)
        fig = plt.figure(figsize=(8, 2.5))
        ax = fig.add_subplot(111)
        hist = normalize(hist.flatten())
        edges = edges.flatten() * 2
        colors = [matplotlib.colors.hsv_to_rgb([i / float(n_bins), 1., 1.]) for i in range(n_bins-1)]
        ax.bar(edges[range(len(hist))], hist, width=2.0, color=colors, edgecolor="none", linewidth=0)

        bincenters = 0.5*(edges[1:] + edges[:-1])
        bincenters_filtered = bincenters[hist > 0.]
        hist_filtered = hist[hist > 0.]
        ax.plot(bincenters_filtered, hist_filtered, lw=1., color='black')
        fig.savefig(bufs[0], format=output_format, transparent=True)

        s = hsv_image[..., 1].flatten()
        n_bins = 256
        hist, edges = np.histogram(s, n_bins)
        fig = plt.figure(figsize=(8, 2.5))
        ax = fig.add_subplot(111)
        hist = normalize(hist.flatten())
        edges = edges.flatten()
        colors = [matplotlib.colors.hsv_to_rgb([1., i / float(n_bins), 1.]) for i in range(n_bins-1)]
        ax.bar(edges[range(len(hist))], hist, width=1.0, color=colors, edgecolor="none", linewidth=0)
        plt.xlim(xmax=n_bins)
        bincenters = 0.5*(edges[1:] + edges[:-1])
        ax.plot(bincenters, hist, lw=1., color='black')
        fig.savefig(bufs[1], format=output_format, transparent=True)

        v = hsv_image[..., 2].flatten()
        n_bins = 256
        hist, edges = np.histogram(v, n_bins)
        fig = plt.figure(figsize=(8, 2.5))
        ax = fig.add_subplot(111)
        hist = normalize(hist.flatten())
        edges = edges.flatten()
        colors = [matplotlib.colors.hsv_to_rgb([1., 0., i / float(n_bins)]) for i in range(n_bins-1)]
        ax.bar(edges[range(len(hist))], hist, width=1.5, color=colors, edgecolor="none", linewidth=0)
        plt.xlim(xmax=n_bins)
        bincenters = 0.5*(edges[1:] + edges[:-1])
        bincenters_filtered = bincenters[hist > 0.]
        hist_filtered = hist[hist > 0.]
        ax.plot(bincenters_filtered, hist_filtered, lw=1., color='black')
        fig.savefig(bufs[2], format=output_format, transparent=True)

        # fig = plt.figure()
        # ax = plt.subplot(111)
        # ax.hist(hsv_image[..., 1].flatten(), 256, range=(0, 255), fc='g', edgecolor="none")
        # fig.savefig(bufs[1], format="svg")

        # fig = plt.figure()
        # ax = plt.subplot(111)
        # ax.hist(hsv_image[..., 2].flatten(), 256, range=(0, 255), fc='g', edgecolor="none")
        # fig.savefig(bufs[2], format="svg")

        # plt.show()
        return bufs

inp = cv2.imread("/home/dhan/Downloads/download.png")
# inp = cv2.imread("/home/dhan/Downloads/red_leaf.jpg")
# cv2.imwrite('one.png', inp[..., 0])
# cv2.imwrite('two.png', inp[..., 1])
# cv2.imwrite('three.png', inp[..., 2])
output_format = "svg"
hsv = cv2.cvtColor(inp, cv2.COLOR_BGR2HSV)
hist_images = get_hsv_histograms_2(hsv, output_format=output_format)

for buf, filename in zip(hist_images, ["hue", "saturation", "value"]):
    fout = open(filename + "." + output_format, "w")
    fout.write(buf.getvalue())
    fout.close()
    buf.close()

# cv2.imshow("Input", input)
# cv2.waitKey(0)

# # Convert BGR to HSV
# lower = np.array([110, 50, 50])
# upper = np.array([130, 255, 255])

# mask = cv2.inRange(hsv, lower, upper)

# cv2.imshow("mask", mask)

# cv2.waitKey(0)
