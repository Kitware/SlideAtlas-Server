<!DOCTYPE html>


<html> 
 
<head> 


<title>Connectome Viewer</title> 

<link rel="stylesheet" type="text/css" href="viewer.css" />

<meta http-equiv="content-type" content="text/html; charset=ISO-8859-1"> 

<!--
<link type="text/css" href="theme/ui.all.css" rel="Stylesheet" />	
<link type="text/css" href="theme_interiorNavigation/ui.all.css" rel="Stylesheet" />	
<script type="text/javascript" src="jquery-ui-personalized-1.6rc6.js"></script>
-->

<link type="text/css" href="jquery/jquery-ui-1.8.22.custom.css" rel="stylesheet" />
<script type="text/javascript" src="jquery/jquery-1.7.2.min.js"></script>
<script type="text/javascript" src="jquery/jquery-ui-1.8.22.custom.min.js"></script>

<!-- used some objects, matrix as an array  --> 
<script type="text/javascript" src="static/glMatrix-0.9.5.min.js"></script>

<!-- Perspective camera etc. May be ready to remove --> 
<script type="text/javascript" src="static/webgl-utils.js"></script>

<script type="text/javascript" src="static/init.js"></script>
<script type="text/javascript" src="static/camera.js"></script>


<!-- Actor for tile -->
<script type="text/javascript" src="static/tile.js"></script>

<!-- Source and cache for the viewer
Manages the list, and gives to camera, either lowres, or appropriate tiles
 -->
<script type="text/javascript" src="static/cache.js"></script>

<!-- Single view, view interacts with the cache -->
<script type="text/javascript" src="static/view.js"></script>

<!-- Has two views -->
<script type="text/javascript" src="static/viewer.js"></script>

<!-- Widgets 

Different widgets haev show dialog method, 
hardcoded to the divs

Widgets have serialize method which creates an object

-->

<script type="text/javascript" src="static/arrowWidget.js"></script>
<script type="text/javascript" src="static/circleWidget.js"></script>
<script type="text/javascript" src="static/textWidget.js"></script>
<script type="text/javascript" src="static/polylineWidget.js"></script>

<!-- Shapes starting with superclass 

Viewer contains shape list
shape has visibility and 

-->

<script type="text/javascript" src="static/shape.js"></script>

<script type="text/javascript" src="static/crossHairs.js"></script>
<script type="text/javascript" src="static/arrow.js"></script>
<script type="text/javascript" src="static/circle.js"></script>
<script type="text/javascript" src="static/polyline.js"></script>

<!-- Text uses texture map and not superclass shape, shares same API -->
<script type="text/javascript" src="static/text.js"></script>

<!-- 1 Global, decides which viewer gets the event, viewer decides which is active widget to forward to, or else handle itself, sometimes forwards to change camera -->
<script type="text/javascript" src="static/eventManager.js"></script>


<!-- 

   Obsolete, Was Used to convert widgets to points

   <script type="text/javascript" src="annotation.js">

</script> -->


<?php
$qid = $_GET['id'];

if(!isset($qid))
	{
	$qid = '5059f458d416e22e33000001';
	}

$m = new Mongo();
$d = $m->selectDb("demo");
$c = $d->selectCollection("questions");

$mongo_question = $c->findOne(array('qid'=>new MongoId($qid)));
$image_collection = $d->selectCollection("images");
$mongo_image = $image_collection->findOne(array('_id'=> new MongoId($mongo_question['imageid'])));

?>


<script type="text/javascript">
  var QUESTION = <?php echo json_encode($mongo_question);?>;
  var IMAGE = <?php echo json_encode($mongo_image);?>;
  // These globals are used in the viewer javascript.  I need to get rid of them.	
  var origin = IMAGE.origin;
  var spacing = IMAGE.spacing;
  // Could there be a problem with body not loaded yet?
  //$('body').data('ID', QUESTION.imageid);
</script>

<script type="text/javascript">
  var QUESTION = <?php echo json_encode($mongo_question);?>;
  var IMAGE = <?php echo json_encode($mongo_image);?>;
  // These globals are used in the viewer javascript.  I need to get rid of them.	
  var origin = IMAGE.origin;
  var spacing = IMAGE.spacing;
  // Could there be a problem with body not loaded yet?
  //$('body').data('ID', QUESTION.imageid);
