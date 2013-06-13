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
//   or maybe the delete key.

function AnnotationWidget (viewer) {
  var self = this; // trick to set methods in callbacks. 
  this.Viewer = viewer;
  // We need unique names for the HTML elements.
  this.Widget = $('<table>').appendTo('body')
    .css({
      'opacity': '0.5',
      'position': 'absolute',
      'height': '28px',
      'bottom' : '5px',
      'right' : '20px',
      'z-index': '1'});;

  viewer.AddGuiObject(this.Widget, "Bottom", 5, "Right", 260);

  var row = $('<tr>').appendTo(this.Widget)
  var cell = $('<td>').appendTo(row)
  this.VisibilityButton = $('<img>').appendTo(cell)
    .css({
      'opacity': '0.5',
      'border-radius': '5px'})
    .attr('type','image')
    .attr('src',"webgl-viewer/static/pencil3.png")
    .click(function(){self.ToggleVisibility();});
  
  this.ToolsTable = $('<td>').appendTo(row)
    .hide()
    .css({
      'opacity': '0.5',
      'width': '100',
      'border-radius': '5px'});

  $('<img>').appendTo(this.ToolsTable)
    .css({'height': '28px'})
    .attr('type','image')
    .attr('src',"webgl-viewer/static/Text.gif")
    .click(function(){self.NewText();});
  $('<img>').appendTo(this.ToolsTable)
    .css({'height': '28px'})
    .attr('type','image')
    .attr('src',"webgl-viewer/static/Circle.gif")
    .click(function(){self.NewCircle();});
  $('<img>').appendTo(this.ToolsTable)
    .css({'height': '28px'})
    .attr('type','image')
    .attr('src',"webgl-viewer/static/FreeForm.gif")
    .click(function(){self.NewPolyline();});
}

AnnotationWidget.prototype.SetVisibility = function(visibility) {
  if (visibility) {
    this.VisibilityButton.attr('src',"webgl-viewer/static/pencil3Flip.png")    
    this.ToolsTable.fadeIn();
  } else {
    this.VisibilityButton.attr('src',"webgl-viewer/static/pencil3.png")
    this.ToolsTable.fadeOut();  
  }
  this.Viewer.ShapeVisibility = visibility;

  RecordState();

  eventuallyRender();    
}

AnnotationWidget.prototype.GetVisibility = function() {
  return this.Viewer.ShapeVisibility;
}

AnnotationWidget.prototype.ToggleVisibility = function() {
  this.SetVisibility(! this.GetVisibility());
}

// I would like to change the behavior of this.  
// First slide the arrow, then pop up the dialog to set text.
AnnotationWidget.prototype.NewText = function() {
  this.SetVisibility(true);
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
  
  RecordState();
}

AnnotationWidget.prototype.NewPolyline = function() {
  this.SetVisibility(true);
  var widget = new PolylineWidget(this.Viewer, true);
  widget.Shape.SetOutlineColor(document.getElementById("polylinecolor").value);
  this.Viewer.ActiveWidget = widget;

  RecordState();
}

AnnotationWidget.prototype.NewCircle = function() {
  this.SetVisibility(true);
  var widget = new CircleWidget(this.Viewer, true);
  widget.Shape.SetOutlineColor(document.getElementById("circlecolor").value);
  this.Viewer.ActiveWidget = widget;

  RecordState();
}

