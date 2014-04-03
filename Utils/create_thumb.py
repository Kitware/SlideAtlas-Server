import StringIO

import bson
import wx

def CreateJpegThumb(binary_jpeg_image, channel_threshold=245):
    if not isinstance(binary_jpeg_image, bson.binary.Binary):
        raise Exception("<input_image> argument must be a BSON binary object")

    wx_img_cropped = WxImageCropWhiteSpace(
        wx.ImageFromStream(StringIO.StringIO(str(binary_jpeg_image)), type = wx.BITMAP_TYPE_JPEG),
        channel_threshold)

    # re-center and pad the lesser dimension to make a square image
    if wx_img_cropped.GetWidth() < wx_img_cropped.GetHeight():
        new_width = int(256.0 * (float(wx_img_cropped.GetWidth()) / float(wx_img_cropped.GetHeight())))
        new_height = 256
        new_pos_x = (256 - new_width) / 2
        new_pos_y = 0
    else:
        new_width = 256
        new_height = int(256.0 * (float(wx_img_cropped.GetHeight()) / float(wx_img_cropped.GetWidth())))
        new_pos_x = 0
        new_pos_y = (256 - new_height) / 2
    wx_img_cropped.Rescale(new_width, new_height, wx.IMAGE_QUALITY_HIGH)
    wx_img_cropped = wx_img_cropped.Size((256, 256), (new_pos_x, new_pos_y), 255, 255, 255)

    output_stream = StringIO.StringIO()
    wx_img_cropped.SaveStream(output_stream, wx.BITMAP_TYPE_JPEG)
    return bson.binary.Binary(output_stream.getvalue())


def WxImageCropWhiteSpace(input_image, channel_threshold=245):
    if not isinstance(input_image, wx.Image):
        raise Exception("<input_image> argument must be a wx.Image")

    if not isinstance(channel_threshold, int):
        raise Exception("<channel_threshold> argument must be an int")

    im_height = input_image.GetHeight()
    im_width = input_image.GetWidth()
    clip_rect = wx.Rect(width=im_width, height=im_height)

    class Found(Exception): pass

    def underThreshold(x, y):
        return input_image.GetRed(x, y) < channel_threshold or input_image.GetGreen(x, y) < channel_threshold or input_image.GetBlue(x, y) < channel_threshold

    # top
    try:
        for y in range(im_height):
            for x in range(im_width):
                if underThreshold(x, y):
                    clip_rect.SetTop(max(y - 1, 0))
                    raise Found
    except Found:
        pass

    # bottom
    try:
        for y in reversed(range(im_height)):
            for x in range(im_width):
                if underThreshold(x, y):
                    clip_rect.SetBottom(min(y + 1, im_height - 1))
                    raise Found
    except Found:
        pass

    # left
    try:
        for x in range(im_width):
            for y in range(im_height):
                if underThreshold(x, y):
                    clip_rect.SetLeft(max(x - 1, 0))
                    raise Found
    except Found:
        pass

    # right
    try:
        for x in reversed(range(im_width)):
            for y in range(im_height):
                if underThreshold(x, y):
                    clip_rect.SetRight(min(x + 1, im_width - 1))
                    raise Found
    except Found:
        pass

    return input_image.GetSubImage(clip_rect)
