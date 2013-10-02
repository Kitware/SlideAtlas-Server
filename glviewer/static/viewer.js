//==============================================================================
// There is only one viewer that handles events.  It can forwad events
// to other objects as it see fit however.

// I am changing this to support three states of annotation visibility:
// None, Annotations, but no text, and all on.
var ANNOTATION_OFF = 0;
var ANNOTATION_NO_TEXT = 1;
var ANNOTATION_ON = 2;

var INTERACTION_NONE = 0;
var INTERACTION_DRAG = 1;
var INTERACTION_ROTATE = 2;
var INTERACTION_ZOOM = 3;

function Viewer (viewport, cache) {
  // Some of these could get transitioned to view or style ...
  // Left click option: Drag in main window, place in overview.
  this.OverViewEventFlag = false;

  // Interaction state:
  // What to do for mouse move or mouse up.
  this.InteractionState = INTERACTION_NONE;
  
  this.AnimateLast;
  this.AnimateDuration = 0.0;
  this.TranslateTarget = [0.0,0.0];
  
  this.MainView = new View(viewport, 1);
  this.MainView.OutlineColor = [0,0,0];
  this.MainView.Camera.ZRange = [0,1];
  this.MainView.Camera.ComputeMatrix();
  var overViewport = [viewport[0] + viewport[2]*0.8, 
                      viewport[1] + viewport[3]*0.8,
                      viewport[2]*0.18, viewport[3]*0.18];
  this.OverView = new View(overViewport, 2);
  this.OverView.Camera.ZRange = [-1,0];
  this.OverView.Camera.FocalPoint = [13000.0, 11000.0, 10.0];
  this.OverView.Camera.Height = 22000.0;
  this.OverView.Camera.ComputeMatrix();
  this.ZoomTarget = this.MainView.Camera.GetHeight();
  this.RollTarget = this.MainView.Camera.Roll;

  this.AnnotationVisibility = ANNOTATION_OFF;
  this.ShapeList = [];
  this.WidgetList = [];
  this.ActiveWidget = null;

  this.DoubleClickX = 0; 
  this.DoubleClickY = 0;

  this.GuiElements = [];
}

// TODO: LEGACY REMOVE
Viewer.prototype.SetDimensions = function(dims) {
  this.MainView.Section.Bounds = [0,dims[0], 0,dims[1]];
}

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

Viewer.prototype.SetSection = function(section) {
  if (section == null) {
    return;
  }
  this.MainView.Section = section;
  this.OverView.Section = section;
  //this.ShapeList = section.Markers;
  this.OverView.Camera.Height = section.Bounds[3]-section.Bounds[2];
  this.OverView.Camera.FocalPoint[0] = 0.5*(section.Bounds[0]+section.Bounds[1]);
  this.OverView.Camera.FocalPoint[1] = 0.5*(section.Bounds[2]+section.Bounds[3]);
  this.OverView.Camera.ComputeMatrix();
  eventuallyRender();
}


// Change the source / cache after a viewer has been created.
Viewer.prototype.SetCache = function(cache) {
  this.MainView.SetCache(cache);
  this.OverView.SetCache(cache);
  if (cache) {
    var bds = cache.Bounds;
    if (bds) {
      this.OverView.Camera.FocalPoint[0] = (bds[0] + bds[1]) / 2;
      this.OverView.Camera.FocalPoint[1] = (bds[2] + bds[3]) / 2;
      var height = (bds[3]-bds[2]);
      // See if the view is constrained by the width.
      var height2 = (bds[1]-bds[0]) * this.OverView.Viewport[3] / this.OverView.Viewport[2];
      if (height2 > height) {
        height = height2;
      }
      this.OverView.Camera.Height = height;
      this.OverView.Camera.ComputeMatrix();
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
      'bottom' : pos});
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
  var overViewport = [viewport[0] + viewport[2]*0.8, 
                      viewport[1] + viewport[3]*0.8,
                      viewport[2]*0.18, viewport[3]*0.18];
  this.OverView.SetViewport(overViewport);
  this.MainView.Camera.ComputeMatrix();
  this.OverView.Camera.ComputeMatrix();
}

