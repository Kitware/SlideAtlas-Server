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
    // We need unique names for the HTML elements.
    this.Widget = $('<table>').appendTo('body')
      .css({
        'opacity': '0.6',
        'position': 'absolute',
        'height': '28px',
        'bottom' : '5px',
        'right' : '20px',
        'z-index': '1'});;

    viewer.AddGuiObject(this.Widget, "Bottom", 5, "Right", 312);

    var row = $('<tr>').appendTo(this.Widget)
    var cell = $('<td>').appendTo(row)
    this.VisibilityButton = $('<img>').appendTo(cell)
      .css({
        'opacity': '0.6',
        'border-radius': '5px'})
      .attr('type','image')
      .attr('src',"/webgl-viewer/static/pencil3.png")
      .click(function(){self.ToggleVisibility();});

    this.ToolsTable = $('<td>').appendTo(row)
      .hide()
      .css({
        'opacity': '0.6',
        'width': '182',
        'border-radius': '5px'});

    $('<img>').appendTo(this.ToolsTable)
      .css({'height': '28px'})
      .attr('type','image')
      .attr('src',"/webgl-viewer/static/Text.gif")
      .click(function(){self.NewText();});
    $('<img>').appendTo(this.ToolsTable)
      .css({'height': '28px'})
      .attr('type','image')
      .attr('src',"/webgl-viewer/static/Circle.gif")
      .click(function(){self.NewCircle();});
    $('<img>').appendTo(this.ToolsTable)
      .css({'height': '28px'})
      .attr('type','image')
      .attr('src',"/webgl-viewer/static/FreeForm.gif")
      .click(function(){self.NewPolyline();});
    $('<img>').appendTo(this.ToolsTable)
      .css({'height': '28px'})
      .attr('type','image')
      .attr('src',"/webgl-viewer/static/Pencil-icon.jpg")
      .click(function(){self.NewPencil();});
    $('<img>').appendTo(this.ToolsTable)
      .css({'height': '28px'})
      .attr('type','image')
      .attr('src',"/webgl-viewer/static/select_lasso.png")
      .click(function(){self.NewLasso();});
    $('<img>').appendTo(this.ToolsTable)
      .css({'height': '28px'})
      .attr('type','image')
      .attr('src',"/webgl-viewer/static/arrowWidget.png")
      .click(function(){self.NewArrowStamp();});
  }
}

AnnotationWidget.prototype.SetVisibility = function(visibility) {
  if (this.Viewer.GetAnnotationVisibility() == visibility) {
    return;
  }
  if (this.VisibilityButton) {
    if (visibility == ANNOTATION_OFF) {
      this.VisibilityButton.attr('src',"/webgl-viewer/static/pencil3.png")
      this.ToolsTable.fadeOut();
    } else if (visibility == ANNOTATION_NO_TEXT) {
      this.VisibilityButton.attr('src',"/webgl-viewer/static/pencil3Flip.png")
      this.ToolsTable.fadeIn();
    } else {
      this.VisibilityButton.attr('src',"/webgl-viewer/static/pencil3Up.png")
      this.ToolsTable.fadeIn();
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
    vis = ANNOTATION_NO_TEXT;
  } else if (vis == ANNOTATION_NO_TEXT) {
    vis = ANNOTATION_ON;
  } else {
    vis = ANNOTATION_OFF;
  }
  this.SetVisibility( vis );
  RecordState();
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
  // Set default color rom the last text widget setting.
  var hexcolor = document.getElementById("textcolor").value;
  widget.Shape.SetColor(hexcolor);
  widget.AnchorShape.SetFillColor(hexcolor);
  // Default value for anchor shape visibility
  widget.AnchorShape.Visibility = document.getElementById("TextMarker").value;
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

AnnotationWidget.prototype.NewArrowStamp = function() {
  var widget = this.Viewer.ActiveWidget;
  if ( widget && (widget instanceof ArrowStampWidget)) {
    widget.Deactivate();
    return;
  }
  this.SetVisibility(ANNOTATION_ON);
  var widget = new ArrowStampWidget(this.Viewer, true);
  this.Viewer.ActiveWidget = widget;
}

AnnotationWidget.prototype.NewDialogWidget = function() {
  var widget = this.Viewer.ActiveWidget;
  if ( widget && (widget instanceof DialogWidget)) {
    widget.Deactivate();
    return;
  }
  this.SetVisibility(ANNOTATION_ON);
  var widget = new DialogWidget(this.Viewer, true);
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

