// -Separating annotations from the viewer. They have their own canvas / layer now.
// -This is more like a view than a viewer.
// -Viewer still handles stack correlations crosses.
// -This object does not bind events, but does have handle methods called by
//  the viewer.  We could change this if the annotationsLayer received
//  events before the viewer.
// -Leave the copyright stuff in the viewer too.  It is not rendered in the canvas.
// -AnnotationWidget (the panel for choosing an annotation to add) is
//  separate from this class.
// -I will need to fix saving images from the canvas.  Saving large imag
//  should still work. Use this for everything.
// -This class does not handle annotation visibility (part of annotationWidget).



(function () {
    "use strict";

    window.SAM = window.SAM || {};
    window.SAM.ImagePathUrl = "/webgl-viewer/static/";

    // Not used at the moment.
    // Make sure the color is an array of values 0->1
    SAM.ConvertColor = function(color) {
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
                var val = ((16.0 * SAM.HexDigitToInt(color[idx++])) + SAM.HexDigitToInt(color[idx++])) / 255.0;
                floatColor.push(val);
            }
            return floatColor;
        }
        // No other formats for now.
        return color;
    }


    // RGB [Float, Float, Float] to #RRGGBB string
    SAM.ConvertColorToHex = function(color) {
        if (typeof(color) == 'string') { 
            color = SAM.ConvertColorNameToHex(color);
            if (color.substring(0,1) == '#') {
                return color;
            } else if (color.substring(0,3) == 'rgb') {
                tmp = color.substring(4,color.length - 1).split(',');
                color = [parseInt(tmp[0])/255,
                         parseInt(tmp[1])/255,
                         parseInt(tmp[2])/255];
            }
        }
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
    SAM.HexDigitToInt = function(hex) {
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


    SAM.ConvertColorNameToHex = function(color) {
        // Deal with color names.
        if ( typeof(color)=='string' && color[0] != '#') {
            var colors = {
                "aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff",
                "aquamarine":"#7fffd4","azure":"#f0ffff","beige":"#f5f5dc",
                "bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd",
                "blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a",
                "burlywood":"#deb887","cadetblue":"#5f9ea0","chartreuse":"#7fff00",
                "chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed",
                "cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
                "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b",
                "darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b",
                "darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
                "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000",
                "darksalmon":"#e9967a","darkseagreen":"#8fbc8f",
                "darkslateblue":"#483d8b","darkslategray":"#2f4f4f",
                "darkturquoise":"#00ced1","darkviolet":"#9400d3",
                "deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969",
                "dodgerblue":"#1e90ff","firebrick":"#b22222","floralwhite":"#fffaf0",
                "forestgreen":"#228b22","fuchsia":"#ff00ff","gainsboro":"#dcdcdc",
                "ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520",
                "gray":"#808080","green":"#008000","greenyellow":"#adff2f",
                "honeydew":"#f0fff0","hotpink":"#ff69b4","indianred":"#cd5c5c",
                "indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
                "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00",
                "lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080",
                "lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
                "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1",
                "lightsalmon":"#ffa07a","lightseagreen":"#20b2aa",
                "lightskyblue":"#87cefa","lightslategray":"#778899",
                "lightsteelblue":"#b0c4de","lightyellow":"#ffffe0","lime":"#00ff00",
                "limegreen":"#32cd32","linen":"#faf0e6","magenta":"#ff00ff",
                "maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd",
                "mediumorchid":"#ba55d3","mediumpurple":"#9370d8",
                "mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
                "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc",
                "mediumvioletred":"#c71585","midnightblue":"#191970",
                "mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
                "navajowhite":"#ffdead","navy":"#000080","oldlace":"#fdf5e6",
                "olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500",
                "orangered":"#ff4500","orchid":"#da70d6","palegoldenrod":"#eee8aa",
                "palegreen":"#98fb98","paleturquoise":"#afeeee",
                "palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9",
                "peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd",
                "powderblue":"#b0e0e6","purple":"#800080","red":"#ff0000",
                "rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513",
                "salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57",
                "seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0",
                "skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090",
                "snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
                "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347",
                "turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3",
                "white":"#ffffff","whitesmoke":"#f5f5f5",
                "yellow":"#ffff00","yellowgreen":"#9acd32"};
            color = color.toLowerCase();
            if (typeof colors[color] != 'undefined') {
                color = colors[color];
            }
        }
        return color;
    }


    // length units = meters
    window.SAM.DistanceToString = function(length) {
        var lengthStr = "";
        if (length < 0.001) {
            // Latin-1 00B5 is micro sign
            lengthStr += (length*1e6).toFixed(2) + " \xB5m";
        } else if (length < 0.01) {
            lengthStr += (length*1e3).toFixed(2) + " mm";
        } else if (length < 1.0)  {
            lengthStr += (length*1e2).toFixed(2) + " cm";
        } else if (length < 1000) {
            lengthStr += (length).toFixed(2) + " m";
        } else {
            lengthStr += (length).toFixed(2) + " km";
        }
        return lengthStr;
    }

    window.SAM.StringToDistance = function(lengthStr) {
        var length = 0;
        lengthStr = lengthStr.trim(); // remove leading and trailing spaces.
        var len = lengthStr.length;
        // Convert to microns
        if (lengthStr.substring(len-2,len) == "\xB5m") {
            length = parseFloat(lengthStr.substring(0,len-2)) / 1e6;
        } else if (lengthStr.substring(len-2,len) == "mm") { 
            length = parseFloat(lengthStr.substring(0,len-2)) / 1e3;
        } else if (lengthStr.substring(len-2,len) == "cm") { 
            length = parseFloat(lengthStr.substring(0,len-2)) / 1e2;
        } else if (lengthStr.substring(len-2,len) == " m") { 
            length = parseFloat(lengthStr.substring(0,len-2));
        } else if (lengthStr.substring(len-2,len) == "km") { 
            length = parseFloat(lengthStr.substring(0,len-2)) * 1e3;
        }

        return length;
    }


    // Pass in the viewer div.
    // TODO: Pass the camera into the draw method.  It is shared here.
    function AnnotationLayer (viewerDiv, viewerCamera) {
        var self = this;

        // TODO: Abstract the view to a layer somehow.
        this.AnnotationView = new View(viewerDiv);
        this.AnnotationView.CanvasDiv.css({'z-index':'100'});
        this.AnnotationView.Canvas
            .saOnResize(function() {self.UpdateCanvasSize();});

        // TODO: Get rid of this.
        this.AnnotationView.InitializeViewport([0,0,100,100]);
        //this.AnnotationView.OutlineColor = [0,0,0];
        // Uses the same camera.
        this.AnnotationView.Camera = viewerCamera;

        this.WidgetList = [];
        this.ActiveWidget = null;

        this.Visibility = true;
        // Scale widget is unique. Deal with it separately so it is not
        // saved with the notes.
        this.ScaleWidget = new SAM.ScaleWidget(this, false);


        var self = this;
        var can = this.AnnotationView.CanvasDiv;
        can.on(
            "mousedown.viewer",
			      function (event){
                return self.HandleMouseDown(event);
            });
        can.on(
            "mousemove.viewer",
			      function (event){
                // So key events go the the right viewer.
                this.focus();
                // Firefox does not set which for mouse move events.
                saFirefoxWhich(event);
                return self.HandleMouseMove(event);
            });
        // We need to detect the mouse up even if it happens outside the canvas,
        $(document.body).on(
            "mouseup.viewer",
			      function (event){
                self.HandleMouseUp(event);
                return true;
            });
        can.on(
            "wheel.viewer",
            function(event){
                return self.HandleMouseWheel(event.originalEvent);
            });
        
        // I am delaying getting event manager out of receiving touch events.
        // It has too many helper functions.
        can.on(
            "touchstart.viewer",
            function(event){
                return self.HandleTouchStart(event.originalEvent);
            });
        can.on(
            "touchmove.viewer",
            function(event){
                return self.HandleTouchMove(event.originalEvent);
            });
        can.on(
            "touchend.viewer",
            function(event){
                self.HandleTouchEnd(event.originalEvent);
                return true;
            });

        // necesary to respond to keyevents.
        this.AnnotationView.CanvasDiv.attr("tabindex","1");
        can.on(
            "keydown.viewer",
			      function (event){
                //alert("keydown");
                return self.HandleKeyDown(event);
            });
    }

    // Try to remove all global references to this viewer.
    AnnotationLayer.prototype.Delete = function () {
        this.AnnotationView.Delete();
    }

    AnnotationLayer.prototype.GetVisibility = function () {
        return this.Visibility;
    }
    AnnotationLayer.prototype.SetVisibility = function (vis) {
        this.Visibility = vis;
        this.EventuallyDraw();
    }

    // I might get rid of the view and make this a subclass.
    AnnotationLayer.prototype.GetCamera = function () {
        return this.AnnotationView.GetCamera();
    }
    AnnotationLayer.prototype.GetViewport = function () {
        return this.AnnotationView.Viewport;
    }
    AnnotationLayer.prototype.UpdateCanvasSize = function () {
        this.AnnotationView.UpdateCanvasSize();
    }
    AnnotationLayer.prototype.Clear = function () {
        this.AnnotationView.Clear();
    }
    // Is Div to ambiguous?
    AnnotationLayer.prototype.GetCanvasDiv = function () {
        return this.AnnotationView.CanvasDiv;
    }
    // Get the current scale factor between pixels and world units.
    AnnotationLayer.prototype.GetPixelsPerUnit = function() {
        return this.AnnotationView.GetPixelsPerUnit();
    }


    // the view arg is necessary for rendering into a separate canvas for
    // saving large images.
    AnnotationLayer.prototype.Draw = function (view) {
        view = view || this.AnnotationView;
        view.Clear();
        if ( ! this.Visibility) { return;}
        for(var i = 0; i < this.WidgetList.length; ++i) {
            // The last parameter is obsolete (visiblity mode)
            this.WidgetList[i].Draw(view, 2);
        }
        if (this.ScaleWidget) {
            this.ScaleWidget.Draw(view);
        }
    }

    // To compress draw events.
    AnnotationLayer.prototype.EventuallyDraw = function() {
        if ( ! this.RenderPending) {
            this.RenderPending = true;
            var self = this;
            requestAnimFrame(
                function() {
                    self.RenderPending = false;
                    self.Draw();
                });
        }
    }
    
    // Load a widget from a json object (origin MongoDB).
    AnnotationLayer.prototype.LoadWidget = function(obj) {
        var widget;
        switch(obj.type){
        case "lasso":
            widget = new SAM.LassoWidget(this, false);
            break;
        case "pencil":
            widget = new SAM.PencilWidget(this, false);
            break;
        case "text":
            widget = new SAM.TextWidget(this, "");
            break;
        case "circle":
            widget = new SAM.CircleWidget(this, false);
            break;
        case "polyline":
            widget = new SAM.PolylineWidget(this, false);
            break;
        case "stack_section":
            widget = new SAM.StackSectionWidget(this);
            break;
        case "sections":
            widget = new SAM.SectionsWidget(this);
            break;
        case "rect":
            widget = new SAM.RectWidget(this, false);
            break;
        case "grid":
            widget = new SAM.GridWidget(this, false);
            break;
        }
        widget.Load(obj);
        // TODO: Get rid of this hack.
        // This is the messy way of detecting widgets that did not load
        // properly.
        if (widget.Type == "sections" && widget.IsEmpty()) {
            return undefined;
        }

        // We may want to load without adding.
        //this.AddWidget(widget);

        return widget;
    }

    // I expect only the widget SetActive to call these method.
    // A widget cannot call this if another widget is active.
    // The widget deals with its own activation and deactivation.
    AnnotationLayer.prototype.ActivateWidget = function(widget) {
        if (this.ActiveWidget == widget) {
            return;
        }
        // Make sure only one popup is visible at a time.
        for (var i = 0; i < this.WidgetList.length; ++i) {
            if (this.WidgetList[i].Popup) {
                this.WidgetList[i].Popup.Hide();
            }
        }

        this.ActiveWidget = widget;
        widget.SetActive(true);
    }
    AnnotationLayer.prototype.DeactivateWidget = function(widget) {
        if (this.ActiveWidget != widget || widget == null) {
            // Do nothing if the widget is not active.
            return;
        }
        // Incase the widget changed the cursor.  Change it back.
        this.GetCanvasDiv().css({'cursor':'default'});
        this.ActiveWidget = null;
        widget.SetActive(false);
    }
    AnnotationLayer.prototype.GetActiveWidget = function() {
        return this.ActiveWidget;
    }

    // Return to initial state.
    AnnotationLayer.prototype.Reset = function() {
        this.WidgetList = [];
    }

    AnnotationLayer.prototype.ComputeMouseWorld = function(event) {
        this.MouseWorld = this.GetCamera().ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        // Put this extra ivar in the even object.
        event.worldX = this.MouseWorld[0];
        event.worldY= this.MouseWorld[1];
        return this.MouseWorld;
    }

    // TODO: Try to get rid of the viewer argument.
    AnnotationLayer.prototype.HandleTouchStart = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        // Code from a conflict
        // Touch was not activating widgets on the ipad.
        // Show text on hover.
        if (this.Visibility) {
            for (var touchIdx = 0; touchIdx < this.Touches.length; ++touchIdx) {
                this.MouseX = this.Touches[touchIdx][0];
                this.MouseY = this.Touches[touchIdx][1];
                this.ComputeMouseWorld(event);
                for (var i = 0; i < this.WidgetList.length; ++i) {
                    if ( ! this.WidgetList[i].GetActive() &&
                         this.WidgetList[i].CheckActive(event)) {
                        this.ActivateWidget(this.WidgetList[i]);
                        return true;
                    }
                }
            }
        }
        // end conflict

        for (var touchIdx = 0; touchIdx < event.Touches.length; ++touchIdx) {
            for (var i = 0; i < this.WidgetList.length; ++i) {
                if ( ! this.WidgetList[i].GetActive() &&
                     this.WidgetList[i].CheckActive(event)) {
                    this.ActivateWidget(this.WidgetList[i]);
                    return true;
                }
            }
        }
    }

    AnnotationLayer.prototype.HandleTouchPan = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleTouchPan) {
            return this.ActiveWidget.HandleTouchPan(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleTouchPinch = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleTouchPinch) {
            return this.ActiveWidget.HandleTouchPinch(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleTouchEnd = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleTouchEnd) {
            return this.ActiveWidget.HandleTouchEnd(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleMouseDown = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        var timeNow = new Date().getTime();
        if (this.LastMouseDownTime) {
            if ( timeNow - this.LastMouseDownTime < 200) {
                delete this.LastMouseDownTime;
                return this.HandleDoubleClick(event);
            }
        }
        this.LastMouseDownTime = timeNow;

        if (this.ActiveWidget && this.ActiveWidget.HandleMouseDown) {
            return this.ActiveWidget.HandleMouseDown(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleDoubleClick = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleDoubleClick) {
            return this.ActiveWidget.HandleDoubleClick(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleMouseUp = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleMouseUp) {
            return this.ActiveWidget.HandleMouseUp(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleMouseMove = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }

        // The event position is relative to the target which can be a tab on
        // top of the canvas.  Just skip these events.
        if ($(event.target).width() != $(event.currentTarget).width()) {
            return true;
        }

        this.ComputeMouseWorld(event);

        // Firefox does not set "which" for move events.
        event.which = event.buttons;
        if (event.which == 2) {
            event.which = 3;
        } else if (event.which == 3) {
            event.which = 2;
        }

        if (this.ActiveWidget) {
            if (this.ActiveWidget.HandleMouseMove) {
                var ret = this.ActiveWidget.HandleMouseMove(event);
                return ret;
            }
        } else {
            if ( ! event.which) {
                this.CheckActive(event);
                return true;
            }
        }

        // An active widget should stop propagation even if it does not
        // respond to the event.
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleMouseWheel = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleMouseWheel) {
            return this.ActiveWidget.HandleMouseWheel(event);
        }
        return ! this.ActiveWidget;
    }

    AnnotationLayer.prototype.HandleKeyDown = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleKeyDown) {
            return this.ActiveWidget.HandleKeyDown(event);
        }
        return ! this.ActiveWidget;
    }

    // Called on mouse motion with no button pressed.
    // Looks for widgets under the cursor to make active.
    // Returns true if a widget is active.
    AnnotationLayer.prototype.CheckActive = function(event) {
        if ( ! this.GetVisibility() ) {
            return true;
        }
        if (this.ActiveWidget) {
            return this.ActiveWidget.CheckActive(event);
        } else {
            for (var i = 0; i < this.WidgetList.length; ++i) {
                if (this.WidgetList[i].CheckActive(event)) {
                    this.ActivateWidget(this.WidgetList[i]);
                    return true; // trying to keep the browser from selecting images
                }
            }
        }
        return false;
    }

    AnnotationLayer.prototype.GetNumberOfWidgets = function() {
        return this.WidgetList.length;
    }


    AnnotationLayer.prototype.GetWidget = function(i) {
        return this.WidgetList[i];
    }

    // Legacy
    AnnotationLayer.prototype.GetWidgets = function() {
        return this.WidgetList;
    }

    AnnotationLayer.prototype.AddWidget = function(widget) {
        widget.Layer = this;
        this.WidgetList.push(widget);
        if (SAM.NotesWidget) {
            // Hack.
            SAM.NotesWidget.MarkAsModified();
        }
    }

    AnnotationLayer.prototype.RemoveWidget = function(widget) {
        if (widget.Layer == null) {
            return;
        }
        widget.Layer = null;
        var idx = this.WidgetList.indexOf(widget);
        if(idx!=-1) {
            this.WidgetList.splice(idx, 1);
        }
        if (SAM.NotesWidget) {
            // Hack.
            SAM.NotesWidget.MarkAsModified();
        }
    }

    SAM.AnnotationLayer = AnnotationLayer;
})();

// TODO:
// Cleanup API for choosing coordinate systems.
// Position (currently Origin) is in slide.
//   I want to extend this to Viewer.
//   Relative to corners or center and
//   possibly relative to left, right of shape ... like css
// Currently we use FixedSize to choose width and height units.

// For the sort term I need an option to have position relative to upper
// left of the viewer.


(function () {
    "use strict";

    function Shape() {
        this.Orientation = 0.0; // in degrees, counter clockwise, 0 is left
        this.PositionCoordinateSystem = Shape.SLIDE;
        // This is the position of the shape origin in the containing
        // coordinate system. Probably better called position.
        this.Origin = [10000,10000]; // Anchor in world coordinates.
        // FixedSize => PointBuffer units in viewer pixels.
        // otherwise
        this.FixedSize = true;
        this.FixedOrientation = true;
        this.LineWidth = 0; // Line width has to be in same coordiantes as points.
        this.Visibility = true; // An easy way to turn off a shape (with removing it from the shapeList).
        this.Active = false;
        this.ActiveColor = [1.0, 1.0, 0.0];
        // Playing around with layering.  The anchor is being obscured by the text.
        this.ZOffset = 0.1;
    };

    // Coordinate Systems
    Shape.SLIDE = 0; // Pixel of highest resolution level.
    Shape.VIEWER = 1; // Pixel of viewer canvas.

    Shape.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    Shape.prototype.Draw = function (view) {
        if ( ! this.Visibility) {
            return;
        }
        if (this.Matrix == undefined) {
            this.UpdateBuffers();
        }

        if (GL) {
            // Lets use the camera to change coordinate system to pixels.
            // TODO: Put this camera in the view or viewer to avoid creating one each render.
            var camMatrix = mat4.create();
            mat4.identity(camMatrix);
            if (this.FixedSize) {
                var viewFrontZ = view.Camera.ZRange[0]+0.01;
                // This camera matric changes pixel/ screen coordinate sytem to
                // view [-1,1],[-1,1],z
                camMatrix[0] = 2.0 / view.Viewport[2];
                camMatrix[12] = -1.0;
                camMatrix[5] = -2.0 / view.Viewport[3];
                camMatrix[13] = 1.0;
                camMatrix[14] = viewFrontZ; // In front of tiles in this view
            }

            // The actor matrix that rotates to orientation and shift (0,0) to origin.
            // Rotate based on ivar orientation.
            var theta = this.Orientation * 3.1415926536 / 180.0;
            this.Matrix[0] =  Math.cos(theta);
            this.Matrix[1] = -Math.sin(theta);
            this.Matrix[4] =  Math.sin(theta);
            this.Matrix[5] =  Math.cos(theta);
            // Place the origin of the shape.
            x = this.Origin[0];
            y = this.Origin[1];
            if (this.FixedSize) {
                // For fixed size, translation must be in view/pixel coordinates.
                // First transform the world to view.
                var m = view.Camera.Matrix;
                var x = (this.Origin[0]*m[0] + this.Origin[1]*m[4] + m[12])/m[15];
                var y = (this.Origin[0]*m[1] + this.Origin[1]*m[5] + m[13])/m[15];
                // convert view to pixels (view coordinate ssytem).
                x = view.Viewport[2]*(0.5*(1.0+x));
                y = view.Viewport[3]*(0.5*(1.0-y));
            }
            // Translate to place the origin.
            this.Matrix[12] = x;
            this.Matrix[13] = y;
            this.Matrix[14] = this.ZOffset;

            var program = polyProgram;

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

            GL.uniformMatrix4fv(program.mvMatrixUniform, false, this.Matrix);
            if (this.FixedSize) {
                GL.uniformMatrix4fv(program.pMatrixUniform, false, camMatrix);
            } else {
                // Use main views camera to convert world to view.
                GL.uniformMatrix4fv(program.pMatrixUniform, false, view.Camera.Matrix);
            }

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

            if (this.OutlineColor != undefined) {
                if (this.Active) {
                    GL.uniform3f(program.colorUniform, this.ActiveColor[0],
                                 this.ActiveColor[1], this.ActiveColor[2]);
                } else {
                    GL.uniform3f(program.colorUniform, this.OutlineColor[0],
                                 this.OutlineColor[1], this.OutlineColor[2]);
                }

                if (this.LineWidth == 0) {
                    if (this.WireFrame) {
                        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
                        GL.drawElements(GL.LINE_LOOP, this.CellBuffer.numItems,
                                        GL.UNSIGNED_SHORT,0);
                    } else {
                        // Outline. This only works for polylines
                        GL.drawArrays(GL.LINE_STRIP, 0, this.VertexPositionBuffer.numItems);
                    }
                } else {
                    // Cell Connectivity
                    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.LineCellBuffer);
                    GL.drawElements(GL.TRIANGLES, this.LineCellBuffer.numItems,
                                    GL.UNSIGNED_SHORT,0);
                }
            }
        } else { // 2d Canvas -----------------------------------------------
            view.Context2d.save();
            // Identity.
            view.Context2d.setTransform(1,0,0,1,0,0);

            if (this.PositionCoordinateSystem == Shape.SLIDE) {
                var theta = (this.Orientation * 3.1415926536 / 180.0);
                if ( ! this.FixedSize) {
                    theta -= view.Camera.Roll;
                }
                this.Matrix[0] =  Math.cos(theta);
                this.Matrix[1] = -Math.sin(theta);
                this.Matrix[4] =  Math.sin(theta);
                this.Matrix[5] =  Math.cos(theta);
                // Place the origin of the shape.
                x = this.Origin[0];
                y = this.Origin[1];
                var scale = 1.0;
                if ( ! this.FixedSize) {
                    // World need to be drawn in view coordinate system so the
                    scale = view.Viewport[3] / view.Camera.GetHeight();
                }
                // First transform the origin-world to view.
                var m = view.Camera.Matrix;
                var x = (this.Origin[0]*m[0] + this.Origin[1]*m[4] + m[12])/m[15];
                var y = (this.Origin[0]*m[1] + this.Origin[1]*m[5] + m[13])/m[15];

                // convert origin-view to pixels (view coordinate system).
                x = view.Viewport[2]*(0.5*(1.0+x));
                y = view.Viewport[3]*(0.5*(1.0-y));
                view.Context2d.transform(this.Matrix[0],this.Matrix[1],this.Matrix[4],this.Matrix[5],x,y);
            } else if (this.PositionCoordinateSystem == Shape.VIEWER) {
                var theta = (this.Orientation * 3.1415926536 / 180.0);
                this.Matrix[0] =  Math.cos(theta);
                this.Matrix[1] = -Math.sin(theta);
                this.Matrix[4] =  Math.sin(theta);
                this.Matrix[5] =  Math.cos(theta);
                // Place the origin of the shape.
                x = this.Origin[0];
                y = this.Origin[1];
                var scale = 1.0;

                view.Context2d.transform(this.Matrix[0],this.Matrix[1],this.Matrix[4],this.Matrix[5],x,y);                
            }

            // for debugging section alignmnet.
            var x0 = this.PointBuffer[0];
            var y0 = this.PointBuffer[1];
            // For debugging gradient decent aligning contours.
            // This could be put into the canvas transform, but it is only for debugging.
            //if (this.Trans) {
            //      var vx = x0-this.Trans.cx;
            //      var vy = y0-this.Trans.cy;
            //      var rx =  this.Trans.c*vx + this.Trans.s*vy;
            //      var ry = -this.Trans.s*vx + this.Trans.c*vy;
            //      x0 = x0 + (rx-vx) + this.Trans.sx;
            //      y0 = y0 + (ry-vy) + this.Trans.sy;
            //}

            // This gets remove when the debug code is uncommented.
            view.Context2d.beginPath();
            view.Context2d.moveTo(x0*scale,y0*scale);

            var i = 3;
            while ( i < this.PointBuffer.length ) {
                var x1 = this.PointBuffer[i];
                var y1 = this.PointBuffer[i+1];
                // For debugging.  Apply a trasformation and color by scalars.
                //if (this.Trans) {
                //    var vx = x1-this.Trans.cx;
                //    var vy = y1-this.Trans.cy;
                //    var rx =  this.Trans.c*vx + this.Trans.s*vy;
                //    var ry = -this.Trans.s*vx + this.Trans.c*vy;
                //    x1 = x1 + (rx-vx) + this.Trans.sx;
                //    y1 = y1 + (ry-vy) + this.Trans.sy;
                //}
                //view.Context2d.beginPath();
                //view.Context2d.moveTo(x0*scale,y0*scale);
                // Also for debuggin
                //if (this.DebugScalars) {
                //    view.Context2d.strokeStyle=SAM.ConvertColorToHex([1,this.DebugScalars[i/3], 0]);
                //} else {
                //    view.Context2d.strokeStyle=SAM.ConvertColorToHex(this.OutlineColor);
                //}
                //view.Context2d.stroke();
                //x0 = x1;
                //y0 = y1;

                // This gets remove when the debug code is uncommented.
                view.Context2d.lineTo(x1*scale,y1*scale);

                i += 3;
            }

            if (this.OutlineColor != undefined) {
                var width = this.LineWidth * scale;
                if (width == 0) {
                    width = 1;
                }
                view.Context2d.lineWidth = width;
                if (this.Active) {
                    view.Context2d.strokeStyle=SAM.ConvertColorToHex(this.ActiveColor);
                } else {
                    view.Context2d.strokeStyle=SAM.ConvertColorToHex(this.OutlineColor);
                }
                // This gets remove when the debug code is uncommented.
                view.Context2d.stroke();
            }

            if (this.FillColor != undefined) {
                if (this.Active) {
                    view.Context2d.fillStyle=SAM.ConvertColorToHex(this.ActiveColor);
                } else {
                    view.Context2d.fillStyle=SAM.ConvertColorToHex(this.FillColor);
                }
                view.Context2d.fill();
            }

            view.Context2d.restore();
        }
    }

    // Invert the fill color.
    Shape.prototype.ChooseOutlineColor = function () {
        if (this.FillColor) {
            this.OutlineColor = [1.0-this.FillColor[0],
                                 1.0-this.FillColor[1],
                                 1.0-this.FillColor[2]];

        }
    }

    Shape.prototype.SetOutlineColor = function (c) {
        this.OutlineColor = SAM.ConvertColor(c);
    }

    Shape.prototype.SetFillColor = function (c) {
        this.FillColor = SAM.ConvertColor(c);
    }

    Shape.prototype.HandleMouseMove = function(event, dx,dy) {
        // superclass does nothing
        return false;
    }

    //Shape.prototype.UpdateBuffers = function() {
    //    // The superclass does not implement this method.
    //}

    // Returns undefined if the point is not on the segment.
    // Returns the interpolation index if it is touching the edge.
    // NOTE: Confusion between undefined and 0. I could return -1 ...???...
    // However -1 could mean extrapolation ....
    Shape.prototype.IntersectPointLine = function(pt, end0, end1, dist) {
        // make end0 the origin.
        var x = pt[0] - end0[0];
        var y = pt[1] - end0[1];
        var vx = end1[0] - end0[0];
        var vy = end1[1] - end0[1];

        // Rotate so the edge lies on the x axis.
        var length = Math.sqrt(vx*vx + vy*vy); // Avoid atan2 ... with clever use of complex numbers.
        // Get the edge normal direction.
        vx = vx/length;
        vy = -vy/length;
        // Rotate the coordinate system to put the edge on the x axis.
        var newX = (x*vx - y*vy);
        var newY = (x*vy + y*vx);

        if (Math.abs(newY) > dist  ||
            newX < 0 || newX > length) {
            return undefined;
        }
        return newX / length;
    }

    SAM.Shape = Shape;

})();
// Originally to hold a set of polylines for the pencil widget.

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    function ShapeGroup() {
        this.Shapes = [];
        this.Bounds = [0,-1,0,-1];
    };

    ShapeGroup.prototype.GetBounds = function () {
        return this.Bounds;
    }

    // Returns 0 if is does not overlap at all.
    // Returns 1 if part of the section is in the bounds.
    // Returns 2 if all of the section is in the bounds.
    ShapeGroup.prototype.ContainedInBounds = function(bds) {
        if (this.Shapes.length == 0) { return 0;}
        var retVal = this.Shapes[0].ContainedInBounds(bds);
        for (var i = 1; i < this.Shapes.length; ++i) {
            if (retVal == 1) {
                // Both inside and outside. Nothing more to check.
                return retVal;
            }
            var shapeVal = this.Shapes[i].ContainedInBounds(bds);
            if (retVal == 0 && shapeVal != 0) {
                retVal = 1;
            }
            if (retVal == 2 && shapeVal != 2) {
                retVal = 1;
            }
        }
        return retVal;
    }

    ShapeGroup.prototype.PointOnShape = function(pt, dist) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            if (this.Shapes[i].PointOnShape(pt,dist)) {
                return true;
            }
        }
        return false;
    }

    ShapeGroup.prototype.UpdateBuffers = function() {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes.UpdateBuffers();
        }
    }

    // Find a world location of a popup point given a camera.
    ShapeGroup.prototype.FindPopupPoint = function(cam) {
        if (this.Shapes.length == 0) { return; }
        var roll = cam.Roll;
        var s = Math.sin(roll + (Math.PI*0.25));
        var c = Math.cos(roll + (Math.PI*0.25));
        var bestPt = this.Shapes[0].FindPopupPoint(cam);
        var bestProjection = (c*bestPt[0])-(s*bestPt[1]);
        for (var i = 1; i < this.Shapes.length; ++i) {
            var pt = this.Shapes[i].FindPopupPoint(cam);
            var projection = (c*pt[0])-(s*pt[1]);
            if (projection > bestProjection) {
                bestProjection = projection;
                bestPt = pt;
            }
        }
        return bestPt;
    }

    ShapeGroup.prototype.Draw = function(view) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].Draw(view);
        }
    }

    ShapeGroup.prototype.AddShape = function(shape) {
        this.Shapes.push(shape);
    }

    ShapeGroup.prototype.GetNumberOfShapes = function() {
        return this.Shapes.length;
    }

    ShapeGroup.prototype.GetShape = function(index) {
        return this.Shapes[index];
    }

    ShapeGroup.prototype.SetActive = function(flag) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].SetActive(flag);
        }        
    }

    ShapeGroup.prototype.SetLineWidth = function(lineWidth) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].LineWidth = lineWidth;
        }
    }

    // Just returns the first.
    ShapeGroup.prototype.GetLineWidth = function() {
        if (this.Shapes.length != 0) {
            return this.Shapes[0].GetLineWidth();
        }
        return 0;
    }

    ShapeGroup.prototype.SetOutlineColor = function(color) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].OutlineColor = color;
        }
    }

    // Just returns the first.
    ShapeGroup.prototype.GetOutlineColor = function() {
        if (this.Shapes.length != 0) {
            return this.Shapes[0].OutlineColor;
        }
        return [0,0,0];
    }

    ShapeGroup.prototype.SetOrigin = function(origin) {
        for (var i = 0; i < this.Shapes.length; ++i) {
            // Makes a copy of the array.
            this.Shapes[i].SetOrigin(origin);
        }
    }

    // Adds origin to points and sets origin to 0.
    ShapeGroup.prototype.ResetOrigin = function() {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].ResetOrigin();
        }
    }
    
    // Just returns the first.
    ShapeGroup.prototype.GetOrigin = function() {
        if (this.Shapes.length != 0) {
            return this.Shapes[0].Origin;
        }
        return [0,0,0];
    }

    ShapeGroup.prototype.UpdateBuffers = function() {
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].UpdateBuffers();
        }
    }


    SAM.ShapeGroup = ShapeGroup;
})();

//==============================================================================
// Initially a contour found for each section in a stack.
// Each section gets on of these StackSectionWidgets.  I am extending this
// to include multiple contours fo sections that have multiple pieces,
// and internal contours / features.  Internal edges may not be closed
// loops.
// Initialy, these widgets will have no interaction, so they might
// be better as shapes, but we will see.

// Eventually I will put a transformation in here.
// Also, I would like this to have its own instance variable in
// the viewerRecord.


