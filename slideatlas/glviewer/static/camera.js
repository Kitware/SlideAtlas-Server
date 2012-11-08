//==============================================================================
// Camera Object
function Camera (viewportWidth, viewportHeight) {
    // Better managmenet of layers and sub layers.
    // Assigne a range of the z buffer  for the view to use exclusively.
    // The full range is -1->1.  -1 is in front.
    this.ZRange = [-1.0,1.0];
    this.Roll = 0;
    this.Matrix = mat4.create();
    this.ViewportWidth = viewportWidth;
    this.ViewportHeight = viewportHeight;
    this.Height = 256.0 * 64.0;
    this.FocalPoint = [128.0*64.0, 128.0*64.0, 10.0];
    this.ComputeMatrix();
    // for drawing the view bounds.
    this.Points = [];
    this.Buffer = null;
    this.CreateBuffer();
}

// dx, dy are in view coordinates [-0.5,0.5].  
// The camera matrix converts world to view.
Camera.prototype.HandleTranslate = function (dx,dy) {
    // Convert view vector to world vector.
    // We could invert the matrix to get the transform, but this is easier for now.....
    var s = Math.sin(this.Roll);
    var c = Math.cos(this.Roll);
    var x = this.FocalPoint[0];
    var y = this.FocalPoint[1];
    var z = this.FocalPoint[2];
    var w = this.GetWidth();
    var h = this.GetHeight();
    
    // Scale to world.
    dx = dx * h;
    dy = dy * h;
    // Rotate
    var rx = dx*c + dy*s;
    var ry = dy*c - dx*s;

    this.Translate(rx,ry,0.0);
}

// x,y are in display coordiantes (origin at the center).  
// dx,dy are in the same coordinates system (scale).
// Scale does not matter because we only care about rotation.
Camera.prototype.HandleRoll = function (x,y, dx, dy) {
  // Avoid divide by zero / singularity
  if (x == 0 && y == 0) {
    return;
  }
  // Orthogonal (counter clockwise) dot dVect.
  var dRoll = -y*dx +x*dy;
  // Remove magnitude of location.
  // Scale by R to get correct angle.
  dRoll = dRoll / (x*x + y*y);
  // Keep roll in radians.
  this.Roll += dRoll;
  this.ComputeMatrix();
}


Camera.prototype.Translate = function (dx,dy,dz) {
  this.FocalPoint[0] += dx;
  this.FocalPoint[1] += dy;
  this.FocalPoint[2] += dz;
  this.ComputeMatrix();
}


Camera.prototype.GetHeight = function () {
  return this.Height;
}

Camera.prototype.GetWidth = function () {
    return this.Height * this.ViewportWidth / this.ViewportHeight;
}

// Camera matrix transforms points into camera coordinate system 
// X:(-1->1)
// Y:(-1->1) (-1 is bottom)
// Z:(-1->1) (-1 is front)
Camera.prototype.ComputeMatrix = function () {
    var s = Math.sin(this.Roll);
    var c = Math.cos(this.Roll);
    var x = this.FocalPoint[0];
    var y = this.FocalPoint[1];
    var z = this.FocalPoint[2];
    var w = this.GetWidth();
    var h = this.GetHeight();
 
    mat4.identity(this.Matrix);

    this.Matrix[0] = c;
    this.Matrix[1] = s*w/h;
    this.Matrix[4] =  -s;
    this.Matrix[5] =  c*w/h;
    this.Matrix[10]=  (this.ZRange[1]-this.ZRange[0])*0.5;
    this.Matrix[12]= -c*x + s*y;
    this.Matrix[13]= (w/h)*(-s*x - c*y);
    this.Matrix[14]=  -z + (this.ZRange[1]+this.ZRange[0])*0.25*w;
    this.Matrix[15]=  0.5*w;
}

Camera.prototype.Reset = function () {
    // Compute the bounds
    var bounds = [];
    bounds[0] = bounds[2] = bounds[4] = 0.0;
    bounds[1] = TILE_DIMENSIONS[0] * ROOT_SPACING[0];
    bounds[3] = TILE_DIMENSIONS[1] * ROOT_SPACING[1];
    bounds[5] = NUMBER_OF_SECTIONS * ROOT_SPACING[2];

    this.FocalPoint[0] = (bounds[0] + bounds[1]) * 0.5;
    this.FocalPoint[1] = (bounds[2] + bounds[3]) * 0.5;
    // We would need to set slice as well.
    //this.FocalPoint[2] = (bounds[4] + bounds[5]) * 0.5;
    this.Height = bounds[3]-bounds[2];
    this.ComputeMatrix();
}

