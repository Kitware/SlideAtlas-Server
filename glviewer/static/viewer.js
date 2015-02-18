//==============================================================================

// TODO: Fix
// Add stack option to Save large image GUI.
// SaveStackImages.

// I think this can go away now that we have hover mode in text.
var ANNOTATION_OFF = 0;
var ANNOTATION_NO_TEXT = 1;
var ANNOTATION_ON = 2;

var INTERACTION_NONE = 0;
var INTERACTION_DRAG = 1;
var INTERACTION_ROTATE = 2;
var INTERACTION_ZOOM = 3;
var INTERACTION_OVERVIEW = 4;


function Viewer (viewport) {
    this.HistoryFlag = false;
    
    // Interaction state:
    // What to do for mouse move or mouse up.
    this.InteractionState = INTERACTION_NONE;

    this.AnimateLast;
    this.AnimateDuration = 0.0;
    this.TranslateTarget = [0.0,0.0];

    this.MainView = new View();
    this.MainView.InitializeViewport(viewport, 1);
    this.MainView.OutlineColor = [0,0,0];
    this.MainView.Camera.ZRange = [0,1];
    this.MainView.Camera.ComputeMatrix();
    if ( ! MOBILE_DEVICE || MOBILE_DEVICE == "iPad") {
	      var overViewport = [viewport[0] + viewport[2]*0.8,
                            viewport[1] + viewport[3]*0.8,
                            viewport[2]*0.18, viewport[3]*0.18];
	      this.OverView = new View();
	      this.OverView.InitializeViewport(overViewport, 1);
	      this.OverView.Camera.ZRange = [-1,0];
	      this.OverView.Camera.FocalPoint = [13000.0, 11000.0, 10.0];
	      this.OverView.Camera.SetHeight(22000.0);
	      this.OverView.Camera.ComputeMatrix();
    }
    this.ZoomTarget = this.MainView.Camera.GetHeight();
    this.RollTarget = this.MainView.Camera.Roll;
    
    this.AnnotationVisibility = ANNOTATION_ON;
    this.ShapeList = [];
    this.WidgetList = [];
    this.ActiveWidget = null;
    
    this.DoubleClickX = 0;
    this.DoubleClickY = 0;
    
    this.GuiElements = [];
    
    this.InteractionListeners = [];
    
    this.InitializeZoomGui();

    // For stack correlations.
    this.StackCorrelations = undefined;
    this.ViewerIndex = 0; // VIEWER1 has this set to 0, VIEWER2: 1

    var self = this;
    var can = this.MainView.Canvas[0];
    can.addEventListener(
        "mousedown",
			  function (event){
            return self.HandleMouseDown(event);},
			  false);
    can.addEventListener(
        "mousemove",
			  function (event){
            // So key events go the the right viewer.
            this.focus();
            return self.HandleMouseMove(event);},
			  false);
    // We need to detect the mouse up even if it happens outside the canvas,
    document.body.addEventListener(
        "mouseup",
			  function (event){
            self.HandleMouseUp(event);},
			  false);
    can.addEventListener(
        "mousewheel", 
        function(event){
            self.HandleMouseWheel(event);
        }, 
        false);

    // I am delaying getting event manager out of receiving touch events.
    // It has too many helper functions.
    can.addEventListener(
        "touchstart", 
        function(event){
            EVENT_MANAGER.HandleTouchStart(event, self);
        }, 
        false);
    can.addEventListener(
        "touchmove", 
        function(event){
            self.TriggerInteraction();
            EVENT_MANAGER.HandleTouchMove(event, self);
        }, 
        false);
    can.addEventListener(
        "touchend", 
        function(event){
            EVENT_MANAGER.HandleTouchEnd(event, self);
        }, 
        false);


    // necesary to respond to keyevents.
    this.MainView.Canvas.attr("tabindex","1");
    can.addEventListener(
        "keydown",
			  function (event){
            //alert("keydown");
            return self.HandleKeyDown(event);
        },
	      false);


    // This did not work for double left click
    // Go back to my original way of handling this.
    //can.addEventListener("dblclick",
		//	                   function (event){self.HandleDoubleClick(event);},
		//	                   false);

    if (this.OverView) {
        var can = this.OverView.Canvas[0];
        can.addEventListener("mousedown",
			                       function (event){return self.HandleOverViewMouseDown(event);},
			                       false);
        can.addEventListener("mousemove",
			                       function (event){return self.HandleOverViewMouseMove(event);},
			                       false);
    }
}

Viewer.prototype.GetMainCanvas = function() {
    return this.MainView.Canvas;
}
 
// A way to have a method called every time the camera changes.
// Will be used for synchronizing viewers for stacks.
Viewer.prototype.OnInteraction = function(callback) {
    // How should we remove listners?
    // Global clear for now.
    if ( ! callback) {
        this.InteractionListeners = [];
    } else {
        this.InteractionListeners.push(callback);
    }
}


Viewer.prototype.TriggerInteraction = function() {
    for (var i = 0; i < this.InteractionListeners.length; ++i) {
        callback = this.InteractionListeners[i];
        callback();
    }
}


Viewer.prototype.InitializeZoomGui = function() {
  // Place the zoom in / out buttons.
  // Todo: Make the button become more opaque when pressed.
  // Associate with viewer (How???).
  // Place properly (div per viewer?) (viewer.SetViewport also places buttons).
  var self = this;
  this.ZoomDiv = $('<div>')
        .appendTo(VIEW_PANEL)
        .css({
          'opacity': '0.6',
          'background-color': '#fff',
          'position': 'absolute',
          'height': '120px',
          'width': '54px',
          'bottom' : '5px',
          'right' : '5px',
          'border-style'  : 'solid',
          'border-width'  : '1px',
          'border-radius' : '27px',
          'border-color'  : '#888',
          'z-index': '2'});
  this.ZoomInButton = $('<img>')
        .appendTo(this.ZoomDiv)
        .css({
          'opacity': '0.6',
          'position': 'absolute',
          'height': '50px',
          'width': '50px',
          'top' : '2px',
          'right' : '2px',
          'z-index': '2'})
        .attr('type','image')
        .attr('src',"/webgl-viewer/static/zoomin2.png")
        .click(function(){ self.AnimateZoom(0.5);});
  this.ZoomDisplay = $('<div>')
        .appendTo(this.ZoomDiv)
        .css({
          'opacity': '0.9',
          'position': 'absolute',
          'height':  '20px',
          'width':   '100%',
          'text-align' : 'center',
          'color' : '#000',
          'top' : '51px',
          'left' : '0px'})
        .html("");
  this.ZoomOutButton = $('<img>').appendTo(this.ZoomDiv)
        .css({
          'opacity': '0.6',
          'position': 'absolute',
          'height': '50px',
          'width': '50px',
          'bottom' : '2px',
          'right' : '2px'})
        .attr('type','image')
        .attr('src',"/webgl-viewer/static/zoomout2.png")
        .click(function(){self.AnimateZoom(2.0);});

  this.AddGuiObject(this.ZoomDiv,  "Bottom", 4, "Right", 60);
}

