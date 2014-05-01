// for debugging
function MOVE_TO(x,y) {
  VIEWER1.MainView.Camera.SetFocalPoint(x,y);
  VIEWER1.MainView.Camera.ComputeMatrix();
  eventuallyRender();
}




// This file contains some global variables and misc procedures to
// initials shaders and some buffers we need and to render.

var ROOT_DIV;

var SLICE = 1;

// globals (for now)
var imageProgram;
var textProgram;
var polyProgram;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var squareOutlinePositionBuffer;
var squarePositionBuffer;
var tileVertexPositionBuffer;
var tileVertexTextureCoordBuffer;
var tileCellBuffer;

var MOBILE_DEVICE = false;
// Hack to get rid of white lines.
var I_PAD_FLAG = false;


function detectMobile() {
  MOBILE_DEVICE = false;
  if ( navigator.userAgent.match(/Android/i)) {
   MOBILE_DEVICE = "Andriod";
  }
  if ( navigator.userAgent.match(/webOS/i)) {
   MOBILE_DEVICE = "webOS";
  }
  if ( navigator.userAgent.match(/iPhone/i)) {
   MOBILE_DEVICE = "iPhone";
  }
  if ( navigator.userAgent.match(/iPad/i)) {
   MOBILE_DEVICE = "iPad";
   I_PAD_FLAG = true;
  }
  if ( navigator.userAgent.match(/iPod/i)) {
   MOBILE_DEVICE = "iPod";
  }
  if ( navigator.userAgent.match(/BlackBerry/i)) {
   MOBILE_DEVICE = "BlackBerry";
  }
  if ( navigator.userAgent.match(/Windows Phone/i)) {
   MOBILE_DEVICE = "Windows Phone";
  }
  if (MOBILE_DEVICE) {
    MAXIMUM_NUMBER_OF_TILES = 5000;
  }
}



// This global is used in every class that renders something.
// I can not test multiple canvases until I modularize the canvas
// and get rid of these globals.
// WebGL context
var GL;

function GetUser() {
  if (typeof(USER) != "undefined") {
    return USER;
  }
  if (typeof(ARGS) != "undefined") {
    return ARGS.User;
  }
  alert ("Could not find user");
  return "";
}


function GetViewId () {
  if (typeof(VIEW_ID) != "undefined") {
    return VIEW_ID;
  }
  if (typeof(ARGS) != "undefined") {
    return ARGS.Viewer1.viewid;
  }
  if ( ! NOTES_WIDGET && ! NOTES_WIDGET.RootNote) {
    return NOTES_WIDGET.RootNote._id;
  }
  alert ("Could not find view id");
  return "";
}

function GetSessionDatabase() {
  if (typeof(SESSION_DATABASE) != "undefined") {
    return SESSION_DATABASE;
  }
  if (typeof(ARGS) != "undefined") {
    return ARGS.Viewer1.db;
  }
  alert ("Could not find session database");
  return "";
}


// WebGL Initialization

function doesBrowserSupportWebGL(canvas) {
    return false;
    try {
        //GL = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        GL = canvas.getContext("webgl");
    } catch (e) {
    }
    if (!GL) {
        //alert("Could not initialise WebGL, sorry :-(");
        return false;
    }
   return true;
}


function initGL() {
  // Add a new canvas.
  CANVAS = $('<canvas>').appendTo('body').css({
      'position': 'absolute',
      'width': '100%',
      'height': '100%',
      'top' : '0px',
      'left' : '0px',
      'z-index': '1'
  }); // class='fillin nodoubleclick'
  //this.canvas.onselectstart = function() {return false;};
  //this.canvas.onmousedown = function() {return false;};
  GL = CANVAS[0].getContext("webgl") || CANVAS[0].getContext("experimental-webgl");

  // Defined in HTML
  initShaderPrograms();
  initOutlineBuffers();
  initImageTileBuffers();
  GL.clearColor(1.0, 1.0, 1.0, 1.0);
  GL.enable(GL.DEPTH_TEST);
}



function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}