Viewer.prototype.GetViewport = function() {
  return this.MainView.Viewport;
}

// To fix a bug in the perk and elmer uploader.
Viewer.prototype.ToggleMirror = function() {
    this.MainView.Camera.Mirror = ! this.MainView.Camera.Mirror;
    this.OverView.Camera.Mirror = ! this.OverView.Camera.Mirror;
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

// This is used to set the default camera so the complexities 
// of the target and overview are hidden.
Viewer.prototype.SetCamera = function(center, rotation, height) {
    this.MainView.Camera.Height = height;
    this.ZoomTarget = height;    

    this.MainView.Camera.FocalPoint[0] = center[0];
    this.MainView.Camera.FocalPoint[1] = center[1];
    //this.MainView.Camera.FocalPoint[2] = center[2];
    this.TranslateTarget[0] = center[0];
    this.TranslateTarget[1] = center[1];
    
    rotation = rotation * 3.14159265359 / 180.0;
    this.MainView.Camera.Roll = rotation;
    this.OverView.Camera.Roll = rotation;
    this.RollTarget = rotation;

    this.MainView.Camera.ComputeMatrix();
    this.OverView.Camera.ComputeMatrix();
    eventuallyRender();
}

Viewer.prototype.GetCamera = function() {
    return this.MainView.Camera;
}

Viewer.prototype.GetSpacing = function() {
  var cam = this.GetCamera();
  var viewport = this.GetViewport();
  return cam.Height / viewport[3];
}

// I could merge zoom methods if position defaulted to focal point.
Viewer.prototype.AnimateDoubleClickZoom = function(factor, position) {
  this.ZoomTarget = this.MainView.Camera.Height * factor;
  if (this.ZoomTarget < 0.9 / (1 << 5)) {
    this.ZoomTarget = 0.9 / (1 << 5);
  }
  factor = this.ZoomTarget / this.MainView.Camera.Height; // Actual factor after limit.
  
  // Compute traslate target to keep position in the same place.
  this.TranslateTarget[0] = position[0] - factor * (position[0] - this.MainView.Camera.FocalPoint[0]);
  this.TranslateTarget[1] = position[1] - factor * (position[1] - this.MainView.Camera.FocalPoint[1]);
  
  this.RollTarget = this.MainView.Camera.Roll;

  this.AnimateLast = new Date().getTime();
  this.AnimateDuration = 200.0; // hard code 200 milliseconds
  eventuallyRender();
}

Viewer.prototype.AnimateZoom = function(factor) {
  this.ZoomTarget = this.MainView.Camera.Height * factor;
  if (this.ZoomTarget < 0.9 / (1 << 5)) {
    this.ZoomTarget = 0.9 / (1 << 5);
  }

  this.RollTarget = this.MainView.Camera.Roll;
  this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0];
  this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1];

  this.AnimateLast = new Date().getTime();
  this.AnimateDuration = 200.0; // hard code 200 milliseconds
  eventuallyRender();
}

Viewer.prototype.AnimateTranslate = function(dx, dy) {
  this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0] + dx;
  this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1] + dy;

  this.ZoomTarget = this.MainView.Camera.Height;
  this.RollTarget = this.MainView.Camera.Roll;
  
  this.AnimateLast = new Date().getTime();
  this.AnimateDuration = 200.0; // hard code 200 milliseconds
  eventuallyRender();
}

