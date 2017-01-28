
// A Renderer - layer tints an image and adds opacity.  Maybe lens in the future.
(function () {
    "use strict";

    function OverlayView(parent) {
        this.OverlayViewDiv = $('<div>')
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

        this.View = new SA.TileView(this.OverlayViewDiv,true);
        var gl = this.View.gl;
        this.Color = [1.0, 0.0, 1.0];
        this.Center = [500,500];
        this.Radius = 0;
        this.Opacity = 1.0;

        var self = this;
        this.OverlayViewDiv.saOnResize(
            function() {
                self.View.UpdateCanvasSize();
                // Rendering will be a slave to the view because it needs the
                // view's camera anyway.
            });


        // Test red->alpha, constant color set externally
        var heatMapFragmentShaderString =
            "precision highp float;" +
            "varying vec2 vTextureCoord;" +
            "uniform sampler2D uSampler;" +
            "uniform vec3 uColor;" +
            "uniform vec2 uCenter;" +
            "uniform float uOpacity;" +
            "void main(void) {" +
            "  float alpha = uOpacity;" +
            "  float dx = gl_FragCoord.x - uCenter.x;" +
            "  float dy = gl_FragCoord.y - uCenter.y;" +
            "  if ((dx * dx) + (dy * dy) < 40000.0) { alpha = 0.0;}" +
            "  vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)).rgba;" +
            "  float intensity = textureColor[0];" +
            "  textureColor[0] = intensity * uColor[0];" +
            "  textureColor[1] = intensity * uColor[1];" +
            "  textureColor[2] = intensity * uColor[2];" +
            "  textureColor[3] = alpha;" +
            "  gl_FragColor = textureColor;" +
            //"  gl_FragColor = vec4(gl_FragCoord.x / 1000.0, gl_FragCoord.y / 1000.0, 0, alpha);" +
            "}";
        var vertexShaderString =
            "attribute vec3 aVertexPosition;" +
            "attribute vec2 aTextureCoord;" +
            "uniform mat4 uMVMatrix;" +
            "uniform mat4 uPMatrix;" +
            "uniform mat3 uNMatrix;" +
            "varying vec2 vTextureCoord;" +
            "varying vec4 vPos;" +
            "void main(void) {" +
            "  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition,1.0);" +
            "  vTextureCoord = aTextureCoord;" +
            "}";

        var shaderProgram = SA.createWebGlProgram(heatMapFragmentShaderString, vertexShaderString, gl);
        // Setup the shader program to render heatmaps.
        shaderProgram.textureCoordAttribute
            = gl.getAttribLocation(shaderProgram,"aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram,"uColor");
        shaderProgram.opacityUniform = gl.getUniformLocation(shaderProgram,"uOpacity");
        shaderProgram.centerUniform = gl.getUniformLocation(shaderProgram,"uCenter");
        this.View.ShaderProgram = shaderProgram;

        var self = this;
        //this.View.Canvas
        this.OverlayViewDiv.on(
            "mousemove.overlay",
			      function (event){
                self.Center[0] = event.offsetX;
                self.Center[1] = self.OverlayViewDiv.height() - event.offsetY;
                self.EventuallyDraw();
                return true;
            });
    }

    // To compress draw events.
    OverlayView.prototype.EventuallyDraw = function() {
        if ( ! this.RenderPending) {
            this.RenderPending = true;
            var self = this;
            requestAnimFrame(
                function() {
                    self.RenderPending = false;
                    self.Draw();
                });
        }
    }

    OverlayView.prototype.SetCache = function (cache) {
        this.View.SetCache(cache);
        var imageObj = cache.GetImageData();
        if ( ! imageObj.spacing) {
            imageObj.spacing = [1,1,1];
        }
        if ( ! imageObj.origin) {
            imageObj.origin = [0,0,0];
        }
        var width = imageObj.dimensions[0] * imageObj.spacing[0];;
        var height = imageObj.dimensions[1] * imageObj.spacing[1];;
        this.View.Camera.Load(
            {FocalPoint: [width/2, height/2],
             Roll      : 0,
             Height    : height});
        this.View.Camera.ComputeMatrix();
        this.View.UpdateCanvasSize();
    }

    // Only works for images served by slide atlas. 
    OverlayView.prototype.SetImageData = function (imageObj) {
        imageObj.spacing = imageObj.spacing || [1.0, 1.0, 1.0];
        imageObj.origin  = imageObj.origin  || [0.0, 0.0, 0.0];

        var heatMapSource = new SA.SlideAtlasSource();
        heatMapSource.Prefix = imageObj.prefix;
        var heatMapCache = new SA.Cache();
        heatMapCache.TileSource = heatMapSource;
        heatMapCache.SetImageData(imageObj);
        this.View.SetCache(heatMapCache);
    }


    OverlayView.prototype.Draw = function (masterView, inCam) {
        // TODO: Clear any pending renders.

        if (masterView) {
            inCam = inCam || masterView.Camera;
        }

        if (inCam) {
            if (this.Transform) {
                this.Transform.ForwardTransformCamera(inCam, this.View.GetCamera());
            } else {
                // Use spacing and origin for a transformation.
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
                this.Camera.DeepCopy(cam);
            }
        }

        if (this.View.gl) {
            var gl = this.View.gl;
            var program = this.View.ShaderProgram;
            gl.useProgram(program);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            // The blending in funky because there is no destination.
            // It is bleniding with data from canvas behind the webGl canvas.
            gl.blendFunc(gl.SRC_ALPHA, gl.ZERO);
            gl.uniform3f(program.colorUniform, this.Color[0], this.Color[1], this.Color[2]);
            gl.uniform1f(program.opacityUniform, this.Opacity);
            gl.uniform2f(program.centerUniform, this.Center[0], this.Center[1]);
        }

        this.View.DrawTiles();
    }

    // Clear the canvas for another render.
    OverlayView.prototype.Reset = function () {
    }


    SA.OverlayView = OverlayView;

})();





