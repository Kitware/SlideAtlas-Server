// Generic mesh. Arbitrary control points and arbitrary triangles.

// Source is the directory that contains the tile files.
// Points is an array of correlations (image and world coordinates).
// Triangles is an array of triples (indexes into the point array).
function meshWarp(points, triangles)
{
  this.Points = points;
  this.Triangles = triangles;
}


// This method converts a point in image coordinates to a point in world coordinates.
meshWarp.prototype.ImageToWorld = function(imagePt) {
  // Find the triangle that contains the point.
  for (var i = 0; i < this.Triangles; ++i) {
    var triangleIds = this.Triangles[i];
    var trianglePoints = [this.Points[triangleIds[0]].ImagePt,
                          this.Points[triangleIds[1]].ImagePt,
                          this.Points[triangleIds[2]].ImagePt];
    // Params is an array of three weights.
    var params = this.ComputePointParameters(imagePt, trianglePoints);
    if (params[0] >= 0.0 && params[1] >= 0.0 && params[2] >= 0.0 &&
        params[0] <= 1.0 && params[1] <= 1.0 && params[2] <= 1.0) {
      // Point is inside the triangle.
      // Compute the world point from the weights.
      var worldPt = [0.0, 0.0, 0.0];
      for (var j = 0; j < 2; ++j) {
        for (var k = 0; k < 3; ++k) {
          worldPt[j] += params[k] * this.Points[triangleIds[k]].WorldPt[j];
        } 
      }
      return worldPt;
    }

  // The correct behavior is to use the "best" triangle we could find.
  alert("Image point is outside all triangles");
  return [0.0, 0.0, 0.0];
}


// This method converts a point in world coordinates to a point in cache-image coordinates.
meshWarp.prototype.WorldToImage = function(worldPt) {
  // Find the triangle that contains the point.
  for (var i = 0; i < this.Triangles; ++i) {
    var triangleIds = this.Triangles[i];
    var trianglePoints = [this.Points[triangleIds[0]].WorldPt,
                          this.Points[triangleIds[1]].WorldPt,
                          this.Points[triangleIds[2]].WorldPt];
    // Params is an array of three weights.
    var params = this.ComputePointParameters(worldPt, trianglePoints);
    if (params[0] >= 0.0 && params[1] >= 0.0 && params[2] >= 0.0 &&
        params[0] <= 1.0 && params[1] <= 1.0 && params[2] <= 1.0) {
      // Point is inside the triangle.
      // Compute the world point from the weights.
      var imagePt = [0.0, 0.0, 0.0];
      for (var j = 0; j < 2; ++j) {
        for (var k = 0; k < 3; ++k) {
          imagePt[j] += params[k] * this.Points[triangleIds[k]].ImagePt[j];
        } 
      }
      return imagePt;
    }

  // The correct behavior is to use the "best" triangle we could find.
  alert("World point is outside all triangles");
  return [0.0, 0.0, 0.0];
}


// Clip loop with a line (vector, offset).
// Loop is just an array of points (
meshWarp.prototype.ClipLoop = function (offset, normal, loop) {
  if (loop.length < 1) {
    return loop;
  }

  var clippedLoop = [];
  
  // Iterate over the edges.
  var i0 = loop.length - 1;
  var dot0 = loop[i0][0]*normal[0] + loop[i0][1]*normal[1] - offset;
  for (var i1 = 0; i1 < loop.length; ++i1) {
    // This is more general than necessary (to reduce code duplication).
    // The normals are axis alignmed.
    var dot1 = loop[i1][0]*normal[0] + loop[i1][1]*normal[1] - offset;
    // Check for intersction with the edge.
    if ((dot0 < 0.0 && dot1 > 0.0) || (dot1 < 0.0 && dot0 > 0.0)) {
      var k = dot0 / (dot0-dot1);
      var intersection = [];
      intersection.push((1.0-k)*loop[i0][0] + k*loop[i1][0]);
      intersection.push((1.0-k)*loop[i0][1] + k*loop[i1][1]);
      clippedLoop.push(intersection);
    }
    if (dot1 >= 0.0) {
      clippedLoop.push(loop[i1]);
    }
    dot0 = dot1;
    i0 = i1;
  }

  return clippedLoop;
}


// Warp loop is used to create the tile loop / mesh.
// bds are input bounds (xMin,xMax, yMin,yMax) in image coordinates.
// vertexPositionData, tCoordsData, cellData are all output arrays
// I am not going to bother sharing points.
meshWarp.prototype.CreateMeshFromBounds = function(bds, vertexPositionData, tCoordsData, cellData) {
  // Clip each triangle.
  for (var i1 = 0; i1 < this.Triangles.length; ++i1) {
    var triIds = this.Triangles[i1];
    var loop = [];
    loop.push(this.Points[triIds[0]].ImagePt);
    loop.push(this.Points[triIds[1]].ImagePt);
    loop.push(this.Points[triIds[2]].ImagePt);

    loop = this.ClipLoop( bds[0], [ 1,0], loop); 
    loop = this.ClipLoop(-bds[1], [-1,0], loop); 
    loop = this.ClipLoop( bds[2], [0, 1], loop); 
    loop = this.ClipLoop(-bds[3], [0,-1], loop); 

    if (loop.length >= 3) { // we need at least 1 triangle.
      // Now we have to triangulate and append. 
      // Intersection of the rectangle and triangle is convex.
      // Convert the loop to world points and texture coordinates.
      for (var j = 0; j < loop.length; ++j) {
        var worldPoint = this.ImageToWorld(loop[j]);
        vertexPositionData.push(worldPoint[0]);
        vertexPositionData.push(worldPoint[1]);
        vertexPositionData.push(- bds[4] / 20.0);
        var x = (loop[j][0]-bds[0]) / (bds[1]-bds[0]);
        var y = (loop[j][1]-bds[2]) / (bds[3]-bds[2]);
        tCoordsData.push(x);
        tCoordsData.push(y);      
      }
      // Now add the triangles (first point connects to all the others).
      var j0 = 1;
      for (var j1 = 2; j1 < loop.length; ++j1) {
        cellData.push(pointId);
        cellData.push(pointId + j0);
        cellData.push(pointId + j1);
        j0 = j1;
      }
      pointId += loop.length;
    }
  }
}





