//==============================================================================
// Contour detection for detecting serial sectioned tissue.
// Similar to polyline widget, but reduced editablity and has a sequesnce number.
// If they are autpomatically created, I might save them in the database 
// so the user can edit them.


var CONTOUR_WIDGET_WAITING = 0;
var CONTOUR_WIDGET_PROPERTIES_DIALOG = 1;


function ContourWidget (viewer, contour) {
    if (viewer === undefined) {
        return;
    }

    this.Contour = contour;

    // I do not think we need a dialog.
    this.Dialog = new Dialog(this);
    this.Dialog.Title.text('Contour Editor');

    this.Viewer = viewer;
    // Needed for delete.
    this.Popup = new WidgetPopup(this);
    var cam = viewer.MainView.Camera;
    var viewport = viewer.MainView.Viewport;

    this.Shape = new Polyline();
    this.Shape.OutlineColor = [0.0, 0.0, 0.0];
    this.Shape.SetOutlineColor([0.0, 0.0, 1.0]);
    this.Shape.FixedSize = false;

    this.Viewer.WidgetList.push(this);

    // Set line thickness using viewer. (5 pixels).
    // The Line width of the shape switches to 0 (single line)
    // when the actual line with is too thin.
    this.Shape.LineWidth = 0;

    this.State = CONTOUR_WIDGET_WAITING;

    eventuallyRender();
}


ContourWidget.prototype.Draw = function(view) {
    this.Shape.Draw(view);
}


ContourWidget.prototype.Serialize = function() {
  if(this.Shape === undefined){ return null; }
  var obj = new Object();
  obj.type = "contour";
  // Copy the points to avoid array reference bug.
  obj.points = [];
  for (var i = 0; i < this.Shape.Points.length; ++i) {
    obj.points.push([this.Shape.Points[i][0], this.Shape.Points[i][1]]);
  }

  return obj;
}

// Load a widget from a json object (origin MongoDB).
// Object already json decoded.
ContourWidget.prototype.Load = function(obj) {
  this.Shape.Points = [];
  for(var n=0; n < obj.points.length; n++){
      this.Shape.Points[n] = [parseFloat(obj.points[n][0]),
                            parseFloat(obj.points[n][1])];
  }
  this.UpdateBounds();
  this.Shape.UpdateBuffers();
}

ContourWidget.prototype.RemoveFromViewer = function() {
  if (this.Viewer == null) {
    return;
  }
  var idx = this.Viewer.WidgetList.indexOf(this);
  if(idx!=-1) {
    this.Viewer.WidgetList.splice(idx, 1);
  }
}


ContourWidget.prototype.HandleKeyPress = function(event) {
  if (event.keyCode == ??)  {
    // delete key
      .....
    return false;
  }

  return true;
}

ContourWidget.prototype.Deactivate = function() {
    this.Popup.StartHideTimer();
    this.State = CONTOUR_WIDGET_WAITING;
    this.Viewer.DeactivateWidget(this);
    this.Shape.Active = false;
    
    if (this.DeactivateCallback) {
        this.DeactivateCallback();
    }
    eventuallyRender();
}

// Mouse down does nothing. Mouse up causes all state changes.
ContourWidget.prototype.HandleMouseDown = function(event) {
}
ContourWidget.prototype.HandleMouseUp = function(event) {
}
ContourWidget.prototype.HandleMouseMove = function(event) {
}
ContourWidget.prototype.HandleTouchPan = function(event) {
}
ContourWidget.prototype.HandleTouchPinch = function(event) {
}
ContourWidget.prototype.HandleTouchEnd = function(event) {
}



ContourWidget.prototype.CheckActive = function(event) {
  var x = event.offsetX;
  var y = event.offsetY;
  var pt = this.Viewer.ConvertPointViewerToWorld(x,y);

  // Check for mouse touching an edge.
  var width = Math.max(this.MinLine * 4, this.LineWidth);
  for (var i = 1; i < this.Shape.Points.length; ++i) {
    if (this.Shape.IntersectPointLine(pt, this.Shape.Points[i-1],
                                      this.Shape.Points[i], width)) {
      this.State = CONTOUR_WIDGET_ACTIVE;
      this.Shape.Active = true;
      this.PlacePopup();
      return true;
    }
  }
  if (this.Shape.Closed) {
    if (this.Shape.IntersectPointLine(pt, this.Shape.Points[0],
                                      this.Shape.Points[this.Shape.Points.length-1], width)) {
      this.State = CONTOUR_WIDGET_ACTIVE;
      this.Shape.Active = true;
      this.PlacePopup();
      return true;
    }
  }



  return false;
}


// Multiple active states. Active state is a bit confusing.
// Only one state (WAITING) does not receive events from the viewer.
ContourWidget.prototype.GetActive = function() {
  if (this.State == CONTOUR_WIDGET_WAITING) {
    return false;
  }
  return true;
}

// Active simply means that the widget is receiving events.
// This widget can activate verticies, the whole polyline, or a middle vertex.
ContourWidget.prototype.SetActive = function(flag) {
  if (flag == this.GetActive()) {
    return;
  }

  if (flag) {
    this.State = CONTOUR_WIDGET_ACTIVE;
    this.Shape.Active = true;
    this.Viewer.ActivateWidget(this);
    this.PlacePopup();
    eventuallyRender();
  } else {
    this.Deactivate();
  }
}




//This also shows the popup if it is not visible already.
ContourWidget.prototype.PlacePopup = function () {
  // The popup gets in the way when firt creating the line.
  if (this.State == CONTOUR_WIDGET_NEW_EDGE ||
      this.State == CONTOUR_WIDGET_NEW) {
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
var CONTOUR_WIDGET_DIALOG_SELF;
ContourWidget.prototype.ShowPropertiesDialog = function () {
}

ContourWidget.prototype.DialogApplyCallback = function() {
}

