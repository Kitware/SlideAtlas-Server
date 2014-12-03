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
        // Maybe I should try to set parent to viewer.
        this.Tab = $('<div>')
            .appendTo('body')
            .attr('id', 'debug')
            .css({'z-index' : '3',
                  'position': 'absolute'});
        viewer.AddGuiObject(this.Tab, "Bottom", 0, "Right", 150);

        // Button has to have the border (not the tab) to be covered by Div.
        this.TabButton = $('<img>')
            .appendTo(this.Tab)
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/pencil3Up.png");
            .css({'z-index' : '3',
                  'padding' : '2px 2px 0px 2px',
                  'border-width': '1px',
                  'border-style': 'solid',
                  'border-radius': '5px',
                  'border-color': '#BBB',
                  'background-color': '#FFF'})
            .click(function(){self.ToggleTools();});

        this.Div = $('<div>')
            .appendTo(this.Tab)
            .hide()
            .css({
                'background-color': 'white',
                'border-style': 'solid',
                'border-width': '1px',
                'border-radius': '5px',
                'border-color': '#BBB',
                'position': 'absolute',
                'bottom': '30px',
                'left':  '-5px',
                'z-index': '2',
                'padding': '2px 2px 0px 2px'});

        this.VisibilityDiv = $('<div>')
            .appendTo(this.Div)
            .css({'height': '28px',
                  'opacity': '0.6',
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

        $('<img>').appendTo(this.Div)
            .css({'height': '28px',
                  'opacity': '0.6'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/Text.gif")
            .click(function(){self.NewText();});
        $('<img>').appendTo(this.Div)
            .css({'height': '28px',
                 'opacity': '0.6'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/Circle.gif")
            .click(function(){self.NewCircle();});
        $('<img>').appendTo(this.Div)
            .css({'height': '28px',
                  'opacity': '0.6'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/FreeForm.gif")
            .click(function(){self.NewPolyline();});
        $('<img>').appendTo(this.Div)
            .css({'height': '28px',
                  'opacity': '0.6'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/Pencil-icon.jpg")
            .click(function(){self.NewPencil();});
        $('<img>').appendTo(this.Div)
            .css({'height': '28px',
                  'opacity': '0.6'})
            .attr('type','image')
            .attr('src',"/webgl-viewer/static/select_lasso.png")
            .click(function(){self.NewLasso();});
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



AnnotationWidget.prototype.ToggleTools = function() {
    this.Div.toggle();
    if (this.Div.is(":visible")) {
        this.TabButton.css({'border-color': '#FFF #BBB #BBB #BBB',
                            'border-radius': '0px 0px 5px 5px',
                            'opacity': '1'});
    } else {
        this.TabButton.css({'border-color': '#BBB',
                            'border-radius': '5px',
                            'opacity': '0.6'});
    }
}







// I would like to change the behavior of this.
// First slide the arrow, then pop up the dialog to set text.
AnnotationWidget.prototype.NewText = function() {
  var widget = this.Viewer.ActiveWidget;
  if ( widget ) {
    widget.Deactivate();
  }
  this.SetVisibility(ANNOTATION_ON);
  var widget = new TextWidget(this.Viewer, "");
  this.Viewer.ActiveWidget = widget;

  // The dialog is used to set the initial text.
  widget.ShowPropertiesDialog();
}

// Probably want a singleton pencil.
AnnotationWidget.prototype.NewPencil = function() {
  var widget = this.Viewer.ActiveWidget;
  if ( widget && (widget instanceof PencilWidget)) {
    widget.Deactivate();
    return;
  }
  this.SetVisibility(ANNOTATION_ON);
  var widget = new PencilWidget(this.Viewer, true);
  this.Viewer.ActiveWidget = widget;
}

AnnotationWidget.prototype.NewLasso = function() {
  var widget = this.Viewer.ActiveWidget;
  if ( widget && (widget instanceof LassoWidget)) {
    widget.Deactivate();
    return;
  }
  this.SetVisibility(ANNOTATION_ON);
  var widget = new LassoWidget(this.Viewer, true);
  this.Viewer.ActiveWidget = widget;
}

AnnotationWidget.prototype.NewPolyline = function() {
  var widget = this.Viewer.ActiveWidget;
  if ( widget ) {
    widget.Deactivate();
  }
  this.SetVisibility(ANNOTATION_ON);
  var widget = new PolylineWidget(this.Viewer, true);
  this.Viewer.ActiveWidget = widget;
}

AnnotationWidget.prototype.NewCircle = function() {
  var widget = this.Viewer.ActiveWidget;
  if ( widget ) {
    widget.Deactivate();
  }
  this.SetVisibility(ANNOTATION_ON);
  var widget = new CircleWidget(this.Viewer, true);

  // Use the mouse position to place the circle.
  widget.Shape.Origin = this.Viewer.ConvertPointViewerToWorld(EVENT_MANAGER.LastMouseX,
                                                              EVENT_MANAGER.LastMouseY);

  this.Viewer.ActiveWidget = widget;
}

