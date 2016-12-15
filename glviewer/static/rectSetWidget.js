// individual rectangles do not scale.  This will handle thousands as one annotation.
// No rotation for now. No direct interaction for now.
// No properties dialog for now.
// Only the world / slide conrdinate system supported.
// Does nto supprot fixed size 

// How are we going to store them in girder annotations?

(function () {
    // Depends on the CIRCLE widget
    "use strict";

    // use shape api, bu this is simpler so do not subclass.
    function RectSet() {
        // a single array [x,y,x,y,x,y...]
        this.Centers= [];
        this.Widths = [];
        this.Heights = [];
        this.Labels = [];
        this.Confidences = [];
        // Hack to hide rects below a specific confidence.
        this.Threshold = 0.0;

        // For now, one can be active.  Highlight one
        this.ActiveIndex = -1;
    }

    RectSet.prototype.GetLength = function() {
        return this.Widths.length;
    }

    RectSet.prototype.GetCenter = function(idx) {
        idx = idx * 2;
        return [this.Centers[idx], this.Centers[idx+1]];
    }

    RectSet.prototype.SetCenter = function(idx,pt) {
        idx = idx * 2;
        this.Centers[idx] = pt[0];
        this.Centers[idx+1] = pt[1];
    }

    // Set the size (width,height) of all the rectangles.
    RectSet.prototype.SetShape = function(shape) {
        for (var i =0; i < this.Widths.length; ++i){
            this.Widths[i] = shape[0];
            this.Heights[i] = shape[1];
        }
    }

    // Helper for ground truth.
    RectSet.prototype.CopyRectangle = function(source, inIdx, outIdx) {
        if (outIdx === undefined) {
            outIdx = this.Labels.length;
        }
        var inTmp = inIdx*2;
        var outTmp = outIdx*2;
        this.Centers[outTmp] = source.Centers[inTmp];
        this.Centers[outTmp+1] = source.Centers[inTmp+1];
        this.Widths[outIdx] = source.Widths[inIdx];
        this.Heights[outIdx] = source.Heights[inIdx];
        this.Labels[outIdx] = source.Labels[inIdx];
        this.Confidences[outIdx] = source.Confidences[inIdx];
    }

    RectSet.prototype.AddRectangle = function(center, width, height) {
        var outIdx = this.Labels.length;
        this.Centers[outIdx*2] = center[0];
        this.Centers[outIdx*2+1] = center[1];
        this.Widths[outIdx] = width;
        this.Heights[outIdx] = height;
        this.Labels[outIdx] = "";
        this.Confidences[outIdx] = 1.0;
    }

    RectSet.prototype.DeleteRectangle = function(index) {
        if (index < 0 || index >= this.Widths.length) {
            return;
        }

        this.Centers.splice(2*index,2);
        this.Widths.splice(index,1);
        this.Heights.splice(index,1);
        this.Labels.splice(index,1);
        this.Confidences.splice(index,1);
        if (this.ActiveIndex == index) {
            this.ActiveIndex = -1;
        }
    }

    RectSet.prototype.SetOutlineColor = function (c) {
        this.Color = SAM.ConvertColorToHex(c);
    }

    // do not worry about webGl for now.  Only canvas drawing.
    // webgl would support more rects I assume.
    RectSet.prototype.Draw = function (view) {
        // 2d Canvas -----------------------------------------------
        view.Context2d.save();
        // Identity.
        view.Context2d.setTransform(1,0,0,1,0,0);

        // only supported case: this.PositionCoordinateSystem == Shape.SLIDE
        var theta = view.Camera.Roll;
        var matrix0 =  Math.cos(theta);
        var matrix1 =  Math.sin(theta);
        var matrix4 = -Math.sin(theta);
        var matrix5 =  Math.cos(theta);

        var scale = view.Viewport[3] / view.Camera.GetHeight();

        // First transform the origin-world to view.
        var m = view.Camera.Matrix;
        var x = m[12]/m[15];
        var y = m[13]/m[15];

        // convert origin-view to pixels (view coordinate system).
        x = view.Viewport[2]*(0.5*(1.0+x));
        y = view.Viewport[3]*(0.5*(1.0-y));
        view.Context2d.transform(matrix0,matrix1,matrix4,matrix5,x,y);

        view.Context2d.lineWidth = 1;
        var path = true;

        var cIdx = 0;
        var x = 0;
        var y = 0;
        for (var i = 0; i < this.Widths.length; ++i) {
            if (this.Confidences[i] >= this.Threshold) {
                var hw = this.Widths[i]/2;
                var hh = this.Heights[i]/2;
                x = this.Centers[cIdx++];
                y = this.Centers[cIdx++];

                view.Context2d.beginPath();
                if (this.LabelColors && this.LabelColors[this.Labels[i]]) {
                    view.Context2d.strokeStyle= this.LabelColors[this.Labels[i]];
                } else if (this.Color) {
                    view.Context2d.strokeStyle= this.Color;
                } else {
                    // TODO: Put the scale into the canvas transform
                    // Scalar to color map
                    var r = Math.floor(this.Confidences[i]*255);
                    view.Context2d.strokeStyle="#"+r.toString(16)+"ff00";
                    view.Context2d.beginPath();
                }
                view.Context2d.moveTo((x-hw)*scale, (y-hh)*scale);
                view.Context2d.lineTo((x+hw)*scale, (y-hh)*scale);
                view.Context2d.lineTo((x+hw)*scale, (y+hh)*scale);
                view.Context2d.lineTo((x-hw)*scale, (y+hh)*scale);
                view.Context2d.lineTo((x-hw)*scale, (y-hh)*scale);
                view.Context2d.stroke();

                if (i == this.ActiveIndex) {
                    // mark the rectangle
                    view.Context2d.beginPath();
                    view.Context2d.strokeStyle="#00ffff";
                    view.Context2d.moveTo((x-hw)*scale, y*scale);
                    view.Context2d.lineTo((x-hw/2)*scale, y*scale);
                    view.Context2d.moveTo((x+hw)*scale, y*scale);
                    view.Context2d.lineTo((x+hw/2)*scale, y*scale);
                    view.Context2d.moveTo(x*scale, (y-hh)*scale);
                    view.Context2d.lineTo(x*scale, (y-hh/2)*scale);
                    view.Context2d.moveTo(x*scale, (y+hh)*scale);
                    view.Context2d.lineTo(x*scale, (y+hh/2)*scale);
                    view.Context2d.stroke();
                }
            } else {
                cIdx += 2;
            }
        }
    }


    function RectSetWidget (layer, newFlag) {
        this.Visibility = true;
        // Keep track of annotation created by students without edit
        // permission.
        this.UserNoteFlag = ! SA.Edit;

        if (layer === null) {
            return;
        }

        this.Shape = new RectSet();
        if (layer) {
            this.Layer = layer;
            this.Layer.AddWidget(this);
        }
        this.Active = false;
    };

    RectSetWidget.prototype.GetLength = function() {
        return this.Shape.Widths.length;
    }

    // Sort by confidences
    // Note: Not used yet.
    RectSetWidget.prototype.Sort = function(lowToHigh) {
        // Create an array to sort that also keeps the indexes.
        var sortable = new Array(this.Confidences.length);
        var reverse =1;
        if (lowToHigh) {
            reverse = -1;
        }
        for (var i=0; i < sortable.length; ++i) {
            sortable[i] = {conf:reverse*this.Confidences[i], idx:i};
        }
        sortable.sort(function (a, b) {
            if (a.conf > b.conf) {
                return 1;
            }
            if (a.conf < b.conf) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        // Update all arrays.
        var newConfidences = new Array(this.Confidences.length);
        var newCenters = new Array(this.Centers.length);
        var newLabels = new Array(this.Centers.length);
        for (var i = 0; i < newConfidences.length; ++i) {
            var i2 = sortable[i].idx;
            newLabels[i] = this.Labels[i2];
            newConfidences[i] = this.Confidences[i2];
            i2 = i2 * 2;
            newCenters[2*i] = this.Centers[i2];
            newCenters[2*i+1] = this.Centers[i2+1];
        }
        this.Centers = newCenters;
        this.Confidences = newConfidences;
        this.Labels = newLabels;
    }



    // Threshold above is the only option for now.
    RectSetWidget.prototype.SetThreshold = function(threshold) {
        this.Shape.Threshold = threshold;
    }

    RectSetWidget.prototype.Draw = function(view) {
        if (this.Visibility) {
            this.Shape.Draw(view);
        }
    }

    RectSetWidget.prototype.Serialize = function() {
        if(this.Shape === undefined){ return null; }

        var obj = {type: "rect_set"};
        if (this.UserNoteFlag !== undefined){
            obj.user_note_flag = this.UserNoteFlag;
        }
        if (this.Shape.Color) {
            obj.color = SAM.ConvertColor(this.Shape.Color);
        }
        var num = this.Shape.Widths.length;
        obj.confidences = new Array(num);
        obj.widths = new Array(num);
        obj.heights = new Array(num);
        obj.labels = new Array(num);
        obj.centers = new Array(num*2);
        for (var i = 0; i < num; ++i) {
            obj.widths[i] = this.Shape.Widths[i];
            obj.heights[i] = this.Shape.Heights[i];
            obj.confidences[i] = this.Shape.Confidences[i];
            obj.centers[i] = this.Shape.Centers[i];
            obj.centers[i+num] = this.Shape.Centers[i+num];
            obj.labels[i] = this.Shape.Labels[i];
        }
        return obj;
    }

    // Load a widget from a json object (origin MongoDB).
    RectSetWidget.prototype.Load = function(obj) {
        this.UserNoteFlag = obj.user_note_flag;
        if (obj.color) {
            this.Shape.Color = [parseFloat(obj.color[0]),
                                parseFloat(obj.color[1]),
                                parseFloat(obj.color[2])];
        }
        var num = obj.widths.length;
        this.Shape.Confidences = new Array(num);
        this.Shape.Labels = new Array(num);
        this.Shape.Widths = new Array(num);
        this.Shape.Heights = new Array(num);
        this.Shape.Centers = new Array(num*2);
        for (var i = 0; i < num; ++i) {
            this.Shape.Widths[i] = parseFloat(obj.widths[i]);
            this.Shape.Heights[i] = parseFloat(obj.heights[i]);
            this.Shape.Confidences[i] = parseFloat(obj.confidences[i]);
            if (obj.labels) {
                this.Shape.Labels[i] = obj.labels[i];
            } else {
                this.Shape.Labels[i] = "";
            }
            this.Shape.Centers[i] = parseFloat(obj.centers[i]);
            this.Shape.Centers[i+num] = parseFloat(obj.centers[i+num]);
        }
    }

    RectSetWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    }

    /*
    RectSetWidget.prototype.HandleMouseDown = function(event) {
        var index = this.Shape.ActiveIndex;
        if (index < 0 || index >= this.Shape.Widths.length) {
            return true;
        }
        if (event.which != 1) {
            return true;
        }
        // find the world location of the event.
        var x = event.offsetX;
        var y = event.offsetY;
        var pt = this.Layer.GetCamera().ConvertPointViewerToWorld(x, y);
        this.Shape.Centers[2*index] = pt[0];
        this.Shape.Centers[2*index+1] = pt[1];
        // Click to center and move to the next.
        this.Shape.Labels[index] = "car";
        this.ChangeActive(1);
        return false;
    }*/

    RectSetWidget.prototype.HandleMouseUp = function(event) {
        return true;
    }

    RectSetWidget.prototype.HandleMouseMove = function(event) {
        return true;
    }

    RectSetWidget.prototype.HandleMouseWheel = function(event) {
        return true;
    }

    RectSetWidget.prototype.HandleTouchPan = function(event) {
        return true;
    }

    RectSetWidget.prototype.HandleTouchPinch = function(event) {
        return true;
    }

    RectSetWidget.prototype.HandleTouchEnd = function(event) {
        return true;
    }

    RectSetWidget.prototype.CheckActive = function(event) {
        return this.Active;
    }

    // Multiple active states. Active state is a bit confusing.
    RectSetWidget.prototype.GetActive = function() {
        return this.Active;
    }

    RectSetWidget.prototype.RemoveFromLayer = function() {
        if (this.Layer) {
            this.Layer.RemoveWidget(this);
        }
        this.Layer = null;
    }

    RectSetWidget.prototype.Deactivate = function() {
    }

    RectSetWidget.prototype.PlacePopup = function () {
    }

    RectSetWidget.prototype.ShowPropertiesDialog = function () {
    }

    SAM.RectSetWidget = RectSetWidget;
    SAM.RectSet = RectSet;

})();
