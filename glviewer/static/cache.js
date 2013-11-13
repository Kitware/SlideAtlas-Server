

// Source is the directory that contains the tile files.
function Cache(image, bounds) {
  // Look through existing caches and reuse one if possible
  for (var i = 0; i < CACHES.length; ++i) {
    if (CACHES[i].Image._id == image._id) {
      return CACHES[i];
    }
  }
  
  var sourceStr = "/tile?img="+image._id+"&db="+image.database+"&name=";
  
  this.Image = image;

  // For debugging
  //this.PendingTiles = [];
  this.Source = sourceStr;

  this.Warp = null;
  this.Bounds = bounds;
  if (image.type && image.type == "stack") {
    this.TileDimensions = [image.dimensions[0], image.dimensions[1]];
  } else {
    this.TileDimensions = [256, 256];
  }
  this.RootSpacing = [1<<(image.levels-1), 1<<(image.levels-1), 10.0];
  this.NumberOfSections = 1;
  
  this.RootTiles = [];

  // Keep a global list for pruning tiles.
  CACHES.push(this);
}

Cache.prototype.destructor=function()
{
}

Cache.prototype.GetLeafSpacing = function() {
  return this.RootSpacing[0] / (1 << (this.Image.levels-1));
}

Cache.prototype.GetBounds = function() {
  return this.Bounds;
}

// This method converts a point in image coordinates to a point in world coordinates.
Cache.prototype.ImageToWorld = function(imagePt) {
  if (this.Warp) {
    return this.Warp.ImageToWorld(imagePt);
  }
  // Just shift by the origin.
  // Assume spacing is 1.
  // This should be a simple matrix version of warp.
  return [imagePt[0]+this.Origin[0], imagePt[1]+this.Origin[1]];
}

// This method converts a point in world coordinates to a point in cache-image coordinates.
Cache.prototype.WorldToImage = function(worldPt) {
  if (this.Warp) {
    return this.Warp.WorldToImage(worldPt);
  }
  // Just shift by the origin.
  // Assume spacing is 1.
  // TODO:
  // This should be a simple matrix version of warp.  
  return [worldPt[0]-this.Origin[0], worldPt[1]-this.Origin[1]];
}







Cache.prototype.GetSource=function()
{
    return this.Source;
}

Cache.prototype.LoadRoots = function () {
    var qTile;
    for (var slice = 1; slice < 2; ++slice) {
        qTile = this.GetTile(slice, 0, 0);
        LoadQueueAdd(qTile);
    }
    return;
    // Theses were for a demo (preload).
    for (var slice = 201; slice < 251; ++slice) {
        for (var j = 0; j < 4; ++j) {
            qTile = this.GetTile(slice, 1, j);
            LoadQueueAdd(qTile);
        }
    }
    for (var slice = 0; slice < 50; ++slice) {
        for (var j = 0; j < 4; ++j) {
            qTile = this.GetTile(slice, 1, j);
            LoadQueueAdd(qTile);
        }
        qTile = this.GetTile(slice, 5, 493);
        LoadQueueAdd(qTile);
        qTile = this.GetTile(slice, 5, 494);
        LoadQueueAdd(qTile);
        qTile = this.GetTile(slice, 5, 495);
        LoadQueueAdd(qTile);
        qTile = this.GetTile(slice, 5, 525);
        LoadQueueAdd(qTile);
        qTile = this.GetTile(slice, 5, 526);
        LoadQueueAdd(qTile);
        qTile = this.GetTile(slice, 5, 527);
        LoadQueueAdd(qTile);
    }       
}


