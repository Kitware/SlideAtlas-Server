// TODO:
// - Save stackSctionWidgts in stacks from stack creator.
// - Start by treating it as an annotation (visibility, WidgetList).
// - Show all section annotations in every section view.
// - highlight the current section widget.
// - have each widget display a number indicating its sequence location.
// - each widget will have a delete icon.
// - Tool to draw a rectangle to create a new contour, or merge multiple
//     contours into one.

// The only place to keep a list of sections on a slide is in the cache.
// I will start keeping it in the viewer record (section) annotation in 
// the DB, but create a cache list when they are loaded.

//==============================================================================
// Initially a contour found for each section in a stack.
// Each section gets on of these StackSectionWidgets.  I am extending this
// to include multiple contours fo sections that have multiple pieces,
// and internal contours / features.  Internal edges may not be closed
// loops.
// Initialy, these widgets will have no interaction, so they might
// be better as shapes, but we will see.

// Eventually I will put a transformation in here.
// Also, I would like this to have its own instance variable in
// the viewerRecord.


function StackSectionWidget (viewer) {
    var self = this;

    // Active is just to turn the section yellow temporarily.
    this.Active = false;
    this.Color = [0,1,0];
    this.Shapes = [];

    this.Bounds = null;
    if (viewer) {
        this.Viewer = viewer;
        this.Viewer.WidgetList.push(this);
    }
}

// Add all the lines in the in section to this section.
StackSectionWidget.prototype.Union = function(section) {
    for (var i = 0; i < section.Shapes.length; ++i) {
        this.Shapes.push(section.Shapes[i]);
    }
    this.Bounds = null;
}

// Bounds are in slide / world coordinates.
// Returns 0 if is does not overlap at all.
// Returns 1 if part of the section is in the bounds.
// Returns 2 if all of the section is in the bounds.
StackSectionWidget.prototype.ContainedInBounds = function(bds) {
    var sBds = this.GetBounds();
    if (sBds[0] > bds[0] && sBds[1] < bds[1] &&
        sBds[2] > bds[2] && sBds[3] < bds[3]) {
        // section is fully contained in the bounds.
        return 2;
    }
    if (sBds[1] < bds[0] || sBds[0] > bds[1] || 
        sBds[3] < bds[2] || sBds[2] > bds[3] ) {
        // No overlap of bounds.
        return 0;
    }

    // Bounds partially overlap.  Look closer.
    var pointsIn = false;
    var pointsOut = false;
    for (var i = 0; i < this.Shapes.length; ++i) {
        var shape = this.Shapes[i];
        for (j = 0; j < shape.Points.length; ++j) {
            var pt = shape.Points[j];
            if (bds[0] < pt[0] && pt[0] < bds[1] &&
                bds[0] < pt[0] && pt[0] < bds[1]) {
                pointsIn = true;
            } else {
                pointsOut = true;
            }
            if (pointsIn && pointsOut) {
                return 1;
            }
        }
    }

    if (pointsIn) {
        return 2;
    }
    return 0;
}

// Returns the center of the bounds in view coordinates.
StackSectionWidget.prototype.GetViewCenter = function(view) {
    var bds = this.GetBounds();
    return view.Camera.ConvertPointWorldToViewer((bds[0]+bds[1])*0.5,
                                                 (bds[2]+bds[3])*0.5);
}

// We need bounds in view coordiantes for sorting.
// Do not bother caching the value.
StackSectionWidget.prototype.GetViewBounds = function (view) {
    if (this.Shapes.length == 0) {
        return [0,0,0,0];
    }
    var c = this.GetViewCenter(view);
    var bds = [c[0],c[0],c[1],c[1]];
    for (var i = 0; i < this.Shapes.length; ++i) {
        var shape = this.Shapes[i];
        for (j = 0; j < shape.Points.length; ++j) {
            var pt = shape.Points[j];
            pt = view.Camera.ConvertPointWorldToViewer(pt[0],pt[1]);
            if (pt[0] < bds[0]) { bds[0] = pt[0]; }
            if (pt[0] > bds[1]) { bds[1] = pt[0]; }
            if (pt[1] < bds[2]) { bds[2] = pt[1]; }
            if (pt[1] > bds[3]) { bds[3] = pt[1]; }
        }
    }
    return bds;
}


StackSectionWidget.prototype.ComputeViewUpperRight = function(view) {
    // Compute the upper right corner in view coordinates.
    // This is used by the SectionsWidget holds this section.
    var bds = this.GetBounds();
    var p0 = view.Camera.ConvertPointWorldToViewer(bds[0],bds[2]);
    var p1 = view.Camera.ConvertPointWorldToViewer(bds[0],bds[3]);
    var p2 = view.Camera.ConvertPointWorldToViewer(bds[1],bds[3]);
    var p3 = view.Camera.ConvertPointWorldToViewer(bds[1],bds[2]);
    // Pick the furthest upper right corner.
    this.ViewUpperRight = p0;
    var best = p0[0]-p0[1];
    var tmp = p1[0]-p1[1];
    if (tmp > best) {
        best = tmp;
        this.ViewUpperRight = p1;
    }
    tmp = p2[0]-p2[1];
    if (tmp > best) {
        best = tmp;
        this.ViewUpperRight = p2;
    }
    tmp = p3[0]-p3[1];
    if (tmp > best) {
        best = tmp;
        this.ViewUpperRight = p3;
    }
}


