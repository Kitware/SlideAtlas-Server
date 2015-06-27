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



// Returns 0 if is does not overlap at all.
// Returns 1 if part of the section is in the bounds.
// Returns 2 if all of the section is in the bounds.
Polyline.prototype.ContainedInBounds = function(bds) {
    // Polyline does not cache bounds, so just look to the points.

    var pointsIn = false;
    var pointsOut = false;
    for (j = 0; j < this.Points.length; ++j) {
        var pt = this.Points[j];
        if (bds[0] < pt[0] && pt[0] < bds[1] &&
            bds[2] < pt[1] && pt[1] < bds[3]) {
            pointsIn = true;
        } else {
            pointsOut = true;
        }
        if (pointsIn && pointsOut) {
            return 1;
        }
    }

    if (pointsIn) {
        return 2;
    }
    return 0;
}


// The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
// Pass in the spacing as a hint to get rid of aliasing.
Polyline.prototype.Decimate = function (spacing) {
    // Keep looping over the line removing points until the line does not change.
    var modified = true;
    while (modified) {
        modified = false;
        var newPoints = [];
        newPoints.push(this.Points[0]);
        // Window of four points.
        var i = 3;
        while (i < this.Points.length) {
            var p0 = this.Points[i];
            var p1 = this.Points[i-1];
            var p2 = this.Points[i-2];
            var p3 = this.Points[i-3];
            // Compute the average of the center two.
            var cx = (p1[0] + p2[0]) * 0.5;
            var cy = (p1[1] + p2[1]) * 0.5;
            // Find the perendicular normal.
            var nx = (p0[1] - p3[1]);
            var ny = -(p0[0] - p3[0]);
            var mag = Math.sqrt(nx*nx + ny*ny);
            nx = nx / mag;
            ny = ny / mag;
            mag = Math.abs(nx*(cx-this.Points[i-3][0]) + ny*(cy-this.Points[i-3][1]));
            // Mag metric does not distinguish between line and a stroke that double backs on itself.
            // Make sure the two point being merged are between the outer points 0 and 3.
            var dir1 = (p0[0]-p1[0])*(p3[0]-p1[0]) + (p0[1]-p1[1])*(p3[1]-p1[1]);
            var dir2 = (p0[0]-p2[0])*(p3[0]-p2[0]) + (p0[1]-p2[1])*(p3[1]-p2[1]);
            if (mag < spacing && dir1 < 0.0 && dir2 < 0.0) {
                // Replace the two points with their average.
                newPoints.push([cx, cy]);
                modified = true;
                // Skip the next point the window will have one old merged point,
                // but that is ok because it is just used as reference and not altered.
                i += 2;
            } else {
                //  No modification.  Just move the window one.
                newPoints.push(this.Points[i-2]);
                ++i;
            }
        }
        // Copy the remaing point / 2 points
        i = i-2;
        while (i < this.Points.length) {
            newPoints.push(this.Points[i]);
            ++i;
        }
        this.Points = newPoints;
    }
    this.UpdateBuffers();
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




// Saves images centered at spots on the edge.
// Roll is set to put the edge horizontal.
// Step is in screen pixel units
// Count is the starting index for file name generation.
Polyline.prototype.SampleEdge = function(viewer, dim, step, count) {
    var cam = viewer.GetCamera();
    var scale = cam.GetHeight() / cam.ViewportHeight;
    // Convert the step from screen pixels to world.
    step *= scale;
    var cache = viewer.GetCache();
    var dimensions = [dim,dim];
    // Distance between edge p0 to next sample point.
    var remaining = step/2;
    // Recursive to serialize asynchronous cutouts.
    this.RecursiveSampleEdge(this.Points.length-1,0,remaining,step,count,
                             cache,dimensions,scale);
}
Polyline.prototype.RecursiveSampleEdge = function(i0,i1,remaining,step,count,
                                                  cache,dimensions,scale) {
    var pt0 = this.Points[i0];
    var pt1 = this.Points[i1];
    // Compute the length of the edge.
    var dx = pt1[0]-pt0[0];
    var dy = pt1[1]-pt0[1];
    var length = Math.sqrt(dx*dx +dy*dy);
    // Take steps along the edge (size 'step')
    if (remaining > length) {
        // We passed over this edge. Move to the next edge.
        remaining = remaining - length;
        i0 = i1;
        i1 += 1;
        // Test for terminating condition.
        if (i1 < this.Points.length) {
            this.RecursiveSampleEdge(i0,i1,remaining,step, count,
                                     cache,dimensions,scale);
        }
    } else {
        var self = this;
        // Compute the sampel point and tangent on this edge.
        var edgeAngle = -Math.atan2(dy,dx);
        var k = remaining / length;
        var x = pt0[0] + k*(pt1[0]-pt0[0]);
        var y = pt0[1] + k*(pt1[1]-pt0[1]);
        // Save an image at this sample point.
        GetCutoutImage(cache,dimensions,[x,y],scale,edgeAngle,"edge"+count+".png",
                       function () {
                           ++count;
                           remaining += step;
                           self.RecursiveSampleEdge(i0,i1,remaining,step,count,
                                                    cache,dimensions,scale);
                       });
    }
}
