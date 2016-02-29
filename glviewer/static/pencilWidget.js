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


var PENCIL_WIDGET_DRAWING = 0;
var PENCIL_WIDGET_ACTIVE = 1;
var PENCIL_WIDGET_WAITING = 2;


function PencilWidget (layer, newFlag) {
    if (layer == null) {
        return;
    }

    var self = this;
    this.Dialog = new Dialog(function () {self.DialogApplyCallback();});
    // Customize dialog for a pencil.
    this.Dialog.Title.text('Pencil Annotation Editor');
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

    this.LineWidth = 0;
    if (localStorage.PencilWidgetDefaults) {
        var defaults = JSON.parse(localStorage.PencilWidgetDefaults);
        if (defaults.Color) {
            this.Dialog.ColorInput.val(ConvertColorToHex(defaults.Color));
        }
        if (defaults.LineWidth) {
            this.LineWidth = defaults.LineWidth;
            this.Dialog.LineWidthInput.val(this.LineWidth);
        }
    }




    this.Layer = layer;
    this.Popup = new WidgetPopup(this);
    this.Layer.AddWidget(this);

    var self = this;
    this.Shapes = [];
    this.ActiveCenter = [0,0];
    this.State = PENCIL_WIDGET_DRAWING;
    this.Layer.GetCanvasDiv().css(
        {'cursor':'url('+SA.ImagePathUrl+'Pencil-icon.png) 0 24,crosshair'});

    if ( ! newFlag) {
        this.State = PENCIL_WIDGET_WAITING;
        this.Layer.GetCanvasDiv().css({'cursor':'default'});
    }

    // Lets save the zoom level (sort of).
    // Load will overwrite this for existing annotations.
    // This will allow us to expand annotations into notes.
    this.CreationCamera = layer.GetCamera().Serialize();
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
  obj.creation_camera = this.CreationCamera;

  return obj;
}

// Load a widget from a json object (origin MongoDB).
PencilWidget.prototype.Load = function(obj) {
  for(var n=0; n < obj.shapes.length; n++){
    var points = obj.shapes[n];
    var shape = new Polyline();
    shape.SetOutlineColor(this.Dialog.ColorInput.val());
    shape.FixedSize = false;
    shape.LineWidth = this.LineWidth;
    this.Shapes.push(shape);
    for (var m = 0; m < points.length; ++m) {
      shape.Points[m] = [points[m][0], points[m][1]];
    }
    shape.UpdateBuffers();
  }

  // How zoomed in was the view when the annotation was created.
  if (obj.view_height !== undefined) {
    this.CreationCamera = obj.creation_camera;
  }
}

PencilWidget.prototype.Deactivate = function() {
    this.Popup.StartHideTimer();
    this.Layer.GetCanvasDiv().css({'cursor':'default'});
    this.Layer.DeactivateWidget(this);
    this.State = PENCIL_WIDGET_WAITING;
    for (var i = 0; i < this.Shapes.length; ++i) {
        this.Shapes[i].Active = false;
    }
    if (this.DeactivateCallback) {
        this.DeactivateCallback();
    }
    this.Layer.EventuallyDraw();
}

PencilWidget.prototype.HandleMouseDown = function(event) {
    var x = event.offsetX;
    var y = event.offsetY;

    if (event.which == 1) {
        // Start drawing.
        var shape = new Polyline();
        //shape.OutlineColor = [0.9, 1.0, 0.0];
        shape.OutlineColor = [0.0, 0.0, 0.0];
        shape.SetOutlineColor(this.Dialog.ColorInput.val());
        shape.FixedSize = false;
        shape.LineWidth = 0;
        this.Shapes.push(shape);

        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x,y);
        shape.Points.push([pt[0], pt[1]]); // avoid same reference.
    }
}

PencilWidget.prototype.HandleMouseUp = function(event) {
    if (event.which == 3) {
        // Right mouse was pressed.
        // Pop up the properties dialog.
        this.ShowPropertiesDialog();
    }
    // Middle mouse deactivates the widget.
    if (event.which == 2) {
        // Middle mouse was pressed.
        this.Deactivate();
    }

    // A stroke has just been finished.
    if (event.which == 1 && this.Shapes.length > 0) {
        var spacing = this.Layer.GetCamera().GetSpacing();
        this.Decimate(this.Shapes[this.Shapes.length - 1], spacing);
        RecordState();
        this.ComputeActiveCenter();
    }
}

