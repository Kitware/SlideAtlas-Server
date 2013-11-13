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
  LoadQueueLoaded(this.Tile);
}

// If we cannot load a tile, we need to inform the cache so it can start
// loading another tile.
LoadTileCallback.prototype.HandleErrorImage = function () {
    LoadQueueError(this.Tile);
}


function GetLoadImageFunction (callback) {
    return function () {callback.HandleLoadedImage();}
}
function GetErrorImageFunction (callback) {
    return function () {callback.HandleErrorImage();}
}









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

  // Default path is to place shared geometry with the matrix.
  if ( ! cache.Warp) {
    // TODO: We should have a simple version of warp that creates this matrix for us.
    // Use shared buffers and place them with the matrix transformation.
    var xScale = cache.TileDimensions[0] * cache.RootSpacing[0] / (1 << this.Level);
    var yScale = cache.TileDimensions[1] * cache.RootSpacing[1] / (1 << this.Level);
    this.Matrix[0] = xScale;
    this.Matrix[5] = yScale;
    this.Matrix[12] = this.X * xScale;
    this.Matrix[13] = this.Y * yScale;
    this.Matrix[15] = 1.0;

    // These tiles share the same buffers.  Do not crop when there is no warp.
    this.VertexPositionBuffer = tileVertexPositionBuffer;
    this.VertexTextureCoordBuffer = tileVertexTextureCoordBuffer;
    this.CellBuffer = tileCellBuffer;
  } else {
    // Warp model.
    this.CreateWarpBuffer(cache.Warp);
  }
  
  ++NUMBER_OF_TILES;
};

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

  var imageSrc;
  if (cache.Image.type && cache.Image.type == "stack") {
    imageSrc = cache.GetSource() + this.Name + ".png";
  } else {
    imageSrc = cache.GetSource() + this.Name + ".jpg";
  }
  
  // Reusing the image caused problems.
  //if (this.Image == null) {
    this.Image = new Image();
    var callback = new LoadTileCallback(this, cache);
    this.Image.onload = GetLoadImageFunction(callback);
    this.Image.onerror = GetErrorImageFunction(callback);
  //}
  // This starts the loading.
  this.Image.src = imageSrc;
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
    // assume tile is 256x256
    // Shift a half pixel (white line fix) Draw tile one pixel bigger.
    if (MOBILE_DEVICE == "iPad") {
      context.transform(1.0/256, 0.0, 0.0, 1.0/256, -0.5/255.0, -0.5/255.0);  
    } else {
      context.transform(1.0/255.5, 0.0, 0.0, 1.0/255.5, -0.25/255.0, -0.25/255.0);  
    }
    context.drawImage(this.Image,0,0);
    //context.strokeStyle="green"; // I need to find the method that converts RBG array to hex color
    //context.rect(0,0,256, 256); 
    //context.stroke();    

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
