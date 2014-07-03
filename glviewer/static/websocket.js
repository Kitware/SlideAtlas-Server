// TODO: Make this a singleton module 

// Make bson available
TILELOADER = "http";
var BSON = bson().BSON;

// Definition for WebSocketLoader
function WebSocketLoader(wsuri) {
	// Create object if not instance of 
	if (!(this instanceof WebSocketLoader)) return new WebSocketLoader(wsuri);

	this.queue = {};

    if ("WebSocket" in window) {
        this.sock = new WebSocket(wsuri);
    } else if ("MozWebSocket" in window) {
        this.sock = new MozWebSocket(wsuri);
    } else {
        console.log("Browser does not support WebSocket!");
    }


    if (this.sock) {
        this.sock.binaryType = "arraybuffer";
        this.sock.onopen = this.OnConnect;
        this.sock.onclose = this.OnClose;
        var that = this;
        this.sock.onmessage = function(e) {
  			var resp = BSON.deserialize(new Uint8Array(e.data));
		    if(resp.hasOwnProperty("success")) {
    			if(resp.hasOwnProperty("image")){
        			var whichtile = resp["request"]["tile"]["name"] //  + resp["request"]["tile"]["image"]
                    console.log("Successful request for " + whichtile);
                    var blb = new Blob([resp.image.buffer], { type: 'image/jpg' });
                    that.queue[whichtile].src = URL.createObjectURL(blb);     
                    //that.queue[whichtile].src = "data:image/jpg," + resp.image.value();
                    //that.queue[whichtile].src = "data:image/jpg;base64," + resp.image;
                    //that.queue[whichtile].src = "data:image/jpg;base64," + resp.image;
        			delete that.queue[whichtile];
			    }
			} else {
                console.log("Error in request" + JSON.stringify(resp));
				var whichtile = resp["request"]["tile"]["name"];
    			that.queue[whichtile].src = ''; //  + resp["request"]["tile"]["image"]
    			delete that.queue[whichtile];
			}
	    // console.log("Got: " + JSON.stringify(resp));
		};
	}
	else {
		TILELOADER = "http";
	}
};

WebSocketLoader.prototype.OnConnect = function(e) {
    console.log("WebSocketLoader connected ..");
    TILELOADER = "websocket"; 
};

WebSocketLoader.prototype.OnClose = function(e) {
    console.log("WebSocketLoader closed (wasClean = " + e.wasClean + ", code = " + e.code + ", reason = '" + e.reason + "')");
    this.sock = null;
    TILELOADER = "http";
};

WebSocketLoader.prototype.InitTileStore =function(tilestore) {
    var req = BSON.serialize({ init : {"db" : tilestore}});
	this.sock.send(req);
};

WebSocketLoader.prototype.FetchTile =function(name, image, cache, imgobj) {
	if(this.init === undefined) {
		this.InitTileStore(cache.Image.database)
	}

	// Send message
	console.log("Websocketloader fetching: "  + name + " " + image);
    var req = BSON.serialize({ tile : {"name" : name, "image" : image}});
    this.queue[name] = imgobj;
	this.sock.send(req);
};


ws = WebSocketLoader("ws://" + window.location.host + "/ws");
