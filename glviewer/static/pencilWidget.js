//==============================================================================
// Temporary drawing with a pencil.  It goes away as soon as the camera changes.
// pencil icon (image as html) follows the cursor.
// Middle mouse button (or properties menu item) drops pencil.
// maybe option in properties menu to save the drawing permanently.

// TODO:
// Break lines when the mouse is repressed.
// Smooth / compress lines. (Mouse pixel jitter)
// Option for the drawing to disappear when the camera changes.
// Serialize and Load methods.
// Undo / Redo.
// Color (property window).




function PencilWidget (viewer, newFlag) {
  if (viewer == null) {
    return;
  }
  this.Viewer = viewer;    
  this.Viewer.WidgetList.push(this);

  this.Cursor = $('<img>').appendTo('body')
      .css({
        'position': 'absolute',
        'height': '28px',
        'z-index': '1'})
      .attr('type','image')
      .attr('src',"webgl-viewer/static/Pencil-icon.png");  

  this.Shapes = [];
  
  if ( ! newFlag) {
      this.Cursor.hide();
  }
}


PencilWidget.prototype.Draw = function(view) {
  for (var i = 0; i < this.Shapes.length; ++i) {
    this.Shapes[i].Draw(view);
  }
}


PencilWidget.prototype.Serialize = function() {
  var obj = new Object();
  obj.type = "pencil";
  obj.shapes = [];
  for (var i = 0; i < this.Shapes.length; ++i) {
    var shape = this.Shapes[i];
    var points = [];
    for (var j = 0; j < shape.Points.length; ++j) {
      points.push([shape.Points[j][0], shape.Points[j][1]]);
    } 
    obj.shapes.push(points);
  }

  return obj;
}

// Load a widget from a json object (origin MongoDB).
PencilWidget.prototype.Load = function(obj) {
  for(var n=0; n < obj.shapes.length; n++){
    var points = obj.shapes[n];
    var shape = new Polyline();
    shape.OutlineColor = [0.9, 1.0, 0.0];
    shape.FixedSize = false;
    shape.LineWidth = 0;
    this.Shapes.push(shape);
    for (var m = 0; m < points.length; ++m) {
      shape.Points[m] = [points[m][0], points[m][1]];
    }
    shape.UpdateBuffers();
  }
}

PencilWidget.prototype.HandleKeyPress = function(keyCode, shift) {
}


PencilWidget.prototype.Deactivate = function() {
  this.Cursor.hide();
  this.Viewer.DeactivateWidget(this);
}

PencilWidget.prototype.HandleMouseDown = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;
  
  if (event.SystemEvent.which == 1) {
    // Start drawing.
    var shape = new Polyline();
    shape.OutlineColor = [0.9, 1.0, 0.0];
    shape.FixedSize = false;
    shape.LineWidth = 0;
    this.Shapes.push(shape);

    var pt = this.Viewer.ConvertPointViewerToWorld(x,y);  
    shape.Points.push([pt[0], pt[1]]); // avoid same reference.
  }
}

PencilWidget.prototype.HandleMouseUp = function(event) {
  if (event.SystemEvent.which == 3) {
    // Right mouse was pressed.
    // Pop up the properties dialog.
    this.ShowPropertiesDialog();
  }
  // Middle mouse deactivates the widget.
  if (event.SystemEvent.which == 2) {
    // Middle mouse was pressed.
    this.Deactivate();
  }

  // A stroke has just been finished.
  if (event.SystemEvent.which == 1 && this.Shapes.length > 0) {
    var spacing = this.Viewer.GetSpacing();
    this.Decimate(this.Shapes[this.Shapes.length - 1], spacing);
    RecordState();
  }
}

PencilWidget.prototype.HandleDoubleClick = function(event) {
  this.Deactivate();
}

PencilWidget.prototype.HandleMouseMove = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;

  // Move the pencil icon to follow the mouse.
  this.Cursor.css({'left': x, 'bottom': y});  
    
  if (event.MouseDown == true) {
    if (event.SystemEvent.which == 1) {
      var shape = this.Shapes[this.Shapes.length-1];
      var pt = this.Viewer.ConvertPointViewerToWorld(x,y);  
      shape.Points.push([pt[0], pt[1]]); // avoid same reference.
      shape.UpdateBuffers();
      eventuallyRender();
      return;
    }
  }
  
}


PencilWidget.prototype.HandleTouchPan = function(event) {
}
PencilWidget.prototype.HandleTouchPinch = function(event) {
}
PencilWidget.prototype.HandleTouchEnd = function(event) {
}


PencilWidget.prototype.CheckActive = function(event) {
}

PencilWidget.prototype.GetActive = function() {
  return false;  
}

// Setting to active always puts state into "active".
// It can move to other states and stay active.
PencilWidget.prototype.SetActive = function(flag) {  
  if (flag) {
    this.Viewer.ActivateWidget(this);
    eventuallyRender();
  } else {
    this.Cursor.hide();
    this.Viewer.DeactivateWidget(this);
    eventuallyRender();
  }  
}

// Can we bind the dialog apply callback to an objects method?
PencilWidget.prototype.ShowPropertiesDialog = function () {
  //do this later.
}

function PencilPropertyDialogApply() {
}

function PencilPropertyDialogCancel() {
}

function PencilPropertyDialogDelete() {
}

// The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
// Pass in the spacing as a hint to get rid of aliasing.
PencilWidget.prototype.Decimate = function(shape, spacing) {
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



