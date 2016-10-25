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
        this.Confidences = [];
        // Hack to hide rects below a specific confidence.
        this.Threshold = 0.0;
    }

    RectSet.prototype.SetOutlineColor = function (c) {
        this.Color = SAM.ConvertColor(c);
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

        if (this.Color) {
            view.Context2d.strokeStyle=SAM.ConvertColorToHex(this.Color);
            view.Context2d.beginPath();
        }
        view.Context2d.lineWidth = 1;
        //view.Context2d.beginPath();

        var cIdx = 0;
        var x = 0;
        var y = 0;
        for (var i = 0; i < this.Widths.length; ++i) {
            if (this.Confidences[i] >= this.Threshold) {
                var w = this.Widths[i];
                var h = this.Heights[i];
                x = this.Centers[cIdx++] - w/2;
                y = this.Centers[cIdx++] - h/2;
                if ( ! this.Color) {
                    // TODO: Put the scale into the canvas transform
                    // Scalar to color map
                    var r = Math.floor(this.Confidences[i]*255);
                    view.Context2d.strokeStyle="#"+r.toString(16)+"ff00";
                    view.Context2d.beginPath();
                }
                view.Context2d.moveTo(x*scale, y*scale);
                view.Context2d.lineTo((x+w)*scale, y*scale);
                view.Context2d.lineTo((x+w)*scale, (y+h)*scale);
                view.Context2d.lineTo(x*scale, (y+h)*scale);
                view.Context2d.lineTo(x*scale, y*scale);
                if ( ! this.Color) {
                    view.Context2d.stroke();
                }
            } else {
                cIdx += 2;
            }
        }
        if ( this.Color) {
            view.Context2d.stroke();
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

        this.Layer = layer;
        this.Shape = new RectSet();
        this.Layer.AddWidget(this);

        // Using active to step through rectangles with arrow keys.
        this.Active = false;
        this.ActiveIndex = 0;
    };

    // Sort by confidences
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
        for (var i = 0; i < newConfidences.length; ++i) {
            var i2 = sortable[i].idx;
            newConfidences[i] = this.Confidences[i2];
            i2 = i2 * 2;
            newCenters[2*i] = this.Centers[i2];
            newCenters[2*i+1] = this.Centers[i2+1];
        }
        this.Centers = newCenters;
        this.Confidences = newConfidences;
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
        if (this.color) {
            obj.color[0] = this.Shape.Color[0];
            obj.color[1] = this.Shape.Color[1];
            obj.color[2] = this.Shape.Color[2];
        }
        var num = this.Shape.Widths.length;
        obj.confidences = new Array(num);
        obj.widths = new Array(num);
        obj.heights = new Array(num);
        obj.centers = new Array(num*2);
        for (var i = 0; i < num; ++i) {
            obj.widths[i] = this.Shape.Widths[i];
            obj.heights[i] = this.Shape.Heights[i];
            obj.confidences[i] = this.Shape.Confidences[i];
            obj.centers[i] = this.Shape.Centers[i];
            obj.centers[i+num] = this.Shape.Centers[i+num];
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
        this.Shape.Widths = new Array(num);
        this.Shape.Heights = new Array(num);
        this.Shape.Centers = new Array(num*2);
        for (var i = 0; i < num; ++i) {
            this.Shape.Widths[i] = parseFloat(obj.widths[i]);
            this.Shape.Heights[i] = parseFloat(obj.heights[i]);
            this.Shape.Confidences[i] = parseFloat(obj.confidences[i]);
            this.Shape.Centers[i] = parseFloat(obj.centers[i]);
            this.Shape.Centers[i+num] = parseFloat(obj.centers[i+num]);
        }
    }

    RectSetWidget.prototype.HandleKeyDown = function(keyCode, shift) {
        if (! this.Visibility) {
            return true;
        }

        // escape key: change to inaective
        if (event.keyCode == 27 || event.keyCode == 32 || event.keyCode == 13) {
            this.Deactivate();
            return false;
        }


        var direction = 0;
        if (event.keyCode == 38) {
            // Up cursor key
        } else if (event.keyCode == 40) {
            // Down cursor key
        } else if (event.keyCode == 37) {
            // Left cursor key
            direction = -1;
        } else if (event.keyCode == 39) {
            // Right cursor key
            direction = 1;
        }
        if (direction != 0) {
            // loop to skip rects below the threshold
            while (true) {
                this.ActiveIndex += direction;
                if (this.ActiveIndex < 0 || this.ActiveIndex >= this.Shape.Widths.length) {
                    this.Deactivate();
                    return false;
                }
                if (this.Shape.Confidences[this.ActiveIndex] >= this.Shape.Threshold) {
                    this.UpdateActiveView();
                    return false;
                }
            }
        }

        return true;
    }

    RectSetWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    }

    RectSetWidget.prototype.HandleMouseDown = function(event) {
        return true;
    }

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

    RectSetWidget.prototype.SetActive = function(flag) {
        if (flag == this.Active) {
            return;
        }
        if (flag) {
            this.Active = true;
            this.ActiveIndex = 0;
            this.UpdateActiveView();
        } else {
            this.Deactivate();
        }
    }

    RectSetWidget.prototype.Deactivate = function() {
        this.Layer.GetCanvasDiv().css({'cursor':'default'});
        this.Layer.DeactivateWidget(this);
        this.Active = false;
        //this.Shape.Active = false;
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        this.Layer.EventuallyDraw();
    }

    // for debugging
    RectSetWidget.prototype.Activate = function() {
        this.Layer.ActivateWidget(this);
    }

    RectSetWidget.prototype.UpdateActiveView = function () {
        var viewer = this.Layer.GetViewer();
        var cam = viewer.GetCamera();
        viewer.TranslateTarget[0] = this.Shape.Centers[2*this.ActiveIndex];
        viewer.TranslateTarget[1] = this.Shape.Centers[2*this.ActiveIndex+1];
        viewer.AnimateLast = new Date().getTime();
        viewer.AnimateDuration = 200.0;
        viewer.EventuallyRender(true);
    }

    RectSetWidget.prototype.PlacePopup = function () {
    }

    RectSetWidget.prototype.ShowPropertiesDialog = function () {
    }

    SAM.RectSetWidget = RectSetWidget;

})();
