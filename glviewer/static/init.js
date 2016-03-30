
// Firefox does not set which for mouse move events.
function saFirefoxWhich(event) {
    event.which = event.buttons;
    if (event.which == 2) {
        event.which = 3;
    } else if (event.which == 3) {
        event.which = 2;
    }
}

function saDebug(msg) {
    console.log(msg);
}

// for debugging
function MOVE_TO(x,y) {
  SA.DualDisplay.Viewers[0].MainView.Camera.SetFocalPoint([x,y]);
  SA.DualDisplay.Viewers[0].MainView.Camera.ComputeMatrix();
  eventuallyRender();
}

function ZERO_PAD(i, n) {
    var s = "0000000000" + i.toFixed();
    return s.slice(-n);
}

// This file contains some global variables and misc procedures to
// initials shaders and some buffers we need and to render.
// Main function called by the default view.html template
// SA global will be set to this object.
function SlideAtlas() {
    // For managing progress with multiple ajax calls.
    this.ProgressCount = 0;

    this.TileLoader = "http";
    // How can we distribute the initialization of these?
    // TODO: Many of these are not used anymore. Clean them up.
    this.TimeStamp = 0;
    this.NumberOfTiles = 0;
    this.NumberOfTextures = 0;
    this.MaximumNumberOfTiles = 50000;
    this.MaximumNumberOfTextures = 5000;
    this.PruneTimeTiles = 0;
    this.PruneTimeTextures = 0;

    // Keep a queue of tiles to load so we can sort them as
    // new requests come in.
    this.LoadQueue = [];
    this.LoadingCount = 0;
    this.LoadingMaximum = 10;
    this.LoadTimeoutId = 0;

    this.LoadProgressMax = 0;
    this.ProgressBar = null;

    // Only used for saving images right now.
    this.FinishedLoadingCallbacks = [];

    this.Caches = [];
    this.StartInteractionListeners = [];
}

SlideAtlas.prototype.PushProgress = function() {
    $('body').css({'cursor':'progress'});
    this.ProgressCount += 1;
}

SlideAtlas.prototype.PopProgress = function() {
    this.ProgressCount -= 1;
    if (this.ProgressCount <= 0) {
        $('body').css({'cursor':'default'});
    }
}

// Main function called by the default view.html template
// SA global will be set to this object.
SlideAtlas.prototype.Run = function() {
    self = this;
    if (this.SessionId) {
        $.ajax({
            type: "get",
            url: this.SessionUrl+"?json=true&sessid="+this.SessionId,
            success: function(data,status) {
                self.Session = data;
                self.HideAnnotations = data.hide;
                // TODO: fix this serialization.
                self.Run2();
            },
            error: function() {
                saDebug("AJAX - error() : session" );
                self.Run2();
            },
        });
    } else {
        this.Run2();
    }
}


// Now we have the session (if the id was passed in).
SlideAtlas.prototype.Run2 = function() {
    self = this;
    // Get the root note.
    if (this.ViewId == "" || this.ViewId == "None") {
        delete this.ViewId;
    }
    if (this.SessionId == "" ||this.SessionId == "None") {
        delete this.SessionId;
    }

    // We need to get the view so we know how to initialize the app.
    var rootNote = new Note();

    // Hack to create a new presenation.
    if ( this.ViewId == "presentation") {
        var title = window.prompt("Please enter the presentation title.",
                                  "SlideShow");
        if (title == null) {
            // Go back in browser?
            return;
        }
        rootNote.Title = title;
        rootNote.HiddenTitle = title;
        rootNote.Text = "";
        rootNote.Type = "HTML";

        Main(rootNote);
    } else {
        if (this.ViewId == "") {
            saDebug("Missing view id");
            return;
        }
        // Sort of a hack that we rely on main getting called after this
        // method returns and other variables of SA are initialize.
        rootNote.LoadViewId(this.ViewId,
                            function () {Main(rootNote);});
    }
}

// Stack editing stuff (should not be in the global class).
// It used to be in the event manager.  Skipping the focus stuff.
// TODO:
// Modifier could be handled better with keypress events.
SlideAtlas.prototype.HandleKeyDownStack = function(event) {
    if ( this.ContentEditableHasFocus) {return true;}
    
    if (event.keyCode == 16) {
        // Shift key modifier.
        this.ShiftKeyPressed = true;
        // Do not forward modifier keys events to objects that consume keypresses.
        return true;
    }
    if (event.keyCode == 17) {
        // Control key modifier.
        this.ControlKeyPressed = true;
        return true;
    }

    // Handle undo and redo (cntrl-z, cntrl-y)
    if (this.ControlKeyPressed && event.keyCode == 90) {
        // Function in recordWidget.
        UndoState();
        return false;
    } else if (this.ControlKeyPressed && event.keyCode == 89) {
        // Function in recordWidget.
        RedoState();
        return false;
    }

    if (SA.Presentation) {
        SA.Presentation.HandleKeyDown(event);
        return true;
    }

    return true;
}

