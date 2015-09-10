//==============================================================================
// View Object
// Viewport (x_lowerleft, y_lowerleft, width, height)
// A view has its own camera and list of tiles to display.
// Views can share a cache for tiles.

var TEXT_VIEW_HACK = null;

function View (parent) {
    // Text needs a context to compute its bounds.
    if ( ! TEXT_VIEW_HACK) {
        TEXT_VIEW_HACK = this;
    }
    // Should widgets use shapes?
    // Should views be used independently to viewers?
    this.ShapeList = [];

    // connectome : default section so we cen set cache
    this.Section = new Section;

    // connectome: remove Cache ivar.
    this.Camera = new Camera();
    this.Tiles = []; // Not really used
    this.OutlineColor = [0,0.5,0];
    this.OutlineMatrix = mat4.create();
    this.OutlineCamMatrix = mat4.create();

    this.CanvasDiv = parent;
    // 2d canvas
    // Add a new canvas.
    this.Canvas = $('<canvas>');
    if ( ! GL) {
        this.Context2d = this.Canvas[0].getContext("2d");
    }
}

// Only new thing here is appendTo
// TODO get rid of this eventually (SetViewport).
View.prototype.InitializeViewport = function(viewport, layer, hide) {
    for (var i = 0; i < 4; ++i) {
        viewport[i] = Math.round(viewport[i]);
    }
    // Allow for border.
    viewport[2] -=2;
    viewport[3] -=2;

    this.Viewport = viewport;
    this.Camera.SetViewport(viewport);

    // 2d canvas
    // Add a new canvas.
    if ( ! this.CanvasDiv) {
        this.CanvasDiv = $('<div>');
    }
    this.CanvasDiv
        .addClass('view')
        .addClass("sa-view-canvas-div")

    this.Canvas
        .appendTo(this.CanvasDiv)
        .css({'width':'100%',
              'height':'100%'});
    // Css is not enough.  Canvas needs these for rendering.
    this.Canvas.attr("width", viewport[2]);
    this.Canvas.attr("height", viewport[3]);
}


// TODO: Get rid of these since the user can manipulate the parent / canvas
// div which can be passed into the constructor.
View.prototype.appendTo = function(j) {
  return this.CanvasDiv.appendTo(j);
}

View.prototype.remove = function(j) {
  return this.CanvasDiv.remove(j);
}

View.prototype.css = function(j) {
  return this.CanvasDiv.css(j);
}

View.prototype.GetViewport = function() {
  return this.Viewport;
}

View.prototype.GetViewport = function() {
  return this.Viewport;
}

// The canvasDiv changes size, the width and height of the canvas and
// camera need to follow.  I am going to make this the resize callback.
View.prototype.UpdateCanvasSize = function() {
    var pos = this.CanvasDiv.position();
    //var width = this.CanvasDiv.innerWidth();
    //var height = this.CanvasDiv.innerHeight();
    var width = this.CanvasDiv.width();
    var height = this.CanvasDiv.height();
    // resizable is making width 0 intermitently ????
    if (width <= 0 || height <= 0) { return false; }

    this.Canvas.attr("width", width.toString());
    this.Canvas.attr("height", height.toString());

    // TODO: Get rid of this.
    this.Viewport = [pos.left, pos.top, width, height];

    // TODO: Just set the width and height of the camera.
    // There is no reason, the camera needs to know the
    // the position of the cameraDiv.
    this.Camera.SetViewport(this.Viewport);
    return true;
}


