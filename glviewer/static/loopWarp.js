// Mesh: loop with one point in the middle.


// Source is the directory that contains the tile files.
function LoopWarp(loop, loopCenter)
{
  this.Loop = loop;
  this.LoopCenter = loopCenter;
}


// This method converts a point in image coordinates to a point in world coordinates.
LoopWarp.prototype.ImageToWorld = function(imagePt) {
  if (this.Loop.length == 0) {
    // Just shift by the origin.
    // Assume spacing is 1.
    return [imagePt[0]+this.Origin[0], imagePt[1]+this.Origin[1]];
  }

  // move center to the origin.
  var px = imagePt[0] - this.LoopCenter.ImagePt[0];
  var py = imagePt[1] - this.LoopCenter.ImagePt[1];
  
  // Iterate ovver the wedges of the loop.
  var i0 = this.Loop.length - 1;
  var v0 = [this.Loop[i0].ImagePt[0]-this.LoopCenter.ImagePt[0], this.Loop[i0].ImagePt[1]-this.LoopCenter.ImagePt[1]]; 
  for (var i1 = 0; i1 < this.Loop.length; ++i1) {
    // Find the two bounding vectors of the wedge.
    var v1 = [this.Loop[i1].ImagePt[0]-this.LoopCenter.ImagePt[0], this.Loop[i1].ImagePt[1]-this.LoopCenter.ImagePt[1]]; 
    // Find the linear combination of the vectors that equals the point. (inver the matrix [v0 v1])
    var d = (v0[0]*v1[1] - v1[0]*v0[1]);
    var k0 = (v1[1]*px - v1[0]*py) / d;
    var k1 = (v0[0]*py - v0[1]*px) / d;
    if (k0 >= 0.0 && k1 >= 0.0) {
      // Both vector components are positive point lies in the wedge (1 quad of basis space).
      // Find corresponding vectors in world space.
      var w0 = [this.Loop[i0].WorldPt[0]-this.LoopCenter.WorldPt[0], this.Loop[i0].WorldPt[1]-this.LoopCenter.WorldPt[1]]; 
      var w1 = [this.Loop[i1].WorldPt[0]-this.LoopCenter.WorldPt[0], this.Loop[i1].WorldPt[1]-this.LoopCenter.WorldPt[1]]; 
      return [k0*w0[0] + k1*w1[0] + this.LoopCenter.WorldPt[0], k0*w0[1] + k1*w1[1] + this.LoopCenter.WorldPt[1]]; 
    }
    v0 = v1;
    i0 = i1;
  }
  alert("ImageToWorld failed (numerical issue?)");
  return this.LoopCenter.WorldPt;
}

// This method converts a point in world coordinates to a point in cache-image coordinates.
LoopWarp.prototype.WorldToImage = function(worldPt) {
  if (this.Loop.length == 0) {
    // Just shift by the origin.
    // Assume spacing is 1.
    return [worldPt[0]-this.Origin[0], worldPt[1]-this.Origin[1]];
  }

  // move center to the origin.
  var px = worldPt[0] - this.LoopCenter.WorldPt[0];
  var py = worldPt[1] - this.LoopCenter.WorldPt[1];
  
  // Iterate ovver the wedges of the loop.
  var i0 = this.Loop.length - 1;
  var v0 = [this.Loop[i0].WorldPt[0]-this.LoopCenter.WorldPt[0], this.Loop[i0].WorldPt[1]-this.LoopCenter.WorldPt[1]]; 
  for (var i1 = 0; i1 < this.Loop.length; ++i1) {
    // Find the two bounding vectors of the wedge.
    var v1 = [this.Loop[i1].WorldPt[0]-this.LoopCenter.WorldPt[0], this.Loop[i1].WorldPt[1]-this.LoopCenter.WorldPt[1]]; 
    // Find the linear combination of the vectors that equals the point. (inver the matrix [v0 v1])
    var d = (v0[0]*v1[1] - v1[0]*v0[1]);
    var k0 = (v1[1]*px - v1[0]*py) / d;
    var k1 = (v0[0]*py - v0[1]*px) / d;
    if (k0 >= 0.0 && k1 >= 0.0) {
      // Both vector components are positive point lies in the wedge (1 quad of basis space).
      // Find corresponding vectors in world space.
      var w0 = [this.Loop[i0].ImagePt[0]-this.LoopCenter.ImagePt[0], this.Loop[i0].ImagePt[1]-this.LoopCenter.ImagePt[1]]; 
      var w1 = [this.Loop[i1].ImagePt[0]-this.LoopCenter.ImagePt[0], this.Loop[i1].ImagePt[1]-this.LoopCenter.ImagePt[1]]; 
      return [k0*w0[0] + k1*w1[0] + this.LoopCenter.ImagePt[0], k0*w0[1] + k1*w1[1] + this.LoopCenter.ImagePt[1]]; 
    }
    v0 = v1;
    i0 = i1;
  }
  alert("WorldToImage failed (numerical issue?)");
  return this.LoopCenter.ImagePt;
}


// Clip loop with a line (vector, offset).
LoopWarp.prototype.ClipLoop = function (offset, normal, loop) {
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
LoopWarp.prototype.CreateMeshFromBounds = function(bds, vertexPositionData, tCoordsData, cellData) {
  // Clip each loop triangle.
  var pointId = 0; // Keep track to the first loop point id. (for triangulation)
  var i0 = this.Loop.length - 1;
  for (var i1 = 0; i1 < this.Loop.length; ++i1) {
    var loop = [];
    loop.push(this.LoopCenter.ImagePt);
    loop.push(this.Loop[i0].ImagePt);
    loop.push(this.Loop[i1].ImagePt);
    i0 = i1;
    loop = this.ClipLoop( bds[0], [ 1,0], loop); 
    loop = this.ClipLoop(-bds[1], [-1,0], loop); 
    loop = this.ClipLoop( bds[2], [0, 1], loop); 
    loop = this.ClipLoop(-bds[3], [0,-1], loop); 

    if (loop.length >= 3) { // we need at least 1 triangle.
      // Now we have to append the triangles. 
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