(function () {
    // Depends on the CIRCLE widget
    "use strict";

    function StackSectionWidget (viewer) {
        var self = this;

        this.Thumb = null; // default click. in stack creator.

        // Active is just to turn the section yellow temporarily.
        this.Active = false;
        this.Color = [0,1,0];
        this.Shapes = [];

        this.Bounds = null;
        if (viewer) {
            this.Viewer = viewer;
            this.Viewer.AddWidget(this);
        }
    }

    StackSectionWidget.prototype.IsEmpty = function() {
        return this.Shapes.length == 0;
    }

    // Add all the lines in the in section to this section.
    StackSectionWidget.prototype.Union = function(section) {
        for (var i = 0; i < section.Shapes.length; ++i) {
            this.Shapes.push(section.Shapes[i]);
        }
        this.Bounds = null;
    }

    // Bounds are in slide / world coordinates.
    // Returns 0 if is does not overlap at all.
    // Returns 1 if part of the section is in the bounds.
    // Returns 2 if all of the section is in the bounds.
    StackSectionWidget.prototype.ContainedInBounds = function(bds) {
        var sBds = this.GetBounds();
        if (sBds[0] > bds[0] && sBds[1] < bds[1] &&
            sBds[2] > bds[2] && sBds[3] < bds[3]) {
            // section is fully contained in the bounds.
            return 2;
        }
        if (sBds[1] < bds[0] || sBds[0] > bds[1] ||
            sBds[3] < bds[2] || sBds[2] > bds[3] ) {
            // No overlap of bounds.
            return 0;
        }

        // Bounds partially overlap.  Look closer.
        var pointsIn = false;
        var pointsOut = false;
        for (var i = 0; i < this.Shapes.length; ++i) {
            var contained = this.Shapes[i].ContainedInBounds(bds);
            if (contained == 1) {
                return 1;
            }
            if (contained == 0) {
                pointsOut = true;
            }
            if (contained == 2) {
                pointsIn = true;
            }
            if (pointsIn && pointsOut) {
                return 1;
            }
        }

        if (pointsIn) {
            return 2;
        }
        return 0;
    }

    // Returns the center of the bounds in view coordinates.
    StackSectionWidget.prototype.GetViewCenter = function(view) {
        var bds = this.GetBounds();
        return view.Camera.ConvertPointWorldToViewer((bds[0]+bds[1])*0.5,
                                                     (bds[2]+bds[3])*0.5);
    }

    // We need bounds in view coordiantes for sorting.
    // Do not bother caching the value.
    StackSectionWidget.prototype.GetViewBounds = function (view) {
        if (this.Shapes.length == 0) {
            return [0,0,0,0];
        }
        var c = this.GetViewCenter(view);
        var bds = [c[0],c[0],c[1],c[1]];
        for (var i = 0; i < this.Shapes.length; ++i) {
            var shape = this.Shapes[i];
            for (j = 0; j < shape.Points.length; ++j) {
                var pt = shape.Points[j];
                pt = view.Camera.ConvertPointWorldToViewer(pt[0],pt[1]);
                if (pt[0] < bds[0]) { bds[0] = pt[0]; }
                if (pt[0] > bds[1]) { bds[1] = pt[0]; }
                if (pt[1] < bds[2]) { bds[2] = pt[1]; }
                if (pt[1] > bds[3]) { bds[3] = pt[1]; }
            }
        }
        return bds;
    }


    StackSectionWidget.prototype.ComputeViewUpperRight = function(view) {
        // Compute the upper right corner in view coordinates.
        // This is used by the SectionsWidget holds this section.
        var bds = this.GetBounds();
        var p0 = view.Camera.ConvertPointWorldToViewer(bds[0],bds[2]);
        var p1 = view.Camera.ConvertPointWorldToViewer(bds[0],bds[3]);
        var p2 = view.Camera.ConvertPointWorldToViewer(bds[1],bds[3]);
        var p3 = view.Camera.ConvertPointWorldToViewer(bds[1],bds[2]);
        // Pick the furthest upper right corner.
        this.ViewUpperRight = p0;
        var best = p0[0]-p0[1];
        var tmp = p1[0]-p1[1];
        if (tmp > best) {
            best = tmp;
            this.ViewUpperRight = p1;
        }
        tmp = p2[0]-p2[1];
        if (tmp > best) {
            best = tmp;
            this.ViewUpperRight = p2;
        }
        tmp = p3[0]-p3[1];
        if (tmp > best) {
            best = tmp;
            this.ViewUpperRight = p3;
        }
    }


    StackSectionWidget.prototype.Draw = function(view) {
        this.ComputeViewUpperRight(view);
        for (var i = 0; i < this.Shapes.length; ++i) {
            if (this.Active) {
                this.Shapes[i].OutlineColor = [1,1,0];
            } else {
                this.Shapes[i].OutlineColor = this.Color;
            }
            this.Shapes[i].Draw(view);
        }
    }

    StackSectionWidget.prototype.Serialize = function() {
        // Backing away from 'every section has a contour'.
        if (this.Thumb) { 
            return null;
        }
        var obj = new Object();
        obj.type = "stack_section";
        obj.color = this.Color;
        obj.shapes = [];
        for (var i = 0; i < this.Shapes.length; ++i) {
            var shape = this.Shapes[i];
            // Is is a pain that polyline does not serialize.
            var polyLineObj = {
                closedloop: shape.Closed,
                points: []};
            for (var j = 0; j < shape.Points.length; ++j) {
                polyLineObj.points.push([shape.Points[j][0], shape.Points[j][1]]);
            }
            obj.shapes.push(polyLineObj);
        }
        return obj;
    }


    // Load a widget from a json object (origin MongoDB).
    StackSectionWidget.prototype.Load = function(obj) {
        if (obj.color) {
            this.Color[0] = parseFloat(obj.color[0]);
            this.Color[1] = parseFloat(obj.color[1]);
            this.Color[2] = parseFloat(obj.color[2]);
        }
        if ( ! obj.shapes) {
            return;
        }
        for(var n=0; n < obj.shapes.length; n++){
            var polylineObj = obj.shapes[n];
            if ( polylineObj.points) { 
                var points = polylineObj.points;
                var shape = new Polyline();
                shape.OutlineColor = this.Color;
                shape.FixedSize = false;
                shape.LineWidth = 0;
                if (polylineObj.closedloop) {
                    shape.Closed = polylineObj.closedloop;
                }
                this.Shapes.push(shape);
                for (var m = 0; m < points.length; ++m) {
                    shape.Points[m] = [points[m][0], points[m][1]];
                }
                shape.UpdateBuffers();
            }
        }
    }

    // We could recompute the bounds from the
    StackSectionWidget.prototype.GetCenter = function () {
        var bds = this.GetBounds();
        return [(bds[0]+bds[1])*0.5, (bds[2]+bds[3])*0.5];
    }

    // We could recompute the bounds from the
    StackSectionWidget.prototype.GetBounds = function () {
        // Special case for simple thumb selection.
        if (this.Thumb) {
            var rad = this.Thumb.Height * this.Thumb.ScreenPixelSpacing / 4.0;
            var cx = this.ThumbX;
            var cy = this.ThumbY;
            return [cx-rad, cx+rad, cy-rad, cy+rad];
        }

        if (this.Shapes.length == 0) {
            return this.Bounds;
        }
        if ( ! this.Bounds) {
            this.Bounds = this.Shapes[0].GetBounds();
            for (var i = 1; i < this.Shapes.length; ++i) {
                var bds = this.Shapes[i].GetBounds();
                if (bds[0] < this.Bounds[0]) this.Bounds[0] = bds[0];
                if (bds[1] > this.Bounds[1]) this.Bounds[1] = bds[1];
                if (bds[2] < this.Bounds[2]) this.Bounds[2] = bds[2];
                if (bds[3] > this.Bounds[3]) this.Bounds[3] = bds[3];
            }
        }
        return this.Bounds.slice(0);
    }

    StackSectionWidget.prototype.Deactivate = function() {
        this.Viewer.DeactivateWidget(this);
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].Active = false;
        }
        eventuallyRender();
    }

    StackSectionWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        return true;
    }

    StackSectionWidget.prototype.HandleMouseDown = function(event) {
        return true;
    }

    StackSectionWidget.prototype.HandleMouseUp = function(event) {
        return true;
    }
    
    StackSectionWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    }

    StackSectionWidget.prototype.HandleMouseMove = function(event) {
        return true
    }

    StackSectionWidget.prototype.CheckActive = function(event) {
        return false;
    }

    StackSectionWidget.prototype.GetActive = function() {
        return false;
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    StackSectionWidget.prototype.SetActive = function(flag) {
        if (flag) {
            this.Viewer.ActivateWidget(this);
            for (var i = 0; i < this.Shapes.length; ++i) {
                this.Shapes[i].Active = true;
            }

            eventuallyRender();
        } else {
            this.Deactivate();
            this.Viewer.DeactivateWidget(this);
        }
    }

    StackSectionWidget.prototype.RemoveFromViewer = function() {
        if (this.Viewer) {
            this.Viewer.RemoveWidget(this);
        }
    }

    //==============================================================================
    // These features might better belong in a separate object of edges.

    // Modifies this section's points to match argument section
    // Also returns the translation and rotation.
    StackSectionWidget.prototype.RigidAlign = function (section, trans) {
        var center1 = this.GetCenter();
        var center2 = section.GetCenter();
        // Translate so that the centers are the same.
        //this.Translate([(center2[0]-center1[0]),
        //                (center2[1]-center2[1])]);

        // Lets use a transformation instead.  It will be easier for the stack
        // editor.
        trans[0] = (center2[0]-center1[0]);
        trans[1] = (center2[1]-center1[1]);

        if (this.Thumb || section.Thumb) {
            trans[2] = 0;
            return;
        }

        // Get the bounds of both contours.
        var bds1 = this.GetBounds();
        bds1[0] += trans[0];  bds1[1] += trans[0];
        bds1[2] += trans[1];  bds1[3] += trans[1];
        var bds2 = section.GetBounds();

        // Combine them (union).
        bds2[0] = Math.min(bds1[0], bds2[0]);
        bds2[1] = Math.max(bds1[1], bds2[1]);
        bds2[2] = Math.min(bds1[2], bds2[2]);
        bds2[3] = Math.max(bds1[3], bds2[3]);
        // Exapnd the contour by 10%
        var xMid = (bds2[0] + bds2[1])*0.5;
        var yMid = (bds2[2] + bds2[3])*0.5;
        bds2[0] = xMid + 1.1*(bds1[0]-xMid);
        bds2[1] = xMid + 1.1*(bds1[1]-xMid);
        bds2[2] = yMid + 1.1*(bds1[2]-yMid);
        bds2[3] = yMid + 1.1*(bds1[3]-yMid);

        var spacing;
        // choose a spacing.
        // about 160,000 kPixels (400x400);
        spacing = Math.sqrt((bds2[1]-bds2[0])*(bds2[3]-bds2[2])/160000);
        // Note. gradient decent messes up with spacing too small.

        var distMap = new DistanceMap(bds2, spacing);
        for (var i = 0; i < section.Shapes.length; ++i) {
            // ignore origin.
            distMap.AddPolyline(section.Shapes[i]);
        }
        distMap.Update();

        eventuallyRender();
        // Coordinate system has changed.
        this.RigidAlignWithMap(distMap, trans);
    }

    // Perform gradient descent on the transform....
    // Do not apply to the points.
    // trans is the starting position as well as the return value.
    StackSectionWidget.prototype.RigidAlignWithMap = function(distMap, trans) {
        // Compute center of rotation
        var center = this.GetCenter();

        // shiftX, shiftY, roll
        var tmpTrans = [0,0,0];

        // Try several rotations to see which is the best.
        bestTrans = null;
        bestDist = -1;
        for (a = -180; a < 180; a += 30) {
            tmpTrans = [trans[0],trans[1],Math.PI*a/180];
            var dist;
            for (i = 0; i < 5; ++i) {
                dist = this.RigidDecentStep(tmpTrans, center, distMap, 200000);
            }
            // For symetrical cases, give no rotation a slight advantage.
            dist = dist * (1.0 + Math.abs(a/180));
            if (bestDist < 0 || dist < bestDist) {
                bestDist = dist;
                bestTrans = tmpTrans.slice(0);
            }
        }

        // Now the real gradient decent.
        tmpTrans = bestTrans;
        // Slowing discount outliers.
        var aveDist = 200000;
        for (var i = 0; i < 100; ++i) {
            aveDist = this.RigidDecentStep(tmpTrans, center, distMap, aveDist);
        }
        // caller can do this if they want.
        //this.Transform([trans[0],trans[1]], center, trans[2]);
        // Just return the transformation parameters.
        // The center is als part of the transform, but it can be gotten with GetCenter.
        trans[0] = tmpTrans[0];
        trans[1] = tmpTrans[1];
        trans[2] = tmpTrans[2];
    }

    // Returns the average distance as the error.
    // trans is the starting transform (dx,dy, dRoll). This state is modified
    // by this method.
    // Center: center of rotation.
    // distMap is the array of distances.
    // Threshold sets large distances to a constant. It should be reduced to
    // minimize the contribution of outliers. Thresh is in units of map pixels.
    StackSectionWidget.prototype.RigidDecentStep = function (trans, center,
                                                             distMap, thresh) {
        var vx,vy, rx,ry;
        var s = Math.sin(trans[2]);
        var c = Math.cos(trans[2]);
        var sumx = 0, sumy = 0, totalDist = 0;
        var sumr = 0;
        var numContributingPoints = 0;
        for (var j = 0; j < this.Shapes.length; ++j) {
            var shape = this.Shapes[j];
            //var debugScalars = new Array(shape.Points.length);
            //shape.DebugScalars = debugScalars;
            for (var k = 0; k < shape.Points.length; ++k) {
                var pt = shape.Points[k];
                var x = pt[0];
                var y = pt[1];

                // transform the point.
                vx = (x-center[0]);
                vy = (y-center[1]);
                rx =  c*vx + s*vy;
                ry = -s*vx + c*vy;
                x = x + (rx-vx) + trans[0];
                y = y + (ry-vy) + trans[1];

                // Get the distance for this point.
                var dist = distMap.GetDistance(x,y) * distMap.Spacing;
                totalDist += dist;
                // Use threshold to minimize effect of outliers.
                //debugScalars[k] = (thresh)/(thresh + dist);
                //dist = (thresh*dist)/(thresh + dist);

                //debugScalars[k] = (dist < thresh) ? 1:0;
                //if (dist > thresh) {dist = 0;}
                //debugScalars[k] = Math.exp(-0.69*(dist*dist)/(thresh*thresh));
                var gs = 1;
                if (thresh > 0) {gs = Math.exp(-0.69*(dist*dist)/(thresh*thresh));}
                dist = dist * gs;

                // Scale the negative gradient by thresholded distance.
                var grad = distMap.GetGradient(x,y);
                var mag = Math.sqrt(grad[0]*grad[0] + grad[1]*grad[1]);

                if (mag > 0) {
                    ++numContributingPoints;

                    // Keep a total for translation
                    grad[0] = -grad[0] * dist / mag;
                    grad[1] = -grad[1] * dist / mag;
                    sumx += grad[0];
                    sumy += grad[1];

                    // For rotation
                    var cross = ry*grad[0]-rx*grad[1];
                    sumr += cross / (rx*rx + ry*ry);
                } else {
                    var skip = 1;
                }
            }
        }

        var aveDist = totalDist / numContributingPoints;
        // Trying to be intelligent about the step size
        trans[0] += sumx / numContributingPoints;
        trans[1] += sumy / numContributingPoints;
        trans[2] += sumr / numContributingPoints;

        // for debugging (the rest is in shape.js
        //t = {cx: center[0], cy: center[1], 
        //     c: Math.cos(trans[2]), s: Math.sin(trans[2]),
        //     sx: trans[0], sy: trans[1]};
        //for (var i = 0; i < this.Shapes.length; ++i) {
        //    this.Shapes[i].Trans = t;
        //}
        //VIEWER1.Draw();

        return aveDist;
    }
    
    StackSectionWidget.prototype.Transform = function (shift, center, roll) {
        this.Bounds = null;
        for (var i = 0; i < this.Shapes.length; ++i) {
            var shape = this.Shapes[i];
            shape.Trans = null;
            for (var j = 0; j < shape.Points.length; ++j) {
                var pt = shape.Points[j];
                var x = pt[0];
                var y = pt[1];
                var vx = x-center[0];
                var vy = y-center[1];
                var s = Math.sin(roll);
                var c = Math.cos(roll);
                var rx =  c*vx + s*vy;
                var ry = -s*vx + c*vy;
                pt[0] = x + (rx-vx) + shift[0];
                pt[1] = y + (ry-vy) + shift[1];
            }
            shape.UpdateBuffers();
        }
    }

    // shift is [x,y]
    StackSectionWidget.prototype.Translate = function (shift) {
        this.Bounds = null;
        for (var i = 0; i < this.Shapes.length; ++i) {
            var shape = this.Shapes[i];
            for (var j = 0; j < shape.Points.length; ++j) {
                var pt = shape.Points[j];
                pt[0] += shift[0];
                pt[1] += shift[1];
            }
            shape.UpdateBuffers();
        }
    }

    // I could also implement a resample to get uniform spacing.
    StackSectionWidget.prototype.RemoveDuplicatePoints = function (epsilon) {
        if ( epsilon == undefined) {
            epsilon = 0;
        }
        for (var i = 0; i < this.Shapes.length; ++i) {
            var shape = this.Shapes[i];
            var p0 = shape.Points[shape.Points.length-1];
            var idx = 0;
            while (idx < shape.Points.length) {
                var p1 = shape.Points[idx];
                var dx = p1[0] - p0[0];
                var dy = p1[1] - p0[1];
                if (Math.sqrt(dx*dx + dy*dy) <= epsilon) {
                    shape.Points.splice(idx,1);
                } else {
                    ++idx;
                    p0 = p1;
                }
            }
            shape.UpdateBuffers();
        }
    }


    StackSectionWidget.prototype.Decimate = function() {
        var bds = this.GetBounds();
        var spacing = (bds[1]-bds[0] + bds[3]-bds[2]) / 400;
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].Decimate(spacing);
        }
    }


    SAM.StackSectionWidget = StackSectionWidget;

})();


//==============================================================================
// A single widget to detect multiple sections on a slide
// TODO:
// - Only show the sections tool when you have edit privaleges.
// - Automatically save sections (when advancing)
// - Processing feedback when saving.
// - implement an undo.
// -- save start section in stack
// -- slider in stack viewer.

// - Stack editor.
//   ? Should we save the SectionsWidget in addition to the stackSectionWidget??????
//   ? Default to multiple??????.
// - Improve the deformable registration to handle multiple contours.
// - Extend the rigid outlier code to work with deformable.
// - ScrollWheel to change the threshold of a section.
// - edit the sequence of numbers (somehow).
// - WHen mouse leaves window, cancel the bbox drag.

// I do not like the following behavior:
// Real widgets are always in the viewer.
// Widgets waiting in notes are serialized.


(function () {
    // Depends on the CIRCLE widget
    "use strict";

    function SectionsWidget (viewer, newFlag) {
        if (viewer == null) {
            return;
        }

        var parent = viewer.MainView.CanvasDiv;

        this.Type = "sections";
        this.Viewer = viewer;
        this.Layer = viewer.GetAnnotationLayer();
        this.Layer.AddWidget(this);

        var self = this;

        this.Sections = [];
        this.Active = false;
        this.Layer.EventuallyDraw();
        this.Viewer.EventuallyRender();

        this.ActiveSection = null;
        this.DragBounds = null;
        this.DragViewBounds = null;

        // Just one delete button.
        // Just move it around with the active section.
        this.DeleteButton = $('<img>')
            .appendTo(parent)
            .hide()
            .css({'height': '20px',
                  'position': 'absolute',
                  'z-index': '5'})
            .attr('src',SA.ImagePathUrl+"deleteSmall.png")
            .click(function(){
                self.DeleteActiveSection();
            });

        // Right click menu.
        this.Menu = $('<div>')
            .appendTo(parent)
            .hide()
            .css({
                'width': '150px',
                'background-color': 'white',
                'border-style': 'solid',
                'border-width': '1px',
                'border-radius': '5px',
                'border-color': '#BBB',
                'position': 'absolute',
                'z-index': '4',
                'padding': '0px 2px'});
        $('<button>')
            .appendTo(this.Menu)
            .text("Horizontal Sort")
            .css({'margin':'2px 0px',
                  'width' : '100%'})
            .mouseup(function(){self.Menu.hide(); self.Sort(0);});
        $('<button>')
            .appendTo(this.Menu)
            .text("Vertical Sort")
            .css({'margin':'2px 0px',
                  'width' : '100%'})
            .mouseup(function(){self.Menu.hide(); self.Sort(1);});
    }


    SectionsWidget.prototype.ComputeSections = function() {
        var data = GetImageData(this.Viewer.MainView);
        // slow: SmoothDataAlphaRGB(data, 2);
        var histogram = ComputeIntensityHistogram(data, true);
        var threshold = PickThreshold(histogram);
        console.log("Threshold; " + threshold);
        // TODO: Move the hagfish specific method in to this class.
        var contours = GetHagFishContours(data, threshold, 0.0001, 0.5);
        console.log("num contours: " + contours.length);

        for (var i = 0; i < contours.length; ++i) {
            this.Sections.push(contours[i].MakeStackSectionWidget());
        }

        // Merge close contours int a single section.
        this.MergeCloseSections(0);

        console.log("num merge: " + this.Sections.length);

        // TODO: Simplify args by making x axis = 1, and sign code for direction.
        this.ViewSortSections(1,-1, 0,1);

        this.CreationCamera = this.Layer.GetCamera().Serialize();
    }


    // Get union of all section bounds.
    SectionsWidget.prototype.GetBounds = function() {
        if (this.Sections.length == 0){ return [0,0,0,0]; }
        var allBds = this.Sections[0].GetBounds();
        for (var i = 0; i < this.Sections.length; ++i) {
            var bds = this.Sections[i].GetBounds();
            if (bds[0] < allBds[0]) { allBds[0] = bds[0];}
            if (bds[1] > allBds[1]) { allBds[1] = bds[1];}
            if (bds[2] < allBds[2]) { allBds[2] = bds[2];}
            if (bds[3] > allBds[3]) { allBds[3] = bds[3];}
        }
        return allBds;
    }

    // Gets direction from the active section.
    SectionsWidget.prototype.Sort = function(axis) {
        var axis0 = 0;
        var axis1 = 1;
        var direction0 = 1;
        var direction1 = 1;
        if (this.ActiveSection) {
            var allBds = this.GetBounds();
            var allCenter = this.Layer.ConvertPointWorldToViewer(
                (allBds[0]+allBds[1])*0.5, (allBds[0]+allBds[1])*0.5);
            var center = this.ActiveSection.GetViewCenter(this.Viewer.MainView);
            if (center[0] < allCenter[0]) {
                direction0 = -1;
            }
            if (center[1] < allCenter[1]) {
                direction1 = -1;
            }
        }
        if (axis == 1) {
            var tmp = direction0;
            direction0 = direction1;
            direction1 = tmp;
            axis0 = 1;
            axis1 = 0;
        }
        this.ViewSortSections(axis0,direction0, axis1,direction1);
    }

    SectionsWidget.prototype.ViewSortSections = function(axis0,direction0, 
                                                         axis1,direction1) {
        function lessThan(bds1,bds2) {
            if ((bds1[(axis1<<1)+1] > bds2[axis1<<1]) &&
                ((bds1[axis1<<1] > bds2[(axis1<<1)+1] ||
                  bds1[axis0<<1] > bds2[(axis0<<1)+1]))) {
                return true;
            }
            return false;
        }
        // Compute and save view bounds for each section.
        for (var i = 0; i < this.Sections.length; ++i) {
            var section = this.Sections[i];
            section.ViewBounds = section.GetViewBounds(this.Viewer.MainView);
            PermuteBounds(section.ViewBounds, axis0, direction0);
            PermuteBounds(section.ViewBounds, axis1, direction1);
        }

        // Use lessThan to sort (insertion).
        for (var i = 1; i < this.Sections.length; ++i) {
            var bestBds = this.Sections[i-1].ViewBounds;
            var bestIdx = -1;
            for (var j = i; j < this.Sections.length; ++j) {
                var bds = this.Sections[j].ViewBounds;
                if (lessThan(bds, bestBds)) {
                    bestBds = bds;
                    bestIdx = j;
                }
            }
            if (bestIdx > 0) {
                var tmp = this.Sections[bestIdx];
                this.Sections[bestIdx] = this.Sections[i-1];
                this.Sections[i-1] = tmp;
            }
        }
        this.Layer.EventuallyDraw();
    }

    SectionsWidget.prototype.DeleteActiveSection = function() {
        if (this.ActiveSection == null) { return; }
        var section = this.ActiveSection;
        this.SetActiveSection(null);
        this.RemoveSection(section);
        if (this.IsEmpty()) {
            this.RemoveFromViewer();
            this.Layer.EventuallyDraw();
            RecordState();
        }
    }

    SectionsWidget.prototype.RemoveSection = function(section) {
        if (this.ActiveSection == section) this.ActiveSection = null;
        var idx = this.Sections.indexOf(section);
        if (idx > -1) {
            this.Sections.splice(idx,1);
        }
    }


    SectionsWidget.prototype.SetActiveSection = function(section) {
        if (section == this.ActiveSection) { return;}

        if (this.ActiveSection) {
            this.ActiveSection.Active = false;
            this.DeleteButton.hide();
        } else {
            section.Active = true;
            this.DeleteButton.show();
            // Draw moves it to the correct location.
        }
        this.ActiveSection = section;
        this.Layer.EventuallyDraw();
    }


    SectionsWidget.prototype.PlaceDeleteButton = function(section) {
        if (section) {
            var p = section.ViewUpperRight;
            this.DeleteButton
                .show()
                .css({'left': (p[0]-10)+'px',
                      'top':  (p[1]-10)+'px'});
        }
    }

    // world is a boolean indicating the bounds should be drawn in slide coordinates. 
    SectionsWidget.prototype.DrawBounds = function(view, bds, world, color) {
        var pt0 = [bds[0],bds[2]];
        var pt1 = [bds[1],bds[2]];
        var pt2 = [bds[1],bds[3]];
        var pt3 = [bds[0],bds[3]];

        if (world) {
            pt0 = view.Camera.ConvertPointWorldToViewer(pt0[0],pt0[1]);
            pt1 = view.Camera.ConvertPointWorldToViewer(pt1[0],pt1[1]);
            pt2 = view.Camera.ConvertPointWorldToViewer(pt2[0],pt2[1]);
            pt3 = view.Camera.ConvertPointWorldToViewer(pt3[0],pt3[1]);
        }
        var ctx = view.Context2d;
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.moveTo(pt0[0], pt0[1]);
        ctx.lineTo(pt1[0], pt1[1]);
        ctx.lineTo(pt2[0], pt2[1]);
        ctx.lineTo(pt3[0], pt3[1]);
        ctx.lineTo(pt0[0], pt0[1]);
        ctx.stroke();
        ctx.restore();
    }

    SectionsWidget.prototype.Draw = function(view) {
        if ( ! this.Active) {
            return;
        }
        for (var i = 0; i < this.Sections.length; ++i) {
            var section = this.Sections[i];
            section.Draw(view);
            // Draw the section index.
            var pt = section.ViewUpperRight;
            var ctx = view.Context2d;
            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            ctx.font="20px Georgia";
            ctx.fillStyle='#00F';
            ctx.fillText((i+1).toString(),pt[0]-10,pt[1]+25);
            ctx.restore();
        }
        if (this.ActiveSection) {
            this.PlaceDeleteButton(this.ActiveSection);
        }
        if (this.ActiveSection) {
            var bds = this.ActiveSection.GetBounds();
            this.DrawBounds(view,bds,true,'#FF0');
        }
        if (this.DragBounds) {
        this.DrawBounds(view,this.DragBounds,true, '#F00');
        }
    }


    SectionsWidget.prototype.Serialize = function() {
        var obj = new Object();
        obj.type = "sections";
        obj.sections = [];
        for (var i = 0; i < this.Sections.length; ++i) {
            var section = this.Sections[i].Serialize();
            obj.sections.push(section);
        }
        // Already serialized
        obj.creation_camera = this.CreationCamera;

        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    SectionsWidget.prototype.Load = function(obj) {
        for(var n=0; n < obj.sections.length; n++){
            var section = new SAM.StackSectionWidget();
            section.Load(obj.sections[n]);
            if ( ! section.IsEmpty()) {
                this.Sections.push(section);
            }
        }
        this.CreationCamera = obj.creation_camera;
        if (this.IsEmpty()) {
            this.RemoveFromViewer();
        }
    }

    SectionsWidget.prototype.IsEmpty = function() {
        return this.Sections.length == 0;
    }

    SectionsWidget.prototype.HandleMouseWheel = function(event) {
        return true;
    }

    SectionsWidget.prototype.HandleKeyPress = function(event, shift) {
        if (event.keyCode == 46) {
            this.DeleteActiveSection();
            return false;
        }
        return true;
    }

    SectionsWidget.prototype.HandleMouseDown = function(event) {
        this.StartX = event.offsetX;
        this.StartY = event.offsetY;
        if (this.ActiveSection) {
            if (event.which == 3) {
                this.Menu
                    .show()
                    .css({'left': event.offsetX+'px',
                          'top' : event.offsetY+'px'});
            }
            return false;
        }
        return true;
    }

    SectionsWidget.prototype.HandleMouseUp = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;
        if (event.which == 1) {
            if (Math.abs(x-this.StartX) +
                Math.abs(y-this.StartY) < 5) {
                //alert("click");
            } else if (this.DragBounds) {
                this.ProcessBounds(this.DragBounds);
            }
            this.DragBounds = null;
            this.Layer.EventuallyDraw();
        }
        this.Menu.hide();
        return false;
    }

    SectionsWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    }

    SectionsWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;
        if (event.which == 1) {
            // Drag out a bounding box.
            // Keep the bounding box in slide coordinates for now.
            var pt0 = this.Viewer.ConvertPointViewerToWorld(this.StartX, this.StartY);
            var pt1 = this.Viewer.ConvertPointViewerToWorld(x, y);
            this.DragBounds = [pt0[0],pt1[0], pt0[1],pt1[1]];
            this.Layer.EventuallyDraw();
            return false;
        }

        if (event.which == 0) {
            var pt = this.Viewer.ConvertPointViewerToWorld(x,y);
            // Find the smallest section with pt in the bbox.
            var bestSection = null;
            var bestArea = -1;
            for (var i = 0; i < this.Sections.length; ++i) {
                var bds = this.Sections[i].GetBounds();
                if (pt[0]>bds[0] && pt[0]<bds[1] && pt[1]>bds[2] && pt[1]<bds[3]) {
                    var area = (bds[1]-bds[0])*(bds[3]-bds[2]);
                    if (bestSection == null || area < bestArea) {
                        bestSection = this.Sections[i];
                        bestArea = area;
                    }
                }
            }
            this.SetActiveSection(bestSection);
            return true;
        }
    }

    SectionsWidget.prototype.CheckActive = function(event) {
        return this.Active;
    }

    SectionsWidget.prototype.GetActive = function() {
        return this.Active;
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    SectionsWidget.prototype.SetActive = function(flag) {
        if (flag) {
            this.Layer.ActivateWidget(this);
            this.Active = true;
        } else {
            this.Layer.DeactivateWidget(this);
            this.Active = false;
            if (this.DeactivateCallback) {
                this.DeactivateCallback();
            }
        }
        this.Layer.EventuallyDraw();
    }

    SectionsWidget.prototype.Deactivate = function() {
        this.SetActive(false);
    }

    // The multiple actions of bounds might be confusing to the user.
    SectionsWidget.prototype.ProcessBounds = function(bds) {
        if (bds[0] > bds[1]) {
            var tmp = bds[0];
            bds[0] = bds[1];
            bds[1] = tmp;
        }
        if (bds[2] > bds[3]) {
            var tmp = bds[2];
            bds[2] = bds[3];
            bds[3] = tmp;
        }

        var full = [];
        var partial = [];
        for (var i = 0; i < this.Sections.length; ++i) {
            var section = this.Sections[i];
            var mode = section.ContainedInBounds(bds);
            if (mode == 2) { full.push(section); }
            if (mode == 1) { partial.push(section); }
        }
        // If the rectangle fully contains more than one shape, group them
        if (full.length > 1) {
            for (var i = 1; i < full.length; ++i) {
                full[0].Union(full[i]);
                this.RemoveSection(full[i]);
            }
        }
        // If bounds do not contain any section, process the image for a new one.
        if (full.length == 0 && partial.length == 0) {
            // My decision to keep bounds in slide space is causing problems
            // here. I might want to change all bounds comparison to view.
            // It would require recomputation of bounds when the view changes,
            // but that would not be too expensive.  It would require a
            // view change event to invalidate all bounds.
            // For now just get the data in view coordinates.
            // Compute the resolution.
            var self = this;
            var scale = (bds[1]-bds[0]+bds[3]-bds[2]) / 600;
            if (scale < 1) { scale = 1; }

            GetCutoutImage(this.Viewer.GetCache(),
                           [Math.round((bds[1]-bds[0])/scale), Math.round((bds[3]-bds[2])/scale)],
                           [0.5*(bds[0]+bds[1]), 0.5*(bds[2]+bds[3])],
                           scale, 0, null,
                           function (data) {
                               // slow: SmoothDataAlphaRGB(data, 2);
                               var histogram = ComputeIntensityHistogram(data, true);
                               var threshold = PickThreshold(histogram);
                               // TODO: Move the hagfish specific method in to this class.
                               var contours = self.GetBigContours(data, threshold);
                               if (contours.length == 0) { return; }
                               var w = new SAM.StackSectionWidget();
                               for (var i = 0; i < contours.length; ++i) {
                                   w.Shapes.push(contours[i].MakePolyline([0,1,0]));
                               }
                               self.Sections.push(w);
                               this.Layer.EventuallyDraw();
                           });
        }

        // If the contours partially contains only one section, and clean
        // separates the shapes, then split them.
        if (full.length == 0 && partial.length == 1) {
            var section = partial[0];
            full = [];
            partial = [];
            for (var i = 0; i < section.Shapes.length; ++i) {
                var contains = section.Shapes[i].ContainedInBounds(bds);
                if (contains == 1) { partial.push(section.Shapes[i]); }
                if (contains == 2) { full.push(section.Shapes[i]); }
            }
            if (partial.length == 0) {
                var idx;
                // Split it up.
                var newSection = new SAM.StackSectionWidget();
                newSection.Shapes = full;
                for (var i = 0; i < full.length; ++i) {
                    idx = section.Shapes.indexOf(full[i]);
                    if (idx != -1) {
                        section.Shapes.splice(idx,1);
                    }
                    section.Bounds = null;
                }
                idx = this.Sections.indexOf(section);
                this.Sections.splice(idx,0,newSection);
            }
        }
    }


    // Returns all contours (including inside out contours).
    SectionsWidget.prototype.GetContours = function (data, threshold) {
        // Loop over the cells.
        // Start at the bottom left: y up then x right.
        // (The order of sections on the hagfish slides.)
        var contours = [];
        for (var x = 1; x < data.width; ++x) {
            for (var y = 1; y < data.height; ++y) {
                // Look for contours crossing the xMax and yMax edges.
                var xContour = SeedIsoContour(data, x,y, x-1,y, threshold);
                if (xContour) {
                    var c = new Contour();
                    c.Camera = data.Camera;
                    c.Threshold = threshold;
                    c.SetPoints(xContour);
                    c.RemoveDuplicatePoints(2);
                    var area = c.GetArea();
                    contours.push(c);
                }

                var yContour = SeedIsoContour(data, x,y, x,y-1, threshold);
                if (yContour) {
                    c = new Contour();
                    c.Camera = data.Camera;
                    c.Threshold = threshold;
                    c.SetPoints(yContour);
                    c.RemoveDuplicatePoints(2);
                    area = c.GetArea();
                    contours.push(c);
                }
            }
        }
        return contours;
    }


    // Returns all contours at least 50% the area of the largest contour.
    SectionsWidget.prototype.GetBigContours = function (data, threshold) {
        var contours = this.GetContours(data, threshold);

        // Area is cached in the contour object.
        var largestArea = 0;
        for (var i = 0; i < contours.length; ++i) {
            if (contours[i].GetArea() > largestArea) {
                largestArea = contours[i].GetArea();
            }
        }

        var bigContours = [];
        for (var i = 0; i < contours.length; ++i) {
            if (contours[i].GetArea() > largestArea*0.5) {
                bigContours.push(contours[i]);
            }
        }

        return bigContours;
    }


    // Just use bounds for now.  Computing actual distances will be complex.
    SectionsWidget.prototype.MergeCloseSections = function(dist) {
        for (var i = 0; i < this.Sections.length; ++i) {
            var section = this.Sections[i];
            for (j = i+1; j < this.Sections.length; ++j) {
                var other = this.Sections[j];
                var bds0 = section.GetBounds();
                var bds1 = other.GetBounds();
                if (bds0[1]+dist > bds1[0] && bds0[0]-dist < bds1[1] &&
                    bds0[3]+dist > bds1[2] && bds0[2]-dist < bds1[3]) {
                    section.Union(other);
                    this.Sections.splice(j,1);
                    section
                    --j;
                }
            }
        }
    }

    SAM.SectionsWidget = SectionsWidget;

})();

//==============================================================================
// Feedback for the image that will be downloaded with the cutout service.
// Todo:
// - Key events and tooltips for buttons.
//   This is difficult because the widget would have to be active all the time.
//   Hold off on this.


