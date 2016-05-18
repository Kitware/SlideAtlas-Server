var SA = window.SA || {};
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


window.requestAnimationFrame = 
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||             
    window.msRequestAnimationFrame;

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
    if (SA.DualDisplay) {
        SA.DualDisplay.Draw();
    }
}

function ZERO_PAD(i, n) {
    var s = "0000000000" + i.toFixed();
    return s.slice(-n);
}


(function () {
    "use strict";

    // This file contains some global variables and misc procedures to
    // initials shaders and some buffers we need and to render.
    // Main function called by the default view.html template
    // SA global will be set to this object.

    // For managing progress with multiple ajax calls.
    SA.ProgressCount = 0;

    SA.TileLoader = "http";
    // How can we distribute the initialization of these?
    // TODO: Many of these are not used anymore. Clean them up.
    SA.TimeStamp = 0;
    SA.NumberOfTiles = 0;
    SA.NumberOfTextures = 0;
    SA.MaximumNumberOfTiles = 50000;
    SA.MaximumNumberOfTextures = 5000;
    SA.PruneTimeTiles = 0;
    SA.PruneTimeTextures = 0;

    // Keep a queue of tiles to load so we can sort them as
    // new requests come in.
    SA.LoadQueue = [];
    SA.LoadingCount = 0;
    SA.LoadingMaximum = 10;
    SA.LoadTimeoutId = 0;

    SA.LoadProgressMax = 0;
    SA.ProgressBar = null;

    // Only used for saving images right now.
    SA.FinishedLoadingCallbacks = [];

    SA.Caches = [];

    SA.StartInteractionListeners = [];


    SA.PushProgress = function() {
        $('body').css({'cursor':'progress'});
        SA.ProgressCount += 1;
    }

    SA.PopProgress = function() {
        SA.ProgressCount -= 1;
        if (SA.ProgressCount <= 0) {
            $('body').css({'cursor':'default'});
        }
    }

    // Main function called by the default view.html template
    // SA global will be set to this object.
    SA.Run = function() {
        self = SA;
        if (SA.SessionId) {
            $.ajax({
                type: "get",
                url: SA.SessionUrl+"?json=true&sessid="+SA.SessionId,
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
            SA.Run2();
        }
    }


    // Now we have the session (if the id was passed in).
    SA.Run2 = function() {
        self = SA;
        // Get the root note.
        if (SA.ViewId == "" || SA.ViewId == "None") {
            delete SA.ViewId;
        }
        if (SA.SessionId == "" ||SA.SessionId == "None") {
            delete SA.SessionId;
        }

        // We need to get the view so we know how to initialize the app.
        var rootNote = new SA.Note();

        // Hack to create a new presenation.
        if ( SA.ViewId == "presentation") {
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
            if (SA.ViewId == "") {
                saDebug("Missing view id");
                return;
            }
            // Sort of a hack that we rely on main getting called after SA
            // method returns and other variables of SA are initialize.
        rootNote.LoadViewId(SA.ViewId,
                            function () {Main(rootNote);});
        }
    }

    // Stack editing stuff (should not be in the global class).
    // It used to be in the event manager.  Skipping the focus stuff.
    // TODO:
    // Modifier could be handled better with keypress events.
    SA.HandleKeyDownStack = function(event) {
        if ( SA.ContentEditableHasFocus) {return true;}

        if (event.keyCode == 16) {
            // Shift key modifier.
            SA.ShiftKeyPressed = true;
            // Do not forward modifier keys events to objects that consume keypresses.
            return true;
        }
        if (event.keyCode == 17) {
            // Control key modifier.
            SA.ControlKeyPressed = true;
            return true;
        }

        // Handle undo and redo (cntrl-z, cntrl-y)
        if (SA.ControlKeyPressed && event.keyCode == 90) {
            // Function in recordWidget.
            UndoState();
            return false;
        } else if (SA.ControlKeyPressed && event.keyCode == 89) {
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

    SA.HandleKeyUpStack = function(event) {
        if ( SA.ContentEditableHasFocus) {return true;}

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
            //SA.StackCursorFlag = false;
            // what a pain.  Holding x down sometimes blocks mouse events.
            // Have to change to toggle.
            SA.StackCursorFlag =  ! SA.StackCursorFlag;
            if (event.shiftKey && SA.StackCursorFlag) {
                testAlignTranslation();
                var self = SA;
                window.setTimeout(function() {self.StackCursorFlag = false;}, 1000);
            }

            return false;
        }

        if (event.keyCode == 16) {
            // Shift key modifier.
            SA.ShiftKeyPressed = false;
            //SA.StackCursorFlag = false;
        } else if (event.keyCode == 17) {
            // Control key modifier.
            SA.ControlKeyPressed = false;
        }

        // Is SA really necessary?
        // TODO: Try to remove SA and test presentation stuff.
        if (SA.Presentation) {
            SA.Presentation.HandleKeyUp(event);
            return true;
        }

        return true;
    }

    // TODO: SA should be in viewer.
    SA.OnStartInteraction = function(callback) {
        SA.StartInteractionListeners.push(callback);
    }

    SA.TriggerStartInteraction = function() {
        if ( ! SA.StartInteractionListeners) { return; }
        for (var i = 0; i < SA.StartInteractionListeners.length; ++i) {
            callback = SA.StartInteractionListeners[i];
            callback();
        }
    }

    // TODO: These should be moved to viewer-utils so they can be used
    // separately from SlideAtlas.
    // Helper function: Looks for a key phase in the text.
    // first == true: Look only at the start. Returns true if found. 
    // first == false: return index of tag or -1;
    SA.TagCompare = function (tag,text,first) {
        if (first) {
            return (tag.toUpperCase() ==
                    text.substring(0,tag.length).toUpperCase());
        }
        return text.toUpperCase().search(tag.toUpperCase());
    }

    // Process HTML to add standard tags.
    // Returns the altered html.
    // I am writting SA to be safe to call multiple times.
    // Depth first traversal of tree.
    SA.AddHtmlTags = function(item) {
        var container = undefined;
        var tags = [{string:"History:",               class:"sa-history"},
                    {string:"Diagnosis:",             class:"sa-diagnosis"},
                    {string:"Differential Diagnosis:",class:"sa-differential-diagnosis"},
                    {string:"Teaching Points:",       class:"sa-teaching-points"},
                    {string:"Compare with:",          class:"sa-compare"},
                    {string:"Notes:",                 class:"sa-notes"}];

        // Since text concatinates children,
        // containers only have to consume siblings.
        var children = item.children();
        for (var i = 0; i < children.length; ++i) {
            var child = $(children[i]);
            
            // Look for an existing class from our set. 
            // If we find one, terminate processing for the item and ites children.
            // Terminate the container collecting items.
            var foundTag = undefined;
            for (var j = 0; j < tags.length; ++j) {
                if (child.hasClass(tags[j].class)) {
                foundTag = tags[j];
                }
            }
            if (foundTag) {
                container = undefined;
                continue;
            }

            // special  (one line tag)
            if (child.hasClass('sa-ssc-title')) {
                container = undefined;
                continue;
            }

            // Look for a tag string inthe text
            var text = child.text();
            // Special case: treat the title as a single line.
            if (SA.TagCompare('SSC', text, true) && !child.hasClass('sa-ssc-title')) {
                child.addClass('sa-ssc-title');
            }

            // Make sure tags are not grouped.
            // SA is a bit of a hack.  THere are too many ways html can be formatted.
            if (child.children().length > 1) {
                for (var j = 0; j < tags.length; ++j) {
                    var tag = tags[j];
                    if (SA.TagCompare(tag.string, text, false) > 0) {
                        var grandChildren = child.children();
                        grandChildren.remove();
                        grandChildren.insertAfter(child);
                        children = item.children();
                        text = child.text();
                        break;
                    }
                }
            }

            // These tags consume children followint the tag.
            var foundTag = false;
            for (var j = 0; j < tags.length; ++j) {
                var tag = tags[j];
                if (SA.TagCompare(tag.string, text, true)) {
                    foundTag = tag;
                    break;
                }
            }

            if (foundTag) {
                // If the outer is a div,  reuse it for the container.
                // There was a bug with diagnosis in the history container.
                // This will ungroup multiple tags. However recursion may be
                // needed.
                if (child[0].tagName == 'DIV') {
                    var grandChildren = child.children();
                    child.empty();
                    grandChildren.insertAfter(child);
                    children = item.children();
                    container = child;
                    ++i;
                    child = $(children[i]);
                } else {
                    // Start a new container.
                    container = $('<div>')
                        .insertBefore(child);
                    children = item.children();
                    // Manipulating a list we are traversing is a pain.
                    ++i;
                }
                container.addClass(foundTag.class);
            }

            // If we have a container, it consumes all items after it.
            if (container) {
                // Remove the item and add it to the container.
                child.remove();
                child.appendTo(container);
                children = item.children();
                // Manipulating a list we are traversing is a pain.
                --i;
            }
        }
    }


    // Useful utility to get selected text / the position of the cursor.
    // Get the selection in div.  Returns a range.
    // If not, the range is collapsed at the 
    // end of the text and a new line is added.
    // div is a jquery parent.
    SA.GetSelectionRange = function(div) {
        var sel = window.getSelection();
        var range;
        var parent = null;

        // Two conditions when we have to create a selection:
        // nothing selected, and something selected in wrong parent.
        // use parent as a flag.
        if (sel.rangeCount > 0) {
            // Something is selected
            range = sel.getRangeAt(0);
            range.noCursor = false;
            // Make sure the selection / cursor is in this editor.
            parent = range.commonAncestorContainer;
            // I could use jquery .parents(), but I bet this is more efficient.
            while (parent && parent != div[0]) {
                //if ( ! parent) {
                // I believe this happens when outside text is selected.
                // We should we treat this case like nothing is selected.
                //console.log("Wrong parent");
                //return;
                //}
                if (parent) {
                    parent = parent.parentNode;
                }
            }
        }
        if ( ! parent) {
            return null;
            //returnSA.MakeSelectionRange(div);
        }

        return range;
    }

    // When we are inserting at the end and nothing is selected, we need to
    // add a div with a break at the end and select the break. This keeps the
    // cursor after the inserted item. This returns the range.
    SA.MakeSelectionRange = function(div) {
        // When nothing is select, I am trying to make the cursor stay
        // after the question inserted with the range we return.
        // TODO: change this so that the div is added after the dialog
        // apply. Cancel should leave div unchanged.(AddQuestion)
        var sel = window.getSelection();

        div[0].focus();
        var br = $('<br>').appendTo(div);
        range = document.createRange();
        range.selectNode(br[0]);
        sel.removeAllRanges();
        sel.addRange(range);
        return range;
    }


})();



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
    var gl;
    try {
        //gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        gl = canvas.getContext("webgl");
    } catch (e) {
    }
    if (!gl) {
        //saDebug("Could not initialise WebGL, sorry :-(");
        return null;
    }
   return gl;
}


function initGL() {

    // Add a new canvas.
    CANVAS = $('<canvas>').appendTo('body').addClass("sa-view-canvas"); // class='fillin nodoubleclick'
    //this.canvas.onselectstart = function() {return false;};
    //this.canvas.onmousedown = function() {return false;};
    var gl = CANVAS[0].getContext("webgl") || CANVAS[0].getContext("experimental-webgl");

    if (gl) {
        // Defined in HTML
        initShaderPrograms();
        initOutlineBuffers();
        initImageTileBuffers();
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(GL.DEPTH_TEST);
    }

    return gl;
}


function initWebGL(gl) {
    if (polyProgram) { return; }
    // Defined in HTML
    initShaderPrograms(gl);
    initOutlineBuffers(gl);
    initImageTileBuffers(gl);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
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


function initShaderPrograms(gl) {
    polyProgram = createProgram("shader-poly-fs", "shader-poly-vs", gl);
    polyProgram.colorUniform = gl.getUniformLocation(polyProgram, "uColor");

    imageProgram = createProgram("shader-tile-fs", "shader-tile-vs", gl);
    // Texture coordinate attribute and texture image uniform
    imageProgram.textureCoordAttribute
        = gl.getAttribLocation(imageProgram,"aTextureCoord");
    gl.enableVertexAttribArray(imageProgram.textureCoordAttribute);
    imageProgram.samplerUniform = gl.getUniformLocation(imageProgram, "uSampler");



    textProgram = createProgram("shader-text-fs", "shader-text-vs", gl);
    textProgram.textureCoordAttribute
        = gl.getAttribLocation(textProgram, "aTextureCoord");
    gl.enableVertexAttribArray(textProgram.textureCoordAttribute);
    textProgram.samplerUniform
        = gl.getUniformLocation(textProgram, "uSampler");
    textProgram.colorUniform = gl.getUniformLocation(textProgram, "uColor");
}


function createProgram(fragmentShaderID, vertexShaderID, gl) {
    var fragmentShader = getShader(gl, fragmentShaderID);
    var vertexShader = getShader(gl, vertexShaderID);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        saDebug("Could not initialise shaders");
    }

    program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);

    // Camera matrix
    program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
    // Model matrix
    program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");

    return program;
}

function initOutlineBuffers(gl) {
    // Outline Square
    vertices = [
        0.0,  0.0,  0.0,
        0.0,  1.0,  0.0,
        1.0, 1.0,  0.0,
        1.0, 0.0,  0.0,
        0.0, 0.0,  0.0];
    squareOutlinePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareOutlinePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareOutlinePositionBuffer.itemSize = 3;
    squareOutlinePositionBuffer.numItems = 5;

    // Filled square
    squarePositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squarePositionBuffer);
    vertices = [
        1.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        1.0,  0.0,  0.0,
        0.0,  0.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squarePositionBuffer.itemSize = 3;
    squarePositionBuffer.numItems = 4;
}




//==============================================================================



function initImageTileBuffers(gl) {
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

    tileVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tileVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
    tileVertexTextureCoordBuffer.itemSize = 2;
    tileVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

    tileVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tileVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    tileVertexPositionBuffer.itemSize = 3;
    tileVertexPositionBuffer.numItems = vertexPositionData.length / 3;

    tileCellBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tileCellBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), gl.STATIC_DRAW);
    tileCellBuffer.itemSize = 1;
    tileCellBuffer.numItems = cellData.length;
}



