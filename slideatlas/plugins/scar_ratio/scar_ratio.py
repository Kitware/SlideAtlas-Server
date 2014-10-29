import flask
import numpy as np
import cv2
import re
import matplotlib
# matplotlib.rcParams['backend'] = "GTKAgg"

# import matplotlib.mlab as mlab
import matplotlib.pyplot as plt
import cStringIO as StringIO

import base64
dataUrlPattern = re.compile('data:image/(png|jpeg);base64,(.*)$')

"""
This plugin also includes a javascript object pluginScarRatio.js to be loaded on the client side.
"""


# Create a blueprint
mod = flask.Blueprint('ScarRatio', __name__, static_folder='static', url_prefix="/scar_ratio")


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


@mod.route('/get_image_histograms', methods=['POST'])
def get_image_histograms():
    img = flask.request.form.get('img')
    imgb64 = dataUrlPattern.match(img).group(2)
    if imgb64 is not None and len(imgb64) > 0:
        imgbin = base64.b64decode(imgb64)
        # # For debugging
        # fout = open("try.jpg", "wb")
        # fout.write(imgbin)
        # fout.close()
        img_array = np.asarray(bytearray(imgbin), dtype=np.uint8)
        inp = cv2.imdecode(img_array, 1)

        cv2.imwrite("test.png", inp)
        output_format = "png"
        hsv = cv2.cvtColor(inp, cv2.COLOR_BGR2HSV)
        hist_images = get_hsv_histograms_2(hsv, output_format=output_format)

        result = {}

        for buf, filename in zip(hist_images, ["hue", "saturation", "value"]):
            result[filename] = base64.b64encode(buf.getvalue())
            buf.close()

        return flask.jsonify(result)
    else:
        return flask.Response("Error")


@mod.route('/hsv_threshold', methods=['POST'])
@mod.route('/get_mask', methods=['POST'])
def hsv_threshold():
    img = flask.request.form.get('img', '')

    hmin = int(flask.request.form.get('hmin', '0')) / 2
    smin = int(flask.request.form.get('smin', '0'))
    vmin = int(flask.request.form.get('vmin', '0'))

    hmax = int(flask.request.form.get('hmax', '360')) / 2
    smax = int(flask.request.form.get('smax', '256'))
    vmax = int(flask.request.form.get('vmax', '256'))

    try:
        imgb64 = dataUrlPattern.match(img).group(2)

        if imgb64 is not None and len(imgb64) > 0:
            # Get input image
            imgbin = base64.b64decode(imgb64)
            img_array = np.asarray(bytearray(imgbin), dtype=np.uint8)
            inp = cv2.imdecode(img_array, 1)

            # Perform thresholding
            out = cv2.inRange(inp, np.array([hmin, smin, vmin]), np.array([hmax, smax, vmax]))
            status, image = cv2.imencode(".png", out)

            # Send the results back
            result = {}
            result["mask"] = base64.b64encode(image.tostring())
            return flask.jsonify(result)
    except Exception as e:
        return flask.Response("Error: " + e.message)

if __name__ == '__main__':
    test_transparency()
