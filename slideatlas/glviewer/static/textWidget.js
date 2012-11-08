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

// TODO:  Dragging the arrow should not snap the tip to the mouse.

//==============================================================================



var TEXT_WIDGET_WAITING = 0;
var TEXT_WIDGET_ACTIVE = 1;
var TEXT_WIDGET_DRAG = 2; // Drag text with position
var TEXT_WIDGET_DRAG_TEXT = 3; // Drag text but leave the position the same.
var TEXT_WIDGET_PROPERTIES_DIALOG = 4;

function TextWidget (viewer, string) {
  if (viewer == null) {
    return null;
  }
  this.Viewer = viewer;
  this.State = TEXT_WIDGET_WAITING;
  this.CursorLocation = 0; // REMOVE

  var cam = this.Viewer.MainView.Camera;

  this.Shape = new Text();
  this.Shape.String = string;
  this.Shape.UpdateBuffers(); // Needed to get the bounds.
  this.Shape.Color = [0.0, 0.0, 0.0];
  this.Shape.Anchor = [0.5*(this.Shape.PixelBounds[0]+this.Shape.PixelBounds[1]),
                      0.5*(this.Shape.PixelBounds[2]+this.Shape.PixelBounds[3])];

  // I would like to setup the ancoh in the middle of the screen,
  // And have the Anchor in the middle of the text.
  this.Shape.Position = [cam.FocalPoint[0], cam.FocalPoint[1]];
  
  // The anchor shape could be put into the text widget, but I might want a thumb tack anchor.
  this.AnchorShape = new Arrow();
  this.AnchorShape.Origin = this.Shape.Position; // note: both point to the same memory now.
  this.AnchorShape.Length = 50;
  this.AnchorShape.Width = 10;
  this.AnchorShape.UpdateBuffers();
  this.AnchorShape.Visibility = false;
  this.AnchorShape.Orientation = 45.0; // in degrees, counter clockwise, 0 is left
  this.AnchorShape.FillColor = [0,0,0];
  this.AnchorShape.OutlineColor = [1,1,1];
  this.AnchorShape.ZOffset = 0.2;
  this.AnchorShape.UpdateBuffers();

  viewer.WidgetList.push(this);
  viewer.AddShape(this.Shape);
  viewer.AddShape(this.AnchorShape);
  this.ActiveReason = 1;
}

TextWidget.prototype.RemoveFromViewer = function() {
  if (this.Viewer == null) {
    return;
  }
  var idx = this.Viewer.ShapeList.indexOf(this.Shape);
  if(idx!=-1) { 
    this.Viewer.ShapeList.splice(idx, 1); 
  }
  var idx = this.Viewer.ShapeList.indexOf(this.AnchorShape);
  if(idx!=-1) { 
    this.Viewer.ShapeList.splice(idx, 1); 
  }
  var idx = this.Viewer.WidgetList.indexOf(this);
  if(idx!=-1) { 
    this.Viewer.WidgetList.splice(idx, 1); 
  }
}

TextWidget.prototype.Serialize = function() {
  if(this.Shape === undefined){ return null; }
  var obj = new Object();
  obj.type = "text";
  obj.color = this.Shape.Color;
  obj.size = this.Shape.Size;
  obj.offset = [-this.Shape.Anchor[0], -this.Shape.Anchor[1]];
  obj.position = this.Shape.Position;
  obj.string = this.Shape.String;
  obj.anchorVisibility = this.AnchorShape.Visibility;
  return obj;
}

// Load a widget from a json object (origin MongoDB).
TextWidget.prototype.Load = function(obj) {
  var string = obj.string;
  // Some empty strings got in my database.  I connot delete them from the gui.
  if (obj.string && obj.string == "") {
    this.RemoveFromViewer();
    return;
  }

  this.Shape.String = obj.string;
  this.Shape.Color = [parseFloat(obj.color[0]),
                      parseFloat(obj.color[1]),
                      parseFloat(obj.color[0])];
  this.Shape.Size = parseFloat(obj.size);
  // I added offest and I have to deal with entries that do not have it.
  if (obj.offset) { // how to try / catch in javascript?
    this.SetTextOffset(parseFloat(obj.offset[0]), 
                       parseFloat(obj.offset[1]));
  }
  this.Shape.Position = [parseFloat(obj.position[0]),
                         parseFloat(obj.position[1]),
                         parseFloat(obj.position[2])];
  this.SetAnchorShapeVisibility(obj.anchorVisibility == "true");
  this.Shape.UpdateBuffers();
}

