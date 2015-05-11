// Annotation widget toggles annotation visibility and also shows the drawing tools.
// Each view will need its own widget.
// I am less happy about this than the right click menu implementation.
// It would be nice to expand the drawing tools on hover, but
// the toggle for annotation visibiity naturally suggests
// the same state should show drawing tool palette.

// Todo:
// - Make an object out of it to support two views.
// - Change behavior of text widget to first drag an arrow when created.
// - eliminate polyLine verticies when they are dragged ontop of another vert.
// or maybe the delete key.

function AnnotationWidget (viewer) {
    var self = this; // trick to set methods in callbacks.
    this.Viewer = viewer;
    viewer.AnnotationWidget = this;
    
    if ( ! MOBILE_DEVICE) {
        this.Tab = new Tab("/webgl-viewer/static/pencil3Up.png", "annotationTab");
        viewer.AddGuiObject(this.Tab.Div, "Bottom", 0, "Right", 140);
        new ToolTip(this.Tab.Div, "Annotation");


        this.Tab.Panel.css({'width': '108px',
                            'left': '-38px'});
        this.VisibilityDiv = $('<div>')
            .appendTo(this.Tab.Panel)
            .css({'height': '28px',
                  'opacity': '0.9',
                  'overflow': 'hidden',
                  'position': 'relative'})
            .click(function(){self.ToggleVisibility();});
        this.VisibilityImage = $('<img>')
            .appendTo(this.VisibilityDiv)
            .css({'height': '56px',
                  'opacity': '0.6',
                  'position': 'relative'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/toggleswitch.jpg");

        this.TextButton = $('<img>')
            .appendTo(this.Tab.Panel)
            .css({'height': '28px',
                  'opacity': '0.6',
                  'margin': '1px',
                  'border-style': 'outset',
                  'border-radius': '4px',
                  'border-thickness':'2px'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/Text.gif")
            .click(function(){self.NewText();});
        this.CircleButton = $('<img>')
            .appendTo(this.Tab.Panel)
            .css({'height': '28px',
                  'opacity': '0.6',
                  'margin': '1px',
                  'border-style': 'outset',
                  'border-radius': '4px',
                  'border-thickness':'2px'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/Circle.gif")
            .click(function(){self.NewCircle();});
        this.PolylineButton = $('<img>')
            .appendTo(this.Tab.Panel)
            .css({'height': '28px',
                  'opacity': '0.6',
                  'margin': '1px',
                  'border-style': 'outset',
                  'border-radius': '4px',
                  'border-thickness':'2px'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/FreeForm.gif")
            .click(function(){self.NewPolyline();});
        this.PencilButton = $('<img>')
            .appendTo(this.Tab.Panel)
            .css({'height': '28px',
                  'opacity': '0.6',
                  'margin': '1px',
                  'border-style': 'outset',
                  'border-radius': '4px',
                  'border-thickness':'2px'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/Pencil-icon.jpg")
            .click(function(){self.NewPencil();});
        this.LassoButton = $('<img>')
            .appendTo(this.Tab.Panel)
            .css({'height': '28px',
                  'opacity': '0.6',
                  'margin': '1px',
                  'border-style': 'outset',
                  'border-radius': '4px',
                  'border-thickness':'2px'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/select_lasso.png")
            .click(function(){self.NewLasso();});
        this.SectionsButton = $('<img>')
            .appendTo(this.Tab.Panel)
            .css({'height': '28px',
                  'opacity': '0.6',
                  'margin': '1px',
                  'border-style': 'outset',
                  'border-radius': '4px',
                  'border-thickness':'2px'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/sections.png")
            .click(function(){self.DetectSections();});
        /*this.FillButton = $('<img>')
            .appendTo(this.Tab.Panel)
            .css({'height': '28px',
                  'opacity': '0.6',
                  'margin': '1px',
                  'border-style': 'outset',
                  'border-radius': '4px',
                  'border-thickness':'2px'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/brush1.jpg")
            .click(function(){self.NewFill();});
            */
    }
}

AnnotationWidget.prototype.SetVisibility = function(visibility) {
  if (this.Viewer.GetAnnotationVisibility() == visibility) {
    return;
  }
  if (this.VisibilityImage) {
    if (visibility == ANNOTATION_OFF) {
        this.VisibilityImage.css({'top': '-30px'});
    } else {
        this.VisibilityImage.css({'top': '1px'});
    }
  }

  this.Viewer.SetAnnotationVisibility(visibility);

  eventuallyRender();
}

AnnotationWidget.prototype.GetVisibility = function() {
  return this.Viewer.GetAnnotationVisibility();
}

AnnotationWidget.prototype.ToggleVisibility = function() {
    var vis = this.GetVisibility();
    if (vis == ANNOTATION_OFF) {
        vis = ANNOTATION_ON;
    } else {
        vis = ANNOTATION_OFF;
    }
    this.SetVisibility( vis );
    RecordState();
}



AnnotationWidget.prototype.TogglePanel = function() {
    this.Panel.toggle();
    if (this.Panel.is(":visible")) {
        this.TabButton.css({'border-color': '#FFF #BBB #BBB #BBB',
                            'border-radius': '0px 0px 5px 5px',
                            'opacity': '1'});
    } else {
        // Should we deactivate any active widget tool?
        this.TabButton.css({'border-color': '#BBB',
                            'border-radius': '5px',
                            'opacity': '0.6'});
    }
}







// I would like to change the behavior of this.
// First slide the arrow, then pop up the dialog to set text.
AnnotationWidget.prototype.NewText = function() {
    var button = this.TextButton;
    var widget = this.ActivateButton(button, TextWidget);
    // The dialog is used to set the initial text.
    widget.ShowPropertiesDialog();
}

// Probably want a singleton pencil.
AnnotationWidget.prototype.NewPencil = function() {
    var button = this.PencilButton;
    var widget = this.ActivateButton(button, PencilWidget);
}

AnnotationWidget.prototype.NewLasso = function() {
    var button = this.LassoButton;
    var widget = this.ActivateButton(button, LassoWidget);
}

AnnotationWidget.prototype.NewPolyline = function() {
    var button = this.PolylineButton;
    var widget = this.ActivateButton(button, PolylineWidget);
}

AnnotationWidget.prototype.NewCircle = function() {
    var button = this.CircleButton;
    var widget = this.ActivateButton(button, CircleWidget);
    // Use the mouse position to place the circle.
    // Mouse in under button.  Should we put the cirlce in the middle?
    widget.Shape.Origin = this.Viewer.ConvertPointViewerToWorld(EVENT_MANAGER.LastMouseX,
                                                                EVENT_MANAGER.LastMouseY);
}


AnnotationWidget.prototype.NewFill = function() {
    var button = this.FillButton;
    var widget = this.ActivateButton(button, FillWidget);
    widget.Initialize();
}


// Boilerplate code that was in every "newWidget" method.
AnnotationWidget.prototype.ActivateButton = function(button, WidgetType) {
    var widget = this.Viewer.ActiveWidget;
    if ( widget ) {
        if  (button.Pressed) {
            // The user pressed the button again (while it was active).
            widget.Deactivate();
            return;
        }
        // This call sets pressed to false as a side action..
        widget.Deactivate();
    }
    button.Pressed = true;
    button.css({'border-style': 'inset',
                'opacity': '1.0'});

    this.SetVisibility(ANNOTATION_ON);
    widget = new WidgetType(this.Viewer, true);
    this.Viewer.ActiveWidget = widget;

    // Button remains "pressed" until the circle deactivates.
    widget.DeactivateCallback = 
        function () {
            button.css({'border-style': 'outset',
                        'opacity': '0.6'});
            widget.DeactivateCallback = undefined;
            button.Pressed = false;
        }
    return widget;
}


AnnotationWidget.prototype.DetectSections = function() {
    var widget = this.Viewer.ActiveWidget;
    var button = this.SectionsButton;
    if ( widget ) {
        if  (button.Pressed) {
            // The user pressed the button again (while it was active).
            widget.Deactivate();
            return;
        }
        // This call sets pressed to false as a side action.
        widget.Deactivate();
    }
    button.Pressed = true;
    button.css({'border-style': 'inset',
                'opacity': '1.0'});

    // See if a SectionsWidget already exists.
    var widget = null;
    for (var i = 0; i < this.Viewer.WidgetList.length && widget == null; ++i) {
        var w = this.Viewer.WidgetList[i];
        //if (w instanceOf SectionsWidget) {
        if (w.Type == "sections") {
            widget = w;
        }
    }
    if (widget == null) {
        // Find sections to initialize sections widget.
        widget = new SectionsWidget(this.Viewer, false);
        widget.ComputeSections();
        if (widget.IsEmpty()) {
            widget.RemoveFromViewer();
            button.css({'border-style': 'outset',
                        'opacity': '0.6'});
            button.Pressed = false;
            return;
        }
    }

    widget.SetActive(true);
    widget.DeactivateCallback = 
        function () {
            button.css({'border-style': 'outset',
                        'opacity': '0.6'});
            widget.DeactivateCallback = undefined;
            button.Pressed = false;
        }
}
