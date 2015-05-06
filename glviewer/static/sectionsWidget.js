//==============================================================================
// A single widget to detect multiple sections on a slide
// TODO:
// - Stack editor.
//   Create a rigid alignmnet from the sectionWidget.
//   ? Should we save the SectionsWidget in addition to the stackSectionWidget??????
//   ? Default to multiple??????.
// - Click to add a section.
// - Improve the deformable registration to handle multiple contours.
// - Extend the rigid outlier code to work with deformable.
// - ScrollWheel to change the threshold of a section.
//   Allow scroll wheel to zoom when not over a section.
// - drag box to add or crop sections.
// - edit the sequence of numbers (somehow).
// - WHen mouse leaves window, cancel the bbox drag.

// I do not like this behavior:
// Real widgets are always in the viewer.
// Widgets waiting in notes are serialized.
function SectionsWidget (viewer, newFlag) {
    if (viewer == null) {
        return;
    }

    this.Type = "sections";
    this.Viewer = viewer;
    this.Viewer.WidgetList.push(this);

    var self = this;

    this.Sections = [];
    this.Active = false;
    eventuallyRender();

    this.ActiveSection = null;
    this.DragBounds = null;

    // Just one delete button. 
    // Just move it around with the active section.
    this.DeleteButton = $('<img>')
        .appendTo(VIEW_PANEL)
        .hide()
        .css({'height': '20px',
              'position': 'absolute',
              'z-index': '5'})
        .attr('src',"/webgl-viewer/static/deleteSmall.png")
        .click(function(){
                   self.DeleteActiveSection();
               });

    // Right click menu.
    this.Menu = $('<div>')
        .appendTo(VIEW_PANEL)
        .hide()
        .css({
            'width': '150px',
            'background-color': 'white',
            'border-style': 'solid',
            'border-width': '1px',
            'border-radius': '5px',
            'border-color': '#BBB',
            'position': 'absolute',
            'z-index': '4',
            'padding': '0px 2px'});
    $('<button>')
        .appendTo(this.Menu)
        .text("Horizontal Sort")
        .css({'margin':'2px 0px',
              'width' : '100%'})
        .mouseup(function(){self.Menu.hide(); self.Sort(0);});
    $('<button>')
        .appendTo(this.Menu)
        .text("Vertical Sort")
        .css({'margin':'2px 0px',
              'width' : '100%'})
        .mouseup(function(){self.Menu.hide(); self.Sort(1);});
}

// Get union of all section bounds.
SectionsWidget.prototype.GetBounds = function() {
    if (this.Sections.length == 0){ return [0,0,0,0]; }
    var allBds = this.Sections[0].GetBounds();
    for (var i = 0; i < this.Sections.length; ++i) {
        var bds = this.Sections[i].GetBounds();
        if (bds[0] < allBds[0]) { allBds[0] = bds[0];}
        if (bds[1] > allBds[1]) { allBds[1] = bds[1];}
        if (bds[2] < allBds[2]) { allBds[2] = bds[2];}
        if (bds[3] > allBds[3]) { allBds[3] = bds[3];}
    }
    return allBds;
}

// Gets direction from the active section.
SectionsWidget.prototype.Sort = function(axis) {
    var axis0 = 0;
    var axis1 = 1;
    var direction0 = 1;
    var direction1 = 1;
    if (this.ActiveSection) {
        var allBds = this.GetBounds();
        var allCenter = this.Viewer.ConvertPointWorldToViewer(
            (allBds[0]+allBds[1])*0.5, (allBds[0]+allBds[1])*0.5);
        var center = this.ActiveSection.GetViewCenter(this.Viewer.MainView);
        if (center[0] < allCenter[0]) {
            direction0 = -1;
        }
        if (center[1] < allCenter[1]) {
            direction1 = -1;
        }
    }
    if (axis == 1) {
        var tmp = direction0;
        direction0 = direction1;
        direction1 = tmp;
        axis0 = 1;
        axis1 = 0;
    }
    this.ViewSortSections(axis0,direction0, axis1,direction1);
}