Viewer.prototype.UpdateZoomGui = function() {
  var camHeight = this.GetCamera().Height;
  var windowHeight = this.GetViewport()[3];
  // Assume image scanned at 40x
  var zoomValue = 40.0 * windowHeight / camHeight;
  // 2.5 and 1.25 are standard in the geometric series.
  if ( zoomValue < 2) {
    zoomValue = zoomValue.toFixed(2);
  } else if (zoomValue < 4) {
    zoomValue = zoomValue.toFixed(1);
  } else {
    zoomValue = Math.round(zoomValue);
  }
  this.ZoomDisplay.html( 'x' + zoomValue);

  // I am looking for the best place to update this value.
  // Trying to fix a bug: Large scroll when wheel event occurs
  // first.
  this.ZoomTarget = camHeight;
}


Viewer.prototype.SaveImage = function(fileName) {
  this.MainView.Canvas[0].toBlob(function(blob) {saveAs(blob, fileName);}, "image/png");
}


// Cancel the large image request before it finishes.
Viewer.prototype.CancelLargeImage = function() {
    // This will abort the save blob that occurs after rendering.
    SetFinishedLoadingCallback(undefined);
    // We also need to stop the request for pending tiles.
    ClearQueue();
    // Incase some of the queued tiles were for normal rendering.
    eventuallyRender();
}

// Create a virtual viewer to save a very large image.
Viewer.prototype.SaveLargeImage = function(fileName, width, height, stack,
                                           finishedCallback) {
    var self = this;
    var cache = this.GetCache();
    var viewport = [0,0, width, height];
    var cam = this.GetCamera();

    // Clone the main view.
    var view = new View();
    view.InitializeViewport(viewport, 1, true);
    view.SetCache(cache);
    view.Canvas.attr("width", width);
    view.Canvas.attr("height", height);
    var newCam = view.Camera;
    newCam.SetFocalPoint(cam.FocalPoint[0], cam.FocalPoint[1]);
    newCam.Roll = cam.Roll;
    newCam.Height = cam.Height;
    newCam.ComputeMatrix();

    // Load only the tiles we need.
    var tiles = cache.ChooseTiles(newCam, 0, []);
    for (var i = 0; i < tiles.length; ++i) {
        LoadQueueAddTile(tiles[i]);
    }
    LoadQueueUpdate();

    //this.CancelLargeImage = false;
    SetFinishedLoadingCallback(
        function () {self.SaveLargeImage2(view, fileName,
                                          width, height, stack,
                                          finishedCallback);}
    );

    console.log("trigger " + LOAD_QUEUE.length + " " + LOADING_COUNT);

    // Needed to trigger loading.
    eventuallyRender();
}


Viewer.prototype.SaveLargeImage2 = function(view, fileName,
                                            width, height, stack,
                                            finishedCallback) {
    var sectionFileName = fileName;
    if (stack) {
        var note = NOTES_WIDGET.GetCurrentNote();
        var idx = fileName.indexOf('.');
        if (idx < 0) {
            sectionFileName = fileName + ZERO_PAD(note.StartIndex, 4) + ".png";
        } else {
            sectionFileName = fileName.substring(0, idx) +
                              ZERO_PAD(note.StartIndex, 4) +
                              fileName.substring(idx, fileName.length);
        }
    }
    console.log(sectionFileName + " " + LOAD_QUEUE.length + " " + LOADING_COUNT);


    view.DrawTiles();
    if (this.AnnotationVisibility) {
        for(i=0; i<this.ShapeList.length; i++){
            this.ShapeList[i].Draw(view);
        }
        for(i in this.WidgetList){
            this.WidgetList[i].Draw(view, this.AnnotationVisibility);
        }
    }

    view.Canvas[0].toBlob(function(blob) {saveAs(blob, sectionFileName);}, "image/png");
    if (stack) {
        var note = NOTES_WIDGET.GetCurrentNote();
        if (note.StartIndex < note.ViewerRecords.length-1) {
            NAVIGATION_WIDGET.NextNote();
            this.SaveLargeImage(fileName, width, height, stack,
                                finishedCallback);
            return;
        }
    }

    finishedCallback();
}

// This method waits until all tiles are loaded before saving.
var SAVE_FINISH_CALLBACK;
Viewer.prototype.EventuallySaveImage = function(fileName, finishedCallback) {
    var self = this;
    SetFinishedLoadingCallback(
        function () {
            self.SaveImage(fileName); 
            if (finishedCallback) {
                finishedCallback();
            }
        }
    );
    eventuallyRender();
}


// Not used anymore.  Incorpoarated in SaveLargeImage
// delete these.
// Save a bunch of stack images ----
Viewer.prototype.SaveStackImages = function(fileNameRoot) {
    var self = this;
    SetFinishedLoadingCallback(
        function () {
            self.SaveStackImage(fileNameRoot); 
        }
    );
    eventuallyRender();
}

Viewer.prototype.SaveStackImage = function(fileNameRoot) {
    var self = this;
    var note = NOTES_WIDGET.GetCurrentNote();
    var fileName = fileNameRoot + ZERO_PAD(note.StartIndex, 4);
    this.SaveImage(fileName);
    if (note.StartIndex < note.ViewerRecords.length-1) {
        NAVIGATION_WIDGET.NextNote();
        SetFinishedLoadingCallback(
            function () {
                self.SaveStackImage(fileNameRoot); 
            }
        );
        eventuallyRender();
    }
}
//-----



Viewer.prototype.GetAnnotationVisibility = function() {
  return this.AnnotationVisibility;
}

Viewer.prototype.SetAnnotationVisibility = function(vis) {
  this.AnnotationVisibility = vis;
}


// connectome
// TODO:
// I do not like the global variable SECTIONS here.
// SECTIONS should be an object of ivar.
// The purpose of using an index arg is to preload
// tiles from the adjacent sections.
Viewer.prototype.SetSectionIndex = function(idx) {
  if (idx < 0 || idx >= SECTIONS.length) {
    return;
  }
  var section = SECTIONS[idx];
  if (section == null) {
    return;
  }
  if (idx > 0 && SECTIONS[idx-1]) {
    var s = SECTIONS[idx-1];
    s.LoadRoots();
    // Preload the views tiles in the previous section
    // TODO: Get ride of this hard coded global
    s.LoadTilesInView(VIEWER1.MainView);
  }
  section.LoadRoots();
  if (idx < SECTIONS.length-z1 && SECTIONS[idx+1]) {
    var s = SECTIONS[idx+1];
    s.LoadRoots();
    // Preload the views tiles in the next section
    // TODO: Get ride of this hard coded global
    s.LoadTilesInView(VIEWER1.MainView);
  }

  this.SetSection(section);
}


Viewer.prototype.SetOverViewBounds = function(bounds) {
    this.OverViewBounds = bounds;
    if (this.OverView) {
        this.OverView.Camera.SetHeight(bounds[3]-bounds[2]);
        this.OverView.Camera.SetFocalPoint(0.5*(bounds[0]+bounds[1]),
                                           0.5*(bounds[2]+bounds[3]));
        this.OverView.Camera.ComputeMatrix();
    }
}

Viewer.prototype.GetOverViewBounds = function() {
    if (this.OverViewBounds) {
        return this.OverViewBounds;
    }
    if (this.OverView) {
        var cam = this.OverView.Camera;
        var halfHeight = cam.GetHeight() / 2;
        var halfWidth = cam.GetWidth() / 2;
        this.OverViewBounds = [cam.FocalPoint[0] - halfWidth,
                               cam.FocalPoint[0] + halfWidth,
                               cam.FocalPoint[1] - halfHeight,
                               cam.FocalPoint[1] + halfHeight];
        return this.OverViewBounds;
    }
    // This method is called once too soon.  There is no image, and mobile devices have no overview.
    return [0,10000,0,10000];
}


