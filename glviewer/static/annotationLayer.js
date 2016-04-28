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