SectionsWidget.prototype.ViewSortSections = function(axis0,direction0, 
                                                     axis1,direction1) {
    function lessThan(bds1,bds2) {
        if ((bds1[(axis1<<1)+1] > bds2[axis1<<1]) &&
            ((bds1[axis1<<1] > bds2[(axis1<<1)+1] ||
              bds1[axis0<<1] > bds2[(axis0<<1)+1]))) {
            return true;
        }
        return false;
    }
    // Compute and save view bounds for each section.
    for (var i = 0; i < this.Sections.length; ++i) {
        var section = this.Sections[i];
        section.ViewBounds = section.GetViewBounds(this.Viewer.MainView);
        PermuteBounds(section.ViewBounds, axis0, direction0);
        PermuteBounds(section.ViewBounds, axis1, direction1);
    }

    // Use lessThan to sort (insertion).
    for (var i = 1; i < this.Sections.length; ++i) {
        var bestBds = this.Sections[i-1].ViewBounds;
        var bestIdx = -1;
        for (var j = i; j < this.Sections.length; ++j) {
            var bds = this.Sections[j].ViewBounds;
            if (lessThan(bds, bestBds)) {
                bestBds = bds;
                bestIdx = j;
            }
        }
        if (bestIdx > 0) {
            var tmp = this.Sections[bestIdx];
            this.Sections[bestIdx] = this.Sections[i-1];
            this.Sections[i-1] = tmp;
        }
    }
    eventuallyRender();
}

SectionsWidget.prototype.DeleteActiveSection = function() {
    if (this.ActiveSection == null) { return; }
    var section = this.ActiveSection;
    this.SetActiveSection(null);
    this.RemoveSection(section);
}

SectionsWidget.prototype.RemoveSection = function(section) {
    if (this.ActiveSection == section) this.ActiveSection = null;
    var idx = this.Sections.indexOf(section);
    if (idx > -1) {
        this.Sections.splice(idx,1);
    }
}


SectionsWidget.prototype.SetActiveSection = function(section) {
    if (section == this.ActiveSection) { return;}

    if (this.ActiveSection) {
        this.ActiveSection.Active = false;
        this.DeleteButton.hide();
    } else {
        section.Active = true;
        this.DeleteButton.show();
        // Draw moves it to the correct location.
    }
    this.ActiveSection = section;
    eventuallyRender();
}


SectionsWidget.prototype.PlaceDeleteButton = function(section) {
    if (section) {
        p = section.ViewUpperRight;
        this.DeleteButton
            .show()
            .css({'left': (p[0]-10)+'px',
                  'top':  (p[1]-10)+'px'});
    }
}

SectionsWidget.prototype.ComputeSections = function() {
    var data = GetImageData(this.Viewer.MainView);
    // slow: SmoothDataAlphaRGB(data, 2);
    var histogram = ComputeIntensityHistogram(data, true);
    var threshold = PickThreshold(histogram);
    var contours = GetHagFishContours(data, threshold, 0.0001, 0.5);
    SortContours(contours, "-y", "+x");

    for (var i = 0; i < contours.length; ++i) {
        this.Sections.push(contours[i].MakeStackSectionWidget());
    }

    this.CreationCamera = this.Viewer.GetCamera().Serialize();
}

// world is a boolean indicating the bounds should be drawn in slide coordinates. 
SectionsWidget.prototype.DrawBounds = function(view, bds, world, color) {
    var pt0 = [bds[0],bds[2]];
    var pt1 = [bds[1],bds[2]];
    var pt2 = [bds[1],bds[3]];
    var pt3 = [bds[0],bds[3]];

    if (world) {
        pt0 = view.Camera.ConvertPointWorldToViewer(pt0[0],pt0[1]);
        pt1 = view.Camera.ConvertPointWorldToViewer(pt1[0],pt1[1]);
        pt2 = view.Camera.ConvertPointWorldToViewer(pt2[0],pt2[1]);
        pt3 = view.Camera.ConvertPointWorldToViewer(pt3[0],pt3[1]);
    }
    var ctx = view.Context2d;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(pt0[0], pt0[1]);
    ctx.lineTo(pt1[0], pt1[1]);
    ctx.lineTo(pt2[0], pt2[1]);
    ctx.lineTo(pt3[0], pt3[1]);
    ctx.lineTo(pt0[0], pt0[1]);
    ctx.stroke();
    ctx.restore();
}

SectionsWidget.prototype.Draw = function(view) {
    if ( ! this.Active) {
        return;
    }
    for (var i = 0; i < this.Sections.length; ++i) {
        var section = this.Sections[i];
        section.Draw(view);
        // Draw the section index.
        var pt = section.ViewUpperRight;
        var ctx = view.Context2d;
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.font="20px Georgia";
        ctx.fillStyle='#00F';
        ctx.fillText((i+1).toString(),pt[0]-10,pt[1]+25);
        ctx.restore();
    }
    if (this.ActiveSection) {
        this.PlaceDeleteButton(this.ActiveSection);
    }
    if (this.ActiveSection) {
        var bds = this.ActiveSection.GetBounds();
        this.DrawBounds(view,bds,true,'#FF0');
    }
    if (this.DragBounds) {
        this.DrawBounds(view,this.DragBounds,true, '#F00');
    }
}


