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

    // Pass in the viewer div.
    // TODO: Pass the camera into the draw method.  It is shared here.
    function AnnotationLayer (viewerDiv, viewerCamera) {
        var self = this;
        this.Parent = parent;
        //parent.addClass('sa-viewer');

        // TODO: Abstract the view to a layer somehow.
        this.AnnotationView = new View(viewerDiv);
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
    
    AnnotationLayer.prototype.AddWidget = function(widget) {
        if ( ! widget) { return; }
        widget.Layer = this;
        this.WidgetList.push(widget);
    }
    AnnotationLayer.prototype.RemoveWidget = function(widget) {
        // widget.Layer = null;
        var idx = this.WidgetList.indexOf(widget);
        if(idx!=-1) {
            this.WidgetList.splice(idx, 1);
        }
    }
    AnnotationLayer.prototype.GetWidgets = function() {
        return this.WidgetList;
    }

    // Load a widget from a json object (origin MongoDB).
    AnnotationLayer.prototype.LoadWidget = function(obj) {
        var widget;
        switch(obj.type){
        case "lasso":
            widget = new LassoWidget(this, false);
            break;
        case "pencil":
            widget = new PencilWidget(this, false);
            break;
        case "text":
            widget = new TextWidget(this, "");
            break;
        case "circle":
            widget = new CircleWidget(this, false);
            break;
        case "polyline":
            widget = new PolylineWidget(this, false);
            break;
        case "stack_section":
            widget = new StackSectionWidget(this);
            break;
        case "sections":
            widget = new SectionsWidget(this);
            break;
        case "rect":
            widget = new RectWidget(this, false);
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
        this.ActiveWidget = widget;
    }
    AnnotationLayer.prototype.DeactivateWidget = function(widget) {
        if (this.ActiveWidget != widget || widget == null) {
            // Do nothing if the widget is not active.
            return;
        }
        this.ActiveWidget = null;
    }
    AnnotationLayer.prototype.GetActiveWidget = function() {
        return this.ActiveWidget;
    }

    // Return to initial state.
    AnnotationLayer.prototype.Reset = function() {
        this.WidgetList = [];
    }

    // TODO: Try to get rid of the viewer argument.
    AnnotationLayer.prototype.HandleTouchStart = function(event, viewer) {
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

    // TODO: Get rid of the viewer argument.
    AnnotationLayer.prototype.HandleTouchPan = function(event, viewer) {
        if (this.ActiveWidget && this.ActiveWidget.HandleTouchPan) {
            return this.ActiveWidget.HandleTouchPan(event, viewer);
        }
        return ! this.ActiveWidget;
        return true;
    }

    // TODO: Get rid of the viewer argument.
    AnnotationLayer.prototype.HandleTouchPinch = function(event, viewer) {
        if (this.ActiveWidget && this.ActiveWidget.HandleTouchPinch) {
            return this.ActiveWidget.HandleTouchPinch(event, viewer);
        }
        return ! this.ActiveWidget;
        return true;
    }

    // TODO: Get rid of the viewer argument.
    AnnotationLayer.prototype.HandleTouchEnd = function(event, viewer) {
        if (this.ActiveWidget && this.ActiveWidget.HandleTouchEnd) {
            return this.ActiveWidget.HandleTouchEnd(event, viewer);
        }
        return ! this.ActiveWidget;
        return true;
    }

    // TODO: Get rid of the viewer argument.
    AnnotationLayer.prototype.HandleMouseDown = function(event, viewer) {
        if (this.ActiveWidget && this.ActiveWidget.HandleMouseDown) {
            return this.ActiveWidget.HandleMouseDown(event, viewer);
        }
        return ! this.ActiveWidget;
        return true;
    }

    // TODO: Get rid of the viewer argument.
    AnnotationLayer.prototype.HandleDoubleClick = function(event, viewer) {
        if (this.ActiveWidget && this.ActiveWidget.HandleDoubleClick) {
            return this.ActiveWidget.HandleDoubleClick(event, viewer);
        }
        return ! this.ActiveWidget;
        return true;
    }

    // TODO: Get rid of the viewer argument.
    AnnotationLayer.prototype.HandleMouseUp = function(event, viewer) {
        if (this.ActiveWidget && this.ActiveWidget.HandleMouseUp) {
            return this.ActiveWidget.HandleMouseUp(event, viewer);
        }
        return ! this.ActiveWidget;
        return true;
    }

    // TODO: Get rid of the viewer argument.
    AnnotationLayer.prototype.HandleMouseMove = function(event, viewer) {
        //if (event.which == 0) { // Firefox does not set which for motion events.
        if ( ! viewer.FireFoxWhich) {
            this.CheckActive(event);
        }
        if (this.ActiveWidget && this.ActiveWidget.HandleMouseMove) {
            this.ActiveWidget.HandleMouseMove(event, viewer);
        }
        // An active widget should stop propagation even if it does not
        // respond to the event.
        return ! this.ActiveWidget;
    }

    // TODO: Get rid of the viewer argument.
    AnnotationLayer.prototype.HandleMouseWheel = function(event, viewer) {
        if (this.ActiveWidget && this.ActiveWidget.HandleMouseWheel) {
            return this.ActiveWidget.HandleMouseWheel(event, viewer);
        }
        return ! this.ActiveWidget;
        return true;
    }

    // TODO: Get rid of the viewer argument.
    AnnotationLayer.prototype.HandleKeyDown = function(event, viewer) {
        if (this.ActiveWidget && this.ActiveWidget.HandleKeyDown) {
            return this.ActiveWidget.HandleKeyDown(event, viewer);
        }
        return ! this.ActiveWidget;
    }

    // Called on mouse motion with no button pressed.
    // Looks for widgets under the cursor to make active.
    // Returns true if a widget is active.
    AnnotationLayer.prototype.CheckActive = function(event) {
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

    window.AnnotationLayer = AnnotationLayer;
})();