function initShaderPrograms() {
    polyProgram = createProgram("shader-poly-fs", "shader-poly-vs");
    polyProgram.colorUniform = GL.getUniformLocation(polyProgram, "uColor");

    imageProgram = createProgram("shader-tile-fs", "shader-tile-vs");
    // Texture coordinate attribute and texture image uniform
    imageProgram.textureCoordAttribute
        = GL.getAttribLocation(imageProgram,"aTextureCoord");
    GL.enableVertexAttribArray(imageProgram.textureCoordAttribute);
    imageProgram.samplerUniform = GL.getUniformLocation(imageProgram, "uSampler");



    textProgram = createProgram("shader-text-fs", "shader-text-vs");
    textProgram.textureCoordAttribute
        = GL.getAttribLocation(textProgram, "aTextureCoord");
    GL.enableVertexAttribArray(textProgram.textureCoordAttribute);
    textProgram.samplerUniform
        = GL.getUniformLocation(textProgram, "uSampler");
    textProgram.colorUniform = GL.getUniformLocation(textProgram, "uColor");
}


function createProgram(fragmentShaderID, vertexShaderID) {
    var fragmentShader = getShader(GL, fragmentShaderID);
    var vertexShader = getShader(GL, vertexShaderID);

    var program = GL.createProgram();
    GL.attachShader(program, vertexShader);
    GL.attachShader(program, fragmentShader);
    GL.linkProgram(program);

    if (!GL.getProgramParameter(program, GL.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    program.vertexPositionAttribute = GL.getAttribLocation(program, "aVertexPosition");
    GL.enableVertexAttribArray(program.vertexPositionAttribute);

    // Camera matrix
    program.pMatrixUniform = GL.getUniformLocation(program, "uPMatrix");
    // Model matrix
    program.mvMatrixUniform = GL.getUniformLocation(program, "uMVMatrix");

    return program;
}

function initOutlineBuffers() {
    // Outline Square
    vertices = [
        0.0,  0.0,  0.0,
        0.0,  1.0,  0.0,
        1.0, 1.0,  0.0,
        1.0, 0.0,  0.0,
        0.0, 0.0,  0.0];
    squareOutlinePositionBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, squareOutlinePositionBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
    squareOutlinePositionBuffer.itemSize = 3;
    squareOutlinePositionBuffer.numItems = 5;

    // Filled square
    squarePositionBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, squarePositionBuffer);
    vertices = [
        1.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        1.0,  0.0,  0.0,
        0.0,  0.0,  0.0
    ];
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
    squarePositionBuffer.itemSize = 3;
    squarePositionBuffer.numItems = 4;
}




//==============================================================================



function initImageTileBuffers() {
    var vertexPositionData = [];
    var textureCoordData = [];

    // Make 4 points
    textureCoordData.push(0.0);
    textureCoordData.push(0.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(0.0);

    textureCoordData.push(1.0);
    textureCoordData.push(0.0);
    vertexPositionData.push(1.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(0.0);

    textureCoordData.push(0.0);
    textureCoordData.push(1.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(1.0);
    vertexPositionData.push(0.0);

    textureCoordData.push(1.0);
    textureCoordData.push(1.0);
    vertexPositionData.push(1.0);
    vertexPositionData.push(1.0);
    vertexPositionData.push(0.0);

    // Now create the cell.
    var cellData = [];
    cellData.push(0);
    cellData.push(1);
    cellData.push(2);

    cellData.push(2);
    cellData.push(1);
    cellData.push(3);

    tileVertexTextureCoordBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, tileVertexTextureCoordBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(textureCoordData), GL.STATIC_DRAW);
    tileVertexTextureCoordBuffer.itemSize = 2;
    tileVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

    tileVertexPositionBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, tileVertexPositionBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertexPositionData), GL.STATIC_DRAW);
    tileVertexPositionBuffer.itemSize = 3;
    tileVertexPositionBuffer.numItems = vertexPositionData.length / 3;

    tileCellBuffer = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, tileCellBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), GL.STATIC_DRAW);
    tileCellBuffer.itemSize = 1;
    tileCellBuffer.numItems = cellData.length;
}




