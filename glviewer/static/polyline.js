// Poly line

function Polyline() {
    Shape.call(this);
    this.Origin = [0.0,0.0]; // Center in world coordinates.
    this.Points = [];
    this.Closed = false;
};
Polyline.prototype = new Shape;


Polyline.prototype.destructor=function() {
    // Get rid of the buffers?
}

Polyline.prototype.GetBounds = function () {
    if (this.Points.length == 0) {
        return [0,-1,0,-1];
    }
    var bds = [this.Points[0][0], this.Points[0][0],
               this.Points[0][1], this.Points[0][1]];
    for (var i = 1; i < this.Points.length; ++i) {
        var pt = this.Points[i];
        if (pt[0] < bds[0]) bds[0] = pt[0];
        if (pt[0] > bds[1]) bds[1] = pt[0];
        if (pt[1] < bds[2]) bds[2] = pt[1];
        if (pt[1] > bds[3]) bds[3] = pt[1];
    }
    return bds;
}

Polyline.prototype.UpdateBuffers = function() {
  var points = this.Points.slice(0);
  if (this.Closed && points.length > 2) {
    points.push(points[0]);
  }

  this.PointBuffer = [];
  var cellData = [];
  var lineCellData = [];

  this.Matrix = mat4.create();
  mat4.identity(this.Matrix);

  if (this.LineWidth == 0 || !GL ) {
    for (var i = 0; i < points.length; ++i) {
      this.PointBuffer.push(points[i][0]);
      this.PointBuffer.push(points[i][1]);
      this.PointBuffer.push(0.0);
    }
    // Not used for line width == 0.
    for (var i = 2; i < points.length; ++i) {
      cellData.push(0);
      cellData.push(i-1);
      cellData.push(i);
    }
  } else {
    // Compute a list normals for middle points.
    var edgeNormals = [];
    var mag;
    var x;
    var y;
    var end = points.length-1;
    // Compute the edge normals.
    for (var i = 0; i < end; ++i) {
      x = points[i+1][0] - points[i][0];
      y = points[i+1][1] - points[i][1];
      mag = Math.sqrt(x*x + y*y);
      edgeNormals.push([-y/mag,x/mag]);
    }

    if ( end > 0 ) {
      var half = this.LineWidth / 2.0;
      // 4 corners per point
      var dx = edgeNormals[0][0]*half;
      var dy = edgeNormals[0][1]*half;
      this.PointBuffer.push(points[0][0] - dx);
      this.PointBuffer.push(points[0][1] - dy);
      this.PointBuffer.push(0.0);
      this.PointBuffer.push(points[0][0] + dx);
      this.PointBuffer.push(points[0][1] + dy);
      this.PointBuffer.push(0.0);
      for (var i = 1; i < end; ++i) {
        this.PointBuffer.push(points[i][0] - dx);
        this.PointBuffer.push(points[i][1] - dy);
        this.PointBuffer.push(0.0);
        this.PointBuffer.push(points[i][0] + dx);
        this.PointBuffer.push(points[i][1] + dy);
        this.PointBuffer.push(0.0);
        dx = edgeNormals[i][0]*half;
        dy = edgeNormals[i][1]*half;
        this.PointBuffer.push(points[i][0] - dx);
        this.PointBuffer.push(points[i][1] - dy);
        this.PointBuffer.push(0.0);
        this.PointBuffer.push(points[i][0] + dx);
        this.PointBuffer.push(points[i][1] + dy);
        this.PointBuffer.push(0.0);
      }
      this.PointBuffer.push(points[end][0] - dx);
      this.PointBuffer.push(points[end][1] - dy);
      this.PointBuffer.push(0.0);
      this.PointBuffer.push(points[end][0] + dx);
      this.PointBuffer.push(points[end][1] + dy);
      this.PointBuffer.push(0.0);
    }
    // Generate the triangles for a thick line
    for (var i = 0; i < end; ++i) {
      lineCellData.push(0 + 4*i);
      lineCellData.push(1 + 4*i);
      lineCellData.push(3 + 4*i);
      lineCellData.push(0 + 4*i);
      lineCellData.push(3 + 4*i);
      lineCellData.push(2 + 4*i);
    }

    // Not used.
    for (var i = 2; i < points.length; ++i) {
      cellData.push(0);
      cellData.push((2*i)-1);
      cellData.push(2*i);
    }
  }

  if (GL) {
    this.VertexPositionBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.PointBuffer), GL.STATIC_DRAW);
    this.VertexPositionBuffer.itemSize = 3;
    this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

    this.CellBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), GL.STATIC_DRAW);
    this.CellBuffer.itemSize = 1;
    this.CellBuffer.numItems = cellData.length;

    if (this.LineWidth != 0) {
      this.LineCellBuffer = GL.createBuffer();
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.LineCellBuffer);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineCellData), GL.STATIC_DRAW);
      this.LineCellBuffer.itemSize = 1;
      this.LineCellBuffer.numItems = lineCellData.length;
    }
  }
}