(function () {
    "use strict";

    function CutoutWidget (parent, viewer) {
        this.Viewer = viewer;
        this.Layer = viewer.AnnotationLayer;
        var cam = layer.GetCamera();
        var fp = cam.GetFocalPoint();

        var rad = cam.Height / 4;
        this.Bounds = [fp[0]-rad,fp[0]+rad, fp[1]-rad,fp[1]+rad];
        this.DragBounds = [fp[0]-rad,fp[0]+rad, fp[1]-rad,fp[1]+rad];

        layer.AddWidget(this);
        eventuallyRender();

        // Bits that indicate which edges are active.
        this.Active = 0;

        var self = this;
        this.Div = $('<div>')
            .appendTo(parent)
            .addClass("sa-view-cutout-div");
        $('<button>')
            .appendTo(this.Div)
            .text("Cancel")
            .addClass("sa-view-cutout-button")
            .click(function(){self.Cancel();});
        $('<button>')
            .appendTo(this.Div)
            .text("Download")
            .addClass("sa-view-cutout-button")
            .click(function(){self.Accept();});

        this.Select = $('<select>')
            .appendTo(this.Div);
        $('<option>').appendTo(this.Select)
            .attr('value', 0)
            .text("tif");
        $('<option>').appendTo(this.Select)
            .attr('value', 1)
            .text("jpeg");
        $('<option>').appendTo(this.Select)
            .attr('value', 2)
            .text("png");
        $('<option>').appendTo(this.Select)
            .attr('value', 3)
            .text("svs");

        this.Label = $('<div>')
            .addClass("sa-view-cutout-label")
            .appendTo(this.Div);
        this.UpdateBounds();
        this.HandleMouseUp();
    }

    CutoutWidget.prototype.Accept = function () {
        this.Deactivate();
        var types = ["tif", "jpeg", "png", "svs"]
        var image_source = this.Viewer.GetCache().Image;
        // var bounds = [];
        // for (var i=0; i <this.Bounds.length; i++) {
        //  bounds[i] = this.Bounds[i] -1;
        // }

        window.location = "/cutout/" + image_source.database + "/" +
            image_source._id + "/image."+types[this.Select.val()]+"?bounds=" + JSON.stringify(this.Bounds);
    }


    CutoutWidget.prototype.Cancel = function () {
        this.Deactivate();
    }

    CutoutWidget.prototype.Serialize = function() {
        return false;
    }

    CutoutWidget.prototype.Draw = function(view) {
        var center = [(this.DragBounds[0]+this.DragBounds[1])*0.5,
                      (this.DragBounds[2]+this.DragBounds[3])*0.5];
        var cam = view.Camera;
        var viewport = view.Viewport;

        if (GL) {
            alert("webGL cutout not supported");
        } else {
            // The 2d canvas was left in world coordinates.
            var ctx = view.Context2d;
            var cam = view.Camera;
            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            this.DrawRectangle(ctx, this.Bounds, cam, "#00A", 1, 0);
            this.DrawRectangle(ctx, this.DragBounds, cam, "#000",2, this.Active);
            this.DrawCenter(ctx, center, cam, "#000");
            ctx.restore();
        }
    }

    CutoutWidget.prototype.DrawRectangle = function(ctx, bds, cam, color,
                                                    lineWidth, active) {
        // Convert the for corners to view.
        var pt0 = cam.ConvertPointWorldToViewer(bds[0],bds[2]);
        var pt1 = cam.ConvertPointWorldToViewer(bds[1],bds[2]);
        var pt2 = cam.ConvertPointWorldToViewer(bds[1],bds[3]);
        var pt3 = cam.ConvertPointWorldToViewer(bds[0],bds[3]);

        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.strokeStyle=(active&4)?"#FF0":color;
        ctx.moveTo(pt0[0], pt0[1]);
        ctx.lineTo(pt1[0], pt1[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&2)?"#FF0":color;
        ctx.moveTo(pt1[0], pt1[1]);
        ctx.lineTo(pt2[0], pt2[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&8)?"#FF0":color;
        ctx.moveTo(pt2[0], pt2[1]);
        ctx.lineTo(pt3[0], pt3[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&1)?"#FF0":color;
        ctx.moveTo(pt3[0], pt3[1]);
        ctx.lineTo(pt0[0], pt0[1]);
        ctx.stroke();
    }

    CutoutWidget.prototype.DrawCenter = function(ctx, pt, cam, color) {
        // Convert the for corners to view.
        var pt0 = cam.ConvertPointWorldToViewer(pt[0],pt[1]);

        ctx.strokeStyle=(this.Active&16)?"#FF0":color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pt0[0]-5, pt0[1]);
        ctx.lineTo(pt0[0]+5, pt0[1]);
        ctx.moveTo(pt0[0], pt0[1]-5);
        ctx.lineTo(pt0[0], pt0[1]+5);
        ctx.stroke();
    }


    CutoutWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        // Return is the same as except.
        if (event.keyCode == 67) {
            alert("Accept");
        }
        // esc or delete: cancel
        if (event.keyCode == 67) {
            alert("Cancel");
        }

        return true;
    }

    CutoutWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    }

    CutoutWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1) {
            return false;
        }
        return true;
    }

    // returns false when it is finished doing its work.
    CutoutWidget.prototype.HandleMouseUp = function() {
        if (this.Bounds[0] > this.Bounds[1]) {
            var tmp = this.Bounds[0];
            this.Bounds[0] = this.Bounds[1];
            this.Bounds[1] = tmp;
        }
        if (this.Bounds[2] > this.Bounds[3]) {
            var tmp = this.Bounds[2];
            this.Bounds[2] = this.Bounds[3];
            this.Bounds[3] = tmp;
        }

        this.DragBounds = this.Bounds.slice(0);
        eventuallyRender();
    }

    CutoutWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 0) {
            this.CheckActive(event);
            return;
        }

        if (this.Active) {
            var cam = this.Layer.GetCamera();
            var pt = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            if (this.Active&1) {
                this.DragBounds[0] = pt[0];
            }
            if (this.Active&2) {
                this.DragBounds[1] = pt[0];
            }
            if (this.Active&4) {
                this.DragBounds[2] = pt[1];
            }
            if (this.Active&8) {
                this.DragBounds[3] = pt[1];
            }
            if (this.Active&16) {
                var dx = pt[0] - 0.5*(this.DragBounds[0]+this.DragBounds[1]);
                var dy = pt[1] - 0.5*(this.DragBounds[2]+this.DragBounds[3]);
                this.DragBounds[0] += dx;
                this.DragBounds[1] += dx;
                this.DragBounds[2] += dy;
                this.DragBounds[3] += dy;
            }
            this.UpdateBounds();
            eventuallyRender();
            return true;
        }
        return false;
    }

    // Bounds follow drag bounds, but snap to the tile grid.
    // Maybe we should not force Bounds to contain DragBounds.
    // Bounds Grow when dragging the center. Maybe
    // round rather the use floor and ceil.
    CutoutWidget.prototype.UpdateBounds = function(event) {
        var cache = this.Viewer.GetCache();
        var tileSize = cache.Image.TileSize;
        //this.Bounds[0] = Math.floor(this.DragBounds[0]/tileSize) * tileSize;
        //this.Bounds[1] =  Math.ceil(this.DragBounds[1]/tileSize) * tileSize;
        //this.Bounds[2] = Math.floor(this.DragBounds[2]/tileSize) * tileSize;
        //this.Bounds[3] =  Math.ceil(this.DragBounds[3]/tileSize) * tileSize;
        var bds = [0,0,0,0];
        bds[0] = Math.round(this.DragBounds[0]/tileSize) * tileSize;
        bds[1] = Math.round(this.DragBounds[1]/tileSize) * tileSize;
        bds[2] = Math.round(this.DragBounds[2]/tileSize) * tileSize;
        bds[3] = Math.round(this.DragBounds[3]/tileSize) * tileSize;

        // Keep the bounds in the image.
        // min and max could be inverted.
        // I am not sure the image bounds have to be on the tile boundaries.
        var imgBds = cache.Image.bounds;
        if (bds[0] < imgBds[0]) bds[0] = imgBds[0];
        if (bds[1] < imgBds[0]) bds[1] = imgBds[0];
        if (bds[2] < imgBds[2]) bds[2] = imgBds[2];
        if (bds[3] < imgBds[2]) bds[3] = imgBds[2];

        if (bds[0] > imgBds[1]) bds[0] = imgBds[1];
        if (bds[1] > imgBds[1]) bds[1] = imgBds[1];
        if (bds[2] > imgBds[3]) bds[2] = imgBds[3];
        if (bds[3] > imgBds[3]) bds[3] = imgBds[3];

        // Do not the bounds go to zero area.
        if (bds[0] != bds[1]) {
            this.Bounds[0] = bds[0];
            this.Bounds[1] = bds[1];
        }
        if (bds[2] != bds[3]) {
            this.Bounds[2] = bds[2];
            this.Bounds[3] = bds[3];
        }

        // Update the label.
        var dim = [this.Bounds[1]-this.Bounds[0],this.Bounds[3]-this.Bounds[2]];
        this.Label.text(dim[0] + " x " + dim[1] +
                        " = " + this.FormatPixels(dim[0]*dim[1]) + "pixels");
    }

    CutoutWidget.prototype.FormatPixels = function(num) {
        if (num > 1000000000) {
            return Math.round(num/1000000000) + "G";
        }
        if (num > 1000000) {
            return Math.round(num/1000000) + "M";
        }
        if (num > 1000) {
            return Math.round(num/1000) + "k";
        }
        return num;
    }


    CutoutWidget.prototype.HandleTouchPan = function(event) {
    }

    CutoutWidget.prototype.HandleTouchPinch = function(event) {
    }

    CutoutWidget.prototype.HandleTouchEnd = function(event) {
    }


    CutoutWidget.prototype.CheckActive = function(event) {
        var cam = this.Layer.GetCamera();
        // it is easier to make the comparison in slide coordinates,
        // but we need a tolerance in pixels.
        var tolerance = cam.Height / 200;
        var pt = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        var active = 0;

        var inX = (this.DragBounds[0]-tolerance < pt[0] && pt[0] < this.DragBounds[1]+tolerance);
        var inY = (this.DragBounds[2]-tolerance < pt[1] && pt[1] < this.DragBounds[3]+tolerance);
        if (inY && Math.abs(pt[0]-this.DragBounds[0]) < tolerance) {
            active = active | 1;
        }
        if (inY && Math.abs(pt[0]-this.DragBounds[1]) < tolerance) {
            active = active | 2;
        }
        if (inX && Math.abs(pt[1]-this.DragBounds[2]) < tolerance) {
            active = active | 4;
        }
        if (inX && Math.abs(pt[1]-this.DragBounds[3]) < tolerance) {
            active = active | 8;
        }

        var center = [(this.DragBounds[0]+this.DragBounds[1])*0.5, 
                      (this.DragBounds[2]+this.DragBounds[3])*0.5];
        tolerance *= 2;
        if (Math.abs(pt[0]-center[0]) < tolerance &&
            Math.abs(pt[1]-center[1]) < tolerance) {
            active = active | 16;
        }

        if (active != this.Active) {
            this.SetActive(active);
            eventuallyRender();
        }

        return false;
    }

    // Multiple active states. Active state is a bit confusing.
    CutoutWidget.prototype.GetActive = function() {
        return this.Active;
    }

    CutoutWidget.prototype.Deactivate = function() {
        this.Div.remove();
        if (this.Layer == null) {
            return;
        }
        this.Layer.DeactivateWidget(this);
        this.Layer.RemoveWidget(this);

        eventuallyRender();
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    CutoutWidget.prototype.SetActive = function(active) {
        if (this.Active == active) {
            return;
        }
        this.Active = active;

        if ( active != 0) {
            this.Layer.ActivateWidget(this);
        } else {
            this.Layer.DeactivateWidget(this);
        }
        eventuallyRender();
    }

    SAM.CutoutWidget = CutoutWidget;

})();




// TODO:
// Fix the webGL attributes not initialized properly warning.
// Multiple text object should share the same texture.
// Add symbols -=+[]{},.<>'";: .....

(function () {
    "use strict";

    var LINE_SPACING = 1.3;


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
        if (GL) {
            this.TextureLoaded = false;
            this.Texture = GL.createTexture();
            this.Image = new Image();
            this.Image.onload = GetTextureLoadedFunction(this);
            //this.Image.onerror = TextError(); // Always fires for some reason.
            // This starts the loading.
            this.Image.src = SA.ImagePathUrl +"letters.gif";
        }
        this.Color = [0.5, 1.0, 1.0];
        this.Size = 12; // Height in pixels

        // Position of the anchor in the world coordinate system.
        this.Position = [100,100];
        this.Orientation = 0.0; // in degrees, counter clockwise, 0 is left

        // The anchor point and position are the same point.
        // Position is in world coordinates.
        // Anchor is in pixel coordinates of text (buffers).
        // In pixel(text) coordinate system
        this.Anchor = [0,0];
        this.Active = false;

        //this.String = "Hello World";
        //this.String = "0123456789";
        this.String = ",./<>?[]\{}|-=~!@#$%^&*()_+";

        // Pixel bounds are in text box coordiante system.
        this.PixelBounds = [0,0,0,0];
  
        this.BackgroundFlag = false;
    };

    Text.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    // TODO: Although this only used for the webL renderer, we should really
    // Hava a callback and let the application (or widget) call eventually render.
    Text.prototype.HandleLoadedTexture = function() {
        if (GL) {
            var texture = this.Texture;
            GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
            GL.bindTexture(GL.TEXTURE_2D, texture);
            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, this.Image);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
            GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR_MIPMAP_NEAREST);
            GL.generateMipmap(GL.TEXTURE_2D);
            GL.bindTexture(GL.TEXTURE_2D, null);
            this.TextureLoaded = true;
        }
        eventuallyRender();
    }

    Text.prototype.Draw = function (view) {
        // Place the anchor of the text.
        // First transform the world anchor to view.
        var x = this.Position[0];
        var y = this.Position[1];
        if (this.PositionCoordinateSystem != SAM.Shape.VIEWER) {
            var m = view.Camera.Matrix;
            x = (this.Position[0]*m[0] + this.Position[1]*m[4] + m[12])/m[15];
            y = (this.Position[0]*m[1] + this.Position[1]*m[5] + m[13])/m[15];
            // convert view to pixels (view coordinate system).
            x = view.Viewport[2]*(0.5*(1.0+x));
            y = view.Viewport[3]*(0.5*(1.0-y));
        }
  
        // Hacky attempt to mitigate the bug that randomly sends the Anchor values into the tens of thousands.
        if(Math.abs(this.Anchor[0]) > 1000 || Math.abs(this.Anchor[1]) > 1000){
            this.Anchor = [-50, 0];
        }

        if (GL) {
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
            camMatrix[5] = -2.0 / view.Viewport[3];
            camMatrix[13] = 1.0;
            camMatrix[14] = viewFrontZ; // In front of everything (no depth buffer anyway).
            GL.uniformMatrix4fv(program.pMatrixUniform, false, camMatrix);

            // Translate the anchor to x,y
            this.Matrix[12] = x - this.Anchor[0];
            this.Matrix[13] = y - this.Anchor[1];
            GL.uniformMatrix4fv(program.mvMatrixUniform, false, this.Matrix);

            GL.activeTexture(GL.TEXTURE0);
            GL.bindTexture(GL.TEXTURE_2D, this.Texture);
            GL.uniform1i(program.samplerUniform, 0);

            GL.drawElements(GL.TRIANGLES, this.CellBuffer.numItems, GL.UNSIGNED_SHORT,0);
        } else {
            // (x,y) is the screen position of the text.
            // Canvas text location is lower left of first letter.
            var strArray = this.String.split("\n");
            // Move (x,y) from tip of the arrow to the upper left of the text box.
            var ctx = view.Context2d;
            ctx.save();
            var radians = this.Orientation * Math.PI / 180;
            var s = Math.sin(radians);
            var c = Math.cos(radians);
            ctx.setTransform(c,-s,s,c,x,y);
            x = - this.Anchor[0];
            y = - this.Anchor[1];

            ctx.font = this.Size+'pt Calibri';
            var width = this.PixelBounds[1];
            var height = this.PixelBounds[3];
            // Draw the background text box.
            if(this.BackgroundFlag){
                //ctx.fillStyle = '#fff';
                //ctx.strokeStyle = '#000';
                //ctx.fillRect(x - 2, y - 2, this.PixelBounds[1] + 4, (this.PixelBounds[3] + this.Size/3)*1.4);
                roundRect(ctx, x - 2, y - 2, width + 6, height + 2, this.Size / 2, true, false);
            }

            // Choose the color for the text.
            if (this.Active) {
                ctx.fillStyle = '#FF0';
            } else {
                ctx.fillStyle = SAM.ConvertColorToHex(this.Color);
            }

            // Convert (x,y) from upper left of textbox to lower left of first character.
            y = y + this.Size;
            // Draw the lines of the text.
            for (var i = 0; i < strArray.length; ++i) {
                ctx.fillText(strArray[i], x, y)
                // Move to the lower left of the next line.
                y = y + this.Size*LINE_SPACING;
            }

            ctx.stroke();
            ctx.restore();
        }
    }

    function roundRect(ctx, x, y, width, height, radius) {
        /*if (typeof stroke == "undefined" ) {
          stroke = true;
          }*/
        if (typeof radius === "undefined") {
            radius = 5;
        }
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }

    Text.prototype.UpdateBuffers = function() {
        if ( ! GL) { 
            // Canvas.  Compute pixel bounds.
            var strArray = this.String.split("\n");
            var height = this.Size * LINE_SPACING * strArray.length;
            var width = 0;
            // Hack: use a global viewer because I do not have the viewer.
            // Maybe it should be passed in as an argument, or store the context
            // as an instance variable.
            var ctx = TEXT_VIEW_HACK.Context2d;
            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            ctx.font = this.Size+'pt Calibri';
            // Compute the width of the text box.
            for (var i = 0; i < strArray.length; ++i) {
                var lineWidth = ctx.measureText(strArray[i]).width;
                if (lineWidth > width) { width = lineWidth; }
            }
            this.PixelBounds = [0, width, 0, height];
            ctx.restore();
            return;
        }
        // Create a textured quad for each letter.
        var vertexPositionData = [];
        var textureCoordData = [];
        var cellData = [];
        // 128 for power of 2, but 98 to top of characters.
        var top = 98.0 / 128.0; // Top texture coordinate value
        var charLeft = 0;
        var charTop = 0;
        var ptId = 0;
        this.PixelBounds = [0,0,0,this.Size];

        for (var i = 0; i < this.String.length; ++i) {
            var idx = this.String.charCodeAt(i);
            if (idx == 10 || idx == 13) { // newline
                charLeft = 0;
                charTop += this.Size;
            } else {
                var port = ASCII_LOOKUP[idx];
                // Convert to texture coordinate values.
                var tLeft =   port[0] / 1024.0;
                var tRight = (port[0]+port[2]) / 1024.0;
                var tBottom = port[1] / 512.0;
                var tTop =   (port[1]+port[3]) / 512.0;
                // To place vertices
                var charRight = charLeft + port[2]*this.Size / 98.0;
                var charBottom = charTop + port[3]*this.Size / 98.0;

                // Accumulate bounds;
                if (this.PixelBounds[0] > charLeft)   {this.PixelBounds[0] = charLeft;}
                if (this.PixelBounds[1] < charRight)  {this.PixelBounds[1] = charRight;}
                if (this.PixelBounds[2] > charTop)    {this.PixelBounds[2] = charTop;}
                if (this.PixelBounds[3] < charBottom) {this.PixelBounds[3] = charBottom;}

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

        return false;
    }

    Text.prototype.SetColor = function (c) {
        this.Color = SAM.ConvertColor(c);
    }

    SAM.Text = Text;

})();




//==============================================================================
// The new behavior.
// The widget gets created with a dialog and is in it's waiting state.
// It monitors mouse movements and decides when to become active.
// It becomes active when the mouse is over the center or edge.
// I think we should have a method other than handleMouseMove check this
// because we need to handle overlapping widgets.
// When active, the user can move the circle, or change the radius.
// I do not know what to do about line thickness yet.
// When active, we will respond to right clicks which bring up a menu.
// One item in the menu will be delete.

// I am adding an optional glyph/shape/arrow that displays the text location.

//==============================================================================

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    var DEBUG;

    var WAITING = 0;
    var ACTIVE = 1;
    var ACTIVE_TEXT = 2;
    var DRAG = 3; // Drag text with position
    var DRAG_TEXT = 4; // Drag text but leave the position the same.
    var PROPERTIES_DIALOG = 5;

    function TextWidget (layer, string) {
        DEBUG = this;
        if (layer == null) {
            return null;
        }

        if ( typeof string != "string") { string = "";} 

        // create and cuystomize the dialog properties popup.
        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        this.Dialog.Title.text('Text Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});

        this.Dialog.TextInput =
            $('<textarea>')
            .appendTo(this.Dialog.Body)
            .css({'width': '87%'});

        this.Dialog.FontDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.FontLabel = 
            $('<div>')
            .appendTo(this.Dialog.FontDiv)
            .text("Font (px):")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.FontInput =
            $('<input type="number">')
            .appendTo(this.Dialog.FontDiv)
            .val('12')
            .css({'display':'table-cell'});

        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .css({'display':'table-cell'});

        this.Dialog.VisibilityModeDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.VisibilityModeLabel =
            $('<div>')
            .appendTo(this.Dialog.VisibilityModeDiv)
            .text("Visibility:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.VisibilityModeInputButtons =
            $('<div>')
            .appendTo(this.Dialog.VisibilityModeDiv)
        //.text("VisibilityMode")
            .attr('checked', 'false')
            .css({'display': 'table-cell'});

        this.Dialog.VisibilityModeInputs = []; 
        this.Dialog.VisibilityModeInputs[0] = 
            $('<input type="radio" name="visibilityoptions" value="0">Text only</input>')
            .appendTo(this.Dialog.VisibilityModeInputButtons)
            .attr('checked', 'false')

        $('<br>').appendTo(this.Dialog.VisibilityModeInputButtons);

        this.Dialog.VisibilityModeInputs[1] = 
            $('<input type="radio" name="visibilityoptions" value="1">Arrow only, text on hover</input>')
            .appendTo(this.Dialog.VisibilityModeInputButtons)
            .attr('checked', 'false')

        $('<br>').appendTo(this.Dialog.VisibilityModeInputButtons);

        this.Dialog.VisibilityModeInputs[2] = 
            $('<input type="radio" name="visibilityoptions" value="2">Arrow and text visible</input>')
            .appendTo(this.Dialog.VisibilityModeInputButtons)
            .attr('checked', 'true')

        this.Dialog.BackgroundDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.BackgroundLabel =
            $('<div>')
            .appendTo(this.Dialog.BackgroundDiv)
            .text("Background:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.BackgroundInput =
            $('<input type="checkbox">')
            .appendTo(this.Dialog.BackgroundDiv)
            .attr('checked', 'true')
            .css({'display': 'table-cell'});

        // Create the hover popup for deleting and showing properties dialog.
        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        // Text widgets are created with the dialog open (to set the string).
        // I do not think we have to do this because ShowPropertiesDialog is called after constructor.
        this.State = WAITING;
        this.CursorLocation = 0; // REMOVE

        var cam = this.Layer.GetCamera();

        this.Text = new SAM.Text();
        this.Text.String = string;
        this.Text.UpdateBuffers(); // Needed to get the bounds.
        this.Text.Color = [0.0, 0.0, 1.0];
        this.Text.Anchor = [0.5*(this.Text.PixelBounds[0]+this.Text.PixelBounds[1]),
                            0.5*(this.Text.PixelBounds[2]+this.Text.PixelBounds[3])];

        // I would like to setup the ancoh in the middle of the screen,
        // And have the Anchor in the middle of the text.
        this.Text.Position = [cam.FocalPoint[0], cam.FocalPoint[1]];

        // The anchor shape could be put into the text widget, but I might want a thumb tack anchor.
        this.Arrow = new SAM.Arrow();
        this.Arrow.Origin = this.Text.Position; // note: both point to the same memory now.
        this.Arrow.Length = 50;
        this.Arrow.Width = 10;
        this.Arrow.UpdateBuffers();
        this.Arrow.Visibility = true;
        this.Arrow.Orientation = 45.0; // in degrees, counter clockwise, 0 is left
        this.Arrow.FillColor = [0,0,1];
        this.Arrow.OutlineColor = [1,1,0];
        this.Arrow.ZOffset = 0.2;
        this.Arrow.UpdateBuffers();

        layer.AddWidget(this);
        this.ActiveReason = 1;

        // It is odd the way the Anchor is set.  Leave the above for now.
        this.SetTextOffset(50,0);

        // Get default properties.
        this.VisibilityMode = 2;
        this.Text.BackgroundFlag = true;
        this.Dialog.BackgroundInput.prop('checked', true);
        var hexcolor = SAM.ConvertColorToHex(this.Dialog.ColorInput.val());
        if (localStorage.TextWidgetDefaults) {
            var defaults = JSON.parse(localStorage.TextWidgetDefaults);
            if (defaults.Color) {
                hexcolor = SAM.ConvertColorToHex(defaults.Color);
            }
            if (defaults.FontSize) {
                // font size was wrongly saved as a string.
                this.Text.Size = parseFloat(defaults.FontSize);
            }
            if (defaults.BackgroundFlag !== undefined) {
                this.Text.BackgroundFlag = defaults.BackgroundFlag;
            }
            if (defaults.VisibilityMode !== undefined) {
                this.SetVisibilityMode(defaults.VisibilityMode);
            }
        }
        this.Text.Color = hexcolor;
        this.Arrow.SetFillColor(hexcolor);
        this.Arrow.ChooseOutlineColor();

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();
    }

    // Three state visibility so text can be hidden during calss questions.
    // The combined visibilities is confusing.
    // Global text visibility is passed in as argument.
    // Local visiblity mode is the hover state of this text. (0 text only, 1: hover, 2: both on).
    TextWidget.prototype.Draw = function(view, visibility) {
        if (visibility != ANNOTATION_OFF && this.VisibilityMode != 0) {
            this.Arrow.Draw(view);
        }
        if (visibility == ANNOTATION_ON) {
            if (this.VisibilityMode != 1 || this.State != WAITING) {
                this.Text.Draw(view);
                this.Text.Visibility = true;
            } else {
                this.Text.Visibility = false;
            }
        }
    }

    TextWidget.prototype.PasteCallback = function(data, mouseWorldPt) {
        this.Load(data);
        // Place the tip of the arrow at the mose location.
        this.Text.Position[0] = mouseWorldPt[0];
        this.Text.Position[1] = mouseWorldPt[1];
        this.UpdateArrow();
        this.Layer.EventuallyDraw();
        if (SAM.NotesWidget) { SAM.NotesWidget.MarkAsModified(); } // Hack
    }


    TextWidget.prototype.Serialize = function() {
        if(this.Text === undefined){ return null; }
        var obj = new Object();
        obj.type = "text";
        obj.color = this.Text.Color;
        obj.size = this.Text.Size;
        obj.offset = [-this.Text.Anchor[0], -this.Text.Anchor[1]];
        obj.position = this.Text.Position;
        obj.string = this.Text.String;
        obj.visibility = this.VisibilityMode;
        obj.backgroundFlag = this.Text.BackgroundFlag;
        obj.creation_camera = this.CreationCamera;
        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    TextWidget.prototype.Load = function(obj) {
        var string = obj.string;
        // Some empty strings got in my database.  I connot delete them from the gui.
        if (obj.string && obj.string == "") {
            this.Layer.RemoveWidget(this);
            return;
        }

        this.Text.String = obj.string;
        var rgb = [parseFloat(obj.color[0]),
                   parseFloat(obj.color[1]),
                   parseFloat(obj.color[2])];
        this.Text.Color = rgb;
        this.Text.Size = parseFloat(obj.size);
        if (obj.backgroundFlag != undefined) {
            this.Text.BackgroundFlag = obj.backgroundFlag;
        }
        this.Text.Position = [parseFloat(obj.position[0]),
                              parseFloat(obj.position[1]),
                              parseFloat(obj.position[2])];
        this.Arrow.Origin = this.Text.Position;

        // I added offest and I have to deal with entries that do not have it.
        if (obj.offset) { // how to try / catch in javascript?
            this.SetTextOffset(parseFloat(obj.offset[0]),
                               parseFloat(obj.offset[1]));
        }

        // How zoomed in was the view when the annotation was created.
        if (obj.creation_camera !== undefined) {
            this.CreationCamera = obj.creation_camera;
        }

        if (obj.anchorVisibility !== undefined) {
            // Old schema.
            if (obj.anchorVisibility) {
                this.SetVisibilityMode(1);
            } else {
                this.SetVisibilityMode(0);
            }
        } else if (obj.visibility !== undefined) {
            this.SetVisibilityMode(obj.visibility)
        }

        this.Arrow.SetFillColor(rgb);
        this.Arrow.ChooseOutlineColor();

        this.Text.UpdateBuffers();
        this.UpdateArrow();
    }

    // When the arrow is visible, the text is offset from the position (tip of arrow).
    TextWidget.prototype.SetTextOffset = function(x, y) {
        this.SavedTextAnchor = [-x, -y];
        this.Text.Anchor = this.SavedTextAnchor.slice(0);
        this.UpdateArrow();
    }


    // When the arrow is visible, the text is offset from the position (tip of arrow).
    TextWidget.prototype.SetPosition = function(x, y) {
        this.Text.Position = [x, y];
        this.Arrow.Origin = this.Text.Position;
    }

    
    // Anchor is in the middle of the bounds when the shape is not visible.
    TextWidget.prototype.SetVisibilityMode = function(mode) {
        if (this.VisibilityMode == mode) { return; }
        this.VisibilityMode = mode;

        if (mode == 2 || mode == 1) { // turn glyph on
            if (this.SavedTextAnchor == undefined) {
                this.SavedTextAnchor = [-30, 0];
            }
            this.Text.Anchor = this.SavedTextAnchor.slice(0);
            this.Arrow.Visibility = true;
            this.Arrow.Origin = this.Text.Position;
            this.UpdateArrow();
        } else if(mode == 0) { // turn glyph off
            // save the old anchor incase glyph is turned back on.
            this.SavedTextAnchor = this.Text.Anchor.slice(0);
            // Put the new (invisible rotation point (anchor) in the middle bottom of the bounds.
            this.Text.UpdateBuffers(); // computes pixel bounds.
            this.Text.Anchor = [(this.Text.PixelBounds[0]+this.Text.PixelBounds[1])*0.5, this.Text.PixelBounds[2]];
            this.Arrow.Visibility = false;
        }
        this.Layer.EventuallyDraw();
    }

    // Change orientation and length of arrow based on the anchor location.
    TextWidget.prototype.UpdateArrow = function() {
        // Compute the middle of the text bounds.
        var xMid = 0.5 * (this.Text.PixelBounds[0] + this.Text.PixelBounds[1]);
        var yMid = 0.5 * (this.Text.PixelBounds[2] + this.Text.PixelBounds[3]);
        var xRad = 0.5 * (this.Text.PixelBounds[1] - this.Text.PixelBounds[0]);
        var yRad = 0.5 * (this.Text.PixelBounds[3] - this.Text.PixelBounds[2]);

        // Compute the angle of the arrow.
        var dx = this.Text.Anchor[0]-xMid;
        var dy = this.Text.Anchor[1]-yMid;
        this.Arrow.Orientation = -(180.0 + Math.atan2(dy, dx) * 180.0 / Math.PI);
        // Compute the length of the arrow.
        var length = Math.sqrt(dx*dx + dy*dy);
        // Find the intersection of the vector and the bounding box.
        var min = length;
        if (dy != 0) {
            var d = Math.abs(length * yRad / dy);
            if (min > d) { min = d; }
        }
        if (dx != 0) {
            var d = Math.abs(length * xRad / dx);
            if (min > d) { min = d; }
        }
        length = length - min - 5;
        if (length < 5) { length = 5;}
        this.Arrow.Length = length;
        this.Arrow.UpdateBuffers();
    }

    TextWidget.prototype.HandleMouseWheel = function(event) {
        // TODO: Scale the size of the text.
        return false;
    }

    TextWidget.prototype.HandleKeyDown = function(event) {
        // The dialog consumes all key events.
        if (this.State == PROPERTIES_DIALOG) {
            return false;
        }

        // Copy
        if (event.keyCode == 67 && event.ctrlKey) {
            // control-c for copy
            // The extra identifier is not needed for widgets, but will be
            // needed if we have some other object on the clipboard.
            var clip = {Type:"TextWidget", Data: this.Serialize()};
            localStorage.ClipBoard = JSON.stringify(clip);
            return false;
        }

        return true;
    }

    TextWidget.prototype.HandleDoubleClick = function(event) {
        this.ShowPropertiesDialog();
        return false;
    }

    TextWidget.prototype.HandleMouseDown = function(event) {
        if (event.which == 1) {
            // LastMouse necessary for dragging.
            var x = event.offsetX;
            var y = event.offsetY;
            var cam = this.Layer.GetCamera();
            this.LastMouse = [x,y];
            if (this.State == ACTIVE) {
                this.State = DRAG;
            } else if (this.State == ACTIVE_TEXT) {
                this.State = DRAG_TEXT;
            }
            return false;
        }
        return true;
    }

    // returns false when it is finished doing its work.
    TextWidget.prototype.HandleMouseUp = function(event) {
        if (event.which == 1) {
            if (this.State == DRAG) {
                this.State = ACTIVE;
                RecordState();
            } else if (this.State == DRAG_TEXT) {
                this.State = ACTIVE_TEXT;
                RecordState();
            }
            return false;
        }

        if (event.which == 3) {
            if (this.State == ACTIVE ||
                this.State == ACTIVE_TEXT) {
                // Right mouse was pressed.
                // Pop up the properties dialog.
                // Which one should we popup?
                // Add a ShowProperties method to the widget. (With the magic of javascript).
                this.State = PROPERTIES_DIALOG;
                this.ShowPropertiesDialog();
                return false;
            }
        }

        return true;
    }

    // I need to convert mouse screen point to coordinates of text buffer
    // to see if the mouse position is in the bounds of the text.
    // Screen y vector point down (up is negative).
    // Text coordinate system will match canvas text: origin upper left, Y point down.
    TextWidget.prototype.ScreenPixelToTextPixelPoint = function(x,y) {
        var cam = this.Layer.GetCamera();
        var textOriginScreenPixelPosition =
            cam.ConvertPointWorldToViewer(this.Text.Position[0],this.Text.Position[1]);
        x = (x - textOriginScreenPixelPosition[0]) + this.Text.Anchor[0];
        y = (y - textOriginScreenPixelPosition[1]) + this.Text.Anchor[1];

        return [x,y];
    }

    TextWidget.prototype.HandleMouseMove = function(event) {
        if (this.State == DRAG) {
            if (SAM.NotesWidget) {
                // Hack.
                SAM.NotesWidget.MarkAsModified();
            }
            var cam = this.Layer.GetCamera();
            var w0 = cam.ConvertPointViewerToWorld(this.LastMouse[0], this.LastMouse[1]);
            var w1 = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            var wdx = w1[0] - w0[0];
            var wdy = w1[1] - w0[1];
            this.LastMouse = [event.offsetX, event.offsetY];
            this.Text.Position[0] += wdx;
            this.Text.Position[1] += wdy;
            this.Arrow.Origin = this.Text.Position;
            this.PlacePopup();
            if (SAM.NotesWidget) { SAM.NotesWidget.MarkAsModified(); } // Hack
            this.Layer.EventuallyDraw();
            return false;
        }
        if (this.State == DRAG_TEXT) { // Just the text not the anchor glyph
            if (SAM.NotesWidget) {
                // Hack.
                SAM.NotesWidget.MarkAsModified();
            }
            var dx = event.offsetX - this.LastMouse[0];
            var dy = event.offsetY - this.LastMouse[1];
            this.LastMouse = [event.offsetX, event.offsetY];

            // TODO: Get the Mouse Deltas out of the layer.
            this.Text.Anchor[0] -= dx; 
            this.Text.Anchor[1] -= dy;
            this.UpdateArrow();
            this.PlacePopup();
            this.Layer.EventuallyDraw();
            if (SAM.NotesWidget) { SAM.NotesWidget.MarkAsModified(); } // Hack
            return false;
        }
        // We do not want to deactivate the widget while the properties dialog is showing.
        if (this.State != PROPERTIES_DIALOG) {
            return this.CheckActive(event);
        }
        return true;
    }

    TextWidget.prototype.HandleTouchPan = function(event, viewer) {
        // We should probably have a handle touch start too.
        // Touch start calls CheckActive() ...
        if (this.State == ACTIVE) {
            this.State = DRAG;
        } else if (this.State == ACTIVE_TEXT) {
            this.State = DRAG_TEXT;
        }

        // TODO: Get rid of viewer dependency
        viewer.MouseDeltaX = viewer.MouseX - viewer.LastMouseX;
        viewer.MouseDeltaY = viewer.MouseY - viewer.LastMouseY;
        this.HandleMouseMove(event);
        return false;
    }

    TextWidget.prototype.HandleTouchEnd = function(event) {
        this.State = ACTIVE;
        this.SetActive(false);
        return false;
    }

    TextWidget.prototype.CheckActive = function(event) {
        var tMouse = this.ScreenPixelToTextPixelPoint(event.offsetX, event.offsetY);

        // First check anchor
        // then check to see if the point is no the bounds of the text.

        if (this.Arrow.Visibility && this.Arrow.PointInShape(tMouse[0]-this.Text.Anchor[0], tMouse[1]-this.Text.Anchor[1])) {
            // Doulbe hack. // Does not get highlighted because widget already active.
            this.Arrow.Active = true;
            this.Layer.EventuallyDraw();
            this.SetActive(true, ACTIVE);
            return true;
        }
        if (this.Text.Visibility) {
            // Only check the text if it is visible.
            if (tMouse[0] > this.Text.PixelBounds[0] && tMouse[0] < this.Text.PixelBounds[1] &&
                tMouse[1] > this.Text.PixelBounds[2] && tMouse[1] < this.Text.PixelBounds[3]) {
                this.SetActive(true, ACTIVE_TEXT);
                return true;
            }
        }

        this.SetActive(false);
        return false;
    }

    TextWidget.prototype.GetActive = function() {
        if (this.State == ACTIVE || this.State == PROPERTIES_DIALOG) {
            return true;
        }
        return false;
    }

    TextWidget.prototype.Deactivate = function() {
        this.Popup.StartHideTimer();
        this.State = WAITING;
        this.Text.Active = false;
        this.Arrow.Active = false;
        this.Layer.DeactivateWidget(this);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    }

    TextWidget.prototype.SetActive = function(flag, reason) {
        reason = reason || ACTIVE;
        if ( ! flag) {
            reason = WAITING;
        }

        if (reason == this.State) {
            return;
        }

        this.State = reason;

        if (reason == ACTIVE) {
            this.Text.Active = false;
            this.Arrow.Active = true;
            this.Layer.ActivateWidget(this);
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        } else if (reason == ACTIVE_TEXT) {
            this.Text.Active = true;
            this.Arrow.Active = false;
            this.Layer.ActivateWidget(this);
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        } else if (reason == WAITING) {
            this.Deactivate();
        }
    }

    //This also shows the popup if it is not visible already.
    TextWidget.prototype.PlacePopup = function () {
        var x = this.Text.Position[0];
        var y = this.Text.Position[1];
        var pt = this.Layer.GetCamera().ConvertPointWorldToViewer(x, y);

        pt[0] += (this.Text.PixelBounds[1] - this.Text.Anchor[0]);
        pt[1] -= (this.Text.Anchor[1] + 10);

        this.Popup.Show(pt[0],pt[1]);
    }

    // Can we bind the dialog apply callback to an objects method?
    TextWidget.prototype.ShowPropertiesDialog = function () {
        this.Popup.Hide();
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Text.Color));
        this.Dialog.FontInput.val(this.Text.Size.toFixed(0));
        this.Dialog.BackgroundInput.prop('checked', this.Text.BackgroundFlag);
        this.Dialog.TextInput.val(this.Text.String);
        this.Dialog.VisibilityModeInputs[this.VisibilityMode].attr("checked", true);

        this.State = PROPERTIES_DIALOG;

        this.Dialog.Show(true);
        this.Dialog.TextInput.focus();
    }

    TextWidget.prototype.DialogApplyCallback = function () {
        this.SetActive(false);
        this.Popup.Hide();
        this.ApplyLineBreaks();

        var string = this.Dialog.TextInput.val();
        // remove any trailing white space.
        string = string.trim();
        if (string == "") {
            alert("Empty String");
            return;
        }

        var hexcolor = SAM.ConvertColorToHex(this.Dialog.ColorInput.val());
        var fontSize = this.Dialog.FontInput.val();
        this.Text.String = string;
        this.Text.Size = parseFloat(fontSize);
        this.Text.UpdateBuffers();

        if(this.Dialog.VisibilityModeInputs[0].prop("checked")){
            this.SetVisibilityMode(0);
        } else if(this.Dialog.VisibilityModeInputs[1].prop("checked")){
            this.SetVisibilityMode(1);
        } else {
            this.SetVisibilityMode(2);
        }
        var backgroundFlag = this.Dialog.BackgroundInput.prop("checked");

        this.Text.SetColor(hexcolor);
        this.Arrow.SetFillColor(hexcolor);
        this.Arrow.ChooseOutlineColor();

        this.Text.BackgroundFlag = backgroundFlag;

        localStorage.TextWidgetDefaults = JSON.stringify(
            {Color         : hexcolor,
             FontSize      : this.Text.Size,
             VisibilityMode: this.VisibilityMode,
             BackgroundFlag: backgroundFlag});

        RecordState();

        this.Layer.EventuallyDraw();
        if (SAM.NotesWidget) { SAM.NotesWidget.MarkAsModified(); } // Hack
    }

    //Function to apply line breaks to textarea text.
    TextWidget.prototype.ApplyLineBreaks = function() {
        var oTextarea = this.Dialog.TextInput[0];

        /*
          if (oTextarea.wrap) {
          oTextarea.setAttribute("wrap", "off");
          } else {
          oTextarea.setAttribute("wrap", "off");
          var newArea = oTextarea.cloneNode(true);
          newArea.value = oTextarea.value;
          oTextarea.parentNode.replaceChild(newArea, oTextarea);
          oTextarea = newArea;
          }
        */

        oTextarea.setAttribute("wrap", "off");
        var strRawValue = oTextarea.value;
        oTextarea.value = "";
        var nEmptyWidth = oTextarea.scrollWidth;
        var nLastWrappingIndex = -1;
        for (var i = 0; i < strRawValue.length; i++) {
            var curChar = strRawValue.charAt(i);
            if (curChar == ' ' || curChar == '-' || curChar == '+')
                nLastWrappingIndex = i;
            oTextarea.value += curChar;
            if (oTextarea.scrollWidth > nEmptyWidth) {
                var buffer = "";
                if (nLastWrappingIndex >= 0) {
                    for (var j = nLastWrappingIndex + 1; j < i; j++)
                        buffer += strRawValue.charAt(j);
                    nLastWrappingIndex = -1;
                }
                buffer += curChar;
                oTextarea.value = oTextarea.value.substr(0, oTextarea.value.length - buffer.length);
                oTextarea.value += "\n" + buffer;
            }
        }
        oTextarea.setAttribute("wrap", "");
    }


    SAM.TextWidget = TextWidget;

})();



// Polyline. one line witn multiple segments.