SlideAtlas.prototype.HandleKeyUpStack = function(event) {
    if ( this.ContentEditableHasFocus) {return true;} 

    // For debugging deformable alignment in stacks.
    if (event.keyCode == 90) { // z = 90
        if (event.shiftKey) {
            DeformableAlignViewers();
            return true;
        }
    }

    // It is sort of a hack to check for the cursor mode here, but it
    // affects both viewers.
    if (event.keyCode == 88) { // x = 88
        // I am using the 'c' key to display to focal point cursor
        //this.StackCursorFlag = false;
        // what a pain.  Holding x down sometimes blocks mouse events.
        // Have to change to toggle.
        this.StackCursorFlag =  ! this.StackCursorFlag;
        if (event.shiftKey && this.StackCursorFlag) {
            testAlignTranslation();
            var self = this;
            window.setTimeout(function() {self.StackCursorFlag = false;}, 1000);
        }

        eventuallyRender();
        return false;
    }

    if (event.keyCode == 16) {
        // Shift key modifier.
        this.ShiftKeyPressed = false;
        //this.StackCursorFlag = false;
    } else if (event.keyCode == 17) {
        // Control key modifier.
        this.ControlKeyPressed = false;
    }

    // Is this really necessary?
    // TODO: Try to remove this and test presentation stuff.
    if (this.Presentation) {
        this.Presentation.HandleKeyUp(event);
        return true;
    }

    return true;
}

// TODO: THis should be in viewer.
SlideAtlas.prototype.OnStartInteraction = function(callback) {
  this.StartInteractionListeners.push(callback);
}

SlideAtlas.prototype.TriggerStartInteraction = function() {
    if ( ! this.StartInteractionListeners) { return; }
    for (var i = 0; i < this.StartInteractionListeners.length; ++i) {
        callback = this.StartInteractionListeners[i];
        callback();
    }
}

// length units = meters
SlideAtlas.prototype.DistanceToString = function(length) {
    var lengthStr = "";
    if (length < 0.001) {
        // Latin-1 00B5 is micro sign
        lengthStr += (length*1e6).toFixed(2) + " \xB5m";
    } else if (length < 0.01) {
        lengthStr += (length*1e3).toFixed(2) + " mm";
    } else if (length < 1.0)  {
        lengthStr += (length*1e2).toFixed(2) + " cm";
    } else if (length < 1000) {
        lengthStr += (length).toFixed(2) + " m";
    } else {
        lengthStr += (length).toFixed(2) + " km";
    }
    return lengthStr;
}

SlideAtlas.prototype.StringToDistance = function(lengthStr) {
    var length = 0;
    lengthStr = lengthStr.trim(); // remove leading and trailing spaces.
    var len = lengthStr.length;
    // Convert to microns
    if (lengthStr.substring(len-2,len) == "\xB5m") {
        length = parseFloat(lengthStr.substring(0,len-2)) / 1e6;
    } else if (lengthStr.substring(len-2,len) == "mm") { 
        length = parseFloat(lengthStr.substring(0,len-2)) / 1e3;
    } else if (lengthStr.substring(len-2,len) == "cm") { 
        length = parseFloat(lengthStr.substring(0,len-2)) / 1e2;
    } else if (lengthStr.substring(len-2,len) == " m") { 
        length = parseFloat(lengthStr.substring(0,len-2));
    } else if (lengthStr.substring(len-2,len) == "km") { 
        length = parseFloat(lengthStr.substring(0,len-2)) * 1e3;
    }

    return length;
}



var SA = SA || new SlideAtlas();
var ROOT_DIV;
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
        SA.MaximumNumberOfTiles = 5000;
    }

    return MOBILE_DEVICE;
}


// This global is used in every class that renders something.
// I can not test multiple canvases until I modularize the canvas
// and get rid of these globals.
// WebGL context
var GL;

function GetUser() {
    if (typeof(SA.User) != "undefined") {
        return SA.User;
    }
    saDebug("Could not find user");
    return "";
}