StackSectionWidget.prototype.Draw = function(view) {
    this.ComputeViewUpperRight(view);
    for (var i = 0; i < this.Shapes.length; ++i) {
        if (this.Active) {
            this.Shapes[i].OutlineColor = [1,1,0];
        } else {
            this.Shapes[i].OutlineColor = this.Color;
        }
        this.Shapes[i].Draw(view);
    }
}

StackSectionWidget.prototype.Serialize = function() {
    var obj = new Object();
    obj.type = "stack_section";
    obj.color = this.Color;
    obj.shapes = [];
    for (var i = 0; i < this.Shapes.length; ++i) {
        var shape = this.Shapes[i];
        var points = [];
        for (var j = 0; j < shape.Points.length; ++j) {
            points.push([shape.Points[j][0], shape.Points[j][1]]);
        }
        obj.shapes.push(points);
    }
    if (this.Bounds) {
        obj.bounds = this.Bounds;
    }
    return obj;
}


// Load a widget from a json object (origin MongoDB).
StackSectionWidget.prototype.Load = function(obj) {
    if (obj.color) {
        this.Color[0] = parseFloat(obj.color[0]);
        this.Color[1] = parseFloat(obj.color[1]);
        this.Color[2] = parseFloat(obj.color[2]);
    }
    for(var n=0; n < obj.shapes.length; n++){
        var points = obj.shapes[n];
        var shape = new Polyline();
        shape.OutlineColor = this.Color;
        shape.FixedSize = false;
        shape.LineWidth = 0;
        this.Shapes.push(shape);
        for (var m = 0; m < points.length; ++m) {
            shape.Points[m] = [points[m][0], points[m][1]];
        }
        shape.UpdateBuffers();
    }

    if (obj.bounds !== undefined) {
        this.Bounds[0] = parseFloat(obj.bounds[0]);
        this.Bounds[1] = parseFloat(obj.bounds[1]);
        this.Bounds[2] = parseFloat(obj.bounds[2]);
        this.Bounds[3] = parseFloat(obj.bounds[3]);
    }
}

// We could recompute the bounds from the
StackSectionWidget.prototype.GetBounds = function () {
    if (this.Shapes.length == 0) {
        return this.Bounds;
    }
    if ( ! this.Bounds) {
        this.Bounds = this.Shapes[0].GetBounds();
        for (var i = 1; i < this.Shapes.length; ++i) {
            var bds = this.Shapes[i].GetBounds();
            if (bds[0] < this.Bounds[0]) this.Bounds[0] = bds[0];
            if (bds[1] > this.Bounds[1]) this.Bounds[1] = bds[1];
            if (bds[2] < this.Bounds[2]) this.Bounds[2] = bds[2];
            if (bds[3] > this.Bounds[3]) this.Bounds[3] = bds[3];
        }
    }
    return this.Bounds.slice(0);
}

StackSectionWidget.prototype.Deactivate = function() {
    this.Viewer.DeactivateWidget(this);
    for (var i = 0; i < this.Shapes.length; ++i) {
        this.Shapes[i].Active = false;
    }
    eventuallyRender();
}

StackSectionWidget.prototype.HandleKeyPress = function(keyCode, shift) {
    return true;
}

StackSectionWidget.prototype.HandleMouseDown = function(event) {
    return true;
}

StackSectionWidget.prototype.HandleMouseUp = function(event) {
    return true;
}

StackSectionWidget.prototype.HandleDoubleClick = function(event) {
    return true;
}

StackSectionWidget.prototype.HandleMouseMove = function(event) {
    return true
}


StackSectionWidget.prototype.CheckActive = function(event) {
    return false;
}

StackSectionWidget.prototype.GetActive = function() {
  return false;
}

// Setting to active always puts state into "active".
// It can move to other states and stay active.
StackSectionWidget.prototype.SetActive = function(flag) {
    if (flag) {
        this.Viewer.ActivateWidget(this);
        for (var i = 0; i < this.Shapes.length; ++i) {
            this.Shapes[i].Active = true;
        }

        eventuallyRender();
    } else {
        this.Deactivate();
        this.Viewer.DeactivateWidget(this);
    }
}

StackSectionWidget.prototype.RemoveFromViewer = function() {
    if (this.Viewer == null) {
        return;
    }
    var idx = this.Viewer.WidgetList.indexOf(this);
    if(idx!=-1) {
        this.Viewer.WidgetList.splice(idx, 1);
    }
}

