// Poly line

function Polyline() {
    Shape.call(this);
    this.Origin = [0.0,0.0]; // Center in world coordinates.
    this.Points = [];
};
Polyline.prototype = new Shape;


Polyline.prototype.destructor=function() {
    // Get rid of the buffers?
}

Polyline.prototype.UpdateBuffers = function() {
  var vertexPositionData = [];
  var cellData = [];
  var lineCellData = [];

  this.Matrix = mat4.create();
  mat4.identity(this.Matrix);

  if (this.LineWidth == 0) {
    for (var i = 0; i < this.Points.length; ++i) {
      vertexPositionData.push(this.Points[i][0]);
      vertexPositionData.push(this.Points[i][1]);
      vertexPositionData.push(0.0);
    }
    // Not used for line width == 0.
    for (var i = 2; i < this.Points.length; ++i) {
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
    var end = this.Points.length-1;
    // Compute the edge normals.
    for (var i = 0; i < end; ++i) {
      x = this.Points[i+1][0] - this.Points[i][0];
      y = this.Points[i+1][1] - this.Points[i][1];
      mag = Math.sqrt(x*x + y*y);
      edgeNormals.push([-y/mag,x/mag]);
    }

    if(end > 0){
      var half = this.LineWidth / 2.0;
      // 4 corners per point
      var dx = edgeNormals[0][0]*half;
      var dy = edgeNormals[0][1]*half;
      vertexPositionData.push(this.Points[0][0] - dx);
      vertexPositionData.push(this.Points[0][1] - dy);
      vertexPositionData.push(0.0);
      vertexPositionData.push(this.Points[0][0] + dx);
      vertexPositionData.push(this.Points[0][1] + dy);
      vertexPositionData.push(0.0);
      for (var i = 1; i < end; ++i) {
        vertexPositionData.push(this.Points[i][0] - dx);
        vertexPositionData.push(this.Points[i][1] - dy);
        vertexPositionData.push(0.0);
        vertexPositionData.push(this.Points[i][0] + dx);
        vertexPositionData.push(this.Points[i][1] + dy);
        vertexPositionData.push(0.0);
        dx = edgeNormals[i][0]*half;
        dy = edgeNormals[i][1]*half;
        vertexPositionData.push(this.Points[i][0] - dx);
        vertexPositionData.push(this.Points[i][1] - dy);
        vertexPositionData.push(0.0);
        vertexPositionData.push(this.Points[i][0] + dx);
        vertexPositionData.push(this.Points[i][1] + dy);
        vertexPositionData.push(0.0);
      }
      vertexPositionData.push(this.Points[end][0] - dx);
      vertexPositionData.push(this.Points[end][1] - dy);
      vertexPositionData.push(0.0);
      vertexPositionData.push(this.Points[end][0] + dx);
      vertexPositionData.push(this.Points[end][1] + dy);
      vertexPositionData.push(0.0);
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
    for (var i = 2; i < this.Points.length; ++i) {
      cellData.push(0);
      cellData.push((2*i)-1);
      cellData.push(2*i);
    }
  }

  this.VertexPositionBuffer = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertexPositionData), GL.STATIC_DRAW);
  this.VertexPositionBuffer.itemSize = 3;
  this.VertexPositionBuffer.numItems = vertexPositionData.length / 3;

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
