// cross hairs was created as an anchor for text.
// Just two lines that cross at a point.
// I am not goint to support line width, or fillColor.
// Shape seems to define lines in a loop, so I will create a loop for now.


function CrossHairs() {
  Shape.call(this);
  this.Length = 50; // Length of the crosing lines
  this.Width = 1; // Width of the cross hair lines.
  this.Origin = [10000,10000]; // position in world coordinates.
	this.FillColor    = [0,0,0]; 
	this.OutlineColor = [1,1,1]; 
};
CrossHairs.prototype = new Shape;

CrossHairs.prototype.destructor=function() {
  // Get rid of the buffers?
}

CrossHairs.prototype.UpdateBuffers = function() {
  var vertexPositionData = [];
  var cellData = [];
  var halfLength = (this.Length * 0.5) + 0.5;
  var halfWidth = (this.Width * 0.5) + 0.5;

  this.Matrix = mat4.create();
  mat4.identity(this.Matrix);

  vertexPositionData.push(-halfWidth);
  vertexPositionData.push(-halfWidth);
  vertexPositionData.push(0.0);

  vertexPositionData.push(-halfLength);
  vertexPositionData.push(-halfWidth);
  vertexPositionData.push(0.0);

  vertexPositionData.push(-halfLength);
  vertexPositionData.push(halfWidth);
  vertexPositionData.push(0.0);

  vertexPositionData.push(-halfWidth);
  vertexPositionData.push(halfWidth);
  vertexPositionData.push(0.0);
  
  vertexPositionData.push(-halfWidth);
  vertexPositionData.push(halfLength);
  vertexPositionData.push(0.0);
  
  vertexPositionData.push(halfWidth);
  vertexPositionData.push(halfLength);
  vertexPositionData.push(0.0);
  
  vertexPositionData.push(halfWidth);
  vertexPositionData.push(halfWidth);
  vertexPositionData.push(0.0);
  
  vertexPositionData.push(halfLength);
  vertexPositionData.push(halfWidth);
  vertexPositionData.push(0.0);
  
  vertexPositionData.push(halfLength);
  vertexPositionData.push(-halfWidth);
  vertexPositionData.push(0.0);
  
  vertexPositionData.push(halfWidth);
  vertexPositionData.push(-halfWidth);
  vertexPositionData.push(0.0);
  
  vertexPositionData.push(halfWidth);
  vertexPositionData.push(-halfLength);
  vertexPositionData.push(0.0);
  
  vertexPositionData.push(-halfWidth);
  vertexPositionData.push(-halfLength);
  vertexPositionData.push(0.0);
  
  vertexPositionData.push(-halfWidth);
  vertexPositionData.push(-halfWidth);
  vertexPositionData.push(0.0);

  cellData.push(1);
  cellData.push(2);
  cellData.push(7);
  
  cellData.push(1);
  cellData.push(7);
  cellData.push(8);
  
  cellData.push(4);
  cellData.push(5);
  cellData.push(10);
  
  cellData.push(4);
  cellData.push(10);
  cellData.push(11);
  
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
}
