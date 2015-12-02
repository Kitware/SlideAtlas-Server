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

    // Circle is to show an active vertex.
    this.Circle = new Circle();
    this.Shape = new Polyline();

    var self = this;
    this.Dialog = new Dialog(function () {self.DialogApplyCallback();});
    // Customize dialog for a lasso.
    this.Dialog.Title.text('Lasso Annotation Editor');
    this.Dialog.Body.css({'margin':'1em 2em'});
    // Color
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

    // closed check
    this.Dialog.ClosedDiv =
        $('<div>')
        .appendTo(this.Dialog.Body)
        .css({'display':'table-row'});
    this.Dialog.ClosedLabel =
        $('<div>')
        .appendTo(this.Dialog.ClosedDiv)
        .text("Closed:")
        .css({'display':'table-cell',
              'text-align': 'left'});
    this.Dialog.ClosedInput =
        $('<input type="checkbox">')
        .appendTo(this.Dialog.ClosedDiv)
        .attr('checked', 'false')
        .css({'display': 'table-cell'});

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

    // Length
    this.Dialog.LengthDiv =
        $('<div>')
        .appendTo(this.Dialog.Body)
        .css({'display':'table-row'});
    this.Dialog.LengthLabel =
        $('<div>')
        .appendTo(this.Dialog.LengthDiv)
        .text("Length:")
        .css({'display':'table-cell',
              'text-align': 'left'});
    this.Dialog.Length =
        $('<div>')
        .appendTo(this.Dialog.LengthDiv)
        .css({'display':'table-cell'});

    // Area
    this.Dialog.AreaDiv =
        $('<div>')
        .appendTo(this.Dialog.Body)
        .css({'display':'table-row'});
    this.Dialog.AreaLabel =
        $('<div>')
        .appendTo(this.Dialog.AreaDiv)
        .text("Area:")
        .css({'display':'table-cell',
              'text-align': 'left'});
    this.Dialog.Area =
        $('<div>')
        .appendTo(this.Dialog.AreaDiv)
        .css({'display':'table-cell'});

    // Get default properties.
    this.LineWidth = 10.0;
    this.Shape.Closed = false;
    if (localStorage.PolylineWidgetDefaults) {
        var defaults = JSON.parse(localStorage.PolylineWidgetDefaults);
        if (defaults.Color) {
            this.Dialog.ColorInput.val(ConvertColorToHex(defaults.Color));
        }
        if (defaults.ClosedLoop !== undefined) {
            this.Shape.Closed = defaults.ClosedLoop;
        }
        if (defaults.LineWidth) {
            this.LineWidth = defaults.LineWidth;
            this.Dialog.LineWidthInput.val(this.LineWidth);
        }
    }

    this.Circle.FillColor = [1.0, 1.0, 0.2];
    this.Circle.OutlineColor = [0.0,0.0,0.0];
    this.Circle.FixedSize = false;
    this.Circle.ZOffset = -0.05;

    this.Shape.OutlineColor = [0.0, 0.0, 0.0];
    this.Shape.SetOutlineColor(this.Dialog.ColorInput.val());
    this.Shape.FixedSize = false;

    this.Viewer = viewer;
    this.Popup = new WidgetPopup(this);
    var cam = viewer.MainView.Camera;
    var viewport = viewer.MainView.Viewport;

    this.Viewer.WidgetList.push(this);

    // Set line thickness using viewer. (5 pixels).
    // The Line width of the shape switches to 0 (single line)
    // when the actual line with is too thin.
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

    // Set some default values for bounds.
    var cam = viewer.GetCamera();
    var radius = cam.Height / 4;
    this.Bounds = [cam.FocalPoint[0]-radius, cam.FocalPoint[0]+radius,
                   cam.FocalPoint[1]-radius, cam.FocalPoint[1]+radius];
    this.UpdateCircleRadius();

    // Lets save the zoom level (sort of).
    // Load will overwrite this for existing annotations.
    // This will allow us to expand annotations into notes.
    this.CreationCamera = viewer.GetCamera().Serialize();

    // Set to be the width of a pixel.
    this.MinLine = 1.0;

    this.Viewer.EventuallyRender(false);
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
    this.MinLine = cam.Height/viewport[3];
    if (this.LineWidth < this.MinLine) {
      // Too thin. Use a single line.
      this.Shape.LineWidth = 0;
    } else {
      this.Shape.LineWidth = this.LineWidth;
    }

    this.Shape.Draw(view);
    this.Circle.Draw(view);
}


