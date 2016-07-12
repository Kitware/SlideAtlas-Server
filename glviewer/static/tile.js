// I want to avoid adding a Cache instance variable.
// I need to create the temporary object to hold pointers
// to both the cache and the tile which we are waiting for
// the image to load.  The callback only gives a single reference.


window.SA = window.SA || {};

(function () {
    "use strict";



    function LoadTileCallback(tile,cache) {
        this.Tile = tile;
        this.Cache = cache;
    }

    // Cache is now saved in tile ivar.
    LoadTileCallback.prototype.HandleLoadedImage = function () {
        var curtime = new Date().getTime();
        TILESTATS.add({"name" : this.Tile.Name, "loadtime" : curtime - this.Tile.starttime });
        SA.LoadQueueLoaded(this.Tile);
    }

    // If we cannot load a tile, we need to inform the cache so it can start
    // loading another tile.
    LoadTileCallback.prototype.HandleErrorImage = function () {
        console.log("LoadTile error " + this.Tile.Name);

        SA.LoadQueueError(this.Tile);
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

    var TILESTATS = new TileStats();


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
        this.TimeStamp = SA.TimeStamp;
        this.BranchTimeStamp = SA.TimeStamp;

        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);
        this.Matrix[14] = z * cache.RootSpacing[2] -(0.1 * this.Level);

        // TODO: Warping depends on a global GL (which I am getting rid of) Fix
        // on demand :)
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

            // Note:  I am breaking the warping to test multiple gl Contexts.
            // We do not have the view at this spot to build buffers.
            /*
              if (view && view.gl) {
              // These tiles share the same buffers.  Do not crop when there
              // is no warp. Actually, we should crop.
              this.VertexPositionBuffer = view.tileVertexPositionBuffer;
              this.VertexTextureCoordBuffer = view.tileVertexTextureCoordBuffer;
              this.CellBuffer = view.tileCellBuffer;
              }
            */
        } else {
            // Warp model.
            // In draw now.
            //this.CreateWarpBuffer(cache.Warp);
        }

        ++SA.NumberOfTiles;
    }

    Tile.prototype.delete=function(gl)
    {
        --SA.NumberOfTiles;
        this.DeleteTexture(gl);
        delete this.Matrix;
        this.Matrix = null;
        if (this.Image) {
            delete this.Image;
            this.Image = 0;
        }
        for (var i = 0; i < 4; ++i) {
            if (this.Children[i] != null) {
                this.Children[i].delete(gl);
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
        while (tmp && tmp.TimeStamp != SA.TimeStamp) {
            tmp.TimeStamp = SA.TimeStamp;
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
        SA.LoadQueueAddTile(this);
    }




    // This is for connectome stitching.  It uses texture mapping
    // to dynamically warp images.  It only works with webGL.
    Tile.prototype.CreateWarpBuffer = function (warp, gl) {
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

        this.VertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tCoordsData), gl.STATIC_DRAW);
        this.VertexTextureCoordBuffer.itemSize = 2;
        this.VertexTextureCoordBuffer.numItems = tCoordsData.length / 2;

        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = vertexPositionData.length / 3;

        this.CellBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), gl.STATIC_DRAW);
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

        if (SA.TileLoader == "websocket") {
            this.LoadWebSocket(cache);
        } else {
            // "http"
            this.LoadHttp(cache);
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
    }


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
    }



    // TODO: Put program as iVar of view.
    Tile.prototype.Draw = function (program, view) {
        // Load state 0 is: Not loaded and not scheduled to be loaded yet.
        // Load state 1 is: not loaded but in the load queue.
        if ( this.LoadState != 3) {
            // This should never happen.
            return;
        }

        /* sacrifice clipped/warped tiles so tiles can be shared between views.
        // Initialization has to be here because we do not have the view in
        // the constructor.  NOTE: tiles cannot be shared between views
        if (view.gl && ! this.VertexPositionBuffer) {
            if ( ! cache.Warp) {
                this.VertexPositionBuffer = view.tileVertexPositionBuffer;
                this.VertexTextureCoordBuffer = view.tileVertexTextureCoordBuffer;
                this.CellBuffer = view.tileCellBuffer;
            } else {
                // Warp model.
                this.CreateWarpBuffer(cache.Warp, view.gl);
            }
        }
        */


        if (view.gl) {
            if (this.Texture == null) {
                this.CreateTexture(view.gl);
            }
            // These are the same for every tile.
            // Vertex points (shifted by tiles matrix)
            view.gl.bindBuffer(view.gl.ARRAY_BUFFER, view.tileVertexPositionBuffer);
            // Needed for outline ??? For some reason, DrawOutline did not work
            // without this call first.
            view.gl.vertexAttribPointer(view.ShaderProgram.vertexPositionAttribute,
                                        view.tileVertexPositionBuffer.itemSize,
                                        view.gl.FLOAT, false, 0, 0);     // Texture coordinates
            view.gl.bindBuffer(view.gl.ARRAY_BUFFER, view.tileVertexTextureCoordBuffer);
            view.gl.vertexAttribPointer(view.ShaderProgram.textureCoordAttribute,
                                        view.tileVertexTextureCoordBuffer.itemSize,
                                        view.gl.FLOAT, false, 0, 0);
            // Cell Connectivity
            view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, view.tileCellBuffer);

            // Texture
            view.gl.activeTexture(view.gl.TEXTURE0);
            view.gl.bindTexture(view.gl.TEXTURE_2D, this.Texture);

            view.gl.uniform1i(program.samplerUniform, 0);
            // Matrix that tranforms the vertex p
            view.gl.uniformMatrix4fv(program.mvMatrixUniform, false, this.Matrix);

            view.gl.drawElements(view.gl.TRIANGLES, view.tileCellBuffer.numItems, view.gl.UNSIGNED_SHORT, 0);
        } else {
            // It is harder to flip the y axis in 2d canvases because the image turns upside down too.
            // WebGL handles this by flipping the texture coordinates.  Here we have to
            // translate the tiles to the correct location.
            view.Context2d.save(); // Save the state of the transform so we can restore for the next tile.

            // Map tile to world.
            // Matrix is world to 0-1.
            view.Context2d.transform(this.Matrix[0], this.Matrix[1],
                                     this.Matrix[4], this.Matrix[5],
                                     this.Matrix[12], this.Matrix[13]);

            // Flip the tile upside down, but leave it in the same place
            view.Context2d.transform(1.0,0.0, 0.0,-1.0, 0.0, 1.0);

            // map pixels to Tile
            var tileSize = this.Cache.Image.TileSize;
            // This should not be necessary, quick hack around a bug in __init__.py
            if ( tileSize == undefined) {
                tileSize = 256;
            }
            view.Context2d.transform(1.0/tileSize, 0.0, 0.0, 1.0/tileSize, 0.0, 0.0);
            view.Context2d.drawImage(this.Image,0,0);


            if (SA.WaterMark) {
                var angle = (this.X+1)*(this.Y+1)*4.0
                view.Context2d.translate(128,128);
                view.Context2d.rotate(angle);
                view.Context2d.translate(-128,-128);
                view.Context2d.fillStyle = 'rgba(100, 100, 100, 0.05)';
                view.Context2d.strokeStyle = 'rgba(50,50,50, 0.05)';
                view.Context2d.font = "30px Comic Sans MS";
                //view.Context2d.strokeText("SlideAtlas",10,100);
                view.Context2d.fillText("SlideAtlas",10,10);
            }

            //  Transform to map (0->1, 0->1)
            view.Context2d.restore();
        }
    }

    Tile.prototype.CreateTexture = function (gl) {
        if (! gl) {
            alert("Textures need a gl instance");
            return;
        }
        if (this.Texture != null) { return;}

        ++SA.NumberOfTextures; // To determine when to prune textures.
        this.Texture = gl.createTexture();
        var texture = this.Texture;
        //alert(tile);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.Image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    Tile.prototype.DeleteTexture = function (gl) {
        if (! gl) {
            alert("Textures need a gl instance");
            return;
        }
        if (this.Texture) {
            --SA.NumberOfTextures; // To determine when to prune textures.
            gl.deleteTexture(this.Texture);
            this.Texture = null;
        }
    }

    SA.Tile = Tile;

})();
