window.SA = window.SA || {};


(function () {
    "use strict";


    var ROOT_DIV;
    SA.imageProgram;
    var textProgram;
    var polyProgram;
    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
    var squareOutlinePositionBuffer;
    var squarePositionBuffer;
    SA.tileVertexPositionBuffer;
    SA.tileVertexTextureCoordBuffer;
    SA.tileCellBuffer;

    window.requestAnimationFrame =
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame;


    // Put the user note text and annotions it the viewer without changing
    // the camera.  THis has the side effect of reloading the primary note
    // annotations, so the caller should record any new annotations in the
    // viewer before calling this.
    SA.UpdateUserNotes = function () {
        if (SA.notesWidget) {
            SA.notesWidget.UpdateUserNotes();
        }
        if (SA.display) {
            SA.display.UpdateUserNotes();
        }
    }

    // So many optional items have a SetNote(note) method, I decided to
    // have a global method to check each.
    SA.SetNote = function (note) {
        if (SA.notesWidget) {
            SA.notesWidget.SetNote(note);
        }
        if (SA.navigationWidget) {
            SA.navigationWidget.SetNote(note);
        }
        if (SA.display) {
            SA.display.SetNote(note);
        }
    }

    SA.SetNoteFromId = function(noteId) {
        var note = SA.GetNoteFromId(noteId);
        if ( ! note) {
            note = new SA.Note();
            note.LoadViewId(
                noteId,
                function () {
                    SA.SetNote(note);
                });
            return note;
        }
        SA.SetNote(note);
        return note;
    }

    // Firefox does not set which for mouse move events.
    SA.FirefoxWhich = function(event) {
        event.which = event.buttons;
        if (event.which == 2) {
            event.which = 3;
        } else if (event.which == 3) {
            event.which = 2;
        }
    }

    SA.Debug = function(msg) {
        console.log(msg);
    }

    // for debugging
    function MOVE_TO(x,y) {
        if (SA.display) {
            SA.display.Viewers[0].MainView.Camera.SetFocalPoint([x,y]);
            SA.display.Viewers[0].MainView.Camera.ComputeMatrix();
            SA.display.Draw();
        }
    }

    SA.ZERO_PAD = function(i, n) {
        var s = "0000000000" + i.toFixed();
        return s.slice(-n);
    }



    // This file contains some global variables and misc procedures to
    // initials shaders and some buffers we need and to render.
    // Main function called by the default view.html template
    // SA global will be set to this object.

    // For managing progress with multiple ajax calls.
    SA.ProgressCount = 0;

    // How can we distribute the initialization of these?
    // TODO: Many of these are not used anymore. Clean them up.

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
        SA.Running == true;
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
                    SA.Debug("AJAX - error() : session" );
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
                SA.Debug("Missing view id");
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
            SA.recorderWidget.UndoState();
            return false;
        } else if (SA.ControlKeyPressed && event.keyCode == 89) {
            // Function in recordWidget.
            SA.recorderWidget.RedoState();
            return false;
        }

        if (SA.presentation) {
            SA.presentation.HandleKeyDown(event);
            return true;
        }

        return true;
    }

    SA.HandleKeyUpStack = function(event) {
        if ( SA.ContentEditableHasFocus) {return true;}

        // For debugging deformable alignment in stacks.
        if (event.keyCode == 90) { // z = 90
            if (event.shiftKey) {
                SA.DeformableAlignViewers(false);
                return true;
            }
        }
        if (event.keyCode == 89) { // y = 89
            if (event.shiftKey) {
                SA.DeformableAlignViewers(true);
                return true;
            }
        }

        // It is sort of a hack to check for the cursor mode here, but it
        // affects both viewers.
        if (event.keyCode == 88) { // x = 88
            // I am using the 'x' key to display to focal point cursor
            //SA.StackCursorFlag = false;
            // what a pain.  Holding x down sometimes blocks mouse events.
            // Have to change to toggle.
            SA.StackCursorFlag =  ! SA.StackCursorFlag;
            if (event.shiftKey && SA.StackCursorFlag) {
                SA.testAlignTranslation();
                var self = SA;
                window.setTimeout(function() {self.StackCursorFlag = false;}, 1000);
            }

            SA.display.EventuallyRender();
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
        if (SA.presentation) {
            SA.presentation.HandleKeyUp(event);
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
                    // child.empty() // looses text that is not a child.
                    // child.contents()[0] gets it. Maybe make a span and
                    // put it after 'child'.
                    child.children().remove();
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
        var range = document.createRange();
        range.selectNode(br[0]);
        sel.removeAllRanges();
        sel.addRange(range);
        return range;
    }


    SA.GetUser = function() {
        if (typeof(SA.User) != "undefined") {
            return SA.User;
        }
        SA.Debug("Could not find user");
        return "";
    }


    //function GetViewId () {
    //    if (typeof(SA.ViewId) != "undefined") {
    //        return SA.ViewId;
    //    }
    //    if ( ! SA.notesWidget && ! SA.notesWidget.RootNote) {
    //        return SA.notesWidget.RootNote._id;
    //    }
    //    SA.Debug("Could not find view id");
    //    return "";
    //}

    // WebGL Initialization

    function doesBrowserSupportWebGL(canvas) {
        var gl;
        try {
            //gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            gl = canvas.getContext("webgl");
        } catch (e) {
        }
        if (!gl) {
            //SA.Debug("Could not initialise WebGL, sorry :-(");
            return null;
        }
        return gl;
    }


    SA.initWebGL = function (view) {
        //if (view.imageProgram) { return; }
        // Defined in HTML
        //initShaderPrograms(view.gl);
        //initOutlineBuffers(view.gl);
        initImageTileBuffers(view);
    }


    function getShader(gl, type, str) {
        var shader;
        shader = gl.createShader(type);
        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            SA.Debug(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

// Not used because annotations are all canvas.
// Might be useful in the future.
/*
<script id="shader-poly-fs" type="x-shader/x-fragment">
  precision mediump float;
  uniform vec3 uColor;
  void main(void) {
   gl_FragColor = vec4(uColor, 1.0);
   //gl_FragColor = vec4(0.5, 0.0, 0.0, 1.0);
  }
</script>
<script id="shader-poly-vs" type="x-shader/x-vertex">
  attribute vec3 aVertexPosition;
  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  }
</script>

<script id="shader-text-fs" type="x-shader/x-fragment">
  precision mediump float;

  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform vec3 uColor;

  void main(void) {
    vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    // Use the image pixel value as transparency.
    gl_FragColor = vec4(uColor, textureColor.rgb[0]);
  }
</script>
<script id="shader-text-vs" type="x-shader/x-vertex">
  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;

  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;

  varying vec2 vTextureCoord;
  void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
  }
*/


    function initShaderPrograms(gl) {

        // Test threshold value for alpha.
        var heatMapTestFragmentShaderString = 
            "precision highp float;" +
            "uniform sampler2D uSampler;" +
            "varying vec2 vTextureCoord;" +
            "void main(void) {" +
            "   vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));" +
            "   highp float value = textureColor.rgb[1] + textureColor.rgb[1] +textureColor.rgb[2];" +
            "   if (value < 0.3 || value > 2.5) {" +
            "     textureColor[0] = textureColor[1] = textureColor[2] = textureColor[3] = 0.0;" +
            "   }" +
            "   gl_FragColor = textureColor;" +
            " }";
        // Test red->alpha, greed->hue
        var heatMapHueFragmentShaderString = 
            "precision highp float;" +
            "uniform sampler2D uSampler;" +
            "varying vec2 vTextureCoord;" +
            "void main(void) {" +
            "  vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));" +
            "  textureColor[3] = textureColor[0];" +
            "  highp float h = textureColor[1] * 6.0;" +
            "  if (h < 1.0) {" +
            "    textureColor[0] = 1.0;" +
            "    textureColor[1] = h;" +
            "    textureColor[3] = 0.0;" +
            "  } else if (h < 2.0) {" +
            "    textureColor[0] = 2.0-h;" +
            "    textureColor[1] = 1.0;" +
            "    textureColor[3] = 0.0;" +
            "  } else if (h < 3.0) {" +
            "    textureColor[0] = 0.0;" +
            "    textureColor[1] = 1.0;" +
            "    textureColor[3] = h-2.0;" +
            "  } else if (h < 4.0) {" +
            "    textureColor[0] = 0.0;" +
            "    textureColor[1] = 4.0-h;" +
            "    textureColor[3] = 1.0;" +
            "  } else if (h < 5.0) {" +
            "    textureColor[0] = h-4.0;" +
            "    textureColor[1] = 0.0;" +
            "    textureColor[3] = 1.0;" +
            "  } else if (h < 6.0) {" +
            "    textureColor[0] = 1.0;" +
            "    textureColor[1] = 0.0;" +
            "    textureColor[3] = 6.0-h;" +
            "  }" +
            "  gl_FragColor = textureColor;" +
            "}";
        // Test red->alpha, constant color set externally
        var heatMapFragmentShaderString =
            "precision highp float;" +
            "uniform sampler2D uSampler;" +
            "uniform vec3 uColor;" +
            "varying vec2 vTextureCoord;" +
            "void main(void) {" +
            "  vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)).rgba;" +
            "  textureColor = vec4(uColor, textureColor[0]);" +
            "  gl_FragColor = textureColor;" +
            "}";
        var fragmentShaderString =
            "precision highp float;" +
            "uniform sampler2D uSampler;" +
            "varying vec2 vTextureCoord;" +
            "void main(void) {" +
            "   vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));" +
            "   gl_FragColor = textureColor;" +
            " }";
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

        //SA.imageProgram = SA.createWebGlProgram(fragmentShaderString, vertexShaderString, gl);
        view.imageProgram = SA.createWebGlProgram(heatMapFragmentShaderString, vertexShaderString, gl);
        // Texture coordinate attribute and texture image uniform
        view.imageProgram.textureCoordAttribute
            = gl.getAttribLocation(view.imageProgram,"aTextureCoord");
        gl.enableVertexAttribArray(view.imageProgram.textureCoordAttribute);
        view.imageProgram.samplerUniform = gl.getUniformLocation(view.imageProgram, "uSampler");
        view.imageProgram.colorUniform = gl.getUniformLocation(view.imageProgram, "uColor");


        //polyProgram = SA.createWebGlProgram("shader-poly-fs", "shader-poly-vs", gl);
        //polyProgram.colorUniform = gl.getUniformLocation(polyProgram, "uColor");

        //textProgram = SA.createWebGlProgram("shader-text-fs", "shader-text-vs", gl);
        //textProgram.textureCoordAttribute
        //    = gl.getAttribLocation(textProgram, "aTextureCoord");
        //gl.enableVertexAttribArray(textProgram.textureCoordAttribute);
        //textProgram.samplerUniform
        //    = gl.getUniformLocation(textProgram, "uSampler");
        //textProgram.colorUniform = gl.getUniformLocation(textProgram, "uColor");
    }

    
    SA.createWebGlProgram = function(fragmentShaderString, vertexShaderString, gl) {
        var fragmentShader = getShader(gl, gl.FRAGMENT_SHADER, fragmentShaderString);
        var vertexShader = getShader(gl, gl.VERTEX_SHADER, vertexShaderString);

        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            SA.Debug("Could not initialise shaders");
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
        var vertices = [
            0.0,  0.0,  0.0,
            0.0,  1.0,  0.0,
            1.0, 1.0,  0.0,
            1.0, 0.0,  0.0,
            0.0, 0.0,  0.0];
        var squareOutlinePositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareOutlinePositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        squareOutlinePositionBuffer.itemSize = 3;
        squareOutlinePositionBuffer.numItems = 5;

        // Filled square
        var squarePositionBuffer = gl.createBuffer();
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


    function initImageTileBuffers(view) {
        if (view.tileVertexTextureCoordinateBuffer) { return; }

        var gl = view.gl;
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

        view.tileVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, view.tileVertexTextureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
        view.tileVertexTextureCoordBuffer.itemSize = 2;
        view.tileVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

        view.tileVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, view.tileVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
        view.tileVertexPositionBuffer.itemSize = 3;
        view.tileVertexPositionBuffer.numItems = vertexPositionData.length / 3;

        view.tileCellBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, view.tileCellBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), gl.STATIC_DRAW);
        view.tileCellBuffer.itemSize = 1;
        view.tileCellBuffer.numItems = cellData.length;
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
        SAM.detectMobile();
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

    var LOGGING = false;
    var DEBUG_LOG = [];

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

    SA.cancelContextMenu = function(e) {
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
        SA.notesWidget.SaveCallback(
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
            SA.presentation = new SA.Presentation(rootNote, SA.Edit);
            return;
        }

        SAM.detectMobile();
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
        if ( ! SAM.detectMobile() && false) { // && doesBrowserSupportWebGL(testCanvas)) {
            initGL(); // Sets CANVAS and GL global variables
        } else {
            initGC();
        }

        // TODO: Get rid of this global variable.
        if (SAM.detectMobile() && MOBILE_ANNOTATION_WIDGET) {
            MOBILE_ANNOTATION_WIDGET = new SA.MobileAnnotationWidget();
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
        SA.resizePanel = new SA.ResizePanel(SA.MainDiv);
        SA.display = new SA.DualViewWidget(SA.resizePanel.MainDiv);
        SA.notesWidget = new SA.NotesWidget(SA.resizePanel.PanelDiv,
                                            SA.display);

        if (rootNote.Type == "Stack") {
            SA.display.SetNumberOfViewers(2);
        }

        SA.notesWidget.SetModifiedCallback(NotesModified);
        SA.notesWidget.SetModifiedClearCallback(NotesNotModified);
        // Navigation widget keeps track of which note is current.
        // Notes widget needs to access and change this.
        SA.notesWidget.SetNavigationWidget(SA.display.NavigationWidget);
        if (SA.display.NavigationWidget) {
            SA.display.NavigationWidget.SetInteractionEnabled(true);
        }

        SA.recorderWidget = new SA.RecorderWidget(SA.display);

        // Do not let guests create favorites.
        // TODO: Rework how favorites behave on mobile devices.
        if (SA.User != "" && ! SAM.detectMobile()) {
            if ( SA.Edit) {
                // Put a save button here when editing.
                SA.SaveButton = $('<img>')
                    .appendTo(SA.resizePanel.MainDiv)
                    .css({'position':'absolute',
                          'bottom':'4px',
                          'left':'10px',
                          'height': '28px',
                          'z-index': '5'})
                    .prop('title', "save to databse")
                    .addClass('editButton')
                    .attr('src',SA.ImagePathUrl+"save22.png")
                    .click(SaveCallback);
                //for (var i = 0; i < SA.display.Viewers.length; ++i) {
                //SA.display.Viewers[i].OnInteraction(function () {});
                //}
            } else {
                // Favorites when not editing.
                SA.FAVORITES_WIDGET = new SA.FavoritesWidget(SA.MainDiv, SA.display);
                //SA.FAVORITES_WIDGET.HandleResize(CANVAS.innerWidth());
            }
        }

        if (SAM.MOBILE_DEVICE && SA.DualDisplay && 
            SA.DualDisplay.NavigationWidget) {
            SA.DualDisplay.NavigationWidget.SetVisibility(false);
        }
        if (SAM.MOBILE_DEVICE && MOBILE_ANNOTATION_WIDGET) {
            MOBILE_ANNOTATION_WIDGET.SetVisibility(false);
        }

        //CONFERENCE_WIDGET = new SA.ConferenceWidget();

        // The event manager still handles stack alignment.
        // This should be moved to a stack helper class.
        // Undo and redo too.
        document.onkeydown = handleKeyDown;
        document.onkeyup = handleKeyUp;

        // Keep the browser from showing the left click menu.
        document.oncontextmenu = SA.cancelContextMenu;

        if ( ! SAM.MOBILE_DEVICE) {
            // Hack for all viewer edit menus to share browser.
            SA.VIEW_BROWSER = new SA.ViewBrowser($('body'));

            // TODO: See if we can get rid of this, or combine it with
            // the view browser.
            SA.InitSlideSelector(SA.MainDiv); // What is this?
            var viewMenu1 = new SA.ViewEditMenu(SA.display.Viewers[0],
                                                SA.display.Viewers[1]);
            var viewMenu2 = new SA.ViewEditMenu(SA.display.Viewers[1],
                                                SA.display.Viewers[0]);
            var viewer1 = SA.display.Viewers[0];
            var viewer2 = SA.display.Viewers[1];

            SA.display.UpdateGui();

            // ==============================
            // Experiment wit combining tranparent webgl ontop of canvas.
            /*
            SA.heatMap1 = new SA.HeatMap(viewer1.Div);
            SA.heatMap1.SetImageData(
                {prefix:"/tile?img=560b4011a7a1412197c0cc76&db=5460e35a4a737abc47a0f5e3&name=",
                 levels:     12,
                 dimensions: [419168, 290400, 1],
                 bounds: [0,419167, 0, 290399, 0,0],
                 spacing: [0.1,0.1,1.0],
                 origin : [100, 10000]});
            viewer1.AddLayer(SA.heatMap1);

            SA.heatMap2 = new SA.HeatMap(viewer1.Div);
            SA.heatMap2.Color = [0.0, 0.0, 0.7];
            SA.heatMap2.SetImageData(
                {prefix:"/tile?img=560b4011a7a1412197c0cc76&db=5460e35a4a737abc47a0f5e3&name=",
                 levels:     12,
                 dimensions: [419168, 290400, 1],
                 bounds: [0,419167, 0, 290399, 0,0],
                 spacing: [0.15,0.15,1.0],
                 origin : [20000, 20000]});
            viewer1.AddLayer(SA.heatMap2);

            SA.heatMap3 = new SA.HeatMap(viewer2.Div);
            SA.heatMap3.Color = [0.0, 0.0, 0.7];
            SA.heatMap3.Window = -1.0;
            SA.heatMap3.Gama = 0.2;
            SA.heatMap3.SetImageData(
                {prefix:"/tile?img=560b4011a7a1412197c0cc76&db=5460e35a4a737abc47a0f5e3&name=",
                 levels:     12,
                 dimensions: [419168, 290400, 1],
                 bounds: [0,419167, 0, 290399, 0,0],
                 spacing: [0.15,0.15,1.0],
                 origin : [2000, 10000]});
            viewer2.AddLayer(SA.heatMap3);
            */
        }

        SA.SetNote(rootNote);

        $(window).bind('orientationchange', function(event) {
            handleResize();
        });

        $(window).resize(function() {
            handleResize();
        }).trigger('resize');

        if (SA.display) {
            SA.display.Draw();
        }
    }


    // I had to prune all the annotations (lassos) that were not visible.
    function keepVisible(){
        var n = SA.display.GetNote();
        var r = n.ViewerRecords[n.StartIndex];
        var w = SA.VIEWER1.WidgetList;
        var c = SA.VIEWER1.GetCamera();
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

})();