// When the arrow is visible, the text is offset from the position (tip of arrow).
TextWidget.prototype.SetTextOffset = function(x, y) {
  this.SavedShapeAnchor = [-x, -y];
  this.Shape.Anchor = this.SavedShapeAnchor;
  this.UpdateAnchorShape();
}


// When the arrow is visible, the text is offset from the position (tip of arrow).
TextWidget.prototype.SetPosition = function(x, y) {
  this.Shape.Position = [x, y];
  this.AnchorShape.Origin = this.Shape.Position;
}

// Anchor is in the middle of the bounds when the shape is not visible.
TextWidget.prototype.SetAnchorShapeVisibility = function(flag) {
  if (this.AnchorShape.Visibility == flag) {
    return;
  }
  if (flag) { // turn glyph on
    if (this.SavedShapeAnchor == undefined) {
      this.SavedShapeAnchor = [-30, 0];
      }
    this.Shape.Anchor = this.SavedShapeAnchor;
    this.AnchorShape.Visibility = true;
    this.AnchorShape.Origin = this.Shape.Position;
    this.UpdateAnchorShape();
  } else { // turn glyph off
    // save the old anchor incase glyph is turned back on.
    this.SavedShapeAnchor = [this.Shape.Anchor[0], this.Shape.Anchor[1]];
    // Put the new (invisible rotation point (anchor) in the middle bottom of the bounds.
    this.Shape.Anchor = [(this.Shape.PixelBounds[0]+this.Shape.PixelBounds[1])*0.5, this.Shape.PixelBounds[2]];
    this.AnchorShape.Visibility = false;
  }
  eventuallyRender();
}

// Change orientation and length of arrow based on the anchor location.
TextWidget.prototype.UpdateAnchorShape = function() {
  // Compute the middle of the text bounds.
  var xMid = 0.5 * (this.Shape.PixelBounds[0] + this.Shape.PixelBounds[1]); 
  var yMid = 0.5 * (this.Shape.PixelBounds[2] + this.Shape.PixelBounds[3]); 
  var xRad = 0.5 * (this.Shape.PixelBounds[1] - this.Shape.PixelBounds[0]); 
  var yRad = 0.5 * (this.Shape.PixelBounds[3] - this.Shape.PixelBounds[2]); 

  // Compute the angle of the arrow.
  var dx = this.Shape.Anchor[0]-xMid;
  var dy = this.Shape.Anchor[1]-yMid;
  this.AnchorShape.Orientation = 180.0 + Math.atan2(dy, dx) * 180.0 / Math.PI;
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
  this.AnchorShape.Length = length;
  this.AnchorShape.UpdateBuffers();
}

TextWidget.prototype.HandleKeyPress = function(keyCode, shift) {
}

TextWidget.prototype.HandleMouseDown = function(event) {
  if (this.State == TEXT_WIDGET_ACTIVE) {
    if (this.AnchorShape.Visibility && this.ActiveReason == 0) {
      this.State = TEXT_WIDGET_DRAG_TEXT;
    } else {
      this.State = TEXT_WIDGET_DRAG;
    }
    eventuallyRender();
  }
}

// returns false when it is finished doing its work.
TextWidget.prototype.HandleMouseUp = function(event) {
  if (this.State == TEXT_WIDGET_DRAG || this.State == TEXT_WIDGET_DRAG_TEXT) {
    this.State = TEXT_WIDGET_ACTIVE;
    }
  
  if (this.State == TEXT_WIDGET_ACTIVE && event.SystemEvent.which == 3) {
    // Right mouse was pressed.
    // Pop up the properties dialog.
    // Which one should we popup?
    // Add a ShowProperties method to the widget. (With the magic of javascript). 
    this.State = TEXT_WIDGET_PROPERTIES_DIALOG;
    this.ShowPropertiesDialog();
    }
}


