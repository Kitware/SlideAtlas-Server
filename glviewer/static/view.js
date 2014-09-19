//==============================================================================
// View Object
// Viewport (x_lowerleft, y_lowerleft, width, height)
// A view has its own camera and list of tiles to display.
// Views can share a cache for tiles.

// Cache is the source for the image tiles.
function View (viewport, layer) { // connectome: remove cache arg to constructor
  for (var i = 0; i < 4; ++i) {
    viewport[i] = Math.round(viewport[i]);
  }
  // Allow for border.
  viewport[2] -=2;
  viewport[3] -=2;

  // connectome : default section so we cen set cache.
  this.Section = new Section;

  // connectome: remove Cache ivar.
  this.Viewport = viewport;
  this.Camera = new Camera(viewport[2], viewport[3]);
  this.Tiles = [];
  this.OutlineColor = [0,0.5,0];
  this.OutlineMatrix = mat4.create();
  this.OutlineCamMatrix = mat4.create();

  // 2d canvas
  if ( ! GL) {
    // Add a new canvas.
    this.Canvas = $('<canvas>').appendTo(CANVAS).css({
        'position': 'absolute',
        'left' : viewport[0]+"px",
        'width': viewport[2]+"px",
        'bottom' : viewport[1]+"px",
        'height': viewport[3]+"px",
        'z-index': layer.toString(),
        'border-style': 'solid',
        'border-width': '1px'
    });

    this.Context2d = this.Canvas[0].getContext("2d");
  }
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

View.prototype.GetViewport = function() {
  return this.Viewport;
}

View.prototype.SetViewport = function(viewport) {
  for (var i = 0; i < 4; ++i) {
    viewport[i] = Math.round(viewport[i]);
  }
  // Allow for border.
  viewport[2] -=2;
  viewport[3] -=2;
  if (this.Canvas) {
    if (viewport[2] < 3 || viewport[3] < 1) {
      this.Canvas.hide();
    } else {
      this.Canvas.show();
    }
    this.Canvas.css({
        'left' : viewport[0]+"px",
        'width': viewport[2]+"px",
        'bottom' : viewport[1]+"px",
        'height': viewport[3]+"px"
    });
    this.Canvas.attr("width", viewport[2].toString());
    this.Canvas.attr("height", viewport[3].toString());
  }

  this.Viewport = viewport;
  this.Camera.SetViewport(viewport);
}

// I want only the annotation to create a mask image.
var MASK_HACK = false;
// Note: Tile in the list may not be loaded yet.
View.prototype.DrawTiles = function () {
  if (MASK_HACK ) {
      return;
  }
  if ( GL) {
    this.Section.Draw(this, GL);
  } else {
    this.Context2d.setTransform(1, 0, 0, 1, 0, 0);
    this.Context2d.clearRect(0,0,this.Viewport[2],this.Viewport[3]);
    // Clear the canvas to start drawing.
    this.Context2d.fillStyle="#ffffff";
    this.Context2d.fillRect(0,0,this.Viewport[2],this.Viewport[3]);
    this.Context2d.stroke();

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

    this.Section.Draw(this, this.Context2d);
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
    // This is an issue later because the images will be upside down.
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
      var height = cam.Height;
      if ( ! cam.Width) {
        // We do not have a saved aspect ratio, so we will have to make an assumption.
        cam.Width = height * aspectRatio;
      }
      var width = cam.Width;
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


View.prototype.DrawCopyright = function (copyright) {
  if (copyright == undefined) {
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
    GL.viewport(this.Viewport[0], this.Viewport[1], this.Viewport[2], this.Viewport[3]);

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