Viewer.prototype.AnimateRoll = function(dRoll) {
  dRoll *= Math.PI / 180.0;
  this.RollTarget = this.MainView.Camera.Roll + dRoll;
 
  this.ZoomTarget = this.MainView.Camera.Height;
  this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0];
  this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1];

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
    case "pencil":
      var pencil = new PencilWidget(this, false);
      pencil.Load(obj);  
      break;
    case "arrow":
      var arrow = new ArrowWidget(this, false);
      arrow.Load(obj);  
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
  // connectome
  if ( ! this.MainView.Section) {
    return;
  }

  // Should the camera have the viewport in them?
  // The do not currently hav a viewport.

  // Rendering text uses blending / transparency.
  if (GL) {
    GL.disable(GL.BLEND);
    GL.enable(GL.DEPTH_TEST);
  }
  
  this.MainView.DrawTiles();
  this.OverView.DrawTiles();

  // Draw a rectangle in the overview representing the camera's view.
  this.MainView.Camera.Draw(this.OverView);

  // This is only necessary for webgl, Canvas2d just uses a border.
  this.MainView.DrawOutline(false);
  this.OverView.DrawOutline(true);

  if (this.AnnotationVisibility) {
    for(i=0; i<this.ShapeList.length; i++){
      this.ShapeList[i].Draw(this.MainView);
    }
    for(i in this.WidgetList){
      this.WidgetList[i].Draw(this.MainView, this.AnnotationVisibility);
    }
  }
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
    this.MainView.Camera.Height = this.ZoomTarget;
    this.OverView.Camera.Roll = this.MainView.Camera.Roll = this.RollTarget;
    this.MainView.Camera.FocalPoint[0] = this.TranslateTarget[0];
    this.MainView.Camera.FocalPoint[1] = this.TranslateTarget[1];

    // Save the state when the animation is finished.
    RecordState();
  } else {
    // Interpolate
    var currentHeight = this.MainView.Camera.GetHeight();
    var currentCenter = this.MainView.Camera.FocalPoint;
    var currentRoll   = this.MainView.Camera.Roll;
    this.MainView.Camera.Height
      = currentHeight + (this.ZoomTarget-currentHeight)
            *(timeNow-this.AnimateLast)/this.AnimateDuration;
    this.MainView.Camera.Roll = this.OverView.Camera.Roll
      = currentRoll + (this.RollTarget-currentRoll)
            *(timeNow-this.AnimateLast)/this.AnimateDuration;
    this.MainView.Camera.FocalPoint[0]
      = currentCenter[0] + (this.TranslateTarget[0]-currentCenter[0])
            *(timeNow-this.AnimateLast)/this.AnimateDuration;
    this.MainView.Camera.FocalPoint[1]
      = currentCenter[1] + (this.TranslateTarget[1]-currentCenter[1])
            *(timeNow-this.AnimateLast)/this.AnimateDuration;
    // We are not finished yet.
    // Schedule another render
    eventuallyRender();
  }
  this.MainView.Camera.ComputeMatrix();
  this.OverView.Camera.ComputeMatrix();
  this.AnimateDuration -= (timeNow-this.AnimateLast);
  this.AnimateLast = timeNow;
}    