Viewer.prototype.SetSection = function(section) {
  if (section == null) {
    return;
  }
  this.MainView.Section = section;
  if (this.OverView) {
      this.OverView.Section = section;
  }
  eventuallyRender();
}


// Change the source / cache after a viewer has been created.
Viewer.prototype.SetCache = function(cache) {

  if (cache && cache.Image) {
      if (cache.Image.bounds) {
          this.SetOverViewBounds(cache.Image.bounds);
      }

      if (cache.Image.copyright == undefined) {
          cache.Image.copyright = "Copyright 2014";
      }
      /*this.CopyrightWrapper
        .html(cache.Image.copyright)
        .show();*/
  }

  this.MainView.SetCache(cache);
  if (this.OverView) {
    this.OverView.SetCache(cache);
    if (cache) {
      var bds = cache.GetBounds();
      if (bds) {
        this.OverView.Camera.SetFocalPoint((bds[0] + bds[1]) / 2,
                                           (bds[2] + bds[3]) / 2);
        var height = (bds[3]-bds[2]);
        // See if the view is constrained by the width.
        var height2 = (bds[1]-bds[0]) * this.OverView.Viewport[3] / this.OverView.Viewport[2];
        if (height2 > height) {
          height = height2;
        }
        this.OverView.Camera.SetHeight(height);
        this.OverView.Camera.ComputeMatrix();
      }
    }
  }
}

Viewer.prototype.GetCache = function() {
  return this.MainView.GetCache();
}

Viewer.prototype.ShowGuiElements = function() {
  for (var i = 0; i < this.GuiElements.length; ++i) {
    var element = this.GuiElements[i];
    if ('Object' in element) {
      element.Object.show();
    } else if ('Id' in element) {
      $(element.Id).show();
    }
  }
}

Viewer.prototype.HideGuiElements = function() {
  for (var i = 0; i < this.GuiElements.length; ++i) {
    var element = this.GuiElements[i];
    if ('Object' in element) {
      element.Object.hide();
    } else if ('Id' in element) {
      $(element.Id).hide();
    }
  }
}

// legacy
Viewer.prototype.AddGuiElement = function(idString, relativeX, x, relativeY, y) {
  var element = {};
  element.Id = idString;
  element[relativeX] = x;
  element[relativeY] = y;
  this.GuiElements.push(element);
}

Viewer.prototype.AddGuiObject = function(object, relativeX, x, relativeY, y) {
  var element = {};
  element.Object = object;
  element[relativeX] = x;
  element[relativeY] = y;
  this.GuiElements.push(element);
}


// I intend this method to get called when the window resizes.
Viewer.prototype.SetViewport = function(viewport) {

  // I am working on getting gui elements managed by the viewer.
  // Informal for now.
  for (var i = 0; i < this.GuiElements.length; ++i) {
    var element = this.GuiElements[i];
    var object;
    if ('Object' in element) {
      object = element.Object;
    } else if ('Id' in element) {
      object = $(element.Id);
    } else {
      continue;
    }

    // When the viewports are too small, large elements overlap ....
    // This stomps on the dual view arrow elementts visibility.
    // We would need out own visibility state ...
    //if (viewport[2] < 300 || viewport[3] < 300) {
    //  object.hide();
    //} else {
    //  object.show();
    //}

    if ('Bottom' in element) {
      var pos = element.Bottom.toString() + "px";
      object.css({
      'bottom' : pos});
    } else if ('Top' in element) {
      var pos = element.Top.toString() + "px";
      object.css({
      'top' : pos});
    }

    if ('Left' in element) {
      var pos = viewport[0] + element.Left;
      pos = pos.toString() + "px";
      object.css({
      'left' : pos});
    } else if ('Right' in element) {
      var pos = viewport[0] + viewport[2] - element.Right;
      pos = pos.toString() + "px";
      object.css({
      'left' : pos});
    }
  }

  this.MainView.SetViewport(viewport);
  if (this.OverView) {
    var overViewport = [viewport[0] + viewport[2]*0.8,
                        viewport[1] + viewport[3]*0.8,
                        viewport[2]*0.18, viewport[3]*0.18];
    this.OverView.SetViewport(overViewport);
    this.OverView.Camera.ComputeMatrix();
  }
  this.MainView.Camera.ComputeMatrix();
}

Viewer.prototype.GetViewport = function() {
  return this.MainView.Viewport;
}

// To fix a bug in the perk and elmer uploader.
Viewer.prototype.ToggleMirror = function() {
  this.MainView.Camera.Mirror = ! this.MainView.Camera.Mirror;
  if (this.OverView) {
    this.OverView.Camera.Mirror = ! this.OverView.Camera.Mirror;
  }
}

// Same as set camera but use animation
Viewer.prototype.AnimateCamera = function(center, rotation, height) {

  this.ZoomTarget = height;
  // Compute traslate target to keep position in the same place.
  this.TranslateTarget[0] = center[0];
  this.TranslateTarget[1] = center[1];
  this.RollTarget = rotation;

  this.AnimateLast = new Date().getTime();
  this.AnimateDuration = 200.0; // hard code 200 milliseconds
  eventuallyRender();
}

// This sets the overview camera from the main view camera.
// The user can change the mainview camera and then call this method.
Viewer.prototype.UpdateCamera = function() {
    var cam = this.MainView.Camera;
    this.ZoomTarget = cam.Height;
    
    this.TranslateTarget[0] = cam.FocalPoint[0];
    this.TranslateTarget[1] = cam.FocalPoint[1];
    this.RollTarget = cam.Roll;
    if (this.OverView) {
        this.OverView.Camera.Roll = cam.Roll;
        this.OverView.Camera.ComputeMatrix();
    }
    
    this.MainView.Camera.ComputeMatrix();
    this.UpdateZoomGui();
}

// This is used to set the default camera so the complexities
// of the target and overview are hidden.
Viewer.prototype.SetCamera = function(center, rotation, height) {
    this.MainView.Camera.SetHeight(height);
    this.MainView.Camera.SetFocalPoint(center[0], center[1]);
    this.MainView.Camera.Roll = rotation * 3.14159265359 / 180.0;
    
    this.UpdateCamera();
    eventuallyRender();
}

Viewer.prototype.GetCamera = function() {
    return this.MainView.Camera;
}

Viewer.prototype.GetSpacing = function() {
  var cam = this.GetCamera();
  var viewport = this.GetViewport();
  return cam.GetHeight() / viewport[3];
}

// I could merge zoom methods if position defaulted to focal point.
Viewer.prototype.AnimateZoomTo = function(factor, position) {
  EVENT_MANAGER.CursorFlag = false;

  this.ZoomTarget = this.MainView.Camera.GetHeight() * factor;
  if (this.ZoomTarget < 0.9 / (1 << 5)) {
    this.ZoomTarget = 0.9 / (1 << 5);
  }
  // Lets restrict discrete zoom values to be standard values.
  var windowHeight = this.GetViewport()[3];
  var tmp = Math.round(Math.log(32.0 * windowHeight / this.ZoomTarget) / 
                       Math.log(2));
  this.ZoomTarget = 32.0 * windowHeight / Math.pow(2,tmp);

  factor = this.ZoomTarget / this.MainView.Camera.GetHeight(); // Actual factor after limit.

  // Compute translate target to keep position in the same place.
  this.TranslateTarget[0] = position[0] - factor * (position[0] - this.MainView.Camera.FocalPoint[0]);
  this.TranslateTarget[1] = position[1] - factor * (position[1] - this.MainView.Camera.FocalPoint[1]);

  this.RollTarget = this.MainView.Camera.Roll;

  this.AnimateLast = new Date().getTime();
  this.AnimateDuration = 200.0; // hard code 200 milliseconds
  eventuallyRender();
}

