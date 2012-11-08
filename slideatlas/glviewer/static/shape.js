// TODO:
// make a shape superclass.


function Shape() {
  this.Orientation = 0.0; // in degrees, counter clockwise, 0 is left
  this.Origin = [10000,10000]; // Anchor in world coordinates.
  this.FixedSize = true;
  this.FixedOrientation = true;
  this.LineWidth = 0; // Line width has to be in same coordiantes as points.
  this.Visibility = true; // An easy way to turn off a shape (with removing it from the shapeList).
  this.Active = false;
  this.ActiveColor = [1.0, 1.0, 0.0];
  // Playing around with layering.  The anchor is being obscured by the text.
  this.ZOffset = 0.1;
  };

Shape.prototype.destructor=function() {
  // Get rid of the buffers?
}

Shape.prototype.Draw = function (view) {
  if ( ! this.Visibility) {
    return;
  }
  var program = polyProgram;

  if (this.Matrix == undefined) {
    this.UpdateBuffers();
  }

  GL.useProgram(program);
  GL.disable(GL.BLEND);
  GL.enable(GL.DEPTH_TEST);

  // This does not work.
  // I will need to make thick lines with polygons.
  //GL.lineWidth(5);

  // These are the same for every tile.
  // Vertex points (shifted by tiles matrix)
  GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
  // Needed for outline ??? For some reason, DrawOutline did not work
  // without this call first.
  GL.vertexAttribPointer(program.vertexPositionAttribute, 
                         this.VertexPositionBuffer.itemSize, 
                         GL.FLOAT, false, 0, 0);     // Texture coordinates
  // Local view.
  GL.viewport(view.Viewport[0], view.Viewport[1], 
              view.Viewport[2], view.Viewport[3]);

  var viewFrontZ = view.Camera.ZRange[0]+0.01;

  // Lets use the camera to change coordinate system to pixels.
  // TODO: Put this camera in the view or viewer to avoid creating one each render.
  var camMatrix = mat4.create();
  mat4.identity(camMatrix);
  if (this.FixedSize) {
    // This camera matric changes pixel/ screen coordinate sytem to
    // view [-1,1],[-1,1],z
    camMatrix[0] = 2.0 / view.Viewport[2];
    camMatrix[12] = -1.0;
    camMatrix[5] = 2.0 / view.Viewport[3];
    camMatrix[13] = -1.0;
    camMatrix[14] = viewFrontZ; // In front of tiles in this view
    GL.uniformMatrix4fv(program.pMatrixUniform, false, camMatrix);
  } else {
    // Use main views camera to convert world to view.
    GL.uniformMatrix4fv(program.pMatrixUniform, false, view.Camera.Matrix);
  }

  // The actor matrix that rotates to orientation and shift (0,0) to origin.
  // Rotate based on ivar orientation.
  var theta = this.Orientation * 3.1415926536 / 180.0;
  this.Matrix[0] =  Math.cos(theta);
  this.Matrix[1] =  Math.sin(theta);
  this.Matrix[4] = -Math.sin(theta);
  this.Matrix[5] =  Math.cos(theta);
  // Place the origin of the shape.
  x = this.Origin[0];
  y = this.Origin[1];
  if (this.FixedSize) {
    // For fixed size, translation mus be in view/pixel coordinates.
    // First transform the world to view.
    var m = view.Camera.Matrix;
    var x = (this.Origin[0]*m[0] + this.Origin[1]*m[4] + m[12])/m[15];
    var y = (this.Origin[0]*m[1] + this.Origin[1]*m[5] + m[13])/m[15];
    // convert view to pixels (view coordinate ssytem).
    x = view.Viewport[2]*(0.5*(x+1.0));
    y = view.Viewport[3]*(0.5*(y+1.0));
  }
  // Translate to place the origin.
  this.Matrix[12] = x;
  this.Matrix[13] = y;
  this.Matrix[14] = this.ZOffset;
  GL.uniformMatrix4fv(program.mvMatrixUniform, false, this.Matrix);

  // Fill color
  if (this.FillColor != undefined) {
    if (this.Active) {
      GL.uniform3f(program.colorUniform, this.ActiveColor[0], 
                   this.ActiveColor[1], this.ActiveColor[2]);
  	} else {
	    GL.uniform3f(program.colorUniform, this.FillColor[0], 
                   this.FillColor[1], this.FillColor[2]);
    }
    // Cell Connectivity
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
      
    GL.drawElements(GL.TRIANGLES, this.CellBuffer.numItems, 
                    GL.UNSIGNED_SHORT,0);
  }
  // Outline.
  if (this.OutlineColor != undefined) {
    if (this.Active) {
	    GL.uniform3f(program.colorUniform, this.ActiveColor[0], 
			             this.ActiveColor[1], this.ActiveColor[2]);
    } else {
	    GL.uniform3f(program.colorUniform, this.OutlineColor[0], 
                   this.OutlineColor[1], this.OutlineColor[2]);
    }
    if (this.LineWidth == 0) {
      GL.drawArrays(GL.LINE_STRIP, 0, this.VertexPositionBuffer.numItems);
    } else {
      // Cell Connectivity
      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.LineCellBuffer);
      GL.drawElements(GL.TRIANGLES, this.LineCellBuffer.numItems, 
                      GL.UNSIGNED_SHORT,0);
    }
  }
}

