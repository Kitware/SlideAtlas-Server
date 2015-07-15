//==============================================================================
// Attempting to make the viewer a jqueryUI widget.
// args = {overview:true, zoomWidget:true}
jQuery.prototype.saViewer = function(args) {
    for (var i = 0; i < this.length; ++i) {
        if ( ! this[i].saViewer) {
            var viewer = new Viewer($(this[i]), args);
            // Add the viewer as an instance variable to the dom object.
            this[i].saViewer = viewer;
            // TODO: Get rid of the event manager.
            EVENT_MANAGER.AddViewer(viewer);
        }
        // TODO:  If the viewer is already created, just reformat the
        // viewer with new parameters. (image info ...)
        // Separate out the args from the constructor.
    }
    // I am uncertain what the API should be:
    // - jQueryUI like with control through arguments.
    // - Object oriented
    //   - Access to viewer object through the dom element
    //   - Access to viewer object through the jQuery list/selector.
    return this;
}




//==============================================================================
// jQuery extension for a full window div.
// parent must be the body?  Maybe not.  Lets see if a full height is better.
// I think position should be set to fixed or absolute.

// TODO: Convert the viewer to use this.

// No args / options.
jQuery.prototype.saFullHeight = function() {
    this.css({'top':'0px'});
    this.addClass('sa-full-height');
    //for (var i = 0; i < this.length; ++i) {
        // I want to put the resize event on "this[i]",
        // but, I am afraid in might not get trigerend always, or
        // setting the height would cause recursive calls to resize.
    //}

    $(window).resize(
        function() {
            var height = window.innerHeight;
            $('.sa-full-height')
                .css({'top':    '0px',
                      'height': height+'px'});
            // Hack until I can figure out why the resize event is not
            // firing for descendants.
            // This did not work.  It also triggered resize on the window
            // causeing infinite recusion.
            //$('.sa-resize').trigger('resize');
            var elements = $('.sa-resize');
            for (var i = 0; i < elements.length; ++i) {
                elements[i].onresize();
            }
        })
        .trigger('resize');

    return this;
}

//==============================================================================
// I am having such troubles setting the right panel width to fill.
// Solution is to have this element control too divs (panel and main).
// If the panel overlaps the main, we do not need to manage the main panel.
// It would have to be implemented on the panel div, not the parent div.

// TODO: Verify this works in a stand alone page.
// args
// option to specify the handle.
// option to place panel: left, right, top, bottom.
// Use it for the Notes panel.
// Use it for the presentation edit panel
// use it for dual view.

function ResizePanel(parent) {
    var self = this;

    // For animating the display of the notes window (DIV).
    this.Width = 300;

    this.PanelDiv = $('<div>').appendTo(parent)
        .css({
            'background-color': 'white',
            'position': 'absolute',
            'top' : '0px',
            'bottom':'0px',
            'left' : '0px',
            'width': this.width+'px'})
        .attr('draggable','false')
        .on("dragstart", function() {return false;});
    this.MainDiv = $('<div>').appendTo(parent)
        .css({
            'position': 'absolute',
            'top' : '0px',
            'bottom':'0px',
            'left' : this.Width+'px',
            'right':'0px',
            'border':'1px solid #AAA'})
        .attr('draggable','false')
        .on("dragstart", function() {return false;});

    this.OpenNoteWindowButton = $('<img>')
        .appendTo(this.MainDiv)
        .css({'position': 'absolute',
              'height': '20px',
              'width': '20px',
              'top' : '0px',
              'left' : '3px',
              'opacity': '0.6',
              '-moz-user-select': 'none',
              '-webkit-user-select': 'none',
              'z-index': '6'})
        .attr('src',"webgl-viewer/static/dualArrowRight2.png")
        .click(function(){self.ToggleNotesWindow();})
        .attr('draggable','false')
        .hide()
        .on("dragstart", function() {
            return false;});

    // I have no idea why the position right does not work.
    this.CloseNoteWindowButton = $('<img>')
        .appendTo(this.MainDiv)
        .css({'position': 'absolute',
              'height': '20px',
              'top' : '0px',
              'left' : '-20px',
              'opacity': '0.6',
              '-moz-user-select': 'none',
              '-webkit-user-select': 'none',
              'z-index': '6'})
        //.hide()
        .attr('src',"webgl-viewer/static/dualArrowLeft2.png")
        .click(function(){self.ToggleNotesWindow();})
        .attr('draggable','false')
        .on("dragstart", function() {
            return false;});


    this.Visibilty = false;
    this.Dragging = false;

    this.ResizeNoteWindowEdge = $('<div>')
        .appendTo(VIEW_PANEL)
        .css({'position': 'absolute',
              'height': '100%',
              'width': '3px',
              'top' : '0px',
              'left' : '0px',
              'background': '#BDF',
              'z-index': '10',
              'cursor': 'col-resize'})
        .hover(function () {$(this).css({'background':'#9BF'});},
               function () {$(this).css({'background':'#BDF'});})
        .mousedown(function () {
            self.StartDrag();
        });
}