Viewer.prototype.AnimateZoom = function(factor) {
  var focalPoint = this.GetCamera().FocalPoint;
  this.AnimateZoomTo(factor, focalPoint);
}

Viewer.prototype.AnimateTranslate = function(dx, dy) {
  this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0] + dx;
  this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1] + dy;

  this.ZoomTarget = this.MainView.Camera.GetHeight();
  this.RollTarget = this.MainView.Camera.Roll;

  this.AnimateLast = new Date().getTime();
  this.AnimateDuration = 200.0; // hard code 200 milliseconds
  eventuallyRender();
}

Viewer.prototype.AnimateRoll = function(dRoll) {
  dRoll *= Math.PI / 180.0;
  this.RollTarget = this.MainView.Camera.Roll + dRoll;

  this.ZoomTarget = this.MainView.Camera.GetHeight();
  this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0];
  this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1];

  this.AnimateLast = new Date().getTime();
  this.AnimateDuration = 200.0; // hard code 200 milliseconds
  eventuallyRender();
}

Viewer.prototype.AnimateTransform = function(dx, dy, dRoll) {
  this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0] + dx;
  this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1] + dy;

  this.RollTarget = this.MainView.Camera.Roll + dRoll;

  this.ZoomTarget = this.MainView.Camera.GetHeight();

  this.AnimateLast = new Date().getTime();
  this.AnimateDuration = 200.0; // hard code 200 milliseconds
  eventuallyRender();
}


Viewer.prototype.RemoveWidget = function(widget) {
  if (widget.Viewer == null) {
    return;
  }
  widget.Viewer = null;
  var idx = this.WidgetList.indexOf(widget);
  if(idx!=-1) {
    this.WidgetList.splice(idx, 1);
  }
}



// Load a widget from a json object (origin MongoDB).
Viewer.prototype.LoadWidget = function(obj) {
  switch(obj.type){
    case "lasso":
      var lasso = new LassoWidget(this, false);
      lasso.Load(obj);
      break;
    case "pencil":
      var pencil = new PencilWidget(this, false);
      pencil.Load(obj);
      break;
    case "text":
      var text = new TextWidget(this, "");
      text.Load(obj);
      break;
    case "circle":
      var circle = new CircleWidget(this, false);
      circle.Load(obj);
      break;
    case "polyline":
      var pl = new PolylineWidget(this, false);
      pl.Load(obj);
      break;
  }
}

// I am doing a dance because I expect widget SetActive to call this,
// but this calls widget SetActive.
// The widget is the only object to call these methods.
// A widget cannot call this if another widget is active.
// The widget deals with its own activation and deactivation.
Viewer.prototype.ActivateWidget = function(widget) {
  if (this.ActiveWidget == widget) {
    return;
  }
  this.ActiveWidget = widget;
}

Viewer.prototype.DeactivateWidget = function(widget) {
  if (this.ActiveWidget != widget || widget == null) {
    // Do nothing if the widget is not active.
    return;
  }
  this.ActiveWidget = null;
}



Viewer.prototype.DegToRad = function(degrees) {
  return degrees * Math.PI / 180;
}


Viewer.prototype.Draw = function() {
    //console.time("ViewerDraw");

    // connectome
    if ( ! this.MainView.Section) {
        return;
    }

    this.ConstrainCamera();
    // Should the camera have the viewport in them?
    // The do not currently hav a viewport.

    // Rendering text uses blending / transparency.
    if (GL) {
        GL.disable(GL.BLEND);
        GL.enable(GL.DEPTH_TEST);
    }

    this.MainView.DrawTiles();

    // This is only necessary for webgl, Canvas2d just uses a border.
    this.MainView.DrawOutline(false);
    if (this.OverView) {
        this.OverView.DrawTiles();
        this.OverView.DrawOutline(true);
    }
    if (this.AnnotationVisibility) {
        for(i=0; i<this.ShapeList.length; i++){
            this.ShapeList[i].Draw(this.MainView);
        }
        for(i in this.WidgetList){
            this.WidgetList[i].Draw(this.MainView, this.AnnotationVisibility);
        }
    }

    // Draw a rectangle in the overview representing the camera's view.
    if (this.OverView) {
        this.MainView.Camera.Draw(this.OverView);
        if (this.HistoryFlag) {
            this.OverView.DrawHistory(this.MainView.Viewport[3]);
        }
    }

    var cache = this.GetCache();
    if (cache != undefined) {
        var copyright = cache.Image.copyright;
        this.MainView.DrawCopyright(copyright);
    }
    // I am using shift for stack interaction.
    // Turn on the focal point when shift is pressed.
    if (EVENT_MANAGER.CursorFlag && EDIT) {
        this.MainView.DrawFocalPoint();
        if (this.StackCorrelations) {
            this.MainView.DrawCorrelations(this.StackCorrelations, this.ViewerIndex);
        }
    }

    // Here to trigger FINISHED_LOADING_CALLBACK
    LoadQueueUpdate();
    //console.timeEnd("ViewerDraw");
}

// Makes the viewer clean to setup a new slide...
Viewer.prototype.Reset = function() {
  this.SetCache(null);
  this.WidgetList = [];
  this.ShapeList = [];
}

// A list of shapes to render in the viewer
Viewer.prototype.AddShape = function(shape) {
  this.ShapeList.push(shape);
}

Viewer.prototype.Animate = function() {
  if (this.AnimateDuration <= 0.0) {
    return;
  }
  var timeNow = new Date().getTime();
  if (timeNow >= (this.AnimateLast + this.AnimateDuration)) {
    // We have past the target. Just set the target values.
    this.MainView.Camera.SetHeight(this.ZoomTarget);
    this.MainView.Camera.Roll = this.RollTarget;
    if (this.OverView) {
      this.OverView.Camera.Roll = this.RollTarget;
    }
    this.MainView.Camera.SetFocalPoint(this.TranslateTarget[0],
                                       this.TranslateTarget[1]);
    this.UpdateZoomGui();
    // Save the state when the animation is finished.
    RecordState();
  } else {
    // Interpolate
    var currentHeight = this.MainView.Camera.GetHeight();
    var currentCenter = this.MainView.Camera.GetFocalPoint();
    var currentRoll   = this.MainView.Camera.Roll;
    this.MainView.Camera.SetHeight(
          currentHeight + (this.ZoomTarget-currentHeight)
            *(timeNow-this.AnimateLast)/this.AnimateDuration);
    this.MainView.Camera.Roll
      = currentRoll + (this.RollTarget-currentRoll)
            *(timeNow-this.AnimateLast)/this.AnimateDuration;
    if (this.OverView) {
      this.OverView.Camera.Roll = this.MainView.Camera.Roll;
    }
    this.MainView.Camera.SetFocalPoint(
        currentCenter[0] + (this.TranslateTarget[0]-currentCenter[0])
            *(timeNow-this.AnimateLast)/this.AnimateDuration,
        currentCenter[1] + (this.TranslateTarget[1]-currentCenter[1])
            *(timeNow-this.AnimateLast)/this.AnimateDuration);
    // We are not finished yet.
    // Schedule another render
    eventuallyRender();
  }
  this.MainView.Camera.ComputeMatrix();
  if (this.OverView) {
    this.OverView.Camera.ComputeMatrix();
  }
  this.AnimateDuration -= (timeNow-this.AnimateLast);
  this.AnimateLast = timeNow;
  // Synchronize cameras is necessary
  this.TriggerInteraction();
}

