Plugins
=======

Slideatlas plugins are like flask extensions that are optionally loaded with gl-viewer

During startup
--------------

- Plugins are enabled through site_slideatlas configuration file
- If enabled

    - Load the javascript for the plugins
    - Insert the menu which activates the plugin
    - Register that blue print, which loads corresponding app endpoints


Measurement of scar ratio
-------------------------

Allows interactive threshoding in HSV space, followed by sample morphological operations, each time counting the selected pixels.

Dependence on python modules opencv2 and matplotlib.

OpenCV does not build and install with pip. Hence the suggest procedure right now is -

- Install numpy and matplotlib using pip (this might also need some dependencies globally installed)

- Build opencv from git repository manually and install globally. Copy cv2.so from the built binaries to virtualenbv/lib/python2.7 and everything works as expected