// TODO: Now that the browser in managing the position and size of the
// canvasDiv, get rid of this function.  I still need to synchronize the
// canvas with the canvasDiv.  see  UpdateCanvas();
View.prototype.SetViewport = function(viewport) {
  for (var i = 0; i < 4; ++i) {
    viewport[i] = Math.round(viewport[i]);
  }
  // Allow for border.
  viewport[2] -=2;
  viewport[3] -=2;
  if (this.CanvasDiv) {
    if (viewport[2] < 3 || viewport[3] < 1) {
      this.CanvasDiv.hide();
    } else {
      this.CanvasDiv.show();
    }
    this.CanvasDiv.css({
        'left'  : viewport[0]+"px",
        'width' : viewport[2]+"px",
        'top'   : viewport[1]+"px",
        'height': viewport[3]+"px"
    });
    this.Canvas.attr("width", viewport[2].toString());
    this.Canvas.attr("height", viewport[3].toString());
  }

  this.Viewport = viewport;
  this.Camera.SetViewport(viewport);
}




View.prototype.CaptureImage = function() {
    var url = this.Canvas[0].toDataURL();
    var newImg = document.createElement("img"); //create
    newImg.src = url;
    return newImg;
}


View.prototype.GetBounds = function() {
    return this.Section.GetBounds();
}
View.prototype.GetLeafSpacing = function() {
    return this.Section.GetLeafSpacing();
}


// connectome
View.prototype.AddCache = function(cache) {
  if ( ! cache) { return; }
  this.Section.Caches.push(cache);
}


View.prototype.SetCache = function(cache) {
  // connectome
  if ( ! cache) {
    this.Section.Caches = [];
  } else {
    this.Section.Caches = [cache];
  }
}

View.prototype.GetCache = function() {
  // connectome: This makes less sense with a section with many caches.
  // TODO: try to get rid of this
  return this.Section.Caches[0];
}

// A list of shapes to render in the view
View.prototype.AddShape = function(shape) {
  this.ShapeList.push(shape);
}

View.prototype.DrawShapes = function () {
    for(i=0; i<this.ShapeList.length; i++){
        this.ShapeList[i].Draw(this);
    }
}

// I want only the annotation to create a mask image.
var MASK_HACK = false;
// Note: Tile in the list may not be loaded yet.
// Returns true if all the tiles to render were available.
// False implies that the user shoudl render again.
View.prototype.DrawTiles = function () {
    //console.time("  ViewDraw");
    if ( GL) {
        if (MASK_HACK ) {
            return;
        }
        return this.Section.Draw(this, GL);
    } else {
        this.Context2d.setTransform(1, 0, 0, 1, 0, 0);
        this.Context2d.clearRect(0,0,this.Viewport[2],this.Viewport[3]);
        // Clear the canvas to start drawing.
        this.Context2d.fillStyle="#ffffff";
        //this.Context2d.fillRect(0,0,this.Viewport[2],this.Viewport[3]);

        // Start with a transform that flips the y axis.
        // This is an issue later because the images will be upside down.
        this.Context2d.setTransform(1, 0, 0, -1, 0, this.Viewport[3]);

        // Map (-1->1, -1->1) to the viewport.
        // Origin of the viewport does not matter because drawing is relative
        // to this view's canvas.
        this.Context2d.transform(0.5*this.Viewport[2], 0.0,
                                 0.0, 0.5*this.Viewport[3],
                                 0.5*this.Viewport[2],
                                 0.5*this.Viewport[3]);

        if (MASK_HACK ) {
            return;
        }
        return this.Section.Draw(this, this.Context2d);
    }
}

