import numpy as np
import cv2

import matplotlib
# matplotlib.rcParams['backend'] = "GTKAgg"

# import matplotlib.mlab as mlab
import matplotlib.pyplot as plt
import cStringIO as StringIO

"""
This plugin also expects a javascript object pluginScarRatio.js to be loaded on the client side.
"""


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

        return bufs


def test_buffer_write():
    inp = cv2.imread("/home/dhan/Downloads/pycharm.png")
    out = hsv_threshold_image(inp, hmin=35)
    status, image = cv2.imencode(".png", out)
    fout = open("mask.png", "wb")
    fout.write(image.tostring())


def test_transparency():

    inp = cv2.imread("./temp/in.png")

    hmax = 360 / 2
    hmin = 54 / 2
    smax = 256
    smin = 0
    vmax = 256
    vmin = 0

    # Perform thresholding
    out = cv2.inRange(inp, np.array([hmin, smin, vmin]), np.array([hmax, smax, vmax]))
    cv2.imwrite("result.png", out)


def hsv_threshold_image(hsv_image, hmin=0, hmax=360, smin=0, smax=256, vmin=0, vmax=256):
    return cv2.inRange(hsv_image, np.array([hmin, smin, vmin]), np.array([hmax, smax, vmax]))

if __name__ == '__main__':
    test_transparency()