</script>

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
<script id="shader-tile-fs" type="x-shader/x-fragment"> 
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform sampler2D uSampler;
  varying vec2 vTextureCoord;
 
  void main(void) {
    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
  }
</script>  
<script id="shader-tile-vs" type="x-shader/x-vertex"> 
  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;

  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  uniform mat3 uNMatrix;
  varying vec2 vTextureCoord;

  void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
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
</script>
<script type="text/javascript"> 
 

  var CANVAS;
  var EVENT_MANAGER;
  var VIEWER1;

  function initViews() {
    var source1 = new Cache("tile.php?image="+QUESTION.imageid+"&name=");
    VIEWER1 = new Viewer([0,0, CANVAS.width,CANVAS.height], source1);    
    
    // This may not be used anymore.
    VIEWER1.AnnotationCallback = function(widget) {
      //alert("Annotation Callback is being used.");
      var json = widget.Serialize();
      $.post("saveannotation.php?id="+QUESTION.qid.$id, {widget:json}, function(){
        saveConstants();
      });
    }
    var cam = QUESTION.cam;
    if(cam){
      VIEWER1.MainView.Camera.Height = parseFloat(cam.height);
      VIEWER1.MainView.Camera.FocalPoint[0] = parseFloat(cam.fp[0]);
      VIEWER1.MainView.Camera.FocalPoint[1] = parseFloat(cam.fp[1]);
      VIEWER1.MainView.Camera.FocalPoint[2] = parseFloat(cam.fp[2]);
      VIEWER1.MainView.Camera.Roll = parseFloat(cam.roll);
      VIEWER1.OverView.Camera.Roll = parseFloat(cam.roll);
      VIEWER1.MainView.Camera.ComputeMatrix();
      VIEWER1.OverView.Camera.ComputeMatrix();
    }
    
    EVENT_MANAGER.AddViewer(VIEWER1);
    if(QUESTION.annotations != undefined){
      for(var i=0; i < QUESTION.annotations.length; i++) {
        VIEWER1.LoadWidget(QUESTION.annotations[i]);
      }
    }  
  }

  function draw() {
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    // This just changes the camera based on the current time.
    VIEWER1.Animate();
    VIEWER1.Draw();	
  }


  function handleMouseDown(event) {EVENT_MANAGER.HandleMouseDown(event);}
  function handleMouseUp(event) {EVENT_MANAGER.HandleMouseUp(event);}
  function handleMouseMove(event) {EVENT_MANAGER.HandleMouseMove(event);}
  function handleMouseWheel(event) {EVENT_MANAGER.HandleMouseWheel(event);}
  function handleKeyDown(event) {EVENT_MANAGER.HandleKeyDown(event);}
  function handleKeyUp(event) {EVENT_MANAGER.HandleKeyUp(event);}
  function cancelContextMenu(e) {
    //alert("Try to cancel context menu");
    if (e && e.stopPropagation)
      e.stopPropagation();
    return false;
  }
 
  function webGLStart() {
    CANVAS = document.getElementById("viewer-canvas");
    initGL(CANVAS);
    EVENT_MANAGER = new EventManager(CANVAS);
    initViews();
    initShaderPrograms();
    initOutlineBuffers();
    initImageTileBuffers();

    GL.clearColor(0.9, 0.9, 0.9, 1.0);
    GL.enable(GL.DEPTH_TEST);

    CANVAS.onmousedown = handleMouseDown;
    CANVAS.onmousewheel = handleMouseWheel;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    document.oncontextmenu = cancelContextMenu;
    
    eventuallyRender();
  }

  function NewArrow() {
    // When the arrow button is pressed, create the widget.
    var widget = new ArrowWidget(VIEWER1, true);
    VIEWER1.ActiveWidget = widget;
    eventuallyRender();
  }

  function NewCircle() {
    // When the circle button is pressed, create the widget.
    var widget = new CircleWidget(VIEWER1, true);
    VIEWER1.ActiveWidget = widget;
  }

  function NewPolyline() {
    // When the text button is pressed, create the widget.
    VIEWER1.ActiveWidget = new PolylineWidget(VIEWER1, true);
  }
  
  function NewText() {
    // Just open the dialog, and let it take over.
    // The text is created when the apply button is pressed.

    // For debugging
    //var t = new Text();
    //t.Position = [6000,6000];
    //t.Color = [0,0,0];
    //t.String = "Hello\nWorld";
    //t.UpdateBuffers();
    //VIEWER1.AddShape(t);
    // Just open the dialog, and let it take over.
    // The text is created when the apply button is pressed.
    $("#text-properties-dialog").dialog("open");
  }
      
  function TextPropertyDialogApply() {
    var string = document.getElementById("textwidgetcontent").value;
    if (string == "") {
      alert("Empty String");
      return;
    }
    var widget = VIEWER1.ActiveWidget;
    var markerFlag = document.getElementById("TextMarker").checked;

    if (widget == null) {
      // This is a new widget.
      var widget = new TextWidget(VIEWER1, string);
    } else {
      widget.Shape.String = string;
      widget.Shape.UpdateBuffers();
      widget.SetActive(false);
    }
    widget.SetAnchorShapeVisibility(markerFlag);
    eventuallyRender();
  }

  function ArrowPropertyDialogApply() {
    var hexcolor = document.getElementById("arrowcolor").value;
    var widget = VIEWER1.ActiveWidget;
    //var fixedSizeFlag = document.getElementById("ArrowFixedSize").checked;
    widget.Shape.SetFillColor(hexcolor);
    if (widget != null) {
      widget.SetActive(false);
      //widget.SetFixedSize(fixedSizeFlag);
    }
    eventuallyRender();
  }

  function CirclePropertyDialogApply() {
    var hexcolor = document.getElementById("circlecolor").value;
    var widget = VIEWER1.ActiveWidget;
    widget.Shape.SetOutlineColor(hexcolor);
    var lineWidth = document.getElementById("circlelinewidth");
    widget.Shape.LineWidth = parseFloat(lineWidth.value);
    widget.Shape.UpdateBuffers();

    if (widget != null) {
      widget.SetActive(false);
    }
    eventuallyRender();
  }

  function PolylinePropertyDialogApply() {
    var hexcolor = document.getElementById("polylinecolor").value;
    var widget = VIEWER1.ActiveWidget;
    widget.Shape.SetOutlineColor(hexcolor);
    var lineWidth = document.getElementById("polylinewidth");
    widget.Shape.LineWidth = parseFloat(lineWidth.value);
    widget.Shape.UpdateBuffers();
    if (widget != null) {
      widget.SetActive(false);
    }
    eventuallyRender();
  }

  function WidgetPropertyDialogCancel() {
    var widget = VIEWER1.ActiveWidget;
    if (widget != null) {
      widget.SetActive(false);
    }
  }
  
  function WidgetPropertyDialogDelete() {
    var widget = VIEWER1.ActiveWidget;
    if (widget != null) {
      VIEWER1.ActiveWidget = null;
      // We need to remove an item from a list.
      // shape list and widget list.
      widget.RemoveFromViewer();
      eventuallyRender();
    }
  }
  
  function savequestion() {
      saveConstants();
      //window.location = "lessonmaker.php";
  }
  
  function zoomIn() {
    VIEWER1.AnimateZoom(0.5);
  }
  
  function zoomOut() {
    VIEWER1.AnimateZoom(2.0);
  }
  
  function rotateRight() {
    VIEWER1.AnimateRoll(-12.0); // degrees
  }
  
  function rotateLeft() {
    VIEWER1.AnimateRoll(12.0); // degrees
  }
  
    //********************************************************
    
  function saveConstants() {
    var questionchoices = [];
    var questiontext = document.getElementById("qtext").value;
    var questiontitle = document.getElementById("title").value;
    
    var numAnswers = $('.answer').length;

    for(var i=0; i < numAnswers; i++){
      questionchoices[i] = $('.answer')[i].value;
    }
    
    var qid = QUESTION.qid.$id;
    var cam = VIEWER1.MainView.Camera;
    var camValues = {'roll':cam.Roll, 'fp':cam.FocalPoint, 'height':cam.Height};
    
    var correct = findChecked();
    
    correct = correct + '';
    
    var annots = [];
    
    for(var i=0; i < VIEWER1.WidgetList.length; i++){
      annots.push(VIEWER1.WidgetList[i].Serialize());
    }
    if(annots.length == 0){
        annots = 0;
    }
    
    $.post("setquestion.php", {qid: qid, qtitle:questiontitle, qtext: questiontext, choices: questionchoices, cam: camValues, corr: correct, annotations:annots}, function(cs){
        //alert(cs);
    });
  }
  
  function findChecked(){
    var span = document.getElementById("choicelist");
    var inputs = span.getElementsByTagName("input");
    var radios = [];
    for (var i = 0; i < inputs.length; ++i){
      if (inputs[i].type.toLowerCase() === "radio") {
        radios.push(inputs[i]);
      }
    }
    for (var i = 0; i < radios.length; ++i) {
      if (radios[i].checked) {
        return i;
      }
    }
    
    return 0;
  }
    
  function addanswer() {
    var numAnswers = $('.answer').length;
    var liststring = '<tr><td>'+(numAnswers+1)+': <input type="text" class="answer" /></td><td><input type="radio" name="correct" /></td></tr>';
    $('#choicelist').append(liststring); 
    saveConstants();
  }
    
    function savequestion() {
        saveConstants();
        //window.location = "lessonmaker.php";
    }
    $(document).ready(function() {
        if (QUESTION.choices) {
            document.getElementById("qtext").innerHTML = QUESTION.qtext;
            document.getElementById("title").innerHTML = QUESTION.title;
            for (var i = 0; i < QUESTION.choices.length; ++i) {
                var liststring = '<tr><td>'+(i+1)+': <input type="text" class="answer" value="'+QUESTION.choices[i]+'" /></td><td><input type="radio" name="correct" /></td></tr>';
                if(QUESTION.correct == (i+'')){
                    liststring = '<tr><td>'+(i+1)+': <input type="text" class="answer" value="'+QUESTION.choices[i]+'" /></td><td><input type="radio" name="correct" checked="checked" /></td></tr>';
                }
                $('#choicelist').append(liststring);    
            }
        }
        else {
            var liststring = '<tr><td>1: <input type="text" class="answer" /></td><td><input type="radio" name="correct" checked="checked" /></td></tr>';
            $('#choicelist').append(liststring);
        }

      $("#text-properties-dialog").dialog({
          autoOpen:false,
          height:250,
          width:350,
          modal:true,
          buttons:{
              Delete: function() {
                  WidgetPropertyDialogDelete();
                  $(this).dialog("close");
              },
              Apply: function() {
                  TextPropertyDialogApply();
                  $(this).dialog("close");
              }
          },
          close: function(event,ui) {
              if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
                  WidgetPropertyDialogCancel();
                  $(this).dialog("close");
              }
              $("#textwidgetcontent").val( "" ).removeClass( "ui-state-error" );
          }   
      });
      
      $("#arrow-properties-dialog").dialog({
          autoOpen:false,
          height:280,
          width:350,
          modal:true,
          buttons:{
              Delete: function() {
                  WidgetPropertyDialogDelete();
                  $(this).dialog("close");
              },
              Apply: function() {
                  ArrowPropertyDialogApply();
                  $(this).dialog("close");
              }
          },
          close: function(event,ui) {
              if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
                  WidgetPropertyDialogCancel();
                  $(this).dialog("close");
              }
              //$("#arrowwidgetcontent").val( "" ).removeClass( "ui-state-error" );
          }   
      });

    $("#circle-properties-dialog").dialog({
      autoOpen:false,
      height:300,
      width:350,
      modal:true,
      buttons:{
        Delete: function() {
          WidgetPropertyDialogDelete();
          $(this).dialog("close");
        },
        Apply: function() {
          CirclePropertyDialogApply();
          $(this).dialog("close");
        }
      },
      close: function(event,ui) {
        if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
          WidgetPropertyDialogCancel();
          $(this).dialog("close");
        }
        //$("#arrowwidgetcontent").val( "" ).removeClass( "ui-state-error" );
      }   
    });

    $("#polyline-properties-dialog").dialog({
      autoOpen:false,
      height:250,
      width:350,
      modal:true,
      buttons:{
        Delete: function() {
          WidgetPropertyDialogDelete();
          $(this).dialog("close");
        },
        Apply: function() {
          PolylinePropertyDialogApply();
          $(this).dialog("close");
        }
      },
      close: function(event,ui) {
        if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
          WidgetPropertyDialogCancel();
          $(this).dialog("close");
        }
      }   
    });

  });
 