(function () {
    "use strict";

    function Polyline() {
        SAM.Shape.call(this);
        this.Origin = [0.0,0.0]; // Center in world coordinates.
        this.Points = [];
        this.Closed = false;
        this.Bounds = [0,-1,0,-1];
    };
    Polyline.prototype = new SAM.Shape;


    //Polyline.prototype.destructor=function() {
        // Get rid of the buffers?
    //}

    Polyline.prototype.SetLineWidth = function(lineWidth) {
        this.LineWidth = lineWidth;
    }

    Polyline.prototype.GetLineWidth = function() {
        return this.LineWidth;
    }

    Polyline.prototype.GetEdgeLength = function(edgeIdx) {
        if (edgeIdx < 0 || edgeIdx > this.Points.length-2) {
            return 0;
        }
        var dx = this.Points[edgeIdx+1][0] - this.Points[edgeIdx][0];
        var dy = this.Points[edgeIdx+1][1] - this.Points[edgeIdx][1];

        return Math.sqrt(dx*dx + dy*dy);
    }

    Polyline.prototype.GetNumberOfPoints = function() {
        return this.Points.length;
    }

    // Internal bounds will ignore origin and orientation.
    Polyline.prototype.GetBounds = function () {
        var bounds = this.Bounds.slice(0);
        bounds[0] += this.Origin[0];
        bounds[1] += this.Origin[0];
        bounds[2] += this.Origin[1];
        bounds[3] += this.Origin[1];
        return bounds;
    }

    // Returns 0 if is does not overlap at all.
    // Returns 1 if part of the section is in the bounds.
    // Returns 2 if all of the section is in the bounds.
    Polyline.prototype.ContainedInBounds = function(bds) {
        // Need to get world bounds.
        var myBds = this.GetBounds();

        // Polyline does not cache bounds, so just look to the points.
        if (bds[1] < myBds[0] || bds[0] > myBds[1] ||
            bds[3] < myBds[2] || bds[2] > myBds[3]) {
            return 0;
        }
        if (bds[1] >= myBds[0] && bds[0] <= myBds[1] &&
            bds[3] >= myBds[2] && bds[2] <= myBds[3]) {
            return 2;
        }
        return 1;
    }

    Polyline.prototype.SetOrigin = function(origin) {
        this.Origin = origin.slice(0);
    }

    // Adds origin to points and sets origin to 0.
    Polyline.prototype.ResetOrigin = function() {
        for (var i = 0; i < this.Points.length; ++i) {
            var pt = this.Points[i];
            pt[0] += this.Origin[0];
            pt[1] += this.Origin[1];
        }
        this.Origin[0] = 0;
        this.Origin[1] = 0;
        this.UpdateBuffers();
    }


    // Returns -1 if the point is not on a vertex.
    // Returns the index of the vertex is the point is within dist of a the
    // vertex.
    Polyline.prototype.PointOnVertex = function(pt, dist) {
        dist = dist * dist;
        for (var i = 0; i < this.Points.length; ++i) {
            var dx = this.Points[i][0] - pt[0];
            var dy = this.Points[i][1] - pt[1];
            if (dx*dx + dy*dy < dist) {
                return i;
            }
        }
        return -1;
    }

    // Returns undefined if the point is not on the shape.
    // Otherwise returns the indexes of the segment touched [i0, i1, k].
    Polyline.prototype.PointOnShape = function(pt, dist) {
        // Make a copy of the point (array).
        pt = pt.slice(0);
        pt[0] -= this.Origin[0];
        pt[1] -= this.Origin[1];
        // NOTE: bounds already includes lineWidth
        if (pt[0]+dist < this.Bounds[0] || pt[0]-dist > this.Bounds[1] ||
            pt[1]+dist < this.Bounds[2] || pt[1]-dist > this.Bounds[3]) {
            return undefined;
        }
        // Check for mouse touching an edge.
        for (var i = 1; i < this.Points.length; ++i) {
            var k = this.IntersectPointLine(pt, this.Points[i-1],
                                            this.Points[i], dist);
            if (k !== undefined) {
                return [i-1,i, k];
            }
        }
        if (this.Closed) {
            var k = this.IntersectPointLine(pt, this.Points[this.Points.length-1],
                                            this.Points[0], dist);
            if (k !== undefined) {
                return [this.Points.length-1, 0, k];
            }
        }
        return undefined;
    }

    // Find a world location of a popup point given a camera.
    Polyline.prototype.FindPopupPoint = function(cam) {
        if (this.Points.length == 0) { return; }
        var roll = cam.Roll;
        var s = Math.sin(roll + (Math.PI*0.25));
        var c = Math.cos(roll + (Math.PI*0.25));
        var bestPt = this.Points[0];
        var bestProjection = (c*bestPt[0])-(s*bestPt[1]);
        for (var i = 1; i < this.Points.length; ++i) {
            var pt = this.Points[i];
            var projection = (c*pt[0])-(s*pt[1]);
            if (projection > bestProjection) {
                bestProjection = projection;
                bestPt = pt;
            }
        }
        bestPt[0] += this.Origin[0];
        bestPt[1] += this.Origin[1];
        return bestPt;
    }

    Polyline.prototype.MergePoints = function (thresh) {
        thresh = thresh * thresh;
        var modified = false;
        for (var i = 1; i < this.Points.length; ++i) {
            var dx = this.Points[i][0] - this.Points[i-1][0];
            var dy = this.Points[i][1] - this.Points[i-1][1];
            if (dx*dx + dy*dy < thresh) {
                // The two points are close. Remove the point.
                this.Points.splice(i,1);
                // Removing elements from the array we are iterating over.
                --i;
                modified = true;
            }
        }
        if (modified) {
            this.UpdateBuffers();
        }
    }

    // The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
    // Pass in the spacing as a hint to get rid of aliasing.
    Polyline.prototype.Decimate = function (spacing) {
        // Keep looping over the line removing points until the line does not change.
        var modified = true;
        while (modified) {
            modified = false;
            var newPoints = [];
            newPoints.push(this.Points[0]);
            // Window of four points.
            var i = 3;
            while (i < this.Points.length) {
                var p0 = this.Points[i];
                var p1 = this.Points[i-1];
                var p2 = this.Points[i-2];
                var p3 = this.Points[i-3];
                // Compute the average of the center two.
                var cx = (p1[0] + p2[0]) * 0.5;
                var cy = (p1[1] + p2[1]) * 0.5;
                // Find the perendicular normal.
                var nx = (p0[1] - p3[1]);
                var ny = -(p0[0] - p3[0]);
                var mag = Math.sqrt(nx*nx + ny*ny);
                nx = nx / mag;
                ny = ny / mag;
                mag = Math.abs(nx*(cx-this.Points[i-3][0]) + ny*(cy-this.Points[i-3][1]));
                // Mag metric does not distinguish between line and a stroke that double backs on itself.
                // Make sure the two point being merged are between the outer points 0 and 3.
                var dir1 = (p0[0]-p1[0])*(p3[0]-p1[0]) + (p0[1]-p1[1])*(p3[1]-p1[1]);
                var dir2 = (p0[0]-p2[0])*(p3[0]-p2[0]) + (p0[1]-p2[1])*(p3[1]-p2[1]);
                if (mag < spacing && dir1 < 0.0 && dir2 < 0.0) {
                    // Replace the two points with their average.
                    newPoints.push([cx, cy]);
                    modified = true;
                    // Skip the next point the window will have one old merged point,
                    // but that is ok because it is just used as reference and not altered.
                    i += 2;
                } else {
                    //  No modification.  Just move the window one.
                    newPoints.push(this.Points[i-2]);
                    ++i;
                }
            }
            // Copy the remaing point / 2 points
            i = i-2;
            while (i < this.Points.length) {
                newPoints.push(this.Points[i]);
                ++i;
            }
            this.Points = newPoints;
        }
        this.UpdateBuffers();
    }

    Polyline.prototype.AddPointToBounds = function(pt, radius) {
        if (pt[0]-radius < this.Bounds[0]) {
            this.Bounds[0] = pt[0]-radius;
        }
        if (pt[0]+radius > this.Bounds[1]) {
            this.Bounds[1] = pt[0]+radius;
        }

        if (pt[1]-radius < this.Bounds[2]) {
            this.Bounds[2] = pt[1]-radius;
        }
        if (pt[1]+radius > this.Bounds[3]) {
            this.Bounds[3] = pt[1]+radius;
        }
    }

    // NOTE: Line thickness is handled by style in canvas.
    // I think the GL version that uses triangles is broken.
    Polyline.prototype.UpdateBuffers = function() {
        var points = this.Points.slice(0);
        if (this.Closed && points.length > 2) {
            points.push(points[0]);
        }
        this.PointBuffer = [];
        var cellData = [];
        var lineCellData = [];
        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        if (this.Points.length == 0) { return; }
        // xMin,xMax, yMin,yMax
        this.Bounds = [points[0][0],points[0][0],points[0][1],points[0][1]];

        if (this.LineWidth == 0 || !GL ) {
            for (var i = 0; i < points.length; ++i) {
                this.PointBuffer.push(points[i][0]);
                this.PointBuffer.push(points[i][1]);
                this.PointBuffer.push(0.0);
                this.AddPointToBounds(points[i], 0);
            }
            // Not used for line width == 0.
            for (var i = 2; i < points.length; ++i) {
                cellData.push(0);
                cellData.push(i-1);
                cellData.push(i);
            }
        } else {
            // Compute a list normals for middle points.
            var edgeNormals = [];
            var mag;
            var x;
            var y;
            var end = points.length-1;
            // Compute the edge normals.
            for (var i = 0; i < end; ++i) {
                x = points[i+1][0] - points[i][0];
                y = points[i+1][1] - points[i][1];
                mag = Math.sqrt(x*x + y*y);
                edgeNormals.push([-y/mag,x/mag]);
            }

            if ( end > 0 ) {
                var half = this.LineWidth / 2.0;
                // 4 corners per point
                var dx = edgeNormals[0][0]*half;
                var dy = edgeNormals[0][1]*half;
                this.PointBuffer.push(points[0][0] - dx);
                this.PointBuffer.push(points[0][1] - dy);
                this.PointBuffer.push(0.0);
                this.PointBuffer.push(points[0][0] + dx);
                this.PointBuffer.push(points[0][1] + dy);
                this.PointBuffer.push(0.0);
                this.AddPointToBounds(points[i], half);
                for (var i = 1; i < end; ++i) {
                    this.PointBuffer.push(points[i][0] - dx);
                    this.PointBuffer.push(points[i][1] - dy);
                    this.PointBuffer.push(0.0);
                    this.PointBuffer.push(points[i][0] + dx);
                    this.PointBuffer.push(points[i][1] + dy);
                    this.PointBuffer.push(0.0);
                    dx = edgeNormals[i][0]*half;
                    dy = edgeNormals[i][1]*half;
                    this.PointBuffer.push(points[i][0] - dx);
                    this.PointBuffer.push(points[i][1] - dy);
                    this.PointBuffer.push(0.0);
                    this.PointBuffer.push(points[i][0] + dx);
                    this.PointBuffer.push(points[i][1] + dy);
                    this.PointBuffer.push(0.0);
                }
                this.PointBuffer.push(points[end][0] - dx);
                this.PointBuffer.push(points[end][1] - dy);
                this.PointBuffer.push(0.0);
                this.PointBuffer.push(points[end][0] + dx);
                this.PointBuffer.push(points[end][1] + dy);
                this.PointBuffer.push(0.0);
            }
            // Generate the triangles for a thick line
            for (var i = 0; i < end; ++i) {
                lineCellData.push(0 + 4*i);
                lineCellData.push(1 + 4*i);
                lineCellData.push(3 + 4*i);
                lineCellData.push(0 + 4*i);
                lineCellData.push(3 + 4*i);
                lineCellData.push(2 + 4*i);
            }

            // Not used.
            for (var i = 2; i < points.length; ++i) {
                cellData.push(0);
                cellData.push((2*i)-1);
                cellData.push(2*i);
            }
        }

        if (GL) {
            this.VertexPositionBuffer = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.PointBuffer), GL.STATIC_DRAW);
            this.VertexPositionBuffer.itemSize = 3;
            this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

            this.CellBuffer = GL.createBuffer();
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), GL.STATIC_DRAW);
            this.CellBuffer.itemSize = 1;
            this.CellBuffer.numItems = cellData.length;

            if (this.LineWidth != 0) {
                this.LineCellBuffer = GL.createBuffer();
                GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.LineCellBuffer);
                GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineCellData), GL.STATIC_DRAW);
                this.LineCellBuffer.itemSize = 1;
                this.LineCellBuffer.numItems = lineCellData.length;
            }
        }
    }


    // GLOBAL To Position the orientatation of the edge.
    var EDGE_COUNT = 0;
    var EDGE_ANGLE = (2*Math.PI) * 0/24;
    var EDGE_OFFSET = 0; // In screen pixels.
    var EDGE_ROOT = "edge";
    var EDGE_DELAY = 200;
    // Saves images centered at spots on the edge.
    // Roll is set to put the edge horizontal.
    // Step is in screen pixel units
    // Count is the starting index for file name generation.
    Polyline.prototype.SampleEdge = function(viewer, dim, step, count, callback) {
        var cam = viewer.GetCamera();
        var scale = cam.GetHeight() / cam.ViewportHeight;
        // Convert the step from screen pixels to world.
        step *= scale;
        var cache = viewer.GetCache();
        var dimensions = [dim,dim];
        // Distance between edge p0 to next sample point.
        var remaining = step/2;
        // Recursive to serialize asynchronous cutouts.
        this.RecursiveSampleEdge(this.Points.length-1,0,remaining,step,count,
                                 cache,dimensions,scale, callback);
    }
    Polyline.prototype.RecursiveSampleEdge = function(i0,i1,remaining,step,count,
                                                      cache,dimensions,scale, callback) {
        var pt0 = this.Points[i0];
        var pt1 = this.Points[i1];
        // Compute the length of the edge.
        var dx = pt1[0]-pt0[0];
        var dy = pt1[1]-pt0[1];
        var length = Math.sqrt(dx*dx +dy*dy);
        // Take steps along the edge (size 'step')
        if (remaining > length) {
            // We passed over this edge. Move to the next edge.
            remaining = remaining - length;
            i0 = i1;
            i1 += 1;
            // Test for terminating condition.
            if (i1 < this.Points.length) {
                this.RecursiveSampleEdge(i0,i1,remaining,step, count,
                                         cache,dimensions,scale, callback);
            } else {
                (callback)();
            }
        } else {
            var self = this;
            // Compute the sample point and tangent on this edge.
            var edgeAngle = -Math.atan2(dy,dx) + EDGE_ANGLE;
            var k = remaining / length;
            var x = pt0[0] + k*(pt1[0]-pt0[0]);
            var y = pt0[1] + k*(pt1[1]-pt0[1]);
            // Normal (should be out if loop is clockwise).
            var nx = -dy;
            var ny = dx;
            var mag = Math.sqrt(nx*nx + ny*ny);
            nx = (nx / mag) * EDGE_OFFSET * scale;
            ny = (ny / mag) * EDGE_OFFSET * scale;

            // Save an image at this sample point.
            GetCutoutImage(cache,dimensions,[x+nx,y+ny],scale,
                           edgeAngle,EDGE_ROOT+count+".png",
                           function() {
                               setTimeout(
                                   function () {
                                       ++count;
                                       EDGE_COUNT = count;
                                       remaining += step;
                                       self.RecursiveSampleEdge(i0,i1,remaining,step,count,
                                                                cache,dimensions,scale,callback);
                                   }, EDGE_DELAY);
                           });
        }
    }


    Polyline.prototype.SetActive = function(flag) {
        this.Active = flag;
    }


    SAM.Polyline = Polyline;

})();
// Two behaviors: 
// 1: Single click and drag causes a vertex to follow the
// mouse. A new vertex is inserted if the click was on an edge.  If a
// vertex is dropped on top of its neighbor, the are merged.
// 2: WHen the widget is first created or double cliccked, it goes into
// drawing mode.  A vertex follows the cursor with no buttons pressed.
// A single click causes another vertex to be added.  Double click ends the
// draing state.

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    var VERTEX_RADIUS = 8;
    var EDGE_RADIUS = 4;

    // These need to be cleaned up.
    // Drawing started with 0 points or drawing restarted.
    var DRAWING = 0;
    // Drawing mode: Mouse is up and the new point is following the mouse.
    var DRAWING_EDGE = 1;
    // Not active.
    var WAITING = 2;
    // Waiting but receiving events.  The circle handle is active.
    var DRAGGING = 3; // Mouse is down and a vertex is following the mouse.
    var ACTIVE = 5;
    // Dialog is active.
    var PROPERTIES_DIALOG = 6;


    function PolylineWidget (layer, newFlag) {
        if (layer === undefined) {
            return;
        }

        // Circle is to show an active vertex.
        this.Circle = new SAM.Circle();
        this.Polyline = new SAM.Polyline();

        this.InitializeDialog();

        // Get default properties.
        this.LineWidth = 10.0;
        this.Polyline.Closed = false;
        if (localStorage.PolylineWidgetDefaults) {
            var defaults = JSON.parse(localStorage.PolylineWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
            }
            // Remebering closed flag seems arbitrary.  User can complete
            // the loop if they want it closed. Leaving it open allow
            // restart too.
            //if (defaults.ClosedLoop !== undefined) {
            //    this.Polyline.Closed = defaults.ClosedLoop;
            //}
            if (defaults.LineWidth) {
                this.LineWidth = defaults.LineWidth;
                this.Dialog.LineWidthInput.val(this.LineWidth);
            }
        }

        this.Circle.FillColor = [1.0, 1.0, 0.2];
        this.Circle.OutlineColor = [0.0,0.0,0.0];
        this.Circle.FixedSize = false;
        this.Circle.ZOffset = -0.05;

        this.Polyline.OutlineColor = [0.0, 0.0, 0.0];
        this.Polyline.SetOutlineColor(this.Dialog.ColorInput.val());
        this.Polyline.FixedSize = false;

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        var cam = layer.GetCamera();

        this.Layer.AddWidget(this);

        // Set line thickness using layer. (5 pixels).
        // The Line width of the shape switches to 0 (single line)
        // when the actual line with is too thin.
        this.Polyline.LineWidth =this.LineWidth;
        this.Circle.Radius = this.LineWidth;
        this.Circle.UpdateBuffers();

        // ActiveVertex and Edge are for placing the circle handle.
        this.ActiveVertex = -1;
        this.ActiveEdge = undefined;
        // Which vertec is being dragged.
        this.DrawingVertex = -1;

        if (newFlag) {
            this.State = DRAWING;
            this.SetCursorToDrawing();
            //this.Polyline.Active = true;
            this.Layer.ActivateWidget(this);
        } else {
            this.State = WAITING;
            this.Circle.Visibility = false;
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();

        // Set to be the width of a pixel.
        this.MinLine = 1.0;

        this.Layer.EventuallyDraw(false);
    }


    PolylineWidget.prototype.InitializeDialog = function() {
        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a lasso.
        this.Dialog.Title.text('Lasso Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .css({'display':'table-cell'});

        // closed check
        this.Dialog.ClosedDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ClosedLabel =
            $('<div>')
            .appendTo(this.Dialog.ClosedDiv)
            .text("Closed:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ClosedInput =
            $('<input type="checkbox">')
            .appendTo(this.Dialog.ClosedDiv)
            .attr('checked', 'false')
            .css({'display': 'table-cell'});

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        // Length
        this.Dialog.LengthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.LengthLabel =
            $('<div>')
            .appendTo(this.Dialog.LengthDiv)
            .text("Length:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.Length =
            $('<div>')
            .appendTo(this.Dialog.LengthDiv)
            .css({'display':'table-cell'});

        // Area
        this.Dialog.AreaDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.AreaLabel =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .text("Area:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.Area =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .css({'display':'table-cell'});
    }

    PolylineWidget.prototype.Draw = function(view) {
        // When the line is too thin, we can see nothing.
        // Change it to line drawing.
        var cam = this.Layer.GetCamera();
        this.MinLine = cam.GetSpacing();
        if (this.LineWidth < this.MinLine) {
            // Too thin. Use a single line.
            this.Polyline.LineWidth = 0;
        } else {
            this.Polyline.LineWidth = this.LineWidth;
        }

        this.Polyline.Draw(view);
        this.Circle.Draw(view);
    }

    PolylineWidget.prototype.PasteCallback = function(data, mouseWorldPt) {
        this.Load(data);
        // Place the widget over the mouse.
        // This is more difficult than the circle.  Compute the shift.
        var bounds = this.Polyline.GetBounds();
        if ( ! bounds) {
            console.log("Warining: Pasting empty polyline");
            return;
        }
        var xOffset = mouseWorldPt[0] - (bounds[0]+bounds[1])/2;
        var yOffset = mouseWorldPt[1] - (bounds[2]+bounds[3])/2;
        for (var i = 0; i < this.Polyline.GetNumberOfPoints(); ++i) {
            this.Polyline.Points[i][0] += xOffset;
            this.Polyline.Points[i][1] += yOffset;
        }
        this.Polyline.UpdateBuffers();
        if (SAM.NotesWidget) {SAM.NotesWidget.MarkAsModified();} // hack

        this.Layer.EventuallyDraw(true);
    }

    PolylineWidget.prototype.Serialize = function() {
        if(this.Polyline === undefined){ return null; }
        var obj = new Object();
        obj.type = "polyline";
        obj.outlinecolor = this.Polyline.OutlineColor;
        obj.linewidth = this.LineWidth;
        // Copy the points to avoid array reference bug.
        obj.points = [];
        for (var i = 0; i < this.Polyline.GetNumberOfPoints(); ++i) {
            obj.points.push([this.Polyline.Points[i][0], this.Polyline.Points[i][1]]);
        }

        obj.creation_camera = this.CreationCamera;
        obj.closedloop = this.Polyline.Closed;

        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    // Object already json decoded.
    PolylineWidget.prototype.Load = function(obj) {
        this.Polyline.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
        this.Polyline.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
        this.Polyline.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
        this.LineWidth = parseFloat(obj.linewidth);
        this.Polyline.LineWidth = this.LineWidth;
        this.Polyline.Points = [];
        for(var n=0; n < obj.points.length; n++){
            this.Polyline.Points[n] = [parseFloat(obj.points[n][0]),
                                    parseFloat(obj.points[n][1])];
        }
        this.Polyline.Closed = obj.closedloop;
        this.Polyline.UpdateBuffers();

        // How zoomed in was the view when the annotation was created.
        if (obj.view_height !== undefined) {
            this.CreationCamera = obj.creation_camera;
        }
    }

    PolylineWidget.prototype.CityBlockDistance = function(p0, p1) {
        return Math.abs(p1[0]-p0[0]) + Math.abs(p1[1]-p0[1]);
    }

    PolylineWidget.prototype.HandleKeyDown = function(event) {
        // Copy
        if (event.keyCode == 67 && event.ctrlKey) {
            // control-c for copy
            // The extra identifier is not needed for widgets, but will be
            // needed if we have some other object on the clipboard.
            var clip = {Type:"PolylineWidget", Data: this.Serialize()};
            localStorage.ClipBoard = JSON.stringify(clip);
            return false;
        }

        // escape key (or space or enter) to turn off drawing
        if (event.keyCode == 27 || event.keyCode == 32 || event.keyCode == 13) {
            // Last resort.  ESC key always deactivates the widget.
            // Deactivate.
            this.Layer.DeactivateWidget(this);
            if (SAM.NotesWidget) {SAM.NotesWidget.MarkAsModified();} // hack
            RecordState();
            return false;
        }

        return true;
    }
    PolylineWidget.prototype.HandleDoubleClick = function(event) {
        if (this.State == DRAWING || this.State == DRAWING_EDGE) {
            this.Polyline.MergePoints(this.Circle.Radius);
            this.Layer.DeactivateWidget(this);
            return false;
        }
        // Handle: Restart drawing mode. Any point on the line can be used.
        if (this.State == ACTIVE) {
            var x = event.offsetX;
            var y = event.offsetY;
            var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
            // Active => Double click starts drawing again.
            if (this.ActiveVertex != -1) {
                this.Polyline.Points[this.ActiveVertex] = pt;
                this.DrawingVertex = this.ActiveVertex;
                this.ActiveVertex = -1;
            } else if (this.ActiveEdge) {
                // Insert a new point in the edge.
                // mouse down gets called before this and does this.
                // TODO: Fix it so mouse down/up do not get called on
                // double click.
                this.Polyline.Points.splice(this.ActiveEdge[1],0,pt);
                this.DrawingVertex = this.ActiveEdge[1];
                this.ActiveEdge = undefined;
            } else {
                // Sanity check:
                console.log("No vertex or edge is active.");
                return false;
            }
            this.Polyline.UpdateBuffers();
            this.SetCursorToDrawing();
            // Transition to drawing edge when we know which way the user
            // is dragging.
            this.State = DRAWING;
            this.Layer.EventuallyDraw(false);
            return false;
        }
    }

    // Because of double click:
    // Mouse should do nothing. Mouse move and mouse up should cause all
    // the changes.
    PolylineWidget.prototype.HandleMouseDown = function(event) {

        // Only chnage handle properties.  Nothing permanent changes with mousedown.
        if (event.which == 1 && this.State == ACTIVE) {
            //User has started dragging a point with the mouse down.
            this.Popup.Hide();
            // Change the circle color to the line color when dragging.
            this.Circle.FillColor = this.Polyline.OutlineColor;
            this.Circle.Active = false;
        }

        return false;
    }

    // Returns false when it is finished doing its work.
    PolylineWidget.prototype.HandleMouseUp = function(event) {

        // Shop dialog with right click.  I could have a menu appear.
        if (event.which == 3) {
            // Right mouse was pressed.
            // Pop up the properties dialog.
            this.State = PROPERTIES_DIALOG;
            this.ShowPropertiesDialog();
            return false;
        }

        if (event.which != 1) {
            return false;
        }

        if (this.State == ACTIVE) {
            // Dragging a vertex just ended.
            // Handle merging points when user drags a vertex onto another.
            this.Polyline.MergePoints(this.Circle.Radius);
            // TODO: Manage modidfied more consistently.
            if (SAM.NotesWidget) {SAM.NotesWidget.MarkAsModified();} // hack
            RecordState();
            return false;
        }

        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);

        if (this.State == DRAWING) {
            // handle the case where we restarted drawing and clicked again
            // before moving the mouse. (triple click).  Do nothing.
            if (this.Polyline.GetNumberOfPoints() > 0) {
                return false;
            }
            // First point after creation. We delayed adding the first
            // point so add it now.
            this.Polyline.Points.push(pt);
            // Not really necessary because DRAWING_EDGE case resets it.
            this.DrawingVertex = this.Polyline.GetNumberOfPoints() -1;
            this.State = DRAWING_EDGE;
        }
        if (this.State == DRAWING_EDGE) {
            // Check to see if the loop was closed.
            if (this.Polyline.GetNumberOfPoints() > 2 && this.ActiveVertex == 0) {
                // The user clicked on the first vertex. End the line.
                // Remove the temporary point at end used for drawing.
                this.Polyline.Points.pop();
                this.Polyline.Closed = true;
                this.Layer.DeactivateWidget(this);
                RecordState();
                return false;
            }
            // Insert another point to drag around.
            this.DrawingVertex += 1;
            this.Polyline.Points.splice(this.DrawingVertex,0,pt);
            this.Polyline.UpdateBuffers();
            this.Layer.EventuallyDraw(true);
            return false;
        }
        return false;
    }


    //  Preconditions: State == ACTIVE, Mouse 1 is down.
    // ActiveVertex != 1 or ActiveEdge == [p0,p1,k]
    PolylineWidget.prototype.HandleDrag = function(pt) {
        if (this.ActiveEdge) {
            // User is dragging an edge point that has not been
            // created yet.
            var pt0 = this.Polyline.Points[this.ActiveEdge[0]];
            var pt1 = this.Polyline.Points[this.ActiveEdge[1]];
            var x = pt0[0] + this.ActiveEdge[2]*(pt1[0]-pt0[0]);
            var y = pt0[1] + this.ActiveEdge[2]*(pt1[1]-pt0[1]);
            this.Polyline.Points.splice(this.ActiveEdge[1],0,[x,y]);
            this.ActiveVertex = this.ActiveEdge[1];
            this.ActiveEdge = undefined;
            this.HighlightVertex(this.ActiveVertex);
            // When dragging, circle is the same color as the line.
            this.Circle.Active = false;
        }
        if ( this.ActiveVertex == -1) {
            // Sanity check.
            return false;
        }
        // If a vertex is dragged onto its neighbor, indicate that
        // the vertexes will be merged. Change the color of the
        // circle to active as an indicator.
        this.Circle.Active = false;
        this.Polyline.Points[this.ActiveVertex] = pt;
        if (this.ActiveVertex > 0 &&
            this.Polyline.GetEdgeLength(this.ActiveVertex-1) < this.Circle.Radius) {
            this.Circle.Active = true;
            // Snap to the neighbor. Deep copy the point
            pt = this.Polyline.Points[this.ActiveVertex-1].slice(0);
        }
        if (this.ActiveVertex < this.Polyline.GetNumberOfPoints()-1 &&
            this.Polyline.GetEdgeLength(this.ActiveVertex) < this.Circle.Radius) {
            this.Circle.Active = true;
            // Snap to the neighbor. Deep copy the point
            pt = this.Polyline.Points[this.ActiveVertex+1].slice(0);
        }
        // Move the vertex with the mouse.
        this.Polyline.Points[this.ActiveVertex] = pt;
        // Move the hightlight circle with the vertex.
        this.Circle.Origin = pt;
        this.Polyline.UpdateBuffers();

        // TODO: Fix this hack.
        if (SAM.NotesWidget) {SAM.NotesWidget.MarkAsModified();} // hack
        this.Layer.EventuallyDraw(true);
    }


    // precondition : State == DRAWING
    // postcondition: State == DRAWING_EDGE
    // Handle a bunch of cases.  First created, restart at ends or middle.
    PolylineWidget.prototype.StartDrawing = function(pt) {
        // If the widget was just created do nothing.
        if (this.Polyline.GetNumberOfPoints() == 0) {
            return;
        }
        // If we are the begining, Reverse the points.
        if (this.DrawingVertex == 0) {
            this.Polyline.Points.reverse();
            this.DrawingVertex = this.Polyline.GetNumberOfPoints()-1;
        }
        // If we are at the end.  Add a point.
        if (this.DrawingVertex == this.Polyline.GetNumberOfPoints() -1) {
            this.Polyline.Points.push(pt);
            this.DrawingVertex += 1;
            this.State = DRAWING_EDGE;
            return;
        }
        // If we are in the middle. Choose between the two edges.
        var pt0 = this.Polyline.Points[this.DrawingVertex-1];
        var pt1 = this.Polyline.Points[this.DrawingVertex];
        var pt2 = this.Polyline.Points[this.DrawingVertex+1];
        // Movement vector
        var dx = pt[0] - pt1[0];
        var dy = pt[1] - pt1[1];
        // This is sort of a pain. Normalize the edges.
        var e0 = [pt0[0]-pt1[0], pt0[1]-pt1[1]];
        var dist0 = Math.sqrt(e0[0]*e0[0] + e0[1]*e0[1]);
        dist0 = (dx*e0[0]+dy*e0[1]) / dist0;
        var e1 = [pt2[0]-pt1[0], pt2[1]-pt1[1]];
        var dist1 = Math.sqrt(e1[0]*e1[0] + e1[1]*e1[1]);
        dist1= (dx*e1[0]+dy*e1[1]) / dist0;
        // if the user is draggin backward, reverse the points.
        if (dist0 > dist1) {
            this.Polyline.Points.reverse();
            this.DrawingVertex = this.Polyline.GetNumberOfPoints() - this.DrawingVertex - 1;
        }
        // Insert a point to continue drawing.
        this.DrawingVertex += 1;
        this.Polyline.Points.splice(this.DrawingVertex,0,pt);
        this.State = DRAWING_EDGE;
        return false;
    }

    PolylineWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);

        if (this.State == DRAWING) {
            this.StartDrawing(pt);
            return false;
        }
        if (this.State == DRAWING_EDGE) {
            // Move the active point to follor the cursor.
            this.Polyline.Points[this.DrawingVertex] = pt;
            this.Polyline.UpdateBuffers();

            // This higlights the first vertex when a loop is possible.
            var idx = this.Polyline.PointOnVertex(pt, this.Circle.Radius);
            if (this.DrawingVertex == this.Polyline.GetNumberOfPoints()-1 && idx == 0) {
                // Highlight first vertex to indicate potential loop closure.
                this.HighlightVertex(0);
            } else {
                this.HighlightVertex(-1);
            }
            return false;
        }

        if (this.State == ACTIVE) {
            if (event.which == 0) {
                // Turn off the active vertex if the mouse moves away.
                if ( ! this.CheckActive(event)) {
                    this.Layer.DeactivateWidget(this);
                } else {
                    this.UpdateActiveCircle();
                }
                return false;
            }
            if (this.State == ACTIVE && event.which == 1) {
                // We are in the middle of dragging a vertex (not in
                // drawing mode). Leave the circle highlighted.
                // Use ActiveVertex instead of DrawingVertex which is used
                // for drawing mode.
                this.HandleDrag(pt);
            }
        }
    }


    // Just returns true and false.  It saves either ActiveVertex or
    // ActiveEdge if true. Otherwise, it has no side effects.
    PolylineWidget.prototype.CheckActive = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
        var dist;

        this.ActiveEdge = undefined;

        // Check for mouse touching a vertex circle.
        dist = VERTEX_RADIUS / this.Layer.GetPixelsPerUnit();
        dist = Math.max(dist, this.Polyline.GetLineWidth());
        this.ActiveVertex = this.Polyline.PointOnVertex(pt, dist);

        if (this.State == DRAWING_EDGE) { 
            // TODO:  The same logic is in mouse move.  Decide which to remove.
            // Only allow the first vertex to be active (closing the loop).
            if (this.Polyline.GetNumberOfPoints() < 2 ||
                this.ActiveVertex != 0) {
                this.ActiveVertex = -1;
                return false;
            }
            return true;
        }

        if (this.ActiveVertex == -1) {
            // Tolerance: 5 screen pixels.
            dist = EDGE_RADIUS / this.Layer.GetPixelsPerUnit();
            dist = Math.max(dist, this.Polyline.GetLineWidth()/2);
            this.ActiveEdge = this.Polyline.PointOnShape(pt, dist);
            if ( ! this.ActiveEdge) {
                return false;
            }
        }
        return true;
    }

    // This does not handle the case where we want to highlight an edge
    // point that has not been created yet.
    PolylineWidget.prototype.HighlightVertex = function(vertexIdx) {
        if (vertexIdx < 0 || vertexIdx >= this.Polyline.GetNumberOfPoints()) {
            this.Circle.Visibility = false;
        } else {
            this.Circle.Visibility = true;
            this.Circle.Active = true;
            this.Circle.Radius = VERTEX_RADIUS / this.Layer.GetPixelsPerUnit();
            this.CircleRadius = Math.max(this.CircleRadius,
                                         this.Polyline.GetLineWidth() * 1.5);
            this.Circle.UpdateBuffers();
            this.Circle.Origin = this.Polyline.Points[vertexIdx];
        }
        this.ActiveVertex = vertexIdx;
        this.Layer.EventuallyDraw(true);
    }

    // Use ActiveVertex and ActiveEdge iVars to place and size circle.
    PolylineWidget.prototype.UpdateActiveCircle = function() {
        if (this.ActiveVertex != -1) {
            this.HighlightVertex(this.ActiveVertex);
            return;
        } else if (this.ActiveEdge) {
            this.Circle.Visibility = true;
            this.Circle.Active = true;
            this.Circle.Radius = EDGE_RADIUS / this.Layer.GetPixelsPerUnit();
            this.CircleRadius = Math.max(this.CircleRadius,
                                         this.Polyline.GetLineWidth());
            // Find the exact point on the edge (projection of
            // cursor on the edge).
            var pt0 = this.Polyline.Points[this.ActiveEdge[0]];
            var pt1 = this.Polyline.Points[this.ActiveEdge[1]];
            var x = pt0[0] + this.ActiveEdge[2]*(pt1[0]-pt0[0]);
            var y = pt0[1] + this.ActiveEdge[2]*(pt1[1]-pt0[1]);
            this.Circle.Origin = [x,y,0];
            this.Circle.UpdateBuffers();
        } else {
            // Not active.
            this.Circle.Visibility = false;
            // We never hightlight the whold polyline now.
            //this.Polyline.Active = false;
        }
        this.Layer.EventuallyDraw(false);
    }

    // Multiple active states. Active state is a bit confusing.
    // Only one state (WAITING) does not receive events from the layer.
    PolylineWidget.prototype.GetActive = function() {
        if (this.State == WAITING) {
            return false;
        }
        return true;
    }

    // Active means that the widget is receiving events.  It is
    // "hot" and waiting to do something.  
    // However, it is not active when in drawing mode.
    // This draws a circle at the active spot.
    // Vertexes are active for click and drag or double click into drawing
    // mode. Edges are active to insert a new vertex and drag or double
    // click to insert a new vertex and go into drawing mode.
    PolylineWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) {
            // Nothing has changed.  Do nothing.
            return;
        }

        if (flag) {
            this.State = ACTIVE;
            this.UpdateActiveCircle();
            this.PlacePopup();
        } else {
            this.Popup.StartHideTimer();
            this.State = WAITING;
            this.DrawingVertex = -1;
            this.ActiveVertex = -1;
            this.ActiveEdge = undefined;
            this.Circle.Visibility = false;
            if (this.DeactivateCallback) {
                this.DeactivateCallback();
            }
            // Remove invisible lines (with 0 or 1 points).
            if (this.Polyline.GetNumberOfPoints() < 2) {
                if (this.Layer) {
                    this.Layer.RemoveWidget(this);
                }
            }
        }

        this.Layer.EventuallyDraw(false);
    }

    PolylineWidget.prototype.SetCursorToDrawing = function() {
        this.Popup.Hide();
        this.Layer.GetCanvasDiv().css(
            {'cursor':'url('+SAM.ImagePathUrl+'dotCursor8.png) 4 4,crosshair'});
        this.Layer.EventuallyDraw();
    }


    //This also shows the popup if it is not visible already.
    PolylineWidget.prototype.PlacePopup = function () {
        // The popup gets in the way when firt creating the line.
        if (this.State == DRAWING_EDGE ||
            this.State == DRAWING) {
            return;
        }

        var pt = this.Polyline.FindPopupPoint(this.Layer.GetCamera());
        pt = this.Layer.GetCamera().ConvertPointWorldToViewer(pt[0], pt[1]);

        pt[0] += 20;
        pt[1] -= 10;

        this.Popup.Show(pt[0],pt[1]);
    }

    // Can we bind the dialog apply callback to an objects method?
    var DIALOG_SELF;
    PolylineWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Polyline.OutlineColor));
        this.Dialog.ClosedInput.prop('checked', this.Polyline.Closed);
        this.Dialog.LineWidthInput.val((this.Polyline.LineWidth).toFixed(2));

        var length = this.ComputeLength() * 0.25; // microns per pixel.
        var lengthString = "";
        if (this.Polyline.FixedSize) {
            lengthString += length.toFixed(2);
            lengthString += " px";
        } else {
            if (length > 1000) {
                lengthString += (length/1000).toFixed(2) + " mm";
            } else {
                // Latin-1 00B5 is micro sign
                lengthString += length.toFixed(2) + " \xB5m";
            }
        }
        this.Dialog.Length.text(lengthString);

        if (this.Polyline.Closed) {
            this.Dialog.AreaDiv.show();
            var area = this.ComputeArea() * 0.25 * 0.25;
            var areaString = "";
            if (this.Polyline.FixedSize) {
                areaString += area.toFixed(2);
                areaString += " pixels^2";
            } else {
                if (area > 1000000) {
                    areaString += (area/1000000).toFixed(2) + " mm^2";
                } else {
                    // Latin-1 00B5 is micro sign
                    areaString += area.toFixed(2) + " \xB5m^2";
                }
            }
            this.Dialog.Area.text(areaString);
        } else {
            this.Dialog.AreaDiv.hide();
        }
        this.Dialog.Show(true);
    }

    PolylineWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.Polyline.SetOutlineColor(hexcolor);
        this.Polyline.Closed = this.Dialog.ClosedInput.prop("checked");

        // Cannot use the shap line width because it is set to zero (single pixel)
        // it the dialog value is too thin.
        this.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Polyline.UpdateBuffers();
        this.SetActive(false);
        RecordState();
        this.Layer.EventuallyDraw(false);

        localStorage.PolylineWidgetDefaults = JSON.stringify(
            {Color: hexcolor,
             ClosedLoop: this.Polyline.Closed,
             LineWidth: this.LineWidth});
        if (SAM.NotesWidget) {SAM.NotesWidget.MarkAsModified();} // hack
    }

    // Note, self intersection can cause unexpected areas.
    // i.e looping around a point twice ...
    PolylineWidget.prototype.ComputeArea = function() {
        if (this.Polyline.GetNumberOfPoints() == 0) {
            return 0.0;
        }

        // Compute the center. It should be more numerically stable.
        // I could just choose the first point as the origin.
        var cx = 0;
        var cy = 0;
        for (var j = 0; j < this.Polyline.GetNumberOfPoints(); ++j) {
            cx += this.Polyline.Points[j][0];
            cy += this.Polyline.Points[j][1];
        }
        cx = cx / this.Polyline.GetNumberOfPoints();
        cy = cy / this.Polyline.GetNumberOfPoints();

        var area = 0.0;
        // Iterate over triangles adding the area of each
        var last = this.Polyline.GetNumberOfPoints()-1;
        var vx1 = this.Polyline.Points[last][0] - cx;
        var vy1 = this.Polyline.Points[last][1] - cy;
        // First and last point form another triangle (they are not the same).
        for (var j = 0; j < this.Polyline.GetNumberOfPoints(); ++j) {
            // Area of triangle is 1/2 magnitude of cross product.
            var vx2 = vx1;
            var vy2 = vy1;
            vx1 = this.Polyline.Points[j][0] - cx;
            vy1 = this.Polyline.Points[j][1] - cy;
            area += (vx1*vy2) - (vx2*vy1);
        }

        // Handle both left hand loops and right hand loops.
        if (area < 0) {
            area = -area;
        }
        return area;
    }

    // Note, self intersection can cause unexpected areas.
    // i.e looping around a point twice ...
    PolylineWidget.prototype.ComputeLength = function() {
        if (this.Polyline.GetNumberOfPoints() < 2) {
            return 0.0;
        }

        var length = 0;
        var x0 = this.Polyline.Points[0][0];
        var y0 = this.Polyline.Points[0][1];
        for (var j = 1; j < this.Polyline.GetNumberOfPoints(); ++j) {
            var x1 = this.Polyline.Points[j][0];
            var y1 = this.Polyline.Points[j][1];
            var dx = x1-x0;
            var dy = y1-y0;
            x0 = x1;
            y0 = y1;
            length += Math.sqrt(dx*dx + dy*dy);
        }

        return length;
    }

    // This differentiates the inside of the polygion from the outside.
    // It is used to sample points in a segmented region.
    // Not actively used (more for experimentation for now).
    PolylineWidget.prototype.PointInside = function(ox,oy) {
        if (this.Polyline.Closed == false) {
            return false;
        }
        var x,y;
        var max = this.Polyline.GetNumberOfPoints() - 1;
        var xPos = 0;
        var xNeg = 0;
        //var yCount = 0;
        var pt0 = this.Polyline.Points[max];
        pt0 = [pt0[0]-ox, pt0[1]-oy];
        for (var idx = 0; idx <= max; ++idx) {
            var pt1 = this.Polyline.Points[idx];
            pt1 = [pt1[0]-ox, pt1[1]-oy];
            var k;
            k = (pt1[1] - pt0[1]);
            if ( k != 0 ) {
                k = -pt0[1] / k;
                if ( k > 0 && k <= 1) {
                    // Edge crosses the axis.  Find the intersection.
                    x = pt0[0] + k*(pt1[0]-pt0[0]);
                    if (x > 0) { xPos += 1; }
                    if (x < 0) { xNeg += 1; }
                }
            }
            pt0 = pt1;
        }

        if ((xPos % 2) && (xNeg % 2)) {
            return true
        }
        return false;
    }

    // TODO: This will not work with Layer.  Move this to the viewer or a
    // helper object.
    // Save images with centers inside the polyline.
    PolylineWidget.prototype.Sample = function(dim, spacing, skip, root, count) {
        var bds = this.Polyline.GetBounds();
        var ctx = this.Layer.Context2d;
        for (var y = bds[2]; y < bds[3]; y += skip) {
            for (var x = bds[0]; x < bds[1]; x += skip) {
                if (this.PointInside(x,y)) {
                    ip = this.Layer.GetCamera().ConvertPointWorldToViewer(x,y);
                    ip[0] = Math.round(ip[0] - dim/2);
                    ip[1] = Math.round(ip[1] - dim/2);
                    var data = ctx.getImageData(ip[0],ip[1],dim,dim);
                    DownloadImageData(data, root+"_"+count+".png");
                    ++count;
                }
            }
        }
    }


    // Save images with centers inside the polyline.
    PolylineWidget.prototype.SampleStack = function(dim, spacing, skip, root, count) {
        var cache = LAYERS[0].GetCache();
        var bds = this.Polyline.GetBounds();
        for (var y = bds[2]; y < bds[3]; y += skip) {
            for (var x = bds[0]; x < bds[1]; x += skip) {
                if (this.PointInside(x,y)) {
                    GetCutoutimage(cache, dim, [x,y], spacing, 0, null,
                                   function (data) {
                                       DownloadImageData(data, root+"_"+count+".png");
                                       ++count;
                                   });
                }
            }
        }
    }

    // Save images with centers inside the polyline.
    PolylineWidget.prototype.DownloadStack = function(x, y, dim, spacing, root) {
        var cache = LAYERS[0].GetCache();
        for (var i = 0; i < 3; ++i) {
            levelSpacing = spacing << i;
            GetCutoutImage(cache, dim, [x,y], levelSpacing, 0, root+i+".png", null);
        }
    }

    /*
    // Saves images centered at spots on the edge.
    // Roll is set to put the edge horizontal.
    // Step is in screen pixel units
    PolylineWidget.prototype.SampleEdge = function(dim, step, count, callback) {
    this.Polyline.SampleEdge(this.Layer,dim,step,count,callback);
    }

    function DownloadTheano(widgetIdx, angleIdx) {
    EDGE_ANGLE = 2*Math.PI * angleIdx / 24;
    LAYERS[0].WidgetList[widgetIdx].SampleEdge(
    64,4,EDGE_COUNT,
    function () {
    setTimeout(function(){ DownloadTheano2(widgetIdx, angleIdx); }, 1000);
    });
    }

    function DownloadTheano2(widgetIdx, angleIdx) {
    ++angleIdx;
    if (angleIdx >= 24) {
    angleIdx = 0;
    ++widgetIdx;
    }
    if (widgetIdx < LAYERS[0].WidgetList.length) {
    DownloadTheano(widgetIdx, angleIdx);
    }
    }
    */


    SAM.PolylineWidget = PolylineWidget;

})();
//==============================================================================
// Temporary drawing with a pencil.  It goes away as soon as the camera changes.
// pencil icon (image as html) follows the cursor.
// Middle mouse button (or properties menu item) drops pencil.
// maybe option in properties menu to save the drawing permanently.

