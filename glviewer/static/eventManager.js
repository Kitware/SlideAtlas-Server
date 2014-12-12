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
  // I cannot figure out how to do this with focus of canvas ...
  // KeyFocus
  this.HasFocus = true;
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
  this.StartTouchTime = 0;

  this.CursorFlag = false;

  if (MOBILE_DEVICE == 'Andriod') {
    var width = CANVAS.innerWidth();
    var height = CANVAS.innerHeight();
    var self = this;
    //this.FullScreenSweep = this.AddSweepListener(width*0.5, height*0.95,  0,1, "Full Screen",
    //                                             function(sweep) {self.GoFullScreen();});
  }

  this.StartInteractionListeners = [];
}

EventManager.prototype.OnStartInteraction = function(callback) {
  this.StartInteractionListeners.push(callback);
}

EventManager.prototype.TriggerStartInteraction = function() {
  for (var i = 0; i < this.StartInteractionListeners.length; ++i) {
    callback = this.StartInteractionListeners[i];
    callback();
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
    if (event.offsetX && event.offsetY) {
        

        // Translate to coordinate of canvas
        // There has to be a better what to get the offset of the canvas relative to the body (or screen even).
        // Here I loop through the parents accumulating the offset.
        /* I do not think this is necessary anymore. I introduced the VIEW_PANEL.
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
        this.MouseY = event.clientY-yOffset;
        */

        this.MouseX = event.offsetX;
        this.MouseY = event.offsetY;
        this.MouseTime = (new Date()).getTime();
    }
}


EventManager.prototype.HandleMouseDown = function(event) {
  this.LastMouseX = this.MouseX;
  this.LastMouseY = this.MouseY;
  this.LastMouseTime = this.MouseTime;

  this.SetMousePositionFromEvent(event);
  this.ChooseViewer();

  // TODO:  Formalize a call back to make GUI disappear when navigation starts.
  // Get rid of the favorites and the link divs if they are visible
  if (typeof LINK_DIV !== 'undefined' && LINK_DIV.is(':visible')) { LINK_DIV.fadeOut();}
  if (typeof FAVORITES_WIDGET !== 'undefined' && FAVORITES_WIDGET.hidden == false) { FAVORITES_WIDGET.ShowHideFavorites();}

  if (this.CurrentViewer) {
    event.preventDefault();
    //event.stopPropagation(); // does not work.  Right mouse still brings up browser menu.

    var date = new Date();
    var dTime = date.getTime() - this.MouseUpTime;
    if (dTime < 200.0) { // 200 milliseconds
      PENDING_SHOW_PROPERTIES_MENU = false;
      if (this.CurrentViewer.HandleDoubleClick(this)) {
        this.TriggerStartInteraction();
      }
      return;
    }

    this.MouseDown = true;
    if (this.CurrentViewer.HandleMouseDown(this)) {
      this.TriggerStartInteraction();
    }
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
    var date = new Date();
    this.MouseUpTime = date.getTime();
    
    // Should we let the viewer handle this?
    // Can it supress on double click?
    /*
      if (event.which == 3 && this.CurrentViewer.ActiveWidget == null) {
      // Wait to make sure this is not a double click.
      PENDING_SHOW_PROPERTIES_MENU = true;
      SHOW_PROPERTIES_MOUSE_POSITION = [event.clientX, event.clientY];
      setTimeout(function(){ShowPendingPropertiesMenu();},200);
      }
    */
}

// Forward event to view.
EventManager.prototype.HandleMouseMove = function(event) {
  this.LastMouseX = this.MouseX;
  this.LastMouseY = this.MouseY;
  this.LastMouseTime = this.MouseTime;
  this.SetMousePositionFromEvent(event);
  this.MouseDeltaX = this.MouseX - this.LastMouseX;
  this.MouseDeltaY = this.MouseY - this.LastMouseY;
  this.MouseDeltaTime = this.MouseTime - this.LastMouseTime;

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
    if (this.CurrentViewer.HandleMouseWheel(this)) {
      this.TriggerStartInteraction();
    }
  }
}

//------------- Keys ---------------

EventManager.prototype.FocusIn = function() {
  this.HasFocus = true;
}

EventManager.prototype.FocusOut = function() {
  this.HasFocus = false;
}

EventManager.prototype.HandleKeyDown = function(event) {
  if ( ! this.HasFocus) {return true;}

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
    return true;
  } else if (this.ControlKeyPressed && event.keyCode == 89) {
    // Function in recordWidget.
    RedoState();
    return true;
  }

  this.ChooseViewer();
  if (this.CurrentViewer) {
      // All the keycodes seem to be Capitals.  Sent the shift modifier so we can compensate.
      if (this.CurrentViewer.HandleKeyPress(event.keyCode, this)) {
          // TODO: I choose return value true to stop processing event.
          // It should be false to match browser.
          return false;
      }
  }

  if (typeof(NAVIGATION_WIDGET) != "undefined") {
      if (NAVIGATION_WIDGET.HandleKeyPress(event.keyCode, this)) {
      return true;
    }
  }

  return true;
}

