// I am adding a levels with grids to index tiles in addition
// to the tree.  Eventually I want to get rid fo the tree.
// I am trying to get rid of the roots now.



// A stripped down source object.
// A source object must have a getTileUrl method.
// It can have any instance variables it needs to
// compute the URL.
function SlideAtlasSource () {
    this.Prefix = undefined;

    // Higher levels are higher resolution.
    // x, y, slide are integer indexes of tiles in the grid.
    this.getTileUrl = function(level, x, y, z) {
        var name = this.Prefix + "t";
        while (level  > 0) {
            --level;
            var cx = (x>>level)&1;
            var cy = (y>>level)&1;
            var childIdx = cx+(2*cy);
            if (childIdx == 0) {name += "q";}
            if (childIdx == 1) {name += "r";}
            if (childIdx == 2) {name += "t";}
            if (childIdx == 3) {name += "s";}
        }
        name = name + ".jpg"
        return name;
    }
}

function GigamacroSource () {
    this.Prefix = "http://www.gigamacro.com/content/AMNH/unit_box_test2_05-01-2015/zoomify/"
    this.GridSize = [[1,1],[2,2],[4,3],[7,5],[14,9],[28,17],[56,34]];

    // Higher levels are higher resolution.
    // x, y, slide are integer indexes of tiles in the grid.
    this.getTileUrl = function(level, x, y, z) {
        var g = this.GridSize[z];
        var num = y*g[0] + x;
        for (var i = 0; i < z; ++i) {
            g = this.GridSize[i];
            num += g[0]*g[1];
        }
        var tileGroup = Math.floor(num / 256);
        var name = this.Prefix+"TileGroup"+tileGroup+'/'+level+'-'+x+'-'+y+".jpg";
        return name;
    }
}


function DanielSource () {
    this.Prefix = "http://dragon.krash.net:2009/data/1"
    this.MinLevel = 0;
    this.MaxLevel = 7;

    // Higher levels are higher resolution.
    // x, y, slide are integer indexes of tiles in the grid.
    this.getTileUrl = function(level, x, y, z) {
        if (z < this.MinLevel) {return "";}
        if (z > this.MaxLevel) {return "";}
        var name = this.Prefix + level + '-' + x + '-' + y;
        return name;
    }
}


function IIPSource () {
    // Higher levels are higher resolution.
    // x, y, slide are integer indexes of tiles in the grid.
    this.getTileUrl = function(level, x, y, z) {
        // The number if tiles in a row for this level grid.
        var xDim = Math.ceil(this.ImageWidth / 
                             (this.TileSize << (this.NumLevels - z - 1)));
        var idx = y * xDim + x;
        imageSrc = this.Prefix + (z+2) + "," + idx;
    }

    this.ImageWidth = 0;
    this.TileSize = 256;
    this.NumLevels = 0;
}



//==============================================================================

//==============================================================================
var CACHES = [];

function FindCache(image) {
    // Look through existing caches and reuse one if possible
    for (var i = 0; i < CACHES.length; ++i) {
        if (CACHES[i].Image._id == image._id) {
            return CACHES[i];
        }
    }
    var cache = new Cache();

    // Special case to link to gigamacro.
    if (image._id == "555a1af93ed65909dbc2e19a") {
        image.levels = 7;
        image.dimensions = [14272,8448];
        image.bounds = [0,14271, 0,8447];
        cache.SetImageData(image);
        cache.TileSource = new GigamacroSource ();
        return cache;
    }

    cache.SetImageData(image);

    return cache;
}


//==============================================================================
function CacheLevel(xGridDim, yGridDim) {
    this.Tiles = new Array(xGridDim*yGridDim);
    this.GridDims = [xGridDim, yGridDim];
}
// No bounds checking.
CacheLevel.prototype.SetTile=function(tile){
    return this.Tiles[tile.X+(tile.Y*this.GridDims[0])] = tile;
}
CacheLevel.prototype.GetTile=function(x, y){
    return this.Tiles[x+(y*this.GridDims[0])];
}


