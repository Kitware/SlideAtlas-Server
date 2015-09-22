// Generate an image of any resolution and size.

// You can use "FindCache(image)" to get the cache.
// image is the database image object with all the image meta data.

// How can you use the image data returned?
// canvasContext.putImageData(data, 0, 0);
// image = document.createElement('img');
// image.src = canvas.toDataURL('image/png');

// - cache: references the image source.
// - dimensions [xDim,yDim]: Final image dimensions in image pixels.
// - focalPoint [x,y,z]: the center of the image in slide coordinates.
// - rotation: Rotation around the focal point in degrees.
// - scale:  Image pixel size in slide coordinates. 1 is highest resolution.
// - returnCallback(data): Since non blocking ajax calls get the tiles necessary
//     to construct the image, we return the image data with a callback
//     function. The data returned is same as "ctx.getImageData(0,0,w,h);",
//     but we add data.Camera for conversion to the slide coordinate system.

// for debugging
var CUTOUT_VIEW;


function DownloadImageData(data, filename) {
    // The only way I know if is to put in into a canvas.

    // Construct a view to render the image on the client.
    var width =  data.width;
    var height =  data.height;
    var viewport = [0,0, width, height];

    var view = new View();
    view.InitializeViewport(viewport, 1, true);
    view.Canvas.attr("width", width);
    view.Canvas.attr("height", height);
    view.Context2d.putImageData(data, 0, 0);

    view.Canvas[0].toBlob(function(blob) {saveAs(blob, filename);}, "image/png");
}

// If file name is not null or "", this image is save to the client.
// cache: The image/tile source.
// dimensions: size of the image in pixels [xDim,yDim]
// focalPoint: Center of the image in world / slide coordinates.
// scale:  Size of a pixel in world coordinates.
// roll: in radians?
// fileName: name of file to download. (null, or "" means do not download).
// returnCallback:  function to call (with data as argument) when done.
function GetCutoutImage(cache, dimensions, focalPoint, scale, roll, fileName,
                        returnCallback) {
    // Construct a view to render the image on the client.
    var width =  dimensions[0];
    var height =  dimensions[1];
    var viewport = [0,0, width, height];

    var view = new View();
    CUTOUT_VIEW = view;
    view.SetCache(cache);
    view.InitializeViewport(viewport, 1, true);
    var newCam = view.Camera;
    newCam.SetFocalPoint( focalPoint);
    newCam.SetRoll(roll);
    newCam.SetHeight(height*scale);
    // TODO:  Hide matrix computation.  Make it automatic.
    newCam.ComputeMatrix();

    // Load only the tiles we need.
    var tiles = cache.ChooseTiles(newCam, 0, []);
    for (var i = 0; i < tiles.length; ++i) {
        LoadQueueAddTile(tiles[i]);
    }

    AddFinishedLoadingCallback(
        function () {GetCutoutImage2(view, fileName, returnCallback);}
    );

    LoadQueueUpdate();

    console.log("trigger " + LOAD_QUEUE.length + " " + LOADING_COUNT);
}

GetCutoutImage2 = function(view, fileName, returnCallback) {
    // All the tiles are loaded and waiting in the cache.
    view.DrawTiles();
    var viewport = view.GetViewport();

    if (fileName && fileName != "") {
        view.Canvas[0].toBlob(function(blob) {saveAs(blob, fileName);}, "image/png");
    }

    if (returnCallback) {
        var ctx  = view.Context2d;
        var data = GetImageData(view);
        returnCallback(data);
    }
}