Viewer.prototype.OverViewPlaceCamera = function(x, y) {
  if ( ! this.OverView) {
    return;
  }
  // Compute focal point from inverse overview camera.
  x = x/this.OverView.Viewport[2];
  y = y/this.OverView.Viewport[3];
  x = (x*2.0 - 1.0)*this.OverView.Camera.Matrix[15];
  y = (1.0 - y*2.0)*this.OverView.Camera.Matrix[15];
  var m = this.OverView.Camera.Matrix;
  var det = m[0]*m[5] - m[1]*m[4];
  var xNew = (x*m[5]-y*m[4]+m[4]*m[13]-m[5]*m[12]) / det;
  var yNew = (y*m[0]-x*m[1]-m[0]*m[13]+m[1]*m[12]) / det;

  // Animate to get rid of jerky panning (overview to low resolution).
  this.TranslateTarget[0] = xNew;
  this.TranslateTarget[1] = yNew;
  this.AnimateLast = new Date().getTime();
  this.AnimateDuration = 100.0;
  eventuallyRender();
}




/**/
Viewer.prototype.HandleTouchStart = function(event) {
    this.MomentumX = 0.0;
    this.MomentumY = 0.0;
    this.MomentumRoll = 0.0;
    this.MomentumScale = 0.0;
    if (this.MomentumTimerId) {
        window.cancelAnimationFrame(this.MomentumTimerId)
        this.MomentumTimerId = 0;
    }

    // Four finger grab resets the view.
    if ( event.Touches.length >= 4) {
        var cam = this.GetCamera();
        var bds = this.MainView.Section.GetBounds();
        cam.SetFocalPoint( (bds[0]+bds[1])*0.5, (bds[2]+bds[3])*0.5);
        cam.Roll = 0.0;
        cam.SetHeight(bds[3]-bds[2]);
        cam.ComputeMatrix();
        eventuallyRender();
        // Return value hides navigation widget
        return true;
    }

    // See if any widget became active.
    if (this.AnnotationVisibility) {
        for (var touchIdx = 0; touchIdx < event.Touches.length; ++touchIdx) {
            event.MouseX = event.Touches[touchIdx][0];
            event.MouseY = event.Touches[touchIdx][1];
            this.ComputeMouseWorld(event);
            for (var i = 0; i < this.WidgetList.length; ++i) {
                if ( ! this.WidgetList[i].GetActive() &&
                     this.WidgetList[i].CheckActive(event)) {
                    this.ActivateWidget(this.WidgetList[i]);
                    return true;
                }
            }
        }
    }

    return false;
}

// Only one touch
Viewer.prototype.HandleTouchPan = function(event) {
    if (event.Touches.length != 1 || event.LastTouches.length != 1) {
        // Sanity check.
        return;
    }

    // Forward the events to the widget if one is active.
    if (this.ActiveWidget != undefined) {
        this.ActiveWidget.HandleTouchPan(event);
        return;
    }

    // I see an odd intermittent camera matrix problem
    // on the iPad that looks like a thread safety issue.
    if (this.MomentumTimerId) {
        window.cancelAnimationFrame(this.MomentumTimerId)
        this.MomentumTimerId = 0;
    }

    // Convert to world by inverting the camera matrix.
    // I could simplify and just process the vector.
    w0 = this.ConvertPointViewerToWorld(event.LastMouseX, event.LastMouseY);
    w1 = this.ConvertPointViewerToWorld(    event.MouseX,     event.MouseY);

    // This is the new focal point.
    var dx = w1[0] - w0[0];
    var dy = w1[1] - w0[1];
    var dt = event.Time - event.LastTime;

    // Remember the last motion to implement momentum.
    var momentumX = dx/dt;
    var momentumY = dy/dt;

    this.MomentumX = (this.MomentumX + momentumX) * 0.5;
    this.MomentumY = (this.MomentumY + momentumY) * 0.5;
    this.MomentumRoll = 0.0;
    this.MomentumScale = 0.0;

    var cam = this.GetCamera();
    cam.Translate( -dx, -dy, 0);
    cam.ComputeMatrix();
    eventuallyRender();
}

Viewer.prototype.HandleTouchRotate = function(event) {
    var numTouches = event.Touches.length;
    if (event.LastTouches.length != numTouches || numTouches  != 3) {
        // Sanity check.
        return;
    }

    // I see an odd intermittent camera matrix problem
    // on the iPad that looks like a thread safety issue.
    if (this.MomentumTimerId) {
        window.cancelAnimationFrame(this.MomentumTimerId)
        this.MomentumTimerId = 0;
    }

    w0 = this.ConvertPointViewerToWorld(event.LastMouseX, event.LastMouseY);
    w1 = this.ConvertPointViewerToWorld(    event.MouseX,     event.MouseY);
    var dt = event.Time - event.LastTime;

    // Compute rotation.
    // Consider weighting rotation by vector length to avoid over contribution of short vectors.
    // We could also take the maximum.
    var x;
    var y;
    var a = 0;
    for (var i = 0; i < numTouches; ++i) {
        x = event.LastTouches[i][0] - event.LastMouseX;
        y = event.LastTouches[i][1] - event.LastMouseY;
        var a1  = Math.atan2(y,x);
        x = event.Touches[i][0] - event.MouseX;
        y = event.Touches[i][1] - event.MouseY;
        a1 = a1 - Math.atan2(y,x);
        if (a1 > Math.PI) { a1 = a1 - (2*Math.PI); }
        if (a1 < -Math.PI) { a1 = a1 + (2*Math.PI); }
        a += a1;
    }
    a = a / numTouches;

    // rotation and scale are around the mid point .....
    // we need to compute focal point height and roll (not just a matrix).
    // Focal point is the only difficult item.
    var cam = this.GetCamera();
    w0[0] = cam.FocalPoint[0] - w1[0];
    w0[1] = cam.FocalPoint[1] - w1[1];
    var c = Math.cos(a);
    var s = Math.sin(a);
    // This is the new focal point.
    x = w1[0] + (w0[0]*c - w0[1]*s);
    y = w1[1] + (w0[0]*s + w0[1]*c);

    // Remember the last motion to implement momentum.
    var momentumRoll = a/dt;

    this.MomentumX = 0.0;
    this.MomentumY = 0.0;
    this.MomentumRoll = (this.MomentumRoll + momentumRoll) * 0.5;
    this.MomentumScale = 0.0;

    cam.Roll = cam.Roll - a;
    cam.ComputeMatrix();
    if (this.OverView) {
        var cam2 = this.OverView.Camera;
        cam2.Roll = cam.Roll;
        cam2.ComputeMatrix();
    }
    eventuallyRender();
}

