
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
        var gl = this.View.gl;
        this.Color = [0.0, 0.4, 0.0];
        this.Window = 1.0;
        this.Level = 0.5;
        this.Gama = 1.0;

        var self = this;
        this.HeatMapDiv.saOnResize(
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
            "uniform vec2 uWindowLevel;" +
            "uniform float uGama;" +
            "void main(void) {" +
            "  vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)).rgba;" +
            "  float alpha = textureColor[0];" +
            "  if (uWindowLevel[0] != 1.0 || uWindowLevel[1] != 0.5) {" +
            "    alpha = ((alpha-0.5)/uWindowLevel[0]) + uWindowLevel[1];" +
            "  }" +
            "  if (uGama != 1.0) {" +
            "    if (uGama < 0.0) {" +
            "      alpha = pow((1.0-alpha), -uGama);" +
            "    } else {" +
            "      alpha = pow(alpha, uGama);" +
            "    }" +
            "  }" +
            "  textureColor = vec4(uColor, alpha);" +
            "  gl_FragColor = textureColor;" +
            "}";
        var vertexShaderString =
            "attribute vec3 aVertexPosition;" +
            "attribute vec2 aTextureCoord;" +
            "uniform mat4 uMVMatrix;" +
            "uniform mat4 uPMatrix;" +
            "uniform mat3 uNMatrix;" +
            "varying vec2 vTextureCoord;" +
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
        shaderProgram.gamaUniform = gl.getUniformLocation(shaderProgram,"uGama");
        shaderProgram.windowLevelUniform = gl.getUniformLocation(shaderProgram,"uWindowLevel");
        this.View.ShaderProgram = shaderProgram;
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
            var program = this.View.ShaderProgram;
            gl.useProgram(program);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            // The blending in funky because there is no destination.
            // It is bleniding with data from canvas behind the webGl canvas.
            gl.blendFunc(gl.SRC_ALPHA, gl.ZERO);
            gl.uniform3f(program.colorUniform, this.Color[0], this.Color[1], this.Color[2]);
            gl.uniform1f(program.gamaUniform, this.Gama);
            gl.uniform2f(program.windowLevelUniform, this.Window, this.Level);
        }



        this.View.DrawTiles();
    }

    // Clear the canvas for another render.
    HeatMap.prototype.Reset = function () {
    }


    SA.HeatMap = HeatMap;

})();





