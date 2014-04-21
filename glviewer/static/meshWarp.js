// Generic mesh. Arbitrary control points and arbitrary triangles.

// Source is the directory that contains the tile files.
// Points is an array of correlations (image and world coordinates).
// Triangles is an array of triples (indexes into the point array).
function meshWarp(points, triangles)
{
  this.Points = points;
  this.Triangles = triangles;
}

// Reference coordinate system triangle (0,0), (1,0), (0,1).
meshWarp.prototype.ComputePointParameters = function (inPt, trianglePoints)
{
  // choose point 0 for the origin.
  var p0 = inPt[0] - trianglePoints[0][0];
  var p1 = inPt[1] - trianglePoints[0][1];
  // Use the other two to create vectors.
  // Use the vectors to create a transform from reference to input coordinate system.
  var m00 = trianglePoints[1][0] - trianglePoints[0][0];
  var m10 = trianglePoints[1][1] - trianglePoints[0][1];
  var m01 = trianglePoints[2][0] - trianglePoints[0][0];
  var m11 = trianglePoints[2][1] - trianglePoints[0][1];
  // Compute the inverse transformation.
  var tmp = m00*m11 - m10*m01;
  if (tmp == 0.0) {
    return null;
  }
  // determinant
  tmp = 1.0 / tmp;
  // Now the inverse matrix
  var i00 = m11 * tmp;
  var i10 = -m10 * tmp;
  var i01 = -m01 * tmp;
  var i11 = m00 * tmp;
  // transform the input point to the reference coordinate system
  // Use the coordinates as weights for point 1 and point2.
  var w1 = p0*i00 + p1*i01;
  var w2 = p0*i10 + p1*i11;
  // Point 0 weights makes the sum t0 1.0;
  // Negative weights or weights over 1.0 imply the point is oputside the triangle.
  var w0 = 1.0 - w1 - w2;

  return [w0,w1,w2];
}


meshWarp.prototype.ComputeDistance = function(params) {
  // Compute a distance of point from the triangle.
  var tmp;
  var dist = 0.0;
  if (params[0] < 0.0) {
    tmp = -params[0];
    if (tmp > dist) { dist = tmp; }
  } else if (params[0] > 1.0) {
    tmp = params[0] - 1.0;
    if (tmp > dist) { dist = tmp; }
  }
  if (params[1] < 0.0) {
    tmp = -params[1];
    if (tmp > dist) { dist = tmp; }
  } else if (params[1] > 1.0) {
    tmp = params[1] - 1.0;
    if (tmp > dist) { dist = tmp; }
  }
  if (params[2] < 0.0) {
    tmp = -params[2];
    if (tmp > dist) { dist = tmp; }
  } else if (params[2] > 1.0) {
    tmp = params[2] - 1.0;
    if (tmp > dist) { dist = tmp; }
  }

  return dist;
}


// This method converts a point in image coordinates to a point in world coordinates.
meshWarp.prototype.ImageToWorld = function(imagePt)
{
  // If point is outside all triangles, choose the best / closest.
  var bestTriangleIds;
  var bestParams = null;
  var bestDist;
  var dist;
  // Find the triangle that contains the point.
  for (var i = 0; i < this.Triangles.length; ++i) {
    var triangleIds = this.Triangles[i];
    var trianglePoints = [this.Points[triangleIds[0]].ImagePt,
                          this.Points[triangleIds[1]].ImagePt,
                          this.Points[triangleIds[2]].ImagePt];
    // Params is an array of three weights.
    var params = this.ComputePointParameters(imagePt, trianglePoints);
    if (params) {
      // Compute a distance of point from the triangle.
      dist = this.ComputeDistance(params);
      if (dist == 0.0) {
        // Point is inside the triangle.
        // Compute the world point from the weights.
        var worldPt = [0.0, 0.0, 0.0];
        for (var j = 0; j < 2; ++j) {
          for (var k = 0; k < 3; ++k) {
            worldPt[j] += params[k] * this.Points[triangleIds[k]].WorldPt[j];
          }
        }
        return worldPt;
      } else { // Keep track of the best triangle.
        if (bestParams == null || dist < bestDist) {
          bestDist = dist;
          bestParams = params;
          bestTriangleIds = triangleIds;
        }
      }
    }
  }

  if (bestParams == null) {
    return null;
  }

  // Point is outside the mesh.  Use the closest / best triangle we could find.
  var worldPt = [0.0, 0.0, 0.0];
  for (var j = 0; j < 2; ++j) {
    for (var k = 0; k < 3; ++k) {
      worldPt[j] += bestParams[k] * this.Points[bestTriangleIds[k]].WorldPt[j];
    }
  }
  return worldPt;
}


// This method converts a point in world coordinates to a point in cache-image coordinates.
meshWarp.prototype.WorldToImage = function(worldPt) {
  // If point is outside all triangles, choose the best / closest.
  var bestTriangleIds;
  var bestParams = null;
  var bestDist;
  var dist;
  // Find the triangle that contains the point.
  for (var i = 0; i < this.Triangles.length; ++i) {
    var triangleIds = this.Triangles[i];
    var trianglePoints = [this.Points[triangleIds[0]].WorldPt,
                          this.Points[triangleIds[1]].WorldPt,
                          this.Points[triangleIds[2]].WorldPt];
    // Params is an array of three weights.
    var params = this.ComputePointParameters(worldPt, trianglePoints);
    if (params) {
      dist = this.ComputeDistance(params);
      if (dist == 0.0) {
        // Point is inside the triangle.
        // Compute the world point from the weights.
        var imagePt = [0.0, 0.0, 0.0];
        for (var j = 0; j < 2; ++j) {
          for (var k = 0; k < 3; ++k) {
            imagePt[j] += params[k] * this.Points[triangleIds[k]].ImagePt[j];
          }
        }
        return imagePt;
      } else { // Keep track of the best triangle.
        if (bestParams == null || dist < bestDist) {
          bestDist = dist;
          bestParams = params;
          bestTriangleIds = triangleIds;
        }
      }
    }
  }

  if (bestParams == null) {
    return null;
  }

  // This is problematic. It causes the boundary tiles to be wrong.
  // Point is outside the mesh.  Use the closest / best triangle we could find.
  var imagePt = [0.0, 0.0, 0.0];
  for (var j = 0; j < 2; ++j) {
    for (var k = 0; k < 3; ++k) {
      imagePt[j] += bestParams[k] * this.Points[bestTriangleIds[k]].ImagePt[j];
    }
  }
  return imagePt;
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
  var pointId = 0; // Keep track to the first loop point id. (for triangulation)
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
      // Now we have to triangulate loop and append.
      // Intersection of the rectangle and triangle is always convex.
      // Convert the loop to world points and texture coordinates.
      for (var j = 0; j < loop.length; ++j) {
        var worldPoint = this.ImageToWorld(loop[j]);
        if ( ! worldPoint) {
          vertexPositionData.length = tCoordsData.length = cellData.length = 0;
          return;
        }
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





