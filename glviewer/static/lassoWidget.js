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

  this.Dialog = new Dialog(this);
  // Customize dialog for a lasso.
  this.Dialog.Title.text('Lasso Annotation Editor');
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
  if (localStorage.LassoWidgetDefaults) {
    var defaults = JSON.parse(localStorage.LassoWidgetDefaults);
    if (defaults.Color) {
      this.Dialog.ColorInput.val(ConvertColorToHex(defaults.Color));
    }
    if (defaults.LineWidth) {
      this.Dialog.LineWidthInput.val(defaults.LineWidth);
    }
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
      .attr('src',"/webgl-viewer/static/select_lasso.png");

  var self = this;
  // I am trying to stop images from getting move events and displaying a circle/slash.
  // This did not work.  preventDefault did not either.
  //this.Cursor.mousedown(function (event) {self.HandleMouseDown(event);})
  //this.Cursor.mousemove(function (event) {self.HandleMouseMove(event);})
  //this.Cursor.mouseup(function (event) {self.HandleMouseUp(event);})
  //.preventDefault();

  this.Loop = new Polyline();
  this.Loop.OutlineColor = [0.0, 0.0, 0.0];
  this.Loop.SetOutlineColor(this.Dialog.ColorInput.val());
  this.Loop.FixedSize = false;
  this.Loop.LineWidth = 0;
  this.Loop.Closed = true;  
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
  obj.outlinecolor = this.Loop.OutlineColor;
  obj.points = [];
  for (var j = 0; j < this.Loop.Points.length; ++j) {
    obj.points.push([this.Loop.Points[j][0], this.Loop.Points[j][1]]);
  }
  obj.closedloop = true;

  return obj;
}

// Load a widget from a json object (origin MongoDB).
LassoWidget.prototype.Load = function(obj) {
  if (obj.outlinecolor != undefined) {
    this.Loop.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
    this.Loop.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
    this.Loop.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
    this.Stroke.OutlineColor = this.Loop.OutlineColor;
  }
  var points = [];
  if ( obj.points != undefined) {
    points = obj.points;
  }
  if ( obj.shape != undefined) {
    points = obj.shapes[0];
  }

  for(var n=0; n < points.length; n++){
      this.Loop.Points[n] = [parseFloat(points[n][0]),
                             parseFloat(points[n][1])];
  }
  this.ComputeActiveCenter();
  this.Loop.UpdateBuffers();
}

LassoWidget.prototype.HandleKeyPress = function(keyCode, shift) {
  return false;
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
    if (this.DeactivateCallback) {
        this.DeactivateCallback();
    }
    eventuallyRender();
}

LassoWidget.prototype.HandleMouseDown = function(event) {
  var x = event.offsetX;
  var y = event.offsetY;

  if (event.which == 1) {
    // Start drawing.

    // Stroke is a temporary line for interaction.
    // When interaction stops, it is converted/merged with loop.
    this.Stroke = new Polyline();
    this.Stroke.OutlineColor = [0.0, 0.0, 0.0];
    this.Stroke.SetOutlineColor(this.Dialog.ColorInput.val());
    this.Stroke.FixedSize = false;
    this.Stroke.LineWidth = 0;

    var pt = this.Viewer.ConvertPointViewerToWorld(x,y);
    this.Stroke.Points = [];
    this.Stroke.Points.push([pt[0], pt[1]]); // avoid same reference.
  }
}

LassoWidget.prototype.HandleMouseUp = function(event) {
  // Middle mouse deactivates the widget.
  if (event.which == 2) {
    // Middle mouse was pressed.
    this.Deactivate();
  }

  // A stroke has just been finished.
  if (event.which == 1) {
    var spacing = this.Viewer.GetSpacing();
    this.Decimate(this.Stroke, spacing);
    if (this.Loop && this.Loop.Points.length > 0) {
      this.CombineStroke(); 
    } else {
      this.Stroke.Closed = true;
      this.Stroke.UpdateBuffers();
      this.Loop = this.Stroke;
      this.Stroke = false;
    }
    this.ComputeActiveCenter();
    eventuallyRender();

    RecordState();
  }
}

LassoWidget.prototype.HandleDoubleClick = function(event) {
  this.Deactivate();
}