// ------ I think this method really belongs in the view! -----------
// This could get expensive because it is called so often.
// Eventually I want a quick coverage test to exit early.
Cache.prototype.ChooseTiles = function(view, slice, tiles) {
  // I am prioritizing tiles in the queue by time stamp.
  // Loader sets the the tiles time stamp.
  // Time stamp only progresses after a whole render.
  AdvanceTimeStamp();

  // I am putting this here to avoid deleting tiles
  // in the rendering list.
  Prune();           

  // Pick a level to display.
  //var fast = document.getElementById("fast").checked;
  // Todo: fix this hack. (now a global variable gl).
  var canvasHeight = view.Viewport[3];
  var tmp = this.TileDimensions[1]*this.RootSpacing[1] / view.Camera.Height;
  //if (fast) {
  //  tmp = tmp * 0.5;
  //}
  tmp = tmp * canvasHeight / this.TileDimensions[1];
  var level = 0;
  while (tmp > 1.0) {
      ++level;
      tmp = tmp * 0.5;
  }

  // Compute the world bounds of camera view.
  var xMax = 0.0;
  var yMax = 0.0;
  var hw = view.Camera.GetWidth()*0.5;
  var hh = view.Camera.GetHeight()*0.5;
  var roll = view.Camera.Roll;
  var s = Math.sin(roll);
  var c = Math.cos(roll);
  var rx, ry;
  // Choose a camera corner and rotate. (Center of bounds in origin).
  rx = hw*c + hh*s;
  ry = hh*c - hw*s;
  // Expand bounds.
  if (xMax < rx)  { xMax = rx;}
  if (xMax < -rx) { xMax = -rx;}
  if (yMax < ry)  { yMax = ry;}
  if (yMax < -ry) { yMax = -ry;}
  // Now another corner (90 degrees away).
  rx = hw*c - hh*s;
  ry = -hh*c - hw*s;
  // Expand bounds.
  if (xMax < rx)  { xMax = rx;}
  if (xMax < -rx) { xMax = -rx;}
  if (yMax < ry)  { yMax = ry;}
  if (yMax < -ry) { yMax = -ry;}
  
  var bounds = [];
  bounds[0] = view.Camera.FocalPoint[0]-xMax;
  bounds[1] = view.Camera.FocalPoint[0]+xMax;
  bounds[2] = view.Camera.FocalPoint[1]-yMax;
  bounds[3] = view.Camera.FocalPoint[1]+yMax;

  // Adjust bounds to compensate for warping.
  if (this.Warp) {
    // If this is too slow (occurs every render) we can estimate.
    var iPt = this.WorldToImage([bounds[0], bounds[2]]);
    if ( ! iPt) { tiles.length = 0; return tiles;} 
    var iBounds = [iPt[0], iPt[0], iPt[1], iPt[1]];
    iPt = this.WorldToImage([bounds[1], bounds[2]]);
    if ( ! iPt) { tiles.length = 0; return tiles;} 
    if (iBounds[0] > iPt[0]) { iBounds[0] = iPt[0]; }
    if (iBounds[1] < iPt[0]) { iBounds[1] = iPt[0]; }
    if (iBounds[2] > iPt[1]) { iBounds[2] = iPt[1]; }
    if (iBounds[3] < iPt[1]) { iBounds[3] = iPt[1]; }
    iPt = this.WorldToImage([bounds[0], bounds[3]]);
    if ( ! iPt) { tiles.length = 0; return tiles;} 
    if (iBounds[0] > iPt[0]) { iBounds[0] = iPt[0]; }
    if (iBounds[1] < iPt[0]) { iBounds[1] = iPt[0]; }
    if (iBounds[2] > iPt[1]) { iBounds[2] = iPt[1]; }
    if (iBounds[3] < iPt[1]) { iBounds[3] = iPt[1]; }
    iPt = this.WorldToImage([bounds[1], bounds[3]]);
    if ( ! iPt) { tiles.length = 0; return tiles;} 
    if (iBounds[0] > iPt[0]) { iBounds[0] = iPt[0]; }
    if (iBounds[1] < iPt[0]) { iBounds[1] = iPt[0]; }
    if (iBounds[2] > iPt[1]) { iBounds[2] = iPt[1]; }
    if (iBounds[3] < iPt[1]) { iBounds[3] = iPt[1]; }
    bounds = iBounds;
  }
  
  // Logic for progressive rendering is in the loader:
  // Do not load a tile if its parent is not loaded.
    
  var tiles = [];
  var tileIds = this.GetVisibleTileIds(level, bounds);
  var tile;
  for (var i = 0; i < tileIds.length; ++i) {
    tile = this.GetTile(slice, level, tileIds[i]);
    // If the tile is loaded or loading,
    // this does nothing.
    LoadQueueAdd(tile);
    tiles.push(tile);
  }
  
  // Preload the next slice.
  //bounds[0] = bounds[1] = camera.FocalPoint[0];
  //bounds[2] = bounds[3] = camera.FocalPoint[1];
  //tileIds = this.GetVisibleTileIds(level, bounds);
  // There will be only one tile because the bounds
  // contains only the center point.
  //for (var i = 0; i < tileIds.length; ++i) {
  //    tile = this.GetTile(slice+1, level, tileIds[i]);
  //    LoadQueueAdd(tile);
  //}

  return tiles;
}

