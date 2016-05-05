
(function () {
    "use strict";

    // A shape to translate and rotate an object.


    function InteractorHandle() {
        // Radius of the major translation handle.  Minor rotation handle is half this radius.
        this.Radius = 10; // Radius in pixels
        this.Origin = [10000,10000]; // Center in world coordinates.
        this.Roll = 0;
        this.OutlineColor = [0,0,0];
        this.FillColor    = [1,1,0];
    };
    InteractorHandle.prototype = new SAM.Shape;

    InteractorHandle.prototype.Draw = function (view) {
        var origin = view.GetCamera().ConvertPointWorldToViewer(this.Origin[0], this.Origin[1]);
        var ctx = view.Context2d;
        ctx.save();
        ctx.strokeStyle = SAM.ConvertColorToHex(this.OutlineColor);
        ctx.fillStyle = SAM.ConvertColorToHex(this.FillColor);
        // Translation.
        ctx.setTransform(1,0,0,1,origin[0],origin[1]);

        ctx.beginPath();
        ctx.rect(-this.Radius/4,-this.Radius*6,this.Radius/2,this.Radius*6);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0,0,this.Radius,0,2*Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0,this.Radius*6,this.Radius/2,0,2*Math.PI);
        ctx.fill();
        ctx.stroke();

        view.Context2d.restore();
    }

    InteractorHandle.prototype.ChooseOutlineColor = function () {
        if (this.FillColor) {
            this.OutlineColor = [1.0-this.FillColor[0],
                                 1.0-this.FillColor[1],
                                 1.0-this.FillColor[2]];
        }
    }

    // In slide / world coordinates
    InteractorHandle.prototype.SetOrigin = function (x,y) {
        this.Origin[0] = x;
        this.Origin[1] = y;
    }

    // In radians
    InteractorHandle.prototype.SetRoll = function (theta) {
        this.Roll = theta;
    }
    // In degrees
    InteractorHandle.prototype.SetRoll = function (theta) {
        this.Roll = (theta * 3.1415926536 / 180.0);
    }

    InteractorHandle.prototype.SetOutlineColor = function (c) {
        this.OutlineColor = SAM.ConvertColor(c);
    }

    InteractorHandle.prototype.SetFillColor = function (c) {
        this.FillColor = SAM.ConvertColor(c);
    }



    SAM.InteractorHandle = InteractorHandle;

})();