// Stuff for drawing
var RENDER_PENDING = false;
function eventuallyRender() {
    if (! RENDER_PENDING) {
      RENDER_PENDING = true;
      requestAnimFrame(tick);
    }
}

function tick() {
    RENDER_PENDING = false;
    draw();
}



// TODO:
// I still need to make the zoom buttons relative to the viewport
// Also the callback (zoom) cannot be hardcoded to VIEWER1!!!!!
function initView(viewport) {
  var viewer = new Viewer(viewport, null);
  EVENT_MANAGER.AddViewer(viewer);

  // Place the zoom in / out buttons.
  // Todo: Make the button become more opaque when pressed.
  // Associate with viewer (How???).
  // Place properly (div per viewer?) (viewer.SetViewport also places buttons).
  $('<img>').appendTo('body').css({
      'opacity': '0.4',
      'position': 'absolute',
      'height': '50px',
      'width': '50px',
      'bottom' : '55px',
      'right' : '5px',
      'z-index': '2'
  }).attr('class', 'viewer1').attr('type','image').attr('src',"/webgl-viewer/static/zoomin2.png").click(function(){
           VIEWER1.AnimateZoom(0.5);});
  $('<img>').appendTo('body').css({
      'opacity': '0.4',
      'position': 'absolute',
      'height': '50px',
      'width': '50px',
      'bottom' : '5px',
      'right' : '5px',
      'z-index': '2'
  }).attr('class', 'viewer1').attr('type','image').attr('src',"/webgl-viewer/static/zoomout2.png").click(function(){
           VIEWER1.AnimateZoom(2.0);});
  return viewer;
}


//==============================================================================
// Alternative to webgl, HTML5 2d canvas


function initGC() {

  detectMobile();

  // Add a new canvas.
  CANVAS = $('<div>').appendTo('body').css({
                'position': 'absolute',
                'width': '100%',
                'height': '100%',
                'top' : '0px',
                'left' : '0px',
                'z-index': '1'
            });
}


var GC_STACK = [];
var GCT = [1,0,0,1,0,0];
function GC_save() {
  var tmp = [GCT[0], GCT[1], GCT[2], GCT[3], GCT[4], GCT[5]];
  GC_STACK.push(tmp);
}
function GC_restore() {
  var tmp = GC_STACK.pop();
  GCT = tmp;
  GC.setTransform(tmp[0],tmp[1],tmp[2],tmp[3],tmp[4],tmp[5]);
}
function GC_setTransform(m00,m10,m01,m11,m02,m12) {
  GCT = [m00,m10,m01,m11,m02,m12];
  GC.setTransform(m00,m10,m01,m11,m02,m12);
}
function GC_transform(m00,m10,m01,m11,m02,m12) {
  var n00 = m00*GCT[0] + m10*GCT[2];
  var n10 = m00*GCT[1] + m10*GCT[3];
  var n01 = m01*GCT[0] + m11*GCT[2];
  var n11 = m01*GCT[1] + m11*GCT[3];
  var n02 = m02*GCT[0] + m12*GCT[2] + GCT[4];
  var n12 = m02*GCT[1] + m12*GCT[3] + GCT[5];

  GCT = [n00,n10,n01,n11,n02,n12];
  GC.setTransform(n00,n10,n01,n11,n02,n12);
}



//----------------------------------------------------------
// Log to trackdown iPad bug.  Console does not log until
// debugger is running.  Bug does not occur when debugger
// is running.

LOGGING = false;
DEBUG_LOG = [];

function StartLogging (message) {
  if (LOGGING) return;
  LOGGING = true;
  //alert("Error: Check log");
}

function LogMessage (message) {
  if (LOGGING) {
    DEBUG_LOG.push(message);
  }
}

function FixJustification () {
  cache = VIEWER1.GetCache()

  $.ajax({
    type: "post",
    url: "/webgl-viewer/fixjustification",
    data: {"img": cache.Image._id,
           "db": cache.Image.database},
    success: function(data,status) {},
    error: function() { alert( "AJAX - error() : fixjustification" ); },
    });
}



