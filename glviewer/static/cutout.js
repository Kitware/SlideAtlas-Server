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

function GetCutoutImage(cache, dimensions, focalPoint, scale, roll,
                        returnCallback) {
    // Construct a view to render the image on the client.
    var width =  dimensions[0];
    var height =  dimensions[1];
    var viewport = [0,0, width, height];

    var view = new View();
    view.InitializeViewport(viewport, 1, true);
    view.SetCache(cache);
    view.Canvas.attr("width", width);
    view.Canvas.attr("height", height);
    var newCam = view.Camera;
    newCam.SetFocalPoint(focalPoint[0], focalPoint[1]);
    newCam.Roll = roll;
    newCam.Height = height*scale;
    newCam.ComputeMatrix();

    // Load only the tiles we need.
    var tiles = cache.ChooseTiles(newCam, 0, []);
    for (var i = 0; i < tiles.length; ++i) {
        LoadQueueAddTile(tiles[i]);
    }

    SetFinishedLoadingCallback(
        function () {GetCutoutImage2(view, returnCallback);}
    );

    LoadQueueUpdate();

    console.log("trigger " + LOAD_QUEUE.length + " " + LOADING_COUNT);
}

GetCutoutImage2 = function(view, returnCallback) {
    // All the tiles are loaded and waiting in the cache.
    view.DrawTiles();
    var viewport = view.GetViewport();

    var ctx  = view.Context2d;
    var data = GetImageData(view);

    // for debugging.
    //view.Canvas[0].toBlob(function(blob) {saveAs(blob, "cutout.png");}, "image/png");

    returnCallback(data);
}



// This works great!
// Light weight viewer.
// Attempt to make a div with multiple images.
// image = database image object.
// height = height in screen pixels of the returned div image.
// request = (optional) bounds of cropped image in slide pixel units.
//           if request is not defined, it defaults to the whole image bounds.
function CutoutThumb(image, height, request) {
    if ( ! request) {
        request = image.bounds;
    }

    var width = Math.ceil(height * (request[1]-request[0]) / (request[3]-request[2]));
    var div = $('<div>')
        .css({'width' : width + 'px',
              'height': height + 'px',
              'overflow': 'hidden',
              'position': 'relative'});
    // Cropp the request so we do not ask for tiles that do not exist.
    var levelReq = [Math.max(request[0],image.bounds[0]),
                    Math.min(request[1],image.bounds[1]),
                    Math.max(request[2],image.bounds[2]),
                    Math.min(request[3],image.bounds[3])];

    // pick the level to use.
    var level = 0;
    while ((levelReq[3]-levelReq[2]) > height && level < image.levels-1) {
        level += 1;
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

    var screenPixelSpacing = (request[3]-request[2]) / height;
    var screenPixelOrigin = [request[0], request[2]];
    div.data("spacing", screenPixelSpacing);
    div.data("origin", screenPixelOrigin);
    var imgSize = (tileDim<<level) / screenPixelSpacing;


    // grid of tiles to render.
    var gridReq = [Math.floor(levelReq[0]/tileDim),
                   Math.floor(levelReq[1]/tileDim),
                   Math.floor(levelReq[2]/tileDim),
                   Math.floor(levelReq[3]/tileDim)];
    // loop over the tiles.
    for (var y = gridReq[2]; y <= gridReq[3]; ++y) {
        for (var x = gridReq[0]; x <= gridReq[1]; ++x) {
            // Compute the tile name.
            var tx = x, ty = y, tl = level;
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
            var left = (((x<<level)*tileDim)-request[0])/screenPixelSpacing;
            var top  = (((y<<level)*tileDim)-request[2])/screenPixelSpacing;
            var img  = $('<img>')
                .appendTo(div)
                .attr("width", imgSize)
                .attr("height", imgSize)
                .attr("src", "/tile?img="+image.img+"&db="+image.db+"&name=t"+tileName+".jpg")
                .attr("alt", image.label)
                .css({"left": left.toString()+"px",
                      "top":  top.toString()+"px",
                      "position" : "absolute"});
        }
    }

    return div;
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
