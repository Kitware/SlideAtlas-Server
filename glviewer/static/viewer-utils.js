

// RGB [Float, Float, Float] to #RRGGBB string
function ConvertColorToHex(color) {
  if (typeof(color) == 'string') { return color; }
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
function HexDigitToInt(hex) {
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


// Not used at the moment.
// Make sure the color is an array of values 0->1
function ConvertColor(color) {
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
        alert("Unknown color " + color);
    }
  }

  // Deal with color in hex format i.e. #0000ff
  if ( typeof(color)=='string' && color.length == 7 && color[0] == '#') {
    var floatColor = [];
    var idx = 1;
    for (var i = 0; i < 3; ++i) {
      var val = ((16.0 * HexDigitToInt(color[idx++])) + HexDigitToInt(color[idx++])) / 255.0;
      floatColor.push(val);
    }
    return floatColor;
  }
  // No other formats for now.
  return color;
}




