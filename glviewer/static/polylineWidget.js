//==============================================================================
// Mouse click places a point.
// A small circle will be used to shaow an active vertex.
// Widget starts with an active vertex (mouse up).
// Mouse down->up places the vertex and deactivates it. A new deactive vertex is created.
// Mouse drag at this point drages an edge from the last vertex.


// Todo: Merge vertecies
// Properties dialog for a point (or list).

var POLYLINE_WIDGET_NEW = 0;
var POLYLINE_WIDGET_NEW_EDGE = 1;
var POLYLINE_WIDGET_WAITING = 2;
var POLYLINE_WIDGET_VERTEX_ACTIVE = 3;
var POLYLINE_WIDGET_MIDPOINT_ACTIVE = 4;
var POLYLINE_WIDGET_ACTIVE = 5;
var POLYLINE_WIDGET_PROPERTIES_DIALOG = 6;


function PolylineWidget (viewer, newFlag) {
  if (viewer === undefined) {
    return;
  }
  
  this.Dialog = new Dialog(this);
  this.Dialog.Title.text("Polyline Annotation Editor");
  
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
  
  this.Popup = new WidgetPopup(this);
  var cam = viewer.MainView.Camera;
  var viewport = viewer.MainView.Viewport;

  this.Viewer = viewer;
  // If the last point is the same as the first point, ClosedLoop is true.
  this.ClosedLoop = false;
  // Circle is to show an active vertex.
  this.Circle = new Circle();
  this.Circle.FillColor = [1.0, 1.0, 0.2];
  this.Circle.OutlineColor = [0.0,0.0,0.0];
  this.Circle.FixedSize = false;
  this.Circle.ZOffset = -0.05;

  this.Shape = new Polyline();
  this.Shape.OutlineColor = [0.0, 0.0, 0.0];
  this.Shape.SetOutlineColor(this.Dialog.ColorInput.value);
  this.Shape.FixedSize = false;

  this.Viewer.WidgetList.push(this);

  // Set line thickness using viewer. (5 pixels).
  // The Line width of the shape switches to 0 (single line)
  // when the actual line with is too thin.
  this.LineWidth = 10.0;
  this.Shape.LineWidth =this.LineWidth;
  this.Circle.Radius = this.LineWidth;
  this.Circle.UpdateBuffers();

  if (newFlag) {
    this.State = POLYLINE_WIDGET_NEW;
    this.Shape.Active = true;
    this.ActiveVertex = -1;
    this.Viewer.ActivateWidget(this);
  } else {
    this.State = POLYLINE_WIDGET_WAITING;
    this.Circle.Visibility = false;
    this.ActiveVertex == -1;
  }
  this.ActiveMidpoint = -1;

  // Look for default values for color and line width.
  if (localStorage.PolylineProperties != undefined) {
    var polylineProperties = JSON.parse(localStorage.PolylineProperties);
    if (polylineProperties.Color != undefined) {
      this.Shape.OutlineColor = polylineProperties.Color;
    }
    if (polylineProperties.LineWidth != undefined) {
      this.LineWidth = polylineProperties.LineWidth;
    }
  }

  // Set some default values for bounds.
  var cam = viewer.GetCamera();
  var radius = cam.Height / 4;
  this.Bounds = [cam.FocalPoint[0]-radius, cam.FocalPoint[0]+radius,
                 cam.FocalPoint[1]-radius, cam.FocalPoint[1]+radius];
  this.UpdateCircleRadius();

  eventuallyRender();
}

// This is called whenever the shape changes.
PolylineWidget.prototype.UpdateBounds = function() {
  if (this.Shape.Points.length < 2) { return; }
  var xMin = this.Shape.Points[0][0];
  var xMax = xMin;
  var yMin = this.Shape.Points[0][1];
  var yMax = yMin;
  for (var i = 1; i < this.Shape.Points.length; ++i) {
    var pt = this.Shape.Points[i];
    xMin = Math.min(xMin, pt[0]);
    xMax = Math.max(xMin, pt[0]);
    yMin = Math.min(yMin, pt[1]);
    yMax = Math.max(yMin, pt[1]);
  }
  this.Bounds = [xMin, xMax, yMin, yMax];
}



// Setting the circle radius based on line width does not work.
// Choose maximum based on screen size and fraction of polyline bounds.
PolylineWidget.prototype.UpdateCircleRadius = function() {
  var height = this.Viewer.GetCamera().Height;
  var radius = height / 200;
  radius = Math.min(radius, (this.Bounds[3]-this.Bounds[2]) * 0.25);
  radius = Math.max(radius, this.LineWidth);

  this.Circle.Radius = radius;
  this.Circle.UpdateBuffers();
}


