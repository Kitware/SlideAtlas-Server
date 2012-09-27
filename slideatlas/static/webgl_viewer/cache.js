var TIME_STAMP = 0;


// Source is the directory that contains the tile files.
function Cache(source) {
    // For debugging
    //this.PendingTiles = [];
    this.Source = source;

    this.TileDimensions = [256, 256];
    this.RootSpacing = [128.0, 128.0, 10.0];
    this.NumberOfSections = 1;
    // For pruning the cache
    this.NumberOfTiles = 0;
    this.MaximumNumberOfTiles = 3000;
    // Keep a queue of tiles to load so we can sort them as
    // new requests come in.
    this.LoadQueue = [];
    this.LoadingCount = 0;
    this.LoadingMaximum = 4;
    
    this.RootTiles = [];
    this.PruneTime = 0;

    this.LoadRoots();
}

Cache.prototype.destructor=function()
{
}

Cache.prototype.GetSource=function()
{
    return this.Source;
}

Cache.prototype.LoadRoots = function () {
    var qTile;
    for (var slice = 1; slice < 2; ++slice) {
        qTile = this.GetTile(slice, 0, 0);
        this.LoadQueueAdd(qTile);
    }
    return;
    // Theses were for a demo (preload).
    for (var slice = 201; slice < 251; ++slice) {
        for (var j = 0; j < 4; ++j) {
            qTile = this.GetTile(slice, 1, j);
            this.LoadQueueAdd(qTile);
        }
    }
    for (var slice = 0; slice < 50; ++slice) {
        for (var j = 0; j < 4; ++j) {
            qTile = this.GetTile(slice, 1, j);
            this.LoadQueueAdd(qTile);
        }
        qTile = this.GetTile(slice, 5, 493);
        this.LoadQueueAdd(qTile);
        qTile = this.GetTile(slice, 5, 494);
        this.LoadQueueAdd(qTile);
        qTile = this.GetTile(slice, 5, 495);
        this.LoadQueueAdd(qTile);
        qTile = this.GetTile(slice, 5, 525);
        this.LoadQueueAdd(qTile);
        qTile = this.GetTile(slice, 5, 526);
        this.LoadQueueAdd(qTile);
        qTile = this.GetTile(slice, 5, 527);
        this.LoadQueueAdd(qTile);
    }       
}

// We could chop off the lowest priority tiles if the queue gets too long.
Cache.prototype.LoadQueueAdd = function (tile) {
    if (tile.LoadState != 0) { // == 2
	// Loading
	return;
    }
    if (tile.LoadState == 1) { // Resort the queue.
	// If the tile is in the queue, remove it.
	for (var i = 0; i < this.LoadQueue.length; ++i) {
	    if (this.LoadQueue[i] == tile) {
		this.LoadQueue[i] = null;
		break;
	    }
	}
    }
    tile.LoadState = 1;
    // Add the tile at the front of the queue.
    this.LoadQueue.push(tile);
    this.LoadQueueUpdate();
}

// I need a way to remove tiles from the queue when they are deleted.
// I know this is inefficient.
Cache.prototype.LoadQueueRemove = function (tile) {
    var length = this.LoadQueue.length;
    for (var i = 0; i < length; ++i) {
	if (this.LoadQueue[i] == tile) {
	    tile.LoadState = 0; 
	    this.LoadQueue[i] = null;
	    return;
	}
    }
}

// We will have some number of tiles loading at one time.
// Take the first N tiles from the queue and start loading them.
// Too many and we cannot abort loading.
// Too few and we will serialize loading.
Cache.prototype.LoadQueueUpdate = function() {
    while (this.LoadingCount < this.LoadingMaximum && 
	   this.LoadQueue.length > 0) {
	var tile = this.LoadQueue.pop();
	// For debugging
	//this.PendingTiles.push(tile);
	if (tile != null) {
	    tile.StartLoad(this);
	    tile.LoadState = 2; // Loading.
	    ++this.LoadingCount;
	}
    }
}

// Issue: Tiles call this method when their image gets loaded.
// How does the tile know which cache it belongs too.
// Marks a tile as loaded so another can start.
Cache.prototype.LoadQueueLoaded = function(tile) {
    --this.LoadingCount;
    tile.LoadState = 3; // Loaded
    this.LoadQueueUpdate();

    // For debugging
    //for (var i = 0; i < this.PendingTiles.length; ++i) {
    //	if (tile == this.PendingTiles[i]) {
    //	    this.PendingTiles.splice(i,1);
    //	    return;
    //	}
    //}
}

// This is called if their was a 404 image not found error.
Cache.prototype.LoadQueueError = function(tile) {
    --this.LoadingCount;
}

