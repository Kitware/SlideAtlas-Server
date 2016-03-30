


(function () {
    "use strict";

    var SCALE_WIDGET_NEW = 0;
    var SCALE_WIDGET_WAITING = 3; // The normal (resting) state.
    var SCALE_WIDGET_ACTIVE = 4; // Mouse is over the widget and it is receiving events.
    var SCALE_WIDGET_PROPERTIES_DIALOG = 5; // Properties dialog is up

    var SCALE_WIDGET_DRAG = 6;
    var SCALE_WIDGET_DRAG_LEFT = 7;
    var SCALE_WIDGET_DRAG_RIGHT = 8;

    // Viewer coordinates.
    // Horizontal or verticle
    function Scale() {
        Shape.call(this);
        // Dimension of scale element
        this.Length = 100.0; // unit length in pixels
        this.TickSize = 6;
        this.NumberOfUnits = 1;
        //this.NumberOfSubdivisions = 10;
        this.Orientation = 0; // 0 or 90
        this.Origin = [10000,10000]; // middle.
        this.OutlineColor = [0,0,0];
        this.PointBuffer = [];
        this.PositionCoordinateSystem = Shape.VIEWER;
    };

    Scale.prototype = new Shape();

    Scale.prototype.destructor=function() {
        // Get rid of the buffers?
    };

    Scale.prototype.UpdateBuffers = function() {
        // TODO: Having a single poly line for a shape is to simple.
        // Add cell arrays.
        this.PointBuffer = [];

        // Matrix is computed by the draw method in Shape superclass.
        // TODO: Used to detect first initialization.
        // Get this out of this method.
        this.Matrix = mat4.create();
        mat4.identity(this.Matrix);

        // Draw all of the x lines.
        var x = 0;
        var y = this.TickSize;
        this.PointBuffer.push(x);
        this.PointBuffer.push(y);
        this.PointBuffer.push(0.0);
        y = 0;
        this.PointBuffer.push(x);
        this.PointBuffer.push(y);
        this.PointBuffer.push(0.0);

        for (var i = 0; i < this.NumberOfUnits; ++i) {
            x += this.Length;
            this.PointBuffer.push(x);
            this.PointBuffer.push(y);
            this.PointBuffer.push(0.0);
            y = this.TickSize;
            this.PointBuffer.push(x);
            this.PointBuffer.push(y);
            this.PointBuffer.push(0.0);
            y = 0;
            this.PointBuffer.push(x);
            this.PointBuffer.push(y);
            this.PointBuffer.push(0.0);
        }
    };

    function ScaleWidget (viewer, newFlag) {
        var self = this;

        if (viewer === null) {
            return;
        }

        this.Viewer = viewer;
        this.PixelsPerMeter = 0;
        this.Shape = new Scale();
        this.Shape.OutlineColor = [0.0, 0.0, 0.0];
        this.Shape.Origin = [30,20];
        this.Shape.Length = 200;
        this.Shape.FixedSize = true;

        this.Text = new Text();
        this.Text.PositionCoordinateSystem = Shape.VIEWER;
        this.Text.Position = [30,5];
        this.Text.String = "";
        this.Text.Color = [0.0, 0.0, 0.0];
        this.Text.Anchor = [0,0];

        this.Update(viewer.GetPixelsPerUnit());

        this.Viewer.AddWidget(this);

        this.State = SCALE_WIDGET_WAITING;
    }


    ScaleWidget.prototype.Update = function() {
        // Compute the number of screen pixels in a meter.
        var scale = Math.round(4e6 * this.Viewer.GetPixelsPerUnit());
        if (this.PixelsPerMeter == scale) {
            return;
        }
        // Save the scale so we know when to regenerate.
        this.PixelsPerMeter = scale;
        var target = 200; // pixels
        var e = 0;
        var length = this.PixelsPerMeter;
        while (length > target) {
            length = length / 10;
            --e;
        }
        // Now compute the units from e.
        this.Units = "nm";
        var factor = 1e-9;
        if (e >= -6) {
            this.Units = "\xB5m"
            factor = 1e-6;
        }
        if (e >= -3) {
            this.Units = "mm";
            factor = 1e-3;
        }
        if (e >= -2) {
            this.Units = "cm";
            factor = 1e-2;
        }
        if (e >= 0) {
            this.Units = "m";
            factor = 1;
        }
        if (e >= 3) {
            this.Units = "km";
            factor = 1000;
        }
        this.Shape.Length = length;
        this.Shape.NumberOfUnits = Math.floor(target / length);

        this.Label = Math.round(length / (this.PixelsPerMeter *
                                factor))*this.Shape.NumberOfUnits;
        this.Label = this.Label.toString() + this.Units;
        this.Text.String = this.Label;
        this.Text.UpdateBuffers();

        console.log(this.Label);
        this.Shape.UpdateBuffers();
    }

    ScaleWidget.prototype.Draw = function(view) {
        // Update the scale if zoom changed.
        this.Update();
        this.Shape.Draw(view);
        this.Text.Draw(view);
    };

    // This needs to be put in the Viewer.
    ScaleWidget.prototype.RemoveFromViewer = function() {
        if (this.Viewer) {
            this.RemoveWidget(this);
        }
    };

    ScaleWidget.prototype.HandleKeyPress = function(keyCode, shift) {
        return true;
    };

    ScaleWidget.prototype.HandleDoubleClick = function(event) {
        return true;
    };

    ScaleWidget.prototype.HandleMouseDown = function(event) {
        /*
        if (event.which != 1) {
            return true;
        }
        this.DragLast = this.Viewer.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
        */
        return false;
    };

    // returns false when it is finished doing its work.
    ScaleWidget.prototype.HandleMouseUp = function(event) {
        /*
        this.SetActive(false);
        RecordState();
        */
        return true;
    };

    // Orientation is a pain,  we need a world to shape transformation.
    ScaleWidget.prototype.HandleMouseMove = function(event) {
        /*
        if (event.which == 1) {
            var world =
                this.Viewer.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
            var dx, dy;
            if (this.State == SCALE_WIDGET_DRAG) {
                dx = world[0] - this.DragLast[0];
                dy = world[1] - this.DragLast[1];
                this.DragLast = world;
                this.Shape.Origin[0] += dx;
                this.Shape.Origin[1] += dy;
            } else {
                // convert mouse from world to Shape coordinate system.
                dx = world[0] - this.Shape.Origin[0];
                dy = world[1] - this.Shape.Origin[1];
                var c = Math.cos(3.14156* this.Shape.Orientation / 180.0);
                var s = Math.sin(3.14156* this.Shape.Orientation / 180.0);
                var x = c*dx - s*dy;
                var y = c*dy + s*dx;
                // convert from shape to integer scale indexes.
                x = (0.5*this.Shape.Dimensions[0]) + (x /
                  this.Shape.Width);
                y = (0.5*this.Shape.Dimensions[1]) + (y /
                  this.Shape.Height);
                var ix = Math.round(x);
                var iy = Math.round(y);
                // Change scale dimemsions
                dx = dy = 0;
                var changed = false;
                if (this.State == SCALE_WIDGET_DRAG_RIGHT) {
                    dx = ix - this.Shape.Dimensions[0];
                    if (dx) {
                        this.Shape.Dimensions[0] = ix;
                        // Compute the change in the center point origin.
                        dx = 0.5 * dx * this.Shape.Width;
                        changed = true;
                    }
                } else if (this.State == SCALE_WIDGET_DRAG_LEFT) {
                    if (ix) {
                        this.Shape.Dimensions[0] -= ix;
                        // Compute the change in the center point origin.
                        dx = 0.5 * ix * this.Shape.Width;
                        changed = true;
                    }
                } else if (this.State == SCALE_WIDGET_DRAG_BOTTOM) {
                    dy = iy - this.Shape.Dimensions[1];
                    if (dy) {
                        this.Shape.Dimensions[1] = iy;
                        // Compute the change in the center point origin.
                        dy = 0.5 * dy * this.Shape.Height;
                        changed = true;
                    }
                } else if (this.State == SCALE_WIDGET_DRAG_TOP) {
                    if (iy) {
                        this.Shape.Dimensions[1] -= iy;
                        // Compute the change in the center point origin.
                        dy = 0.5 * iy * this.Shape.Height;
                        changed = true;
                    }
                }
                if (changed) {
                    // Rotate the translation and apply to the center.
                    x = c*dx + s*dy;
                    y = c*dy - s*dx;
                    this.Shape.Origin[0] += x;
                    this.Shape.Origin[1] += y;
                    this.Shape.UpdateBuffers();
                }
            }
            eventuallyRender();
            return
        }

        this.CheckActive(event);
*/
        return true;
    };


    ScaleWidget.prototype.HandleMouseWheel = function(event) {
        /*
        var x = event.offsetX;
        var y = event.offsetY;

        if (this.State == SCALE_WIDGET_ACTIVE) {
            if(this.NormalizedActiveDistance < 0.5) {
                var ratio = 1.05;
                var direction = 1;
                if(event.wheelDelta < 0) {
                     ratio = 0.95;
                    direction = -1;
                }
                if(event.shiftKey) {
                    this.Shape.Length = this.Shape.Length * ratio;
                }
                if(event.ctrlKey) {
                    this.Shape.Width = this.Shape.Width * ratio;
                }
                if(!event.shiftKey && !event.ctrlKey) {
                    this.Shape.Orientation = this.Shape.Orientation + 3 * direction;
                 }

                this.Shape.UpdateBuffers();
                this.PlacePopup();
                eventuallyRender();
            }
        }
        */
    };


    ScaleWidget.prototype.HandleTouchPan = function(event) {
        /*
          w0 = this.Viewer.ConvertPointViewerToWorld(EVENT_MANAGER.LastMouseX,
          EVENT_MANAGER.LastMouseY);
          w1 = this.Viewer.ConvertPointViewerToWorld(event.offsetX,event.offsetY);

          // This is the translation.
          var dx = w1[0] - w0[0];
          var dy = w1[1] - w0[1];

          this.Shape.Origin[0] += dx;
          this.Shape.Origin[1] += dy;
          eventuallyRender();
        */
        return true;
    };


    ScaleWidget.prototype.HandleTouchPinch = function(event) {
        //this.Shape.UpdateBuffers();
        //eventuallyRender();
        return true;
    };

    ScaleWidget.prototype.HandleTouchEnd = function(event) {
        this.SetActive(false);
    };


    ScaleWidget.prototype.CheckActive = function(event) {
        /*
        var x,y;
        if (this.Shape.FixedSize) {
            x = event.offsetX;
            y = event.offsetY;
            pixelSize = 1;
        } else {
            x = event.worldX;
            y = event.worldY;
        }
        x = x - this.Shape.Origin[0];
        y = y - this.Shape.Origin[1];
        // Rotate to scale.
        var c = Math.cos(3.14156* this.Shape.Orientation / 180.0);
        var s = Math.sin(3.14156* this.Shape.Orientation / 180.0);
        var rx = c*x - s*y;
        var ry = c*y + s*x;

        // Convert to scale coordinates (0 -> dims)
        x = (0.5*this.Shape.Dimensions[0]) + (rx / this.Shape.Width);
        y = (0.5*this.Shape.Dimensions[1]) + (ry / this.Shape.Height);
        var ix = Math.round(x);
        var iy = Math.round(y);
        if (ix < 0 || ix > this.Shape.Dimensions[0] ||
            iy < 0 || iy > this.Shape.Dimensions[1]) {
            this.SetActive(false);
            return false;
        }

        // x,y get the residual in pixels.
        x = (x - ix) * this.Shape.Width;
        y = (y - iy) * this.Shape.Height;

        // Compute the screen pixel size for tollerance.
        var tolerance = 5.0 / this.Viewer.GetPixelsPerUnit();

        if (Math.abs(x) < tolerance || Math.abs(y) < tolerance) {
            this.SetActive(true);
            if (ix == 0) {
                this.State = SCALE_WIDGET_DRAG_LEFT;
                this.Viewer.MainView.CanvasDiv.css({'cursor':'col-resize'});
            } else if (ix == this.Shape.Dimensions[0]) {
                this.State = SCALE_WIDGET_DRAG_RIGHT;
                this.Viewer.MainView.CanvasDiv.css({'cursor':'col-resize'});
            } else if (iy == 0) {
                this.State = SCALE_WIDGET_DRAG_TOP;
                this.Viewer.MainView.CanvasDiv.css({'cursor':'row-resize'});
            } else if (iy == this.Shape.Dimensions[1]) {
                this.State = SCALE_WIDGET_DRAG_BOTTOM;
                this.Viewer.MainView.CanvasDiv.css({'cursor':'row-resize'});
            } else {
                this.State = SCALE_WIDGET_DRAG;
                this.Viewer.MainView.CanvasDiv.css({'cursor':'move'});
            }
            return true;
        }
        */
        this.SetActive(false);
        return false;
    };

    // Multiple active states. Active state is a bit confusing.
    ScaleWidget.prototype.GetActive = function() {
        if (this.State == SCALE_WIDGET_WAITING) {
            return false;
        }
        return true;
    };


    ScaleWidget.prototype.Deactivate = function() {
        this.Viewer.MainView.CanvasDiv.css({'cursor':'default'});
        this.Popup.StartHideTimer();
        this.State = SCALE_WIDGET_WAITING;
        this.Shape.Active = false;
        this.Viewer.DeactivateWidget(this);
        if (this.DeactivateCallback) {
            this.DeactivateCallback();
        }
        eventuallyRender();
    };

    // Setting to active always puts state into "active".
    // It can move to other states and stay active.
    ScaleWidget.prototype.SetActive = function(flag) {
        if (flag == this.GetActive()) {
            return;
        }

        if (flag) {
            this.State = SCALE_WIDGET_ACTIVE;
            this.Shape.Active = true;
            this.Viewer.ActivateWidget(this);
            eventuallyRender();
            // Compute the location for the pop up and show it.
            this.PlacePopup();
        } else {
            this.Deactivate();
        }
        eventuallyRender();
    };


    window.ScaleWidget = ScaleWidget;

})();