SectionsWidget.prototype.Serialize = function() {
    var obj = new Object();
    obj.type = "sections";
    obj.sections = [];
    for (var i = 0; i < this.Sections.length; ++i) {
        var section = this.Sections[i].Serialize();
        obj.sections.push(section);
    }
    // Already serialized
    obj.creation_camera = this.CreationCamera;

    return obj;
}

// Load a widget from a json object (origin MongoDB).
SectionsWidget.prototype.Load = function(obj) {
    for(var n=0; n < obj.sections.length; n++){
        var section = new StackSectionWidget();
        section.Load(obj.sections[n]);
        this.Sections.push(section);
    }

    this.CreationCamera = obj.creation_camera;
}

SectionsWidget.prototype.HandleMouseWheel = function(event) {
     return true;
}

SectionsWidget.prototype.HandleKeyPress = function(event, shift) {
    if (event.keyCode == 46) {
        this.DeleteActiveSection();
    }
}

SectionsWidget.prototype.HandleMouseDown = function(event) {
    this.StartX = event.offsetX;
    this.StartY = event.offsetY;
    if (this.ActiveSection) {
        if (event.which == 3) {
            this.Menu
                .show()
                .css({'left': event.offsetX+'px',
                      'top' : event.offsetY+'px'});
        }
    }
}

SectionsWidget.prototype.HandleMouseUp = function(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    if (event.which == 1) {
        if (Math.abs(x-this.StartX) +
            Math.abs(y-this.StartY) < 5) {
            //alert("click");
        } else if (this.DragBounds) {
            this.ProcessBounds(this.DragBounds);
        }
        this.DragBounds = null;
        eventuallyRender();
    }
    this.Menu.hide();
}

SectionsWidget.prototype.ProcessBounds = function(bds) {
    if (bds[0] > bds[1]) {
        var tmp = bds[0];
        bds[0] = bds[1];
        bds[1] = tmp;
    }
    if (bds[2] > bds[3]) {
        var tmp = bds[2];
        bds[2] = bds[3];
        bds[3] = tmp;
    }

    var full = [];
    var partial = [];
    for (var i = 0; i < this.Sections.length; ++i) {
        var section = this.Sections[i];
        var mode = section.ContainedInBounds(bds);
        if (mode == 2) { full.push(section); }
        if (mode == 1) { partial.push(section); }
    }
    if (full.length > 1) {
        for (var i = 1; i < full.length; ++i) {
            full[0].Union(full[i]);
            this.RemoveSection(full[i]);
        }
    }
}

SectionsWidget.prototype.HandleDoubleClick = function(event) {
}

SectionsWidget.prototype.HandleMouseMove = function(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    if (event.which == 1) {
        // Drag out a bounding box.
        // Keep the bounding box in slide coordinates for now.
        pt0 = this.Viewer.ConvertPointViewerToWorld(this.StartX, this.StartY);
        pt1 = this.Viewer.ConvertPointViewerToWorld(x, y);
        this.DragBounds = [pt0[0],pt1[0], pt0[1],pt1[1]];
        eventuallyRender();
    }

    if (event.which == 0) {
        var pt = this.Viewer.ConvertPointViewerToWorld(x,y);
        // Find the smallest section with pt in the bbox.
        var bestSection = null;
        var bestArea = -1;
        for (var i = 0; i < this.Sections.length; ++i) {
            var bds = this.Sections[i].GetBounds();
            if (pt[0]>bds[0] && pt[0]<bds[1] && pt[1]>bds[2] && pt[1]<bds[3]) {
                var area = (bds[1]-bds[0])*(bds[3]-bds[2]);
                if (bestSection == null || area < bestArea) {
                    bestSection = this.Sections[i];
                    bestArea = area;
                }
            }
        }
        this.SetActiveSection(bestSection);
    }

    if (event.which == 1) {
        return;
    }
}

SectionsWidget.prototype.CheckActive = function(event) {
    return this.Active;
}

SectionsWidget.prototype.GetActive = function() {
    return this.Active;
}

// Setting to active always puts state into "active".
// It can move to other states and stay active.
SectionsWidget.prototype.SetActive = function(flag) {
    if (flag) {
        this.Viewer.ActivateWidget(this);
        this.Active = true;
    } else {
        this.Viewer.DeactivateWidget(this);
        this.Active = false;
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
    }
    eventuallyRender();
}

SectionsWidget.prototype.Deactivate = function() {
    this.SetActive(false);
}



SectionsWidget.prototype.RemoveFromViewer = function() {
    if (this.Viewer == null) {
        return;
    }
    var idx = this.Viewer.WidgetList.indexOf(this);
    if(idx!=-1) {
        this.Viewer.WidgetList.splice(idx, 1);
    }
}