// This works great!
// Light weight viewer.
// Attempt to make a div with multiple images.
// image = database image object.
// height = height in screen pixels of the returned div image.
// request = (optional) bounds of cropped image in slide pixel units.
//           if request is not defined, it defaults to the whole image bounds.
// Events are funny,  The mouse position is realtive to
// the tiles.  click and bounds are callback functions to make
// interaction simpler.
function  CutoutThumb(image, height, request) {
    if ( ! request) {
        request = image.bounds;
    }

    this.ImageData = image;
    this.Height = height;
    this.Width = Math.ceil(height * (request[1]-request[0]) / (request[3]-request[2]));
    this.Div = $('<div>')
        .css({'width' : this.Width + 'px',
              'height': this.Height + 'px'  })
        .addClass("sa-view-cutout-thumb-div");
    // Crop the request so we do not ask for tiles that do not exist.
    var levelReq;
    if (image.bounds) {
      var levelReq = [Math.max(request[0],image.bounds[0]),
                    Math.min(request[1],image.bounds[1]),
                    Math.max(request[2],image.bounds[2]),
                    Math.min(request[3],image.bounds[3])];
    } else {
        levelReq = [Math.max(request[0],0), request[1],
                    Math.max(request[2],0), request[3]];
    }

    
    // Size of each tile.
    var tileDim = 256;
    if (image.tile_size) {
        tileDim = image.tile_size;
    }

    // Pick the level to use.
    this.Level = 0; // 0 = leaves
    while ((levelReq[3]-levelReq[2]) > this.Height && 
           this.Level < image.levels-1) {
        this.Level += 1;
        levelReq[0] *= 0.5;
        levelReq[1] *= 0.5;
        levelReq[2] *= 0.5;
        levelReq[3] *= 0.5;
    }

    // Size of each tile.
    var tileDim = 256;
    if (image.tile_size) {
        tileDim = image.tile_size;
    }

    this.ScreenPixelSpacing = (request[3]-request[2]) / this.Height;
    var imgSize = (tileDim<<this.Level) / this.ScreenPixelSpacing;


    // grid of tiles to render.
    this.GridReq = [Math.floor(levelReq[0]/tileDim),
                    Math.floor(levelReq[1]/tileDim),
                    Math.floor(levelReq[2]/tileDim),
                    Math.floor(levelReq[3]/tileDim)];

    // Compute the origin: the upper left corner of the upper left image.
    this.ScreenPixelOrigin = [this.GridReq[0]*(tileDim<<this.Level),
                              this.GridReq[2]*(tileDim<<this.Level)];

    // loop over the tiles.
    for (var y = this.GridReq[2]; y <= this.GridReq[3]; ++y) {
        for (var x = this.GridReq[0]; x <= this.GridReq[1]; ++x) {
            // Compute the tile name.
            var tx = x, ty = y, tl = this.Level;
            var tileName = "";
            while (tl < image.levels-1) {
                if ((tx&1) == 0 && (ty&1) == 0) {tileName = "q" + tileName;}
                if ((tx&1) == 1 && (ty&1) == 0) {tileName = "r" + tileName;}
                if ((tx&1) == 0 && (ty&1) == 1) {tileName = "t" + tileName;}
                if ((tx&1) == 1 && (ty&1) == 1) {tileName = "s" + tileName;}
                tx = (tx>>1);
                ty = (ty>>1);
                ++tl;
            }
            var left = (((x<<this.Level)*tileDim)-request[0])/this.ScreenPixelSpacing;
            var top  = (((y<<this.Level)*tileDim)-request[2])/this.ScreenPixelSpacing;
            var img  = $('<img>')
                .appendTo(this.Div)
                .attr("width", imgSize)
                .attr("height", imgSize)
                .attr("src", "/tile?img="+image.img+"&db="+image.db+"&name=t"+tileName+".jpg")
                .attr("alt", image.label)
                .css({"left": left.toString()+"px",
                      "top":  top.toString()+"px"})
                .addClass("sa-view-cutout-thumb-tile");
        }
    }
}

CutoutThumb.prototype.AppendTo = function(parent) {
    this.Div.appendTo(parent);
    return this;
}

// Call back argument is this thumb object.
// slideX, and slideY are set to mouse in slide coordinates.
CutoutThumb.prototype.Click = function(callback) {
    var self = this;
    this.ClickCallback = callback;
    this.Div.click(function (e) {
        // It is a real pain to get the mouse position rlative to the div.
        var x = e.pageX;
        var y = e.pageY;
        // Now get the location of this thumb on the screen.
        var offset = self.Div.offset();
        x -= offset.left;
        y -= offset.top;
        console.log("click: " + x + ", " + y);

        self.SlideX = (x * self.ScreenPixelSpacing) 
            + self.ScreenPixelOrigin[0];
        self.SlideY = (y * self.ScreenPixelSpacing) 
            + self.ScreenPixelOrigin[1];
        (self.ClickCallback)(self);
    });

    return this;
}









// todo: 
// - Bind delete key to stack creator.
// - debug why some slides are not working.
// - Get the average color of sections and get rid of outliers. 
//     (Maybe after delete)?
// - First pass rigid aligment in stack creator.
// - save the contour with the stack sections.
// - move the transformations to load with the sections.
// - Toggle slide / section view in stack viewer.
// - Implement a way to reorder the sections.
// - Implement a way to add a section in the slide stack viewer.
// - Implement multiple pieces in a single section.
// - Improve the gradient descent to be less sensitive to outliers
//     (mismatched contours.)