PolylineWidget.prototype.Draw = function(view) {
    // When the line is too thin, we can see nothing.
    // Change it to line drawing.
    var cam = this.Viewer.MainView.Camera;
    var viewport = this.Viewer.MainView.Viewport;
    var minLine = cam.Height/viewport[3];
    if (this.LineWidth < minLine) {
      // Too thin. Use a single line.
      this.Shape.LineWidth = 0;
    } else {
      this.Shape.LineWidth = this.LineWidth;
    }

    this.Shape.Draw(view);
    this.Circle.Draw(view);
}


PolylineWidget.prototype.PasteCallback = function(data) {
  this.Load(data);
  // Place the widget over the mouse.
  // This is more difficult than the circle.  Compute the shift.
  var xOffset = EVENT_MANAGER.MouseWorldX - (this.Bounds[0]+this.Bounds[1])/2;
  var yOffset = EVENT_MANAGER.MouseWorldY - (this.Bounds[2]+this.Bounds[3])/2;
  for (var i = 0; i < this.Shape.Points.length; ++i) {
    this.Shape.Points[i][0] += xOffset;
    this.Shape.Points[i][1] += yOffset;
  }
  this.UpdateBounds();
  this.Shape.UpdateBuffers();

  eventuallyRender();
}



PolylineWidget.prototype.Serialize = function() {
  if(this.Shape === undefined){ return null; }
  var obj = new Object();
  obj.type = "polyline";
  obj.outlinecolor = this.Shape.OutlineColor;
  obj.linewidth = this.LineWidth;
  // Copy the points to avoid array reference bug.
  obj.points = [];
  for (var i = 0; i < this.Shape.Points.length; ++i) {
    obj.points.push([this.Shape.Points[i][0], this.Shape.Points[i][1]]);
  }
  this.UpdateBounds();

  obj.closedloop = this.ClosedLoop;
  return obj;
}

// Load a widget from a json object (origin MongoDB).
PolylineWidget.prototype.Load = function(obj) {
  this.Shape.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
  this.Shape.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
  this.Shape.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
  this.LineWidth = parseFloat(obj.linewidth);
  this.Shape.LineWidth = this.LineWidth;
  for(var n=0; n < obj.points.length; n++){
      this.Shape.Points[n] = [parseFloat(obj.points[n][0]),
                            parseFloat(obj.points[n][1])];
  }
  this.ClosedLoop = (obj.closedloop == "true");
  this.UpdateBounds();
  this.Shape.UpdateBuffers();
}

PolylineWidget.prototype.RemoveFromViewer = function() {
  if (this.Viewer == null) {
    return;
  }
  var idx = this.Viewer.WidgetList.indexOf(this);
  if(idx!=-1) {
    this.Viewer.WidgetList.splice(idx, 1);
  }
}


PolylineWidget.prototype.CityBlockDistance = function(p0, p1) {
  return Math.abs(p1[0]-p0[0]) + Math.abs(p1[1]-p0[1]);
}

PolylineWidget.prototype.HandleKeyPress = function(keyCode, shift) {
  // Copy
  if (keyCode == 67 && modifiers.ControlKeyPressed) {
    // control-c for copy
    // The extra identifier is not needed for widgets, but will be
    // needed if we have some other object on the clipboard.
    var clip = {Type:"PolylineWidget", Data: this.Serialize()};
    localStorage.ClipBoard = JSON.stringify(clip);
    return true;
  }


  return false;
  if (keyCode == 27) { // escape
    // Last resort.  ESC key always deactivates the widget.
    // Deactivate.
    this.Deactivate();
    if (this.State == POLYLINE_WIDGET_NEW_EDGE) {
      // I do not check for closed loop yet.
      this.ClosedLoop = false;
      // Remove the last duplicate point.
      this.Shape.Points.pop();
      this.UpdateBounds();
    }
    RecordState();  
  }

  return false;
}

PolylineWidget.prototype.HandleDoubleClick = function(event) {
}

PolylineWidget.prototype.Deactivate = function() {
  this.Popup.StartHideTimer();
  this.State = POLYLINE_WIDGET_WAITING;
  this.Viewer.DeactivateWidget(this);
  this.Shape.Active = false;
  this.ActivateVertex(-1);
  eventuallyRender();
}