// Note: Tile in the list may not be loaded yet.
View.prototype.DrawHistory = function (windowHeight) {
    if ( GL) {
        alert("Drawing history does not work with webGl yet.");
    } else {
        var ctx = this.Context2d;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Start with a transform that flips the y axis.
        ctx.setTransform(1, 0, 0, -1, 0, this.Viewport[3]);

        // Map (-1->1, -1->1) to the viewport.
        // Origin of the viewport does not matter because drawing is relative
        // to this view's canvas.
        ctx.transform(0.5*this.Viewport[2], 0.0,
                      0.0, 0.5*this.Viewport[3],
                      0.5*this.Viewport[2],
                      0.5*this.Viewport[3]);

        //ctx.fillRect(0.0,0.1,0.5,0.5); // left, right, width, height

        // The camera maps the world coordinate system to (-1->1, -1->1).
        var cam = this.Camera;
        var aspectRatio = cam.ViewportWidth / cam.ViewportHeight;

        var h = 1.0 / cam.Matrix[15];
        ctx.transform(cam.Matrix[0]*h, cam.Matrix[1]*h,
                      cam.Matrix[4]*h, cam.Matrix[5]*h,
                      cam.Matrix[12]*h, cam.Matrix[13]*h);

        for (var i = 0; i < TIME_LINE.length; ++i) {
            var cam = TIME_LINE[i].ViewerRecords[0].Camera;
            var height = cam.GetHeight();
            var width = cam.GetWidth();
            // camer roll is already in radians.
            var c = Math.cos(cam.Roll);
            var s = Math.sin(cam.Roll);
            ctx.save();
            // transform to put focal point at 0,0
            ctx.transform(c, -s,
                          s, c,
                          cam.FocalPoint[0], cam.FocalPoint[1]);

            // Compute the zoom factor for opacity.
            var opacity = 2* windowHeight / height;
            if (opacity > 1.0) { opacity = 1.0; }

            ctx.fillStyle = "rgba(0,128,0," + opacity + ")";
            ctx.fillRect(-width/2, -height/2, width, height); // left, right, width, height
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }
}

// Draw a cross hair in the center of the view.
View.prototype.DrawFocalPoint = function () {
    if ( GL) {
        alert("Drawing focal point does not work with webGl yet.");
    } else {
        var x = this.Viewport[2] * 0.5;
        var y = this.Viewport[3] * 0.5;
        var ctx = this.Context2d;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = "rgba(255,255,200,100)"; 
        ctx.fillStyle = "rgba(0,0,50,100)"; 

        ctx.beginPath();
        ctx.fillRect(x-30,y-1,60,3);
        ctx.rect(x-30,y-1,60,3);
        ctx.fillRect(x-1,y-30,3,60);
        ctx.rect(x-1,y-30,3,60);

        var r = y / 2;
        ctx.beginPath();
        ctx.moveTo(x-r,y-r+30);
        ctx.lineTo(x-r,y-r);
        ctx.lineTo(x-r+30,y-r);
        ctx.moveTo(x+r,y-r+30);
        ctx.lineTo(x+r,y-r);
        ctx.lineTo(x+r-30,y-r);
        ctx.moveTo(x+r,y+r-30);
        ctx.lineTo(x+r,y+r);
        ctx.lineTo(x+r-30,y+r);
        ctx.moveTo(x-r,y+r-30);
        ctx.lineTo(x-r,y+r);
        ctx.lineTo(x-r+30,y+r);
        ctx.stroke();

        ++r;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0,0,50,100)"; 
        ctx.moveTo(x-r,y-r+30);
        ctx.lineTo(x-r,y-r);
        ctx.lineTo(x-r+30,y-r);
        ctx.moveTo(x+r,y-r+30);
        ctx.lineTo(x+r,y-r);
        ctx.lineTo(x+r-30,y-r);
        ctx.moveTo(x+r,y+r-30);
        ctx.lineTo(x+r,y+r);
        ctx.lineTo(x+r-30,y+r);
        ctx.moveTo(x-r,y+r-30);
        ctx.lineTo(x-r,y+r);
        ctx.lineTo(x-r+30,y+r);
        ctx.stroke();
        ctx.restore();
    }
}

