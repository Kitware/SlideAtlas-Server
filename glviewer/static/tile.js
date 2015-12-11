// I want to avoid adding a Cache instance variable.
// I need to create the temporary object to hold pointers
// to both the cache and the tile which we are waiting for
// the image to load.  The callback only gives a single reference.



function LoadTileCallback(tile,cache) {
    this.Tile = tile;
    this.Cache = cache;
}

// Cache is now saved in tile ivar.
LoadTileCallback.prototype.HandleLoadedImage = function () {
    /* experimetation with trasparent tiles for layer
    if ( ! SA.FilterCanvas) {
        SA.FilterCanvas = new Canvas();
    }
    var canvas = SA.FilterCanvas;
    var image = this.Tile.Image;
    if (image.width != canvas.width)
        canvas.width = image.width;
    if (image.height != canvas.height)
        canvas.height = image.height;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    // Make white transparent.
    var d = imageData.data;
    for (var i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var b = d[i + 2];
        if (r == 255 && g == 255 && b == 255) {
            d[i+3] = 0;
        }
    }
    context.putImageData(imageData, 0, 0);
    image.src = canvas.toDataURL();
    */



    var curtime = new Date().getTime();
    TILESTATS.add({"name" : this.Tile.Name, "loadtime" : curtime - this.Tile.starttime });
    LoadQueueLoaded(this.Tile);
}

// If we cannot load a tile, we need to inform the cache so it can start
// loading another tile.
LoadTileCallback.prototype.HandleErrorImage = function () {
    LoadQueueError(this.Tile);
}

function TileStats() {
  this.tiles = [];
}

TileStats.prototype.add = function(atile) {
  this.tiles.push(atile)
}

TileStats.prototype.report = function() {
  var total = 0;
  
  for(var i = 0; i < this.tiles.length; i ++) {
    total = total + this.tiles[i].loadtime;
  }

  var report = {};
  report.count = this.tiles.length;
  report.average = total / this.tiles.length; 
  report.total = total; 
  console.log(report);
}

function GetLoadImageFunction (callback) {
    return function () {callback.HandleLoadedImage();}
}
function GetErrorImageFunction (callback) {
    return function () {callback.HandleErrorImage();}
}

TILESTATS = new TileStats();


// Three stages to loading a tile: (texture map is created when the tile is rendered.
// 1: Create a tile object.
// 2: Initialize the texture.
// 3: onload is called indicating the image has been loaded.
function Tile(x, y, z, level, name, cache) {
    // This should be implicit.
    //this is just for debugging
    //this.Id = x + (y<<level)
    //
    this.Cache = cache;
    this.X = x;
    this.Y = y;
    this.Z = z;
    this.Level = level;
    this.Children = [];
    this.Parent = null;
    this.LoadState = 0;
    this.Name = name;
    this.Texture = null;
    this.TimeStamp = TIME_STAMP;
    this.BranchTimeStamp = TIME_STAMP;

    this.Matrix = mat4.create();
    mat4.identity(this.Matrix);
    this.Matrix[14] = z * cache.RootSpacing[2] -(0.1 * this.Level);

    // Default path is to shared geometry and move/scale it with the matrix.
    // The shared polygon is a square [(0,0),(1,0),(1,1),(0,1)]
    // The matrix transforms it into world coordinates.
    if ( ! cache.Warp) {
        // TODO: We should have a simple version of warp that creates this matrix for us.
        // Use shared buffers and place them with the matrix transformation.
        var xScale = cache.TileDimensions[0] * cache.RootSpacing[0] / (1 << this.Level);
        var yScale = cache.TileDimensions[1] * cache.RootSpacing[1] / (1 << this.Level);
        this.Matrix[0] = xScale;
        this.Matrix[5] = -yScale;
        this.Matrix[12] = this.X * xScale;
        this.Matrix[13] = (this.Y+1) * yScale;
        this.Matrix[15] = 1.0;

        if (GL) {
            // These tiles share the same buffers.  Do not crop when there is no warp.
            this.VertexPositionBuffer = tileVertexPositionBuffer;
            this.VertexTextureCoordBuffer = tileVertexTextureCoordBuffer;
            this.CellBuffer = tileCellBuffer;
        }
    } else {
        // Warp model.
        this.CreateWarpBuffer(cache.Warp);
    }

    ++NUMBER_OF_TILES;
}

