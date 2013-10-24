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
  this.SweepListeners = [];
  this.SelectedSweepListener = undefined;
  
  if (MOBILE_DEVICE == 'Andriod') {
    var width = CANVAS.innerWidth();
    var height = CANVAS.innerHeight();
    var self = this;
    this.FullScreenSweep = this.AddSweepListener(width*0.5, height*0.95,  0,1, "Full Screen", 
                                                 function(sweep) {self.GoFullScreen();});
  }
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


//==============================================================================
// Touch events.

EventManager.prototype.IsFullScreen = function() {
  return (document.fullScreenElement && document.fullScreenElement !==  null) ||   
          (document.mozFullScreen || document.webkitIsFullScreen);
}


EventManager.prototype.GoFullScreen = function () {
  // Deactivate the listener
  if (this.FullScreenSweep) {
    this.FullScreenSweep.Active = false;
  }
  
  if (! this.IsFullScreen()) {
    var docElm = document.documentElement;
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


EventManager.prototype.NextNote = function () {
  NextNoteCallback();
}
EventManager.prototype.PreviousNote = function () {
  PreviousNoteCallback();
}



function SweepListener () {
  this.Active = true;
  this.Location = [0,0];
  this.Direction = [1,0];
  this.Label = "Sweep Here";

  this.Arrow = $('<img>').appendTo('body')
                        .hide()
                        .css({
                          'position': 'absolute',
                          'width': '20px',
                          'z-index': '1',
                          'opacity': '0.8'})
                        .attr('src',"webgl-viewer/static/sweepArrowUp.png");

  this.Div = 
    $('<div>').appendTo('body')
              .hide()
              .text("sweep")
              .attr('id','TEST')
              .css({'opacity': '0.8',
                    'z-index': '1',
                    'position': 'absolute',
                    'color': '#90b0ff',
                    'background-color' : '#ffffff'
                    });
}

SweepListener.prototype.Hide = function() {
  this.Arrow.hide();
  this.Div.hide();
}
    
SweepListener.prototype.Show = function() {
  if ( ! this.Active) { 
    this.Hide(); 
    return; 
  }
  this.Arrow.show();
  this.Div.show();
}

SweepListener.prototype.Update = function() {
  this.Div.text(this.Label);
  var arrowWidth = this.Arrow.innerWidth();
  var arrowHeight = this.Arrow.innerWidth();
  var divWidth = this.Div.innerWidth();
  var divHeight = this.Div.innerHeight();
  
  var x = this.Location[0];
  var y = this.Location[1];
  if (this.Direction[0] == 1) {
    this.Arrow.attr('src',"webgl-viewer/static/sweepArrowRight.png")
              .css({'left': x+'px',
                    'bottom' : (y-arrowWidth/2)+'px'});
    // I cannot predict the location with rotated text.
    //this.Div.css({'transform' : 'rotate(90deg)',
    //              '-ms-transform' : 'rotate(90deg)',
    //              '-webkit-transform' : 'rotate(90deg)'});
    this.Div.css({'left': (x+(arrowWidth-divWidth)/2)+'px',
                  'bottom' : (y-divHeight-(arrowHeight/2))+'px'});
  } else if (this.Direction[0] == -1) {
    this.Arrow.attr('src',"webgl-viewer/static/sweepArrowLeft.png")
              .css({'left': (x-arrowWidth)+'px',
                    'bottom' : (y-arrowWidth/2)+'px'});
    this.Div.css({'left': (x+(-arrowWidth-divWidth)/2)+'px',
                  'bottom' : (y-divHeight-(arrowHeight/2))+'px'});
  } else if (this.Direction[1] == 1) {
    this.Arrow.attr('src',"webgl-viewer/static/sweepArrowUp.png")
              .css({'left': (x-arrowWidth/2)+'px',
                    'bottom' : y+'px'});
    this.Div.css({'left': (x-divWidth/2)+'px',
                  'bottom' : (y-divHeight)+'px'});
  } else if (this.Direction[1] == -1) {
    this.Arrow.attr('src',"webgl-viewer/static/sweepArrowDown.png");
    this.Arrow.attr('src',"webgl-viewer/static/sweepArrowUp.png")
              .css({'left': (x-arrowWidth/2)+'px',
                    'bottom' : (y-arrowHeight)+'px'});
    this.Div.css({'left': (x-divWidth)+'px',
                  'bottom' : y+'px'});
  }
}


// Configurable sweep events.
// Only horizontal and vertical sweep directions for now.
EventManager.prototype.AddSweepListener = function(x, y, dx, dy, label, callback) {
  var sweep = new SweepListener();
  sweep.Location = [x,y];
  sweep.Direction = [dx,dy];
  sweep.Label = label;
  sweep.Callback = callback;
  sweep.Update();
  this.SweepListeners.push(sweep);
  return sweep;
}

EventManager.prototype.DetectSweepEvent = function(dx,dy) {
  for (var i = 0; i < this.SweepListeners.length; ++i) {
    var sweep = this.SweepListeners[i];
    if (sweep.Active) {
      if (dx*sweep.Direction[0] + dy*sweep.Direction[1] > 0.5) {
        // The sweep is the correct direction.
        if ((this.MouseX-sweep.Location[0])*sweep.Direction[0] +
            (this.MouseY-sweep.Location[1])*sweep.Direction[1] >= 0.0) {
          if ((this.LastMouseX-sweep.Location[0])*sweep.Direction[0] +
              (this.LastMouseY-sweep.Location[1])*sweep.Direction[1] < 0.0) {
            this.SelectedSweepListener = sweep;
            console.log("sweep " + sweep.Label);
          }
        }
      }
    }
  }  
}

EventManager.prototype.ShowSweepListeners = function() {
  // User may have taken it out of fullscreen.
  if ( ! this.IsFullScreen() && this.FullScreenSweep) {
    this.FullScreenSweep.Active = true;
  }
  for (var i = 0; i < this.SweepListeners.length; ++i) {
    var sweep = this.SweepListeners[i];
    sweep.Show();
  }  
}

EventManager.prototype.HideSweepListeners = function() {
  this.SelectedSweepListener = undefined;
  for (var i = 0; i < this.SweepListeners.length; ++i) {
    var sweep = this.SweepListeners[i];
    sweep.Hide();
  }
}



// Save the previous touches and record the new
// touch locations in viewport coordinates.
EventManager.prototype.HandleTouch = function(e, startFlag) {
  var t = new Date().getTime();
  // I have had trouble on the iPad with 0 delta times.
  // Lets see how it behaves with fewer events.
  if (t-this.Time < 20 && ! startFlag) { return false; }
  
  this.LastTime = this.Time;  
  this.Time = t;

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

  this.LastMouseX = this.MouseX;
  this.LastMouseY = this.MouseY;

  // Compute the touch average.
  var numTouches = this.Touches.length;
  this.MouseX = this.MouseY = 0.0;
  for (var i = 0; i < numTouches; ++i) {
    this.MouseX += this.Touches[i][0];
    this.MouseY += this.Touches[i][1];
  }
  this.MouseX = this.MouseX / numTouches;
  this.MouseY = this.MouseY / numTouches;

  return true;
}


EventManager.prototype.HandleTouchStart = function(e) {
  this.Tap = true;
  this.SelectedSweepListener = undefined;
  this.HandleTouch(e, true);
  this.ChooseViewer();
  if (this.CurrentViewer) {
    this.MouseDown = true;
    this.CurrentViewer.HandleTouchStart(this);
  }  
}


EventManager.prototype.HandleTouchMove = function(e) {
// Put a throttle on events
  if ( ! this.HandleTouch(e, false)) { return; }
    
  this.Tap = false;
  this.ChooseViewer();

  var numTouches = this.Touches.length;
  // Distinguish between 1 finger pan, 2 finger pinch, 3 finger rotate and two finger swipe.
  if (numTouches == 1) {
    this.HideSweepListeners();
    if (this.CurrentViewer) {
      this.CurrentViewer.HandleTouchPan(this);
    }
    return;
  }

  if (numTouches >= 3) {
    this.HideSweepListeners();
    if (this.CurrentViewer) {
      this.CurrentViewer.HandleTouchRotate(this);
      return
    }          
  }
  
  if (numTouches == 2) {
    // detect pinch
    var dot = (this.Touches[0][0]-this.LastTouches[0][0])*(this.Touches[1][0]-this.LastTouches[1][0]) +
              (this.Touches[0][1]-this.LastTouches[0][1])*(this.Touches[1][1]-this.LastTouches[1][1]);
    if (dot <= 0.0) {
      // Pinch
      if (this.CurrentViewer) {
        this.CurrentViewer.HandleTouchPinch(this);
      }      
      return
    }
    // Sweep
    var dx = this.MouseX - this.LastMouseX;
    var dy = this.MouseY - this.LastMouseY;
    if (Math.abs(dx) > 2*Math.abs(dy) ) {
      // place the sweep icon vertically.
      this.ShowSweepListeners();
      if (dx > 1) {this.DetectSweepEvent(1,0);}
      if (dx < 1) {this.DetectSweepEvent(-1,0);}
    } else if (Math.abs(dy) > 2*Math.abs(dx) ) {
      // place the sweep icon horizontally.
      this.ShowSweepListeners();
      if (dy > 1) {this.DetectSweepEvent(0,1);}
      if (dy < 1) {this.DetectSweepEvent(0,-1);}
    }
  }
}  

EventManager.prototype.HandleTouchEnd = function(e) {
  if (this.Tap && MOBILE_DEVICE) {
    NAVIGATION_WIDGET.ToggleVisibility();
  }
  if (this.SelectedSweepListener) {
    this.SelectedSweepListener.Callback(this.SelectedSweepListener);
    // The sweep could be removed from the list.
    this.SelectedSweepListener.Hide();
  }
  this.HideSweepListeners();


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







