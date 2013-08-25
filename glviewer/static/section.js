//==============================================================================
// Section Object
function Section () {
  // Warping to align this section with previous / next.
  // This is only a matrix transformation.
  this.Matrix = mat4.create();
  mat4.identity(this.Matrix);
  // The list of caches is really just a list of images in the montage.
  this.Caches = [];
  // For debugging stitching.
  this.Markers = [];
  
  this.Bounds = [0,10000,0,10000];
}


Section.prototype.LoadRoots = function () {
  for (var cIdx = 0; cIdx < this.Caches.length; ++cIdx) {
    var cache = this.Caches[cIdx];
    if (cache) {
      cache.LoadRoots();
    }
  }
}


Section.prototype.FindImage = function (imageCollectionName) {
  for (var i = 0; i < this.Caches.length; ++i) {
    var cache = this.Caches[i];
    if (cache.ImageId == imageCollectionName) {
      return cache;
    }
  }
  return null;
}


// I do not like passing in the whole view.
// Could we get away with just passing the camera?
// No, we need the viewport too.
// Could the viewport be part of the camera?
Section.prototype.Draw = function (view) {

  var program = imageProgram;
  GL.useProgram(program);

  // Draw tiles.
  GL.viewport(view.Viewport[0], view.Viewport[1], 
              view.Viewport[2], view.Viewport[3]);

  GL.uniformMatrix4fv(program.pMatrixUniform, false, view.Camera.Matrix);

  for (var i = 0; i < this.Caches.length; ++i) {
    var cache = this.Caches[i];
    // Select the tiles to render first.
    this.Tiles = cache.ChooseTiles(view, SLICE, view.Tiles);  
    
    // Note: if not all tiles are loaded, this will draw the lower level tile multiple times.
    for (var j = 0; j < this.Tiles.length; ++j) {
      this.Tiles[j].Draw(program);
    }
  }
}


// This load tiles in the view like draw but does not render them.
// I want to preload tiles in the next section.
Section.prototype.LoadTilesInView = function (view) {
  for (var cIdx = 0; cIdx < this.Caches.length; ++cIdx) {
    var cache = this.Caches[cIdx];
    // Select the tiles to load (loading is a byproduct).
    var tiles = cache.ChooseTiles(view, SLICE);
  }
}