// Mouse down does nothing. Mouse up causes all state changes.
PolylineWidget.prototype.HandleMouseDown = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;
  var pt = this.Viewer.ConvertPointViewerToWorld(x,y);

  if (this.State == POLYLINE_WIDGET_NEW) {
    this.Shape.Points.push(pt);
    this.Shape.Points.push([pt[0], pt[1]]); // avoid same reference.
    this.ActivateVertex(-1);
    this.State = POLYLINE_WIDGET_NEW_EDGE;
    this.UpdateBounds();
    eventuallyRender();
    return;
  }
  if (this.State == POLYLINE_WIDGET_NEW_EDGE) {
    if (this.ActiveVertex >= 0) { // The user clicked on an active vertex. End the line.
      if (this.ActiveVertex == 0) {
        this.ClosedLoop = true;
      } else {
        this.ClosedLoop = false;
        // Remove the last duplicate point.
        this.Shape.Points.pop();
        this.UpdateBounds();
      }
      this.Deactivate();
      RecordState();
      return;
    }
    this.Shape.Points.push(pt);
    this.Shape.UpdateBuffers();
    this.UpdateBounds();
    eventuallyRender();
    return;
  }

  if (this.State == POLYLINE_WIDGET_MIDPOINT_ACTIVE) {
    // Compute the midpoint.
    var x = 0.5 * (this.Shape.Points[this.ActiveMidpoint-1][0] + this.Shape.Points[this.ActiveMidpoint][0]);
    var y = 0.5 * (this.Shape.Points[this.ActiveMidpoint-1][1] + this.Shape.Points[this.ActiveMidpoint][1]);
    // Insert the midpoint in the loop.
    this.Shape.Points.splice(this.ActiveMidpoint,0,[x,y]);
    // Now set up dragging interaction on the new point.
    this.ActivateVertex(this.ActiveMidpoint);
    this.ActiveMidpoint = -1;
    this.State = POLYLINE_WIDGET_VERTEX_ACTIVE; // Activate vertex probably does this.
    }

  if (this.State == POLYLINE_WIDGET_ACTIVE) {
    this.LastMouseWorld = pt;
  }
}

// Returns false when it is finished doing its work.
PolylineWidget.prototype.HandleMouseUp = function(event) {
  // Logic to remove a vertex. Drag it over a neighbor.
  //if (this.State do this later.

  if (this.State == POLYLINE_WIDGET_ACTIVE && event.SystemEvent.which == 3) {
    // Right mouse was pressed.
    // Pop up the properties dialog.
    this.State = POLYLINE_WIDGET_PROPERTIES_DIALOG;
    this.ShowPropertiesDialog();
  }

  if (event.SystemEvent.which == 1) {
    if (this.State == POLYLINE_WIDGET_VERTEX_ACTIVE ||
        this.State == POLYLINE_WIDGET_ACTIVE) {
      // Dragging a vertex or the whole polyline.
      RecordState();
    }
  }

}


PolylineWidget.prototype.HandleMouseMove = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;
  var pt = this.Viewer.ConvertPointViewerToWorld(x,y);

  if (this.State == POLYLINE_WIDGET_NEW) {
    this.Circle.Origin = pt;
    eventuallyRender();
    return;
  }
  if (this.State == POLYLINE_WIDGET_NEW_EDGE) {
    var lastIdx = this.Shape.Points.length - 1;
    this.Shape.Points[lastIdx] = pt;
    this.Shape.UpdateBuffers();
    this.UpdateBounds();
    var idx = this.WhichVertexShouldBeActive(pt);
    // Only the first or last vertexes will stop the new line.
    this.ActivateVertex(idx);
    eventuallyRender();
    return;
  }
  if (this.State == POLYLINE_WIDGET_VERTEX_ACTIVE ||
      this.State == POLYLINE_WIDGET_MIDPOINT_ACTIVE ||
      this.State == POLYLINE_WIDGET_ACTIVE) {
    if (event.SystemEvent.which == 0) {
      // Turn off the active vertex if the mouse moves away.
      this.SetActive(this.CheckActive(event));
      return;
    }
    if (this.State == POLYLINE_WIDGET_ACTIVE && event.SystemEvent.which == 1) {
      //drag the whole widget.
      var dx = pt[0] - this.LastMouseWorld[0];
      var dy = pt[1] - this.LastMouseWorld[1];
      for (var i = 0; i < this.Shape.Points.length; ++i) {
        this.Shape.Points[i][0] += dx;
        this.Shape.Points[i][1] += dy;
      }
      this.LastMouseWorld = pt;
      this.Shape.UpdateBuffers();
      this.UpdateBounds();
      this.PlacePopup();
      eventuallyRender();
      return;
    }
    if (this.State == POLYLINE_WIDGET_VERTEX_ACTIVE && event.SystemEvent.which == 1) {
      //drag the vertex
      var last = this.Shape.Points.length-1;
      if (this.ClosedLoop && (this.ActiveVertex == 0 || this.ActiveVertex == last)) {
        this.Shape.Points[0] = pt;
        this.Shape.Points[last] = [pt[0],pt[1]]; // Bug moving entire line with shared points incremented twice.
        }
      else
        {
        this.Shape.Points[this.ActiveVertex] = pt;
        }
      this.Circle.Origin = pt;
      this.Shape.UpdateBuffers();
      this.PlacePopup();
      eventuallyRender();
    }
  }
}

