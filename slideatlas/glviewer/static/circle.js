
function Circle() {
    Shape.call(this);
    this.Radius = 10; // Radius in pixels
    this.Origin = [10000,10000]; // Center in world coordinates.
    this.OutlineColor = [0,0,0];
};
Circle.prototype = new Shape;



Circle.prototype.destructor=function() {
    // Get rid of the buffers?
}

Circle.prototype.UpdateBuffers = function() {
  var vertexPositionData = [];
  var cellData = [];
  var lineCellData = [];
  var numEdges = Math.floor(this.Radius/2)+10;
  // NOTE: numEdges logic will not work in world coordinates.
  // Limit numEdges to 180 to mitigate this issue.
  if (numEdges > 50 || ! this.FixedSize ) {
    numEdges = 50;
  }

  this.Matrix = mat4.create();
  mat4.identity(this.Matrix);

  if (this.LineWidth == 0) {
    for (var i = 0; i <= numEdges; ++i) {
      var theta = i*2*3.14159265359/numEdges;
      vertexPositionData.push(this.Radius*Math.cos(theta));
      vertexPositionData.push(this.Radius*Math.sin(theta));
      vertexPositionData.push(0.0);
    }
	
    // Now create the triangles    
    // It would be nice to have a center point, 
    // but this would mess up the outline.
    for (var i = 2; i < numEdges; ++i) {
      cellData.push(0);
      cellData.push(i-1);
      cellData.push(i);
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
  } else {
    //var minRad = this.Radius - (this.LineWidth/2.0);
    //var maxRad = this.Radius + (this.LineWidth/2.0);
    var minRad = this.Radius;
    var maxRad = this.Radius + this.LineWidth;
    for (var i = 0; i <= numEdges; ++i) {
	    var theta = i*2*3.14159265359/numEdges;
	    vertexPositionData.push(minRad*Math.cos(theta));
	    vertexPositionData.push(minRad*Math.sin(theta));
	    vertexPositionData.push(0.0);
	    vertexPositionData.push(maxRad*Math.cos(theta));
	    vertexPositionData.push(maxRad*Math.sin(theta));
	    vertexPositionData.push(0.0);
    }
    this.VertexPositionBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertexPositionData), GL.STATIC_DRAW);
    this.VertexPositionBuffer.itemSize = 3;
    this.VertexPositionBuffer.numItems = vertexPositionData.length / 3;

    // Now create the fill triangles    
    // It would be nice to have a center point, 
    // but this would mess up the outline.
    for (var i = 2; i < numEdges; ++i) {
	    cellData.push(0);
	    cellData.push((i-1)*2);
	    cellData.push(i*2);
    }
    this.CellBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), GL.STATIC_DRAW);
    this.CellBuffer.itemSize = 1;
    this.CellBuffer.numItems = cellData.length;

    // Now the thick line
    for (var i = 0; i < numEdges; ++i) {
	    lineCellData.push(0 + i*2);
	    lineCellData.push(1 + i*2);
	    lineCellData.push(2 + i*2);
	    lineCellData.push(1 + i*2);
	    lineCellData.push(3 + i*2);
	    lineCellData.push(2 + i*2);
    }
    this.LineCellBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.LineCellBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineCellData), GL.STATIC_DRAW);
    this.LineCellBuffer.itemSize = 1;
    this.LineCellBuffer.numItems = lineCellData.length;
  }
}