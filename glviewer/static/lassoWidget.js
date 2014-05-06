//==============================================================================
// Variation of pencil
// Free form loop
// I plan to be abble to add or remove regions from the loop with multiple strokes.
// It will be a state, just like the pencil widget is a state.


var LASSO_WIDGET_DRAWING = 0;
var LASSO_WIDGET_ACTIVE = 1;
var LASSO_WIDGET_WAITING = 2;


function LassoWidget (viewer, newFlag) {
  if (viewer == null) {
    return;
  }
  this.Popup = new WidgetPopup(this);
  this.Viewer = viewer;
  this.Viewer.WidgetList.push(this);

  this.Cursor = $('<img>').appendTo('body')
      .css({
        'position': 'absolute',
        'height': '28px',
        'z-index': '1'})
      .attr('type','image')
      .attr('src',"webgl-viewer/static/Pencil-icon.png");

  var self = this;
  // I am trying to stop images from getting move events and displaying a circle/slash.
  // This did not work.  preventDefault did not either.
  //this.Cursor.mousedown(function (event) {self.HandleMouseDown(event);})
  //this.Cursor.mousemove(function (event) {self.HandleMouseMove(event);})
  //this.Cursor.mouseup(function (event) {self.HandleMouseUp(event);})
  //.preventDefault();

  this.Loop = new Polyline();
  this.Loop.OutlineColor = [0.0, 0.0, 0.0];
  this.Loop.FixedSize = false;
  this.Loop.LineWidth = 0;
  this.Stroke = false;

  this.ActiveCenter = [0,0];

  this.State = LASSO_WIDGET_DRAWING;
  if ( ! newFlag) {
      this.State = LASSO_WIDGET_WAITING;
      this.Cursor.hide();
  }
}


LassoWidget.prototype.Draw = function(view) {
  this.Loop.Draw(view);
  if (this.Stroke) {
    this.Stroke.Draw(view);
  }
}


LassoWidget.prototype.Serialize = function() {
  var obj = new Object();
  obj.type = "lasso";
  obj.loop = [];
  for (var j = 0; j < this.Loop.Points.length; ++j) {
    obj.loop.push([this.Loop.Points[j][0], this.Loop.Points[j][1]]);
  }

  return obj;
}

// Load a widget from a json object (origin MongoDB).
LassoWidget.prototype.Load = function(obj) {
  this.Loop.OutlineColor = [0.9, 1.0, 0.0];
  this.Loop.FixedSize = false;
  this.Loop.LineWidth = 0;
  for (var m = 0; m < obj.loop.length; ++m) {
    this.Loop.Points[m] = [obj.loop[m][0], obj.loop[m][1]];
  }
  this.Loop.UpdateBuffers();
}

LassoWidget.prototype.HandleKeyPress = function(keyCode, shift) {
}

LassoWidget.prototype.Deactivate = function() {
  this.Popup.StartHideTimer();
  this.Cursor.hide();
  this.Viewer.DeactivateWidget(this);
  this.State = LASSO_WIDGET_WAITING;
  this.Loop.Active = false;
  if (this.Stroke) {
    this.Stroke.Active = false;
  }
  eventuallyRender();
}

LassoWidget.prototype.HandleMouseDown = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;

  if (event.SystemEvent.which == 1) {
    // Start drawing.

    // Stroke is a temporary line for interaction.
    // When interaction stops, it is converted/merged with loop.
    this.Stroke = new Polyline();
    this.Stroke.OutlineColor = [0.0, 0.0, 0.0];
    this.Stroke.FixedSize = false;
    this.Stroke.LineWidth = 0;

    var pt = this.Viewer.ConvertPointViewerToWorld(x,y);
    this.Stroke.Points = [];
    this.Stroke.Points.push([pt[0], pt[1]]); // avoid same reference.
  }
}

LassoWidget.prototype.HandleMouseUp = function(event) {
  // Middle mouse deactivates the widget.
  if (event.SystemEvent.which == 2) {
    // Middle mouse was pressed.
    this.Deactivate();
  }

  // A stroke has just been finished.
  if (event.SystemEvent.which == 1) {
    var spacing = this.Viewer.GetSpacing();
    this.Decimate(this.Stroke, spacing);
    this.Stroke.Points.push([this.Stroke.Points[0][0], this.Stroke.Points[0][1]]);
    this.Stroke.UpdateBuffers();
    this.Loop = this.Stroke;
    this.Stroke = false;
    this.ComputeActiveCenter();
    eventuallyRender();

    RecordState();
  }
}

