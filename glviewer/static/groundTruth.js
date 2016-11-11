//==============================================================================
// Collection widget
// Manage 3 annotation sets,  detection, posives (ground truth) and false positives.
// Sort the detections into the positive anntoations.
// These will be stored in three different rect sets.
// Create my own layer.

// We might make this a widget (and forward methods like draw) so we can
// handle mouse events.

(function () {
    "use strict";


    function GroundTruth (parent, detectionId, truePositiveId,
                          falsePositiveId, layer) {
        this.Layer = layer;
        this.Label = "GroundTruth";
        this.DetectionsId = detectionId;
        this.TruePositivesId = truePositiveId;
        this.FalsePositivesId = falsePositiveId;

        this.InitializeGui(parent,this.Label);
        this.InitializeAnnotation();
    }


    // Initialize the gui / dom
    GroundTruth.prototype.InitializeGui = function (parent, label) {
        var self = this;

        // The wrapper div that controls a single layer.
        var layer_control = $('<div>')
            .appendTo(parent)
            .css({ 'border': '1px solid #CCC', 'width': '100%',
                   'height': '65px' });

        var startButton =
            $('<div>').appendTo(layer_control)
            .text("Start")
            .prop('title', "Start sorting detections")
            .attr('contenteditable', "false")
            .css({'border':'1px solid #666666',
                  'border-radius': '5px',
                  'background': '#f5f8ff'})
            .click(function(){self.Start();});

        var stopButton =
            $('<div>').appendTo(layer_control)
            .text("Stop")
            .prop('title', "Stop sorting and save")
            .attr('contenteditable', "false")
            .css({'border':'1px solid #666666',
                  'border-radius': '5px',
                  'background': '#f5f8ff'})
            .click(function(){self.Stop();});

        var saveButton =
            $('<div>').appendTo(layer_control)
            .text("Save")
            .prop('title', "Stop sorting and save")
            .attr('contenteditable', "false")
            .css({'border':'1px solid #666666',
                  'border-radius': '5px',
                  'background': '#f5f8ff'})
            .click(function(){self.Save();});

        // Wrapper for the confidence slider.
        var conf_wrapper = $('<div>')
            .appendTo(layer_control)
            .css({ 'border': '1px solid #CCC', 'width': '60%',
                   'height': '100%', 'float': 'left' });

        this.Slider = $('<input type="range" min="50" max="100">')
            .appendTo(conf_wrapper)
            .on('input',
                function(){
                    self.SliderCallback();
                });
        //this.Slider[0].min = 75;

        var min_label = $('<div>')
            .appendTo(conf_wrapper)
            .html("50%")
            .css({ 'float': 'left' });

        var max_label = $('<div>')
            .appendTo(conf_wrapper)
            .html("100%")
            .css({ 'float': 'right' });

    }

    GroundTruth.prototype.InitializeAnnotation = function() {
        this.RequestAnnotationItem(this.DetectionsId, "Detections");
        this.RequestAnnotationItem(this.TruePositivesId, "TruePositives");
        this.RequestAnnotationItem(this.FalsePositivesId, "FalsePositives");
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

    GroundTruth.prototype.RequestAnnotationItem = function(annotId, key) {
        //var annotId = "572be29d3f24e53573aa8e91";
        var self = this;
        if (window.girder) {
            girder.restRequest({
                path: 'annotation/' + annotId,
                method: 'GET',
                contentType: 'application/json',
            }).done(function(data) {
                self.LoadAnnotation(data, key);
            });
        } else {
            alert("No girder");
        }
    }

    // TODO: Share this code (to parse girder data) with girderWidget.
    GroundTruth.prototype.LoadAnnotation = function(data, key) {
        // Used for saving the annotation back to girder.
        this[key+"Annotation"] = data.annotation;

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
                if (element.label) {
                    set_obj.labels.push(element.label.value);
                } else {
                    set_obj.labels.push("");
                }
            }
        }

        this[key+"Widget"] = this.Layer.LoadWidget(set_obj);
        if (key == "FalsePositives") {
            this.FalsePositivesWidget.Shape.SetOutlineColor("rgba(255,0,0,0.3)");
        }
        if (key == "TruePositives") {
            this.TruePositivesWidget.Shape.SetOutlineColor("rgba(0,255,0,0.3)");
        }
        if (key == "Detections") {
            this.DetectionsWidget.Shape.SetOutlineColor("#ffff00");
        }
        this.Layer.EventuallyDraw();
    }

    GroundTruth.prototype.CheckCallback = function () {
        var checked = this.CheckBox.prop('checked');
        for (var i = 0; i < this.Layers.length; ++i) {
            this.Layers[i].SetVisibility(checked);
            this.Layers[i].EventuallyDraw();
        }
    }

    GroundTruth.prototype.SliderCallback = function () {
        for (var i = 0; i < this.Layers.length; ++i) {
            this.UpdateLayer(this.Layers[i]);
        }
    }

    GroundTruth.prototype.Start = function () {
        this.DetectionsWidget.Activate();
        // Set the deactivate callback.
        var self = this;
        this.DetectionsWidget.DeactivateCallback = function () {
            self.SplitDetections();
        }
    }

    // Move labeled rects to false or true positives.
    GroundTruth.prototype.SplitDetections = function () {
        var detections = this.DetectionsWidget.Shape;
        var positives = this.TruePositivesWidget.Shape;
        var negatives = this.FalsePositivesWidget.Shape;
        var outIdx = 0;
        for (var inIdx = 0; inIdx < detections.Labels.length; ++inIdx) {
            if (detections.Labels[inIdx] == "") {
                if (inIdx != outIdx) {
                    detections.CopyRectangle(detections, inIdx, outIdx);
                }
                ++outIdx;
            } else if (detections.Labels[inIdx] == "car") {
                positives.CopyRectangle(detections, inIdx);
            } else if (detections.Labels[inIdx] == "false_positive") {
                negatives.CopyRectangle(detections, inIdx);
            }
        }
        // Shrink the detections arrays
        var length = detections.Labels.length;
        detections.Centers.splice(2*outIdx, 2*(length-outIdx));
        detections.Widths.splice(outIdx, length-outIdx);
        detections.Heights.splice(outIdx, length-outIdx);
        detections.Labels.splice(outIdx, length-outIdx);
        detections.Confidences.splice(outIdx, length-outIdx);
        // TODO: SAve annotations to girder/
    }

    GroundTruth.prototype.Stop = function () {
        this.DetectionsWidget.Deactivate();
    }

    GroundTruth.prototype.Save = function () {
        this.DetectionsWidget.Deactivate();
        if (window.girder) {
            // Save in the database
            this.DetectionsAnnotation.elements = this.RectSetToGirderElements(this.DetectionsWidget);
            girder.restRequest({
                path:  "annotation/"+this.DetectionsId,
                method: 'PUT',
                data: JSON.stringify(this.DetectionsAnnotation),
                contentType:'application/json'
            });
            this.FalsePositivesAnnotation.elements = this.RectSetToGirderElements(this.FalsePositivesWidget);
            girder.restRequest({
                path:  "annotation/"+this.FalsePositivesId,
                method: 'PUT',
                data: JSON.stringify(this.FalsePositivesAnnotation),
                contentType:'application/json'
            });
            this.TruePositivesAnnotation.elements = this.RectSetToGirderElements(this.TruePositivesWidget);
            girder.restRequest({
                path:  "annotation/"+this.TruePositivesId,
                method: 'PUT',
                data: JSON.stringify(this.TruePositivesAnnotation),
                contentType:'application/json'
            });
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


    SAM.GroundTruth = GroundTruth;

})();