PencilWidget.prototype.HandleDoubleClick = function(event) {
    this.Deactivate();
}

PencilWidget.prototype.HandleMouseMove = function(event) {
    var x = event.offsetX;
    var y = event.offsetY;

    if (event.which == 1 && this.State == PENCIL_WIDGET_DRAWING) {
        var shape = this.Shapes[this.Shapes.length-1];
        var pt = this.Layer.GetCamera().ConvertPointLayerToWorld(x,y);
        shape.Points.push([pt[0], pt[1]]); // avoid same reference.
        shape.UpdateBuffers();
        if (SA.NotesWidget) { SA.NotesWidget.MarkAsModified(); } // Hack
        this.Layer.EventuallyDraw();
        return;
    }

    if (this.State == PENCIL_WIDGET_ACTIVE &&
        event.which == 0) {
        // Deactivate
        this.SetActive(this.CheckActive(event));
        return;
    }
}

PencilWidget.prototype.ComputeActiveCenter = function() {
    var count = 0;
    var sx = 0.0;
    var sy = 0.0;
    for (var i = 0; i < this.Shapes.length; ++i) {
        var shape = this.Shapes[i];
        var points = [];
        for (var j = 0; j < shape.Points.length; ++j) {
            sx += shape.Points[j][0];
            sy += shape.Points[j][1];
        }
        count += shape.Points.length;
    }

    this.ActiveCenter[0] = sx / count;
    this.ActiveCenter[1] = sy / count;
}

//This also shows the popup if it is not visible already.
PencilWidget.prototype.PlacePopup = function () {
    var pt = this.Layer.GetCamera().ConvertPointWorldToViewer(this.ActiveCenter[0],
                                                              this.ActiveCenter[1]);
    pt[0] += 40;
    pt[1] -= 40;
    this.Popup.Show(pt[0],pt[1]);
}

PencilWidget.prototype.CheckActive = function(event) {
    if (this.State == PENCIL_WIDGET_DRAWING) { return; }

    var pt = this.Layer.GetCamera().ConvertPointWorldToViewer(this.ActiveCenter[0],
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

PencilWidget.prototype.GetActive = function() {
    return false;
}

// Setting to active always puts state into "active".
// It can move to other states and stay active.
PencilWidget.prototype.SetActive = function(flag) {
    if (flag) {
        this.Layer.ActivateWidget(this);
        this.State = PENCIL_WIDGET_ACTIVE;
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].Active = true;
        }
        this.PlacePopup();
        this.Layer.EventuallyDraw();
    } else {
        this.Deactivate();
        this.Layer.DeactivateWidget(this);
    }
}

PencilWidget.prototype.RemoveFromLayer = function() {
    if (this.Layer) {
        this.Layer.RemoveWidget(this);
    }
    this.Layer = null;
}

// Can we bind the dialog apply callback to an objects method?
var PENCIL_WIDGET_DIALOG_SELF
PencilWidget.prototype.ShowPropertiesDialog = function () {
    this.Dialog.ColorInput.val(ConvertColorToHex(this.Shapes[0].OutlineColor));
    this.Dialog.LineWidthInput.val((this.Shapes[0].LineWidth).toFixed(2));

    this.Dialog.Show(true);
}


PencilWidget.prototype.DialogApplyCallback = function() {
    var hexcolor = this.Dialog.ColorInput.val();
    this.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
    for (var i = 0; i < this.Shapes.length; ++i) {
        this.Shapes[i].SetOutlineColor(hexcolor);
        this.Shapes[i].LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
        this.Shapes[i].UpdateBuffers();
    }
    this.SetActive(false);
    RecordState();
    this.Layer.EventuallyDraw();

    localStorage.PencilWidgetDefaults = JSON.stringify({Color: hexcolor,
                                                        LineWidth: this.LineWidth});
    if (SA.NotesWidget) { SA.NotesWidget.MarkAsModified(); } // Hack
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