LassoWidget.prototype.HandleDoubleClick = function(event) {
  this.Deactivate();
}

LassoWidget.prototype.HandleMouseMove = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;

  // Move the lasso icon to follow the mouse.
  this.Cursor.css({'left': (x+4), 'top': (y-32)});

  if (event.MouseDown == true) {
    if (event.SystemEvent.which == 1 && this.State == LASSO_WIDGET_DRAWING) {
      var shape = this.Stroke;
      var pt = this.Viewer.ConvertPointViewerToWorld(x,y);
      shape.Points.push([pt[0], pt[1]]); // avoid same reference.
      shape.UpdateBuffers();
      eventuallyRender();
      return;
    }
  }

  if (this.State == LASSO_WIDGET_ACTIVE &&
      event.SystemEvent.which == 0) {
      // Deactivate
      this.SetActive(this.CheckActive(event));
      return;
    }

}

LassoWidget.prototype.ComputeActiveCenter = function() {
  var count = 0;
  var sx = 0.0;
  var sy = 0.0;
  var shape = this.Loop;
  var points = [];
  for (var j = 0; j < shape.Points.length; ++j) {
    sx += shape.Points[j][0];
    sy += shape.Points[j][1];
  }

  this.ActiveCenter[0] = sx / shape.Points.length;
  this.ActiveCenter[1] = sy / shape.Points.length;
}

// This also shows the popup if it is not visible already.
LassoWidget.prototype.PlacePopup = function () {
  var pt = this.Viewer.ConvertPointWorldToViewer(this.ActiveCenter[0],
                                                 this.ActiveCenter[1]);
  pt[0] += 40;
  pt[1] -= 40;
  this.Popup.Show(pt[0],pt[1]);
}

LassoWidget.prototype.CheckActive = function(event) {
  if (this.State == LASSO_WIDGET_DRAWING) { return; }

  var pt = this.Viewer.ConvertPointWorldToViewer(this.ActiveCenter[0],
                                                 this.ActiveCenter[1]);

  var dx = event.MouseX - pt[0];
  var dy = event.MouseY - pt[1];
  var active = false;

  if (dx*dx + dy*dy < 1600) {
    active = true;
  }
 this.SetActive(active);
 return active;
}

LassoWidget.prototype.GetActive = function() {
  return false;
}

// Setting to active always puts state into "active".
// It can move to other states and stay active.
LassoWidget.prototype.SetActive = function(flag) {
  if (flag) {
    this.Viewer.ActivateWidget(this);
    this.State = LASSO_WIDGET_ACTIVE;
    this.Loop.Active = true;
    this.PlacePopup();
    eventuallyRender();
  } else {
    this.Deactivate();
    this.Viewer.DeactivateWidget(this);
  }
}

LassoWidget.prototype.RemoveFromViewer = function() {
  if (this.Viewer == null) {
    return;
  }
  var idx = this.Viewer.WidgetList.indexOf(this);
  if(idx!=-1) {
    this.Viewer.WidgetList.splice(idx, 1);
  }
}

// Can we bind the dialog apply callback to an objects method?
LassoWidget.prototype.ShowPropertiesDialog = function () {
}

function LassoPropertyDialogApply() {
}

function LassoPropertyDialogCancel() {
}

function LassoPropertyDialogDelete() {
}

