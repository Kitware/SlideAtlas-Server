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
    this.Canvas = canvas;
    this.Viewers = [];
    this.CurrentViewer = null;
    this.ShiftKeyPressed = false;
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
    this.MouseY = this.Canvas.height - (event.clientY-yOffset);
  }
}

EventManager.prototype.HandleMouseDown = function(event) {
  this.LastMouseX = this.MouseX;
  this.LastMouseY = this.MouseY;  
  
  this.SetMousePositionFromEvent(event);
  this.MouseDown = true;
  
  this.ChooseViewer();
  if (this.CurrentViewer) {
    //event.stopPropagation(); // does not work.  Right mouse still brings up browser menu.
    this.CurrentViewer.HandleMouseDown(this);
  }
}

EventManager.prototype.HandleMouseUp = function(event) {
  this.SetMousePositionFromEvent(event);
  this.MouseDown = false;

  this.ChooseViewer();
  if (this.CurrentViewer) {
    this.CurrentViewer.HandleMouseUp(this);
  }
}

// Forward even to view.
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
  }
}