EventManager.prototype.HandleKeyUp = function(event) {
    if ( ! this.HasFocus) {return true;} 


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
        //this.CursorFlag = false;
        // what a pain.  Holding x down sometimes blocks mouse events.
        // Have to change to toggle.
        this.CursorFlag =  ! this.CursorFlag;
        if (event.shiftKey && this.CursorFlag) {
            testAlignTranslation();
            var self = this;
            window.setTimeout(function() {self.CursorFlag = false;}, 1000);
        }

        eventuallyRender();
        return false;
    }
    
    if (event.keyCode == 16) {
        // Shift key modifier.
        this.ShiftKeyPressed = false;
        //this.CursorFlag = false;
    } else if (event.keyCode == 17) {
        // Control key modifier.
        this.ControlKeyPressed = false;
    }

    return true;
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
  e.preventDefault();
  var date = new Date();
  var t = date.getTime();
  // I have had trouble on the iPad with 0 delta times.
  // Lets see how it behaves with fewer events.
  // It was a bug in iPad4 Javascript.
  // This throttle is not necessary.
  if (t-this.Time < 20 && ! startFlag) { return false; }

  this.LastTime = this.Time;
  this.Time = t;

  if (!e) {
    var e = event;
  }

  this.SystemEvent = e;
  this.LastTouches = this.Touches;
  var can = this.Canvas;
  this.Touches = [];
  for (var i = 0; i < e.targetTouches.length; ++i) {
    var x = e.targetTouches[i].pageX - can.offsetLeft;
    var y = e.targetTouches[i].pageY - can.offsetTop;
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
  this.HandleTouch(e, true);
  if (this.StartTouchTime == 0) {
    this.StartTouchTime = this.Time;
  }

  this.ChooseViewer();
  if (this.CurrentViewer) {
    if (this.CurrentViewer.HandleTouchStart(this)) {
      this.TriggerStartInteraction();
    }
  }
}


EventManager.prototype.HandleTouchMove = function(e) {
  // Put a throttle on events
  if ( ! this.HandleTouch(e, false)) { return; }

  if (NAVIGATION_WIDGET.Visibility) {
    // No slide interaction with the interface up.
    // I had bad interaction with events going to browser.
    NAVIGATION_WIDGET.ToggleVisibility();
  }

  if (MOBILE_ANNOTATION_WIDGET.Visibility) {
    // No slide interaction with the interface up.
    // I had bad interaction with events going to browser.
    MOBILE_ANNOTATION_WIDGET.ToggleVisibility();
  }

  this.ChooseViewer();
  if (this.Touches.length == 1 && this.CurrentViewer) {
    this.CurrentViewer.HandleTouchPan(this);
    return;
  }
  if (this.Touches.length == 2 && this.CurrentViewer) {
    this.CurrentViewer.HandleTouchPinch(this);
    return
  }
  if (this.Touches.length == 3 && this.CurrentViewer) {
    this.CurrentViewer.HandleTouchRotate(this);
    return
  }
}

EventManager.prototype.HandleTouchEnd = function(e) {
  e.preventDefault();

  var t = new Date().getTime();
  this.LastTime = this.Time;
  this.Time = t;

  t = t - this.StartTouchTime;
  if (e.targetTouches.length == 0 && MOBILE_DEVICE) {
    this.StartTouchTime = 0;
    if (t < 90) {
      NAVIGATION_WIDGET.ToggleVisibility();
      MOBILE_ANNOTATION_WIDGET.ToggleVisibility();
      return;
    }
    if (this.CurrentViewer) {
      this.CurrentViewer.HandleTouchEnd(this);
    }
  }
}

EventManager.prototype.HandleTouchCancel = function(event) {
  this.MouseDown = false;
}