Tile.prototype.destructor=function()
{
    --NUMBER_OF_TILES;
    this.DeleteTexture();
    delete this.Matrix;
    this.Matrix = null;
    if (this.Image) {
        delete this.Image;
        this.Image = 0;
    }
    for (var i = 0; i < 4; ++i) {
        if (this.Children[i] != null) {
            this.Children[i].destructor();
            this.Children[i] = null;
        }
    }
}


// Youy have to call LoadQueueUpdate after adding tiles.
// Add the first unloaded ancestor to the load queue.
Tile.prototype.LoadQueueAdd = function() {
  // Record that the tile is used (for prioritizing loading and pruning).
  // Mark all lower res tiles so they will be loaded inthe correct order.
  var tmp = this;
  while (tmp && tmp.TimeStamp != TIME_STAMP) {
    tmp.TimeStamp = TIME_STAMP;
    tmp = tmp.Parent;
  }

  if (this.LoadState != 0) { // == 2
    // This tiles is already in the load queue or loaded.
    return;
  }

  // Now I want progressive loading so I will not add tiles to the queue if their parents are not completely loaded.
  // I could add all parent and children to the que at the same time, but I have seen children rendered before parents
  // (levels are skipped in progresive updata).  So, lets try this.
  // Now that I am prioritizing the queue on the tiles time stamp and level,  the previous issues should be resolved.
  if (this.Parent) {
    if (this.Parent.LoadState == 0) {
      // Not loaded and not in the queue.
      return this.Parent.LoadQueueAdd();
    } else if (this.Parent.LoadState == 1) {
      // Not loaded but in the queue
      return;
    }
  }

  // The tile's parent is loaded.  Add the tile to the load queue.
  LoadQueueAddTile(this);
}







// This is for connectome stitching.  It uses texture mapping
// to dynamically warp images.  It only works with webGL.
Tile.prototype.CreateWarpBuffer = function (warp) {
  // Compute the tile bounds.
  var tileDimensions = this.Cache.TileDimensions;
  var rootSpacing = this.Cache.RootSpacing;
  var p = (1 << this.Level);
  var size = [rootSpacing[0]*tileDimensions[0]/p, rootSpacing[1]*tileDimensions[1]/p];
  var bds = [size[0]*this.X, size[0]*(this.X+1),
             size[1]*this.Y, size[1]*(this.Y+1),
             this.Level, this.Level];

  // Tile geometry buffers.
  var vertexPositionData = [];
  var tCoordsData = [];
  var cellData = [];

  warp.CreateMeshFromBounds(bds, vertexPositionData, tCoordsData, cellData);

  this.VertexTextureCoordBuffer = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexTextureCoordBuffer);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(tCoordsData), GL.STATIC_DRAW);
  this.VertexTextureCoordBuffer.itemSize = 2;
  this.VertexTextureCoordBuffer.numItems = tCoordsData.length / 2;

  this.VertexPositionBuffer = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertexPositionData), GL.STATIC_DRAW);
  this.VertexPositionBuffer.itemSize = 3;
  this.VertexPositionBuffer.numItems = vertexPositionData.length / 3;

  this.CellBuffer = GL.createBuffer();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), GL.STATIC_DRAW);
  this.CellBuffer.itemSize = 1;
  this.CellBuffer.numItems = cellData.length;
}



// This starts the loading of the tile.
// Loading is asynchronous, so the tile will not
// immediately change its state.
Tile.prototype.StartLoad = function (cache) {
    if (this.LoadState >= 2) {
        return;
    }

    // Reusing the image caused problems.
    //if (this.Image == null) {
    this.Image = new Image();

    this.starttime = new Date().getTime();
    // Setup callbacks
    var callback = new LoadTileCallback(this, cache);
    this.Image.onload = GetLoadImageFunction(callback);
    this.Image.onerror = GetErrorImageFunction(callback);
    // This starts the loading.

    if(SA.TileLoader == "http") {
        this.LoadHttp(cache);
    } else if(SA.TileLoader == "websocket") {
        this.LoadWebSocket(cache);
    }
}

