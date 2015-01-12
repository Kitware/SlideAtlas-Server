

// for debugging
function MOVE_TO(x,y) {
  VIEWER1.MainView.Camera.SetFocalPoint(x,y);
  VIEWER1.MainView.Camera.ComputeMatrix();
  eventuallyRender();
}




function ZERO_PAD(i, n) {
    var s = "0000000000" + i.toFixed();
    return s.slice(-n);
}



// This file contains some global variables and misc procedures to
// initials shaders and some buffers we need and to render.

var ROOT_DIV;

var SLICE = 0;

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

// WebGL Initialization

function doesBrowserSupportWebGL(canvas) {
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

  return viewer;
}


//==============================================================================
// Alternative to webgl, HTML5 2d canvas


function initGC() {

  detectMobile();

  // Add a new canvas.
  CANVAS = $('<div>')
        .appendTo('body').css({
            'position': 'absolute',
            'width': '100%',
            'height': '100%',
            'top' : '0px',
            'left' : '0px',
            'z-index': '1'
        });

  VIEW_PANEL = $('<div>')
        .appendTo('body')
        .css({
            'position': 'absolute',
            'width': '100%',
            'height': '100%',
            'top' : '0px',
            'left' : '0px',
            'z-index': '3'
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

//----------------------------------------------------------
// In an attempt to simplify the view.html template file, I am putting
// as much of the javascript from that file into this file as I can.
// As I abstract viewer features, these variables and functions
// should migrate into objects and other files.

var CANVAS;

var VIEW_PANEL; // div that should contain the two viewers.
var EVENT_MANAGER;
var VIEWER1;
var VIEWER2;
var DUAL_VIEW = false;
var NAVIGATION_WIDGET;
var CONFERENCE_WIDGET;
var FAVORITES_WIDGET;
var MOBILE_ANNOTATION_WIDGET;
var NOTES_WIDGET;


// hack to avoid an undefined error (until we unify annotation stuff).
function ShowAnnotationEditMenu(x, y) {
}


$(window).bind('orientationchange', function(event) {
    //alert(window.innerWidth + " " + VIEWER1.MainView.Canvas[0].parentNode.clientWidth + " " + window.innerHeight + " " + VIEWER1.MainView.Canvas[0].parentNode.clientHeight);
    handleResize();
});

// Getting resize right was a major pain.
function handleResize() {
    screenDiv = $('<div>').appendTo('body')
                          .css({
                            'background-color': '#f00',
                            'border': '1px solid black',
                            'width': '100%',
                            'height': '100%',
                            'z-index': '10'
                          });


    var width = CANVAS.width();
    var height = CANVAS.height();

    if(MOBILE_DEVICE == 'iPad'){
      width = window.innerWidth;
      height = window.innerHeight;
      CANVAS.height(height);

      document.documentElement.setAttribute('height', height + "px");
    }

    // CANVAS is the containing div for the actual <canvas> tags in the 2D case.
    if(GL){
      var canvasParent = CANVAS[0].parentNode;
      width = canvasParent.clientWidth;
      height = canvasParent.clientHeight;
    }

    if(height == 0){
      height = window.innerHeight;
    }

    if (GL) {
      CANVAS.attr("width",width.toString());
      CANVAS.attr("height",height.toString());
      GL.viewport(0, 0, width, height);
    } // GL.SetViewport does the work for 2d canvases.

    // Handle resizing of the favorites bar.
    // TODO: Make a resize callback.
    if(FAVORITES_WIDGET != undefined){
      FAVORITES_WIDGET.resize(width);
    }

    // we set the left border to leave space for the notes window.
    var viewPanelLeft = 0;
    if (NOTES_WIDGET) { viewPanelLeft = width * NOTES_WIDGET.WidthFraction;}
    var viewPanelWidth = width - viewPanelLeft;
    // The remaining width is split between the two viewers.
    var width1 = viewPanelWidth * VIEWER1_FRACTION;
    var width2 = viewPanelWidth - width1;

    // Setup the view panel div to be the same as the two viewers.
    VIEW_PANEL.css({'left': viewPanelLeft+'px',
                    'width': viewPanelWidth+'px'});

    // TODO: Make a multi-view object.
    if (VIEWER1) {
      VIEWER1.SetViewport([0, 0, width1, height]);
      eventuallyRender();
    }
    if (VIEWER2) {
      VIEWER2.SetViewport([width1, 0, width2, height]);
      eventuallyRender();
    }
}


function InitViews() {
    var width = CANVAS.innerWidth();
    var height = CANVAS.innerHeight();
    var halfWidth = width/2;
    VIEWER1 = initView([0,0, width, height]);
    VIEWER1.ViewerIndex = 0;
    VIEWER2 = initView([0,0, width, height]);
    VIEWER2.ViewerIndex = 1;

    handleResize();
}

// Hack mutex. iPad2 must execute multiple draw callbacks at the same time
// in different threads.
// This was not actually the problem.  iPad had a bug in the javascript interpreter.
var DRAWING = false;
function draw() {
    if (DRAWING) { return; }
    DRAWING = true;
    if (GL) {
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    }

    // This just changes the camera based on the current time.
    VIEWER1.Animate();
    if (DUAL_VIEW) { VIEWER2.Animate(); }
    VIEWER1.Draw();
    if (DUAL_VIEW) { VIEWER2.Draw(); }
    DRAWING = false;
}

// The event manager detects single right click and double right click.
// This gets galled on the single.
function ShowPropertiesMenu(x, y) {} // This used to show the view edit.
// I am getting rid of the right click feature now.


function handleTouchStart(event) {EVENT_MANAGER.HandleTouchStart(event);}
function handleTouchMove(event) {EVENT_MANAGER.HandleTouchMove(event);}
function handleTouchEnd(event) {EVENT_MANAGER.HandleTouchEnd(event);}
function handleTouchCancel(event) {EVENT_MANAGER.HandleTouchCancel(event);}

function handleKeyDown(event) {
    // control: 17, z: 90, y: 89
    if (event.keyCode == 34) { SessionAdvance();}
    return EVENT_MANAGER.HandleKeyDown(event);
}
function handleKeyUp(event) {
    return EVENT_MANAGER.HandleKeyUp(event);
}

function cancelContextMenu(e) {
    //alert("Try to cancel context menu");
    if (e && e.stopPropagation) {
        e.stopPropagation();
    }
    return false;
}

var VIEW_MENU;

// Main function called by the default view.html template
function StartView() {
    var dia = new Dialog();
    detectMobile();
    $(body).css({'overflow-x':'hidden'});
    // Just to see if webgl is supported:
    var testCanvas = document.getElementById("gltest");
    // I think the webgl viewer crashes.
    // Maybe it is the texture leak I have seen in connectome.
    // Just use the canvas for now.
    // I have been getting crashes I attribute to not freeing texture
    // memory properly.
    // NOTE: I am getting similar crashe with the canvas too.
    // Stack is running out of some resource.
    //if ( ! MOBILE_DEVICE && doesBrowserSupportWebGL(testCanvas)) {
    // initGL(); // Sets CANVAS and GL global variables
    //} else {
      initGC();
    //}
    EVENT_MANAGER = new EventManager(CANVAS);



    NAVIGATION_WIDGET = new NavigationWidget();
    if (MOBILE_DEVICE) {
        MOBILE_ANNOTATION_WIDGET = new MobileAnnotationWidget();
    }
    InitViews();
    InitViewBrowser();
    InitDualViewWidget();
    InitNotesWidget();
    InitRecorderWidget();

    // Do not let guests create favorites.
    if (USER != "") {
        FAVORITES_WIDGET = new FavoritesWidget();
        FAVORITES_WIDGET.resize(CANVAS.innerWidth());
    }

    if (MOBILE_DEVICE) {
        NAVIGATION_WIDGET.SetVisibility(false);
        MOBILE_ANNOTATION_WIDGET.SetVisibility(false);
        //VIEWER1.AddGuiObject(MOBILE_ANNOTATION_WIDGET.MenuFavoriteButton, "Bottom", 0, "Left", 0);
    } else {
        VIEWER1.AddGuiObject(NAVIGATION_WIDGET.Div, "Bottom", 0, "Left", 50);
    }

    //CONFERENCE_WIDGET = new ConferenceWidget();

    $(window).resize(function() {
        handleResize();
    }).trigger('resize');

    // Events are not received by the viewers.
    //var can = VIEW_PANEL[0];
    //can.addEventListener("touchstart", handleTouchStart, false);
    //can.addEventListener("touchmove", handleTouchMove, true);
    //can.addEventListener("touchend", handleTouchEnd, false);
    //document.body.addEventListener("mouseup", handleMouseUp, false);
    //document.body.addEventListener("touchcancel", handleTouchCancel, false);

    // The event manager still handles stack alignment.
    // This should be moved to a stack helper class.
    // Undo and redo too.
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    // Keep the browser from showing the left click menu.
    document.oncontextmenu = cancelContextMenu;


    var annotationWidget1 = new AnnotationWidget(VIEWER1);
    annotationWidget1.SetVisibility(2);
    var annotationWidget2 = new AnnotationWidget(VIEWER2);
    annotationWidget1.SetVisibility(2);
    handleResize();
    DualViewUpdateGui();

    if ( ! MOBILE_DEVICE) {
        InitSlideSelector();
        var viewMenu1 = new ViewEditMenu(VIEWER1);
        VIEW_MENU = viewMenu1;
        var viewMenu2 = new ViewEditMenu(VIEWER2);
    }/**/

    eventuallyRender();
}


