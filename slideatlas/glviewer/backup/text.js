// TODO:
// Fix the webGL attributes not initialized properly warning.
// Multiple text object should share the same texture.
// Add symbols -=+[]{},.<>'";: .....



// I need an array to map ascii to my letter index.
// a = 97
var ASCII_LOOKUP =
    [[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //0
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //5
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //10
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //15
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //20
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //25
     [0,413,50,98],[0,413,50,98],[900,17,30,98],[791,119,28,95],[0,413,50,98], //30 32 = ' ' 33="!"
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //35
     [260,18,32,97],[292,18,32,97],[0,413,50,98],[0,413,50,98],[635,120,25,36], //40 40="(" 41=")" 44=','
     [783,17,37,57],[662,121,25,34],[687,121,46,96],[822,214,58,98],[881,214,50,98], //45 45="-" 46="." 47="/" 48 = 01
     [932,214,56,98],[0,114,53,98],[54,114,54,98],[109,114,54,98],[164,114,57,98], //50 = 23456
     [222,114,49,98],[272,114,57,98],[330,114,56,98],[554,18,25,76],[579,121,28,73], //55 = 789 (387 ') 58=":" 59=";"
     [0,413,50,98],[412,120,62,69],[0,413,50,98],[733,10,53,106],[0,413,50,98], //60 61 = "=" 63="?"
     [263,314,67,98],[331,314,55,98],[387,314,59,98],[447,314,66,98],[514,314,52,98], //65 = ABCDE
     [566,314,49,98],[616,314,67,98],[684,314,67,98],[752,314,24,98],[777,314,36,98], //70 = FGHIJ
     [814,314,58,98],[873,314,45,98],[919,314,88,98],[0,214,66,98],[69,214,72,98], //75 = KLMNO
     [142,214,54,98],[197,214,76,98],[274,214,53,98],[328,214,49,98],[378,214,55,98], //80 = PQRST
     [434,214,66,98],[501,214,63,98],[565,214,96,98],[662,214,55,98],[718,214,53,98], //85 = UVWXY
     [772,214,49,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //90 = Z
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[51,413,56,98],[108,413,50,98], //95 97 = abc
     [154,413,50,98],[210,413,50,98],[263,413,39,98],[301,413,50,98],[350,413,54,98], //100 = defgh
     [406,413,22,98],[427,413,34,98],[458,413,50,98],[508,413,24,98],[532,413,88,98], //105 = ijklm
     [619,413,57,98],[675,413,60,98],[734,413,57,98],[790,413,57,98],[847,413,40,98], //110 = nopqr
     [886,413,42,98],[925,413,41,98],[966,413,56,98],[0,314,49,98],[50,314,77,98], //115 = stuvw
     [127,314,48,98],[173,314,52,98],[224,314,42,98],[0,413,50,98],[0,413,50,98], //120 = xyz
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //125
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //130
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //135  
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //140
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //145
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //150
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //155
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //160
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //165
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //170
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //175
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //180
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //185
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //198
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //195
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //200
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //205
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //210
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //215
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //220
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //225
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //230
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //235
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //240
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //245
     [0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98],[0,413,50,98], //250
     [0,413,50,98]];


// All text object use the same texture map.
//var TEXT_TEXTURE;
//var TEXT_IMAGE;

function GetTextureLoadedFunction (text) {
  return function () {text.HandleLoadedTexture();}
}

function TextError () {
  alert("Could not load font");
}

function Text() {
  // All text objects sare the same texture map.
  //if (TEXT_TEXTURE == undefined ) {
  //}
  this.TextureLoaded = false;
  this.Texture = GL.createTexture();
  this.Image = new Image();
  this.Image.onload = GetTextureLoadedFunction(this); 
  //this.Image.onerror = TextError(); // Always fires for some reason.
  // This starts the loading.
  this.Image.src = IMAGE_PATH_URL +"letters.gif";
  
  this.Color = [0.5, 1.0, 1.0];
  this.Size = 30; // Height in pixels
  // Position of the anchor in the world coordinate system.
  this.Position = [100,100];

  // The anchor point and position are the same point.
  // Position is in world coordinates.
  // Anchor is in pixel coordinates of text (buffers).  
  // In pixel(text) coordinate system
  this.Anchor = [0,0];
  this.Active = false;
  
  //this.String = "Hello World";
  //this.String = "0123456789";
  this.String = ",./<>?[]\{}|-=~!@#$%^&*()_+";

  this.PixelBounds = [0,0,0,0];
};

Text.prototype.destructor=function() {
  // Get rid of the buffers?
}

Text.prototype.HandleLoadedTexture = function() {
  //var texture = TEXT_TEXTURE;
  var texture = this.Texture;
  GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
  GL.bindTexture(GL.TEXTURE_2D, texture);
  GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, this.Image);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR_MIPMAP_NEAREST);
  GL.generateMipmap(GL.TEXTURE_2D); 
  GL.bindTexture(GL.TEXTURE_2D, null);
  this.TextureLoaded = true;
  eventuallyRender();
}