Tile.prototype.LoadHttp = function (cache) {
    // For http simply set the data url and wait 
    if (cache.TileSource) {
        // This should eventually displace all other methods
        // of getting the tile source.
        
        this.Name  = cache.TileSource.getTileUrl(this.Level,
                                                 this.X, this.Y, this.Z);
        // Name is just for debugging.
        this.Image.src = this.Name;

        return;
        
    }

    // Legacy
    var imageSrc;
    if (cache.Image.type && cache.Image.type == "stack") {
        imageSrc = cache.GetSource() + this.Name + ".png";
    } else {
        imageSrc = cache.GetSource() + this.Name + ".jpg";
    }
    
    if (cache.UseIIP) {
        var level = this.Level + 2;
        var xDim = Math.ceil(cache.Image.dimensions[0] / (cache.Image.TileSize << (cache.Image.levels - this.Level - 1)));
        var idx = this.Y * xDim + this.X;
        imageSrc = "http://iip.slide-atlas.org/iipsrv.fcgi?FIF=" + cache.Image.filename + "&jtl=" + level + "," + idx;
    }
    
    this.Image.src = imageSrc;
};


Tile.prototype.LoadWebSocket = function (cache) {
  // Right now doing exact same thing
  var name = '';
  if (cache.Image.type && cache.Image.type == "stack") {
    name = this.Name + ".png";
  } else {
    name = this.Name + ".jpg";
  }

  var image = cache.Image._id;

  ws.FetchTile(name, image, cache, this.Image);
};

Tile.prototype.Draw = function (program, context) {
  // Load state 0 is: Not loaded and not scheduled to be loaded yet.
  // Load state 1 is: not loaded but in the load queue.
  if ( this.LoadState != 3) {
    // This should never happen.
    return;
  }

  if (GL) {
    if (this.Texture == null) {
      this.CreateTexture();
    }
    // These are the same for every tile.
    // Vertex points (shifted by tiles matrix)
    context.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
    // Needed for outline ??? For some reason, DrawOutline did not work
    // without this call first.
    context.vertexAttribPointer(imageProgram.vertexPositionAttribute,
                          this.VertexPositionBuffer.itemSize,
                          GL.FLOAT, false, 0, 0);     // Texture coordinates
    context.bindBuffer(GL.ARRAY_BUFFER, this.VertexTextureCoordBuffer);
    context.vertexAttribPointer(imageProgram.textureCoordAttribute,
                          this.VertexTextureCoordBuffer.itemSize,
                          GL.FLOAT, false, 0, 0);
    // Cell Connectivity
    context.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);

      // Texture
    context.activeTexture(GL.TEXTURE0);
    context.bindTexture(GL.TEXTURE_2D, this.Texture);

    context.uniform1i(program.samplerUniform, 0);
    // Matrix that tranforms the vertex p
    context.uniformMatrix4fv(program.mvMatrixUniform, false, this.Matrix);

    context.drawElements(GL.TRIANGLES, this.CellBuffer.numItems, GL.UNSIGNED_SHORT, 0);
  } else {
    // It is harder to flip the y axis in 2d canvases because the image turns upside down too.
    // WebGL handles this by flipping the texture coordinates.  Here we have to
    // translate the tiles to the correct location.
    context.save(); // Save the state of the transform so we can restore for the next tile.

    // Map tile to world.
    // Matrix is world to 0-1.
    context.transform(this.Matrix[0], this.Matrix[1],
                      this.Matrix[4], this.Matrix[5],
                      this.Matrix[12], this.Matrix[13]);


    // Flip the tile upside down, but leave it in the same place
    context.transform(1.0,0.0, 0.0,-1.0, 0.0, 1.0);

    // map pixels to Tile
    var tileSize = this.Cache.Image.TileSize;
    // This should not be necessary, quick hack around a bug in __init__.py
    if ( tileSize == undefined) {
      tileSize = 256;
    }
    context.transform(1.0/tileSize, 0.0, 0.0, 1.0/tileSize, 0.0, 0.0);
    context.drawImage(this.Image,0,0);

    //  Transform to map (0->1, 0->1)
    context.restore();
  }
}

Tile.prototype.CreateTexture = function () {
  if (this.Texture != null) { return;}

  ++NUMBER_OF_TEXTURES; // To determine when to prune textures.
  this.Texture = GL.createTexture();
  var texture = this.Texture;
  //alert(tile);
  GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
  GL.bindTexture(GL.TEXTURE_2D, texture);
  GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, this.Image);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
  GL.bindTexture(GL.TEXTURE_2D, null);
}

Tile.prototype.DeleteTexture = function () {
  if (this.Texture) {
    --NUMBER_OF_TEXTURES; // To determine when to prune textures.
    GL.deleteTexture(this.Texture);
    this.Texture = null;
  }
}
