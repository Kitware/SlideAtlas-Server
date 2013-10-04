// Singleton instance delegates events to viewers based on their viewport.
// I assume that multiple threads will not access the manager.

// I need to implement 3d widgets.
// When we create a drawing item (arrow) the arrow will follow the mouse until
// the first mouse press which will set the tip position.
// If the mouse moves while the button is pressed, the tail of the arrow
// will follow the mouse position.  Button release will set the tail.

// I will wait for later to make 3d widget hot spots.

// I will make a new class to handle arrow events.
// Should the manager or the Viewer delegate?



// NOTE:  For this class events are passed in from outside.
// For all other classes, the event manager is an "event".



function EventManager (canvas) {
    this.Canvas = canvas[0];
    this.Viewers = [];
    this.CurrentViewer = null;
    this.ShiftKeyPressed = false;
    this.ControlKeyPressed = false;
    this.Key = '';
    this.MouseX = 0;
    this.MouseY = 0;
    this.LastMouseX = 0;
    this.LastMouseY = 0;
    this.MouseDown = false;
}

EventManager.prototype.AddViewer = function(viewer) {
    this.Viewers.push(viewer);
}

EventManager.prototype.ChooseViewer = function() {
  this.CurrentViewer = null;
  for (var i = 0; i < this.Viewers.length; ++i) {
    var vport = this.Viewers[i].GetViewport();
    if (this.MouseX > vport[0] && this.MouseX < vport[0]+vport[2] &&
      this.MouseY > vport[1] && this.MouseY < vport[1]+vport[3]) {
      this.CurrentViewer = this.Viewers[i];
      return;
    }
  }
}

EventManager.prototype.SetMousePositionFromEvent = function(event) {
  this.SystemEvent = event;
  if (event.clientX && event.clientY) {
    // Translate to coordinate of canvas
    // There has to be a better what to get the offset of the canvas relative to the body (or screen even).
    // Here I loop through the parents accumilating the offset.
    var docObj = this.Canvas;
    var xOffset = docObj.offsetLeft;
    var yOffset = docObj.offsetTop;
    while (docObj.offsetParent != null) {
      docObj = docObj.offsetParent;
      xOffset += docObj.offsetLeft;
      yOffset += docObj.offsetTop;
      }
    // Scoll bars on html body element.
    var body = document.getElementsByTagName("body");
    xOffset -= body[0].scrollLeft;
    yOffset -= body[0].scrollTop;

    this.MouseX = event.clientX-xOffset;
    this.MouseY = CANVAS.innerHeight() - (event.clientY-yOffset);
  }
}

function GoFullScreen() {
  var isInFullScreen = (document.fullScreenElement && document.fullScreenElement !==  null) ||   
          (document.mozFullScreen || document.webkitIsFullScreen);

  var docElm = document.documentElement;
  if (!isInFullScreen) {

      if (docElm.requestFullscreen) {
          docElm.requestFullscreen();
      }
      else if (docElm.mozRequestFullScreen) {
          docElm.mozRequestFullScreen();
      }
      else if (docElm.webkitRequestFullScreen) {
          docElm.webkitRequestFullScreen();
      }
  }
  handleResize();
  eventuallyRender();
}


// Save the previous touches and record the new
// touch locations in viewport coordinates.
EventManager.prototype.HandleTouch = function(e) {
  if (!e) {
    var e = event;
  }
  e.preventDefault();

  this.SystemEvent = e;
  this.LastTouches = this.Touches;
  var can = this.Canvas;
  this.Touches = [];
  for (var i = 0; i < e.targetTouches.length; ++i) {
    var x = e.targetTouches[i].pageX - can.offsetLeft;
    var y = CANVAS.innerHeight() - (e.targetTouches[i].pageY - can.offsetTop);
    this.Touches.push([x,y]);
  }
}


EventManager.prototype.HandleTouchStart = function(e) {
  this.HandleTouch(e);
  this.MouseX = this.Touches[0][0];
  this.MouseY = this.Touches[0][1];
  this.ChooseViewer();
  if (this.CurrentViewer) {
    this.MouseDown = true;
    this.CurrentViewer.HandleTouchStart(this);
  }  
}


EventManager.prototype.HandleTouchMove = function(e) {
  this.HandleTouch(e);

  this.MouseX = this.Touches[0][0];
  this.MouseY = this.Touches[0][1];
  this.ChooseViewer();
  if (this.CurrentViewer) {
    this.MouseDown = true;
    this.CurrentViewer.HandleTouchMove(this);
  }  
}  

