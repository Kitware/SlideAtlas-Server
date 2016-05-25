
(function () {
    "use strict";


    function HeatMap(parent) {
        this.HeatMapDiv = $('<div>')
            .appendTo(parent)
            .css({'position':'absolute',
                  'left':'0px',
                  'top':'0px',
                  'border-width':'0px',
                  'width':'100%',
                  'height':'100%',
                  'box-sizing':'border-box',
                  'z-index':'150'})
            .addClass('sa-resize');

        this.View = new SA.TileView(this.HeatMapDiv,true);
        this.Color = [0.0, 0.4, 0.0];

        var self = this;
        this.HeatMapDiv.saOnResize(
            function() {
                self.View.UpdateCanvasSize();
                // Rendering will be a slave to the view because it needs the
                // view's camera anyway.
            });

    }


    HeatMap.prototype.SetImageData = function (imageObj) {
        imageObj.spacing = imageObj.spacing || [1.0, 1.0, 1.0];
        imageObj.origin  = imageObj.origin  || [0.0, 0.0, 0.0];

        var heatMapSource = new SA.SlideAtlasSource();
        heatMapSource.Prefix = imageObj.prefix;
        var heatMapCache = new SA.Cache();
        heatMapCache.TileSource = heatMapSource;
        heatMapCache.SetImageData(imageObj);
        this.View.SetCache(heatMapCache);

        var width = imageObj.dimensions[0] * imageObj.spacing[0];;
        var height = imageObj.dimensions[1] * imageObj.spacing[1];;
        this.View.Camera.Load(
            {FocalPoint: [width/2, height/2],
             Roll      : 0,
             Height    : height});
        this.View.Camera.ComputeMatrix();
        this.View.UpdateCanvasSize();
    }


    HeatMap.prototype.Draw = function (masterView, inCam) {
        var inCam = inCam || masterView.Camera;
        var outCam = this.View.Camera;
        var imageObj = this.View.GetCache().Image;

        outCam.DeepCopy(inCam);
        outCam.FocalPoint[0]
            = (outCam.FocalPoint[0]-imageObj.origin[0])/imageObj.spacing[0];
        outCam.FocalPoint[1]
            = (outCam.FocalPoint[1]-imageObj.origin[1])/imageObj.spacing[1];

        outCam.Width /= imageObj.spacing[0];
        outCam.Height /= imageObj.spacing[1];


        outCam.ComputeMatrix();

        if (this.View.gl) {
            var gl = this.View.gl;
            var program = SA.imageProgram;
            gl.useProgram(program);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            //gl.blendEquation( gl.FUNC_ADD );
            //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            //gl.blendFunc(gl.ONE, gl.ZERO);
            gl.blendFunc(gl.SRC_ALPHA, gl.ZERO);

            gl.uniform3f(program.colorUniform, this.Color[0], this.Color[1], this.Color[2]);
        }



        this.View.DrawTiles();
    }

    // Clear the canvas for another render.
    HeatMap.prototype.Reset = function () {
    }


    SA.HeatMap = HeatMap;

})();





