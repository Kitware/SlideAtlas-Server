//==============================================================================
// Collection widget, No serialize or load.
// Manage 3 annotation sets,  detection, posives (ground truth) and false positives.
// Sort the detections into the positive anntoations.
// These will be stored in three different rect sets.
// Create my own layer.

// We might make this a widget (and forward methods like draw) so we can
// handle mouse events.

(function () {
    "use strict";

    // action states
    var KEY_UP = 0;
    var KEY_DOWN = 1;
    var KEY_USED_ADVANCE = 2
    var KEY_USED_NO_ADVANCE = 3

    function GroundTruth (parent, detectionsId, classes, layer) {
        this.Layer = layer;
        this.Label = "GroundTruth";
        this.DetectionsClass = {label:"",
                                annotation_id:detectionsId,
                                color:'#FFFF00'};

        // Combined key click action.
        this.ActionState = KEY_UP;

        this.Classes = [];
        for (var label in classes) {
            var class_obj = {label:label,
                         annotation_id:classes[label]};
            this.Classes.push(class_obj)
        }
        // assign colors to the labels
        // detections will be yellow
        var num_classes = this.Classes.length;
        if (num_classes > 0) { // First is red
            this.Classes[0].color = SAM.ConvertColorToHex([1,0,0]);
        }
        if (num_classes > 1) { // last is green
            this.Classes[num_classes-1].color = SAM.ConvertColorToHex([0,1,0]);
        }
        // the rest will range from purple to cyan
        for (var i = 1; i < num_classes-1; ++i) {
            var k = (i-1) / (num_classes-3);
            this.Classes[i].color = SAM.ConvertColorToHex([k,1-k,1]);
        }

        this.InitializeGui(parent,this.Label);
        this.InitializeAnnotation();

        this.Layer.AddWidget(this);
        // Mode: stepping through ( and processing events).
        this.CurrentIndex = -1;
        // Hover selection
        this.SelectedRect = {widget:undefined, idx:-1};

        // active class is highlighted in the gui.
        // It is the class used for clicks
        this.ActiveClassIndex = 0;
        this.SetActiveClassIndex(num_classes-1);
    }

    GroundTruth.prototype.SetActiveClassIndex = function(idx) {
        if (idx < 0 || idx >= this.Classes.length) {
            return;
        }
        this.Classes[this.ActiveClassIndex].gui
            .css({'background-color':'#FFF'});
        this.ActiveClassIndex = idx;
        this.Classes[idx].gui
            .css({'background-color':'#DEF'});
        this.SetCursorColor(this.Layer.GetCanvasDiv(), this.Classes[idx].color);
    }

    GroundTruth.prototype.GetActive = function() {
        return this.CurrentIndex > -1;
    }

    GroundTruth.prototype.Draw = function(view) {
        // Put this in the classes array?
        if (this.DetectionsClass.widget) {
            var shape = this.DetectionsClass.widget.Shape;
            if ( ! shape.LabelColors) {
                shape.LabelColors = {"":this.DetectionsClass.color};
                // No race condition. Colors available in contruction.
                for (var i = 0; i < this.Classes.length; ++i) {
                    shape.LabelColors[this.Classes[i].label] = this.Classes[i].color;
                }
            }

            this.DetectionsClass.widget.Draw(view);
        }
        for (var i = 0; i < this.Classes.length; ++i) {
            if (this.Classes[i].widget) {
                this.Classes[i].widget.Draw(view);
            }
        }
    }

    // Highlight on hover.
    GroundTruth.prototype.HandleMouseMove = function(event) {
        if (event.which != 0) { return; }
        var cam = this.Layer.GetCamera();
        var pt = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        var best;
        if (this.DetectionsClass.widget) {
            best = this.DetectionsClass.widget.Hash.Get(pt,3);
            best.widget = this.DetectionsClass.widget;
        }
        for (var i = 0; i < this.Classes.length; ++i) {
            if (this.Classes[i].widget) {
                var tmp = this.Classes[i].widget.Hash.Get(pt,3);
                tmp.widget = this.Classes[i].widget;
                if ( ! best || tmp.dist < best.dist) {
                    best = tmp;
                }
            }
        }

        if (best) {
            this.SetSelectedRect(best.widget, best.idx);
        }

        return true;
    }

    // Stepping through the detection sequence.
    // -1 is none
    GroundTruth.prototype.SetCurrentRect = function(idx) {
        this.SetSelectedRect(this.DetectionsClass.widget,idx);
        this.CurrentIndex = idx;
        // animate
        this.UpdateActiveView();
    }

    // The highlighted rect (which can temporarily be dfferent that the
    // current rect.
    GroundTruth.prototype.SetSelectedRect = function(widget, idx) {
        if (this.SelectedRect && this.SelectedRect.idx == idx && this.SelectedRect.widget == widget) {
            return;
        }

        // Remove the highlight fromthe previous.
        if (this.SelectedRect.idx > -1) {
            this.SelectedRect.widget.Shape.ActiveIndex = -1;
        }

        if (idx == -1) {
            // Unset => go back to the default current rect.
            widget = this.DetectionsClass.widget;
            idx = this.CurrentIndex;
        }

        if (idx > -1) {
            // Add the new highlight.
            widget.Shape.ActiveIndex = idx;
            this.SelectedRect = {widget:widget, idx:idx};
        }
        this.Layer.EventuallyDraw();
    }

    GroundTruth.prototype.HandleKeyDown = function(event) {
        if (this.GetActive()) {
            if (this.ActionState != KEY_UP) {
                return false;
            }
            if (event.keyCode > 48 && event.keyCode < 48+this.Classes.length) {
                this.ActionState = KEY_DOWN;
            }
            this.SetActiveClassIndex(event.keyCode-49);
            // Keep the viewer from panning on the arrows.
            return false;
        }
        return true;
    }
    GroundTruth.prototype.HandleKeyUp = function(event) {
        var direction = 0;
        var self = this;

        // Key was used and no advancement is necessary.
        if (this.ActionState == KEY_USED_NO_ADVANCE) {
            this.ActionState = KEY_UP;
            return false;
        }
        // The mouse has been used by a click and we need to advance. 
        if (this.ActionState == KEY_USED_ADVANCE) {
            // Just advance to the next
            setTimeout(function () { self.ChangeCurrent(1)}, 300);
            this.ActionState = KEY_UP;
            return false;
        }
        this.ActionState = KEY_UP;

        if (event.keyCode == 27) { // escape
            this.Layer.DeactivateWidget(this);
            return false;
        }

        // Change the class only works for DetectionsClass.widget now.
        // TODO: Consider extending this to positives too.
        // (It would confuse user less)
        if ( this.DetectionsClass.widget == this.SelectedRect.widget &&
             this.SelectedRect.idx == this.CurrentIndex) {
            var rectSet = this.DetectionsClass.widget.Shape;
            var index = this.CurrentIndex;
            if (event.keyCode == 48) { // 0
                // remove the class label
                if (index >= 0 &&
                    index < rectSet.Widths.length) {
                    rectSet.Labels[index] = "";
                    this.Layer.EventuallyDraw();
                    // Automatically move to the next, to save clicks.
                    setTimeout(function () { self.ChangeCurrent(1)}, 300);
                }
                return false;
            }
            if (event.keyCode >= 49 && event.keyCode < 57) { // 1-9
                var idx = event.keyCode - 49;
                if (idx < this.Classes.length) {
                    var label = this.Classes[idx].label;
                    if (event.shiftKey) {
                        // Accept them all
                        while ( index < rectSet.Widths.length) {
                            rectSet.Labels[index] = label;
                            ++index;
                        }
                        this.Layer.EventuallyDraw();
                        this.Stop();
                        return false;
                    }
                    // set a class label of a single detection
                    if (index >= 0 &&
                        index < rectSet.Widths.length) {
                        rectSet.Labels[index] = label;
                        this.Layer.EventuallyDraw();
                        // Automatically move to the next, to save clicks.
                        setTimeout(function () { self.ChangeCurrent(1)}, 300);
                    }
                    return false;
                }
            }
        }

        // Delete applies to the selected / highlighted rect.
        var index = this.SelectedRect.idx;
        var widget = this.SelectedRect.widget;
        if (index > -1 && event.keyCode == 46) { // Delete key
            var rectSet = widget.Shape;
            // remove the rectangle
            if (index >= 0 && index < rectSet.Widths.length) {
                rectSet.DeleteRectangle(index);
                // Rebuild the hash.
                // I could do this incrementally but I am lazy.
                var bds = this.Layer.GetViewer().GetOverViewBounds();
                widget.Hash.Build(widget.Shape.Centers,bds);
                if (widget == this.DetectionsClass.widget) {
                    // If we deleted a rect before the current, ...
                    if (index < this.CurrentIndex) {
                        this.SetCurrentRect(index-1);
                    } else if (index == this.CurrentIndex) {
                        // Animate to the next (index does not actually
                        // change). Hack to find next under threshold
                        this.CurrentIndex -= 1;
                        this.SelectedRect.idx -=1; // hack to get the next
                        // to highlight
                        setTimeout(function () { self.ChangeCurrent(1);}, 300);
                    }
                }
            }
            this.Highlight = this.SelectedRect;
            this.Layer.EventuallyDraw();
            return;
        }

        // Forward and backward.
        var rectSet = this.DetectionsClass.widget.Shape;
        var inidex = this.CurrentIndex;
        if (event.keyCode == 40) {
            // down cursor key
            // Move to the previous without a label
            while (index < rectSet.Widths.length) {
                if (rectSet.Labels[index] == "") {
                    this.SetCurrentRect(index);
                    return false;
                }
                index += 1;
            }
            // Got to end without finding one.
            this.Layer.DeactivateWidget(this);
            return false;
        } else if (event.keyCode == 37) {
            // Left cursor key
            this.ChangeCurrent(-1);
            return false;
        } else if (event.keyCode == 39) {
            // Right cursor key
            this.ChangeCurrent(1);
            return false;
        }

        return true;
    }

    // Animate to the new current rect.
    GroundTruth.prototype.UpdateActiveView = function () {
        if ( this.DetectionsClass.widget === undefined) {
            return true;
        }

        var rectSet = this.DetectionsClass.widget.Shape;

        // Change the index / confidence label.
        var idx = this.CurrentIndex;
        if (idx < 0) {
            this.ActiveLabel.text("");
            return;
        } else {
            this.ActiveLabel.text(idx.toString() + " of " +
                                  rectSet.Labels.length.toString() + ", " +
                                  rectSet.Confidences[idx].toPrecision(2) +
                                  ", " + rectSet.Labels[idx]);
        }

        var viewer = this.Layer.GetViewer();
        var cam = viewer.GetCamera();
        //viewer.ZoomTarget = this.Layer.GetCamera().GetHeight();
        viewer.RollTarget = this.Layer.GetCamera().Roll;
        viewer.TranslateTarget[0] = rectSet.Centers[2*this.CurrentIndex];
        viewer.TranslateTarget[1] = rectSet.Centers[2*this.CurrentIndex+1];
        viewer.AnimateLast = new Date().getTime();
        viewer.AnimateDuration = 200.0;
        viewer.EventuallyRender(true);
    }

    // Forward = 1, backward = -1
    GroundTruth.prototype.ChangeCurrent = function(direction) {
        if ( this.DetectionsClass.widget === undefined) {
            return true;
        }
        var rectSet = this.DetectionsClass.widget.Shape;
        var index = this.CurrentIndex;

        // loop to skip rects below the threshold
        while (true) {
            index += direction;
            if (index < 0 || index >= rectSet.Widths.length) {
                this.Stop();
                return;
            }
            if (rectSet.Confidences[index] >= rectSet.Threshold) {
                this.SetCurrentRect(index);
                return;
            }
        }
    }

    GroundTruth.prototype.HandleClick = function(event) {
        if (event.which != 1) {
            return true;
        }

        var class_idx = this.ActiveClassIndex;
        this.PendingKeyCode = 0;

        var cam = this.Layer.GetCamera();
        var pt = cam.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        // If the click is inside the current detection, reposition it
        // and move to the next detection.
        // TODO: Consider moving any annotation that is active.
        var rectSet = this.DetectionsClass.widget.Shape;
        var index = this.CurrentIndex;
        if (index >= 0 && index < rectSet.Widths.length) {
            var x = pt[0] - rectSet.Centers[index*2];
            var y = pt[1] - rectSet.Centers[index*2+1];
            if (Math.abs(x) < rectSet.Widths[index]/2 &&
                Math.abs(y) < rectSet.Heights[index]/2) {
                rectSet.Labels[index] = this.Classes[class_idx].label;
                rectSet.Centers[index*2] = pt[0];
                rectSet.Centers[index*2+1] = pt[1];
                this.Layer.EventuallyDraw();
                var self = this;
                if (this.ActionState == KEY_DOWN) {
                    this.ActionState = KEY_USED_ADVANCE;
                    return false;
                }
                setTimeout(function () { self.ChangeCurrent(1)}, 300);
                return;
            }
        }

        // Click defaults to the last class.
        if (this.Classes.length > 1) {
            var widget = this.Classes[class_idx].widget;
            var size = parseInt(this.SizeInput.val());
            if (isNaN(size)) {size = 32;}
            widget.Shape.AddRectangle(pt, size, size);
            // incrementally update the hash here.
            widget.Hash.Add(pt,widget.GetLength()-1);
            this.Layer.EventuallyDraw();
            // Keep the key up (f a key is pressed) from advancing
            if (this.ActionState == KEY_DOWN) {
                this.ActionState = KEY_USED_NO_ADVANCE;
                return false;
            }
        }

        return false;
    }

    GroundTruth.prototype.CheckActive = function(event) {
        return this.GetActive();
    }

    // Initialize the gui / dom
    GroundTruth.prototype.InitializeGui = function (parent, label) {
        var self = this;

        // The wrapper div that controls a single layer.
        var layer_control = $('<div>')
            .appendTo(parent)
            .css({ 'border': '1px solid #CCC', 'width': '100%'});

        this.ActiveLabel =
            $('<div>').appendTo(layer_control)
            .prop('title', "Start sorting detections")
            .attr('contenteditable', "false")
            .text("");

        var sizeContainer =
            $('<p>').appendTo(layer_control);
        this.SizeLabel =
            $('<label>').appendTo(sizeContainer)
            .text("Size:  ");
        this.SizeInput =
            $('<input type="number">').appendTo(sizeContainer)
            .prop('title', "Change the size of the glyphs")
            .on('change', function(){self.ChangeSize();});

        var buttonContainer =
            $('<p>').appendTo(layer_control);
        this.StartStopButton =
            $('<button>').appendTo(buttonContainer)
            .text("Start")
            .css({'background-color':'#5F5'})
            .prop('title', "Start sorting detections")
            //.button()
            .css({'width':'5em'})
            .on('click', function(){self.Start();});
        var saveButton =
            $('<button>').appendTo(buttonContainer)
            .text("Save")
            .prop('title', "Save annotations to server")
            .click(function(){self.Save();});

        // Wrapper for the confidence slider.
        var conf_wrapper = $('<div>')
            .appendTo(layer_control)
            .css({ 'border': '1px solid #CCC', 'width': '100%', 'height':'50px'});

        this.Slider = $('<input type="range" min="0" max="100">')
            .appendTo(conf_wrapper)
            .on('input',
                function(){
                    self.SliderCallback();
                });
        //this.Slider[0].min = 75;

        var min_label = $('<div>')
            .appendTo(conf_wrapper)
            .html("0%")
            .css({ 'float': 'left' });

        var max_label = $('<div>')
            .appendTo(conf_wrapper)
            .html("100%")
            .css({ 'float': 'right' });

        var classContainer =
            $('<p>').appendTo(layer_control);
        for (var i = 0; i < this.Classes.length; ++i) {
            this.MakeClassButton(classContainer, i);
        }
    }

    GroundTruth.prototype.MakeClassButton = function(classContainer, index) {
        var self = this;
        var classObj = this.Classes[index];
        classObj.gui = $('<div>')
            .appendTo(classContainer)
            .text((index+1).toString() + ": " + classObj.label)
            .css({'color':classObj.color})
            .click(function() {self.SetActiveClassIndex(index);});
    }






    GroundTruth.prototype.InitializeAnnotation = function() {
        this.RequestAnnotationItem(this.DetectionsClass);
        for (var i = 0; i < this.Classes.length; ++i) {
            this.RequestAnnotationItem(this.Classes[i]);
        }
    }

    GroundTruth.prototype.UpdateHash = function() {
        var bds = this.Layer.GetViewer().GetOverViewBounds();
        this.DetectionsClass.widget.Hash.Build(this.DetectionsClass.widget.Shape.Centers,bds);
        for (var i = 0; i < this.Classes.length; ++i) {
            var widget = this.Classes[i].widget;
            widget.Hash.Build(widget.Shape.Centers,bds);
        }
    }

    /*
    GroundTruth.prototype.LoadGirderImageItem = function(itemId) {
        //var itemId = "564e42fe3f24e538e9a20eb9";
        // I think data is the wron place to pass these parameters.
        var data= {"limit": 50,
                   "offset": 0,
                   "sort":"lowerName",
                   "sortdir":0};

        var self = this;
        // This gives an array of {_id:"....",annotation:{name:"...."},itemId:"...."}
        girder.restRequest({
            path:   "annotation?itemId="+itemId,
            method: "GET",
            data:   JSON.stringify(data)
        }).done(function(data) {
            for (var i = 0; i < data.length; ++i) {
                self.LoadAnnotationItem(data[i]._id);
            }
        });
    }
    */

    GroundTruth.prototype.RequestAnnotationItem = function(class_obj) {
        //var annotId = "572be29d3f24e53573aa8e91";
        var self = this;
        if (window.girder) {
            girder.restRequest({
                path: 'annotation/' + class_obj.annotation_id,
                method: 'GET',
                contentType: 'application/json',
            }).done(function(data) {
                self.LoadAnnotation(data, class_obj);
            });
        } else {
            alert("No girder");
        }
    }

    // TODO: Share this code (to parse girder data) with girderWidget.
    GroundTruth.prototype.LoadAnnotation = function(data, class_obj) {
        // Used for saving the annotation back to girder.
        class_obj.annotation = data.annotation;

        // Put all the rectangles into one set.
        var set_obj = {};
        set_obj.type = "rect_set";
        set_obj.centers = [];
        set_obj.widths = [];
        set_obj.heights = [];
        set_obj.confidences = [];
        set_obj.labels = [];

        var annot = data.annotation;
        for (var i = 0; i < annot.elements.length; ++i) {
            var element = annot.elements[i];
            var obj = {};

            if (element.type == "rectangle") {
                set_obj.widths.push(element.width);
                set_obj.heights.push(element.height);
                set_obj.centers.push(element.center[0]);
                set_obj.centers.push(element.center[1]);
                if (element.scalar === undefined) {
                    element.scalar = 1.0;
                }
                set_obj.confidences.push(element.scalar);
                // ignore the database label because we use our own
                set_obj.labels.push(class_obj.label);
            }
        }

        var widget = new SAM.RectSetWidget();
        widget.Load(set_obj);
        widget.Hash = new SpatialHash();
        var bds = this.Layer.GetViewer().GetOverViewBounds();
        widget.Hash.Build(widget.Shape.Centers,bds);

        class_obj.widget = widget;
        widget.Shape.SetOutlineColor(class_obj.color);
        this.Layer.EventuallyDraw();
    }

    GroundTruth.prototype.CheckCallback = function () {
    //    var checked = this.CheckBox.prop('checked');
    //    for (var i = 0; i < this.Layers.length; ++i) {
    //        this.Layers[i].SetVisibility(checked);
    //        this.Layers[i].EventuallyDraw();
    //    }
    }

    GroundTruth.prototype.SliderCallback = function () {
    //    for (var i = 0; i < this.Layers.length; ++i) {
    //        this.UpdateLayer(this.Layers[i]);
    //    }
    }

    GroundTruth.prototype.Start = function () {
        var self = this;
        this.Layer.ActivateWidget(this);
        this.Layer.LayerDiv.focus();

        // zoom in
        var viewer = this.Layer.GetViewer();
        var cam = viewer.GetCamera();
        viewer.ZoomTarget = 500;

        // TODO: abstract the highlighting to clean it up.
        this.SetCurrentRect(0);
        this.StartStopButton
            .text("Stop")
            .css({'background-color':'#F55'})
            .prop('title', "Stop sorting detections")
            .on('click', function(){self.Stop();});
    }
    GroundTruth.prototype.Stop = function () {
        var self = this;
        this.Layer.DeactivateWidget(this);
        this.SetCurrentRect(-1);
        this.StartStopButton
            .text("Start")
            .css({'background-color':'#5F5'})
            .prop('title', "Start sorting detections")
            .on('click', function(){self.Start();});
    }

    GroundTruth.prototype.SetSize = function (size) {
        this.SizeInput.val(size.toString());
        // This might not be necessary. Change event might trigger it for us.
        this.ChangeSize();
    }

    GroundTruth.prototype.ChangeSize = function () {
        var size = parseInt(this.SizeInput.val());
        if (this.DetectionsClass.widget) {
            this.DetectionsClass.widget.Shape.SetShape([size,size]);
        }
        for (var i = 0; i < this.Classes.length; ++i) {
            var widget = this.Classes[i].widget;
            if (widget) {
                widget.Shape.SetShape([size,size]);
            }
        }

        this.Layer.EventuallyDraw();
    }

    // Move labeled rects in detections to classes.
    // Called before annotations are saved to 
    GroundTruth.prototype.SplitDetections = function () {
        var detections = this.DetectionsClass.widget.Shape;
        // Build an object to make indexing classes easier.
        var shapes = {}
        for (var i = 0; i < this.Classes.length; ++i) {
            shapes[this.Classes[i].label] = this.Classes[i].widget.Shape;
        }

        var outIdx = 0;
        for (var inIdx = 0; inIdx < detections.Labels.length; ++inIdx) {
            var label = detections.Labels[inIdx];
            if (label == "") {
                // fill in blank spots
                if (inIdx != outIdx) {
                    detections.CopyRectangle(detections, inIdx, outIdx);
                }
                ++outIdx;
            } else if (shapes[label] != undefined) {
                shapes[label].CopyRectangle(detections, inIdx);
            }
        }
        // Shrink the detections arrays
        var length = detections.Labels.length;
        detections.Centers.splice(2*outIdx, 2*(length-outIdx));
        detections.Widths.splice(outIdx, length-outIdx);
        detections.Heights.splice(outIdx, length-outIdx);
        detections.Labels.splice(outIdx, length-outIdx);
        detections.Confidences.splice(outIdx, length-outIdx);

        this.UpdateHash();
    }

    GroundTruth.prototype.Save = function () {
        this.DetectionsClass.widget.Deactivate();
        this.SplitDetections();
        if (window.girder) {
            // Save in the database
            var annotation = this.DetectionsClass.annotation;
            annotation.elements = this.RectSetToGirderElements(this.DetectionsClass.widget);
            SA.PushProgress();
            girder.restRequest({
                path:  "annotation/"+this.DetectionsClass.annotation_id,
                method: 'PUT',
                data: JSON.stringify(annotation),
                contentType:'application/json'
            }).done(function(){SA.PopProgress();});
            for (var i = 0; i < this.Classes.length; ++i) {
                var widget = this.Classes[i].widget;
                var annotation = this.Classes[i].annotation;
                annotation.elements = this.RectSetToGirderElements(widget);
                SA.PushProgress();
                // not sure about this id
                girder.restRequest({
                    path:  "annotation/"+this.Classes[i].annotation_id,
                    method: 'PUT',
                    data: JSON.stringify(annotation),
                    contentType:'application/json'
                }).done(function(){SA.PopProgress();});
            }
            this.Layer.EventuallyDraw();
        }
    }

    // Converts rectSetWidget into girder annotation elements.
    // returns an elements array.
    GroundTruth.prototype.RectSetToGirderElements = function(rectSetWidget) {
        var returnElements = [];

        var widget = rectSetWidget.Serialize();
        var num = widget.widths.length;
        for (var j = 0; j < num; ++j) {
            var element = {'type'     : 'rectangle',
                           'label'    : {'value':widget.labels[j]},
                           'center'   : [widget.centers[2*j], widget.centers[2*j+1], 0],
                           'height'   : widget.heights[j],
                           'width'    : widget.widths[j],
                           'rotation' : 0,
                           'scalar'   : widget.confidences[j]};
            returnElements.push(element);
        }
        return returnElements;
    }

    GroundTruth.prototype.SetActive = function(active) {
        if (active == this.Active) {
            return;
        }
        this.Active = active;
        if (active) {
            if (this.DetectionsClass.widget) {
                this.DetectionsClass.widget.Shape.ActiveIndex = 0;
                this.UpdateActiveView();
            }
        } else {
            this.Layer.GetCanvasDiv().css({'cursor':'default'});
            if (this.DetectionsClass.widget) {
                this.DetectionsClass.widget.Shape.ActiveIndex = -1;
            }
        }
        this.Layer.EventuallyDraw();
    }

    GroundTruth.prototype.SetCursorColor = function(element, color) {
        // create off-screen canvas
        var cursor = document.createElement('canvas');
        var ctx = cursor.getContext('2d');

        cursor.width = 16;
        cursor.height = 24;

        // draw an arrow

        //ctx.lineWidth = 1;
        ctx.moveTo(0, 18);
        ctx.lineTo(0, 0); // tip
        ctx.lineTo(12, 12);
        ctx.lineTo(7, 13);
        ctx.lineTo(11, 21);
        ctx.lineTo(8, 22);
        ctx.lineTo(4, 14);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // set image as cursor (modern browsers can take PNGs as cursor).
        element[0].style.cursor = 'url(' + cursor.toDataURL() + '), auto';
    }

    SAM.GroundTruth = GroundTruth;



    // 2d
    function SpatialHash() {
        // Must be initialized before use.
    }

    SpatialHash.prototype.Initialize = function(bounds, size) {
        this.Origin = [bounds[0], bounds[2]];
        this.BinSize = Math.sqrt((bounds[1]-bounds[0]) * (bounds[3]-bounds[2])/(size+1));
        this.XDim = Math.ceil((bounds[1]-bounds[0]) / this.BinSize);
        this.YDim = Math.ceil((bounds[3]-bounds[2]) / this.BinSize);
        this.Grid = new Array(this.YDim);
        for (var y = 0; y < this.YDim; ++y) {
            var row = new Array(this.XDim);
            for (var x= 0; x < this.XDim; ++x) {
                row[x] = [];
            }
            this.Grid[y] = row;
        }
    }

    SpatialHash.prototype.Add = function(pt, idx) {
        var row = Math.floor((pt[1]-this.Origin[1])/this.BinSize);
        row = Math.max(Math.min(row, this.YDim-1), 0);
        var col = Math.floor((pt[0]-this.Origin[0])/this.BinSize);
        col = Math.max(Math.min(col, this.XDim-1), 0);
        this.Grid[row][col].push({pt:pt, idx:idx});
    }

    SpatialHash.prototype.Build = function(centers, bounds) {
        this.Initialize(bounds, centers.length / 2);
        for (var idx = 0; idx < centers.length; idx += 2) {
            this.Add([centers[idx], centers[idx+1]], idx>>1);
        }
    }

    // Returns the index of the closest point withing radius.
    // Returns -1 if there are no points that close.
    // I assume radius will be smaller than binSize. 
    // If it is not, this will be inefficient.
    SpatialHash.prototype.Get = function(location, radius) {
        // Find binds touching this square.
        var bds = [location[0]-radius, location[0]+radius,
                   location[1]-radius, location[1]+radius];
        // Transform bounds to grid indexes  (keep in range).
        bds[0] = Math.max(Math.min(
            Math.floor((bds[0]-this.Origin[0])/this.BinSize), this.XDim-1), 0);
        bds[1] = Math.max(Math.min(
            Math.floor((bds[1]-this.Origin[0])/this.BinSize), this.XDim-1), 0);
        bds[2] = Math.max(Math.min(
            Math.floor((bds[2]-this.Origin[1])/this.BinSize), this.YDim-1), 0);
        bds[3] = Math.max(Math.min(
            Math.floor((bds[3]-this.Origin[1])/this.BinSize), this.YDim-1), 0);

        // Find the closest entry to location in these bins.
        var bestDist = radius;
        var best;
        for (var row = bds[2]; row <= bds[3]; ++row) {
            for (var col = bds[0]; col <= bds[1]; ++col) {
                var bin = this.Grid[row][col];
                for (var i = 0; i < bin.length; ++i) {
                    var item = bin[i];
                    var dist = Math.max(Math.abs(item.pt[0]-location[0]),
                                        Math.abs(item.pt[1]-location[1]));
                    if (dist <= bestDist) {
                        bestDist = dist;
                        best = item;
                    }
                }
            }
        }
        if (! best) { 
            return {idx:-1, dist:2*radius};
        }

        return {pt:best.pt, idx:best.idx, dist:bestDist};
    }


})();