// I need to convert mouse screen point to coordinates of text buffer
// to see if the mouse position is in the bounds of the text.
TextWidget.prototype.ScreenPixelToTextPixelPoint = function(x,y) {
  var textOriginScreenPixelPosition = this.Viewer.ConvertPointWorldToViewer(this.Shape.Position[0],this.Shape.Position[1]);
  x = (x - textOriginScreenPixelPosition[0]) + this.Shape.Anchor[0];  
  y = (y - textOriginScreenPixelPosition[1]) + this.Shape.Anchor[1];  

  return [x,y];
}

TextWidget.prototype.HandleMouseMove = function(event) {
  if (this.State == TEXT_WIDGET_DRAG) {
    this.Shape.Position = this.Viewer.ConvertPointViewerToWorld(event.MouseX, event.MouseY);
    this.AnchorShape.Origin = this.Shape.Position;
    eventuallyRender();
    return true;
  }
  if (this.State == TEXT_WIDGET_DRAG_TEXT) { // Just the text not the anchor glyph
    this.Shape.Anchor[0] -= event.MouseDeltaX;
    this.Shape.Anchor[1] -= event.MouseDeltaY;
    this.UpdateAnchorShape();
    eventuallyRender();
    return true;
  }
  // We do not want to deactivate the widget while the properties dialog is showing.
  if (this.State != TEXT_WIDGET_PROPERTIES_DIALOG) {
    return this.CheckActive(event);
  }
  return true;
}

TextWidget.prototype.CheckActive = function(event) {
  var tMouse = this.ScreenPixelToTextPixelPoint(event.MouseX, event.MouseY);

  // First check anchor
  // thencheck to see if the point is no the bounds of the text.

  if (this.AnchorShape.Visibility && this.AnchorShape.PointInShape(tMouse[0]-this.Shape.Anchor[0], tMouse[1]-this.Shape.Anchor[1])) {
    this.ActiveReason = 1; // Hackish
    // Doulbe hack. // Does not get highlighted because widget already active.
    this.AnchorShape.Active = true; eventuallyRender();
    this.SetActive(true);
    return true;
  }
  if (tMouse[0] > this.Shape.PixelBounds[0] && tMouse[0] < this.Shape.PixelBounds[1] &&
      tMouse[1] > this.Shape.PixelBounds[2] && tMouse[1] < this.Shape.PixelBounds[3]) {
    this.ActiveReason = 0;
    this.SetActive(true);
    return true;
  }
  this.SetActive(false);
  return false;
}

TextWidget.prototype.GetActive = function() {
  if (this.State == TEXT_WIDGET_ACTIVE || this.State == TEXT_WIDGET_PROPERTIES_DIALOG) {
    return true;  
  }
  return false;
}

TextWidget.prototype.SetActive = function(flag) {
  // Dialog state is tricky because the widget is still active.
  // SetActive is used to clear the dialog state.
  if (this.State == TEXT_WIDGET_PROPERTIES_DIALOG) {
    this.State == TEXT_WIDGET_ACTIVE;
  }
  
  if (flag == this.GetActive()) {
    return;
  }

  if (flag) {
    this.State = TEXT_WIDGET_ACTIVE;  
    this.Shape.Active = true;
    if (this.ActiveReason == 1) {
      this.AnchorShape.Active = true;
    }
    this.Viewer.ActivateWidget(this);
    eventuallyRender();
  } else {
    this.State = TEXT_WIDGET_WAITING;
    this.Shape.Active = false;
    this.AnchorShape.Active = false;
    this.Viewer.DeactivateWidget(this);
    eventuallyRender();
  }
}

TextWidget.prototype.ShowPropertiesDialog = function () {
  var ta = document.getElementById("textwidgetcontent");
  ta.value = this.Shape.String;
  var tm = document.getElementById("TextMarker");
  tm.checked = this.AnchorShape.Visibility;
  
  $("#text-properties-dialog").dialog("open");
}    