// Get ids of all visible tiles (including ones that have not been
// loaded yet.)
Cache.prototype.GetVisibleTileIds = function (level, bounds) {
    var id;
    var idList = [];
    var dim = 1 << level;
    var bds = [];
    bds[0] = Math.floor(bounds[0] * dim / (this.TileDimensions[0]*this.RootSpacing[0]));
    bds[1] = Math.ceil(bounds[1] * dim / (this.TileDimensions[0]*this.RootSpacing[0])) - 1.0;
    bds[2] = Math.floor(bounds[2] * dim / (this.TileDimensions[1]*this.RootSpacing[1]));
    bds[3] = Math.ceil(bounds[3] * dim / (this.TileDimensions[1]*this.RootSpacing[1])) - 1.0;
    if (bds[0] < 0) {bds[0] = 0;}
    if (bds[1] >= dim) {bds[1] = dim-1;}
    if (bds[2] < 0) {bds[2] = 0;}
    if (bds[3] >= dim) {bds[3] = dim-1;}
    for (var y = bds[2]; y <= bds[3]; ++y) {
      for (var x = bds[0]; x <= bds[1]; ++x) {
        id = x | (y << level);
        idList.push(id);
      }
    }
    return idList;
}

// I do not think this ever gets called.  No class calls this method.
Cache.prototype.GetTileIdContainingPoint = function (level, wPt) {
    var dim = 1 << level;
    var xIdx = Math.floor(wPt[0] * dim);
    var yIdx = Math.floor(wPt[1] * dim);
    if (xIdx < 0) {xIdx = 0;}
    if (xIdx >= dim) {xIdx = dim-1;}
    if (yIdx < 0) {yIdx = 0;}
    if (yIdx >= dim) {yIdx = dim-1;}
    var id = xIdx | (yIdx << level);
    return id;
}




// Set parent to be minimum of children.
Cache.prototype.UpdateBranchTimeStamp = function(tile) {
    var min = GetCurrentTime();
    if (tile.Children[0] != null) {
      if (tile.Children[0].BranchTimeStamp < min) {
        min = tile.Children[0].BranchTimeStamp;
      }
    }
    if (tile.Children[1] != null) {
      if (tile.Children[1].BranchTimeStamp < min) {
        min = tile.Children[1].BranchTimeStamp;
      }
    }
    if (tile.Children[2] != null) {
      if (tile.Children[2].BranchTimeStamp < min) {
        min = tile.Children[2].BranchTimeStamp;
      }
    }
    if (tile.Children[3] != null) {
      if (tile.Children[3].BranchTimeStamp < min) {
        min = tile.Children[3].BranchTimeStamp;
      }
    }
    if (min == GetCurrentTime()) { // no children
      min = tile.TimeStamp;
    }
    if (min != tile.BranchTimeStamp) {
      tile.BranchTimeStamp = min;
      if (tile.Parent != null) {
        this.UpdateBranchTimeStamp(tile.Parent);
      }
    }
}