Shape.prototype.SetOutlineColor = function (c) {
  this.OutlineColor = this.ConvertColor(c);
}

Shape.prototype.SetFillColor = function (c) {
  this.FillColor = this.ConvertColor(c);
}

// Make sure the color is an array of values 0->1
Shape.prototype.ConvertColor = function (color) {
  // Deal with color names.
  if ( typeof(color)=='string' && color[0] != '#') {
    var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
      "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
      "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
      "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
      "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
      "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
      "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
      "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
      "honeydew":"#f0fff0","hotpink":"#ff69b4",
      "indianred ":"#cd5c5c","indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
      "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
      "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
      "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
      "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
      "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
      "navajowhite":"#ffdead","navy":"#000080",
      "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
      "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
      "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
      "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
      "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
      "violet":"#ee82ee",
      "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
      "yellow":"#ffff00","yellowgreen":"#9acd32"};
    if (typeof colors[color.toLowerCase()] != 'undefined') {
        color = colors[color.toLowerCase()];
    } else {
        alert("Unknow color " + color);
    }
  }

  // Deal with color in hex format i.e. #0000ff
  if ( typeof(color)=='string' && color.length == 7 && color[0] == '#') {
    var floatColor = [];
    var idx = 1;
    for (var i = 0; i < 3; ++i) {
	    var val = ((16.0 * this.HexDigitToInt(color[idx++])) + this.HexDigitToInt(color[idx++])) / 255.0; 
	    floatColor.push(val);
    }
    return floatColor;
  }
  // No other formats for now.
  return color;
}

// RGB [Float, Float, Float] to #RRGGBB
Shape.prototype.ConvertColorToHex = function (color) {
  var hexDigits = "0123456789abcdef";
  var str = "#";
  for (var i = 0; i < 3; ++i) {
    var tmp = color[i];
    for (var j = 0; j < 2; ++j) {
      tmp *= 16.0;
      var digit = Math.floor(tmp);
      if (digit < 0) { digit = 0; } 
      if (digit > 15){ digit = 15;} 
      tmp = tmp - digit;
      str += hexDigits.charAt(digit);
    }
  }
  return str;
}


// 0-f hex digit to int
Shape.prototype.HexDigitToInt = function (hex) {
  if (hex == '1') {
    return 1.0;
  } else if (hex == '2') {
    return 2.0;
  } else if (hex == '3') {
    return 3.0;
  } else if (hex == '4') {
    return 4.0;
  } else if (hex == '5') {
    return 5.0;
  } else if (hex == '6') {
    return 6.0;
  } else if (hex == '7') {
    return 7.0;
  } else if (hex == '8') {
    return 8.0;
  } else if (hex == '9') {
    return 9.0;
  } else if (hex == 'a' || hex == 'A') {
    return 10.0;
  } else if (hex == 'b' || hex == 'B') {
    return 11.0;
  } else if (hex == 'c' || hex == 'C') {
    return 12.0;
  } else if (hex == 'd' || hex == 'D') {
    return 13.0;
  } else if (hex == 'e' || hex == 'E') {
    return 14.0;
  } else if (hex == 'f' || hex == 'F') {
    return 15.0;
  }
  return 0.0;
}

Shape.prototype.HandleMouseMove = function(event, dx,dy) {
  // superclass does nothing
  return false;
}

//Shape.prototype.UpdateBuffers = function() {
    //    // The superclass does not implement this method.
//}

Shape.prototype.IntersectPointLine = function(pt, end0, end1, thickness) {
  // make end0 the origin.
  var x = pt[0] - end0[0];
  var y = pt[1] - end0[1];
  var vx = end1[0] - end0[0];
  var vy = end1[1] - end0[1];
  
  // Rotate so the edge lies on the x axis.
  var length = Math.sqrt(vx*vx + vy*vy); // Avoid atan2 ... with clever use of complex numbers.
  vx = vx/length;
  vy = -vy/length;
  var newX = (x*vx - y*vy);
  var newY = (x*vy + y*vx);
  
  if (newX >= 0.0 && newX <= length) {
    if (Math.abs(newY) < (thickness *0.5)) {
      return true;
    }
  return false;
  }
}
  