Viewer.prototype.HandleTouchPinch = function(event) {
    var numTouches = event.Touches.length;
    if (event.LastTouches.length != numTouches || numTouches  != 2) {
        // Sanity check.
        return;
    }

    // I see an odd intermittent camera matrix problem
    // on the iPad that looks like a thread safety issue.
    if (this.MomentumTimerId) {
        window.cancelAnimationFrame(this.MomentumTimerId)
        this.MomentumTimerId = 0;
    }

    w0 = this.ConvertPointViewerToWorld(event.LastMouseX, event.LastMouseY);
    w1 = this.ConvertPointViewerToWorld(    event.MouseX,     event.MouseY);
    var dt = event.Time - event.LastTime;
    // iPad / iPhone must have low precision time
    if (dt == 0) {
        return;
    }

    // Compute scale.
    // Consider weighting rotation by vector length to avoid over contribution of short vectors.
    // We could also take max.
    // This should rarely be an issue and could only happen with 3 or more touches.
    var scale = 1;
    var s0 = 0;
    var s1 = 0;
    for (var i = 0; i < numTouches; ++i) {
        x = event.LastTouches[i][0] - event.LastMouseX;
        y = event.LastTouches[i][1] - event.LastMouseY;
        s0 += Math.sqrt(x*x + y*y);
        x = event.Touches[i][0] - event.MouseX;
        y = event.Touches[i][1] - event.MouseY;
        s1 += Math.sqrt(x*x + y*y);
    }
    // This should not happen, but I am having trouble with NaN camera parameters.
    if (s0 < 2 || s1 < 2) {
        return;
    }
    scale = s1/ s0;


    // Forward the events to the widget if one is active.
    if (this.ActiveWidget != null) {
        event.PinchScale = scale;
        this.ActiveWidget.HandleTouchPinch(event);
        return;
    }



    // scale is around the mid point .....
    // we need to compute focal point height and roll (not just a matrix).
    // Focal point is the only difficult item.
    var cam = this.GetCamera();
    w0[0] = cam.FocalPoint[0] - w1[0];
    w0[1] = cam.FocalPoint[1] - w1[1];
    // This is the new focal point.
    var x = w1[0] + w0[0] / scale;
    var y = w1[1] + w0[1] / scale;

    // Remember the last motion to implement momentum.
    var momentumScale = (scale-1)/dt;

    this.MomentumX = 0.0;
    this.MomentumY = 0.0;
    this.MomentumRoll = 0.0;
    this.MomentumScale = (this.MomentumScale + momentumScale) * 0.5;

    cam.FocalPoint[0] = x;
    cam.FocalPoint[1] = y;
    cam.SetHeight(cam.GetHeight() / scale);
    cam.ComputeMatrix();
    eventuallyRender();
}

Viewer.prototype.HandleTouchEnd = function(event) {
    if (this.ActiveWidget != null) {
        this.ActiveWidget.HandleTouchEnd(event);
        return;
    }
    //this.UpdateZoomGui();
    this.HandleMomentum(event);
}
/**/




Viewer.prototype.HandleMomentum = function(event) {
    // I see an odd intermittent camera matrix problem
    // on the iPad that looks like a thread safety issue.
    if (this.MomentumTimerId) {
        window.cancelAnimationFrame(this.MomentumTimerId)
        this.MomentumTimerId = 0;
    }
    
    var t = new Date().getTime();
    if (t - event.LastTime < 50) {
        var self = this;
        this.MomentumTimerId = requestAnimFrame(function () { self.HandleMomentum(event);});
        return;
    }
    
    // Integrate the momentum.
    event.LastTime = event.Time;
    event.Time = t;
    var dt = event.Time - event.LastTime;
    
    var k = 200.0;
    var decay = Math.exp(-dt/k);
    var integ = (-k * decay + k);
    
    var cam = this.MainView.Camera;
    cam.Translate(-(this.MomentumX * integ), -(this.MomentumY * integ), 0);
    cam.SetHeight(cam.Height / ((this.MomentumScale * integ) + 1));
    cam.Roll = cam.Roll - (this.MomentumRoll* integ);
    cam.ComputeMatrix();
    if (this.OverView) {
        var cam2 = this.OverView.Camera;
        cam2.Roll = cam.Roll;
        cam2.ComputeMatrix();
    }
    // I think the problem with the ipad is thie asynchronous render.
    // Maybe two renders occur at the same time.
    //eventuallyRender();
    draw();
    
    // Decay the momentum.
    this.MomentumX *= decay;
    this.MomentumY *= decay;
    this.MomentumScale *= decay;
    this.MomentumRoll *= decay;
    
    if (Math.abs(this.MomentumX) < 0.01 && Math.abs(this.MomentumY) < 0.01 &&
        Math.abs(this.MomentumRoll) < 0.0002 && Math.abs(this.MomentumScale) < 0.00005) {
        // Change is small. Stop the motion.
        this.MomentumTimerId = 0;
        if (this.InteractionState != INTERACTION_NONE) {
            this.InteractionState = INTERACTION_NONE;
            RecordState();
        }
        this.UpdateZoomGui();
    } else {
        var self = this;
        this.MomentumTimerId = requestAnimFrame(function () { self.HandleMomentum(event);});
    }
}


Viewer.prototype.ConstrainCamera = function () {
    var bounds = this.GetOverViewBounds();
    if ( ! bounds) {
        // Cache has not been set.
        return;
    }
    var spacing = this.MainView.GetLeafSpacing();
    var viewport = this.MainView.GetViewport();
    var cam = this.MainView.Camera;
    
    var modified = false;
    if (cam.FocalPoint[0] < bounds[0]) {
        cam.SetFocalPoint(bounds[0], cam.FocalPoint[1]);
        modified = true;
    }
    if (cam.FocalPoint[0] > bounds[1]) {
        cam.SetFocalPoint(bounds[1], cam.FocalPoint[1]);
        modified = true;
    }
    if (cam.FocalPoint[1] < bounds[2]) {
        cam.SetFocalPoint(cam.FocalPoint[0], bounds[2]);
        modified = true;
    }
    if (cam.FocalPoint[1] > bounds[3]) {
        cam.SetFocalPoint(cam.FocalPoint[0], bounds[3]);
        modified = true;
    }
    var heightMax = 2*(bounds[3]-bounds[2]);
    if (cam.GetHeight() > heightMax) {
        cam.SetHeight(heightMax);
        this.ZoomTarget = heightMax;
        modified = true;
    }
    var heightMin = viewport[3] * spacing * 0.5;
    if (cam.GetHeight() < heightMin) {
        cam.SetHeight(heightMin);
        this.ZoomTarget = heightMin;
        modified = true;
    }
    if (modified) {
        cam.ComputeMatrix();
    }
}


Viewer.prototype.HandleOverViewMouseDown = function(event) {
    this.InteractionState = INTERACTION_OVERVIEW;
    var x = event.offsetX;
    var y = event.offsetY;
    // Transform to view's coordinate system.
    this.OverViewPlaceCamera(x, y);
    return true;
}    

Viewer.prototype.HandleOverViewMouseMove = function(event) {
    if (this.InteractionState !== INTERACTION_OVERVIEW) {
        return false;
    }
    var x = event.offsetX;
    var y = event.offsetY;
    this.OverViewPlaceCamera(x, y);
    // Animation handles the render.
    return true;
}