Cache.prototype.GetTile = function(slice, level, id) {
  //Separate x and y.
  var dim = 1 << level;
  var x = id & (dim-1);
  var y = id >> level;
  if (this.RootTiles[slice] == null) {
    var tile;
    var name;
    if (this.Image.type && this.Image.type == "stack") {
      // name = slice + "/t";
      name = slice.toString();
    } else {
      name = "t";
    }
    tile = new Tile(0,0,slice, 0, name, this);
    this.RootTiles[slice] = tile;
  }
  return this.RecursiveGetTile(this.RootTiles[slice], level, x, y, slice);
}

// This creates the tile tree down to the tile (if necessary) and returns
// the tile requested.  The tiles objects created are not added to 
// the load queue here.
Cache.prototype.RecursiveGetTile = function(node, deltaDepth, x, y, z) {
  if (deltaDepth == 0) {
    return node;
  }
  --deltaDepth;
  var cx = (x>>deltaDepth)&1;
  var cy = (y>>deltaDepth)&1;
  var childIdx = cx+(2*cy);
  var child = node.Children[childIdx];
  if (child == null) {
    var childName = node.Name;
    if (childIdx == 0) {childName += "t";} 
    if (childIdx == 1) {childName += "s";} 
    if (childIdx == 2) {childName += "q";} 
    if (childIdx == 3) {childName += "r";} 
    child = new Tile(x>>deltaDepth, y>>deltaDepth, z,
                     (node.Level + 1),
                     childName, this);
    // This is to fix a bug. Root.BranchTime larger
    // than all children BranchTimeStamps.  When
    // long branch is added, node never gets updated.
    if (node.Children[0] == null && node.Children[1] == null &&
        node.Children[2] == null && node.Children[3] == null) {
        node.BranchTimeStamp = GetCurrentTime();
    }

    node.Children[childIdx] = child;
    child.Parent = node;
  }
  return this.RecursiveGetTile(child, deltaDepth, x, y, z);
}


// Find the oldest tile, remove it from the tree and return it to be recycled.
// This also prunes texture maps.
// PRUNE_TIME_TILES and PRUNE_TIME_TEXTURES are compared with used time of tile.
Cache.prototype.PruneTiles = function()
{
  for (var i = 0; i < this.RootTiles.length; ++i) {
    var node = this.RootTiles[i];
    if (node != null) {
      if (node.BranchTimeStamp < PRUNE_TIME_TILES || node.BranchTimeStamp < PRUNE_TIME_TEXTURES) {
        this.RecursivePruneTiles(node);
      }
    }
  }
}

Cache.prototype.RecursivePruneTiles = function(node)
{
  var leaf = true;
    
  for (var i = 0; i < 4; ++i) {
    var child = node.Children[i];
    if (child != null) {
      leaf = false;
      if (child.BranchTimeStamp < PRUNE_TIME_TILES || 
          child.BranchTimeStamp < PRUNE_TIME_TEXTURES) {
        this.RecursivePruneTiles(child);
      }
    }
  }
  if (leaf && node.Parent != null) { // Roots have null parents.  Do not prune roots.
    if (node.BranchTimeStamp < PRUNE_TIME_TEXTURES) {
      node.DeleteTexture();
    }
    if (node.BranchTimeStamp < PRUNE_TIME_TILES) {
      if ( node.LoadState == 1) {
        LoadQueueRemove(node); 
      }
      var parent = node.Parent;
      // nodes will always have parents because we do not steal roots.
      if (parent.Children[0] == node) {
          parent.Children[0] = null;
      } else if (parent.Children[1] == node) {
          parent.Children[1] = null;
      } else if (parent.Children[2] == node) {
          parent.Children[2] = null;
      } else if (parent.Children[3] == node) {
          parent.Children[3] = null;
      }
      node.Parent = null;
      this.UpdateBranchTimeStamp(parent)
      node.destructor();
      delete node;
    }
  }
}