EventManager.prototype.HandleTouchEnd = function(e) {
  this.MouseDown = false;
  if (this.CurrentViewer) {
    e.preventDefault();
    this.CurrentViewer.HandleTouchEnd(this);
  }
}

EventManager.prototype.HandleTouchCancel = function(event) {
  console.log("touchCancel");
  this.MouseDown = false;
}


EventManager.prototype.HandleMouseDown = function(event) {
  this.LastMouseX = this.MouseX;
  this.LastMouseY = this.MouseY;

  this.SetMousePositionFromEvent(event);
  this.ChooseViewer();

  if (this.CurrentViewer) {
    event.preventDefault();
    //event.stopPropagation(); // does not work.  Right mouse still brings up browser menu.

    var d = new Date();
    var dTime = d.getTime() - this.MouseUpTime;
    if (dTime < 200.0) { // 200 milliseconds
      PENDING_SHOW_PROPERTIES_MENU = false;
      this.CurrentViewer.HandleDoubleClick(this);
      return;
    }

    this.MouseDown = true;
    this.CurrentViewer.HandleMouseDown(this);
  }
}


var PENDING_SHOW_PROPERTIES_MENU = false;
var SHOW_PROPERTIES_MOUSE_POSITION;
function ShowPendingPropertiesMenu() {
  if (PENDING_SHOW_PROPERTIES_MENU) {
    ShowPropertiesMenu(SHOW_PROPERTIES_MOUSE_POSITION[0], SHOW_PROPERTIES_MOUSE_POSITION[1]);
  }
}

EventManager.prototype.HandleMouseUp = function(event) {
  if ( ! this.MouseDown) {
    // This will occur if on double clicks (and probably if mouse down was outside canvas).
    return;
  }
  this.SetMousePositionFromEvent(event);
  this.MouseDown = false;

  this.ChooseViewer();
  if (this.CurrentViewer) {
    this.CurrentViewer.HandleMouseUp(this);
  }

  // Record time so we can detect double click.
  this.MouseUpTime = new Date().getTime();

  // Should we let the viewer handle this?
  // Can it supress on double click?
  if (event.which == 3 && this.CurrentViewer.ActiveWidget == null) {
    // Wait to make sure this is not a double click.
    PENDING_SHOW_PROPERTIES_MENU = true;
    SHOW_PROPERTIES_MOUSE_POSITION = [event.clientX, event.clientY];
    setTimeout(function(){ShowPendingPropertiesMenu();},200);
  }
}

// Forward event to view.
EventManager.prototype.HandleMouseMove = function(event) {
  this.LastMouseX = this.MouseX;
  this.LastMouseY = this.MouseY;
  this.SetMousePositionFromEvent(event);
  this.MouseDeltaX = this.MouseX - this.LastMouseX;
  this.MouseDeltaY = this.MouseY - this.LastMouseY;

  this.ChooseViewer();
  if (this.CurrentViewer) {
    this.CurrentViewer.HandleMouseMove(this);
  }
}

EventManager.prototype.HandleMouseWheel = function(event) {
  this.SetMousePositionFromEvent(event);
  this.ChooseViewer();
  if (this.CurrentViewer) {
	  event.preventDefault();
    //event.stopPropagation(); // does not work.  Right mouse still brings up browser menu.
    this.CurrentViewer.HandleMouseWheel(this);
  }
}

//------------- Keys ---------------

EventManager.prototype.HandleKeyDown = function(event) {
  if (event.keyCode == 16) {
    // Shift key modifier.
    this.ShiftKeyPressed = true;
  }
  if (event.keyCode == 17) {
    // Control key modifier.
    this.ControlKeyPressed = true;
  }

  // Handle undo and redo (cntrl-z, cntrl-y)
  if (this.ControlKeyPressed && event.keyCode == 90) {
    // Function in recordWidget.
    UndoState();
  } else if (this.ControlKeyPressed && event.keyCode == 89) {
    // Function in recordWidget.
    RedoState();
  }
    
  this.ChooseViewer();
  if (this.CurrentViewer) {
    // All the keycodes seem to be Capitals.  Sent the shift modifier so we can compensate.
    this.CurrentViewer.HandleKeyPress(event.keyCode, this.ShiftKeyPressed);
  }
}

EventManager.prototype.HandleKeyUp = function(event) {
  if (event.keyCode == 16) {
    // Shift key modifier.
    this.ShiftKeyPressed = false;
  } else if (event.keyCode == 17) {
    // Control key modifier.
    this.ControlKeyPressed = false;
  }
}