// ------ I tink this method really belongs in the view! -----------
// This could get expensive because it is called so often.
// Eventually I want a quick coverage test to exit early.
Cache.prototype.ChooseTiles = function(view, slice, tiles) {
    // I am putting this here to avoid deleting tiles
    // in the rendering list.
    if (this.NumberOfTiles >= this.MaximumNumberOfTiles) {
	this.PruneTiles();           
    }
    
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
    while (tmp > 1.5) {
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

    var tileIds = this.GetVisibleTileIds(level, bounds);
    var tile;
    tiles = [];
    for (var i = 0; i < tileIds.length; ++i) {
        tile = this.GetTile(slice, level, tileIds[i]);
	tiles.push(tile);
	// Do not worry.  If the tile is loaded or loading,
	// this does nothing.
	this.LoadQueueAdd(tile);
    }
    // Mark the tiles to be rendered so they will be last to be pruned.
    this.StampTiles(tiles);

    // Preload the next slice.
    //bounds[0] = bounds[1] = camera.FocalPoint[0];
    //bounds[2] = bounds[3] = camera.FocalPoint[1];
    //tileIds = this.GetVisibleTileIds(level, bounds);
    // There will be only one tile because the bounds
    // contains only the center point.
    //for (var i = 0; i < tileIds.length; ++i) {
    //    tile = this.GetTile(slice+1, level, tileIds[i]);
    //    this.LoadQueueAdd(tile);
    //}

    return tiles;
}


// Get ids of all visible tiles (including ones that have not been
// loaded yet.)
Cache.prototype.GetVisibleTileIds = function (level, bounds) {
    var id;
    var idList = [];
    var dim = 1 << level;
    bounds[0] = Math.floor(bounds[0] * dim / (this.TileDimensions[0]*this.RootSpacing[0]));
    bounds[1] = Math.ceil(bounds[1] * dim / (this.TileDimensions[0]*this.RootSpacing[0])) - 1.0;
    bounds[2] = Math.floor(bounds[2] * dim / (this.TileDimensions[1]*this.RootSpacing[1]));
    bounds[3] = Math.ceil(bounds[3] * dim / (this.TileDimensions[1]*this.RootSpacing[1])) - 1.0;
    if (bounds[0] < 0) {bounds[0] = 0;}
    if (bounds[1] >= dim) {bounds[1] = dim-1;}
    if (bounds[2] < 0) {bounds[2] = 0;}
    if (bounds[3] >= dim) {bounds[3] = dim-1;}
    for (var y = bounds[2]; y <= bounds[3]; ++y) {
	for (var x = bounds[0]; x <= bounds[1]; ++x) {
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



Cache.prototype.StampTiles = function(tiles) {
    for (var i = 0; i < tiles.length; ++i) {
	tiles[i].TimeStamp = TIME_STAMP;
	this.UpdateBranchTimeStamp(tiles[i]);
    }
    ++TIME_STAMP;
}

// Set parent to be minimum of children.
Cache.prototype.UpdateBranchTimeStamp = function(tile) {
    var min = TIME_STAMP;
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
    if (min == TIME_STAMP) { // no children
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
	//var name = slice + "/t";
	var name = "t";
	tile = new Tile(0,0,slice, 0, name, this);
	this.RootTiles[slice] = tile;
    }
    return this.RecursiveGetTile(this.RootTiles[slice], level, x, y, slice);
}

// This creates the tile tree down to the tile (if necessry) and returns
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
	    node.BranchTimeStamp = TIME_STAMP;
	}

	node.Children[childIdx] = child;
        child.Parent = node;
    }
    return this.RecursiveGetTile(child, deltaDepth, x, y, z);
}


// Find the oldest tile, remove it from the tree and return it to be recycled.
Cache.prototype.PruneTiles = function()
{
    if (this.PruneTime > TIME_STAMP) {
	this.PruneTime = 0;
    }

    // Advance the prune threshold.
    this.PruneTime += 0.05 * (TIME_STAMP - this.PruneTime);

    for (var i = 0; i < this.RootTiles.length; ++i) {
	var node = this.RootTiles[i];
	if (node != null && node.BranchTimeStamp < this.PruneTime) {
	    this.RecursivePruneTiles(node);
	}
    }
}

Cache.prototype.RecursivePruneTiles = function(node)
{
    var leaf = true;
    
    for (var i = 0; i < 4; ++i) {
	if (node.Children[i] != null) {
	    leaf = false;
	    if (node.Children[i].BranchTimeStamp < this.PruneTime) {
		this.RecursivePruneTiles(node.Children[i]);
	    }
	}
    }
    if (leaf && node.Parent != null) {
	if ( node.LoadState == 1) {
	    this.LoadQueueRemove(node); 
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