//==============================================================================
function Cache() {
    //  this.UseIIP = Boolean(image.filename !== undefined && image.filename.split(".")[1] === 'ptif');
    this.UseIIP = false;
    this.Levels = [];

    // Keep a global list for pruning tiles.
    CACHES.push(this);
    this.NumberOfSections = 1;
}

Cache.prototype.destructor=function()
{
}

Cache.prototype.SetImageData = function(image) {

    if ( ! image.TileSize) {
        image.TileSize = 256;
    }
    
    this.Image = image;

    this.Levels = new Array(image.levels);
    for ( var i = 0; i < image.levels; ++i) {
        var level = image.levels-1-i;
        this.Levels[i] = new CacheLevel(
            Math.ceil(image.dimensions[0]/(image.TileSize<<level)),
            Math.ceil(image.dimensions[1]/(image.TileSize<<level)));
    }

    // TODO:  This should not be here.
    // Source sound be initialized someplace else.
    // Other sources have to overwrite this default.
    this.TileSource = new SlideAtlasSource();

    this.TileSource.Prefix = "/tile?img="+image._id+"&db="+image.database+"&name=";
    
    this.Warp = null;
    this.RootSpacing = [1<<(image.levels-1), 1<<(image.levels-1), 10.0];

    if (image.type && image.type == "stack") {
        this.NumberOfSections = image.dimensions[2];
        this.TileDimensions = [image.dimensions[0], image.dimensions[1]];
        var qTile;
        for (var slice = 1; slice <= this.NumberOfSections; ++slice) {
            qTile = this.GetTile(slice, 0, 0);
            qTile.LoadQueueAdd();
        }
        LoadQueueUpdate();
    } else {
        this.TileDimensions = [image.TileSize, image.TileSize];
        this.NumberOfSections = 1;
    }
}

Cache.prototype.SetScene = function(scene) {
    var image = {
        TileSize: scene.tileSize,
        levels:   scene.numLevels,
        dimensions: scene.dimensions,
        bounds: [0, scene.dimensions[0], 0, scene.dimensions[1]]};

    this.SetImageData(image);
    this.TileSource = scene;
}



Cache.prototype.GetLeafSpacing = function() {
  return this.RootSpacing[0] / (1 << (this.Image.levels-1));
}

Cache.prototype.GetBounds = function() {
  if (this.Image && this.Image.bounds) {
    return this.Image.bounds;
  }
  return [0,10000,0,10000]
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
    if ( this.Image.dimensions == undefined) {
        return;
    }
    for (var slice = 1; slice <= this.Image.dimensions[2]; ++slice) {
        qTile = this.GetTile(slice, 0, 0);
        qTile.LoadQueueAdd();
    }
    LoadQueueUpdate();
    return;
}


// ------ I think this method really belongs in the view! -----------
// This could get expensive because it is called so often.
// Eventually I want a quick coverage test to exit early.
// iPad flag includes low resolution ancestors to get rid of white lines between tiles.
// Tiles is actually the return value.  It is not used for anything else.
Cache.prototype.ChooseTiles = function(camera, slice, tiles) {
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
    var canvasHeight = camera.ViewportHeight;
    var tmp = this.TileDimensions[1]*this.RootSpacing[1] / camera.Height;
    //if (fast) {
    //  tmp = tmp * 0.5;
    //}
    tmp = tmp * canvasHeight / this.TileDimensions[1];
    var level = 0;
    while (tmp > 1.0) {
        ++level;
        tmp = tmp * 0.5;
    }
    if (level >= this.Image.levels) {
        level = this.Image.levels - 1;
    }


    // Compute the world bounds of camera view.
    var xMax = 0.0;
    var yMax = 0.0;
    var hw = camera.GetWidth()*0.5;
    var hh = camera.GetHeight()*0.5;
    var roll = camera.Roll;
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
    bounds[0] = camera.FocalPoint[0]-xMax;
    bounds[1] = camera.FocalPoint[0]+xMax;
    bounds[2] = camera.FocalPoint[1]-yMax;
    bounds[3] = camera.FocalPoint[1]+yMax;

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

    // Some logic for progressive rendering is in the loader:
    // Do not load a tile if its parent is not loaded.

    var tile;
    var tileIds;
    var tiles = [];
    // TODO: Make a "GetVisibleTiles" method.
    // Render all tiles from low res to high.
    // Although this extra work, it covers up cracks.
    // Rendering just level 0 should be enough, but that
    // messed up progressive rendering logic in section.js.
    // Just do this until I unify the progressive rendering
    // Probably in this method. (check is loaded).
    for (var i = level; i >=0; --i) {
        tileIds = this.GetVisibleTileIds(i, bounds);
        for (var j = 0; j < tileIds.length; ++j) {
            tile = this.GetTile(slice, i, tileIds[j]);
            // If the tile is loaded or loading,
            // this does nothing.
            tile.LoadQueueAdd();
            tiles.push(tile);
        }
    }

    LoadQueueUpdate();

    return tiles;
}