Camera.prototype.Translate = function (dx,dy,dz) {
    this.FocalPoint[0] += dx;
    this.FocalPoint[1] += dy;
    this.FocalPoint[2] += dz;
    this.ComputeMatrix();
}

// Currenly assumes parallel projection and display z range = [-1,1].
// Also no rotation!
// a.k.a. This method does not work.
Camera.prototype.DisplayToWorld = function (x,y,z) {
    var scale = this.Height / this.ViewportHeight;
    x = x - (0.5*this.ViewportWidth);
    y = y - (0.5*this.ViewportHeight);
    var worldPt = [];
    worldPt[0] = this.FocalPoint[0] + (x * scale);
    worldPt[1] = this.FocalPoint[1] + (y * scale);
    worldPt[2] = this.FocalPoint[2] + (z * this.Height * 0.5);

    return worldPt;
}

Camera.prototype.AddPoint = function (x, y, z) {
    this.Points.push(x);
    this.Points.push(y);
    this.Points.push(z);
}

Camera.prototype.CreateBuffer = function () {
    if (this.Buffer != null) {
	GL.deleteBuffer(this.Buffer);
    }
    this.Buffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, this.Buffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.Points), 
                  GL.STATIC_DRAW);
}

// Getting rid of this.
Camera.prototype.UpdateBuffer = function() {
    this.Points = [];
    var cx = this.FocalPoint[0];
    var cy = this.FocalPoint[1];
    var rx = this.GetWidth() * 0.5;
    var ry = this.GetHeight() * 0.5;
    this.AddPoint(cx-rx, cy-ry);
    this.AddPoint(cx+rx, cy-ry);
    this.AddPoint(cx+rx, cy+ry);
    this.AddPoint(cx-rx, cy+ry);
    this.AddPoint(cx-rx, cy-ry);
    this.CreateBuffer();
}


// Camera is already set.
Camera.prototype.Draw = function (overviewCam, viewport) {
    var cx = this.FocalPoint[0];
    var cy = this.FocalPoint[1];
    var rx = this.GetWidth() * 0.5;
    var ry = this.GetHeight() * 0.5;

    // To handle rotation, I need to pass the center through
    // the overview camera matrix.
    var newCx = (cx*overviewCam.Matrix[0] + cy*overviewCam.Matrix[4] 
		 + overviewCam.Matrix[12]) / overviewCam.Matrix[15];
    var newCy = (cx*overviewCam.Matrix[1] + cy*overviewCam.Matrix[5] 
		 + overviewCam.Matrix[13]) / overviewCam.Matrix[15];

    // I having trouble using the overview camera, so lets just compute
    // the position of the rectangle here.
    var ocx = overviewCam.FocalPoint[0];
    var ocy = overviewCam.FocalPoint[1];
    var orx = overviewCam.GetWidth() * 0.5;
    var ory = overviewCam.GetHeight() * 0.5;


    program = polyProgram;
    GL.useProgram(program);
    GL.uniform3f(program.colorUniform, 0.9, 0.0, 0.9);

    GL.viewport(viewport[0],viewport[1],viewport[2],viewport[3]);
    mat4.identity(pMatrix);
    GL.uniformMatrix4fv(program.pMatrixUniform, false, pMatrix);

    var viewFrontZ = overviewCam.ZRange[0]+0.001;

    mat4.identity(mvMatrix);
    //mvMatrix[12] = ((cx-rx)-ocx)/orx;
    //mvMatrix[13] = ((cy-ry)-ocy)/ory;
    mvMatrix[12] = newCx-(rx/orx);
    mvMatrix[13] = newCy-(ry/ory);
    mvMatrix[14] = viewFrontZ;
    mvMatrix[0] = 2*rx/orx;
    mvMatrix[5] = 2*ry/ory;

    GL.bindBuffer(GL.ARRAY_BUFFER, squareOutlinePositionBuffer);
    GL.vertexAttribPointer(program.vertexPositionAttribute, 
    			   squareOutlinePositionBuffer.itemSize, 
    			   GL.FLOAT, false, 0, 0);    
    GL.uniformMatrix4fv(program.mvMatrixUniform, false, mvMatrix);
    GL.drawArrays(GL.LINE_STRIP, 0, squareOutlinePositionBuffer.numItems);
}