Text.prototype.Draw = function (view) {
  if (this.TextureLoaded == false) {
    return;
  }
  if (this.Matrix == undefined) {
    this.UpdateBuffers();
    this.Matrix = mat4.create();
    mat4.identity(this.Matrix);
  }

  var program = textProgram;

  GL.useProgram(program);

  //ZERO,ONE,SRC_COLOR,ONE_MINUS_SRC_COLOR,ONE_MINUS_DST_COLOR,
  //SRC_ALPHA,ONE_MINUS_SRC_ALPHA,
  //DST_ALPHA,ONE_MINUS_DST_ALHPA,GL_SRC_ALPHA_SATURATE
  //GL.blendFunc(GL.SRC_ALPHA, GL.ONE);
  GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
  GL.enable(GL.BLEND);
  //GL.disable(GL.DEPTH_TEST);

  // These are the same for every tile.
  // Vertex points (shifted by tiles matrix)
  GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
  // Needed for outline ??? For some reason, DrawOutline did not work
  // without this call first.
  GL.vertexAttribPointer(program.vertexPositionAttribute, 
                         this.VertexPositionBuffer.itemSize, 
                         GL.FLOAT, false, 0, 0);     // Texture coordinates
  GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexTextureCoordBuffer);
  GL.vertexAttribPointer(program.textureCoordAttribute, 
                         this.VertexTextureCoordBuffer.itemSize, 
                         GL.FLOAT, false, 0, 0);
  // Cell Connectivity
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
  
  // Color of text
  if (this.Active) {
    GL.uniform3f(program.colorUniform, 1.0, 1.0, 0.0);
  } else {
    GL.uniform3f(program.colorUniform, this.Color[0], this.Color[1], this.Color[2]);
  }
  // Draw characters.
  GL.viewport(view.Viewport[0], view.Viewport[1], 
              view.Viewport[2], view.Viewport[3]);

  var viewFrontZ = view.Camera.ZRange[0]+0.01; 

  // Lets use the camera to change coordinate system to pixels.
  // TODO: Put this camera in the view or viewer to avoid creating one each render.
  var camMatrix = mat4.create();
  mat4.identity(camMatrix);
  camMatrix[0] = 2.0 / view.Viewport[2];
  camMatrix[12] = -1.0;
  camMatrix[5] = 2.0 / view.Viewport[3];
  camMatrix[13] = -1.0;
  camMatrix[14] = viewFrontZ; // In front of everything (no depth buffer anyway).
  GL.uniformMatrix4fv(program.pMatrixUniform, false, camMatrix);

  // Place the anchor of the text.
  // First transform the world anchor to view.
  var m = view.Camera.Matrix;
  var x = (this.Position[0]*m[0] + this.Position[1]*m[4] + m[12])/m[15];
  var y = (this.Position[0]*m[1] + this.Position[1]*m[5] + m[13])/m[15];
  // convert view to pixels (view coordinate ssytem).
  x = view.Viewport[2]*(0.5*(x+1.0));
  y = view.Viewport[3]*(0.5*(y+1.0));
  // Translate the anchor to x,y
  this.Matrix[12] = x - this.Anchor[0];
  this.Matrix[13] = y - this.Anchor[1];
  GL.uniformMatrix4fv(program.mvMatrixUniform, false, this.Matrix);

  GL.activeTexture(GL.TEXTURE0);
  GL.bindTexture(GL.TEXTURE_2D, this.Texture);
  GL.uniform1i(program.samplerUniform, 0);

  GL.drawElements(GL.TRIANGLES, this.CellBuffer.numItems, GL.UNSIGNED_SHORT,0);
}