</script> 
 
 
</head> 
 
<body onload="webGLStart();">
  <div class="container ui-widget" >
    <div class="viewer ui-widget-content" >
      <canvas id="viewer-canvas" style="border: none;" width="900" height="700"></canvas> 
      <table border="1" id="annotbuttons">
        <tr>
          <td>
            <img src="static/Arrow.gif" height="25" id="arrow" type="button" onclick="NewArrow();" />
          </td>
          <td>
            <img src="static/Circle.gif" height="25" id="arrow" type="button" onclick="NewCircle();" />
          </td>
          <td>
            <img src="static/FreeForm.gif" height="25" id="text" type="button" onclick="NewPolyline();" />
          </td>
          <td>
            <img src="static/Text.gif" height="25" id="text" type="button" onclick="NewText();" />
          </td>
        </tr>
      </table>
      <table border="1" id="zoombuttons" >
        <tr>
          <td type="button" onclick="zoomIn();" style="width:20px;height:20px;background-color:white;text-align:center;" >+</td>
        </tr>
        <tr>
          <td type="button" onclick="zoomOut();" style="width:20px;height:20px;background-color:white;text-align:center;" >-</td>
        </tr>
      </table>
      <table border="1" id="rotatebuttons" >
        <tr>
          <td type="button" onclick="rotateLeft();" style="width:20px;height:20px;background-color:white;text-align:center;" >
            <img src="static/rotateLeft.jpg" height="25" />
          </td>
          <td type="button" onclick="rotateRight();" style="width:20px;height:20px;background-color:white;text-align:center;" >
            <img src="static/rotateRight.jpg" height="25" />
          </td>
        </tr>
      </table>
    </div>
    <div class="form ui-widget-content" >
      Title:<br />
      <textarea id="title" ></textarea><br />
      Question:<br />
      <textarea id="qtext" ></textarea><br /><br />
      <button id="addanswer" onclick="addanswer();" >Add Answer Choice</button><br />
      <button id="savequestion" onclick="savequestion();" >Save Question</button><br />
      <table id="choicelist" class="ui-widget-content" style="width:100%" >
        <tr>
          <td>Answers:</td><td>Correct?</td>
        </tr>
      </table>
    </div>
  </div>
    
  <div id="text-properties-dialog" title="Text Annotation Editor" >
    <form>
      <textarea id="textwidgetcontent" style="width:100%;height:100%;" ></textarea> </br>
      <input type="checkbox" id="TextMarker" checked /> Marker </input>
    </form>
  </div>
  
  <div id="circle-properties-dialog" title="Circle Annotation Editor" >
    <form>
      <fieldset>
        <!-- I plan to have a color selector and center and radius entries (thickness too) -->
        Color(#rrggbb):<input id="circlecolor" ></input></br>
        Line Width:<input id="circlelinewidth" ></input></br>
        <p id="circlearea"></p>
      </fieldset>
    </form>
  </div>

  <div id="polyline-properties-dialog" title="Polyline Annotation Editor" >
    <form>
      <fieldset>
        <!-- I plan to have a color selector and thickness, and maybe entries for the points.(closed too) -->
        Color(#rrggbb):<input id="polylinecolor" ></input></br>
        Line Width:<input id="polylinewidth" ></input>
      </fieldset>
    </form>
  </div>

  <div id="arrow-properties-dialog" title="Arrow Annotation Editor" >
    <form>
      <fieldset>
        <!-- I plan to have a color selector and maybe tip,orientation,length,thickness -->
        Color(#rrggbb):<input id="arrowcolor" ></input>
        <!--<input type="checkbox" id="ArrowFixedSize" checked /> FixedSize </input> -->
        <p id="ArrowLength"></p>
      </fieldset>
    </form>      
  </div>

 </body> 
 
</html> 
