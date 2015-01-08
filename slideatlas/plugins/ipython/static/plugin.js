
(function(namespace) {

    function IPythonInteract() {
        console.log("iPython Interactor Initialized");

    }

    $( document ).ready(function() {

        function onMessage(messageEvent) {
            // console.log("SLIDEATLAS: Message received by view !!");
            if (messageEvent.data["slideatlas"]) {
                console.log("Received request: " + JSON.stringify(messageEvent.data["slideatlas"]));
                if(messageEvent.data["slideatlas"] === "image") {
                    VIEWER1.MainView.Canvas[0].toBlob(
                          function(blob) {
                              // Send the response back
                              messageEvent.source.postMessage({"image" : blob}, messageEvent.origin);
                          }, "image/png");
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
    });

    namespace["plugin_ipython"] = IPythonInteract;

})(window);