// Get ids of all visible tiles (including ones that have not been
// loaded yet.)
Cache.prototype.GetVisibleTileIds = function (level, bounds) {
    // Intersect the view bounds with the image bounds.
    // The ptif reader gives wrong times when out of bounds.
    if ( this.Image.bounds) {
        bounds[0] = Math.max(bounds[0], this.Image.bounds[0]);
        bounds[1] = Math.min(bounds[1], this.Image.bounds[1]);
        bounds[2] = Math.max(bounds[2], this.Image.bounds[2]);
        bounds[3] = Math.min(bounds[3], this.Image.bounds[3]);
    }

    var id;
    var idList = [];
    var dim = 1 << level;
    var bds = [];
    bds[0] = Math.floor(bounds[0] * dim / (this.TileDimensions[0]*this.RootSpacing[0]));
    bds[1] = Math.ceil(bounds[1] * dim / (this.TileDimensions[0]*this.RootSpacing[0])) - 1.0;
    bds[2] = Math.floor(bounds[2] * dim / (this.TileDimensions[1]*this.RootSpacing[1]));
    bds[3] = Math.ceil(bounds[3] * dim / (this.TileDimensions[1]*this.RootSpacing[1])) - 1.0;
    // I am allowing level 0 to have a grid of tiles (not just one root).
    // This will not work for the trsq tile names, but is used for grid
    // indexing of tiles that every other server uses.
    // This will only work NOW for the y axis (the case I am trying to
    // solve).  To work for the z axis, tile indexing has to change.
    // Javascript currently can handle 16 levels safely (32 bits) with the
    // current indexing scheme.
    
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
    
    return this.RecursiveGetTile(level, x, y, slice);
}

Cache.prototype.RecursiveGetTile = function(level, x, y, z) {
    var tile = this.Levels[level].GetTile(x,y);
    if (tile) {
        return tile;
    }
    var tile = new Tile(x, y, z, level,
                        this.TileSource.getTileUrl(level, x, y, z),
                        this);
    this.Levels[level].SetTile(tile);
    if (level > 0) {
        var parent = this.RecursiveGetTile(level-1,x>>1, y>>1, z);
        // I do not know if this is still valid.
        // This is to fix a bug. Root.BranchTime larger
        // than all children BranchTimeStamps.  When
        // long branch is added, node never gets updated.
        if (parent.Children[0] == null && parent.Children[1] == null &&
            parent.Children[2] == null && parent.Children[3] == null) {
            parent.BranchTimeStamp = GetCurrentTime();
        }
        var cx = x&1;
        var cy = y&1;
        var childIdx = cx+(2*cy);
        parent.Children[childIdx] = tile;
        tile.Parent = parent;
    }
    return tile;
}


// Find the oldest tile, remove it from the tree and return it to be recycled.
// This also prunes texture maps.
// PRUNE_TIME_TILES and PRUNE_TIME_TEXTURES are compared with used time of tile.
Cache.prototype.PruneTiles = function()
{
    for (var i = 0; i < this.Levels[0].Tiles.length; ++i) {
        var node = this.Levels[0].Tiles[i];
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




