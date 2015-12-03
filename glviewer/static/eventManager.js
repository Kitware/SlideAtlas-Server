// This used to receive all events and route them to the two viewers.
// Now the viewers receive their own events, and this class is less
// necessary.  I may be able to get rid of it (or make it a minimal helper).



function EventManager (canvas) {
    this.MouseUpTime = 0;
    this.MouseTime = 0;
    this.DoubleClick = false;

    // I cannot figure out how to do this with focus of canvas ...
    // KeyFocus
    this.HasFocus = true;
    this.Canvas = canvas[0];
    this.Viewers = [];
    this.CurrentViewer = undefined;

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

    // TODO: Move these events into a stack manager.
    var self = this;
    //$('body').keydown(function (e) {self.HandleKeyDown(e);});
    //$('body').keyup(function (e) {self.HandleKeyUp(e);});

    this.CursorFlag = false;

    if (MOBILE_DEVICE == 'Andriod') {
        var width = CANVAS.innerWidth();
        var height = CANVAS.innerHeight();
        var self = this;
        //this.FullScreenSweep = this.AddSweepListener(width*0.5, height*0.95,  0,1, "Full Screen",
        //                                             function(sweep) {self.GoFullScreen();});
    }

    this.StartInteractionListeners = [];

    var self = this;
    document.body.addEventListener(
        "touchcancel", 
        function () {
            self.HandleTouchCancel();
        },
        false);
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

EventManager.prototype.SetMousePositionFromEvent = function(event) {
    // TODO: Get rid of system event.
    this.SystemEvent = event;
    if (event.offsetX && event.offsetY) {
        this.MouseX = event.offsetX;
        this.MouseY = event.offsetY;
        this.MouseTime = (new Date()).getTime();
    } else if (event.layerX && event.layerY) {
        this.MouseX = event.layerX;
        this.MouseY = event.layerY;
        this.MouseTime = (new Date()).getTime();
        event.offsetX = event.layerX;
        event.offsetY = event.layerY;
    }
}


var PENDING_SHOW_PROPERTIES_MENU = false;
var SHOW_PROPERTIES_MOUSE_POSITION;
function ShowPendingPropertiesMenu() {
  if (PENDING_SHOW_PROPERTIES_MENU) {
    ShowPropertiesMenu(SHOW_PROPERTIES_MOUSE_POSITION[0], SHOW_PROPERTIES_MOUSE_POSITION[1]);
  }
}

EventManager.prototype.RecordMouseDown = function(event) {
    this.LastMouseX = this.MouseX;
    this.LastMouseY = this.MouseY;
    this.LastMouseTime = this.MouseTime;
    this.SetMousePositionFromEvent(event);
    
    // TODO:  Formalize a call back to make GUI disappear when 
    // navigation starts.  I think I did this already but have not
    // converted this code yet.
    // Get rid of the favorites and the link divs if they are visible
    if (typeof LINK_DIV !== 'undefined' && LINK_DIV.is(':visible')) { 
	      LINK_DIV.fadeOut();
    }
    if (typeof FAVORITES_WIDGET !== 'undefined' && 
	      FAVORITES_WIDGET.hidden == false) { 
	      FAVORITES_WIDGET.ShowHideFavorites();
    }
    
    var date = new Date();
    var dTime = date.getTime() - this.MouseUpTime;
    if (dTime < 200.0) { // 200 milliseconds
        this.DoubleClick = true;
    }
            
    /*
      if (this.CurrentViewer) {
      this.TriggerStartInteraction();
      }
    */
}

EventManager.prototype.RecordMouseUp = function(event) {
    //if ( ! this.MouseDown) {
        // This will occur if on double clicks (and probably if mouse down was outside canvas).
   //     return;
    //}
    this.SetMousePositionFromEvent(event);
    this.MouseDown = false;
    
    // Record time so we can detect double click.
    var date = new Date();
    this.MouseUpTime = date.getTime();
    this.DoubleClick = false;
}

EventManager.prototype.RecordMouseMove = function(event) {
    this.LastMouseX = this.MouseX;
    this.LastMouseY = this.MouseY;
    this.LastMouseTime = this.MouseTime;
    this.SetMousePositionFromEvent(event);
    this.MouseDeltaX = this.MouseX - this.LastMouseX;
    this.MouseDeltaY = this.MouseY - this.LastMouseY;
    this.MouseDeltaTime = this.MouseTime - this.LastMouseTime;
    return this.MouseDeltaX != 0 || this.MouseDeltaY != 0;
}

EventManager.prototype.HandleMouseWheel = function(event) {
  this.SetMousePositionFromEvent(event);
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

    if (SA.Presentation) {
        SA.Presentation.HandleKeyUp(event);
        return true;
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
                        .attr('src',SA.ImagePathUrl+"sweepArrowUp.png");

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
    this.Arrow.attr('src',SA.ImagePathUrl+"sweepArrowRight.png")
              .css({'left': x+'px',
                    'bottom' : (y-arrowWidth/2)+'px'});
    // I cannot predict the location with rotated text.
    //this.Div.css({'transform' : 'rotate(90deg)',
    //              '-ms-transform' : 'rotate(90deg)',
    //              '-webkit-transform' : 'rotate(90deg)'});
    this.Div.css({'left': (x+(arrowWidth-divWidth)/2)+'px',
                  'bottom' : (y-divHeight-(arrowHeight/2))+'px'});
  } else if (this.Direction[0] == -1) {
    this.Arrow.attr('src',SA.ImagePathUrl+"sweepArrowLeft.png")
              .css({'left': (x-arrowWidth)+'px',
                    'bottom' : (y-arrowWidth/2)+'px'});
    this.Div.css({'left': (x+(-arrowWidth-divWidth)/2)+'px',
                  'bottom' : (y-divHeight-(arrowHeight/2))+'px'});
  } else if (this.Direction[1] == 1) {
    this.Arrow.attr('src',SA.ImagePathUrl+"sweepArrowUp.png")
              .css({'left': (x-arrowWidth/2)+'px',
                    'bottom' : y+'px'});
    this.Div.css({'left': (x-divWidth/2)+'px',
                  'bottom' : (y-divHeight)+'px'});
  } else if (this.Direction[1] == -1) {
    this.Arrow.attr('src',SA.ImagePathUrl+"sweepArrowDown.png");
    this.Arrow.attr('src',SA.ImagePathUrl+"sweepArrowUp.png")
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
EventManager.prototype.HandleTouch = function(e, startFlag, viewer) {
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

    // Still used on mobile devices?
    var viewport = viewer.GetViewport();
    this.SystemEvent = e;
    this.LastTouches = this.Touches;
    var can = this.Canvas;
    this.Touches = [];
    for (var i = 0; i < e.targetTouches.length; ++i) {
        var offset = viewer.MainView.Canvas.offset();
        var x = e.targetTouches[i].pageX - offset.left;
        var y = e.targetTouches[i].pageY - offset.top;
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

    // Hack because we are moving away from using the event manager
    // Mouse interaction are already independant...
    this.offsetX = this.MouseX;
    this.offsetY = this.MouseY;


    return true;
}


EventManager.prototype.HandleTouchStart = function(e, viewer) {
    this.HandleTouch(e, true, viewer);
    if (this.StartTouchTime == 0) {
        this.StartTouchTime = this.Time;
    }

    if (viewer) {
        if (viewer.HandleTouchStart(this)) {
            this.TriggerStartInteraction();
        }
    }
}


EventManager.prototype.HandleTouchMove = function(e, viewer) {
    // Put a throttle on events
    if ( ! this.HandleTouch(e, false, viewer)) { return; }

    if (SA.DualDisplay.NavigationWidget && 
        SA.DualDisplay.NavigationWidget.Visibility) {
        // No slide interaction with the interface up.
        // I had bad interaction with events going to browser.
        SA.DualDisplay.NavigationWidget.ToggleVisibility();
    }

    if (typeof(MOBILE_ANNOTATION_WIDGET) != "undefined" && 
               MOBILE_ANNOTATION_WIDGET.Visibility) {
        // No slide interaction with the interface up.
        // I had bad interaction with events going to browser.
        MOBILE_ANNOTATION_WIDGET.ToggleVisibility();
    }

    if (this.Touches.length == 1 && viewer) {
        viewer.HandleTouchPan(this);
        return;
    }
    if (this.Touches.length == 2 && viewer) {
        viewer.HandleTouchPinch(this);
        return
    }
    if (this.Touches.length == 3 && viewer) {
        viewer.HandleTouchRotate(this);
        return
    }
}

EventManager.prototype.HandleTouchEnd = function(e, viewer) {
    e.preventDefault();

    var t = new Date().getTime();
    this.LastTime = this.Time;
    this.Time = t;

    t = t - this.StartTouchTime;
    if (e.targetTouches.length == 0 && MOBILE_DEVICE) {
        this.StartTouchTime = 0;
        if (t < 90) {
            // We should not have a navigation widget on mobile
            // devices. (maybe iPad?).
            if (SA.DualDisplay && SA.DualDisplay.NavigationWidget) {
                SA.DualDisplay.NavigationWidget.ToggleVisibility();
            }
            if (typeof(MOBILE_ANNOTATION_WIDGET) != "undefined") {
                MOBILE_ANNOTATION_WIDGET.ToggleVisibility();
            }
            return;
        }
        if (viewer) {
            viewer.HandleTouchEnd(this);
        }
    }
}

EventManager.prototype.HandleTouchCancel = function(event) {
    this.MouseDown = false;
}