// TODO:
// Break lines when the mouse is repressed.
// Smooth / compress lines. (Mouse pixel jitter)
// Option for the drawing to disappear when the camera changes.
// Serialize and Load methods.
// Undo / Redo.
// Color (property window).


(function () {
    // Depends on the CIRCLE widget
    "use strict";

    var DRAWING = 0;
    // Active means highlighted.
    var ACTIVE = 1;
    var DRAG = 2;
    var WAITING = 3;


    function PencilWidget (layer, newFlag) {
        if (layer == null) {
            return;
        }

        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a pencil.
        this.Dialog.Title.text('Pencil Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .css({'display':'table-cell'});

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        this.LineWidth = 0;
        if (localStorage.PencilWidgetDefaults) {
            var defaults = JSON.parse(localStorage.PencilWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
            }
            if (defaults.LineWidth) {
                this.LineWidth = defaults.LineWidth;
                this.Dialog.LineWidthInput.val(this.LineWidth);
            }
        }

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        this.Layer.AddWidget(this);

        var self = this;
        this.Shapes = new SAM.ShapeGroup();
        this.SetStateToDrawing();

        if ( ! newFlag) {
            this.State = WAITING;
            this.Layer.GetCanvasDiv().css({'cursor':'default'});
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();
    }

    PencilWidget.prototype.SetStateToDrawing = function() {
        this.State = DRAWING;
        // When drawing, the cursor is enough indication.
        // We keep the lines the normal color. Yellow is too hard to see.
        this.Shapes.SetActive(false);
        this.Popup.Hide();
        this.Layer.GetCanvasDiv().css(
            {'cursor':'url('+SAM.ImagePathUrl+'Pencil-icon.png) 0 24,crosshair'});
        this.Layer.EventuallyDraw();
    }

    PencilWidget.prototype.Draw = function(view) {
        this.Shapes.Draw(view);
    }

    PencilWidget.prototype.Serialize = function() {
        var obj = new Object();
        obj.type = "pencil";
        obj.shapes = [];
        for (var i = 0; i < this.Shapes.GetNumberOfShapes(); ++i) {
            // NOTE: Assumes shape is a Polyline.
            var shape = this.Shapes.GetShape(i);
            var points = [];
            for (var j = 0; j < shape.Points.length; ++j) {
                points.push([shape.Points[j][0], shape.Points[j][1]]);
            }
            obj.shapes.push(points);
        }
        obj.creation_camera = this.CreationCamera;

        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    PencilWidget.prototype.Load = function(obj) {
        for(var n=0; n < obj.shapes.length; n++){
            var points = obj.shapes[n];
            var shape = new SAM.Polyline();
            shape.SetOutlineColor(this.Dialog.ColorInput.val());
            shape.FixedSize = false;
            shape.LineWidth = this.LineWidth;
            this.Shapes.AddShape(shape);
            for (var m = 0; m < points.length; ++m) {
                shape.Points[m] = [points[m][0], points[m][1]];
            }
            shape.UpdateBuffers();
        }

        // How zoomed in was the view when the annotation was created.
        if (obj.view_height !== undefined) {
            this.CreationCamera = obj.creation_camera;
        }
    }

    PencilWidget.prototype.Deactivate = function() {
        this.Popup.StartHideTimer();
        this.Layer.GetCanvasDiv().css({'cursor':'default'});
        this.Layer.DeactivateWidget(this);
        this.State = WAITING;
        this.Shapes.SetActive(false);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    }

    PencilWidget.prototype.HandleKeyDown = function(event) {
        if ( this.State == DRAWING) {
            // escape key (or space or enter) to turn off drawing
            if (event.keyCode == 27 || event.keyCode == 32 || event.keyCode == 13) {
                this.Deactivate();
                return false;
            }
        }
    }

    // Change the line width with the wheel.
    PencilWidget.prototype.HandleMouseWheel = function(event) {
        if ( this.State == DRAWING ||
             this.State == ACTIVE) {
            if (this.Shapes.GetNumberOfShapes() < 0) { return; }
            var tmp = 0;

            if (event.deltaY) {
                tmp = event.deltaY;
            } else if (event.wheelDelta) {
                tmp = event.wheelDelta;
            }

            var minWidth = 1.0 / this.Layer.GetPixelsPerUnit();

            // Wheel event seems to be in increments of 3.
            // depreciated mousewheel had increments of 120....
            var lineWidth = this.Shapes.GetLineWidth();
            lineWidth = lineWidth || minWidth;
            if (tmp > 0) {
                lineWidth *= 1.1;
            } else if (tmp < 0) {
                lineWidth /= 1.1;
            }
            if (lineWidth <= minWidth) {
                lineWidth = 0.0;
            }
            this.Dialog.LineWidthInput.val(lineWidth);
            this.Shapes.SetLineWidth(lineWidth);
            this.Shapes.UpdateBuffers();

            this.Layer.EventuallyDraw();
            return false;
        }
        return true;
    }

    PencilWidget.prototype.HandleMouseDown = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 1) {
            if (this.State == DRAWING) {
                // Start drawing.
                var shape = new SAM.Polyline();
                //shape.OutlineColor = [0.9, 1.0, 0.0];
                shape.OutlineColor = [0.0, 0.0, 0.0];
                shape.SetOutlineColor(this.Dialog.ColorInput.val());
                shape.FixedSize = false;
                shape.LineWidth = 0;
                shape.LineWidth = this.Shapes.GetLineWidth();
                this.Shapes.AddShape(shape);

                var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
                shape.Points.push([pt[0], pt[1]]); // avoid same reference.
            }
            if (this.State == ACTIVE) {
                // Anticipate dragging (might be double click)
                var cam = this.Layer.GetCamera();
                this.LastMouse = cam.ConvertPointViewerToWorld(x, y);
            }
        }
    }

    PencilWidget.prototype.HandleMouseUp = function(event) {
        if (event.which == 3) {
            // Right mouse was pressed.
            // Pop up the properties dialog.
            this.ShowPropertiesDialog();
            return false;
        }
        // Middle mouse deactivates the widget.
        if (event.which == 2) {
            // Middle mouse was pressed.
            this.Deactivate();
            return false;
        }

        if (this.State == DRAG) {
            // Set the origin back to zero (put it explicitely in points).
            this.Shapes.ResetOrigin();
            this.State = ACTIVE;
        }

        // A stroke has just been finished.
        var last = this.Shapes.GetNumberOfShapes() - 1;
        if (this.State == DRAWING && 
            event.which == 1 && last >= 0) {
            var spacing = this.Layer.GetCamera().GetSpacing();
            // NOTE: This assume that the shapes are polylines.
            //this.Decimate(this.Shapes.GetShape(last), spacing);
            this.Shapes.GetShape(last).Decimate(spacing);
            RecordState();
        }
        return false;
    }

    PencilWidget.prototype.HandleDoubleClick = function(event) {
        if (this.State == DRAWING) {
            this.Deactivate();
            return false;
        } 
        if (this.State == ACTIVE) {
            this.SetStateToDrawing();
            return false;
        }
        return true;
    }

    PencilWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 1 && this.State == DRAWING) {
            var last = this.Shapes.GetNumberOfShapes() - 1;
            var shape = this.Shapes.GetShape(last);
            var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
            shape.Points.push([pt[0], pt[1]]); // avoid same reference.
            shape.UpdateBuffers();
            if (SAM.NotesWidget) { SAM.NotesWidget.MarkAsModified(); } // Hack
            this.Layer.EventuallyDraw();
            return false;
        }

        if (this.State == ACTIVE &&
            event.which == 0) {
            // Deactivate
            this.SetActive(this.CheckActive(event));
            return false;
        }

        if (this.State == ACTIVE && event.which == 1) {
            this.State = DRAG;
        }

        if (this.State == DRAG) {
            // Drag
            this.State = DRAG;
            this.Popup.Hide();
            var cam = this.Layer.GetCamera();
            var mouseWorld = cam.ConvertPointViewerToWorld(x, y);
            var origin = this.Shapes.GetOrigin();
            origin[0] += mouseWorld[0] - this.LastMouse[0];
            origin[1] += mouseWorld[1] - this.LastMouse[1];
            this.Shapes.SetOrigin(origin);
            this.LastMouse = mouseWorld;
            this.Layer.EventuallyDraw();
            return false;
        }
    }

    // This also shows the popup if it is not visible already.
    PencilWidget.prototype.PlacePopup = function () {
        var pt = this.Shapes.FindPopupPoint(this.Layer.GetCamera());
        if ( ! pt) { return; }
        pt = this.Layer.GetCamera().ConvertPointWorldToViewer(pt[0], pt[1]);

        pt[0] += 20;
        pt[1] -= 10;

        this.Popup.Show(pt[0],pt[1]);
    }

    PencilWidget.prototype.CheckActive = function(event) {
        if (this.State == DRAWING) { return true; }
        if (this.Shapes.GetNumberOfShapes() == 0) { return false; }

        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);

        var width = this.Shapes.GetLineWidth();
        // Tolerance: 5 screen pixels.
        var minWidth = 10.0 / this.Layer.GetPixelsPerUnit();
        if (width < minWidth) { width = minWidth;}

        var flag = this.Shapes.PointOnShape(pt, width);
        if (this.State == ACTIVE && !flag) {
            this.SetActive(flag);
        } else if (this.State == WAITING && flag) {
            this.PlacePopup();
            this.SetActive(flag);
        }
        return flag;
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    PencilWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) { return; }
        if (flag) {
            this.Layer.ActivateWidget(this);
            this.State = ACTIVE;
            this.Shapes.SetActive(true);
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        } else {
            if (this.State != ACTIVE) {
                // Not active.  Do nothing.
                return;
            }
            this.Deactivate();
            this.Layer.DeactivateWidget(this);
        }
    }

    PencilWidget.prototype.GetActive = function() {
        return this.State != WAITING;
    }

    PencilWidget.prototype.RemoveFromLayer = function() {
        if (this.Layer) {
            this.Layer.RemoveWidget(this);
        }
        this.Layer = null;
    }

    // Can we bind the dialog apply callback to an objects method?
    var DIALOG_SELF
    PencilWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Shapes.GetOutlineColor()));
        this.Dialog.LineWidthInput.val((this.Shapes.GetLineWidth()).toFixed(2));

        this.Dialog.Show(true);
    }

    PencilWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Shapes.SetOutlineColor(hexcolor);
        this.Shapes.SetLineWidth(parseFloat(this.Dialog.LineWidthInput.val()));
        this.Shapes.UpdateBuffers();
        this.SetActive(false);
        RecordState();
        this.Layer.EventuallyDraw();

        localStorage.PencilWidgetDefaults = JSON.stringify({Color: hexcolor,
                                                            LineWidth: this.LineWidth});
        if (SAM.NotesWidget) { SAM.NotesWidget.MarkAsModified(); } // Hack
    }

    /*
    // The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
    // Pass in the spacing as a hint to get rid of aliasing.
    PencilWidget.prototype.Decimate = function(shape, spacing) {
        // Keep looping over the line removing points until the line does not change.
        var modified = true;
        while (modified) {
            modified = false;
            var newPoints = [];
            newPoints.push(shape.Points[0]);
            // Window of four points.
            var i = 3;
            while (i < shape.Points.length) {
                var p0 = shape.Points[i];
                var p1 = shape.Points[i-1];
                var p2 = shape.Points[i-2];
                var p3 = shape.Points[i-3];
                // Compute the average of the center two.
                var cx = (p1[0] + p2[0]) * 0.5;
                var cy = (p1[1] + p2[1]) * 0.5;
                // Find the perendicular normal.
                var nx = (p0[1] - p3[1]);
                var ny = -(p0[0] - p3[0]);
                var mag = Math.sqrt(nx*nx + ny*ny);
                nx = nx / mag;
                ny = ny / mag;
                mag = Math.abs(nx*(cx-shape.Points[i-3][0]) + ny*(cy-shape.Points[i-3][1]));
                // Mag metric does not distinguish between line and a stroke that double backs on itself.
                // Make sure the two point being merged are between the outer points 0 and 3.
                var dir1 = (p0[0]-p1[0])*(p3[0]-p1[0]) + (p0[1]-p1[1])*(p3[1]-p1[1]);
                var dir2 = (p0[0]-p2[0])*(p3[0]-p2[0]) + (p0[1]-p2[1])*(p3[1]-p2[1]);
                if (mag < spacing && dir1 < 0.0 && dir2 < 0.0) {
                    // Replace the two points with their average.
                    newPoints.push([cx, cy]);
                    modified = true;
                    // Skip the next point the window will have one old merged point,
                    // but that is ok because it is just used as reference and not altered.
                    i += 2;
                } else {
                    //  No modification.  Just move the window one.
                    newPoints.push(shape.Points[i-2]);
                    ++i;
                }
            }
            // Copy the remaing point / 2 points
            i = i-2;
            while (i < shape.Points.length) {
                newPoints.push(shape.Points[i]);
                ++i;
            }
            shape.Points = newPoints;
        }

        shape.UpdateBuffers();
    }
    */

    SAM.PencilWidget = PencilWidget;

})();
//==============================================================================
// Segmentation / fill.  But should I change it into a contour at the end?

(function () {
    "use strict";

    var FILL_WIDGET_DRAWING = 0;
    var FILL_WIDGET_ACTIVE = 1;
    var FILL_WIDGET_WAITING = 2;


    function FillWidget (viewer, newFlag) {
        if (viewer == null) {
            return;
        }

        // I am not sure what to do for the fill because
        // I plan to change it to a contour.

        this.Dialog = new SAM.Dialog(this);
        // Customize dialog for a lasso.
        this.Dialog.Title.text('Fill Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-fill-div");
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .addClass("sa-view-fill-label");
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .addClass("sa-view-fill-input");

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-fill-div");
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .addClass("sa-view-fill-label");
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .addClass("sa-view-fill-input")
            .keypress(function(event) { return event.keyCode != 13; });

        this.Popup = new SAM.WidgetPopup(this);
        this.Viewer = viewer;
        this.Viewer.AddWidget(this);

        this.Cursor = $('<img>').appendTo('body')
            .addClass("sa-view-fill-cursor")
            .attr('type','image')
            .attr('src',SAM.ImagePathUrl+"brush1.jpg");

        var self = this;
        // I am trying to stop images from getting move events and displaying a circle/slash.
        // This did not work.  preventDefault did not either.
        //this.Cursor.mousedown(function (event) {self.HandleMouseDown(event);})
        //this.Cursor.mousemove(function (event) {self.HandleMouseMove(event);})
        //this.Cursor.mouseup(function (event) {self.HandleMouseUp(event);})
        //.preventDefault();

        this.ActiveCenter = [0,0];

        this.State = FILL_WIDGET_DRAWING;
        if ( ! newFlag) {
            this.State = FILL_WIDGET_WAITING;
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = viewer.GetCamera().Serialize;
    }

    // This is expensive, so initialize explicitely outside the constructor.
    FillWidget.prototype.Initialize = function(view) {
        // Now for the segmentation initialization.
        this.Segmentation = new Segmentation(this.Viewer);
    }

    FillWidget.prototype.Draw = function(view) {
        this.Segmentation.ImageAnnotation.Draw(view);
    }

    // I do not know what we are saving yet.
    FillWidget.prototype.Serialize = function() {
        /*
          var obj = new Object();
          obj.type = "pencil";
          obj.shapes = [];
          for (var i = 0; i < this.Shapes.length; ++i) {
          var shape = this.Shapes[i];
          var points = [];
          for (var j = 0; j < shape.Points.length; ++j) {
          points.push([shape.Points[j][0], shape.Points[j][1]]);
          }
          obj.shapes.push(points);
          }
          obj.creation_camera = this.CreationCamera;

          return obj;
        */
    }

    // Load a widget from a json object (origin MongoDB).
    FillWidget.prototype.Load = function(obj) {
        /*
          for(var n=0; n < obj.shapes.length; n++){
          var points = obj.shapes[n];
          var shape = new SAM.Polyline();
          shape.OutlineColor = [0.9, 1.0, 0.0];
          shape.FixedSize = false;
          shape.LineWidth = 0;
          this.Shapes.push(shape);
          for (var m = 0; m < points.length; ++m) {
          shape.Points[m] = [points[m][0], points[m][1]];
          }
          shape.UpdateBuffers();
          }

          // How zoomed in was the view when the annotation was created.
          if (obj.view_height !== undefined) {
          this.CreationCamera = obj.creation_camera;
          }
        */
    }

    FillWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        return false;
    }

    FillWidget.prototype.Deactivate = function() {
        this.Popup.StartHideTimer();
        this.Viewer.DeactivateWidget(this);
        this.State = FILL_WIDGET_WAITING;
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        eventuallyRender();
    }

    FillWidget.prototype.HandleMouseDown = function(event) {
        var x = this.Viewer.MouseX;
        var y = this.Viewer.MouseY;

        if (event.which == 1) {
            var ptWorld = this.Viewer.ConvertPointViewerToWorld(x, y);
            this.Cursor.attr('src',SAM.ImagePathUrl+"brush1.jpg");
            this.Cursor.show();
            this.Segmentation.AddPositive(ptWorld);
        }
        if (event.which == 3) {
            var ptWorld = this.Viewer.ConvertPointViewerToWorld(x, y);
            this.Cursor.attr('src',SAM.ImagePathUrl+"eraser1.jpg");
            this.Cursor.show();
            this.Segmentation.AddNegative(ptWorld);
        }
    }

    FillWidget.prototype.HandleMouseUp = function(event) {
        // Middle mouse deactivates the widget.
        if (event.which == 2) {
            // Middle mouse was pressed.
            this.Deactivate();
        }

        // A stroke has just been finished.
        if (event.which == 1 || event.which == 3) {
            this.Cursor.hide();
            this.Segmentation.Update();
            this.Segmentation.Draw();
            eventuallyRender();
        }
    }

    FillWidget.prototype.HandleDoubleClick = function(event) {
    }

    FillWidget.prototype.HandleMouseMove = function(event) {
        var x = this.Viewer.MouseX;
        var y = this.Viewer.MouseY;

        // Move the paint bucket icon to follow the mouse.
        this.Cursor.css({'left': (x+4), 'top': (y-32)});

        if (this.Viewer.MouseDown == true && this.State == FILL_WIDGET_DRAWING) {
            if (event.which == 1 ) {
                var ptWorld = this.Viewer.ConvertPointViewerToWorld(x, y);
                this.Segmentation.AddPositive(ptWorld);
            }
            if (event.which == 3 ) {
                var ptWorld = this.Viewer.ConvertPointViewerToWorld(x, y);
                this.Segmentation.AddNegative(ptWorld);
            }

            return;
        }
    }

    FillWidget.prototype.ComputeActiveCenter = function() {
        /*
          var count = 0;
          var sx = 0.0;
          var sy = 0.0;
          for (var i = 0; i < this.Shapes.length; ++i) {
          var shape = this.Shapes[i];
          var points = [];
          for (var j = 0; j < shape.Points.length; ++j) {
          sx += shape.Points[j][0];
          sy += shape.Points[j][1];
          }
          count += shape.Points.length;
          }

          this.ActiveCenter[0] = sx / count;
          this.ActiveCenter[1] = sy / count;
        */
    }

    //This also shows the popup if it is not visible already.
    FillWidget.prototype.PlacePopup = function () {
        /*
          var pt = this.Viewer.ConvertPointWorldToViewer(this.ActiveCenter[0],
          this.ActiveCenter[1]);
          pt[0] += 40;
          pt[1] -= 40;
          this.Popup.Show(pt[0],pt[1]);
        */
    }

    FillWidget.prototype.CheckActive = function(event) {
        /*
          if (this.State == FILL_WIDGET_DRAWING) { return; }

          var pt = this.Viewer.ConvertPointWorldToViewer(this.ActiveCenter[0],
          this.ActiveCenter[1]);

          var dx = this.Viewer.MouseX - pt[0];
          var dy = this.Viewer.MouseY - pt[1];
          var active = false;

          if (dx*dx + dy*dy < 1600) {
          active = true;
          }
          this.SetActive(active);
          return active;
        */
    }

    FillWidget.prototype.GetActive = function() {
        return false;
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    FillWidget.prototype.SetActive = function(flag) {
        if (flag) {
            this.Viewer.ActivateWidget(this);
            this.State = FILL_WIDGET_ACTIVE;
            for (var i = 0; i < this.Shapes.length; ++i) {
                this.Shapes[i].Active = true;
            }
            this.PlacePopup();
            eventuallyRender();
        } else {
            this.Deactivate();
            this.Viewer.DeactivateWidget(this);
        }
    }

    FillWidget.prototype.RemoveFromViewer = function() {
        if (this.Viewer) {
            this.Viewer.RemoveWidget();
        }
    }

    // Can we bind the dialog apply callback to an objects method?
    var FILL_WIDGET_DIALOG_SELF
    FillWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Shapes[0].OutlineColor));
        this.Dialog.LineWidthInput.val((this.Shapes[0].LineWidth).toFixed(2));

        this.Dialog.Show(true);
    }


    FillWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].SetOutlineColor(hexcolor);
            this.Shapes[i].LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
            this.Shapes[i].UpdateBuffers();
        }
        this.SetActive(false);
        RecordState();
        eventuallyRender();
    }

    SAM.FillWidget = FillWidget;

})();