Text.prototype.UpdateBuffers = function() {
  // Create a textured quad for each letter.
  var vertexPositionData = [];
  var textureCoordData = [];
  var cellData = [];
  // 128 for power of 2, but 98 to top of characters.
  var top = 98.0 / 128.0; // Top texture coordinate value
  var charLeft = 0;
  var charBottom = 0;
  var ptId = 0;
  this.PixelBounds = [0,0,0,this.Size];

  for (var i = 0; i < this.String.length; ++i) {
    var idx = this.String.charCodeAt(i);
    if (idx == 10 || idx == 13) { // newline
      charLeft = 0;
      charBottom -= this.Size;
    } else {
      var port = ASCII_LOOKUP[idx];
      // Convert to texture coordinate values.
      var tLeft =   port[0] / 1024.0;
      var tRight = (port[0]+port[2]) / 1024.0;
      var tBottom = port[1] / 512.0;
      var tTop =   (port[1]+port[3]) / 512.0;
      // To place verticies
      var charRight = charLeft + port[2]*this.Size / 98.0;
      var charTop = charBottom + port[3]*this.Size / 98.0;
      
      // Accumulate bounds;
      if (this.PixelBounds[0] > charLeft)   {this.PixelBounds[0] = charLeft;}
      if (this.PixelBounds[1] < charRight)  {this.PixelBounds[1] = charRight;}
      if (this.PixelBounds[2] > charBottom) {this.PixelBounds[2] = charBottom;}
      if (this.PixelBounds[3] < charTop)    {this.PixelBounds[3] = charTop;}

      // Make 4 points, We could share points.
      textureCoordData.push(tLeft);
      textureCoordData.push(tBottom);
      vertexPositionData.push(charLeft);
      vertexPositionData.push(charBottom);
      vertexPositionData.push(0.0);
      
      textureCoordData.push(tRight);
      textureCoordData.push(tBottom);
      vertexPositionData.push(charRight);
      vertexPositionData.push(charBottom);
      vertexPositionData.push(0.0);
      
      textureCoordData.push(tLeft);
      textureCoordData.push(tTop);
      vertexPositionData.push(charLeft);
      vertexPositionData.push(charTop);
      vertexPositionData.push(0.0);
      
      textureCoordData.push(tRight);
      textureCoordData.push(tTop);
      vertexPositionData.push(charRight);
      vertexPositionData.push(charTop);
      vertexPositionData.push(0.0);
      
      charLeft = charRight;
      
      // Now create the cell.    
      cellData.push(0 + ptId);
      cellData.push(1 + ptId);
      cellData.push(2 + ptId);
      
      cellData.push(2 + ptId);
      cellData.push(1 + ptId);
      cellData.push(3 + ptId);
      ptId += 4;
    }
  }

  this.VertexTextureCoordBuffer = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexTextureCoordBuffer);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(textureCoordData), GL.STATIC_DRAW);
  this.VertexTextureCoordBuffer.itemSize = 2;
  this.VertexTextureCoordBuffer.numItems = textureCoordData.length / 2;
  
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

Text.prototype.HandleMouseMove = function(event, dx,dy) {
    // convert the position to screen pixel coordinates.
    viewer = event.CurrentViewer;
    //var screenPixelPoint = viewer.WorldPointToScreenPixelPoint(this. ..................

    return false;
}

Text.prototype.SetColor = function (c) {
  this.Color = ConvertColor(c);
}