Viewer.prototype.HandleMouseDown = function(event) {
    event.preventDefault(); // Keep browser from selecting images.
    EVENT_MANAGER.RecordMouseDown(event);
    if (EVENT_MANAGER.DoubleClick) {
        // Without this, double click selects sub elementes.
        event.preventDefault();
        return this.HandleDoubleClick(event);
    }

    // Forward the events to the widget if one is active.
    if (this.ActiveWidget != null) {
	      return this.ActiveWidget.HandleMouseDown(event);
    }
    
    // Choose what interaction will be performed.
    if (event.which == 1 ) {
	      if (event.ctrlKey) {
	          this.InteractionState = INTERACTION_ROTATE;
	      } else if (event.altKey) {
	          this.InteractionState = INTERACTION_ZOOM;
	      } else {
	          this.InteractionState = INTERACTION_DRAG;
	      }
	      return false;
    }
    if (event.which == 2 ) {
	      this.InteractionState = INTERACTION_ROTATE;
	      return false;
    }
    return true;
}

Viewer.prototype.HandleDoubleClick = function(event) {
    if (this.ActiveWidget != null) {
        return this.ActiveWidget.HandleDoubleClick(event);
    }
    
    mWorld = this.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
    if (event.which == 1) {
        this.AnimateZoomTo(0.5, mWorld);
    } else if (event.which == 3) {
        this.AnimateZoomTo(2.0, mWorld);
    }
    return true;
}

Viewer.prototype.HandleMouseUp = function(event) {
    EVENT_MANAGER.RecordMouseUp(event);
    // Forward the events to the widget if one is active.
    if (this.ActiveWidget != null) {
        this.ActiveWidget.HandleMouseUp(event);
        return false; // trying to keep the browser from selecting images
    }
    
    if (this.InteractionState != INTERACTION_NONE) {
        this.InteractionState = INTERACTION_NONE;
        RecordState();
    }
    
    return false; // trying to keep the browser from selecting images
}

Viewer.prototype.ComputeMouseWorld = function(event) {
    // We need to save these for pasting annotation.
    this.MouseWorld = this.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
    // Maybe we should save this in the viewer and not in the event.
    event.worldX = this.MouseWorld[0];
    event.worldY= this.MouseWorld[1];
}

Viewer.prototype.HandleMouseMove = function(event) {
    event.preventDefault(); // Keep browser from selecting images.
    if ( ! EVENT_MANAGER.RecordMouseMove(event)) { return; }
    this.ComputeMouseWorld(event);
    
    // Forward the events to the widget if one is active.
    if (this.ActiveWidget != null) {
	      this.ActiveWidget.HandleMouseMove(event);
        return false; // trying to keep the browser from selecting images
    }
    
    if (event.which == 0) {
	      // See if any widget became active.
	      if (this.AnnotationVisibility) {
	          for (var i = 0; i < this.WidgetList.length; ++i) {
		            if (this.WidgetList[i].CheckActive(event)) {
		                this.ActivateWidget(this.WidgetList[i]);
                    return false; // trying to keep the browser from selecting images
		            }
	          }
	      }
	      
        return false; // trying to keep the browser from selecting images
    }
    
    var x = event.offsetX;
    var y = event.offsetY;
    
    // Drag camera in main view.
    // Dragging is too slow.  I want to accelerate dragging the further
    // this mouse moves.  This is a moderate change, so I am
    // going to try to accelerate with speed.
    if (this.InteractionState == INTERACTION_ROTATE) {
	      // Rotate
	      // Origin in the center.
	      // GLOBAL GL will use view's viewport instead.
	      var cx = x - (this.MainView.Viewport[2]*0.5);
	      var cy = y - (this.MainView.Viewport[3]*0.5);
	      // GLOBAL views will go away when views handle this.
	      this.MainView.Camera.HandleRoll(cx, cy, 
					                              EVENT_MANAGER.MouseDeltaX, 
					                              EVENT_MANAGER.MouseDeltaY);
	      //if (this.OverView) {
	      //    this.OverView.Camera.HandleRoll(cx, cy, event.MouseDeltaX, event.MouseDeltaY);
	      //}
	      this.RollTarget = this.MainView.Camera.Roll;
        this.UpdateCamera();
    } else if (this.InteractionState == INTERACTION_ZOOM) {
	      var dy = EVENT_MANAGER.MouseDeltaY / this.MainView.Viewport[2];
	      this.MainView.Camera.SetHeight(this.MainView.Camera.GetHeight()
                                       / (1.0 + (dy* 5.0)));
	      this.ZoomTarget = this.MainView.Camera.GetHeight();
        this.UpdateCamera();
    } else if (this.InteractionState == INTERACTION_DRAG) {
	      // Translate
	      // Convert to view [-0.5,0.5] coordinate system.
	      // Note: the origin gets subtracted out in delta above.
	      var dx = -EVENT_MANAGER.MouseDeltaX / this.MainView.Viewport[2];
	      var dy = -EVENT_MANAGER.MouseDeltaY / this.MainView.Viewport[2];
	      // compute the speed of the movement.
	      var speed = Math.sqrt(dx*dx + dy*dy) / EVENT_MANAGER.MouseDeltaTime;
	      speed = 1.0 + speed*1000; // f(0) = 1 and increasing.
	      // I am not sure I like the speed acceleration.
	      // Lets try a limit.
	      if (speed > 3.0) { speed = 3.0; }
	      dx = dx * speed;
	      dy = dy * speed;
	      this.MainView.Camera.HandleTranslate(dx, dy, 0.0);
    }
    // The only interaction that does not go through animate camera.
    this.TriggerInteraction();
    eventuallyRender();
    return false; // trying to keep the browser from selecting images
}

Viewer.prototype.HandleMouseWheel = function(event) {
    // Forward the events to the widget if one is active.
    if (this.ActiveWidget != null) {
	      return false;
    }
    
    // We want to accumulate the target, but not the duration.
    var tmp = 0;
    if (event.deltaY) {
	      tmp = event.deltaY;
    } else if (event.wheelDelta) {
	      tmp = event.wheelDelta;
    }
    // Wheel event seems to be in increments of 3.
    // depreciated mousewheel had increments of 120....
    // Initial delta cause another bug.
    // Lets restrict to one zoom step per event.
    if (tmp > 0) {
	      this.ZoomTarget *= 1.1;
    } else if (tmp < 0) {
	      this.ZoomTarget /= 1.1;
    }
    
    // Compute translate target to keep position in the same place.
    //this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0];
    //this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1];
    var position = this.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
    var factor = this.ZoomTarget / this.MainView.Camera.GetHeight();
    this.TranslateTarget[0] = position[0] 
	      - factor * (position[0] - this.MainView.Camera.FocalPoint[0]);
    this.TranslateTarget[1] = position[1] 
	      - factor * (position[1] - this.MainView.Camera.FocalPoint[1]);
    
    this.RollTarget = this.MainView.Camera.Roll;
    
    this.AnimateLast = new Date().getTime();
    this.AnimateDuration = 200.0; // hard code 200 milliseconds
    eventuallyRender();
    return true;
}

var SAVING_IMAGE = undefined;

