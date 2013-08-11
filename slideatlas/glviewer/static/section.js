//==============================================================================
// Section Object
function Section () {
  // Warping to allign this section with previous / next.
  // This is only a metrix transformation.
  this.Matrix = mat4.create();
  mat4.identity(this.Matrix);
  // The list of caches is really just a list of images in the montage.
  this.Caches = [];
  // For debugging stitching.
  this.Markers = [];  
}


Section.prototype.LoadRoots = function () {
  for (var cIdx = 0; cIdx < this.Caches.length; ++cIdx) {
    var cache = this.Caches[cIdx];
    if (cache) {
      cache.LoadRoots();
    }
  }
}



// I do not like passing in the whole view.
// Could we get away with just passing the camera?
// No, we need the viewport too.
// Could the viewport be part of the camera?
Section.prototype.Draw = function (view) {
  for (var cIdx = 0; cIdx < this.Caches.length; ++cIdx) {
    var cache = this.Caches[cIdx];
    // Select the tiles to render first.
    var tiles = cache.ChooseTiles(view, SLICE);

    var program = imageProgram;
    GL.useProgram(program);

    // Draw tiles.
    // Adjust the camera to the cache origin.
    //camera is: [cam][section][image]
    var camMatrix = mat4.create(view.Camera.Matrix);
    mat4.multiply(camMatrix,this.Matrix);
    // Concatentate the image translation.
    camMatrix[12] += camMatrix[0]*cache.Origin[0] + camMatrix[4]*cache.Origin[1];     
    camMatrix[13] += camMatrix[1]*cache.Origin[0] + camMatrix[5]*cache.Origin[1];     

    GL.uniformMatrix4fv(program.pMatrixUniform, false, camMatrix);
    for (var i = 0; i < tiles.length; ++i) {
      tiles[i].Draw(program);
    }
  }
}

// This load tiles in the vies like draw but does not render them.
// I want to preload tiles in the next section.
Section.prototype.LoadTilesInView = function (view) {
  for (var cIdx = 0; cIdx < this.Caches.length; ++cIdx) {
    var cache = this.Caches[cIdx];
    // Select the tiles to load (loading is a byproduct).
    var tiles = cache.ChooseTiles(view, SLICE);
  }
}