LassoWidget.prototype.HandleMouseMove = function(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    
    // Move the lasso icon to follow the mouse.
    this.Cursor.css({'left': (x+4), 'top': (y-32)});
    
    if (event.which == 1 && this.State == LASSO_WIDGET_DRAWING) {
        var shape = this.Stroke;
        var pt = this.Viewer.ConvertPointViewerToWorld(x,y);
        shape.Points.push([pt[0], pt[1]]); // avoid same reference.
        shape.UpdateBuffers();
        eventuallyRender();
        return;
    }

    if (this.State == LASSO_WIDGET_ACTIVE &&
        event.which == 0) {
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

  var dx = event.offsetX - pt[0];
  var dy = event.offsetY - pt[1];
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
  this.Dialog.ColorInput.val(ConvertColorToHex(this.Loop.OutlineColor));

  this.Dialog.LineWidthInput.val((this.Loop.LineWidth).toFixed(2));

  var area = this.ComputeArea();
  var areaString = "" + area.toFixed(2);
  if (this.Loop.FixedSize) {
    areaString += " pixels^2";
  } else {
    areaString += " units^2";
  }
  this.Dialog.Area.text(areaString);
  this.Dialog.Show(true);
}

LassoWidget.prototype.DialogApplyCallback = function() {
  var hexcolor = this.Dialog.ColorInput.val();
  this.Loop.SetOutlineColor(hexcolor);
  this.Loop.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
  this.Loop.UpdateBuffers();
  this.SetActive(false);
  RecordState();
  eventuallyRender();

  localStorage.LassoWidgetDefaults = JSON.stringify({Color: hexcolor, LineWidth: this.Loop.LineWidth});
}


// The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
// Pass in the spacing as a hint to get rid of aliasing.
LassoWidget.prototype.Decimate = function(shape, spacing) {
  // Keep looping over the line removing points until the line does not change.
  var modified = true;
    var sanityCheck = 0;
  while (modified) {
    modified = false;
    var newPoints = [];
    newPoints.push(shape.Points[0]);
    // Window of four points.
    var i = 3;
    while (i < shape.Points.length) {
      // Debugging a hang.  I do not think it occurs in decimate, but it might.
      if (++sanityCheck > 100000) {
        alert("Decimate is takeing too long.");
        return;
      }
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



LassoWidget.prototype.CombineStroke = function() {

  // This algorithm was desinged to have the first point be the same as the last point.
  // To generalize polylineWidgets and lassoWidgets, I changed this and put a closed 
  // flag (which implicitely draws the last segment) in polyline.
  // It is easier to temporarily add the extra point and them remove it, than change the algorithm.
  this.Loop.Points.push(this.Loop.Points[0]);


  // Find the first and last intersection points between stroke and loop.
  var intersection0;
  var intersection1;
  for (var i = 1; i < this.Stroke.Points.length; ++i) {
    var pt0 = this.Stroke.Points[i-1];
    var pt1 = this.Stroke.Points[i];
    var tmp = this.FindIntersection(pt0, pt1);     
    if (tmp) {
      // I need to insert the intersection in the stroke so
      // one stroke segment does not intersect loop twice.
      this.Stroke.Points.splice(i,0,tmp.Point);
      if (intersection0 == undefined) {
        intersection0 = tmp;
        intersection0.StrokeIndex = i;
      } else {
        // If a point was added before first intersection,
        // its index needs to be updated too.
        if (tmp.LoopIndex < intersection0.LoopIndex) {
          intersection0.LoopIndex += 1;
        }
        intersection1 = tmp;
        intersection1.StrokeIndex = i;
      }
    }
  }

  var sanityCheck = 0;

  // If we have two intersections, clip the loop with the stroke.
  if (intersection1 != undefined) {
    // We will have two parts.
    // Build both loops keeing track of their lengths.
    // Keep the longer part.
    var points0 = [];
    var len0 = 0.0;
    var points1 = [];
    var len1 = 0.0;
    var i;
    // Add the clipped stroke to both loops.
    for (i = intersection0.StrokeIndex; i < intersection1.StrokeIndex; ++i) {
      points0.push(this.Stroke.Points[i]);
      points1.push(this.Stroke.Points[i]);
    }
    // Now the two new loops take different directions around the original loop.
    // Decreasing
    i = intersection1.LoopIndex;
    while (i != intersection0.LoopIndex) {
      if (++sanityCheck > 1000000) {
        alert("Combine loop 1 is taking too long.");
        return;
      }
      points0.push(this.Loop.Points[i]);
      var dx = this.Loop.Points[i][0];
      var dy = this.Loop.Points[i][1];
      // decrement around loop.  First and last loop points are the same.
      if (--i == 0) { i = this.Loop.Points.length - 1;}
      // Integrate distance.
      dx -= this.Loop.Points[i][0];
      dy -= this.Loop.Points[i][1];
      len0 += Math.sqrt(dx*dx + dy*dy);
    }
    // Duplicate the first point in the loop
    points0.push(intersection0.Point);

    // Increasing
    i = intersection1.LoopIndex;
    while (i != intersection0.LoopIndex) {
      if (++sanityCheck > 1000000) {
        alert("Combine loop 2 is taking too long.");
        return;
      }
      points1.push(this.Loop.Points[i]);
      var dx = this.Loop.Points[i][0];
      var dy = this.Loop.Points[i][1];
      //increment around loop.  First and last loop points are the same.
      if (++i == this.Loop.Points.length - 1) { i = 0;}
      // Integrate distance.
      dx -= this.Loop.Points[i][0];
      dy -= this.Loop.Points[i][1];
      len1 += Math.sqrt(dx*dx + dy*dy);
    }
    // Duplicate the first point in the loop
    points1.push(intersection0.Point);

    if (len0 > len1) {
      this.Loop.Points = points0;
    } else {
      this.Loop.Points = points1;
    }

    RecordState();
  }

  // Remove the extra point added at the begining of this method.
  this.Loop.Points.pop();
  this.Loop.UpdateBuffers();
  this.ComputeActiveCenter();

  this.Stroke = false;
  eventuallyRender();
}


// tranform all points so p0 is origin and p1 maps to (1,0)
// Returns false if no intersection, 
// If there is an intersection, it adds that point to the loop.
// It returns {Point: newPt, LoopIndex: i} .
LassoWidget.prototype.FindIntersection = function(p0, p1) {
  var best = false;
  var p = [(p1[0]-p0[0]), (p1[1]-p0[1])];
  var mag = Math.sqrt(p[0]*p[0] + p[1]*p[1]);
  if (mag < 0.0) { return false;}
  p[0] = p[0] / mag;
  p[1] = p[1] / mag;

  var m0 = this.Loop.Points[0];
  var n0 = [(m0[0]-p0[0])/mag, (m0[1]-p0[1])/mag];
  var k0 = [(n0[0]*p[0]+n0[1]*p[1]), (n0[1]*p[0]-n0[0]*p[1])];

  for (var i = 1; i < this.Loop.Points.length; ++i) {
    var m1 = this.Loop.Points[i];
    // Avoid an infinite loop inserting points.
    if (p0 == m0 || p0 == m1) { continue;}
    var n1 = [(m1[0]-p0[0])/mag, (m1[1]-p0[1])/mag];
    var k1 = [(n1[0]*p[0]+n1[1]*p[1]), (n1[1]*p[0]-n1[0]*p[1])];
    if ((k1[1] >= 0.0 && k0[1] <= 0.0) || (k1[1] <= 0.0 && k0[1] >= 0.0)) {
      var k = k0[1] / (k0[1]-k1[1]);
      var x = k0[0] + k*(k1[0]-k0[0]); 
      if (x > 0 && x <=1) {
        var newPt = [(m0[0]+k*(m1[0]-m0[0])), (m0[1]+k*(m1[1]-m0[1]))];  
        if ( ! best || x < best.k) {
          best = {Point: newPt, LoopIndex: i, k: x}; 
        }
      }
    }
    m0 = m1;
    n0 = n1;
    k0 = k1;
  }
  if (best) {
    this.Loop.Points.splice(best.LoopIndex,0,best.Point);
  }

  return best;
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


LassoWidget.prototype.ComputeArea = function() {
  var area = 0.0;
  // Use the active center. It should be more numerical stable.
  // Iterate over triangles
  var vx1 = this.Loop.Points[0][0] - this.ActiveCenter[0];    
  var vy1 = this.Loop.Points[0][1] - this.ActiveCenter[1];
  for (var j = 1; j < this.Loop.Points.length; ++j) {
    // Area of triangle is 1/2 magnitude of cross product.
    var vx2 = vx1;
    var vy2 = vy1;
    vx1 = this.Loop.Points[j][0] - this.ActiveCenter[0];    
    vy1 = this.Loop.Points[j][1] - this.ActiveCenter[1];
    area += (vx1*vy2) - (vx2*vy1);
  }

  if (area < 0) {
    area = -area;
  }
  return area;
}