//==============================================================================
// Variation of pencil
// Free form loop
// I plan to be abble to add or remove regions from the loop with multiple strokes.
// It will be a state, just like the pencil widget is a state.

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    var DRAWING = 0;
    var ACTIVE = 1;
    var WAITING = 2;

    function LassoWidget (layer, newFlag) {
        if (layer == null) {
            return;
        }

        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a lasso.
        this.Dialog.Title.text('Lasso Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .addClass("sa-view-annotation-modal-input");

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .addClass("sa-view-annotation-modal-input")
            .keypress(function(event) { return event.keyCode != 13; });

        // Area
        this.Dialog.AreaDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.AreaLabel =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .text("Area:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.Area =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .addClass("sa-view-annotation-modal-input");

        // Get default properties.
        if (localStorage.LassoWidgetDefaults) {
            var defaults = JSON.parse(localStorage.LassoWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
            }
            if (defaults.LineWidth) {
                this.Dialog.LineWidthInput.val(defaults.LineWidth);
            }
        }

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        this.Layer.AddWidget(this);

        var self = this;

        this.Loop = new SAM.Polyline();
        this.Loop.OutlineColor = [0.0, 0.0, 0.0];
        this.Loop.SetOutlineColor(this.Dialog.ColorInput.val());
        this.Loop.FixedSize = false;
        this.Loop.LineWidth = 0;
        this.Loop.Closed = true;
        this.Stroke = false;

        this.ActiveCenter = [0,0];

        if ( newFlag) {
            this.SetStateToDrawing();
        } else {
            this.State = WAITING;
        }
    }

    LassoWidget.prototype.Draw = function(view) {
        this.Loop.Draw(view);
        if (this.Stroke) {
            this.Stroke.Draw(view);
        }
    }

    LassoWidget.prototype.Serialize = function() {
        var obj = new Object();
        obj.type = "lasso";
        obj.outlinecolor = this.Loop.OutlineColor;
        obj.points = [];
        for (var j = 0; j < this.Loop.Points.length; ++j) {
            obj.points.push([this.Loop.Points[j][0], this.Loop.Points[j][1]]);
        }
        obj.closedloop = true;

        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    LassoWidget.prototype.Load = function(obj) {
        if (obj.outlinecolor != undefined) {
            this.Loop.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
            this.Loop.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
            this.Loop.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
            // will never happen
            //if (this.Stroke) {
            //    this.Stroke.OutlineColor = this.Loop.OutlineColor;
            //}
        }
        var points = [];
        if ( obj.points != undefined) {
            points = obj.points;
        }
        if ( obj.shape != undefined) {
            points = obj.shapes[0];
        }

        for(var n=0; n < points.length; n++){
            this.Loop.Points[n] = [parseFloat(points[n][0]),
                                   parseFloat(points[n][1])];
        }
        this.ComputeActiveCenter();
        this.Loop.UpdateBuffers();
    }

    LassoWidget.prototype.HandleMouseWheel = function(event) {
        if ( this.State == DRAWING ||
             this.State == ACTIVE) {
            if ( ! this.Loop) { return true; }
            var tmp = 0;

            if (event.deltaY) {
                tmp = event.deltaY;
            } else if (event.wheelDelta) {
                tmp = event.wheelDelta;
            }

            var minWidth = 1.0 / this.Layer.GetPixelsPerUnit();

            // Wheel event seems to be in increments of 3.
            // depreciated mousewheel had increments of 120....
            var lineWidth = this.Loop.GetLineWidth();
            lineWidth = lineWidth || minWidth;
            if (tmp > 0) {
                lineWidth *= 1.1;
            } else if (tmp < 0) {
                lineWidth /= 1.1;
            }
            if (lineWidth <= minWidth) {
                lineWidth = 0.0;
            }
            this.Dialog.LineWidthInput.val(lineWidth);
            this.Loop.SetLineWidth(lineWidth);
            this.Loop.UpdateBuffers();

            this.Layer.EventuallyDraw();
            return false;
        }
        return true;
    }

    LassoWidget.prototype.Deactivate = function() {
        this.Popup.StartHideTimer();
        this.Layer.DeactivateWidget(this);
        this.State = WAITING;
        this.Loop.SetActive(false);
        if (this.Stroke) {
            this.Stroke.SetActive(false);
        }
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    }

    LassoWidget.prototype.HandleKeyDown = function(event) {
        if ( this.State == DRAWING) {
            // escape key (or space or enter) to turn off drawing
            if (event.keyCode == 27 || event.keyCode == 32 || event.keyCode == 13) {
                this.Deactivate();
                return false;
            }
        }
    }

    LassoWidget.prototype.HandleMouseDown = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 1) {
            // Start drawing.
            // Stroke is a temporary line for interaction.
            // When interaction stops, it is converted/merged with loop.
            this.Stroke = new SAM.Polyline();
            this.Stroke.OutlineColor = [0.0, 0.0, 0.0];
            this.Stroke.SetOutlineColor(this.Loop.OutlineColor);
            //this.Stroke.SetOutlineColor(this.Dialog.ColorInput.val());
            this.Stroke.FixedSize = false;
            this.Stroke.LineWidth = 0;

            var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
            this.Stroke.Points = [];
            this.Stroke.Points.push([pt[0], pt[1]]); // avoid same reference.
            return false;
        }
        return true;
    }

    LassoWidget.prototype.HandleMouseUp = function(event) {
        // Middle mouse deactivates the widget.
        if (event.which == 2) {
            // Middle mouse was pressed.
            this.Deactivate();
        }

        // A stroke has just been finished.
        if (event.which == 1 && this.State == DRAWING) {
            var spacing = this.Layer.GetCamera().GetSpacing();
            //this.Decimate(this.Stroke, spacing);
            this.Stroke.Decimate(spacing);
            if (this.Loop && this.Loop.Points.length > 0) {
                this.CombineStroke();
            } else {
                this.Stroke.Closed = true;
                this.Stroke.UpdateBuffers();
                this.Loop = this.Stroke;
                this.Stroke = false;
            }
            this.ComputeActiveCenter();
            this.Layer.EventuallyDraw();

            RecordState();
        }
        return false;
    }

    LassoWidget.prototype.HandleDoubleClick = function(event) {
        if (this.State == DRAWING) {
            this.Deactivate();
            return false;
        }
        if (this.State == ACTIVE) {
            this.SetStateToDrawing();
            return false;
        }
        return true;
    }

    LassoWidget.prototype.SetStateToDrawing = function() {
        this.State = DRAWING;
        // When drawing, the cursor is enough indication.
        // We keep the lines the normal color. Yellow is too hard to see.
        this.Loop.SetActive(false);
        this.Popup.Hide();
        this.Layer.GetCanvasDiv().css(
            {'cursor':'url('+SAM.ImagePathUrl+'select_lasso.png) 5 30,crosshair'});
        this.Layer.EventuallyDraw();
    }

    LassoWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 1 && this.State == DRAWING) {
            var shape = this.Stroke;
            var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
            shape.Points.push([pt[0], pt[1]]); // avoid same reference.
            shape.UpdateBuffers();
            if (SAM.NotesWidget) {SAM.NotesWidget.MarkAsModified();} // hack
            this.Layer.EventuallyDraw();
            return false;
        }

        if (this.State == ACTIVE &&
            event.which == 0) {
            // Deactivate
            this.SetActive(this.CheckActive(event));
            return false;
        }
        return true;
    }

    LassoWidget.prototype.ComputeActiveCenter = function() {
        var count = 0;
        var sx = 0.0;
        var sy = 0.0;
        var shape = this.Loop;
        var points = [];
        for (var j = 0; j < shape.Points.length; ++j) {
            sx += shape.Points[j][0];
            sy += shape.Points[j][1];
        }

        this.ActiveCenter[0] = sx / shape.Points.length;
        this.ActiveCenter[1] = sy / shape.Points.length;
    }

    // This also shows the popup if it is not visible already.
    LassoWidget.prototype.PlacePopup = function () {
        var pt = this.Loop.FindPopupPoint(this.Layer.GetCamera());
        pt = this.Layer.GetCamera().ConvertPointWorldToViewer(pt[0], pt[1]);

        pt[0] += 20;
        pt[1] -= 10;

        this.Popup.Show(pt[0],pt[1]);
    }

    // Just returns whether the widget thinks it should be active.
    // Layer is responsible for seting it to active.
    LassoWidget.prototype.CheckActive = function(event) {
        if (this.State == DRAWING) { return; }

        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);

        var width = this.Loop.GetLineWidth() / 2;
        // Tolerance: 5 screen pixels.
        var minWidth = 10.0 / this.Layer.GetPixelsPerUnit();
        if (width < minWidth) { width = minWidth;}

        if (this.Loop.PointOnShape(pt, width)) {
            return true;
        } else {
            return false;
        }
    }

    LassoWidget.prototype.GetActive = function() {
        return this.State != WAITING;
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    LassoWidget.prototype.SetActive = function(flag) {
        if (flag) {
            if (this.State == WAITING ) {
                this.State = ACTIVE;
                this.Loop.SetActive(true);
                this.PlacePopup();
                this.Layer.EventuallyDraw();
            }
        } else {
            if (this.State != WAITING) {
                this.Deactivate();
                this.Layer.DeactivateWidget(this);
            }
        }
        this.Layer.EventuallyDraw();
    }

    // It would be nice to put this as a superclass method, or call the
    // layer.RemoveWidget method instead.
    LassoWidget.prototype.RemoveFromLayer = function() {
        if (this.Layer) {
            this.RemoveWidget(this);
        }
    }

    // Can we bind the dialog apply callback to an objects method?
    LassoWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Loop.OutlineColor));
        this.Dialog.LineWidthInput.val((this.Loop.LineWidth).toFixed(2));

        var area = this.ComputeArea();
        var areaString = "" + area.toFixed(2);
        if (this.Loop.FixedSize) {
            areaString += " pixels^2";
        } else {
            areaString += " units^2";
        }
        this.Dialog.Area.text(areaString);
        this.Dialog.Show(true);
    }

    LassoWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.Loop.SetOutlineColor(hexcolor);
        this.Loop.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Loop.UpdateBuffers();
        this.SetActive(false);
        RecordState();
        this.Layer.EventuallyDraw();

        localStorage.LassoWidgetDefaults = JSON.stringify({Color: hexcolor, LineWidth: this.Loop.LineWidth});
        if (SAM.NotesWidget) {SAM.NotesWidget.MarkAsModified();} // hack
    }

    /*
    // The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
    // Pass in the spacing as a hint to get rid of aliasing.
    LassoWidget.prototype.Decimate = function(shape, spacing) {
        // Keep looping over the line removing points until the line does not change.
        var modified = true;
        var sanityCheck = 0;
        while (modified) {
            modified = false;
            var newPoints = [];
            newPoints.push(shape.Points[0]);
            // Window of four points.
            var i = 3;
            while (i < shape.Points.length) {
                // Debugging a hang.  I do not think it occurs in decimate, but it might.
                if (++sanityCheck > 100000) {
                    alert("Decimate is takeing too long.");
                    return;
                }
                var p0 = shape.Points[i];
                var p1 = shape.Points[i-1];
                var p2 = shape.Points[i-2];
                var p3 = shape.Points[i-3];
                // Compute the average of the center two.
                var cx = (p1[0] + p2[0]) * 0.5;
                var cy = (p1[1] + p2[1]) * 0.5;
                // Find the perendicular normal.
                var nx = (p0[1] - p3[1]);
                var ny = -(p0[0] - p3[0]);
                var mag = Math.sqrt(nx*nx + ny*ny);
                nx = nx / mag;
                ny = ny / mag;
                mag = Math.abs(nx*(cx-shape.Points[i-3][0]) + ny*(cy-shape.Points[i-3][1]));
                // Mag metric does not distinguish between line and a stroke that double backs on itself.
                // Make sure the two point being merged are between the outer points 0 and 3.
                var dir1 = (p0[0]-p1[0])*(p3[0]-p1[0]) + (p0[1]-p1[1])*(p3[1]-p1[1]);
                var dir2 = (p0[0]-p2[0])*(p3[0]-p2[0]) + (p0[1]-p2[1])*(p3[1]-p2[1]);
                if (mag < spacing && dir1 < 0.0 && dir2 < 0.0) {
                    // Replace the two points with their average.
                    newPoints.push([cx, cy]);
                    modified = true;
                    // Skip the next point the window will have one old merged point,
                    // but that is ok because it is just used as reference and not altered.
                    i += 2;
                } else {
                    //  No modification.  Just move the window one.
                    newPoints.push(shape.Points[i-2]);
                    ++i;
                }
            }
            // Copy the remaing point / 2 points
            i = i-2;
            while (i < shape.Points.length) {
                newPoints.push(shape.Points[i]);
                ++i;
            }
            shape.Points = newPoints;
        }

        shape.UpdateBuffers();
    }
    */
    LassoWidget.prototype.CombineStroke = function() {
        // This algorithm was desinged to have the first point be the same as the last point.
        // To generalize polylineWidgets and lassoWidgets, I changed this and put a closed 
        // flag (which implicitely draws the last segment) in polyline.
        // It is easier to temporarily add the extra point and them remove it, than change the algorithm.
        this.Loop.Points.push(this.Loop.Points[0]);

        // Find the first and last intersection points between stroke and loop.
        var intersection0;
        var intersection1;
        for (var i = 1; i < this.Stroke.Points.length; ++i) {
            var pt0 = this.Stroke.Points[i-1];
            var pt1 = this.Stroke.Points[i];
            var tmp = this.FindIntersection(pt0, pt1);
            if (tmp) {
                // I need to insert the intersection in the stroke so
                // one stroke segment does not intersect loop twice.
                this.Stroke.Points.splice(i,0,tmp.Point);
                if (intersection0 == undefined) {
                    intersection0 = tmp;
                    intersection0.StrokeIndex = i;
                } else {
                    // If a point was added before first intersection,
                    // its index needs to be updated too.
                    if (tmp.LoopIndex < intersection0.LoopIndex) {
                        intersection0.LoopIndex += 1;
                    }
                    intersection1 = tmp;
                    intersection1.StrokeIndex = i;
                }
            }
        }

        var sanityCheck = 0;

        // If we have two intersections, clip the loop with the stroke.
        if (intersection1 != undefined) {
            // We will have two parts.
            // Build both loops keeing track of their lengths.
            // Keep the longer part.
            var points0 = [];
            var len0 = 0.0;
            var points1 = [];
            var len1 = 0.0;
            var i;
            // Add the clipped stroke to both loops.
            for (i = intersection0.StrokeIndex; i < intersection1.StrokeIndex; ++i) {
                points0.push(this.Stroke.Points[i]);
                points1.push(this.Stroke.Points[i]);
            }
            // Now the two new loops take different directions around the original loop.
            // Decreasing
            i = intersection1.LoopIndex;
            while (i != intersection0.LoopIndex) {
                if (++sanityCheck > 1000000) {
                    alert("Combine loop 1 is taking too long.");
                    return;
                }
                points0.push(this.Loop.Points[i]);
                var dx = this.Loop.Points[i][0];
                var dy = this.Loop.Points[i][1];
                // decrement around loop.  First and last loop points are the same.
                if (--i == 0) { i = this.Loop.Points.length - 1;}
                // Integrate distance.
                dx -= this.Loop.Points[i][0];
                dy -= this.Loop.Points[i][1];
                len0 += Math.sqrt(dx*dx + dy*dy);
            }
            // Duplicate the first point in the loop
            points0.push(intersection0.Point);

            // Increasing
            i = intersection1.LoopIndex;
            while (i != intersection0.LoopIndex) {
                if (++sanityCheck > 1000000) {
                    alert("Combine loop 2 is taking too long.");
                    return;
                }
                points1.push(this.Loop.Points[i]);
                var dx = this.Loop.Points[i][0];
                var dy = this.Loop.Points[i][1];
                //increment around loop.  First and last loop points are the same.
                if (++i == this.Loop.Points.length - 1) { i = 0;}
                // Integrate distance.
                dx -= this.Loop.Points[i][0];
                dy -= this.Loop.Points[i][1];
                len1 += Math.sqrt(dx*dx + dy*dy);
            }
            // Duplicate the first point in the loop
            points1.push(intersection0.Point);

            if (len0 > len1) {
                this.Loop.Points = points0;
            } else {
                this.Loop.Points = points1;
            }

            RecordState();
        }

        // Remove the extra point added at the begining of this method.
        this.Loop.Points.pop();
        this.Loop.UpdateBuffers();
        this.ComputeActiveCenter();

        this.Stroke = false;
        this.Layer.EventuallyDraw();
    }


    // tranform all points so p0 is origin and p1 maps to (1,0)
    // Returns false if no intersection, 
    // If there is an intersection, it adds that point to the loop.
    // It returns {Point: newPt, LoopIndex: i} .
    LassoWidget.prototype.FindIntersection = function(p0, p1) {
        var best = false;
        var p = [(p1[0]-p0[0]), (p1[1]-p0[1])];
        var mag = Math.sqrt(p[0]*p[0] + p[1]*p[1]);
        if (mag < 0.0) { return false;}
        p[0] = p[0] / mag;
        p[1] = p[1] / mag;

        var m0 = this.Loop.Points[0];
        var n0 = [(m0[0]-p0[0])/mag, (m0[1]-p0[1])/mag];
        var k0 = [(n0[0]*p[0]+n0[1]*p[1]), (n0[1]*p[0]-n0[0]*p[1])];

        for (var i = 1; i < this.Loop.Points.length; ++i) {
            var m1 = this.Loop.Points[i];
            // Avoid an infinite loop inserting points.
            if (p0 == m0 || p0 == m1) { continue;}
            var n1 = [(m1[0]-p0[0])/mag, (m1[1]-p0[1])/mag];
            var k1 = [(n1[0]*p[0]+n1[1]*p[1]), (n1[1]*p[0]-n1[0]*p[1])];
            if ((k1[1] >= 0.0 && k0[1] <= 0.0) || (k1[1] <= 0.0 && k0[1] >= 0.0)) {
                var k = k0[1] / (k0[1]-k1[1]);
                var x = k0[0] + k*(k1[0]-k0[0]);
                if (x > 0 && x <=1) {
                    var newPt = [(m0[0]+k*(m1[0]-m0[0])), (m0[1]+k*(m1[1]-m0[1]))];
                    if ( ! best || x < best.k) {
                        best = {Point: newPt, LoopIndex: i, k: x};
                    }
                }
            }
            m0 = m1;
            n0 = n1;
            k0 = k1;
        }
        if (best) {
            this.Loop.Points.splice(best.LoopIndex,0,best.Point);
        }

        return best;
    }

    // This is not actually needed!  So it is not used.
    LassoWidget.prototype.IsPointInsideLoop = function(x, y) {
        // Sum up angles.  Inside poitns will sum to 2pi, outside will sum to 0.
        var angle = 0.0;
        var pt0 = this.Loop.Points[this.Loop.length - 1];
        for ( var i = 0; i < this.Loop.length; ++i)
        {
            var pt1 = this.Loop.Points[i];
            var v0 = [pt0[0]-x, pt0[1]-y];
            var v1 = [pt1[0]-x, pt1[1]-y];
            var mag0 = Math.sqrt(v0[0]*v0[0] + v0[1]*v0[1]);
            var mag1 = Math.sqrt(v1[0]*v1[0] + v1[1]*v1[1]);
            angle += Math.arcsin((v0[0]*v1[1] - v0[1]*v1[0])/(mag0*mag1));
        }

        return (angle > 3.14 || angle < -3.14);
    }
    
    LassoWidget.prototype.ComputeArea = function() {
        var area = 0.0;
        // Use the active center. It should be more numerical stable.
        // Iterate over triangles
        var vx1 = this.Loop.Points[0][0] - this.ActiveCenter[0];
        var vy1 = this.Loop.Points[0][1] - this.ActiveCenter[1];
        for (var j = 1; j < this.Loop.Points.length; ++j) {
            // Area of triangle is 1/2 magnitude of cross product.
            var vx2 = vx1;
            var vy2 = vy1;
            vx1 = this.Loop.Points[j][0] - this.ActiveCenter[0];
            vy1 = this.Loop.Points[j][1] - this.ActiveCenter[1];
            area += (vx1*vy2) - (vx2*vy1);
        }

        if (area < 0) {
            area = -area;
        }
        return area;
    }

    
    SAM.LassoWidget = LassoWidget;

})();
//==============================================================================
// A replacement for the right click option to get the properties menu.
// This could be multi touch friendly.

(function () {
    "use strict";

    function WidgetPopup (widget) {
        this.Widget = widget;
        this.Visible = false;
        this.HideTimerId = 0;

        var parent = widget.Layer.GetCanvasDiv();

        // buttons to replace right click.
        var self = this;

        // We cannot append this to the canvas, so just append
        // it to the view panel, and add the viewport offset for now.
        // I should probably create a div around the canvas.
        // This is this only place I need viewport[0], [1] and I
        // was thinking of getting rid of the viewport offset.
        this.ButtonDiv =
            $('<div>').appendTo(parent)
            .hide()
            .css({'position': 'absolute',
                  'z-index': '1'})
            .mouseenter(function() { self.CancelHideTimer(); })
            .mouseleave(function(){ self.StartHideTimer();});
        this.DeleteButton = $('<img>').appendTo(this.ButtonDiv)
            .css({'height': '20px'})
            .attr('src',SA.ImagePathUrl+"deleteSmall.png")
            .click(function(){self.DeleteCallback();});
        this.PropertiesButton = $('<img>').appendTo(this.ButtonDiv)
            .css({'height': '20px'})
            .attr('src',SA.ImagePathUrl+"Menu.jpg")
            .click(function(){self.PropertiesCallback();});

        this.HideCallback = undefined;
    }

    // Used to hide an interacotrs handle with the popup.
    // TODO:  Let the AnnotationLayer manage the "active" widget.
    // The popup should not be doing this (managing its own timer)
    WidgetPopup.prototype.SetHideCallback = function(callback) {
        this.HideCllback = callback;
    }

    WidgetPopup.prototype.DeleteCallback = function() {
        this.Widget.SetActive(false);
        this.Hide();

        // Messy.  Maybe closure callback can keep track of the layer.
        this.Widget.Layer.EventuallyDraw();
        this.Widget.Layer.RemoveWidget(this.Widget);

        RecordState();
    }

    WidgetPopup.prototype.PropertiesCallback = function() {
        this.Hide();
        this.Widget.ShowPropertiesDialog();
    }


    //------------------------------------------------------------------------------
    WidgetPopup.prototype.Show = function(x, y) {
        this.CancelHideTimer(); // Just in case: Show trumps previous hide.
        this.ButtonDiv.css({
            'left' : x+'px',
            'top'  : y+'px'})
            .show();
    }

    // When some other event occurs, we want to hide the pop up quickly
    WidgetPopup.prototype.Hide = function() {
        this.CancelHideTimer(); // Just in case: Show trumps previous hide.
        this.ButtonDiv.hide();
        if (this.HideCallback) {
            (this.HideCallback)();
        }
    }

    WidgetPopup.prototype.StartHideTimer = function() {
        if ( ! this.HideTimerId) {
            var self = this;

            if(MOBILE_DEVICE) {
                this.HideTimerId = setTimeout(function(){self.HideTimerCallback();}, 1500);
            } else {
                this.HideTimerId = setTimeout(function(){self.HideTimerCallback();}, 800);
            }
        }
    }

    WidgetPopup.prototype.CancelHideTimer = function() {
        if (this.HideTimerId) {
            clearTimeout(this.HideTimerId);
            this.HideTimerId = 0;
        }
    }

    WidgetPopup.prototype.HideTimerCallback = function() {
        this.ButtonDiv.hide();
        this.HideTimerId = 0;
    }

    SAM.WidgetPopup = WidgetPopup;

})();





// cross hairs was created as an anchor for text.
// Just two lines that cross at a point.
// I am not goint to support line width, or fillColor.
// Shape seems to define lines in a loop, so I will create a loop for now.

(function () {
    "use strict";

    function CrossHairs() {
        SAM.Shape.call(this);
        this.Length = 50; // Length of the crosing lines
        this.Width = 1; // Width of the cross hair lines.
        this.Origin = [10000,10000]; // position in world coordinates.
        this.FillColor    = [0,0,0];
        this.OutlineColor = [1,1,1];
        this.PointBuffer = [];
    };
    CrossHairs.prototype = new SAM.Shape;

    CrossHairs.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    CrossHairs.prototype.UpdateBuffers = function() {
        this.PointBuffer = [];
        var cellData = [];
        var halfLength = (this.Length * 0.5) + 0.5;
        var halfWidth = (this.Width * 0.5) + 0.5;

        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfLength);
        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfLength);
        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(halfLength);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(halfLength);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfLength);
        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfLength);
        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(halfWidth);
        this.PointBuffer.push(-halfLength);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(-halfLength);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(-halfWidth);
        this.PointBuffer.push(0.0);

        cellData.push(1);
        cellData.push(2);
        cellData.push(7);

        cellData.push(1);
        cellData.push(7);
        cellData.push(8);

        cellData.push(4);
        cellData.push(5);
        cellData.push(10);

        cellData.push(4);
        cellData.push(10);
        cellData.push(11);

        if (GL) {
            this.VertexPositionBuffer = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.PointBuffer), GL.STATIC_DRAW);
            this.VertexPositionBuffer.itemSize = 3;
            this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

            this.CellBuffer = GL.createBuffer();
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), GL.STATIC_DRAW);
            this.CellBuffer.itemSize = 1;
            this.CellBuffer.numItems = cellData.length;
        }
    }


    SAM.CrossHairs = CrossHairs;

})();

(function () {
    "use strict";

    function Arrow() {
        SAM.Shape.call(this);
        this.Width = 10; // width of the shaft and size of the head
        this.Length = 50; // Length of the arrow in pixels
        this.Orientation = 45.0; // in degrees, counter clockwise, 0 is left
        this.Origin = [10000,10000]; // Tip position in world coordinates.
        this.OutlineColor = [0,0,0];
        this.ZOffset = -0.1;
    };
    Arrow.prototype = new SAM.Shape;


    Arrow.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    // Point origin is anchor and units pixels.
    Arrow.prototype.PointInShape = function(x, y) {
        // Rotate point so arrow lies along the x axis.
        var tmp = -(this.Orientation * Math.PI / 180.0);
        var ct = Math.cos(tmp);
        var st = Math.sin(tmp);
        var xNew =  x*ct + y*st;
        var yNew = -x*st + y*ct;
        tmp = this.Width / 2.0;
        // Had to bump the y detection up by 3x because of unclickability on the iPad.
        if (xNew > 0.0 && xNew < this.Length*1.3 && yNew < tmp*3 && yNew > -tmp*3) {
            return true;
        }
    }


    Arrow.prototype.UpdateBuffers = function() {
        this.PointBuffer = [];
        var cellData = [];
        var hw = this.Width * 0.5;
        var w2 = this.Width * 2.0;

        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        this.PointBuffer.push(0.0);
        this.PointBuffer.push(0.0);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(w2);
        this.PointBuffer.push(this.Width);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(w2);
        this.PointBuffer.push(hw);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(this.Length);
        this.PointBuffer.push(hw);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(this.Length);
        this.PointBuffer.push(-hw);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(w2);
        this.PointBuffer.push(-hw);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(w2);
        this.PointBuffer.push(-this.Width);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(0.0);
        this.PointBuffer.push(0.0);
        this.PointBuffer.push(0.0);

        if (GL) {
            // Now create the triangles
            cellData.push(0);
            cellData.push(1);
            cellData.push(2);

            cellData.push(0);
            cellData.push(2);
            cellData.push(5);

            cellData.push(0);
            cellData.push(5);
            cellData.push(6);

            cellData.push(2);
            cellData.push(3);
            cellData.push(4);

            cellData.push(2);
            cellData.push(4);
            cellData.push(5);

            this.VertexPositionBuffer = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.PointBuffer), GL.STATIC_DRAW);
            this.VertexPositionBuffer.itemSize = 3;
            this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

            this.CellBuffer = GL.createBuffer();
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), GL.STATIC_DRAW);
            this.CellBuffer.itemSize = 1;
            this.CellBuffer.numItems = cellData.length;
        }
    }

    SAM.Arrow = Arrow;

})();
//==============================================================================
// This widget will first be setup to define an arrow.
// Viewer will forward events to the arrow.
// TODO: I need to indicate that the base of the arrow has different active
// state than the rest.


(function () {
    "use strict";


    // The arrow has just been created and is following the mouse.
    // I have to differentiate from ARROW_WIDGET_DRAG because
    // dragging while just created cannot be relative.  It places the tip on the mouse.
    var ARROW_WIDGET_NEW = 0;
    var ARROW_WIDGET_DRAG = 1; // The whole arrow is being dragged.
    var ARROW_WIDGET_DRAG_TIP = 2;
    var ARROW_WIDGET_DRAG_TAIL = 3;
    var ARROW_WIDGET_WAITING = 4; // The normal (resting) state.
    var ARROW_WIDGET_ACTIVE = 5; // Mouse is over the widget and it is receiving events.
    var ARROW_WIDGET_PROPERTIES_DIALOG = 6; // Properties dialog is up


    // We might get rid of the new flag by passing in a null viewer.
    function ArrowWidget (viewer, newFlag) {
        if (viewer == null) {
            return null;
        }
        this.Viewer = viewer;

        // Wait to create this until the first move event.
        this.Shape = new Arrow();
        this.Shape.Origin = [0,0];
        this.Shape.SetFillColor([0.0, 0.0, 0.0]);
        this.Shape.OutlineColor = [1.0, 1.0, 1.0];
        this.Shape.Length = 50;
        this.Shape.Width = 8;
        // Note: If the user clicks before the mouse is in the
        // canvas, this will behave odd.
        this.TipPosition = [0,0];
        this.TipOffset = [0,0];

        if (viewer) {
            viewer.AddWidget(this);
            if (newFlag && viewer) {
                this.State = ARROW_WIDGET_NEW;
                this.Viewer.ActivateWidget(this);
                return;
            }
        }

        this.State = ARROW_WIDGET_WAITING;
    }

    ArrowWidget.prototype.Draw = function(view) {
        this.Shape.Draw(view);
    }


    ArrowWidget.prototype.RemoveFromViewer = function() {
        if (this.Viewer) {
            this.Viewer.RemoveWidget(this);
        }
    }

    ArrowWidget.prototype.Serialize = function() {
        if(this.Shape === undefined) {
            return null;
        }

        var obj = new Object();
        obj.type = "arrow";
        obj.origin = this.Shape.Origin
        obj.fillcolor = this.Shape.FillColor;
        obj.outlinecolor = this.Shape.OutlineColor;
        obj.length = this.Shape.Length;
        obj.width = this.Shape.Width;
        obj.orientation = this.Shape.Orientation;
        obj.fixedsize = this.Shape.FixedSize;
        obj.fixedorientation = this.Shape.FixedOrientation;

        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    ArrowWidget.prototype.Load = function(obj) {
        this.Shape.Origin = [parseFloat(obj.origin[0]), parseFloat(obj.origin[1])];
        this.Shape.FillColor = [parseFloat(obj.fillcolor[0]),parseFloat(obj.fillcolor[1]),parseFloat(obj.fillcolor[2])];
        this.Shape.OutlineColor = [parseFloat(obj.outlinecolor[0]),parseFloat(obj.outlinecolor[1]),parseFloat(obj.outlinecolor[2])];
        this.Shape.Length = parseFloat(obj.length);
        this.Shape.Width = parseFloat(obj.width);
        this.Shape.Orientation = parseFloat(obj.orientation);

        if (obj.fixedsize === undefined) {
            this.Shape.FixedSize = true;
        } else {
            this.Shape.FixedSize = (obj.fixedsize == "true");
        }

        if (obj.fixedorientation === undefined) {
            this.Shape.FixedOrientation = true;
        } else {
            this.Shape.FixedOrientation = (obj.fixedorientation == "true");
        }

        this.Shape.UpdateBuffers();
    }

    // When we toggle fixed size, we have to convert the length of the arrow
    // between viewer and world.
    ArrowWidget.prototype.SetFixedSize = function(fixedSizeFlag) {
        if (this.Shape.FixedSize == fixedSizeFlag) {
            return;
        }
        var pixelsPerUnit = this.Viewer.GetPixelsPerUnit();

        if (fixedSizeFlag) {
            // Convert length from world to viewer.
            this.Shape.Length *= pixelsPerUnit;
            this.Shape.Width *= pixelsPerUnit;
        } else {
            this.Shape.Length /= pixelsPerUnit;
            this.Shape.Width /= pixelsPerUnit;
        }
        this.Shape.FixedSize = fixedSizeFlag;
        this.Shape.UpdateBuffers();
        eventuallyRender();
    }


    ArrowWidget.prototype.HandleKeyPress = function(keyCode, shift) {
    }

    ArrowWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1)
        {
            return;
        }
        if (this.State == ARROW_WIDGET_NEW) {
            this.TipPosition = [this.Viewer.MouseX, this.Viewer.MouseY];
            this.State = ARROW_WIDGET_DRAG_TAIL;
        }
        if (this.State == ARROW_WIDGET_ACTIVE) {
            if (this.ActiveTail) {
                this.TipPosition = this.Viewer.ConvertPointWorldToViewer(this.Shape.Origin[0], this.Shape.Origin[1]);
                this.State = ARROW_WIDGET_DRAG_TAIL;
            } else {
                var tipPosition = this.Viewer.ConvertPointWorldToViewer(this.Shape.Origin[0], this.Shape.Origin[1]);
                this.TipOffset[0] = tipPosition[0] - this.Viewer.MouseX;
                this.TipOffset[1] = tipPosition[1] - this.Viewer.MouseY;
                this.State = ARROW_WIDGET_DRAG;
            }
        }
    }

    // returns false when it is finished doing its work.
    ArrowWidget.prototype.HandleMouseUp = function(event) {
        if (this.State == ARROW_WIDGET_ACTIVE && event.which == 3) {
            // Right mouse was pressed.
            // Pop up the properties dialog.
            // Which one should we popup?
            // Add a ShowProperties method to the widget. (With the magic of javascript).
            this.State = ARROW_WIDGET_PROPERTIES_DIALOG;
            this.ShowPropertiesDialog();
        } else if (this.State != ARROW_WIDGET_PROPERTIES_DIALOG) {
            this.SetActive(false);
        }
    }

    ArrowWidget.prototype.HandleMouseMove = function(event) {
        var x = this.Viewer.MouseX;
        var y = this.Viewer.MouseY;

        if (this.Viewer.MouseDown == false && this.State == ARROW_WIDGET_ACTIVE) {
            this.CheckActive(event);
            return;
        }

        if (this.State == ARROW_WIDGET_NEW || this.State == ARROW_WIDGET_DRAG) {
            var viewport = this.Viewer.GetViewport();
            this.Shape.Origin = this.Viewer.ConvertPointViewerToWorld(x+this.TipOffset[0], y+this.TipOffset[1]);
            eventuallyRender();
        }

        if (this.State == ARROW_WIDGET_DRAG_TAIL) {
            var dx = x-this.TipPosition[0];
            var dy = y-this.TipPosition[1];
            if ( ! this.Shape.FixedSize) {
                var pixelsPerUnit = this.Viewer.GetPixelsPerUnit();
                dx /= pixelsPerUnit;
                dy /= pixelsPerUnit;
            }
            this.Shape.Length = Math.sqrt(dx*dx + dy*dy);
            this.Shape.Orientation = Math.atan2(dy, dx) * 180.0 / Math.PI;
            this.Shape.UpdateBuffers();
            eventuallyRender();
        }

        if (this.State == ARROW_WIDGET_WAITING) {
            this.CheckActive(event);
        }
    }

    ArrowWidget.prototype.CheckActive = function(event) {
        var viewport = this.Viewer.GetViewport();
        var cam = this.Viewer.MainView.Camera;
        var m = cam.Matrix;
        // Compute tip point in screen coordinates.
        var x = this.Shape.Origin[0];
        var y = this.Shape.Origin[1];
        // Convert from world coordinate to view (-1->1);
        var h = (x*m[3] + y*m[7] + m[15]);
        var xNew = (x*m[0] + y*m[4] + m[12]) / h;
        var yNew = (x*m[1] + y*m[5] + m[13]) / h;
        // Convert from view to screen pixel coordinates.
        xNew = (xNew + 1.0)*0.5*viewport[2] + viewport[0];
        yNew = (yNew + 1.0)*0.5*viewport[3] + viewport[1];

        // Use this point as the origin.
        x = this.Viewer.MouseX - xNew;
        y = this.Viewer.MouseY - yNew;
        // Rotate so arrow lies along the x axis.
        var tmp = this.Shape.Orientation * Math.PI / 180.0;
        var ct = Math.cos(tmp);
        var st = Math.sin(tmp);
        xNew = x*ct + y*st;
        yNew = -x*st + y*ct;

        var length = this.Shape.Length;
        var halfWidth = this.Shape.Width / 2.0;
        if ( ! this.Shape.FixedSize) {
            var pixelsPerUnit = this.Viewer.GetPixelsPerUnit();
            length *= pixelsPerUnit;
            halfWidth *= pixelsPerUnit;
        }

        this.ActiveTail = false;
        if (xNew > 0.0 && xNew < length && yNew > -halfWidth && yNew < halfWidth) {
            this.SetActive(true);
            // Save the position along the arrow to decide which drag behavior to use.
            if (xNew > length - halfWidth) {
                this.ActiveTail = true;
            }
            return true;
        } else {
            this.SetActive(false);
            return false;
        }
    }

    // We have three states this widget is active.
    // First created and folloing the mouse (actually two, head or tail following). Color nbot active.
    // Active because mouse is over the arrow.  Color of arrow set to active.
    // Active because the properties dialog is up. (This is how dialog know which widget is being edited).
    ArrowWidget.prototype.GetActive = function() {
        if (this.State == ARROW_WIDGET_WAITING) {
            return false;
        }
        return true;
    }

    ArrowWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) {
            return;
        }

        if (flag) {
            this.State = ARROW_WIDGET_ACTIVE;
            this.Shape.Active = true;
            this.Viewer.ActivateWidget(this);
            eventuallyRender();
        } else {
            this.State = ARROW_WIDGET_WAITING;
            this.Shape.Active = false;
            this.Viewer.DeactivateWidget(this);
            eventuallyRender();
        }
    }

    // Can we bind the dialog apply callback to an objects method?
    var ARROW_WIDGET_DIALOG_SELF;
    ArrowWidget.prototype.ShowPropertiesDialog = function () {
        //var fs = document.getElementById("ArrowFixedSize");
        //fs.checked = this.Shape.FixedSize;

        var color = document.getElementById("arrowcolor");
        color.value = SAM.ConvertColorToHex(this.Shape.FillColor);

        var lengthLabel = document.getElementById("ArrowLength");
        //if (fs.checked) {
        //  lengthLabel.innerHTML = "Length: " + (this.Shape.Length).toFixed(2) + " pixels";
        //} else {
        //  lengthLabel.innerHTML = "Length: " + (this.Shape.Length).toFixed(2) + " units";
        //}

        ARROW_WIDGET_DIALOG_SELF = this;
        $("#arrow-properties-dialog").dialog("open");
    }

    // I need this because old schemes cannot use "Load"
    ArrowWidget.prototype.SetColor = function (hexColor) {
        this.Shape.SetFillColor(hexColor);
        eventuallyRender();
    }

    function ArrowPropertyDialogApply() {
        var widget = ARROW_WIDGET_DIALOG_SELF;
        if ( ! widget) {
            return;
        }

        var hexcolor = document.getElementById("arrowcolor").value;
        //var fixedSizeFlag = document.getElementById("ArrowFixedSize").checked;
        widget.Shape.SetFillColor(hexcolor);
        if (widget != null) {
            widget.SetActive(false);
            //widget.SetFixedSize(fixedSizeFlag);
        }
        eventuallyRender();
    }

    function ArrowPropertyDialogCancel() {
        var widget = ARROW_WIDGET_DIALOG_SELF;
        if (widget != null) {
            widget.SetActive(false);
        }
    }

    function ArrowPropertyDialogDelete() {
        var widget = ARROW_WIDGET_DIALOG_SELF;
        if (widget != null) {
            viewer.ActiveWidget = null;
            // We need to remove an item from a list.
            // shape list and widget list.
            widget.RemoveFromViewer();
            eventuallyRender();
        }
    }


    SAM.ArrowWidget = ArrowWidget;

})();





(function () {
    "use strict";

    function Circle() {
        SAM.Shape.call(this);
        this.Radius = 10; // Radius in pixels
        this.Origin = [10000,10000]; // Center in world coordinates.
        this.OutlineColor = [0,0,0];
        this.PointBuffer = [];
    };
    Circle.prototype = new SAM.Shape;


    // I know javascript does not have desctuctors.
    // I was thinking of calling this explicilty to hasten freeing of resources.
    Circle.prototype.destructor=function() {
        // Get rid of the buffers?
    }

    Circle.prototype.UpdateBuffers = function() {
        this.PointBuffer = [];
        var cellData = [];
        var lineCellData = [];
        var numEdges = Math.floor(this.Radius/2)+10;
        // NOTE: numEdges logic will not work in world coordinates.
        // Limit numEdges to 180 to mitigate this issue.
        if (numEdges > 50 || ! this.FixedSize ) {
            numEdges = 50;
        }

        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        if  (GL) {
            if (this.LineWidth == 0) {
                for (var i = 0; i <= numEdges; ++i) {
                    var theta = i*2*3.14159265359/numEdges;
                    this.PointBuffer.push(this.Radius*Math.cos(theta));
                    this.PointBuffer.push(this.Radius*Math.sin(theta));
                    this.PointBuffer.push(0.0);
                }

                // Now create the triangles
                // It would be nice to have a center point,
                // but this would mess up the outline.
                for (var i = 2; i < numEdges; ++i) {
                    cellData.push(0);
                    cellData.push(i-1);
                    cellData.push(i);
                }

                this.VertexPositionBuffer = GL.createBuffer();
                GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
                GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.PointBuffer), GL.STATIC_DRAW);
                this.VertexPositionBuffer.itemSize = 3;
                this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

                this.CellBuffer = GL.createBuffer();
                GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
                GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), GL.STATIC_DRAW);
                this.CellBuffer.itemSize = 1;
                this.CellBuffer.numItems = cellData.length;
            } else {
                //var minRad = this.Radius - (this.LineWidth/2.0);
                //var maxRad = this.Radius + (this.LineWidth/2.0);
                var minRad = this.Radius;
                var maxRad = this.Radius + this.LineWidth;
                for (var i = 0; i <= numEdges; ++i) {
                    var theta = i*2*3.14159265359/numEdges;
                    this.PointBuffer.push(minRad*Math.cos(theta));
                    this.PointBuffer.push(minRad*Math.sin(theta));
                    this.PointBuffer.push(0.0);
                    this.PointBuffer.push(maxRad*Math.cos(theta));
                    this.PointBuffer.push(maxRad*Math.sin(theta));
                    this.PointBuffer.push(0.0);
                }
                this.VertexPositionBuffer = GL.createBuffer();
                GL.bindBuffer(GL.ARRAY_BUFFER, this.VertexPositionBuffer);
                GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.PointBuffer), GL.STATIC_DRAW);
                this.VertexPositionBuffer.itemSize = 3;
                this.VertexPositionBuffer.numItems = this.PointBuffer.length / 3;

                // Now create the fill triangles
                // It would be nice to have a center point,
                // but this would mess up the outline.
                for (var i = 2; i < numEdges; ++i) {
                    cellData.push(0);
                    cellData.push((i-1)*2);
                    cellData.push(i*2);
                }
                this.CellBuffer = GL.createBuffer();
                GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
                GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), GL.STATIC_DRAW);
                this.CellBuffer.itemSize = 1;
                this.CellBuffer.numItems = cellData.length;

                // Now the thick line
                for (var i = 0; i < numEdges; ++i) {
                    lineCellData.push(0 + i*2);
                    lineCellData.push(1 + i*2);
                    lineCellData.push(2 + i*2);
                    lineCellData.push(1 + i*2);
                    lineCellData.push(3 + i*2);
                    lineCellData.push(2 + i*2);
                }
                this.LineCellBuffer = GL.createBuffer();
                GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.LineCellBuffer);
                GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineCellData), GL.STATIC_DRAW);
                this.LineCellBuffer.itemSize = 1;
                this.LineCellBuffer.numItems = lineCellData.length;
            }
        } else {
            for (var i = 0; i <= numEdges; ++i) {
                var theta = i*2*3.14159265359/numEdges;
                this.PointBuffer.push(this.Radius*Math.cos(theta));
                this.PointBuffer.push(this.Radius*Math.sin(theta));
                this.PointBuffer.push(0.0);
            }
        }
    }

    SAM.Circle = Circle;

})();