// Draw a cross hair at each correlation point.
// pointIdx is 0 or 1.  It indicates which correlation point should be drawn.
View.prototype.DrawCorrelations = function (correlations, pointIdx) {
    if ( GL) {
        alert("Drawing correlations does not work with webGl yet.");
    } else {
        var ctx = this.Context2d;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = "rgba(200,255,255,100)";
        ctx.fillStyle = "rgba(255,0,0,100)";
        for (var i = 0; i < correlations.length; ++i) {
            var wPt = correlations[i].GetPoint(pointIdx);
            var m = this.Camera.Matrix;
            // Change coordinate system from world to -1->1
            var x = (wPt[0]*m[0] + wPt[1]*m[4]
                     + m[12]) / m[15];
            var y = (wPt[0]*m[1] + wPt[1]*m[5]
                     + m[13]) / m[15];
            // Transform coordinate system from -1->1 to canvas
            x = (1.0 + x) * this.Viewport[2] * 0.5;
            y = (1.0 - y) * this.Viewport[3] * 0.5;

            ctx.beginPath();
            ctx.fillRect(x-20,y-1,40,3);
            ctx.rect(x-20,y-1,40,3);
            ctx.fillRect(x-1,y-20,3,40);
            ctx.rect(x-1,y-20,3,40);
        
            ctx.stroke();
        }
        ctx.restore();
    }
}

View.prototype.DrawCopyright = function (copyright) {
  if (copyright == undefined || MASK_HACK) {
    return;
  }
  if ( GL) {
    // not implemented yet.
  } else {
    this.Context2d.setTransform(1, 0, 0, 1, 0, 0);
    this.Context2d.font = "18px Arial";
    var x = this.Viewport[2]*0.5 - 50;
    var y = this.Viewport[3]-10;
    this.Context2d.fillStyle = "rgba(128,128,128,0.5)"; 
    this.Context2d.fillText(copyright,x,y);
    //this.Context2d.strokeStyle = "rgba(255,255,255,0.5)"; 
    //this.Context2d.strokeText(copyright,x,y);
  }
}


View.prototype.DrawOutline = function(backgroundFlag) {
    if (GL) {
        program = polyProgram;
        GL.useProgram(program);

        GL.viewport(this.Viewport[0], 
                    this.Viewport[3]-this.Viewport[1], 
                    this.Viewport[2], 
                    this.Viewport[3]);

        // Draw a line around the viewport, so move (0,0),(1,1) to (-1,-1),(1,1)
        mat4.identity(this.OutlineCamMatrix);
        this.OutlineCamMatrix[0] = 2.0; // width x
        this.OutlineCamMatrix[5] = 2.0; // width y
        this.OutlineCamMatrix[10] = 0;
        this.OutlineCamMatrix[12] = -1.0;
        this.OutlineCamMatrix[13] = -1.0;
        var viewFrontZ = this.Camera.ZRange[0]+0.001;
        var viewBackZ = this.Camera.ZRange[1]-0.001;
        this.OutlineCamMatrix[14] = viewFrontZ; // front plane

        mat4.identity(this.OutlineMatrix);

        GL.uniformMatrix4fv(program.mvMatrixUniform, false, this.OutlineMatrix);

        if (backgroundFlag) {
            // White background fill
            this.OutlineCamMatrix[14] = viewBackZ; // back plane
            GL.uniformMatrix4fv(program.pMatrixUniform, false, this.OutlineCamMatrix);
            GL.uniform3f(program.colorUniform, 1.0, 1.0, 1.0);
            GL.bindBuffer(GL.ARRAY_BUFFER, squarePositionBuffer);
            GL.vertexAttribPointer(program.vertexPositionAttribute,
                                   squarePositionBuffer.itemSize,
                                   GL.FLOAT, false, 0, 0);
            GL.drawArrays(GL.TRIANGLE_STRIP, 0, squarePositionBuffer.numItems);
        }

        // outline
        this.OutlineCamMatrix[14] = viewFrontZ; // force in front
        GL.uniformMatrix4fv(program.pMatrixUniform, false, this.OutlineCamMatrix);
        GL.uniform3f(program.colorUniform, this.OutlineColor[0], this.OutlineColor[1], this.OutlineColor[2]);
        GL.bindBuffer(GL.ARRAY_BUFFER, squareOutlinePositionBuffer);
        GL.vertexAttribPointer(program.vertexPositionAttribute,
                               squareOutlinePositionBuffer.itemSize,
                               GL.FLOAT, false, 0, 0);
        GL.drawArrays(GL.LINE_STRIP, 0, squareOutlinePositionBuffer.numItems);
    }
}