Viewer.prototype.OverViewPlaceCamera = function(x, y) {
    // Compute focal point from inverse overview camera.
    x = x/this.OverView.Viewport[2];
    y = y/this.OverView.Viewport[3];
    x = (x*2.0 - 1.0)*this.OverView.Camera.Matrix[15];
    y = (y*2.0 - 1.0)*this.OverView.Camera.Matrix[15];
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

Viewer.prototype.HandleTouchMove = function(event) {
  // Note, scale and rotation might behave odd if the number
  // of touches changes in mid motion.
  var numTouches = event.Touches.length;
  if (event.LastTouches.length != numTouches || numTouches < 1) {
    return;
  }
  // Use the average touch for panning.
  var mid0 = [0,0];
  var mid1 = [0,0];
  for (var i = 0; i < numTouches; ++i) {
    mid0[0] += event.LastTouches[i][0];
    mid0[1] += event.LastTouches[i][1];
    mid1[0] += event.Touches[i][0];
    mid1[1] += event.Touches[i][1];
  }
  mid0[0] = mid0[0] / numTouches;
  mid0[1] = mid0[1] / numTouches;
  mid1[0] = mid1[0] / numTouches;
  mid1[1] = mid1[1] / numTouches;
  
  // We need the world location of the mid points
  // to constrain rotation and scale.
  // Scale the mids to view coordinates [-1->1]
  var viewport = this.GetViewport();
  var v0 = [0,0];
  var v1 = [0,0];
  v0[0] = 2*(mid0[0]-viewport[0]) / viewport[2] - 1;
  v0[1] = 2*(mid0[1]-viewport[1]) / viewport[3] - 1;
  v1[0] = 2*(mid1[0]-viewport[0]) / viewport[2] - 1;
  v1[1] = 2*(mid1[1]-viewport[1]) / viewport[3] - 1;
  // Convert to world by inverting the camera matrix.
  var cam = this.MainView.Camera;
  var m = cam.Matrix;
  v0[0] = (v0[0] * m[15]) - m[12];
  v0[1] = (v0[1] * m[15]) - m[13];
  v1[0] = (v1[0] * m[15]) - m[12];
  v1[1] = (v1[1] * m[15]) - m[13];
  var w0 = [0,0];
  var w1 = [0,0];
  var det = m[0]*m[5] - m[1]*m[4];
  w0[0] = (v0[0]*m[5]-v0[1]*m[4]) / det;
  w0[1] = (v0[1]*m[0]-v0[0]*m[1]) / det;
  w1[0] = (v1[0]*m[5]-v1[1]*m[4]) / det;
  w1[1] = (v1[1]*m[0]-v1[0]*m[1]) / det;
  
  // Compute scale and rotation.
  // Consider weighting rotation by vector length to avoid over contribution of short vectors.
  // We could also take max.
  // This should rarely be an issue and could only happen with 3 or more touches.
  var a = 0;
  var scale = 1;
  if (numTouches > 1) {
    var s0 = 0;
    var s1 = 0;
    for (var i = 0; i < numTouches; ++i) {
      x = event.LastTouches[i][0] - mid0[0];
      y = event.LastTouches[i][1] - mid0[1];
      s0 += Math.sqrt(x*x + y*y);
      var a1  = Math.atan2(y,x);
      x = event.Touches[i][0] - mid1[0];
      y = event.Touches[i][1] - mid1[1];
      s1 += Math.sqrt(x*x + y*y);
      a1 = a1 - Math.atan2(y,x);
      if (a1 > Math.PI) { a1 = a1 - (2*Math.PI); }
      if (a1 < -Math.PI) { a1 = a1 + (2*Math.PI); }
      a += a1;
    }
    scale = s1/ s0;
    a = a / numTouches;
  }
  
  // rotation and scale are around the mid point .....
  // we need to compute focal point height and roll (not just a matrix).
  // Focal point is the only difficult item.
  w1[0] = cam.FocalPoint[0] - w1[0];
  w1[1] = cam.FocalPoint[1] - w1[1];
  var c = Math.cos(a);
  var s = Math.sin(a);
  var x = (w1[0]*c - w1[1]*s) / scale;
  var y = (w1[0]*s + w1[1]*c) / scale;
  cam.FocalPoint[0] = x + w0[0];  
  cam.FocalPoint[1] = y + w0[1];
  cam.Height = cam.Height / scale;
  cam.Roll = cam.Roll - a;
  cam.ComputeMatrix();  

  eventuallyRender();
}

Viewer.prototype.HandleTouchEnd = function(event) {
  // Forward the events to the widget if one is active.
  //if (this.ActiveWidget != null) {
    //this.ActiveWidget.HandleTouchEnd(event);
    //return;
  //}

  if (this.InteractionState != INTERACTION_NONE) {
    this.InteractionState = INTERACTION_NONE;
    RecordState();
  }
  
  return;
}






Viewer.prototype.HandleMouseDown = function(event) {
  // Forward the events to the widget if one is active.
  if (this.ActiveWidget != null) {
    this.ActiveWidget.HandleMouseDown(event);
    return;
  }
   
  // Are we in the overview or the main view?
  var x = event.MouseX;
  var y = event.MouseY;
  this.OverViewEventFlag = false;
  if (x > this.OverView.Viewport[0] && y > this.OverView.Viewport[1] &&
      x < this.OverView.Viewport[0]+this.OverView.Viewport[2] &&
      y < this.OverView.Viewport[1]+this.OverView.Viewport[3]) {
    this.OverViewEventFlag = true;
    // Transform to view's coordinate system.
    x = x - this.OverView.Viewport[0];
    y = y - this.OverView.Viewport[1];
    this.OverViewPlaceCamera(x, y);
    return;
  }

  // Choose what interaction will be performed.
  if (event.SystemEvent.which == 1 ) {
    if (event.SystemEvent.ctrlKey) {
      this.InteractionState = INTERACTION_ROTATE;
    } else if (event.SystemEvent.altKey) {    
      this.InteractionState = INTERACTION_ZOOM;
    } else {
      this.InteractionState = INTERACTION_DRAG;
    }
  }
  if (event.SystemEvent.which == 2 ) {
    this.InteractionState = INTERACTION_ROTATE;
  }
}

Viewer.prototype.HandleDoubleClick = function(event) {
  if (this.ActiveWidget != null) {
    this.ActiveWidget.HandleDoubleClick(event);
    return;
  }
  
  // Detect double click.
  mWorld = this.ConvertPointViewerToWorld(event.MouseX, event.MouseY);
  if (event.SystemEvent.which == 1) {
    this.AnimateDoubleClickZoom(0.5, mWorld);
    //this.AnimateZoom(0.5);
  } else if (event.SystemEvent.which == 3) {
    this.AnimateDoubleClickZoom(2.0, mWorld);
    //this.AnimateZoom(2.0);
  }
}

Viewer.prototype.HandleMouseUp = function(event) {
  // Forward the events to the widget if one is active.
  if (this.ActiveWidget != null) {
    this.ActiveWidget.HandleMouseUp(event);
    return;
  }

  if (this.InteractionState != INTERACTION_NONE) {
    this.InteractionState = INTERACTION_NONE;
    RecordState();
  }
  
  return;
}



Viewer.prototype.HandleMouseMove = function(event) {
  // Many shapes, widgets and interactors will need the mouse in world coodinates.
  var x = event.MouseX;
  var y = event.MouseY;
    
  var viewport = this.GetViewport();
  // Convert mouse to viewer coordinate system.
  // It would be nice to have this before this method.
  x = x - viewport[0];
  y = y - viewport[1];
  // Convert (x,y) to ???
  // Compute focal point from inverse overview camera.
  x = x/viewport[2];
  y = y/viewport[3];
  var cam = this.MainView.Camera;

  x = (x*2.0 - 1.0)*cam.Matrix[15];
  y = (y*2.0 - 1.0)*cam.Matrix[15];
  var m = cam.Matrix;
  var det = m[0]*m[5] - m[1]*m[4];
  event.MouseWorldX = (x*m[5]-y*m[4]+m[4]*m[13]-m[5]*m[12]) / det;
  event.MouseWorldY = (y*m[0]-x*m[1]-m[0]*m[13]+m[1]*m[12]) / det;
    
  // Forward the events to the widget if one is active.
  if (this.ActiveWidget != null) {
    this.ActiveWidget.HandleMouseMove(event);
    return;
  }
  
  // See if any widget became active.
  if (event.SystemEvent.which == 0 && this.AnnotationVisibility) {
    for (var i = 0; i < this.WidgetList.length; ++i) {
      if (this.WidgetList[i].CheckActive(event)) {
        this.ActivateWidget(this.WidgetList[i]);
        return;
      }
    }
  }
    
  if (event.MouseDown == false) {
    return;
  }
  
  var x = event.MouseX;
  var y = event.MouseY;

  if (this.OverViewEventFlag) {
    x = x - this.OverView.Viewport[0];
    y = y - this.OverView.Viewport[1];
    this.OverViewPlaceCamera(x, y);
    // Animation handles the render.
    return;
  }
    
  // Drag camera in main view.
  x = x - this.MainView.Viewport[0];
  y = y - this.MainView.Viewport[1];
  if (this.InteractionState == INTERACTION_ROTATE) {
    // Rotate
    // Origin in the center.
    // GLOBAL GL will use view's viewport instead.
    var cx = x - (this.MainView.Viewport[2]*0.5);
    var cy = y - (this.MainView.Viewport[3]*0.5);
    // GLOBAL views will go away when views handle this.
    this.MainView.Camera.HandleRoll(cx, cy, event.MouseDeltaX, event.MouseDeltaY);
    this.OverView.Camera.HandleRoll(cx, cy, event.MouseDeltaX, event.MouseDeltaY);
    this.RollTarget = this.MainView.Camera.Roll;
  } else if (this.InteractionState == INTERACTION_ZOOM) {
    var dy = event.MouseDeltaY / this.MainView.Viewport[2];
    this.MainView.Camera.Height *= (1.0 + (dy* 5.0));
    this.ZoomTarget = this.MainView.Camera.Height;
    this.MainView.Camera.ComputeMatrix();
  } else if (this.InteractionState == INTERACTION_DRAG) {
    // Translate
    // Convert to view [-0.5,0.5] coordinate system.
    // Note: the origin gets subtracted out in delta above.
    var dx = -event.MouseDeltaX / this.MainView.Viewport[2];
    var dy = -event.MouseDeltaY / this.MainView.Viewport[2];    
    this.MainView.Camera.HandleTranslate(dx, dy, 0.0);
  }
    eventuallyRender();
}

Viewer.prototype.HandleMouseWheel = function(event) {
  // Forward the events to the widget if one is active.
  if (this.ActiveWidget != null) {
    //this.ActiveWidget.HandleMouseDown(event);
    return;
  }
  // Compute traslate target to keep position in the same place.
  this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0];
  this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1];
  this.RollTarget = this.MainView.Camera.Roll;

  // we want to acumilate the target, but not the duration.
  var tmp = event.SystemEvent.wheelDelta;
  while (tmp > 0) {
    this.ZoomTarget *= 1.1;
    tmp -= 120;
  }
  while (tmp < 0) {
    this.ZoomTarget /= 1.1;
    tmp += 120;
  }

  // Artificial limit (fixme).
  if (this.ZoomTarget < 0.9 / (1 << 5)) {
    this.ZoomTarget = 0.9 / (1 << 5);
  }

  this.AnimateLast = new Date().getTime();
  this.AnimateDuration = 200.0; // hard code 200 milliseconds
  eventuallyRender();    
}