(function () {
    "use strict";

    //==============================================================================
    // Mouse down defined the center.
    // Drag defines the radius.


    // The circle has just been created and is following the mouse.
    // I can probably merge this state with drag. (mouse up vs down though)
    var CIRCLE_WIDGET_NEW_HIDDEN = 0;
    var CIRCLE_WIDGET_NEW_DRAGGING = 1;
    var CIRCLE_WIDGET_DRAG = 2; // The whole arrow is being dragged.
    var CIRCLE_WIDGET_DRAG_RADIUS = 3;
    var CIRCLE_WIDGET_WAITING = 4; // The normal (resting) state.
    var CIRCLE_WIDGET_ACTIVE = 5; // Mouse is over the widget and it is receiving events.
    var CIRCLE_WIDGET_PROPERTIES_DIALOG = 6; // Properties dialog is up

    function CircleWidget (layer, newFlag) {
        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a circle.
        this.Dialog.Title.text('Circle Annotation Editor');
        this.Dialog.Body.css({'margin':'1em 2em'});
        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .css({'height':'24px'})
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .addClass("sa-view-annotation-modal-input");

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .addClass("sa-view-annotation-modal-input")
            .keypress(function(event) { return event.keyCode != 13; });

        // Area
        this.Dialog.AreaDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.AreaLabel =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .text("Area:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.Area =
            $('<div>')
            .appendTo(this.Dialog.AreaDiv)
            .addClass("sa-view-annotation-modal-input");

        // Get default properties.
        if (localStorage.CircleWidgetDefaults) {
            var defaults = JSON.parse(localStorage.CircleWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
            }
            if (defaults.LineWidth) {
                this.Dialog.LineWidthInput.val(defaults.LineWidth);
            }
        }

        this.Tolerance = 0.05;
        if (MOBILE_DEVICE) {
            this.Tolerance = 0.1;
        }

        if (layer == null) {
            return;
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        var cam = layer.GetCamera();
        var viewport = layer.GetViewport();
        this.Shape = new SAM.Circle();
        this.Shape.Origin = [0,0];
        this.Shape.OutlineColor = [0.0,0.0,0.0];
        this.Shape.SetOutlineColor(this.Dialog.ColorInput.val());
        this.Shape.Radius = 50*cam.Height/viewport[3];
        this.Shape.LineWidth = 5.0*cam.Height/viewport[3];
        this.Shape.FixedSize = false;

        this.Layer.AddWidget(this);

        // Note: If the user clicks before the mouse is in the
        // canvas, this will behave odd.

        if (newFlag) {
            this.State = CIRCLE_WIDGET_NEW_HIDDEN;
            this.Layer.ActivateWidget(this);
            return;
        }

        this.State = CIRCLE_WIDGET_WAITING;
    }

    CircleWidget.prototype.Draw = function(view) {
        if ( this.State != CIRCLE_WIDGET_NEW_HIDDEN) {
            this.Shape.Draw(view);
        }
    }

    // This needs to be put in the Viewer.
    //CircleWidget.prototype.RemoveFromViewer = function() {
    //    if (this.Viewer) {
    //        this.Viewer.RemoveWidget(this);
    //    }
    //}

    //CircleWidget.prototype.PasteCallback = function(data, mouseWorldPt) {
    //    this.Load(data);
    //    // Place the widget over the mouse.
    //    // This would be better as an argument.
    //    this.Shape.Origin = [mouseWorldPt[0], mouseWorldPt[1]];
    //    this.Layer.EventuallyDraw();
    //}

    CircleWidget.prototype.Serialize = function() {
        if(this.Shape === undefined){ return null; }
        var obj = new Object();
        obj.type = "circle";
        obj.origin = this.Shape.Origin;
        obj.outlinecolor = this.Shape.OutlineColor;
        obj.radius = this.Shape.Radius;
        obj.linewidth = this.Shape.LineWidth;
        obj.creation_camera = this.CreationCamera;
        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    CircleWidget.prototype.Load = function(obj) {
        this.Shape.Origin[0] = parseFloat(obj.origin[0]);
        this.Shape.Origin[1] = parseFloat(obj.origin[1]);
        this.Shape.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
        this.Shape.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
        this.Shape.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
        this.Shape.Radius = parseFloat(obj.radius);
        this.Shape.LineWidth = parseFloat(obj.linewidth);
        this.Shape.FixedSize = false;
        this.Shape.UpdateBuffers();

        // How zoomed in was the view when the annotation was created.
        if (obj.creation_camera !== undefined) {
            this.CreationCamera = obj.CreationCamera;
        }
    }

    CircleWidget.prototype.HandleMouseWheel = function(event) {
        // TODO: Scale the radius.
        return false;
    }

    CircleWidget.prototype.HandleKeyDown = function(keyCode) {
        // The dialog consumes all key events.
        if (this.State == CIRCLE_WIDGET_PROPERTIES_DIALOG) {
            return false;
        }

        // Copy
        if (event.keyCode == 67 && event.ctrlKey) {
            // control-c for copy
            // The extra identifier is not needed for widgets, but will be
            // needed if we have some other object on the clipboard.
            var clip = {Type:"CircleWidget", Data: this.Serialize()};
            localStorage.ClipBoard = JSON.stringify(clip);
            return false;
        }

        return true;
    }

    CircleWidget.prototype.HandleDoubleClick = function(event) {
        ShowPropertiesDialog();
        return false;
    }

    CircleWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1) {
            return false;
        }
        var cam = this.Layer.GetCamera();
        if (this.State == CIRCLE_WIDGET_NEW_DRAGGING) {
            // We need the viewer position of the circle center to drag radius.
            this.OriginViewer =
                cam.ConvertPointWorldToViewer(this.Shape.Origin[0],
                                              this.Shape.Origin[1]);
            this.State = CIRCLE_WIDGET_DRAG_RADIUS;
        }
        if (this.State == CIRCLE_WIDGET_ACTIVE) {
            // Determine behavior from active radius.
            if (this.NormalizedActiveDistance < 0.5) {
                this.State = CIRCLE_WIDGET_DRAG;
            } else {
                this.OriginViewer =
                    cam.ConvertPointWorldToViewer(this.Shape.Origin[0],
                                                  this.Shape.Origin[1]);
                this.State = CIRCLE_WIDGET_DRAG_RADIUS;
            }
        }
        return false;
    }

    // returns false when it is finished doing its work.
    CircleWidget.prototype.HandleMouseUp = function(event) {
        if ( this.State == CIRCLE_WIDGET_DRAG ||
             this.State == CIRCLE_WIDGET_DRAG_RADIUS) {
            this.SetActive(false);
            RecordState();
        }
        return false;
    }

    CircleWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 0 && this.State == CIRCLE_WIDGET_ACTIVE) {
            this.SetActive(this.CheckActive(event));
            return false;
        }

        var cam = this.Layer.GetCamera();
        if (this.State == CIRCLE_WIDGET_NEW_HIDDEN) {
            this.State = CIRCLE_WIDGET_NEW_DRAGGING;
        }
        if (this.State == CIRCLE_WIDGET_NEW_DRAGGING || this.State == CIRCLE_WIDGET_DRAG) {
            if (SA && SA.NotesWidget) {SA.NotesWidget.MarkAsModified();} // hack
            this.Shape.Origin = cam.ConvertPointViewerToWorld(x, y);
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        }

        if (this.State == CIRCLE_WIDGET_DRAG_RADIUS) {
            var viewport = this.Layer.GetViewport();
            var cam = this.Layer.GetCamera();
            var dx = x-this.OriginViewer[0];
            var dy = y-this.OriginViewer[1];
            // Change units from pixels to world.
            this.Shape.Radius = Math.sqrt(dx*dx + dy*dy) * cam.Height / viewport[3];
            this.Shape.UpdateBuffers();
            if (SA && SA.NotesWidget) {SA.NotesWidget.MarkAsModified();} // hack
            this.PlacePopup();
            this.Layer.EventuallyDraw();
        }

        if (this.State == CIRCLE_WIDGET_WAITING) {
            this.CheckActive(event);
        }
        return false;
    }

    CircleWidget.prototype.HandleTouchPan = function(event) {
        var cam = this.Layer.GetCamera();
        // TODO: Last mouse should net be in layer.
        w0 = cam.ConvertPointViewerToWorld(this.Layer.LastMouseX,
                                           this.Layer.LastMouseY);
        w1 = cam.ConvertPointViewerToWorld(event.offsetX,event.offsetY);

        // This is the translation.
        var dx = w1[0] - w0[0];
        var dy = w1[1] - w0[1];

        this.Shape.Origin[0] += dx;
        this.Shape.Origin[1] += dy;
        this.Layer.EventuallyDraw();
        return false;
    }

    CircleWidget.prototype.HandleTouchPinch = function(event) {
        this.Shape.Radius *= event.PinchScale;
        this.Shape.UpdateBuffers();
        if (SA && SA.NotesWidget) {SA.NotesWidget.MarkAsModified();} // hack
        this.Layer.EventuallyDraw();
        return false;
    }

    CircleWidget.prototype.HandleTouchEnd = function(event) {
        this.SetActive(false);
        return false
    }


    CircleWidget.prototype.CheckActive = function(event) {
        if (this.State == CIRCLE_WIDGET_NEW_HIDDEN ||
            this.State == CIRCLE_WIDGET_NEW_DRAGGING) {
            return true;
        }

        var dx = event.offsetX;
        var dy = event.offsetY;

        // change dx and dy to vector from center of circle.
        if (this.FixedSize) {
            dx = event.offsetX - this.Shape.Origin[0];
            dy = event.offsetY - this.Shape.Origin[1];
        } else {
            dx = event.worldX - this.Shape.Origin[0];
            dy = event.worldY - this.Shape.Origin[1];
        }

        var d = Math.sqrt(dx*dx + dy*dy)/this.Shape.Radius;
        var active = false;
        var lineWidth = this.Shape.LineWidth / this.Shape.Radius;
        this.NormalizedActiveDistance = d;

        if (this.Shape.FillColor == undefined) { // Circle
            if ((d < (1.0+ this.Tolerance +lineWidth) && d > (1.0-this.Tolerance)) ||
                d < (this.Tolerance+lineWidth)) {
                active = true;
            }
        } else { // Disk
            if (d < (1.0+this.Tolerance+lineWidth) && d > (this.Tolerance+lineWidth) ||
                d < lineWidth) {
                active = true;
            }
        }

        return active;
    }

    // Multiple active states. Active state is a bit confusing.
    CircleWidget.prototype.GetActive = function() {
        if (this.State == CIRCLE_WIDGET_WAITING) {
            return false;
        }
        return true;
    }

    CircleWidget.prototype.Deactivate = function() {
        // If the circle button is clicked to deactivate the widget before
        // it is placed, I want to delete it. (like cancel). I think this
        // will do the trick.
        if (this.State == CIRCLE_WIDGET_NEW_HIDDEN) {
            this.Layer.RemoveWidget(this);
            return;
        }

        this.Popup.StartHideTimer();
        this.State = CIRCLE_WIDGET_WAITING;
        this.Shape.Active = false;
        this.Layer.DeactivateWidget(this);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    CircleWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) {
            return;
        }

        if (flag) {
            this.State = CIRCLE_WIDGET_ACTIVE;
            this.Shape.Active = true;
            this.Layer.ActivateWidget(this);
            this.Layer.EventuallyDraw();
            // Compute the location for the pop up and show it.
            this.PlacePopup();
        } else {
            this.Deactivate();
        }
        this.Layer.EventuallyDraw();
    }


    //This also shows the popup if it is not visible already.
    CircleWidget.prototype.PlacePopup = function () {
        // Compute the location for the pop up and show it.
        var cam = this.Layer.GetCamera();
        var roll = cam.Roll;
        var x = this.Shape.Origin[0] + 0.8 * this.Shape.Radius * (Math.cos(roll) - Math.sin(roll));
        var y = this.Shape.Origin[1] - 0.8 * this.Shape.Radius * (Math.cos(roll) + Math.sin(roll));
        var pt = cam.ConvertPointWorldToViewer(x, y);
        this.Popup.Show(pt[0],pt[1]);
    }

    // Can we bind the dialog apply callback to an objects method?
    var CIRCLE_WIDGET_DIALOG_SELF;
    CircleWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Shape.OutlineColor));

        this.Dialog.LineWidthInput.val((this.Shape.LineWidth).toFixed(2));

        var area = (2.0*Math.PI*this.Shape.Radius*this.Shape.Radius) * 0.25 * 0.25;
        var areaString = "";
        if (this.Shape.FixedSize) {
            areaString += area.toFixed(2);
            areaString += " pixels^2";
        } else {
            if (area > 1000000) {
                areaString += (area/1000000).toFixed(2);
                areaString += " mm^2";
            } else {
                areaString += area.toFixed(2);
                areaString += " um^2";
            }
        }
        this.Dialog.Area.text(areaString);

        this.Dialog.Show(true);
    }

    CircleWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.Shape.SetOutlineColor(hexcolor);
        this.Shape.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Shape.UpdateBuffers();
        this.SetActive(false);
        RecordState();

        // TODO: See if anything has changed.
        this.Layer.EventuallyDraw();

        localStorage.CircleWidgetDefaults = JSON.stringify({Color: hexcolor, LineWidth: this.Shape.LineWidth});
        if (SA && SA.NotesWidget) {SA.NotesWidget.MarkAsModified();} // hack
    }


    SAM.CircleWidget = CircleWidget;

})();

// Since there is already a rectangle widget (for axis aligned rectangle)
// renaming this as Rect, other possible name is OrientedRectangle

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    var NEW = 0;
    var DRAG = 1; // The whole arrow is being dragged.
    var DRAG_RADIUS = 2;
    var WAITING = 3; // The normal (resting) state.
    var ACTIVE = 4; // Mouse is over the widget and it is receiving events.
    var PROPERTIES_DIALOG = 5; // Properties dialog is up


    function Rect() {
        SAM.Shape.call(this);

        this.Width = 20.0;
        this.Length = 50.0;
        this.Radius = 60;
        this.Orientation = 90; // Angle with respect to x axis ?
        this.Origin = [10000,10000]; // Center in world coordinates.
        this.OutlineColor = [0,0,0];
        this.PointBuffer = [];
    }

    Rect.prototype = new SAM.Shape();

    Rect.prototype.destructor=function() {
        // Get rid of the buffers?
    };

    Rect.prototype.UpdateBuffers = function() {
        this.PointBuffer = [];

        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);
        mat4.rotateZ(this.Matrix, this.Orientation / 180.0 * 3.14159);

        this.PointBuffer.push(1 *this.Width / 2.0);
        this.PointBuffer.push(1 *this.Length / 2.0);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-1 *this.Width / 2.0);
        this.PointBuffer.push(1 *this.Length / 2.0);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(-1 *this.Width / 2.0);
        this.PointBuffer.push(-1 *this.Length / 2.0);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(1 *this.Width / 2.0);
        this.PointBuffer.push(-1 *this.Length / 2.0);
        this.PointBuffer.push(0.0);

        this.PointBuffer.push(1 *this.Width / 2.0);
        this.PointBuffer.push(1 *this.Length / 2.0);
        this.PointBuffer.push(0.0);
    };



    function RectWidget (viewer, newFlag) {
      this.Dialog = new SAM.Dialog(this);
      // Customize dialog for a circle.
      this.Dialog.Title.text('Rect Annotation Editor');
      // Color
      this.Dialog.ColorDiv =
        $('<div>')
          .appendTo(this.Dialog.Body)
          .css({'display':'table-row'});
      this.Dialog.ColorLabel =
        $('<div>')
          .appendTo(this.Dialog.ColorDiv)
          .text("Color:")
          .css({'display':'table-cell',
                'text-align': 'left'});
      this.Dialog.ColorInput =
        $('<input type="color">')
          .appendTo(this.Dialog.ColorDiv)
          .val('#30ff00')
          .css({'display':'table-cell'});

      // Line Width
      this.Dialog.LineWidthDiv =
        $('<div>')
          .appendTo(this.Dialog.Body)
          .css({'display':'table-row'});
      this.Dialog.LineWidthLabel =
        $('<div>')
          .appendTo(this.Dialog.LineWidthDiv)
          .text("Line Width:")
          .css({'display':'table-cell',
                'text-align': 'left'});
      this.Dialog.LineWidthInput =
        $('<input type="number">')
          .appendTo(this.Dialog.LineWidthDiv)
          .css({'display':'table-cell'})
          .keypress(function(event) { return event.keyCode != 13; });

      // Area
      this.Dialog.AreaDiv =
        $('<div>')
          .appendTo(this.Dialog.Body)
          .css({'display':'table-row'});
      this.Dialog.AreaLabel =
        $('<div>')
          .appendTo(this.Dialog.AreaDiv)
          .text("Area:")
          .css({'display':'table-cell',
                'text-align': 'left'});
      this.Dialog.Area =
        $('<div>')
          .appendTo(this.Dialog.AreaDiv)
          .css({'display':'table-cell'});

      // Get default properties.
      if (localStorage.RectWidgetDefaults) {
        var defaults = JSON.parse(localStorage.RectWidgetDefaults);
        if (defaults.Color) {
          this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
        }
        if (defaults.LineWidth) {
          this.Dialog.LineWidthInput.val(defaults.LineWidth);
        }
      }

      this.Tolerance = 0.05;
      if (MOBILE_DEVICE) {
        this.Tolerance = 0.1;
      }

      if (viewer === null) {
        return;
      }

      // Lets save the zoom level (sort of).
      // Load will overwrite this for existing annotations.
      // This will allow us to expand annotations into notes.
      this.CreationCamera = viewer.GetCamera().Serialize();

      this.Viewer = viewer;
      this.Popup = new SAM.WidgetPopup(this);
      var cam = viewer.MainView.Camera;
      var viewport = viewer.MainView.Viewport;
      this.Shape = new Rect();
      this.Shape.Origin = [0,0];
      this.Shape.OutlineColor = [0.0,0.0,0.0];
      this.Shape.SetOutlineColor(this.Dialog.ColorInput.val());
      this.Shape.Length = 50.0*cam.Height/viewport[3];
      this.Shape.Width = 30*cam.Height/viewport[3];
      this.Shape.Radius = 50*cam.Height/viewport[3];
      this.Shape.LineWidth = 5.0*cam.Height/viewport[3];
      this.Shape.FixedSize = false;

      this.Viewer.AddWidget(this);

      // Note: If the user clicks before the mouse is in the
      // canvas, this will behave odd.

      if (newFlag) {
        this.State = NEW;
        this.Viewer.ActivateWidget(this);
        return;
      }

      this.State = WAITING;

    }

    RectWidget.prototype.Draw = function(view) {
       this.Shape.Draw(view);
    };

    // This needs to be put in the Viewer.
    RectWidget.prototype.RemoveFromViewer = function() {
        if (this.Viewer) {
            this.Viewer.RemoveWidget(this);
        }
    };

    RectWidget.prototype.PasteCallback = function(data, mouseWorldPt) {
      this.Load(data);
      // Place the widget over the mouse.
      // This would be better as an argument.
      this.Shape.Origin = [mouseWorldPt[0], mouseWorldPt[1]];
      eventuallyRender();
    };

    RectWidget.prototype.Serialize = function() {
      if(this.Shape === undefined){ return null; }
      var obj = {};
      obj.type = "rect";
      obj.origin = this.Shape.Origin;
      obj.outlinecolor = this.Shape.OutlineColor;
      obj.radius = this.Shape.Radius;
      obj.length = this.Shape.Length;
      obj.width = this.Shape.Width;
      obj.orientation = this.Shape.Orientation;
      obj.linewidth = this.Shape.LineWidth;
      obj.creation_camera = this.CreationCamera;
      return obj;
    };

    // Load a widget from a json object (origin MongoDB).
    RectWidget.prototype.Load = function(obj) {
        this.Shape.Origin[0] = parseFloat(obj.origin[0]);
        this.Shape.Origin[1] = parseFloat(obj.origin[1]);
        this.Shape.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
        this.Shape.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
        this.Shape.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
        this.Shape.Radius = parseFloat(obj.radius);
        this.Shape.Width = parseFloat(obj.width);
        this.Shape.Length = parseFloat(obj.length);
        this.Shape.Orientation = parseFloat(obj.orientation);
        this.Shape.LineWidth = parseFloat(obj.linewidth);
        this.Shape.FixedSize = false;
        this.Shape.UpdateBuffers();

        // How zoomed in was the view when the annotation was created.
        if (obj.creation_camera !== undefined) {
            this.CreationCamera = obj.CreationCamera;
        }
    };

    RectWidget.prototype.HandleKeyPress = function(keyCode, shift) {
      // The dialog consumes all key events.
      if (this.State == PROPERTIES_DIALOG) {
          return false;
      }

      // Copy
      if (event.keyCode == 67 && event.ctrlKey) {
        // control-c for copy
        // The extra identifier is not needed for widgets, but will be
        // needed if we have some other object on the clipboard.
        var clip = {Type:"RectWidget", Data: this.Serialize()};
        localStorage.ClipBoard = JSON.stringify(clip);
        return false;
      }

      return true;
    };

    RectWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    };

    RectWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1) {
            return false;
        }
        if (this.State == NEW) {
            // We need the viewer position of the circle center to drag radius.
            this.OriginViewer =
                this.Viewer.ConvertPointWorldToViewer(this.Shape.Origin[0],
                                                      this.Shape.Origin[1]);
            this.State = DRAG_RADIUS;
        }
        if (this.State == ACTIVE) {
            // Determine behavior from active radius.
            if (this.NormalizedActiveDistance < 0.5) {
                this.State = DRAG;
            } else {
                this.OriginViewer =
                    this.Viewer.ConvertPointWorldToViewer(this.Shape.Origin[0],
                                                          this.Shape.Origin[1]);
                this.State = DRAG_RADIUS;
            }
        }
        return true;
    };

    // returns false when it is finished doing its work.
    RectWidget.prototype.HandleMouseUp = function(event) {
        if ( this.State == DRAG || this.State == DRAG_RADIUS) {
            this.SetActive(false);
            RecordState();
        }
    };

    RectWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which === 0 && this.State == ACTIVE) {
            this.CheckActive(event);
            return;
        }

        if (this.State == NEW || this.State == DRAG) {
            this.Shape.Origin = this.Viewer.ConvertPointViewerToWorld(x, y);
            this.PlacePopup();
            eventuallyRender();
        }

        if (this.State == DRAG_RADIUS) {
            var viewport = this.Viewer.GetViewport();
            var cam = this.Viewer.MainView.Camera;
            var dx = x-this.OriginViewer[0];
            var dy = y-this.OriginViewer[1];
            // Change units from pixels to world.
            this.Shape.Radius = Math.sqrt(dx*dx + dy*dy) * cam.Height / viewport[3];
            this.Shape.UpdateBuffers();
            this.PlacePopup();
            eventuallyRender();
        }

        if (this.State == WAITING) {
            this.CheckActive(event);
        }
    };



    RectWidget.prototype.HandleMouseWheel = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (this.State == ACTIVE) {
            if(this.NormalizedActiveDistance < 0.5) {
                var ratio = 1.05;
                var direction = 1;
                if(event.wheelDelta < 0) {
                     ratio = 0.95;
                    direction = -1;
                }
                if(event.shiftKey) {
                    this.Shape.Length = this.Shape.Length * ratio;
                }
                if(event.ctrlKey) {
                    this.Shape.Width = this.Shape.Width * ratio;
                }
                if(!event.shiftKey && !event.ctrlKey) {
                    this.Shape.Orientation = this.Shape.Orientation + 3 * direction;
                 }

                this.Shape.UpdateBuffers();
                this.PlacePopup();
                eventuallyRender();
            }
        }
    };


    RectWidget.prototype.HandleTouchPan = function(event) {
      w0 = this.Viewer.ConvertPointViewerToWorld(EVENT_MANAGER.LastMouseX,
                                                 EVENT_MANAGER.LastMouseY);
      w1 = this.Viewer.ConvertPointViewerToWorld(event.offsetX,event.offsetY);

      // This is the translation.
      var dx = w1[0] - w0[0];
      var dy = w1[1] - w0[1];

      this.Shape.Origin[0] += dx;
      this.Shape.Origin[1] += dy;
      eventuallyRender();
    };


    RectWidget.prototype.HandleTouchPinch = function(event) {
      this.Shape.Radius *= event.PinchScale;
      this.Shape.UpdateBuffers();
      eventuallyRender();
    };

    RectWidget.prototype.HandleTouchEnd = function(event) {
      this.SetActive(false);
    };


    RectWidget.prototype.CheckActive = function(event) {
      var x = event.offsetX;
      var y = event.offsetY;
      var dx, dy;
      // change dx and dy to vector from center of circle.
      if (this.FixedSize) {
        dx = event.offsetX - this.Shape.Origin[0];
        dy = event.offsetY - this.Shape.Origin[1];
      } else {
        dx = event.worldX - this.Shape.Origin[0];
        dy = event.worldY - this.Shape.Origin[1];
      }

      var d = Math.sqrt(dx*dx + dy*dy)/this.Shape.Radius;
      var active = false;
      var lineWidth = this.Shape.LineWidth / this.Shape.Radius;
      this.NormalizedActiveDistance = d;

      if (this.Shape.FillColor === undefined) { // Circle
        if ((d < (1.0+ this.Tolerance +lineWidth) && d > (1.0-this.Tolerance)) ||
             d < (this.Tolerance+lineWidth)) {
          active = true;
        }
      } else { // Disk
        if (d < (1.0+this.Tolerance+lineWidth) && d > (this.Tolerance+lineWidth) ||
            d < lineWidth) {
          active = true;
        }
      }

      this.SetActive(active);
      return active;
    };

    // Multiple active states. Active state is a bit confusing.
    RectWidget.prototype.GetActive = function() {
      if (this.State == WAITING) {
        return false;
      }
      return true;
    };


    RectWidget.prototype.Deactivate = function() {
        this.Popup.StartHideTimer();
        this.State = WAITING;
        this.Shape.Active = false;
        this.Viewer.DeactivateWidget(this);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        eventuallyRender();
    };

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    RectWidget.prototype.SetActive = function(flag) {
      if (flag == this.GetActive()) {
        return;
      }

      if (flag) {
        this.State = ACTIVE;
        this.Shape.Active = true;
        this.Viewer.ActivateWidget(this);
        eventuallyRender();
        // Compute the location for the pop up and show it.
        this.PlacePopup();
      } else {
        this.Deactivate();
      }
      eventuallyRender();
    };


    //This also shows the popup if it is not visible already.
    RectWidget.prototype.PlacePopup = function () {
      // Compute the location for the pop up and show it.
      var roll = this.Viewer.GetCamera().Roll;
      var x = this.Shape.Origin[0] + 0.8 * this.Shape.Radius * (Math.cos(roll) - Math.sin(roll));
      var y = this.Shape.Origin[1] - 0.8 * this.Shape.Radius * (Math.cos(roll) + Math.sin(roll));
      var pt = this.Viewer.ConvertPointWorldToViewer(x, y);
      this.Popup.Show(pt[0],pt[1]);
    };

    // Can we bind the dialog apply callback to an objects method?
    var DIALOG_SELF;

    RectWidget.prototype.ShowPropertiesDialog = function () {
      this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Shape.OutlineColor));

      this.Dialog.LineWidthInput.val((this.Shape.LineWidth).toFixed(2));

      var area = (2.0*Math.PI*this.Shape.Radius*this.Shape.Radius) * 0.25 * 0.25;
      var areaString = "";
      if (this.Shape.FixedSize) {
          areaString += area.toFixed(2);
          areaString += " pixels^2";
      } else {
          if (area > 1000000) {
              areaString += (area/1000000).toFixed(2);
              areaString += " mm^2";
          } else {
              areaString += area.toFixed(2);
              areaString += " um^2";
          }
      }
      this.Dialog.Area.text(areaString);

      this.Dialog.Show(true);
    };


    RectWidget.prototype.DialogApplyCallback = function() {
      var hexcolor = this.Dialog.ColorInput.val();
      this.Shape.SetOutlineColor(hexcolor);
      this.Shape.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
      this.Shape.UpdateBuffers();
      this.SetActive(false);
      RecordState();
      eventuallyRender();

      localStorage.RectWidgetDefaults = JSON.stringify({Color: hexcolor, LineWidth: this.Shape.LineWidth});
    };

    SAM.RectWidget = RectWidget;

})();

(function () {
    "use strict";

    var NEW = 0;
    var WAITING = 3; // The normal (resting) state.
    var ACTIVE = 4; // Mouse is over the widget and it is receiving events.
    var PROPERTIES_DIALOG = 5; // Properties dialog is up

    var DRAG = 6;
    var DRAG_LEFT = 7;
    var DRAG_RIGHT = 8;
    var DRAG_TOP = 9;
    var DRAG_BOTTOM = 10;
    var ROTATE = 11;
    // Worry about corners later.

    function Grid() {
        SAM.Shape.call(this);
        // Dimension of grid bin
        this.BinWidth = 20.0;
        this.BinHeight = 20.0;
        // Number of grid bins in x and y
        this.Dimensions = [10,8];
        this.Orientation = 0; // Angle with respect to x axis ?
        this.Origin = [10000,10000]; // middle.
        this.OutlineColor = [0,0,0];
        this.PointBuffer = [];
        this.ActiveIndex = undefined;
    };

    Grid.prototype = new SAM.Shape();

    Grid.prototype.destructor=function() {
        // Get rid of the buffers?
    };

    Grid.prototype.UpdateBuffers = function() {
        // TODO: Having a single poly line for a shape is to simple.
        // Add cell arrays.
        this.PointBuffer = [];

        // Matrix is computed by the draw method in Shape superclass.
        // TODO: Used to detect first initialization.
        // Get this out of this method.
        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);
        //mat4.rotateZ(this.Matrix, this.Orientation / 180.0 * 3.14159);

        if (this.Dimensions[0] < 1 || this.Dimensions[1] < 1 ||
            this.BinWidth <= 0.0 || this.BinHeight <= 0.0) {
            return;
        }

        var totalWidth = this.BinWidth * this.Dimensions[0];
        var totalHeight = this.BinHeight * this.Dimensions[1];
        var halfWidth = totalWidth / 2;
        var halfHeight = totalHeight / 2;

        // Draw all of the x polylines.
        var x = this.Dimensions[1]%2 ? 0 : totalWidth;
        var y = 0;
        this.PointBuffer.push(x-halfWidth);
        this.PointBuffer.push(y-halfHeight);
        this.PointBuffer.push(0.0);

        for (var i = 0; i < this.Dimensions[1]; ++i) {
            //shuttle back and forth.
            x = x ? 0 : totalWidth;
            this.PointBuffer.push(x-halfWidth);
            this.PointBuffer.push(y-halfHeight);
            this.PointBuffer.push(0.0);
            y += this.BinHeight;
            this.PointBuffer.push(x-halfWidth);
            this.PointBuffer.push(y-halfHeight);
            this.PointBuffer.push(0.0);
        }
        //shuttle back and forth.
        x = x ? 0 : totalWidth;
        this.PointBuffer.push(x-halfWidth);
        this.PointBuffer.push(y-halfHeight);
        this.PointBuffer.push(0.0);

        // Draw all of the y lines.
        for (var i = 0; i < this.Dimensions[0]; ++i) {
            //shuttle up and down.
            y = y ? 0 : totalHeight;
            this.PointBuffer.push(x-halfWidth);
            this.PointBuffer.push(y-halfHeight);
            this.PointBuffer.push(0.0);
            x += this.BinWidth;
            this.PointBuffer.push(x-halfWidth);
            this.PointBuffer.push(y-halfHeight);
            this.PointBuffer.push(0.0);
        }
        y = y ? 0 : totalHeight;
        this.PointBuffer.push(x-halfWidth);
        this.PointBuffer.push(y-halfHeight);
        this.PointBuffer.push(0.0);
    };


    function GridWidget (layer, newFlag) {
        var self = this;
        this.Dialog = new SAM.Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a circle.
        this.Dialog.Title.text('Grid Annotation Editor');

        // Grid Size
        // X
        this.Dialog.BinWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.BinWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.BinWidthDiv)
            .text("Bin Width:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.BinWidthInput =
            $('<input>')
            .appendTo(this.Dialog.BinWidthDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });
        // Y
        this.Dialog.BinHeightDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.BinHeightLabel =
            $('<div>')
            .appendTo(this.Dialog.BinHeightDiv)
            .text("Bin Height:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.BinHeightInput =
            $('<input>')
            .appendTo(this.Dialog.BinHeightDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        // Orientation
        this.Dialog.RotationDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.RotationLabel =
            $('<div>')
            .appendTo(this.Dialog.RotationDiv)
            .text("Rotation:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.RotationInput =
            $('<input>')
            .appendTo(this.Dialog.RotationDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        // Color
        this.Dialog.ColorDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.ColorLabel =
            $('<div>')
            .appendTo(this.Dialog.ColorDiv)
            .text("Color:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.ColorInput =
            $('<input type="color">')
            .appendTo(this.Dialog.ColorDiv)
            .val('#30ff00')
            .css({'display':'table-cell'});

        // Line Width
        this.Dialog.LineWidthDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'display':'table-row'});
        this.Dialog.LineWidthLabel =
            $('<div>')
            .appendTo(this.Dialog.LineWidthDiv)
            .text("Line Width:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        this.Dialog.LineWidthInput =
            $('<input type="number">')
            .appendTo(this.Dialog.LineWidthDiv)
            .css({'display':'table-cell'})
            .keypress(function(event) { return event.keyCode != 13; });

        this.Tolerance = 0.05;
        if (MOBILE_DEVICE) {
            this.Tolerance = 0.1;
        }

        if (layer === null) {
            return;
        }

        // Lets save the zoom level (sort of).
        // Load will overwrite this for existing annotations.
        // This will allow us to expand annotations into notes.
        this.CreationCamera = layer.GetCamera().Serialize();

        this.Layer = layer;
        this.Popup = new SAM.WidgetPopup(this);
        var cam = layer.AnnotationView.Camera;
        var viewport = layer.AnnotationView.Viewport;
        this.Grid = new Grid();
        this.Grid.Origin = [0,0];
        this.Grid.OutlineColor = [0.0,0.0,0.0];
        this.Grid.SetOutlineColor('#0A0F7A');
        // Get the default bin size from the layer scale bar.
        if (layer.ScaleWidget) {
            this.Grid.BinWidth = layer.ScaleWidget.LengthWorld;
        } else {
            this.Grid.BinWidth = 30*cam.Height/viewport[3];
        }
        this.Grid.BinHeight = this.Grid.BinWidth;
        this.Grid.LineWidth = 2.0*cam.Height/viewport[3];
        this.Grid.FixedSize = false;

        var width = 0.8 * viewport[2] / layer.GetPixelsPerUnit();
        this.Grid.Dimensions[0] = Math.floor(width / this.Grid.BinWidth);
        var height = 0.8 * viewport[3] / layer.GetPixelsPerUnit();
        this.Grid.Dimensions[1] = Math.floor(height / this.Grid.BinHeight);
        this.Grid.UpdateBuffers();

        this.Text = new SAM.Text();
        // Shallow copy is dangerous
        this.Text.Position = this.Grid.Origin;
        this.Text.String = SAM.DistanceToString(this.Grid.BinWidth*0.25e-6);
        this.Text.Color = [0.0, 0.0, 0.5];
        this.Text.Anchor = [0,0];
        this.Text.UpdateBuffers();

        // Get default properties.
        if (localStorage.GridWidgetDefaults) {
            var defaults = JSON.parse(localStorage.GridWidgetDefaults);
            if (defaults.Color) {
                this.Dialog.ColorInput.val(SAM.ConvertColorToHex(defaults.Color));
                this.Grid.SetOutlineColor(this.Dialog.ColorInput.val());
            }
            if (defaults.LineWidth != undefined) {
                this.Dialog.LineWidthInput.val(defaults.LineWidth);
                this.Grid.LineWidth == defaults.LineWidth;
            }
        }

        this.Layer.AddWidget(this);

        this.State = WAITING;

    }


    // sign specifies which corner is origin.
    // gx, gy is the point in grid pixel coordinates offset from the corner.
    GridWidget.prototype.ComputeCorner = function(xSign, ySign, gx, gy) {
        // Pick the upper left most corner to display the grid size text.
        var xRadius = this.Grid.BinWidth * this.Grid.Dimensions[0] / 2;
        var yRadius = this.Grid.BinHeight * this.Grid.Dimensions[1] / 2;
        xRadius += gx;
        yRadius += gy;
        var x = this.Grid.Origin[0];
        var y = this.Grid.Origin[1];
        // Choose the corner from 0 to 90 degrees in the window.
        var roll = (this.Layer.GetCamera().GetRotation()-
                    this.Grid.Orientation) / 90; // range 0-4
        roll = Math.round(roll);
        // Modulo that works with negative numbers;
        roll = ((roll % 4) + 4) % 4;
        var c = Math.cos(3.14156* this.Grid.Orientation / 180.0);
        var s = Math.sin(3.14156* this.Grid.Orientation / 180.0);
        var dx , dy;
        if (roll == 0) {
            dx =  xSign*xRadius;
            dy =  ySign*yRadius;
        } else if (roll == 3) {
            dx =  xSign*xRadius;
            dy = -ySign*yRadius;
        } else if (roll == 2) {
            dx = -xSign*xRadius;
            dy = -ySign*yRadius;
        } else if (roll == 1) {
            dx = -xSign*xRadius;
            dy =  ySign*yRadius;
        }
        x = x + c*dx + s*dy;
        y = y + c*dy - s*dx;

        return [x,y];
    }

    GridWidget.prototype.Draw = function(view) {
        this.Grid.Draw(view);

        // Corner in grid pixel coordinates.
        var x = - (this.Grid.BinWidth * this.Grid.Dimensions[0] / 2);
        var y = - (this.Grid.BinHeight * this.Grid.Dimensions[1] / 2);
        this.Text.Anchor = [0,20];
        this.Text.Orientation = (this.Grid.Orientation -
                                 this.Layer.GetCamera().GetRotation());
        // Modulo that works with negative numbers;
        this.Text.Orientation = ((this.Text.Orientation % 360) + 360) % 360;
        // Do not draw text upside down.
        if (this.Text.Orientation > 90 && this.Text.Orientation < 270) {
            this.Text.Orientation -= 180.0;
            this.Text.Anchor = [this.Text.PixelBounds[1],0];
            //x += this.Text.PixelBounds[1]; // wrong units (want world
            //pixels , this is screen pixels).
        }
        // Convert to world Coordinates.
        var radians = this.Grid.Orientation * Math.PI / 180;
        var c = Math.cos(radians);
        var s = Math.sin(radians);
        var wx = c*x + s*y;
        var wy = c*y - s*x;
        this.Text.Position = [this.Grid.Origin[0]+wx,this.Grid.Origin[1]+wy];

        this.Text.Draw(view);
    };

    // This needs to be put in the layer.
    //GridWidget.prototype.RemoveFromViewer = function() {
    //    if (this.Viewer) {
    //        this.Viewer.RemoveWidget(this);
    //    }
    //};

    GridWidget.prototype.PasteCallback = function(data, mouseWorldPt, camera) {
        this.Load(data);
        // Keep the pasted grid from rotating when the camera changes.
        var dr = this.Layer.GetCamera().GetRotation() -
        camera.GetRotation();
        this.Grid.Orientation += dr;
        // Place the widget over the mouse.
        // This would be better as an argument.
        this.Grid.Origin = [mouseWorldPt[0], mouseWorldPt[1]];
        this.Text.Position = [mouseWorldPt[0], mouseWorldPt[1]];

        this.Layer.EventuallyDraw();
    };

    GridWidget.prototype.Serialize = function() {
        if(this.Grid === undefined){ return null; }
        var obj = {};
        obj.type = "grid";
        obj.origin = this.Grid.Origin;
        obj.outlinecolor = this.Grid.OutlineColor;
        obj.bin_width = this.Grid.BinWidth;
        obj.bin_height = this.Grid.BinHeight;
        obj.dimensions = this.Grid.Dimensions;
        obj.orientation = this.Grid.Orientation;
        obj.linewidth = this.Grid.LineWidth;
        obj.creation_camera = this.CreationCamera;
        return obj;
    };

    // Load a widget from a json object (origin MongoDB).
    GridWidget.prototype.Load = function(obj) {
        this.Grid.Origin[0] = parseFloat(obj.origin[0]);
        this.Grid.Origin[1] = parseFloat(obj.origin[1]);
        this.Grid.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
        this.Grid.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
        this.Grid.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
        if (obj.width)  { this.Grid.BinWidth = parseFloat(obj.width);}
        if (obj.height) {this.Grid.BinHeight = parseFloat(obj.height);}
        if (obj.bin_width)  { this.Grid.BinWidth = parseFloat(obj.bin_width);}
        if (obj.bin_height) {this.Grid.BinHeight = parseFloat(obj.bin_height);}
        this.Grid.Dimensions[0] = parseInt(obj.dimensions[0]);
        this.Grid.Dimensions[1] = parseInt(obj.dimensions[1]);
        this.Grid.Orientation = parseFloat(obj.orientation);
        this.Grid.LineWidth = parseFloat(obj.linewidth);
        this.Grid.FixedSize = false;
        this.Grid.UpdateBuffers();

        this.Text.String = SAM.DistanceToString(this.Grid.BinWidth*0.25e-6);
        // Shallow copy is dangerous
        this.Text.Position = this.Grid.Origin;
        this.Text.UpdateBuffers();

        // How zoomed in was the view when the annotation was created.
        if (obj.creation_camera !== undefined) {
            this.CreationCamera = obj.CreationCamera;
        }
    };

    GridWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        // The dialog consumes all key events.
        if (this.State == PROPERTIES_DIALOG) {
            return false;
        }

        // Copy
        if (event.keyCode == 67 && event.ctrlKey) {
            //control-c for copy
            //The extra identifier is not needed for widgets, but will be
            // needed if we have some other object on the clipboard.
            // The camera is needed so grid does not rotate when pasting in
            // another stack section.
            var clip = {Type:"GridWidget", 
                        Data: this.Serialize(), 
                        Camera: this.Layer.GetCamera().Serialize()};
            localStorage.ClipBoard = JSON.stringify(clip);
            return false;
        }

        return true;
    };

    GridWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    };

    GridWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1) {
            return true;
        }
        var cam = this.Layer.GetCamera();
        this.DragLast = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        return false;
    };

    // returns false when it is finished doing its work.
    GridWidget.prototype.HandleMouseUp = function(event) {
        this.SetActive(false);
        RecordState();

        return true;
    };

    // Orientation is a pain,  we need a world to shape transformation.
    GridWidget.prototype.HandleMouseMove = function(event) {
        if (event.which == 1) {
            var cam = this.Layer.GetCamera();
            var world =
                cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            var dx, dy;
            if (this.State == DRAG) {
                dx = world[0] - this.DragLast[0];
                dy = world[1] - this.DragLast[1];
                this.DragLast = world;
                this.Grid.Origin[0] += dx;
                this.Grid.Origin[1] += dy;
            } else {
                // convert mouse from world to Grid coordinate system.
                dx = world[0] - this.Grid.Origin[0];
                dy = world[1] - this.Grid.Origin[1];
                var c = Math.cos(3.14156* this.Grid.Orientation / 180.0);
                var s = Math.sin(3.14156* this.Grid.Orientation / 180.0);
                var x = c*dx - s*dy;
                var y = c*dy + s*dx;
                // convert from shape to integer grid indexes.
                x = (0.5*this.Grid.Dimensions[0]) + (x / this.Grid.BinWidth);
                y = (0.5*this.Grid.Dimensions[1]) + (y / this.Grid.BinHeight);
                var ix = Math.round(x);
                var iy = Math.round(y);
                // Change grid dimemsions
                dx = dy = 0;
                var changed = false;
                if (this.State == DRAG_RIGHT) {
                    dx = ix - this.Grid.Dimensions[0];
                    if (dx) {
                        this.Grid.Dimensions[0] = ix;
                        // Compute the change in the center point origin.
                        dx = 0.5 * dx * this.Grid.BinWidth;
                        changed = true;
                    }
                } else if (this.State == DRAG_LEFT) {
                    if (ix) {
                        this.Grid.Dimensions[0] -= ix;
                        // Compute the change in the center point origin.
                        dx = 0.5 * ix * this.Grid.BinWidth;
                        changed = true;
                    }
                } else if (this.State == DRAG_BOTTOM) {
                    dy = iy - this.Grid.Dimensions[1];
                    if (dy) {
                        this.Grid.Dimensions[1] = iy;
                        // Compute the change in the center point origin.
                        dy = 0.5 * dy * this.Grid.BinHeight;
                        changed = true;
                    }
                } else if (this.State == DRAG_TOP) {
                    if (iy) {
                        this.Grid.Dimensions[1] -= iy;
                        // Compute the change in the center point origin.
                        dy = 0.5 * iy * this.Grid.BinHeight;
                        changed = true;
                    }
                }
                if (changed) {
                    // Rotate the translation and apply to the center.
                    x = c*dx + s*dy;
                    y = c*dy - s*dx;
                    this.Grid.Origin[0] += x;
                    this.Grid.Origin[1] += y;
                    this.Grid.UpdateBuffers();
                }
            }
            this.Layer.EventuallyDraw();
            return
        }

        if (event.which == 0) {
            // Update the active state if theuser is not interacting.
            this.SetActive(this.CheckActive(event));
        }

        return true;
    };


    GridWidget.prototype.HandleMouseWheel = function(event) {
        /*
        var x = event.offsetX;
        var y = event.offsetY;

        if (this.State == ACTIVE) {
            if(this.NormalizedActiveDistance < 0.5) {
                var ratio = 1.05;
                var direction = 1;
                if(event.wheelDelta < 0) {
                     ratio = 0.95;
                    direction = -1;
                }
                if(event.shiftKey) {
                    this.Grid.Length = this.Grid.Length * ratio;
                }
                if(event.ctrlKey) {
                    this.Grid.BinWidth = this.Grid.BinWidth * ratio;
                }
                if(!event.shiftKey && !event.ctrlKey) {
                    this.Grid.Orientation = this.Grid.Orientation + 3 * direction;
                 }

                this.Grid.UpdateBuffers();
                this.PlacePopup();
                this.Layer.EventuallyDraw();
            }
        }
        */
    };


    GridWidget.prototype.HandleTouchPan = function(event) {
        /*
          w0 = this.Viewer.ConvertPointViewerToWorld(EVENT_MANAGER.LastMouseX,
          EVENT_MANAGER.LastMouseY);
          w1 = this.Viewer.ConvertPointViewerToWorld(event.offsetX,event.offsetY);

          // This is the translation.
          var dx = w1[0] - w0[0];
          var dy = w1[1] - w0[1];

          this.Grid.Origin[0] += dx;
          this.Grid.Origin[1] += dy;
          this.Layer.EventuallyDraw();
        */
        return true;
    };


    GridWidget.prototype.HandleTouchPinch = function(event) {
        //this.Grid.UpdateBuffers();
        //this.Layer.EventuallyDraw();
        return true;
    };

    GridWidget.prototype.HandleTouchEnd = function(event) {
        this.SetActive(false);
    };


    GridWidget.prototype.CheckActive = function(event) {
        var x,y;
        if (this.Grid.FixedSize) {
            x = event.offsetX;
            y = event.offsetY;
            pixelSize = 1;
        } else {
            x = event.worldX;
            y = event.worldY;
        }
        x = x - this.Grid.Origin[0];
        y = y - this.Grid.Origin[1];
        // Rotate to grid.
        var c = Math.cos(3.14156* this.Grid.Orientation / 180.0);
        var s = Math.sin(3.14156* this.Grid.Orientation / 180.0);
        var rx = c*x - s*y;
        var ry = c*y + s*x;

        // Convert to grid coordinates (0 -> dims)
        x = (0.5*this.Grid.Dimensions[0]) + (rx / this.Grid.BinWidth);
        y = (0.5*this.Grid.Dimensions[1]) + (ry / this.Grid.BinHeight);
        var ix = Math.round(x);
        var iy = Math.round(y);
        if (ix < 0 || ix > this.Grid.Dimensions[0] ||
            iy < 0 || iy > this.Grid.Dimensions[1]) {
            this.SetActive(false);
            return false;
        }

        // x,y get the residual in pixels.
        x = (x - ix) * this.Grid.BinWidth;
        y = (y - iy) * this.Grid.BinHeight;

        // Compute the screen pixel size for tollerance.
        var tolerance = 5.0 / this.Layer.GetPixelsPerUnit();

        if (Math.abs(x) < tolerance || Math.abs(y) < tolerance) {
            this.ActiveIndex =[ix,iy];
            return true;
        }

        return false;
    };

    // Multiple active states. Active state is a bit confusing.
    GridWidget.prototype.GetActive = function() {
        if (this.State == WAITING) {
            return false;
        }
        return true;
    };


    GridWidget.prototype.Deactivate = function() {
        this.Layer.AnnotationView.CanvasDiv.css({'cursor':'default'});
        this.Popup.StartHideTimer();
        this.State = WAITING;
        this.Grid.Active = false;
        this.Layer.DeactivateWidget(this);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    };

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    GridWidget.prototype.SetActive = function(flag) {

        if (flag) {
            this.State = ACTIVE;
            this.Grid.Active = true;

            if ( ! this.ActiveIndex) {
                console.log("No active index");
                return;
            }
            if (this.ActiveIndex[0] == 0) {
                this.State = DRAG_LEFT;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'col-resize'});
            } else if (this.ActiveIndex[0] == this.Grid.Dimensions[0]) {
                this.State = DRAG_RIGHT;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'col-resize'});
            } else if (this.ActiveIndex[1] == 0) {
                this.State = DRAG_TOP;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'row-resize'});
            } else if (this.ActiveIndex[1] == this.Grid.Dimensions[1]) {
                this.State = DRAG_BOTTOM;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'row-resize'});
            } else {
                this.State = DRAG;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'move'});
            }

            // Compute the location for the pop up and show it.
            this.PlacePopup();
        } else {
            this.Deactivate();
        }
        this.Layer.EventuallyDraw();
    };


    // This also shows the popup if it is not visible already.
    GridWidget.prototype.PlacePopup = function () {
        // Compute corner has its angle backwards.  I do not see how this works.
        var pt = this.ComputeCorner(1, -1, 0, 0);
        var cam = this.Layer.GetCamera();
        pt = cam.ConvertPointWorldToViewer(pt[0], pt[1]);
        this.Popup.Show(pt[0]+10,pt[1]-30);
    };

    // Can we bind the dialog apply callback to an objects method?
    var DIALOG_SELF;

    GridWidget.prototype.ShowPropertiesDialog = function () {
        this.Dialog.ColorInput.val(SAM.ConvertColorToHex(this.Grid.OutlineColor));
        this.Dialog.LineWidthInput.val((this.Grid.LineWidth).toFixed(2));
        // convert 40x scan pixels into meters
        this.Dialog.BinWidthInput.val(SAM.DistanceToString(this.Grid.BinWidth*0.25e-6));
        this.Dialog.BinHeightInput.val(SAM.DistanceToString(this.Grid.BinHeight*0.25e-6));
        this.Dialog.RotationInput.val(this.Grid.Orientation);

        this.Dialog.Show(true);
    };

    GridWidget.prototype.DialogApplyCallback = function() {
        var hexcolor = this.Dialog.ColorInput.val();
        this.Grid.SetOutlineColor(hexcolor);
        this.Grid.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Grid.BinWidth = SAM.StringToDistance(this.Dialog.BinWidthInput.val())*4e6;
        this.Grid.BinHeight = SAM.StringToDistance(this.Dialog.BinHeightInput.val())*4e6;
        this.Grid.Orientation = parseFloat(this.Dialog.RotationInput.val());
        this.Grid.UpdateBuffers();
        this.SetActive(false);

        this.Text.String = SAM.DistanceToString(this.Grid.BinWidth*0.25e-6);
        this.Text.UpdateBuffers();

        RecordState();
        this.Layer.EventuallyDraw();

        localStorage.GridWidgetDefaults = JSON.stringify({Color: hexcolor, LineWidth: this.Grid.LineWidth});
    };

    SAM.GridWidget = GridWidget;

})();



