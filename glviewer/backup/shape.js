// TODO:
// make a shape superclass.


function Shape() {
  this.Orientation = 0.0; // in degrees, counter clockwise, 0 is left
  this.Origin = [10000,10000]; // Anchor in world coordinates.
  this.FixedSize = true;
  this.FixedOrientation = true;
  this.LineWidth = 0; // Line width has to be in same coordiantes as points.
  this.Visibility = true; // An easy way to turn off a shape (with removing it from the shapeList).
  this.Active = false;
  this.ActiveColor = [1.0, 1.0, 0.0];
  // Playing around with layering.  The anchor is being obscured by the text.
  this.ZOffset = 0.1;
  };

Shape.prototype.destructor=function() {
  // Get rid of the buffers?
}

Shape.prototype.Draw = function (view) {
  if ( ! this.Visibility) {
    return;
  }
  var program = polyProgram;

  if (this.Matrix == undefined) {
    this.UpdateBuffers();
  }

  GL.useProgram(program);
  GL.disable(GL.BLEND);
  GL.enable(GL.DEPTH_TEST);

  // This does not work.
  // I will need to make thick lines with polygons.
  //GL.lineWidth(5);

  // These are the same for every tile.
  // Vertex points (shifted by tiles matrix)
  GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
  // Needed for outline ??? For some reason, DrawOutline did not work
  // without this call first.
  GL.vertexAttribPointer(program.vertexPositionAttribute, 
                         this.VertexPositionBuffer.itemSize, 
                         GL.FLOAT, false, 0, 0);     // Texture coordinates
  // Local view.
  GL.viewport(view.Viewport[0], view.Viewport[1], 
              view.Viewport[2], view.Viewport[3]);

  var viewFrontZ = view.Camera.ZRange[0]+0.01;

  // Lets use the camera to change coordinate system to pixels.
  // TODO: Put this camera in the view or viewer to avoid creating one each render.
  var camMatrix = mat4.create();
  mat4.identity(camMatrix);
  if (this.FixedSize) {
    // This camera matric changes pixel/ screen coordinate sytem to
    // view [-1,1],[-1,1],z
    camMatrix[0] = 2.0 / view.Viewport[2];
    camMatrix[12] = -1.0;
    camMatrix[5] = 2.0 / view.Viewport[3];
    camMatrix[13] = -1.0;
    camMatrix[14] = viewFrontZ; // In front of tiles in this view
    GL.uniformMatrix4fv(program.pMatrixUniform, false, camMatrix);
  } else {
    // Use main views camera to convert world to view.
    GL.uniformMatrix4fv(program.pMatrixUniform, false, view.Camera.Matrix);
  }

  // The actor matrix that rotates to orientation and shift (0,0) to origin.
  // Rotate based on ivar orientation.
  var theta = this.Orientation * 3.1415926536 / 180.0;
  this.Matrix[0] =  Math.cos(theta);
  this.Matrix[1] =  Math.sin(theta);
  this.Matrix[4] = -Math.sin(theta);
  this.Matrix[5] =  Math.cos(theta);
  // Place the origin of the shape.
  x = this.Origin[0];
  y = this.Origin[1];
  if (this.FixedSize) {
    // For fixed size, translation mus be in view/pixel coordinates.
    // First transform the world to view.
    var m = view.Camera.Matrix;
    var x = (this.Origin[0]*m[0] + this.Origin[1]*m[4] + m[12])/m[15];
    var y = (this.Origin[0]*m[1] + this.Origin[1]*m[5] + m[13])/m[15];
    // convert view to pixels (view coordinate ssytem).
    x = view.Viewport[2]*(0.5*(x+1.0));
    y = view.Viewport[3]*(0.5*(y+1.0));
  }
  // Translate to place the origin.
  this.Matrix[12] = x;
  this.Matrix[13] = y;
  this.Matrix[14] = this.ZOffset;
  GL.uniformMatrix4fv(program.mvMatrixUniform, false, this.Matrix);

  // Fill color
  if (this.FillColor != undefined) {
    if (this.Active) {
      GL.uniform3f(program.colorUniform, this.ActiveColor[0], 
                   this.ActiveColor[1], this.ActiveColor[2]);
  	} else {
	    GL.uniform3f(program.colorUniform, this.FillColor[0], 
                   this.FillColor[1], this.FillColor[2]);
    }
    // Cell Connectivity
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
      
    GL.drawElements(GL.TRIANGLES, this.CellBuffer.numItems, 
                    GL.UNSIGNED_SHORT,0);
  }
  // Outline.
  if (this.OutlineColor != undefined) {
    if (this.Active) {
	    GL.uniform3f(program.colorUniform, this.ActiveColor[0], 
			             this.ActiveColor[1], this.ActiveColor[2]);
    } else {
	    GL.uniform3f(program.colorUniform, this.OutlineColor[0], 
                   this.OutlineColor[1], this.OutlineColor[2]);
    }
    if (this.LineWidth == 0) {
      GL.drawArrays(GL.LINE_STRIP, 0, this.VertexPositionBuffer.numItems);
    } else {
      // Cell Connectivity
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.LineCellBuffer);
      GL.drawElements(GL.TRIANGLES, this.LineCellBuffer.numItems, 
                      GL.UNSIGNED_SHORT,0);
    }
  }
}

Shape.prototype.SetOutlineColor = function (c) {
  this.OutlineColor = ConvertColor(c);
}

Shape.prototype.SetFillColor = function (c) {
  this.FillColor = ConvertColor(c);
}

Shape.prototype.HandleMouseMove = function(event, dx,dy) {
  // superclass does nothing
  return false;
}

//Shape.prototype.UpdateBuffers = function() {
    //    // The superclass does not implement this method.
//}

Shape.prototype.IntersectPointLine = function(pt, end0, end1, thickness) {
  // make end0 the origin.
  var x = pt[0] - end0[0];
  var y = pt[1] - end0[1];
  var vx = end1[0] - end0[0];
  var vy = end1[1] - end0[1];
  
  // Rotate so the edge lies on the x axis.
  var length = Math.sqrt(vx*vx + vy*vy); // Avoid atan2 ... with clever use of complex numbers.
  vx = vx/length;
  vy = -vy/length;
  var newX = (x*vx - y*vy);
  var newY = (x*vy + y*vx);
  
  if (newX >= 0.0 && newX <= length) {
    if (Math.abs(newY) < (thickness *0.5)) {
      return true;
    }
  return false;
  }
}
  
