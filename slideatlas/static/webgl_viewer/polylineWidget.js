//==============================================================================
// Mouse click places a point.
// A small circle will be used to shaow an active vertex.
// Widget starts with an active vertex (mouse up).
// Mouse down->up places the vertex and deactivates it.  A new deactive vertex is created.
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
  var cam = viewer.MainView.Camera;
  var viewport = viewer.MainView.Viewport;

  this.Viewer = viewer;
  // If the last point is the same as the first point, ClosedLoop is true.
  this.ClosedLoop = false;
  // Circle is to show an active vertex.
  this.Circle = new Circle();
  this.Circle.FillColor = [1.0, 1.0, 0.2]
  this.Circle.OutlineColor = [0.0,0.0,0.0];
  this.Circle.FixedSize = false;
  this.Circle.ZOffset = -0.05;

  this.Shape = new Polyline();
	this.Shape.OutlineColor = [0.0, 0.0, 0.0];
  this.Shape.FixedSize = false;

  this.Viewer.ShapeList.push(this.Shape);
  this.Viewer.ShapeList.push(this.Circle);
  this.Viewer.WidgetList.push(this);
  
  // Set line thickness   using viewer. (5 pixels).
  this.Shape.LineWidth = 5.0*cam.Height/viewport[3];
  this.Circle.Radius = this.Shape.LineWidth; 
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
  eventuallyRender();
}

PolylineWidget.prototype.Serialize = function() {
  if(this.Shape === undefined){ return null; }
  var obj = new Object();
  obj.type = "polyline";
  obj.outlinecolor = this.Shape.OutlineColor;
  obj.linewidth = this.Shape.LineWidth;
  obj.points = this.Shape.Points;
  obj.closedloop = this.ClosedLoop;
  return obj;
}

// Load a widget from a json object (origin MongoDB).
PolylineWidget.prototype.Load = function(obj) {
  this.Shape.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
  this.Shape.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
  this.Shape.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
  this.Shape.LineWidth = parseFloat(obj.linewidth);
  for(var n=0; n < obj.points.length; n++){
      this.Shape.Points[n] = [parseFloat(obj.points[n][0]),
                            parseFloat(obj.points[n][1])];
  }
  this.ClosedLoop = (obj.closedloop == "true");
  this.Shape.UpdateBuffers();
}



PolylineWidget.prototype.RemoveFromViewer = function() {
  if (this.Viewer == null) {
    return;
  }
  var idx = this.Viewer.ShapeList.indexOf(this.Shape);
  if(idx!=-1) { 
    this.Viewer.ShapeList.splice(idx, 1); 
  }
  var idx = this.Viewer.ShapeList.indexOf(this.Circle);
  if(idx!=-1) { 
    this.Viewer.ShapeList.splice(idx, 1); 
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
    eventuallyRender();
    return;
  }
  if (this.State == POLYLINE_WIDGET_NEW_EDGE) {
    if (this.ActiveVertex >= 0) { // The user clicked on an active vertex.  End the line.
      if (this.ActiveVertex == 0) {
        this.ClosedLoop = true;
      } else {
        this.ClosedLoop = false;
        // Remove the last duplicate point.
        this.Shape.Points.pop();
      }
      this.State = POLYLINE_WIDGET_WAITING;
      this.Viewer.DeactivateWidget(this);
      this.Shape.Active = false;
      this.ActivateVertex(-1);
      eventuallyRender();
      return;
    }
    this.Shape.Points.push(pt);
    this.Shape.UpdateBuffers();
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
  // Logic to remove a vertex.  Drag it over a neighbor.
  //if (this.State  do this later.
  
  if (this.State == POLYLINE_WIDGET_ACTIVE && event.SystemEvent.which == 3) {
    // Right mouse was pressed.
    // Pop up the properties dialog.
    this.State = POLYLINE_WIDGET_PROPERTIES_DIALOG;
    this.ShowPropertiesDialog();
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
      eventuallyRender();
    }
  }
}

// pt is mouse in world coordinates.
PolylineWidget.prototype.WhichVertexShouldBeActive = function(pt) {
  if (this.State == POLYLINE_WIDGET_NEW) {
    return -1;
  }
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
    
PolylineWidget.prototype.CheckActive = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;
  var pt = this.Viewer.ConvertPointViewerToWorld(x,y);

  // First check if any verticies are active.
  var idx = this.WhichVertexShouldBeActive(pt);
  this.ActivateVertex(idx);
  if (idx != -1) {
    this.State = POLYLINE_WIDGET_VERTEX_ACTIVE;
    return true;
  }

  // Check for the mouse over a midpoint.
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
      return true;
      }
  }
  
  // Check for mouse touching an edge.
  for (var i = 1; i < this.Shape.Points.length; ++i) {
    if (this.Shape.IntersectPointLine(pt, this.Shape.Points[i-1], this.Shape.Points[i], this.Shape.LineWidth)) {
      this.State = POLYLINE_WIDGET_ACTIVE;
      this.Shape.Active = true;
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
    this.Circle.Visibility = true;
    this.Circle.Origin = this.Shape.Points[vIdx];
    eventuallyRender();
  }
  
  this.ActiveVertex = vIdx;
}

// Multiple active states.  Active state is a bit confusing.
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
    eventuallyRender();
  } else {
    this.State = POLYLINE_WIDGET_WAITING;
    this.Shape.Active = false;
    this.ActivateVertex(-1);
    this.Viewer.DeactivateWidget(this);
    eventuallyRender();
  }
}

PolylineWidget.prototype.ShowPropertiesDialog = function () {
  var color = document.getElementById("polylinecolor");
  color.value = this.Shape.ConvertColorToHex(this.Shape.OutlineColor);

  var lineWidth = document.getElementById("polylinewidth");
  lineWidth.value = (this.Shape.LineWidth).toFixed(2);

  $("#polyline-properties-dialog").dialog("open");
}    