// returns false if the event was "consumed" (browser convention).
// Returns true if nothing was done with the event.
Viewer.prototype.HandleKeyDown = function(event) {
    if (event.keyCode == 83 && event.ctrlKey) { // control -s to save.
        if ( ! SAVING_IMAGE) {
            SAVING_IMAGE = new Dialog();
            SAVING_IMAGE.Title.text('Saving');
            SAVING_IMAGE.WaitingImage = $('<img>')
                .appendTo(SAVING_IMAGE.Body)
                .attr("src", "/webgl-viewer/static/circular.gif")
                .attr("alt", "waiting...")
                .css({'width':'40px'});
            SAVING_IMAGE.ApplyButton.hide();
            SAVING_IMAGE.SavingFlag = false;
            SAVING_IMAGE.Count = 0;
        }
        if ( ! SAVING_IMAGE.SavingFlag) {
            SAVING_IMAGE.SavingFlag = true;
            SAVING_IMAGE.Show(1);
            this.EventuallySaveImage("slideAtlas"+ZERO_PAD(SAVING_IMAGE.Count,3), 
                                     function() {
                                         SAVING_IMAGE.SavingFlag = false;
                                         SAVING_IMAGE.Count += 1;
                                         SAVING_IMAGE.Hide();
                                     });
        }
        return false;
    }
    
    // Handle paste
    if (event.keyCode == 86 && event.ctrlKey) {
        // control-v for paste
        
        var clip = JSON.parse(localStorage.ClipBoard);
        if (clip.Type == "CircleWidget") {
            var widget = new CircleWidget(this, false);
            widget.PasteCallback(clip.Data, this.MouseWorld);
        }
        if (clip.Type == "PolylineWidget") {
            var widget = new PolylineWidget(this, false);
            widget.PasteCallback(clip.Data, this.MouseWorld);
        }
        if (clip.Type == "TextWidget") {
            var widget = new TextWidget(this, "");
            widget.PasteCallback(clip.Data, this.MouseWorld);
        }
        
        return false;
    }    
    
    //----------------------
    if (this.ActiveWidget != null) {
        if ( ! this.ActiveWidget.HandleKeyPress(event)) {
            return false;
        }
    }
    
    if (String.fromCharCode(event.keyCode) == 'R') {
        //this.MainView.Camera.Reset();
        this.MainView.Camera.ComputeMatrix();
        this.ZoomTarget = this.MainView.Camera.GetHeight();
        eventuallyRender();
        return false;
    }
    
    if (event.keyCode == 38) {
        // Up cursor key
        var cam = this.GetCamera();
        var c = Math.cos(cam.Roll);
        var s = -Math.sin(cam.Roll);
        var dx = 0.0;
        var dy = -0.9 * cam.GetHeight();
        var rx = dx*c - dy*s;
        var ry = dx*s + dy*c;
        this.TranslateTarget[0] = cam.FocalPoint[0] + rx;
        this.TranslateTarget[1] = cam.FocalPoint[1] + ry;
        this.AnimateLast = new Date().getTime();
        this.AnimateDuration = 200.0;
        eventuallyRender();
        return false;
    } else if (event.keyCode == 40) {
        // Down cursor key
        var cam = this.GetCamera();
        var c = Math.cos(cam.Roll);
        var s = -Math.sin(cam.Roll);
        var dx = 0.0;
        var dy = 0.9 * cam.GetHeight();
        var rx = dx*c - dy*s;
        var ry = dx*s + dy*c;
        this.TranslateTarget[0] = cam.FocalPoint[0] + rx;
        this.TranslateTarget[1] = cam.FocalPoint[1] + ry;
        this.AnimateLast = new Date().getTime();
        this.AnimateDuration = 200.0;
        eventuallyRender();
        return false;
    } else if (event.keyCode == 37) {
        // Left cursor key
        var cam = this.GetCamera();
        var c = Math.cos(cam.Roll);
        var s = -Math.sin(cam.Roll);
        var dx = -0.9 * cam.GetWidth();
        var dy = 0.0;
        var rx = dx*c - dy*s;
        var ry = dx*s + dy*c;
        this.TranslateTarget[0] = cam.FocalPoint[0] + rx;
        this.TranslateTarget[1] = cam.FocalPoint[1] + ry;
        this.AnimateLast = new Date().getTime();
        this.AnimateDuration = 200.0;
        eventuallyRender();
        return false;
    } else if (event.keyCode == 39) {
        // Right cursor key
        var cam = this.GetCamera();
        var c = Math.cos(cam.Roll);
        var s = -Math.sin(cam.Roll);
        var dx = 0.9 * cam.GetWidth();
        var dy = 0.0;
        var rx = dx*c - dy*s;
        var ry = dx*s + dy*c;
        this.TranslateTarget[0] = cam.FocalPoint[0] + rx;
        this.TranslateTarget[1] = cam.FocalPoint[1] + ry;
        this.AnimateLast = new Date().getTime();
        this.AnimateDuration = 200.0;
        eventuallyRender();
        return false;
    }
    return true;
}


// Get the current scale factor between pixels and world units.
Viewer.prototype.GetPixelsPerUnit = function() {
  // Determine the scale difference between the two coordinate systems.
  var viewport = this.GetViewport();
  var cam = this.MainView.Camera;
  var m = cam.Matrix;

  // Convert from world coordinate to view (-1->1);
  return 0.5*viewport[2] / (m[3] + m[15]); // m[3] for x, m[7] for height
}

// Covert a point from world coordiante system to viewer coordinate system (units pixels).
Viewer.prototype.ConvertPointWorldToViewer = function(x, y) {
  var viewport = this.GetViewport();
  var cam = this.MainView.Camera;
  var m = cam.Matrix;

  // Convert from world coordinate to view (-1->1);
  var h = (x*m[3] + y*m[7] + m[15]);
  var xNew = (x*m[0] + y*m[4] + m[12]) / h;
  var yNew = (x*m[1] + y*m[5] + m[13]) / h;
  // Convert from view to screen pixel coordinates.
  xNew = (1.0+xNew)*0.5*viewport[2];
  yNew = (1.0-yNew)*0.5*viewport[3];

  return [xNew, yNew];
}


Viewer.prototype.ConvertPointViewerToWorld = function(x, y) {
  var viewport = this.GetViewport();
  var cam = this.MainView.Camera;

  // Convert to world coordinate system
  // Compute focal point from inverse overview camera.
  x = x/viewport[2];
  y = y/viewport[3];
  x = (x*2.0 - 1.0)*cam.Matrix[15];
  y = (1.0 - y*2.0)*cam.Matrix[15];
  var m = cam.Matrix;
  var det = m[0]*m[5] - m[1]*m[4];
  var xNew = (x*m[5]-y*m[4]+m[4]*m[13]-m[5]*m[12]) / det;
  var yNew = (y*m[0]-x*m[1]-m[0]*m[13]+m[1]*m[12]) / det;

  return [xNew, yNew];
}

// Where else should I put this?
function colorNameToHex(color)
{
    var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
    "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
    "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
    "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
    "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
    "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
    "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
    "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
    "honeydew":"#f0fff0","hotpink":"#ff69b4",
    "indianred ":"#cd5c5c","indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
    "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
    "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
    "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
    "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
    "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
    "navajowhite":"#ffdead","navy":"#000080",
    "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
    "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
    "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
    "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
    "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
    "violet":"#ee82ee",
    "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
    "yellow":"#ffff00","yellowgreen":"#9acd32"};

    if (typeof colors[color.toLowerCase()] != 'undefined')
        return colors[color.toLowerCase()];

    return false;
}




