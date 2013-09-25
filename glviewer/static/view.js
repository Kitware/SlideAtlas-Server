//==============================================================================
// View Object
// Viewport (x_lowerleft, y_lowerleft, width, height)
// A view has its own camera and list of tiles to display.
// Views can share a cache for tiles.

// Cache is the source for the image tiles.
function View (viewport) { // connectome: remove cache arg to constructor
  // connectome : default section so we cen set cache.
  this.Section = new Section;

  // connectome: remove Cache ivar.
  this.Viewport = viewport;
  this.Camera = new Camera(viewport[2], viewport[3]);
  this.Tiles = [];
  this.OutlineColor = [0,0.5,0]; 
  this.OutlineMatrix = mat4.create();
  this.OutlineCamMatrix = mat4.create();
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

View.prototype.SetViewport = function(viewport) {
  this.Viewport = viewport;
  this.Camera.ViewportWidth = viewport[2];
  this.Camera.ViewportHeight = viewport[3];
}

// Note: Tile in the list may not be loaded yet.
View.prototype.DrawTiles = function () {
  this.Section.Draw(this);
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
  } else {
    GC_save();
    GC.beginPath();
    GC.lineWidth="1";
    // this.OutlineColor[0],this.OutlineColor[1],this.OutlineColor[2];
    GC.strokeStyle="black"; // I need to find the method that converts RBG array to hex color
    //GC.rect(this.Viewport[0],CANVAS.height - this.Viewport[1] - this.Viewport[3],this.Viewport[2],this.Viewport[3]); 
    GC.rect(Math.round(this.Viewport[0]),Math.round(this.Viewport[1]),
            Math.round(this.Viewport[2]),Math.round(this.Viewport[3])); 
    GC.stroke();
    GC_restore();
  }
}