PolylineWidget.prototype.PasteCallback = function(data, mouseWorldPt) {
    this.Load(data);
    // Place the widget over the mouse.
    // This is more difficult than the circle.  Compute the shift.
    var xOffset = mouseWorldPt[0] - (this.Bounds[0]+this.Bounds[1])/2;
    var yOffset = mouseWorldPt[1] - (this.Bounds[2]+this.Bounds[3])/2;
    for (var i = 0; i < this.Shape.Points.length; ++i) {
        this.Shape.Points[i][0] += xOffset;
        this.Shape.Points[i][1] += yOffset;
    }
    this.UpdateBounds();
    this.Shape.UpdateBuffers();
    if (SA.NotesWidget) {SA.NotesWidget.MarkAsModified();} // hack

    this.Viewer.EventuallyRender(true);
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

    obj.creation_camera = this.CreationCamera;
    obj.closedloop = this.Shape.Closed;

    return obj;
}

// Load a widget from a json object (origin MongoDB).
// Object already json decoded.
PolylineWidget.prototype.Load = function(obj) {
  this.Shape.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
  this.Shape.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
  this.Shape.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
  this.LineWidth = parseFloat(obj.linewidth);
  this.Shape.LineWidth = this.LineWidth;
  this.Shape.Points = [];
  for(var n=0; n < obj.points.length; n++){
      this.Shape.Points[n] = [parseFloat(obj.points[n][0]),
                            parseFloat(obj.points[n][1])];
  }
  this.Shape.Closed = obj.closedloop;
  this.UpdateBounds();
  this.Shape.UpdateBuffers();

  // How zoomed in was the view when the annotation was created.
  if (obj.view_height !== undefined) {
    this.CreationCamera = obj.creation_camera;
  }
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

PolylineWidget.prototype.HandleMouseWheel = function(event) {
    // TODO: Scale the thickness.
    return false;
}

PolylineWidget.prototype.HandleKeyPress = function(event) {
  // Copy
  if (event.keyCode == 67 && event.ctrlKey) {
    // control-c for copy
    // The extra identifier is not needed for widgets, but will be
    // needed if we have some other object on the clipboard.
    var clip = {Type:"PolylineWidget", Data: this.Serialize()};
    localStorage.ClipBoard = JSON.stringify(clip);
    return false;
  }

  if (event.keyCode == 27) { // escape
    // Last resort.  ESC key always deactivates the widget.
    // Deactivate.
    this.Deactivate();
    RecordState();
    return false;
  }

  return true;
}

PolylineWidget.prototype.HandleDoubleClick = function(event) {
    this.Deactivate();
    return true;
}

PolylineWidget.prototype.Deactivate = function() {
    this.Popup.StartHideTimer();
    this.State = POLYLINE_WIDGET_WAITING;
    this.Viewer.DeactivateWidget(this);
    this.Shape.Active = false;
    this.ActivateVertex(-1);
    if (this.DeactivateCallback) {
        this.DeactivateCallback();
    }

    if (this.Shape.Points.length < 2) {
        this.RemoveFromViewer();
    }

    this.Viewer.EventuallyRender(false);
}

// Mouse down does nothing. Mouse up causes all state changes.
PolylineWidget.prototype.HandleMouseDown = function(event) {
  var x = event.offsetX;
  var y = event.offsetY;
  var pt = this.Viewer.ConvertPointViewerToWorld(x,y);

  if (this.State == POLYLINE_WIDGET_NEW) {
    this.Shape.Points.push(pt);
    this.Shape.Points.push([pt[0], pt[1]]); // avoid same reference.
    this.ActivateVertex(-1);
    this.State = POLYLINE_WIDGET_NEW_EDGE;
    this.UpdateBounds();
    this.Viewer.EventuallyRender(false);
    return;
  }
  if (this.State == POLYLINE_WIDGET_NEW_EDGE) {
    if (this.ActiveVertex >= 0) { // The user clicked on an active vertex. End the line.
      // Remove the temporary point at end used for drawining.
      this.Shape.Points.pop();
      if (this.ActiveVertex == 0) {
        this.Shape.Closed = true;
      }
      this.Deactivate();
      RecordState();
      return;
    }
    this.Shape.Points.push(pt);
    this.Shape.UpdateBuffers();
    this.UpdateBounds();
    this.Viewer.EventuallyRender(true);
    return;
  }

  if (this.State == POLYLINE_WIDGET_MIDPOINT_ACTIVE) {
    // Compute the midpoint.
    var x, y;
    if (this.ActiveMidpoint == 0) {
      var numPoints = this.Shape.Points.length;
      // The closed option is becoming a pain.
      x = 0.5 * (this.Shape.Points[numPoints-1][0] + this.Shape.Points[0][0]);
      y = 0.5 * (this.Shape.Points[numPoints-1][1] + this.Shape.Points[0][1]);
    } else {
      x = 0.5 * (this.Shape.Points[this.ActiveMidpoint-1][0] + this.Shape.Points[this.ActiveMidpoint][0]);
      y = 0.5 * (this.Shape.Points[this.ActiveMidpoint-1][1] + this.Shape.Points[this.ActiveMidpoint][1]);
    }
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

  // Old, but could be useful.
  if (this.State == POLYLINE_WIDGET_ACTIVE && event.which == 3) {
    // Right mouse was pressed.
    // Pop up the properties dialog.
    this.State = POLYLINE_WIDGET_PROPERTIES_DIALOG;
    this.ShowPropertiesDialog();
  }

  if (event.which == 1) {
    if (this.State == POLYLINE_WIDGET_VERTEX_ACTIVE ||
        this.State == POLYLINE_WIDGET_ACTIVE) {
      // Dragging a vertex or the whole polyline.
      RecordState();
    }
  }

}


PolylineWidget.prototype.HandleMouseMove = function(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    var pt = this.Viewer.ConvertPointViewerToWorld(x,y);

    if (this.State == POLYLINE_WIDGET_NEW) {
        this.Circle.Origin = pt;
        this.Viewer.EventuallyRender(true);
        return;
    }
    if (this.State == POLYLINE_WIDGET_NEW_EDGE) {
        var lastIdx = this.Shape.Points.length - 1;
        this.Shape.Points[lastIdx] = pt;
        this.Shape.UpdateBuffers();
        this.UpdateBounds();
        if (SA.NotesWidget) {SA.NotesWidget.MarkAsModified();} // hack
        var idx = this.WhichVertexShouldBeActive(pt);
        // Only the first or last vertexes will stop the new line.
        this.ActivateVertex(idx);
        this.Viewer.EventuallyRender(true);
        return;
    }
    if (this.State == POLYLINE_WIDGET_VERTEX_ACTIVE ||
        this.State == POLYLINE_WIDGET_MIDPOINT_ACTIVE ||
        this.State == POLYLINE_WIDGET_ACTIVE) {
        if (event.which == 0) {
            // Turn off the active vertex if the mouse moves away.
            this.SetActive(this.CheckActive(event));
            return;
        }
        if (this.State == POLYLINE_WIDGET_ACTIVE && event.which == 1) {
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
            if (SA.NotesWidget) {SA.NotesWidget.MarkAsModified();} // hack
            this.PlacePopup();
            this.Viewer.EventuallyRender(true);
            return;
        }
        if (this.State == POLYLINE_WIDGET_VERTEX_ACTIVE && event.which == 1) {
            //drag the vertex
            this.Shape.Points[this.ActiveVertex] = pt;
            this.Circle.Origin = pt;
            this.Shape.UpdateBuffers();
            if (SA.NotesWidget) {SA.NotesWidget.MarkAsModified();} // hack
            this.PlacePopup();
            this.Viewer.EventuallyRender(true);
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
  var x = event.offsetX;
  var y = event.offsetY;
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
  var numPoints = this.Shape.Points.length;
  for (idx = 0; idx < numPoints; ++idx) {
    // Some juggling to detect the closing edget from end to 0.
    if (idx == 0) {
      if ( ! this.Shape.Closed) {
        continue;
      }
      x = 0.5 *(this.Shape.Points[numPoints-1][0] + this.Shape.Points[idx][0]);
      y = 0.5 *(this.Shape.Points[numPoints-1][1] + this.Shape.Points[idx][1]);
    } else {
      x = 0.5 *(this.Shape.Points[idx-1][0] + this.Shape.Points[idx][0]);
      y = 0.5 *(this.Shape.Points[idx-1][1] + this.Shape.Points[idx][1]);
    }
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
  var width = Math.max(this.MinLine * 4, this.LineWidth);
  for (var i = 1; i < this.Shape.Points.length; ++i) {
    if (this.Shape.IntersectPointLine(pt, this.Shape.Points[i-1],
                                      this.Shape.Points[i], width)) {
      this.State = POLYLINE_WIDGET_ACTIVE;
      this.Shape.Active = true;
      this.PlacePopup();
      return true;
    }
  }
  if (this.Shape.Closed) {
    if (this.Shape.IntersectPointLine(pt, this.Shape.Points[0],
                                      this.Shape.Points[this.Shape.Points.length-1], width)) {
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
    this.Viewer.EventuallyRender(false);
  } else {
    var cam = this.Viewer.MainView.Camera;
    var viewport = this.Viewer.MainView.Viewport;
    this.Circle.Radius = 5.0*cam.Height/viewport[3];
    this.UpdateCircleRadius();
    this.Circle.UpdateBuffers();
    this.Circle.Visibility = true;
    this.Circle.Origin = this.Shape.Points[vIdx];
    this.PlacePopup();
    this.Viewer.EventuallyRender(false);
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
    this.Viewer.EventuallyRender(false);
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
  this.Dialog.ColorInput.val(ConvertColorToHex(this.Shape.OutlineColor));
  this.Dialog.ClosedInput.prop('checked', this.Shape.Closed);
  this.Dialog.LineWidthInput.val((this.Shape.LineWidth).toFixed(2));

  var length = this.ComputeLength() * 0.25; // microns per pixel.
  var lengthString = "";
  if (this.Shape.FixedSize) {
    lengthString += length.toFixed(2);
    lengthString += " px";
  } else {
      if (length > 1000) {
          lengthString += (length/1000).toFixed(2) + " mm";
      } else {
          // Latin-1 00B5 is micro sign
          lengthString += length.toFixed(2) + " \xB5m";
      }
  }
  this.Dialog.Length.text(lengthString);


  if (this.Shape.Closed) {
    this.Dialog.AreaDiv.show();
    var area = this.ComputeArea() * 0.25 * 0.25;
    var areaString = "";
    if (this.Shape.FixedSize) {
        areaString += area.toFixed(2);
        areaString += " pixels^2";
    } else {
        if (area > 1000000) {
            areaString += (area/1000000).toFixed(2) + " mm^2";
        } else {
            // Latin-1 00B5 is micro sign
            areaString += area.toFixed(2) + " \xB5m^2";
        }
    }
    this.Dialog.Area.text(areaString);
  } else {
    this.Dialog.AreaDiv.hide();
  }
  this.Dialog.Show(true);
}

PolylineWidget.prototype.DialogApplyCallback = function() {
    var hexcolor = this.Dialog.ColorInput.val();
    this.Shape.SetOutlineColor(hexcolor);
    this.Shape.Closed = this.Dialog.ClosedInput.prop("checked");

    // Cannot use the shap line width because it is set to zero (single pixel)
    // it the dialog value is too thin.
    this.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
    this.Shape.UpdateBuffers();
    this.SetActive(false);
    RecordState();
    this.Viewer.EventuallyRender(false);

    localStorage.PolylineWidgetDefaults = JSON.stringify(
        {Color: hexcolor,
         ClosedLoop: this.Shape.Closed,
         LineWidth: this.LineWidth});
    if (SA.NotesWidget) {SA.NotesWidget.MarkAsModified();} // hack
}

// Note, self intersection can cause unexpected areas.
// i.e looping around a point twice ...
PolylineWidget.prototype.ComputeArea = function() {
    if (this.Shape.Points.length == 0) {
        return 0.0;
    }

    // Compute the center. It should be more numerically stable.
    // I could just choose the first point as the origin.
    var cx = 0;
    var cy = 0;
    for (var j = 0; j < this.Shape.Points.length; ++j) {
        cx += this.Shape.Points[j][0];
        cy += this.Shape.Points[j][1];
    }
    cx = cx / this.Shape.Points.length;
    cy = cy / this.Shape.Points.length;

    var area = 0.0;
    // Iterate over triangles adding the area of each
    var last = this.Shape.Points.length-1;
    var vx1 = this.Shape.Points[last][0] - cx;
    var vy1 = this.Shape.Points[last][1] - cy;
    // First and last point form another triangle (they are not the same).
    for (var j = 0; j < this.Shape.Points.length; ++j) {
        // Area of triangle is 1/2 magnitude of cross product.
        var vx2 = vx1;
        var vy2 = vy1;
        vx1 = this.Shape.Points[j][0] - cx;
        vy1 = this.Shape.Points[j][1] - cy;
        area += (vx1*vy2) - (vx2*vy1);
    }

    // Handle both left hand loops and right hand loops.
    if (area < 0) {
        area = -area;
    }
    return area;
}

// Note, self intersection can cause unexpected areas.
// i.e looping around a point twice ...
PolylineWidget.prototype.ComputeLength = function() {
    if (this.Shape.Points.length < 2) {
        return 0.0;
    }

    var length = 0;
    var x0 = this.Shape.Points[0][0];
    var y0 = this.Shape.Points[0][1];
    for (var j = 1; j < this.Shape.Points.length; ++j) {
        var x1 = this.Shape.Points[j][0];
        var y1 = this.Shape.Points[j][1];
        var dx = x1-x0;
        var dy = y1-y0;
        x0 = x1;
        y0 = y1;
        length += Math.sqrt(dx*dx + dy*dy);
    }

    return length;
}


PolylineWidget.prototype.PointInside = function(ox,oy) {
    if (this.Shape.Closed == false) {
        return false;
    }
    var x,y;
    var max = this.Shape.Points.length - 1;
    var xPos = 0;
    var xNeg = 0;
    //var yCount = 0;
    var pt0 = this.Shape.Points[max];
    pt0 = [pt0[0]-ox, pt0[1]-oy];
    for (var idx = 0; idx <= max; ++idx) {
        var pt1 = this.Shape.Points[idx];
        pt1 = [pt1[0]-ox, pt1[1]-oy];
        var k;
        k = (pt1[1] - pt0[1]);
        if ( k != 0 ) {
            k = -pt0[1] / k;
            if ( k > 0 && k <= 1) {
                // Edge crosses the axis.  Find the intersection.
                x = pt0[0] + k*(pt1[0]-pt0[0]);
                if (x > 0) { xPos += 1; }
                if (x < 0) { xNeg += 1; }
            }
        }
        pt0 = pt1;
    }

    if ((xPos % 2) && (xNeg % 2)) {
        return true
    }
    return false;
}

// Save images with centers inside the polyline.
PolylineWidget.prototype.Sample = function(dim, spacing, skip, root, count) {
    var bds = this.Shape.GetBounds();
    var ctx = this.Viewer.MainView.Context2d;
    for (var y = bds[2]; y < bds[3]; y += skip) {
        for (var x = bds[0]; x < bds[1]; x += skip) {
            if (this.PointInside(x,y)) {
                ip = this.Viewer.ConvertPointWorldToViewer(x,y);
                ip[0] = Math.round(ip[0] - dim/2);
                ip[1] = Math.round(ip[1] - dim/2);
                var data = ctx.getImageData(ip[0],ip[1],dim,dim);
                DownloadImageData(data, root+"_"+count+".png");
                ++count;
            }
        }
    }
}


// Save images with centers inside the polyline.
PolylineWidget.prototype.SampleStack = function(dim, spacing, skip, root, count) {
    var cache = VIEWERS[0].GetCache();
    var bds = this.Shape.GetBounds();
    for (var y = bds[2]; y < bds[3]; y += skip) {
        for (var x = bds[0]; x < bds[1]; x += skip) {
            if (this.PointInside(x,y)) {
                GetCutoutimage(cache, dim, [x,y], spacing, 0, null,
                               function (data) {
                                   DownloadImageData(data, root+"_"+count+".png");
                                   ++count;
                               });
            }
        }
    }
}


// Save images with centers inside the polyline.
PolylineWidget.prototype.DownloadStack = function(x, y, dim, spacing, root) {
    var cache = VIEWERS[0].GetCache();
    for (var i = 0; i < 3; ++i) {
        levelSpacing = spacing << i;
        GetCutoutImage(cache, dim, [x,y], levelSpacing, 0, root+i+".png", null);
    }
}




// Saves images centered at spots on the edge.
// Roll is set to put the edge horizontal.
// Step is in screen pixel units
PolylineWidget.prototype.SampleEdge = function(dim, step, count, callback) {
    this.Shape.SampleEdge(this.Viewer,dim,step,count,callback);
}


function DownloadTheano(widgetIdx, angleIdx) {
    EDGE_ANGLE = 2*Math.PI * angleIdx / 24;
    VIEWERS[0].WidgetList[widgetIdx].SampleEdge(
        64,4,EDGE_COUNT,
        function () {
            setTimeout(function(){ DownloadTheano2(widgetIdx, angleIdx); }, 1000);
        });
}


function DownloadTheano2(widgetIdx, angleIdx) {
    ++angleIdx;
    if (angleIdx >= 24) {
        angleIdx = 0;
        ++widgetIdx;
    }
    if (widgetIdx < VIEWERS[0].WidgetList.length) {
        DownloadTheano(widgetIdx, angleIdx);
    }
}