Viewer.prototype.HandleKeyPress = function(keyCode, shift) {
  // Handle connectome volume stuff.
  // TODO: integrate this with the 3d renal stack stuff.
  // connectome
  if (keyCode == 37) {
    // Left cursor key
    var idx = SECTIONS.indexOf(this.MainView.Section);
    if(idx > 0) {
      this.SetSection(idx-1);
    }
    eventuallyRender();
  } else if (keyCode == 39) {
    var idx = SECTIONS.indexOf(this.MainView.Section);
    if(idx >= 0 && idx < SECTIONS.length-1) {
      this.SetSection(idx+1);
    }
    eventuallyRender();
  }




  //----------------------
  if (this.ActiveWidget != null) {
    this.ActiveWidget.HandleKeyPress(keyCode, shift);
    return;
  }

  if (String.fromCharCode(keyCode) == 'R') {
    //this.MainView.Camera.Reset();
    this.MainView.Camera.ComputeMatrix();
    this.ZoomTarget = this.MainView.Camera.GetHeight();
    eventuallyRender();
  }

  if (keyCode == 38) {
    // Up cursor key
    this.ZoomTarget *= 2;
    this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0];
    this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1];
    this.AnimateLast = new Date().getTime();
    this.AnimateDuration = 200.0;
    eventuallyRender();
  } else if (keyCode == 40) {
    // Down cursor key
    if (this.ZoomTarget > 0.9 / (1 << 5)) {
      this.ZoomTarget *= 0.5;
      this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0];
      this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1];
      this.AnimateLast = new Date().getTime();
      this.AnimateDuration = 200.0;
      eventuallyRender();
    }
  }
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
  xNew = (xNew + 1.0)*0.5*viewport[2] + viewport[0];
  yNew = (yNew + 1.0)*0.5*viewport[3] + viewport[1];
    
  return [xNew, yNew];
}   


Viewer.prototype.ConvertPointViewerToWorld = function(x, y) {
  var viewport = this.GetViewport();
  var cam = this.MainView.Camera;

  // Convert from canvas/pixels to  coordinate system.
  // It would be nice to have this before this method.
  x = x - viewport[0];
  y = y - viewport[1];
  // Now we need to convert to world coordinate system
  
  // Compute focal point from inverse overview camera.
  x = x/viewport[2];
  y = y/viewport[3];
  x = (x*2.0 - 1.0)*cam.Matrix[15];
  y = (y*2.0 - 1.0)*cam.Matrix[15];
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




