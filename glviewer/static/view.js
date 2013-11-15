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
  this.Camera.ViewportWidth = viewport[2];
  this.Camera.ViewportHeight = viewport[3];
}

// Note: Tile in the list may not be loaded yet.
View.prototype.DrawTiles = function () {
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










