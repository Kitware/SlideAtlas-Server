// Polygon mesh

(function () {
    "use strict";


    function Mesh() {
        SA.Shape.call(this);
        this.Origin = [0.0,0.0]; // Center in world coordinates.
        this.Points = [];
        // This could be generalized to polygons maybe.
        this.Triangles = [];
    };
    Mesh.prototype = new SA.Shape;


    Mesh.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    Mesh.prototype.UpdateBuffers = function(view) {
        var vertexPositionData = [];
        var cellData = [];

        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        for (var i = 0; i < this.Points.length; ++i) {
            vertexPositionData.push(this.Points[i][0]);
            vertexPositionData.push(this.Points[i][1]);
            vertexPositionData.push(-10.0);
        }

        for (var i = 0; i < this.Triangles.length; ++i) {
            cellData.push(this.Triangles[i][0]);
            cellData.push(this.Triangles[i][1]);
            cellData.push(this.Triangles[i][2]);
        }

        this.VertexPositionBuffer = view.gl.createBuffer();
        view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), view.gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = vertexPositionData.length / 3;

        this.CellBuffer = view.gl.createBuffer();
        view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
        view.gl.bufferData(view.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), view.gl.STATIC_DRAW);
        this.CellBuffer.itemSize = 1;
        this.CellBuffer.numItems = cellData.length;
    }

    SA.Mesh = Mesh;

})();