// pt is mouse in world coordinates.
PolylineWidget.prototype.WhichVertexShouldBeActive = function(pt) {
  if (this.State == POLYLINE_WIDGET_NEW) {
    return -1;
  }
  this.UpdateCircleRadius();
  var r2 = this.Circle.Radius * this.Circle.Radius;
  if (this.State == POLYLINE_WIDGET_NEW_EDGE) {
    var dx = pt[0] - this.Shape.Points[0][0];
    var dy = pt[1] - this.Shape.Points[0][1];
    var dist2 = dx*dx + dy*dy;
    if (dist2 < r2) { return 0; }
    var last = this.Shape.Points.length - 2;
    if (last >= 0 ) {
      var dx = pt[0] - this.Shape.Points[last][0];
      var dy = pt[1] - this.Shape.Points[last][1];
      var dist2 = dx*dx + dy*dy;
      if (dist2 < r2) { return last; }
    }
    return -1;
  }

  if (this.State == POLYLINE_WIDGET_WAITING || this.State == POLYLINE_WIDGET_VERTEX_ACTIVE) {
    // Check all the vertecies.
    for (var i = 0; i < this.Shape.Points.length; ++i) {
      var dx = pt[0] - this.Shape.Points[i][0];
      var dy = pt[1] - this.Shape.Points[i][1];
      var dist2 = dx*dx + dy*dy;
      if (dist2 < r2) {
        return i;
      }
    }
  }

  return -1;
}



PolylineWidget.prototype.HandleTouchPan = function(event) {
}
PolylineWidget.prototype.HandleTouchPinch = function(event) {
}
PolylineWidget.prototype.HandleTouchEnd = function(event) {
}



PolylineWidget.prototype.CheckActive = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;
  var pt = this.Viewer.ConvertPointViewerToWorld(x,y);

  // First check if any vertices are active.
  var idx = this.WhichVertexShouldBeActive(pt);
  this.ActivateVertex(idx);
  if (idx != -1) {
    this.State = POLYLINE_WIDGET_VERTEX_ACTIVE;
    return true;
  }

  // Check for the mouse over a midpoint.
  this.UpdateCircleRadius();
  var r2 = this.Circle.Radius * this.Circle.Radius;
  for (idx = 1; idx < this.Shape.Points.length; ++idx) {
    x = 0.5 *(this.Shape.Points[idx-1][0] + this.Shape.Points[idx][0]);
    y = 0.5 *(this.Shape.Points[idx-1][1] + this.Shape.Points[idx][1]);
    var dx = pt[0] - x;
    var dy = pt[1] - y;
    if ((dx*dx + dy*dy) <= r2) {
      this.Circle.Visibility = true;
      this.Circle.Origin = [x, y];
      this.State = POLYLINE_WIDGET_MIDPOINT_ACTIVE;
      this.Shape.Active = false;
      this.ActiveMidpoint = idx;
      this.PlacePopup();
      return true;
      }
  }

  // Check for mouse touching an edge.
  for (var i = 1; i < this.Shape.Points.length; ++i) {
    if (this.Shape.IntersectPointLine(pt, this.Shape.Points[i-1], this.Shape.Points[i], this.LineWidth)) {
      this.State = POLYLINE_WIDGET_ACTIVE;
      this.Shape.Active = true;
      this.PlacePopup();
      return true;
    }
  }

  return false;
}