(function () {
    "use strict";

    var NEW = 0;
    var WAITING = 3; // The normal (resting) state.
    var ACTIVE = 4; // Mouse is over the widget and it is receiving events.
    var PROPERTIES_DIALOG = 5; // Properties dialog is up

    var DRAG = 6;
    var DRAG_LEFT = 7;
    var DRAG_RIGHT = 8;

    // Viewer coordinates.
    // Horizontal or verticle
    function Scale() {
        SAM.Shape.call(this);
        // Dimension of scale element
        this.BinLength = 100.0; // unit length in screen pixels
        this.TickSize = 6; // Screen pixels
        this.NumberOfBins = 1;
        this.Orientation = 0; // 0 or 90
        this.Origin = [10000,10000]; // middle.
        this.OutlineColor = [0,0,0];
        this.PointBuffer = [];
        this.PositionCoordinateSystem = SAM.Shape.VIEWER;
    };

    Scale.prototype = new SAM.Shape();

    Scale.prototype.destructor=function() {
        // Get rid of the buffers?
    };

    Scale.prototype.UpdateBuffers = function() {
        // TODO: Having a single poly line for a shape is to simple.
        // Add cell arrays.
        this.PointBuffer = [];

        // Matrix is computed by the draw method in Shape superclass.
        // TODO: Used to detect first initialization.
        // Get this out of this method.
        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        // Draw all of the x lines.
        var x = 0;
        var y = this.TickSize;
        this.PointBuffer.push(x);
        this.PointBuffer.push(y);
        this.PointBuffer.push(0.0);
        y = 0;
        this.PointBuffer.push(x);
        this.PointBuffer.push(y);
        this.PointBuffer.push(0.0);

        for (var i = 0; i < this.NumberOfBins; ++i) {
            x += this.BinLength;
            this.PointBuffer.push(x);
            this.PointBuffer.push(y);
            this.PointBuffer.push(0.0);
            y = this.TickSize;
            this.PointBuffer.push(x);
            this.PointBuffer.push(y);
            this.PointBuffer.push(0.0);
            y = 0;
            this.PointBuffer.push(x);
            this.PointBuffer.push(y);
            this.PointBuffer.push(0.0);
        }
    };

    function ScaleWidget (layer, newFlag) {
        var self = this;

        if (layer === null) {
            return;
        }

        this.Layer = layer;
        this.PixelsPerMeter = 0;
        this.Shape = new Scale();
        this.Shape.OutlineColor = [0.0, 0.0, 0.0];
        this.Shape.Origin = [30,20];
        this.Shape.BinLength = 200;
        this.Shape.FixedSize = true;

        this.Text = new SAM.Text();
        this.Text.PositionCoordinateSystem = SAM.Shape.VIEWER;
        this.Text.Position = [30,5];
        this.Text.String = "";
        this.Text.Color = [0.0, 0.0, 0.0];
        // I want the anchor to be the center of the text.
        // This is a hackl estimate.
        this.Text.Anchor = [20,0];

        this.Update(layer.GetPixelsPerUnit());

        this.Layer.AddWidget(this);

        this.State = WAITING;
    }


    // Change the length of the scale based on the camera.
    ScaleWidget.prototype.Update = function() {
        // Compute the number of screen pixels in a meter.
        var scale = Math.round(4e6 * this.Layer.GetPixelsPerUnit());
        if (this.PixelsPerMeter == scale) {
            return;
        }
        // Save the scale so we know when to regenerate.
        this.PixelsPerMeter = scale;
        var target = 200; // pixels
        var e = 0;
        // Note: this assumes max bin length is 1 meter.
        var binLengthViewer = this.PixelsPerMeter;
        // keep reducing the length until it is reasonable.
        while (binLengthViewer > target) {
            binLengthViewer = binLengthViewer / 10;
            --e;
        }
        // Now compute the units from e.
        this.Units = "nm";
        var factor = 1e-9;
        if (e >= -6) {
            this.Units = "\xB5m"
            factor = 1e-6;
        }
        if (e >= -3) {
            this.Units = "mm";
            factor = 1e-3;
        }
        if (e >= -2) {
            this.Units = "cm";
            factor = 1e-2;
        }
        if (e >= 0) {
            this.Units = "m";
            factor = 1;
        }
        if (e >= 3) {
            this.Units = "km";
            factor = 1000;
        }
        // Length is set to the viewer pixel length of a tick / unit.
        this.Shape.BinLength = binLengthViewer;
        // Now add bins to get close to the target length.
        this.Shape.NumberOfBins = Math.floor(target / binLengthViewer);
        // compute the length of entire scale bar (units: viewer pixels).
        var scaleLengthViewer = binLengthViewer * this.Shape.NumberOfBins;
        var scaleLengthMeters = scaleLengthViewer / this.PixelsPerMeter;
        // Compute the label.
        // The round should not change the value, only get rid of numerical error.
        var labelNumber = Math.round(scaleLengthMeters / factor);
        this.Label = labelNumber.toString() + this.Units;

        // Save the length of the scale bar in world units.
        // World (highest res image) pixels default to 0.25e-6 meters.
        this.LengthWorld = scaleLengthMeters * 4e6;

        // Update the label text and position
        this.Text.String = this.Label;
        this.Text.UpdateBuffers();
        this.Text.Position = [this.Shape.Origin[0]+(scaleLengthViewer/2),
                              this.Shape.Origin[1]-15];

        this.Shape.UpdateBuffers();
    }

    ScaleWidget.prototype.Draw = function(view) {
        // Update the scale if zoom changed.
        this.Update();
        this.Shape.Draw(view);
        this.Text.Draw(view);
    };

    // This needs to be put in the Viewer.
    //ScaleWidget.prototype.RemoveFromViewer = function() {
    //    if (this.Layer) {
    //        this.RemoveWidget(this);
    //    }
    //};

    ScaleWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        return true;
    };

    ScaleWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    };

    ScaleWidget.prototype.HandleMouseDown = function(event) {
        /*
        if (event.which != 1) {
            return true;
        }
        this.DragLast = this.Layer.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        */
        return false;
    };

    // returns false when it is finished doing its work.
    ScaleWidget.prototype.HandleMouseUp = function(event) {
        /*
        this.SetActive(false);
        RecordState();
        */
        return true;
    };

    // Orientation is a pain,  we need a world to shape transformation.
    ScaleWidget.prototype.HandleMouseMove = function(event) {
        /*
        if (event.which == 1) {
            var world =
                this.Layer.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            var dx, dy;
            if (this.State == DRAG) {
                dx = world[0] - this.DragLast[0];
                dy = world[1] - this.DragLast[1];
                this.DragLast = world;
                this.Shape.Origin[0] += dx;
                this.Shape.Origin[1] += dy;
            } else {
                // convert mouse from world to Shape coordinate system.
                dx = world[0] - this.Shape.Origin[0];
                dy = world[1] - this.Shape.Origin[1];
                var c = Math.cos(3.14156* this.Shape.Orientation / 180.0);
                var s = Math.sin(3.14156* this.Shape.Orientation / 180.0);
                var x = c*dx - s*dy;
                var y = c*dy + s*dx;
                // convert from shape to integer scale indexes.
                x = (0.5*this.Shape.Dimensions[0]) + (x /
                  this.Shape.Width);
                y = (0.5*this.Shape.Dimensions[1]) + (y /
                  this.Shape.Height);
                var ix = Math.round(x);
                var iy = Math.round(y);
                // Change scale dimemsions
                dx = dy = 0;
                var changed = false;
                if (this.State == DRAG_RIGHT) {
                    dx = ix - this.Shape.Dimensions[0];
                    if (dx) {
                        this.Shape.Dimensions[0] = ix;
                        // Compute the change in the center point origin.
                        dx = 0.5 * dx * this.Shape.Width;
                        changed = true;
                    }
                } else if (this.State == DRAG_LEFT) {
                    if (ix) {
                        this.Shape.Dimensions[0] -= ix;
                        // Compute the change in the center point origin.
                        dx = 0.5 * ix * this.Shape.Width;
                        changed = true;
                    }
                } else if (this.State == DRAG_BOTTOM) {
                    dy = iy - this.Shape.Dimensions[1];
                    if (dy) {
                        this.Shape.Dimensions[1] = iy;
                        // Compute the change in the center point origin.
                        dy = 0.5 * dy * this.Shape.Height;
                        changed = true;
                    }
                } else if (this.State == DRAG_TOP) {
                    if (iy) {
                        this.Shape.Dimensions[1] -= iy;
                        // Compute the change in the center point origin.
                        dy = 0.5 * iy * this.Shape.Height;
                        changed = true;
                    }
                }
                if (changed) {
                    // Rotate the translation and apply to the center.
                    x = c*dx + s*dy;
                    y = c*dy - s*dx;
                    this.Shape.Origin[0] += x;
                    this.Shape.Origin[1] += y;
                    this.Shape.UpdateBuffers();
                }
            }
            eventuallyRender();
            return
        }

        this.CheckActive(event);
*/
        return true;
    };


    ScaleWidget.prototype.HandleMouseWheel = function(event) {
        /*
        var x = event.offsetX;
        var y = event.offsetY;

        if (this.State == ACTIVE) {
            if(this.NormalizedActiveDistance < 0.5) {
                var ratio = 1.05;
                var direction = 1;
                if(event.wheelDelta < 0) {
                     ratio = 0.95;
                    direction = -1;
                }
                if(event.shiftKey) {
                    this.Shape.BinLength = this.Shape.BinLength * ratio;
                }
                if(event.ctrlKey) {
                    this.Shape.Width = this.Shape.Width * ratio;
                }
                if(!event.shiftKey && !event.ctrlKey) {
                    this.Shape.Orientation = this.Shape.Orientation + 3 * direction;
                 }

                this.Shape.UpdateBuffers();
                this.PlacePopup();
                eventuallyRender();
            }
        }
        */
    };


    ScaleWidget.prototype.HandleTouchPan = function(event) {
        /*
          w0 = this.Layer.ConvertPointViewerToWorld(EVENT_MANAGER.LastMouseX,
          EVENT_MANAGER.LastMouseY);
          w1 = this.Layer.ConvertPointViewerToWorld(event.offsetX,event.offsetY);

          // This is the translation.
          var dx = w1[0] - w0[0];
          var dy = w1[1] - w0[1];

          this.Shape.Origin[0] += dx;
          this.Shape.Origin[1] += dy;
          eventuallyRender();
        */
        return true;
    };


    ScaleWidget.prototype.HandleTouchPinch = function(event) {
        //this.Shape.UpdateBuffers();
        //eventuallyRender();
        return true;
    };

    ScaleWidget.prototype.HandleTouchEnd = function(event) {
        this.SetActive(false);
    };


    ScaleWidget.prototype.CheckActive = function(event) {
        /*
        var x,y;
        if (this.Shape.FixedSize) {
            x = event.offsetX;
            y = event.offsetY;
            pixelSize = 1;
        } else {
            x = event.worldX;
            y = event.worldY;
        }
        x = x - this.Shape.Origin[0];
        y = y - this.Shape.Origin[1];
        // Rotate to scale.
        var c = Math.cos(3.14156* this.Shape.Orientation / 180.0);
        var s = Math.sin(3.14156* this.Shape.Orientation / 180.0);
        var rx = c*x - s*y;
        var ry = c*y + s*x;

        // Convert to scale coordinates (0 -> dims)
        x = (0.5*this.Shape.Dimensions[0]) + (rx / this.Shape.Width);
        y = (0.5*this.Shape.Dimensions[1]) + (ry / this.Shape.Height);
        var ix = Math.round(x);
        var iy = Math.round(y);
        if (ix < 0 || ix > this.Shape.Dimensions[0] ||
            iy < 0 || iy > this.Shape.Dimensions[1]) {
            this.SetActive(false);
            return false;
        }

        // x,y get the residual in pixels.
        x = (x - ix) * this.Shape.Width;
        y = (y - iy) * this.Shape.Height;

        // Compute the screen pixel size for tollerance.
        var tolerance = 5.0 / this.Layer.GetPixelsPerUnit();

        if (Math.abs(x) < tolerance || Math.abs(y) < tolerance) {
            this.SetActive(true);
            if (ix == 0) {
                this.State = DRAG_LEFT;
                thisLayer.AnnotationView.CanvasDiv.css({'cursor':'col-resize'});
            } else if (ix == this.Shape.Dimensions[0]) {
                this.State = DRAG_RIGHT;
                this.Layer.AnnotationView.CanvasDiv.css({'cursor':'col-resize'});
            } else if (iy == 0) {
                this.State = DRAG_TOP;
                this.Viewer.AnnotationView.CanvasDiv.css({'cursor':'row-resize'});
            } else if (iy == this.Shape.Dimensions[1]) {
                this.State = DRAG_BOTTOM;
                this.Layer.MainView.CanvasDiv.css({'cursor':'row-resize'});
            } else {
                this.State = DRAG;
                this.Layer.MainView.CanvasDiv.css({'cursor':'move'});
            }
            return true;
        }
        */
        this.SetActive(false);
        return false;
    };

    // Multiple active states. Active state is a bit confusing.
    ScaleWidget.prototype.GetActive = function() {
        if (this.State == WAITING) {
            return false;
        }
        return true;
    };


    ScaleWidget.prototype.Deactivate = function() {
        this.Layer.AnnotationView.CanvasDiv.css({'cursor':'default'});
        this.Popup.StartHideTimer();
        this.State = WAITING;
        this.Shape.Active = false;
        this.Layer.DeactivateWidget(this);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        eventuallyRender();
    };

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    ScaleWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) {
            return;
        }

        if (flag) {
            this.State = ACTIVE;
            this.Shape.Active = true;
            this.Layer.ActivateWidget(this);
            eventuallyRender();
            // Compute the location for the pop up and show it.
            this.PlacePopup();
        } else {
            this.Deactivate();
        }
        eventuallyRender();
    };


    SAM.ScaleWidget = ScaleWidget;

})();

//==============================================================================
// Feedback for the image that will be downloaded with the cutout service.
// Todo:
// - Key events and tooltips for buttons.
//   This is difficult because the widget would have to be active all the time.
//   Hold off on this.


(function () {
    "use strict";

    function CutoutWidget (parent, viewer) {
        this.Viewer = viewer;
        this.Layer = viewer.AnnotationLayer;
        var cam = layer.GetCamera();
        var fp = cam.GetFocalPoint();

        var rad = cam.Height / 4;
        this.Bounds = [fp[0]-rad,fp[0]+rad, fp[1]-rad,fp[1]+rad];
        this.DragBounds = [fp[0]-rad,fp[0]+rad, fp[1]-rad,fp[1]+rad];

        layer.AddWidget(this);
        eventuallyRender();

        // Bits that indicate which edges are active.
        this.Active = 0;

        var self = this;
        this.Div = $('<div>')
            .appendTo(parent)
            .addClass("sa-view-cutout-div");
        $('<button>')
            .appendTo(this.Div)
            .text("Cancel")
            .addClass("sa-view-cutout-button")
            .click(function(){self.Cancel();});
        $('<button>')
            .appendTo(this.Div)
            .text("Download")
            .addClass("sa-view-cutout-button")
            .click(function(){self.Accept();});

        this.Select = $('<select>')
            .appendTo(this.Div);
        $('<option>').appendTo(this.Select)
            .attr('value', 0)
            .text("tif");
        $('<option>').appendTo(this.Select)
            .attr('value', 1)
            .text("jpeg");
        $('<option>').appendTo(this.Select)
            .attr('value', 2)
            .text("png");
        $('<option>').appendTo(this.Select)
            .attr('value', 3)
            .text("svs");

        this.Label = $('<div>')
            .addClass("sa-view-cutout-label")
            .appendTo(this.Div);
        this.UpdateBounds();
        this.HandleMouseUp();
    }

    CutoutWidget.prototype.Accept = function () {
        this.Deactivate();
        var types = ["tif", "jpeg", "png", "svs"]
        var image_source = this.Viewer.GetCache().Image;
        // var bounds = [];
        // for (var i=0; i <this.Bounds.length; i++) {
        //  bounds[i] = this.Bounds[i] -1;
        // }

        window.location = "/cutout/" + image_source.database + "/" +
            image_source._id + "/image."+types[this.Select.val()]+"?bounds=" + JSON.stringify(this.Bounds);
    }


    CutoutWidget.prototype.Cancel = function () {
        this.Deactivate();
    }

    CutoutWidget.prototype.Serialize = function() {
        return false;
    }

    CutoutWidget.prototype.Draw = function(view) {
        var center = [(this.DragBounds[0]+this.DragBounds[1])*0.5,
                      (this.DragBounds[2]+this.DragBounds[3])*0.5];
        var cam = view.Camera;
        var viewport = view.Viewport;

        if (GL) {
            alert("webGL cutout not supported");
        } else {
            // The 2d canvas was left in world coordinates.
            var ctx = view.Context2d;
            var cam = view.Camera;
            ctx.save();
            ctx.setTransform(1,0,0,1,0,0);
            this.DrawRectangle(ctx, this.Bounds, cam, "#00A", 1, 0);
            this.DrawRectangle(ctx, this.DragBounds, cam, "#000",2, this.Active);
            this.DrawCenter(ctx, center, cam, "#000");
            ctx.restore();
        }
    }

    CutoutWidget.prototype.DrawRectangle = function(ctx, bds, cam, color,
                                                    lineWidth, active) {
        // Convert the for corners to view.
        var pt0 = cam.ConvertPointWorldToViewer(bds[0],bds[2]);
        var pt1 = cam.ConvertPointWorldToViewer(bds[1],bds[2]);
        var pt2 = cam.ConvertPointWorldToViewer(bds[1],bds[3]);
        var pt3 = cam.ConvertPointWorldToViewer(bds[0],bds[3]);

        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.strokeStyle=(active&4)?"#FF0":color;
        ctx.moveTo(pt0[0], pt0[1]);
        ctx.lineTo(pt1[0], pt1[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&2)?"#FF0":color;
        ctx.moveTo(pt1[0], pt1[1]);
        ctx.lineTo(pt2[0], pt2[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&8)?"#FF0":color;
        ctx.moveTo(pt2[0], pt2[1]);
        ctx.lineTo(pt3[0], pt3[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle=(active&1)?"#FF0":color;
        ctx.moveTo(pt3[0], pt3[1]);
        ctx.lineTo(pt0[0], pt0[1]);
        ctx.stroke();
    }

    CutoutWidget.prototype.DrawCenter = function(ctx, pt, cam, color) {
        // Convert the for corners to view.
        var pt0 = cam.ConvertPointWorldToViewer(pt[0],pt[1]);

        ctx.strokeStyle=(this.Active&16)?"#FF0":color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pt0[0]-5, pt0[1]);
        ctx.lineTo(pt0[0]+5, pt0[1]);
        ctx.moveTo(pt0[0], pt0[1]-5);
        ctx.lineTo(pt0[0], pt0[1]+5);
        ctx.stroke();
    }


    CutoutWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        // Return is the same as except.
        if (event.keyCode == 67) {
            alert("Accept");
        }
        // esc or delete: cancel
        if (event.keyCode == 67) {
            alert("Cancel");
        }

        return true;
    }

    CutoutWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    }

    CutoutWidget.prototype.HandleMouseDown = function(event) {
        if (event.which != 1) {
            return false;
        }
        return true;
    }

    // returns false when it is finished doing its work.
    CutoutWidget.prototype.HandleMouseUp = function() {
        if (this.Bounds[0] > this.Bounds[1]) {
            var tmp = this.Bounds[0];
            this.Bounds[0] = this.Bounds[1];
            this.Bounds[1] = tmp;
        }
        if (this.Bounds[2] > this.Bounds[3]) {
            var tmp = this.Bounds[2];
            this.Bounds[2] = this.Bounds[3];
            this.Bounds[3] = tmp;
        }

        this.DragBounds = this.Bounds.slice(0);
        eventuallyRender();
    }

    CutoutWidget.prototype.HandleMouseMove = function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

        if (event.which == 0) {
            this.CheckActive(event);
            return;
        }

        if (this.Active) {
            var cam = this.Layer.GetCamera();
            var pt = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            if (this.Active&1) {
                this.DragBounds[0] = pt[0];
            }
            if (this.Active&2) {
                this.DragBounds[1] = pt[0];
            }
            if (this.Active&4) {
                this.DragBounds[2] = pt[1];
            }
            if (this.Active&8) {
                this.DragBounds[3] = pt[1];
            }
            if (this.Active&16) {
                var dx = pt[0] - 0.5*(this.DragBounds[0]+this.DragBounds[1]);
                var dy = pt[1] - 0.5*(this.DragBounds[2]+this.DragBounds[3]);
                this.DragBounds[0] += dx;
                this.DragBounds[1] += dx;
                this.DragBounds[2] += dy;
                this.DragBounds[3] += dy;
            }
            this.UpdateBounds();
            eventuallyRender();
            return true;
        }
        return false;
    }

    // Bounds follow drag bounds, but snap to the tile grid.
    // Maybe we should not force Bounds to contain DragBounds.
    // Bounds Grow when dragging the center. Maybe
    // round rather the use floor and ceil.
    CutoutWidget.prototype.UpdateBounds = function(event) {
        var cache = this.Viewer.GetCache();
        var tileSize = cache.Image.TileSize;
        //this.Bounds[0] = Math.floor(this.DragBounds[0]/tileSize) * tileSize;
        //this.Bounds[1] =  Math.ceil(this.DragBounds[1]/tileSize) * tileSize;
        //this.Bounds[2] = Math.floor(this.DragBounds[2]/tileSize) * tileSize;
        //this.Bounds[3] =  Math.ceil(this.DragBounds[3]/tileSize) * tileSize;
        var bds = [0,0,0,0];
        bds[0] = Math.round(this.DragBounds[0]/tileSize) * tileSize;
        bds[1] = Math.round(this.DragBounds[1]/tileSize) * tileSize;
        bds[2] = Math.round(this.DragBounds[2]/tileSize) * tileSize;
        bds[3] = Math.round(this.DragBounds[3]/tileSize) * tileSize;

        // Keep the bounds in the image.
        // min and max could be inverted.
        // I am not sure the image bounds have to be on the tile boundaries.
        var imgBds = cache.Image.bounds;
        if (bds[0] < imgBds[0]) bds[0] = imgBds[0];
        if (bds[1] < imgBds[0]) bds[1] = imgBds[0];
        if (bds[2] < imgBds[2]) bds[2] = imgBds[2];
        if (bds[3] < imgBds[2]) bds[3] = imgBds[2];

        if (bds[0] > imgBds[1]) bds[0] = imgBds[1];
        if (bds[1] > imgBds[1]) bds[1] = imgBds[1];
        if (bds[2] > imgBds[3]) bds[2] = imgBds[3];
        if (bds[3] > imgBds[3]) bds[3] = imgBds[3];

        // Do not the bounds go to zero area.
        if (bds[0] != bds[1]) {
            this.Bounds[0] = bds[0];
            this.Bounds[1] = bds[1];
        }
        if (bds[2] != bds[3]) {
            this.Bounds[2] = bds[2];
            this.Bounds[3] = bds[3];
        }

        // Update the label.
        var dim = [this.Bounds[1]-this.Bounds[0],this.Bounds[3]-this.Bounds[2]];
        this.Label.text(dim[0] + " x " + dim[1] +
                        " = " + this.FormatPixels(dim[0]*dim[1]) + "pixels");
    }

    CutoutWidget.prototype.FormatPixels = function(num) {
        if (num > 1000000000) {
            return Math.round(num/1000000000) + "G";
        }
        if (num > 1000000) {
            return Math.round(num/1000000) + "M";
        }
        if (num > 1000) {
            return Math.round(num/1000) + "k";
        }
        return num;
    }


    CutoutWidget.prototype.HandleTouchPan = function(event) {
    }

    CutoutWidget.prototype.HandleTouchPinch = function(event) {
    }

    CutoutWidget.prototype.HandleTouchEnd = function(event) {
    }


    CutoutWidget.prototype.CheckActive = function(event) {
        var cam = this.Layer.GetCamera();
        // it is easier to make the comparison in slide coordinates,
        // but we need a tolerance in pixels.
        var tolerance = cam.Height / 200;
        var pt = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        var active = 0;

        var inX = (this.DragBounds[0]-tolerance < pt[0] && pt[0] < this.DragBounds[1]+tolerance);
        var inY = (this.DragBounds[2]-tolerance < pt[1] && pt[1] < this.DragBounds[3]+tolerance);
        if (inY && Math.abs(pt[0]-this.DragBounds[0]) < tolerance) {
            active = active | 1;
        }
        if (inY && Math.abs(pt[0]-this.DragBounds[1]) < tolerance) {
            active = active | 2;
        }
        if (inX && Math.abs(pt[1]-this.DragBounds[2]) < tolerance) {
            active = active | 4;
        }
        if (inX && Math.abs(pt[1]-this.DragBounds[3]) < tolerance) {
            active = active | 8;
        }

        var center = [(this.DragBounds[0]+this.DragBounds[1])*0.5, 
                      (this.DragBounds[2]+this.DragBounds[3])*0.5];
        tolerance *= 2;
        if (Math.abs(pt[0]-center[0]) < tolerance &&
            Math.abs(pt[1]-center[1]) < tolerance) {
            active = active | 16;
        }

        if (active != this.Active) {
            this.SetActive(active);
            eventuallyRender();
        }

        return false;
    }

    // Multiple active states. Active state is a bit confusing.
    CutoutWidget.prototype.GetActive = function() {
        return this.Active;
    }

    CutoutWidget.prototype.Deactivate = function() {
        this.Div.remove();
        if (this.Layer == null) {
            return;
        }
        this.Layer.DeactivateWidget(this);
        this.Layer.RemoveWidget(this);

        eventuallyRender();
    }

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    CutoutWidget.prototype.SetActive = function(active) {
        if (this.Active == active) {
            return;
        }
        this.Active = active;

        if ( active != 0) {
            this.Layer.ActivateWidget(this);
        } else {
            this.Layer.DeactivateWidget(this);
        }
        eventuallyRender();
    }

    SAM.CutoutWidget = CutoutWidget;

})();




// Draw an image as an annotation object.  This simple drawing object
// is like a shape, but I am not subclassing shape because shape
// is about drawing vector graphics.

// We only support rendering in slide coordinate system for now.

(function () {
    "use strict";

    function ImageAnnotation() {
        this.Visibility = true;

        // Slide position of the upper left image corner.
        this.Origin = [0,0];
        this.Image = undefined;

        this.Height = 5000;
    }


    ImageAnnotation.prototype.destructor=function() {
        // Get rid of the image.
    }


    // View (main view).
    ImageAnnotation.prototype.Draw = function (view) {
        if ( ! this.Visibility || ! this.Image) {
            return;
        }

        var context = view.Context2d;
        context.save();
        // Identity (screen coordinates).
        context.setTransform(1,0,0,1,0,0);
        // Change canvas coordinates to View (-1->1, -1->1).
        context.transform(0.5*view.Viewport[2], 0.0,
                          0.0, -0.5*view.Viewport[3],
                          0.5*view.Viewport[2],
                          0.5*view.Viewport[3]);

        // Change canvas coordinates to slide (world). (camera: slide to view).
        var h = 1.0 / view.Camera.Matrix[15];
        context.transform(view.Camera.Matrix[0]*h, view.Camera.Matrix[1]*h,
                          view.Camera.Matrix[4]*h, view.Camera.Matrix[5]*h,
                          view.Camera.Matrix[12]*h, view.Camera.Matrix[13]*h);

        // Change canvas to image coordinate system.
        var scale = this.Height / this.Image.height;
        context.transform(scale, 0,
                          0, scale,
                          this.Origin[0], this.Origin[1]);


        context.drawImage(this.Image,0,0);

        context.restore();
    }


    SAM.ImageAnnotation = ImageAnnotation;

})();