// The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
// Pass in the spacing as a hint to get rid of aliasing.
LassoWidget.prototype.Decimate = function(shape, spacing) {
  // Keep looping over the line removing points until the line does not change.
  var modified = true;
  while (modified) {
    modified = false;
    var newPoints = [];
    newPoints.push(shape.Points[0]);
    // Window of four points.
    var i = 3;
    while (i < shape.Points.length) {
      var p0 = shape.Points[i];
      var p1 = shape.Points[i-1];
      var p2 = shape.Points[i-2];
      var p3 = shape.Points[i-3];
      // Compute the average of the center two.
      var cx = (p1[0] + p2[0]) * 0.5;
      var cy = (p1[1] + p2[1]) * 0.5;
      // Find the perendicular normal.
      var nx = (p0[1] - p3[1]);
      var ny = -(p0[0] - p3[0]);
      var mag = Math.sqrt(nx*nx + ny*ny);
      nx = nx / mag;
      ny = ny / mag;
      mag = Math.abs(nx*(cx-shape.Points[i-3][0]) + ny*(cy-shape.Points[i-3][1]));
      // Mag metric does not distinguish between line and a stroke that double backs on itself.
      // Make sure the two point being merged are between the outer points 0 and 3.
      var dir1 = (p0[0]-p1[0])*(p3[0]-p1[0]) + (p0[1]-p1[1])*(p3[1]-p1[1]);
      var dir2 = (p0[0]-p2[0])*(p3[0]-p2[0]) + (p0[1]-p2[1])*(p3[1]-p2[1]);
      if (mag < spacing && dir1 < 0.0 && dir2 < 0.0) {
        // Replace the two points with their average.
        newPoints.push([cx, cy]);
        modified = true;
        // Skip the next point the window will have one old merged point,
        // but that is ok because it is just used as reference and not altered.
        i += 2;
      } else {
        //  No modification.  Just move the window one.
        newPoints.push(shape.Points[i-2]);
        ++i;
      }
    }
    // Copy the remaing point / 2 points
    i = i-2;
    while (i < shape.Points.length) {
      newPoints.push(shape.Points[i]);
      ++i;
    }
    shape.Points = newPoints;
  }

  shape.UpdateBuffers();
}





// tranform all points so p0 is origin and p1 maps to (1,0)
// Returns false if no intersection, 
// return [x, y, ||p1-p0||] if there is an intersection.
LassoWidget.prototype.FindIntersections = function(p0, p1) {
  var p = [(p1[0]-p0[0]), (p1[1]-p0[1])];
  var mag = Math.sqrt(p[0]*p[0] + p[1]*p[1]);
  if (mag < 0.0) { return false;}
  p[0] = p[0] / mag;
  p[1] = p[0] / mag;

  var m0 = this.LoopPoints[0];
  var n0 = [(m0[0]-p0[0])/mag, (m0[1]-p0[1])/mag];
  var k0 = [(n0[0]*p[0]+n0[1]*p[1]), (n0[1]*p[0]+n0[0]*p[1])];

  for (var i = 1; i < this.Loop.Points.length; ++i) {
    var m1 = this.LoopPoints[i];
    var n1 = [(m1[0]-p0[0])/mag, (m1[1]-p0[1])/mag];
    var k1 = [(n1[0]*p[0]+n1[1]*p[1]), (n1[1]*p[0]+n1[0]*p[1])];
    if ((k1[1] >= 0.0 && k1[1] <= 0.0) || (k1[1] <= 0.0 && k1[1] >= 0.0)) {
      var k = k0[1] / (k0[1]-k1[1]);
      var x = k0[0] + k*(k1[0]-k0[0]); 
      if (x >= 0 && x <=1) {
          return [(p0[0]+k*(p1[0]-p0[0])), (p0[1]+k*(p1[1]-p0[1])), mag];  
      }
    }
  }
  return false;
}




// This is not actually needed!  So it is not used.
LassoWidget.prototype.IsPointInsideLoop = function(x, y) {
  // Sum up angles.  Inside poitns will sum to 2pi, outside will sum to 0.
  var angle = 0.0;
  var pt0 = this.Loop.Points[this.Loop.length - 1];
  for ( var i = 0; i < this.Loop.length; ++i)
    {
    var pt1 = this.Loop.Points[i];
    var v0 = [pt0[0]-x, pt0[1]-y];
    var v1 = [pt1[0]-x, pt1[1]-y];
    var mag0 = Math.sqrt(v0[0]*v0[0] + v0[1]*v0[1]);
    var mag1 = Math.sqrt(v1[0]*v1[0] + v1[1]*v1[1]);
    angle += Math.arcsin((v0[0]*v1[1] - v0[1]*v1[0])/(mag0*mag1));
    }

  return (angle > 3.14 || angle < -3.14);
}