// -1 => no active vertex.
PolylineWidget.prototype.ActivateVertex = function(vIdx) {
  if (vIdx >= this.Shape.Points.length) {
    // Index out of bounds.
    alert("PolylineWidget::ActivateVertex: index out of bounds");
    return;
  }
  if (vIdx < 0) {
    this.Circle.Visibility = false;
    eventuallyRender();
  } else {
    var cam = this.Viewer.MainView.Camera;
    var viewport = this.Viewer.MainView.Viewport;
    this.Circle.Radius = 5.0*cam.Height/viewport[3];
    this.UpdateCircleRadius();
    this.Circle.UpdateBuffers();
    this.Circle.Visibility = true;
    this.Circle.Origin = this.Shape.Points[vIdx];
    this.PlacePopup();
    eventuallyRender();
  }

  this.ActiveVertex = vIdx;
}

// Multiple active states. Active state is a bit confusing.
// Only one state (WAITING) does not receive events from the viewer.
PolylineWidget.prototype.GetActive = function() {
  if (this.State == POLYLINE_WIDGET_WAITING) {
    return false;
  }
  return true;
}

// Active simply means that the widget is receiving events.
// This widget can activate verticies, the whole polyline, or a middle vertex.
PolylineWidget.prototype.SetActive = function(flag) {
  if (flag == this.GetActive()) {
    return;
  }

  if (flag) {
    this.State = POLYLINE_WIDGET_ACTIVE;
    this.Shape.Active = true;
    this.Viewer.ActivateWidget(this);
    this.PlacePopup();
    eventuallyRender();
  } else {
    this.Deactivate();
  }
}




//This also shows the popup if it is not visible already.
PolylineWidget.prototype.PlacePopup = function () {
  // The popup gets in the way when firt creating the line.
  if (this.State == POLYLINE_WIDGET_NEW_EDGE || 
      this.State == POLYLINE_WIDGET_NEW) {
    return;
  }

  var roll = this.Viewer.GetCamera().Roll;
  var s = Math.sin(roll + (Math.PI*0.25));
  var c = Math.cos(roll + (Math.PI*0.25));

  if (this.Shape.Points.length < 1) { return; }
  // Find the upper right most vertex.
  var x = this.Shape.Points[0][0];
  var y = this.Shape.Points[0][1];
  var best = (c*x)-(s*y);
  for (idx = 1; idx < this.Shape.Points.length; ++idx) {
    var tx = this.Shape.Points[idx][0];
    var ty = this.Shape.Points[idx][1];
    var tmp = (c*tx)-(s*ty);
    if (tmp > best) {
      best = tmp;
      x = tx;
      y = ty;
    }
  }
  var pt = this.Viewer.ConvertPointWorldToViewer(x, y);

  pt[0] += 20;
  pt[1] -= 10;

  this.Popup.Show(pt[0],pt[1]);
}


// Can we bind the dialog apply callback to an objects method?
var POLYLINE_WIDGET_DIALOG_SELF;
PolylineWidget.prototype.ShowPropertiesDialog = function () {
  var color = this.Dialog.ColorInput;
  color.value = ConvertColorToHex(this.Shape.OutlineColor);

  var lineWidth = this.Dialog.LineWidthInput;
  lineWidth.value = (this.LineWidth).toFixed(2);

  POLYLINE_WIDGET_DIALOG_SELF = this;
  $("#polyline-properties-dialog").dialog("open");
}

function PolylinePropertyDialogApply() {
  var widget = POLYLINE_WIDGET_DIALOG_SELF;
  if ( ! widget) {
    return;
  }
  var hexcolor = this.Dialog.ColorInput.value;
  widget.Shape.SetOutlineColor(hexcolor);
  var lineWidth = this.Dialog.LineWidthInput;
  // Save the line width and color as the default polyline values.
  var polylineProperties = {Color : widget.Shape.OutlineColor, 
                            LineWidth: lineWidth};
  localStorage.PolylineProperties = JSON.stringify(polylineProperties);

  widget.LineWidth = parseFloat(lineWidth.value);
  widget.Shape.LineWidth = widget.LineWidth;
  widget.Shape.UpdateBuffers();
  this.UpdateBounds();
  if (widget != null) {
    widget.SetActive(false);
  }
  RecordState();
  eventuallyRender();
}

function PolylinePropertyDialogCancel() {
  var widget = POLYLINE_WIDGET_DIALOG_SELF;
  if (widget != null) {
    widget.SetActive(false);
  }
}

function PolylinePropertyDialogDelete() {
  var widget = POLYLINE_WIDGET_DIALOG_SELF;
  if (widget != null) {
    widget.SetActive(false);
    // We need to remove an item from a list.
    // shape list and widget list.
    widget.RemoveFromViewer();
    eventuallyRender();
    RecordState();
  }
}