function GetViewId () {
    if (typeof(SA.ViewId) != "undefined") {
        return SA.ViewId;
    }
    if ( ! SA.NotesWidget && ! SA.NotesWidget.RootNote) {
        return SA.NotesWidget.RootNote._id;
    }
    saDebug("Could not find view id");
    return "";
}

// WebGL Initializationf

function doesBrowserSupportWebGL(canvas) {
    try {
        //GL = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        GL = canvas.getContext("webgl");
    } catch (e) {
    }
    if (!GL) {
        //saDebug("Could not initialise WebGL, sorry :-(");
        return false;
    }
   return true;
}


function initGL() {

    // Add a new canvas.
    CANVAS = $('<canvas>').appendTo('body').addClass("sa-view-canvas"); // class='fillin nodoubleclick'
    //this.canvas.onselectstart = function() {return false;};
    //this.canvas.onmousedown = function() {return false;};
    GL = CANVAS[0].getContext("webgl") || CANVAS[0].getContext("experimental-webgl");

    // Defined in HTML
    initShaderPrograms();
    initOutlineBuffers();
    initImageTileBuffers();
    GL.clearColor(1.0, 1.0, 1.0, 1.0);
    GL.enable(GL.DEPTH_TEST);

    VIEW_PANEL = $('<div>')
        .appendTo('body')
        .addClass("sa-view-canvas-panel")
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
        saDebug(gl.getShaderInfoLog(shader));
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
        saDebug("Could not initialise shaders");
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



// TODO: Get rid of this as legacy.
// I put an eveutallyRender method in the viewer, but have not completely
// converted code yet.
// Stuff for drawing
var RENDER_PENDING = false;
function eventuallyRender() {
    if (! RENDER_PENDING) {
      RENDER_PENDING = true;
      requestAnimFrame(tick);
    }
}

function tick() {
    //console.timeEnd("system");
    RENDER_PENDING = false;
    draw();
    //console.time("system");
}




//==============================================================================
// Alternative to webgl, HTML5 2d canvas


function initGC() {

    detectMobile();

    // Add a new canvas.
    CANVAS = $('<div>')
        .appendTo('body').addClass("sa-view-canvas");

    VIEW_PANEL = $('<div>')
        .appendTo('body')
        .addClass("sa-view-canvas-panel");
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
var CONFERENCE_WIDGET;
var FAVORITES_WIDGET;
var MOBILE_ANNOTATION_WIDGET;

//==============================================================================


// hack to avoid an undefined error (until we unify annotation stuff).
function ShowAnnotationEditMenu(x, y) {
}


// TODO:  Put this into the dual view widget.
// Getting resize right was a major pain.
function handleResize() {
    
    var width = CANVAS.width();
    var height = CANVAS.height();

    if(MOBILE_DEVICE == 'iPad'){
      width = window.innerWidth;
      height = window.innerHeight;
      CANVAS.height(height);

      document.documentElement.setAttribute('height', height + "px");
    }

    if(height == 0){
      height = window.innerHeight;
    }

    if (GL) {
        VIEW_PANEL[0].width = width;
        VIEW_PANEL[0].height = height;
        //gl.viewportWidth = canvas.width;
        //gl.viewportHeight = canvas.height;
        GL.viewport(0, 0, width, height);
    } // GL.SetViewport does the work for 2d canvases.

    // Handle resizing of the favorites bar.
    // TODO: Make a resize callback.
    if(FAVORITES_WIDGET != undefined){
        FAVORITES_WIDGET.HandleResize(width);
    }

    // we set the left border to leave space for the notes window.
    var viewPanelLeft = 0;
    if (SA.NotesWidget) {
        viewPanelLeft = SA.NotesWidget.Width;
        SA.NotesWidget.Resize(viewPanelLeft,height);
    }
    if (SA.Presentation) {
        viewPanelLeft = SA.Presentation.ResizePanel.Width
    }

    var viewPanelWidth = width - viewPanelLeft;
    // TODO: let css size the viewers.
    // The remaining width is split between the two viewers.
    var width1 = viewPanelWidth;
    if (SA.DualDisplay) {
        width1 = viewPanelWidth * SA.DualDisplay.Viewer1Fraction;
    }
    var width2 = viewPanelWidth - width1;

    if (GL) {
        // HACK:  view positioning is half managed by browser (VIEW_PANEL)
        // and half by this resize viewport chain.  I want to get rid of the
        // viewport completely, but until then, I have to manage both.
        // Make the CANVAS match VIEW_PANEL.  Note:  I do not want to create
        // a separate webgl canvas for each view because thay cannot share
        // texture images.
        VIEW_PANEL.css({"left":viewPanelLeft});
    }

    // Setup the view panel div to be the same as the two viewers.
    if (VIEW_PANEL) {
        VIEW_PANEL.css({'left': viewPanelLeft+'px',
                        'width': viewPanelWidth+'px'});
    }

    // TODO: Make a multi-view object.
    // TODO: Let css handle positioning the viewers.
    //       This call positions the overview and still affect the main view.
    if (SA.DualDisplay.Viewers[0]) {
        SA.DualDisplay.Viewers[0].SetViewport([0, 0, width1, height]);
        eventuallyRender();
    }
    if (SA.DualDisplay.Viewers[1]) {
        SA.DualDisplay.Viewers[1].SetViewport([width1, 0, width2, height]);
        eventuallyRender();
    }
}


// Hack mutex. iPad2 must execute multiple draw callbacks at the same time
// in different threads.
// This was not actually the problem.  iPad had a bug in the javascript interpreter.
var DRAWING = false;
function draw() {
    if (DRAWING) { return; }
    DRAWING = true;
    if (SA.DualDisplay) {
        SA.DualDisplay.Draw();
    }
    DRAWING = false;
}

// The event manager detects single right click and double right click.
// This gets galled on the single.
function ShowPropertiesMenu(x, y) {} // This used to show the view edit.
// I am getting rid of the right click feature now.

// TODO: Move these out of the global SLideAtlas object.
function handleKeyDown(event) {
    return SA.HandleKeyDownStack(event);
}
function handleKeyUp(event) {
    return SA.HandleKeyUpStack(event);
}

function cancelContextMenu(e) {
    //alert("Try to cancel context menu");
    if (e && e.stopPropagation) {
        e.stopPropagation();
    }
    return false;
}



// Call back from NotesWidget.
function NotesModified() {
    if (SA.Edit && SA.SaveButton) {
        SA.SaveButton.attr('src',SA.ImagePathUrl+"save.png");
    }
}

function NotesNotModified() {
    if (SA.Edit && SA.SaveButton) {
        SA.SaveButton.attr('src',SA.ImagePathUrl+"save22.png");
    }
}

// This function gets called when the save button is pressed.
function SaveCallback() {
    // TODO: This is no longer called by a button, so change its name.
    SA.NotesWidget.SaveCallback(
        function () {
            // finished
            SA.SaveButton.attr('src',SA.ImagePathUrl+"save22.png");
        });
}


// This serializes loading a bit, but we need to know what type the note is
// so we can coustomize the webApp.  The server could pass the type to us.
// It might speed up loading.
// Note is the same as a view.
function Main(rootNote) {
    SA.RootNote = rootNote;

    if (rootNote.Type == "Presentation" ||
        rootNote.Type == "HTML") {
        SA.Presentation = new Presentation(rootNote, SA.Edit);
        return;
    }

    detectMobile();
    $(body).addClass("sa-view-body");
    // Just to see if webgl is supported:
    //var testCanvas = document.getElementById("gltest");

    // I think the webgl viewer crashes.
    // Maybe it is the texture leak I have seen in connectome.
    // Just use the canvas for now.
    // I have been getting crashes I attribute to not freeing texture
    // memory properly.
    // NOTE: I am getting similar crashe with the canvas too.
    // Stack is running out of some resource.
    if ( ! MOBILE_DEVICE && false) { // && doesBrowserSupportWebGL(testCanvas)) {
        initGL(); // Sets CANVAS and GL global variables
    } else {
        initGC();
    }

    SA.DualDisplay = new DualViewWidget(VIEW_PANEL);

    if (rootNote.Type == "Stack") {
        SA.DualDisplay.SetNumberOfViewers(2);
    }
    // TODO: Is this really needed here?  Try it at the end.
    handleResize();

    // TODO: Get rid of this global variable.
    if (MOBILE_DEVICE && MOBILE_ANNOTATION_WIDGET) {
        MOBILE_ANNOTATION_WIDGET = new MobileAnnotationWidget();
    }

    SA.NotesWidget = new NotesWidget(VIEW_PANEL,SA.DualDisplay);
    SA.NotesWidget.SetModifiedCallback(NotesModified);
    SA.NotesWidget.SetModifiedClearCallback(NotesNotModified);
    // Navigation widget keeps track of which note is current.
    // Notes widget needs to access and change this.
    SA.NotesWidget.SetNavigationWidget(SA.DualDisplay.NavigationWidget);
    if (SA.DualDisplay.NavigationWidget) {
      SA.DualDisplay.NavigationWidget.SetInteractionEnabled(true);
    }

    new RecorderWidget(SA.DualDisplay);

    SA.DualDisplay.SetNote(rootNote);

    // Do not let guests create favorites.
    // TODO: Rework how favorites behave on mobile devices.
    if (SA.User != "" && ! MOBILE_DEVICE) {
        if ( SA.Edit) {
            // Put a save button here when editing.
            SA.SaveButton = $('<img>')
                .appendTo(VIEW_PANEL)
                .css({'position':'absolute',
                      'bottom':'4px',
                      'left':'10px',
                      'height': '28px',
                      'z-index': '5'})
                .prop('title', "save to databse")
                .addClass('editButton')
                .attr('src',SA.ImagePathUrl+"save22.png")
                .click(SaveCallback);
            for (var i = 0; i < SA.DualDisplay.Viewers.length; ++i) {
                SA.DualDisplay.Viewers[i].OnInteraction(
                    function () {SA.NotesWidget.RecordView();});
            }
        } else {
            // Favorites when not editing.
            FAVORITES_WIDGET = new FavoritesWidget(VIEW_PANEL, SA.DualDisplay);
            FAVORITES_WIDGET.HandleResize(CANVAS.innerWidth());
        }
    }

    if (MOBILE_DEVICE && SA.DualDisplay && 
        SA.DualDisplay.NavigationWidget) {
        SA.DualDisplay.NavigationWidget.SetVisibility(false);
    }
    if (MOBILE_DEVICE && MOBILE_ANNOTATION_WIDGET) {
        MOBILE_ANNOTATION_WIDGET.SetVisibility(false);
    }

    //CONFERENCE_WIDGET = new ConferenceWidget();

    // The event manager still handles stack alignment.
    // This should be moved to a stack helper class.
    // Undo and redo too.
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    // Keep the browser from showing the left click menu.
    document.oncontextmenu = cancelContextMenu;

    if ( ! MOBILE_DEVICE) {
        // Hack for all viewer edit menus to share browser.
        VIEW_BROWSER = new ViewBrowser($('body'));

        // TODO: See if we can get rid of this, or combine it with
        // the view browser.
        InitSlideSelector(VIEW_PANEL); // What is this?
        var viewMenu1 = new ViewEditMenu(SA.DualDisplay.Viewers[0],
                                         SA.DualDisplay.Viewers[1]);
        var viewMenu2 = new ViewEditMenu(SA.DualDisplay.Viewers[1],
                                         SA.DualDisplay.Viewers[0]);

        var annotationWidget1 = new AnnotationWidget(SA.DualDisplay.Viewers[0]);
        annotationWidget1.SetVisibility(2);
        var annotationWidget2 = new AnnotationWidget(SA.DualDisplay.Viewers[1]);
        annotationWidget1.SetVisibility(2);
        SA.DualDisplay.UpdateGui();
    }

    $(window).bind('orientationchange', function(event) {
        handleResize();
    });

    $(window).resize(function() {
        handleResize();
    }).trigger('resize');

    eventuallyRender();
}


// I had to prune all the annotations (lassos) that were not visible.
function keepVisible(){
  var n = SA.DualDisplay.GetNote();
  var r = n.ViewerRecords[n.StartIndex];
  var w = VIEWER1.WidgetList;
  var c = VIEWER1.GetCamera();
  var b =c.GetBounds();
  for(var i= 0; i<r.Annotations.length; ++i) {
    if (r.Annotations[i].type != 'lasso') {
      r.Annotations.splice(i,1);
      --i;
    } else {
      var pt = r.Annotations[i].points[0];
      if ( ! pt || pt[0] < b[0] || pt[0] > b[1] || pt[1] < b[2] || pt[1] >
  b[3]) {
        r.Annotations.splice(i,1);
        --i;
      }
    }
  }
  for(var i= 0; i<w.length; ++i) {
    if ( ! w[i] instanceof LassoWidget || ! w[i].Loop) {
      w.splice(i,1);
      --i;
    } else {
      var pt = w[i].Loop.Points[0];
      if ( ! pt || pt[0] < b[0] || pt[0] > b[1] || pt[1] < b[2] || pt[1] >
  b[3]) {
        w.splice(i,1);
        --i;
      }
    }
  }
}