// TODO: Remove reference to body directly
// Maybe use parent.
ResizePanel.prototype.StartDrag = function () {
    this.Dragging = true;
    $('body').bind('mousemove',this.ResizeDrag);
    $('body').bind('mouseup', this.ResizeStopDrag);
    $('body').css({'cursor': 'col-resize'});
}

ResizePanel.ResizeDrag = function (e) {
    this.SetWidth(e.pageX - 1);
    if (this.Width < 200) {
        this.ResizeStopDrag();
        this.ToggleNotesWindow();
    }

    return false;
}
ResizePanel.ResizeStopDrag = function () {
    $('body').unbind('mousemove',this.ResizeDrag);
    $('body').unbind('mouseup', this.ResizeStopDrag);
    $('body').css({'cursor': 'auto'});
}




// TODO: Notes widget should just follow the parent.
// Get rid of this.
ResizePanel.prototype.SetWidth = function(width) {
    this.Width = width;
    this.Window.width(width);
    // TODO: Get rid of this hack.
    $(window).trigger('resize');
}

ResizePanel.prototype.AnimateNotesWindow = function() {
    var timeStep = new Date().getTime() - this.AnimationLastTime;
    if (timeStep > this.AnimationDuration) {
        // end the animation.
        this.SetWidth(this.AnimationTarget);
        // Hack to recompute viewports
        // TODO: Get rid of this hack.
        $(window).trigger('resize');

        if (this.Visibilty) {
            this.CloseNoteWindowButton.show();
            this.OpenNoteWindowButton.hide();
            this.Window.fadeIn();
        } else {
            this.CloseNoteWindowButton.hide();
            this.OpenNoteWindowButton.show();
        }
        draw();
        return;
    }

    var k = timeStep / this.AnimationDuration;

    // update
    this.AnimationDuration *= (1.0-k);
    this.SetWidth(this.Width + (this.AnimationTarget-this.Width) * k);

    draw();
    var self = this;
    requestAnimFrame(function () {self.AnimateNotesWindow();});
}

ResizePanel.prototype.ToggleNotesWindow = function() {
    this.Visibilty = ! this.Visibilty;
    RecordState();

    if (this.Visibilty) {
        this.AnimationCurrent = this.Width;
        this.AnimationTarget = 325;
    } else {
        this.Window.hide();
        this.AnimationCurrent = this.Width;
        this.AnimationTarget = 0;
    }
    this.AnimationLastTime = new Date().getTime();
    this.AnimationDuration = 1000.0;
    this.AnimateNotesWindow();
}


//==============================================================================







//==============================================================================


// RGB [Float, Float, Float] to #RRGGBB string
var ConvertColorToHex = function(color) {
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
var HexDigitToInt = function(hex) {
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
var ConvertColor = function(color) {
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




