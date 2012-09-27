//==============================================================================
// Mouse down defined the center.
// Drag defines the radius.


// The circle has just been created and is following the mouse.
// I can probably merge  this state with drag. (mouse up vs down though)
var CIRCLE_WIDGET_NEW = 0;
var CIRCLE_WIDGET_DRAG = 1; // The whole arrow is being dragged.
var CIRCLE_WIDGET_DRAG_RADIUS = 2;
var CIRCLE_WIDGET_WAITING = 3; // The normal (resting) state.
var CIRCLE_WIDGET_ACTIVE = 4; // Mouse is over the widget and it is receiving events.
var CIRCLE_WIDGET_PROPERTIES_DIALOG = 5; // Properties dialog is up

function CircleWidget (viewer, newFlag) {
  if (viewer == null) {
    return;
  }
  this.Viewer = viewer;
  var cam = viewer.MainView.Camera;
  var viewport = viewer.MainView.Viewport;
  this.Shape = new Circle();
  this.Shape.Origin = [0,0];
  this.Shape.OutlineColor = [0.0, 0.0, 0.0];
  this.Shape.Radius = 50*cam.Height/viewport[3];
  this.Shape.LineWidth =  5.0*cam.Height/viewport[3];
  this.Shape.FixedSize = false;
  this.Viewer.WidgetList.push(this);
  this.Viewer.AddShape(this.Shape);

  // Note: If the user clicks before the mouse is in the
  // canvas, this will behave odd.

  if (newFlag) {
    this.State = CIRCLE_WIDGET_NEW;
    this.Viewer.ActivateWidget(this);
    return;
  }

  this.State = CIRCLE_WIDGET_WAITING;
}

CircleWidget.prototype.RemoveFromViewer = function() {
  if (this.Viewer == null) {
    return;
  }
  var idx = this.Viewer.ShapeList.indexOf(this.Shape);
  if(idx!=-1) { 
    this.Viewer.ShapeList.splice(idx, 1); 
  }
  var idx = this.Viewer.WidgetList.indexOf(this);
  if(idx!=-1) { 
    this.Viewer.WidgetList.splice(idx, 1); 
  }
}

CircleWidget.prototype.Serialize = function() {
  if(this.Shape === undefined){ return null; }
  var obj = new Object();
  obj.type = "circle";
  obj.origin = this.Shape.Origin;
  obj.outlinecolor = this.Shape.OutlineColor;
  obj.radius = this.Shape.Radius;
  obj.linewidth = this.Shape.LineWidth;
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
}
  
CircleWidget.prototype.HandleKeyPress = function(keyCode, shift) {
}

CircleWidget.prototype.HandleMouseDown = function(event) {
  if (event.SystemEvent.which != 1)
    {
    return;
    }
  if (this.State == CIRCLE_WIDGET_NEW) {
    // We need the viewer position of the circle center to drag radius.
    this.OriginViewer = this.Viewer.ConvertPointWorldToViewer(this.Shape.Origin[0], this.Shape.Origin[1]);    
    this.State = CIRCLE_WIDGET_DRAG_RADIUS;
  }
  if (this.State == CIRCLE_WIDGET_ACTIVE) {
    // Determine behavior from active radius.
    if (this.NormalizedActiveDistance < 0.5) {
      this.State = CIRCLE_WIDGET_DRAG;
    } else {
      this.OriginViewer = this.Viewer.ConvertPointWorldToViewer(this.Shape.Origin[0], this.Shape.Origin[1]);
      this.State = CIRCLE_WIDGET_DRAG_RADIUS;
    }
  }
}

// returns false when it is finished doing its work.
CircleWidget.prototype.HandleMouseUp = function(event) {
  if (this.State == CIRCLE_WIDGET_ACTIVE && event.SystemEvent.which == 3) {
    // Right mouse was pressed.
    // Pop up the properties dialog.
    this.State = CIRCLE_WIDGET_PROPERTIES_DIALOG;
    this.ShowPropertiesDialog();
  } else if ( this.State == CIRCLE_WIDGET_DRAG ||  this.State == CIRCLE_WIDGET_DRAG_RADIUS) {
    this.SetActive(false);
  }
}

CircleWidget.prototype.HandleMouseMove = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;

  if (event.MouseDown == false && this.State == CIRCLE_WIDGET_ACTIVE) {
    this.CheckActive(event);
    return;
  }
  
  if (this.State == CIRCLE_WIDGET_NEW || this.State == CIRCLE_WIDGET_DRAG) {
    this.Shape.Origin = this.Viewer.ConvertPointViewerToWorld(x, y);
    eventuallyRender();
  }
  
  if (this.State == CIRCLE_WIDGET_DRAG_RADIUS) {
    var viewport = this.Viewer.GetViewport();
    var cam = this.Viewer.MainView.Camera;
    var dx = x-this.OriginViewer[0];
    var dy = y-this.OriginViewer[1];
    // Change units from pixels to world.
    this.Shape.Radius = Math.sqrt(dx*dx + dy*dy) * cam.Height / viewport[3];
    this.Shape.UpdateBuffers();
    eventuallyRender();
  }
  
   if (this.State == CIRCLE_WIDGET_WAITING) { 
    this.CheckActive(event);
  } 
}

CircleWidget.prototype.CheckActive = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;

  // change dx and dy to vector from center of circle.
  if (this.FixedSize) {
    dx = event.MouseX - this.Shape.Origin[0];
    dy = event.MouseY - this.Shape.Origin[1];
  } else {
    dx = event.MouseWorldX - this.Shape.Origin[0];
    dy = event.MouseWorldY - this.Shape.Origin[1];
  }

  var d = Math.sqrt(dx*dx + dy*dy)/this.Shape.Radius;
  var active = false;
  var lineWidth = this.Shape.LineWidth / this.Shape.Radius;
  this.NormalizedActiveDistance = d;
  
  if (this.Shape.FillColor == undefined) { // Circle 
    if ((d < (1.05+lineWidth) && d > 0.95)  || d < (0.02+lineWidth)) {
      active = true;
    }
  } else { // Disk
    if (d < (1.05+lineWidth) && d > (0.1+lineWidth) || d < lineWidth) {
	    active = true;
    }
  }
  
  this.SetActive(active);
  return active;
}

// Multiple active states.  Active state is a bit confusing.
CircleWidget.prototype.GetActive = function() {
  if (this.State == CIRCLE_WIDGET_WAITING) {
    return false;  
  }
  return true;
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
    this.Viewer.ActivateWidget(this);
    eventuallyRender();
  } else {
    this.State = CIRCLE_WIDGET_WAITING;
    this.Shape.Active = false;
    this.Viewer.DeactivateWidget(this);
    eventuallyRender();
  }
}

CircleWidget.prototype.ShowPropertiesDialog = function () {
  var color = document.getElementById("circlecolor");
  color.value = this.Shape.ConvertColorToHex(this.Shape.OutlineColor);

  var lineWidth = document.getElementById("circlelinewidth");
  lineWidth.value = (this.Shape.LineWidth).toFixed(2);
  
  var areaLabel = document.getElementById("circlearea");
    areaLabel.innerHTML = "Area: " + (2.0*Math.PI*this.Shape.Radius*this.Shape.Radius).toFixed(2);
  if (this.Shape.FixedSize) {
    areaLabel.innerHTML += " pixels^2";
  } else {
    areaLabel.innerHTML += " units^2";
  }
  

  $("#circle-properties-dialog").dialog("open");
}    

