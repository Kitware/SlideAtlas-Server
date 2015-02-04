# Basic routines to display numpy array as image
from ipython_slideatlas import *
import cv2
import numpy as np


def gamma_correction(img, correction):
    img = img/255.0
    img = cv2.pow(img, correction)
    return np.uint8(img*255)


def analyze_orientations(inp=None, scale=15, delta=0, kernel_size=5, blur=True, blur_scale=5):
    """
    @param: inp Input image. If supplied must be a PIL Image, else tries to load a default  
    @param: scale Scale for Sobel filter (default 15)
    @param: delta Delta for Sobel filter (default 0)
    @param: kernel_size Kernel size for Sobel filter (default 5)
    @param: blur Whether to perform optional Gaussian bluring of the input image before processing (default True)
    @param: blur_scale Scale for blurring if blurring is enabled (default 5)
    """
    # Convert incoming PIL image to opencv image
    if inp is None:
        inp = cv2.imread('/home/dhan/Downloads/muscle_matrix.png')
    else:
        inp = np.array(inp)

    assert inp is not None

    # Data type
    ddepth = cv2.CV_16S

    # Blur the image if requested
    if blur:
        img = cv2.GaussianBlur(inp,(blur_scale,blur_scale),0)
    else:
        img = inp

    # Convert to gray
    gray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)

    # Gradient-X
    grad_x = cv2.Sobel(gray,ddepth,1,0,ksize = kernel_size, scale = scale, delta = delta,borderType = cv2.BORDER_DEFAULT)
    grad_x = grad_x.astype(np.float32)

    # Gradient-Y
    grad_y = cv2.Sobel(gray,ddepth,0,1,ksize = kernel_size, scale = scale, delta = delta, borderType = cv2.BORDER_DEFAULT)
    grad_y = grad_y.astype(np.float32)

    # This is the directionality data
    data = np.sqrt(grad_x * grad_x + grad_y * grad_y)

    # Magnitude of orientation
    rescaled = (255.0 / data.max() * (data - data.min()))
    value = rescaled

    # angle determines the color
    orientation = np.arctan(grad_x, grad_y)
    hue = (128.0 / orientation.max() * (orientation - orientation.min()))

    # Generally saturated colors
    saturation = np.full(hue.shape, 230)

    # Compose image for display
    img1 = np.dstack((hue,saturation, value))
    img2 = img1.astype(np.uint8)
    img3 = cv2.cvtColor(img2, cv2.COLOR_HSV2RGB)

    display_img_array(img3)
    display_img_array(inp)
    if blur:
        display_img_array(img)

    display_img_array(rescaled)
