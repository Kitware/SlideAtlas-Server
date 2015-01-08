# For displaying PIL images directly
from io import BytesIO

from IPython.core import display
from PIL import Image

def display_pil_image(im):
   """Displayhook function for PIL Images, rendered as PNG."""

   b = BytesIO()
   im.save(b, format='png')
   data = b.getvalue()

   ip_img = display.Image(data=data, format='png', embed=True)
   return ip_img._repr_png_()

# register display func with PNG formatter:
png_formatter = get_ipython().display_formatter.formatters['image/png']
dpi = png_formatter.for_type(Image.Image, display_pil_image)

# For getting image data from javascript
from datauri import DataURI
from PIL import Image
from cStringIO import StringIO

def image_from_datauri(data):
    print "Something exciting"
    return Image.open(StringIO(DataURI(data).data))

def pingpong(data):
    out = "Something exciting: " + str(data)
    print out
    return out


# Creating interactive slideatlas view
from IPython.display import HTML
import time

def slideatlas_load(slideatlas_domain="http://localhost:8080/"):

    slideatlas_view = slideatlas_domain + "webgl-viewer?db=5074589302e31023d4292d97&view=50763fab02e310163cbd059f"
    slideatlas_iframe = '<iframe id="guest1" name="guest1" src="' + slideatlas_view + '" width=1024 height=768></iframe>'
    button = '<button onclick="postRequest()"> Update current view </Button><br>'
    javascript = """
    <script type="text/Javascript">
        console.log("## Send message !");

        function onMessage(messageEvent) {
            console.log("IPYTHON: Message received !!");
            if (messageEvent.data["image"]) {
                image = messageEvent.data["image"];
                console.log("IPYTHON: Got image response");
                console.log(image);

                // transfer the image to python kernel
                reader = new FileReader();
                reader.readAsDataURL(image);
                reader.onloadend = function() {
                    base64data = reader.result;
                    // console.log(base64data);
                    var kernel = IPython.notebook.kernel;

                    precommand = "b64data = '" + base64data + "'";
                    console.log("precommand: " + precommand);
                    kernel.execute(precommand);

                    command = "current_view = image_from_datauri(b64data)";
                    console.log("command: " + command);
                    kernel.execute(command);
                }
            }
        }

        if (window.addEventListener) {
            // For standards-compliant web browsers
            window.addEventListener("message", onMessage, false);
        }
        else {
            window.attachEvent("onmessage", onMessage);
        }

        function postRequest() {
            iframewin = document.getElementById("guest1").contentWindow;
            iframewin.postMessage({"slideatlas" : "image"}, "*");
        }

        postRequest();

    </script>
    """
    return HTML(button + slideatlas_iframe + javascript)