// TODO: Get rid of this as legacy.
// I put an eveutallyRender method in the viewer, but have not completely
// converted code yet.
// Stuff for drawing
//var RENDER_PENDING = false;
//function eventuallyRender() {
//    if (! RENDER_PENDING) {
//      RENDER_PENDING = true;
//      requestAnimFrame(tick);
//    }
//}

//function tick() {
//    //console.timeEnd("system");
//    RENDER_PENDING = false;
//    draw();
//    //console.time("system");
//}




//==============================================================================
// Alternative to webgl, HTML5 2d canvas


function initGC() {

    detectMobile();
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

var CONFERENCE_WIDGET;
var FAVORITES_WIDGET;
var MOBILE_ANNOTATION_WIDGET;

//==============================================================================


// hack to avoid an undefined error (until we unify annotation stuff).
function ShowAnnotationEditMenu(x, y) {
}


// TODO:  Get rid of this function.
function handleResize() {
    $('window').trigger('resize');
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

    // TODO: Get rid of this global variable.
    if (MOBILE_DEVICE && MOBILE_ANNOTATION_WIDGET) {
        MOBILE_ANNOTATION_WIDGET = new MobileAnnotationWidget();
    }


    SA.MainDiv = $('<div>')
        .appendTo('body')
        .css({
            'position':'fixed',
            'left':'0px',
            'width': '100%'})
        .saFullHeight();
        //.addClass("sa-view-canvas-panel")

    // Left panel for notes.
    SA.ResizePanel = new ResizePanel(SA.MainDiv);
    SA.DualDisplay = new DualViewWidget(SA.ResizePanel.MainDiv);
    SA.NotesWidget = new NotesWidget(SA.ResizePanel.PanelDiv,
                                     SA.DualDisplay);

    if (rootNote.Type == "Stack") {
        SA.DualDisplay.SetNumberOfViewers(2);
    }

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
                .appendTo(SA.ResizePanel.MainDiv)
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
            FAVORITES_WIDGET = new FavoritesWidget(SA.MainDiv, SA.DualDisplay);
            //FAVORITES_WIDGET.HandleResize(CANVAS.innerWidth());
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
        InitSlideSelector(SA.MainDiv); // What is this?
        var viewMenu1 = new ViewEditMenu(SA.DualDisplay.Viewers[0],
                                         SA.DualDisplay.Viewers[1]);
        var viewMenu2 = new ViewEditMenu(SA.DualDisplay.Viewers[1],
                                         SA.DualDisplay.Viewers[0]);
        var viewer = SA.DualDisplay.Viewers[0];
        var annotationWidget1 =
            new AnnotationWidget(viewer.GetAnnotationLayer(), viewer);
        annotationWidget1.SetVisibility(2);
        var viewer = SA.DualDisplay.Viewers[1];
        var annotationWidget2 =
            new AnnotationWidget(viewer.GetAnnotationLayer(), viewer);
        annotationWidget2.SetVisibility(2);
        SA.DualDisplay.UpdateGui();
    }

    $(window).bind('orientationchange', function(event) {
        handleResize();
    });

    $(window).resize(function() {
        handleResize();
    }).trigger('resize');

    if (SA.DualDisplay) {
        SA.DualDisplay.Draw();
    }
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
