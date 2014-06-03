//==============================================================================
// Place an arrow with a click of the mouse.  It does not change the arrows length.
// It is state based widget, so the stamp does not go away until a double click ...
// This widget palys a dual role:  When Arrow is false, the object places
// new arrows with clicks.  When Arrow is set, this simply draws an arrow
// (and maybe handles interaction in the future.)

/*

This is more complicated than I thought, so I'm just going to list the user actions and what the application should do to react to those actions.

Action: The user clicks on the dialog-widget button.
Result: Creates a div element with two children: 1) a div containing a line button and an X button, and 2) a textarea.  The parent div element will follow the mouse around.

Action: The user clicks on the screen with intent to fix the div in one place.
Result: Stops the parent div from following the mouse, sends focus to the textarea child.


Action: The user clicks on the line button.
Result: The textarea child is hidden/revealed, and the parent div shrinks/grows to fit.

Action: The user clicks on the X button.
Result: The entire widget is deleted.

Action: The user clicks and drags on a part of the widget that's not the textarea or buttons.
Result: The widget follows the mouse.

The widget has several states.
1) State that allows it to follow the mouse.  (this.Deactivate() puts the widget into state 2 or 3)
2) State with textarea revealed.  (hide() and show() switch between these two middle states)
3) State with textarea hidden.
4) Deleted.  (Need a function to do this.) (Function made, copy/paste where needed)
5) State of click-and-dragging.

*/

var DIALOG_WIDGET_MOVING = 0;// State 1 from comments.
var DIALOG_WIDGET_ACTIVE = 1;// State 2 from comments.
var DIALOG_WIDGET_WAITING = 2;// State 3 from comments.
var DIALOG_WIDGET_DRAGGING = 3;


function DialogWidget (viewer, newFlag) {
  if (viewer == null) {
    return;
  }
  this.Popup = new WidgetPopup(this);
  this.Viewer = viewer;
  this.Viewer.WidgetList.push(this);
  
  this.Viewer.ActivateWidget(this);
  
  var self = this;
  
  this.Cursor = $('<div>').appendTo('body')
      .css({
        'position': 'absolute',
        'width': '330px',
        'height': '50px',
        'padding': '5px',
        'padding-right': '5px',
        'background-color': '#0000ff',
        'z-index': '1'});
        
  /**/
  this.Buttons = $('<div>').appendTo(this.Cursor)
      .css({
        'float': 'left'});
  /**/
  
  this.MinimizeButton = $('<button>').appendTo(this.Buttons)
      .css({
        'display': 'inline-block',
        'width': '30px',
        'background-color': '#ff0000'})
      .click(function(){ self.ToggleText(); }).html("_");
      
  this.DeleteButton = $('<button>').appendTo(this.Buttons)
      .css({
        'display': 'inline-block',
        'width': '30px',
        'background-color': '#ff0000'})
      .click(function(){ self.Delete(); }).html("X");/**/
      
  this.DragDiv = $('<div>').appendTo(this.Cursor)
      .css({
        'background-color': '#00ff00',
        'float': 'right',
        'width': '20px',
        'height': '20px'})
      .mousedown(function(){
        self.state = DIALOG_WIDGET_DRAGGING;
      });
  
  this.CursorText = $('<textarea>').appendTo(this.Cursor)
      .css({
        'width': '100%'})
      .focus(function(){
        self.Viewer.ActivateWidget(self);
      })
      .blur(function(){
        self.Viewer.DeactivateWidget(self);
      });
        
  /*this.Pointer = $('<img>').appendTo(this.Cursor)
      .css({
        'position': 'relative',
        'float': 'left',
        'height': '28px',
        'z-index': '1'})
      .attr('type','image')
      .attr('src',"/webgl-viewer/static/arrowWidget.png")
      .onclick(function({
          //TODO: function call that hides 
        });*/
      
  /*this.DeleteButton = $('<button>').appendTo(this.Cursor)
      .css({
        'float': 'right',
        
        })
      .onclick(function(){
          //Add function later that entirely deletes widget
        });*/
  
  /*$('<img>').appendTo('body')
      .css({
        'position': 'absolute',
        'height': '28px',
        'z-index': '1'})
      .attr('type','image')
      .attr('src',"/webgl-viewer/static/arrowWidget.png");*/

  this.ActiveCenter = [0,0];

  this.Arrow = false;
  this.State = DIALOG_WIDGET_MOVING;
  this.WorldPoint = [0,0];
  this.DragOffset = [0,0];
  if ( ! newFlag) {
      this.Arrow = new Arrow();
      this.Arrow.FillColor = [0.0,1.0,1.0];
      this.State = DIALOG_WIDGET_WAITING;
      // Not interactive.  Push to the viewer.
      this.Viewer.WidgetList.push(this);
      this.Cursor.hide();
  }
}


DialogWidget.prototype.ToggleText = function(){
  if(this.State == DIALOG_WIDGET_ACTIVE){
    //alert("Hide");
    this.CursorText.hide();
    this.State = DIALOG_WIDGET_WAITING;
  } else {
    //alert("Show");
    this.CursorText.show();
    this.State = DIALOG_WIDGET_ACTIVE;
  }
}

DialogWidget.prototype.Delete = function(){
  this.SetActive(false);
  this.Cursor.hide();
  // We need to remove an item from a list.
  // shape list and widget list.
  this.RemoveFromViewer();
  eventuallyRender();
  //RecordState();
}


DialogWidget.prototype.Draw = function(view) {
  var pt = this.Viewer.ConvertPointWorldToViewer(this.WorldPoint[0], this.WorldPoint[1]);
  this.Cursor.css({'left': pt[0], 'top': pt[1]});
  //this.Pointer.css({'left': pt[0] + 350, 'top': pt[1] - 28});
}



DialogWidget.prototype.Serialize = function() {
  if ( ! this.Arrow){ return null; }
  var obj = new Object();
  obj.type = "arrow";
  obj.color = this.Arrow.Color;
  obj.width = this.Arrow.Width;
  obj.length = this.Arrow.Length;
  obj.orientation = this.Arrow.Orientation;
  obj.origin = this.Arrow.Origin;
  return obj;
}

// Load a widget from a json object (origin MongoDB).
DialogWidget.prototype.Load = function(obj) {
  if ( ! this.Arrow) { 
    this.Arrow = new Arrow();
  }
  //this.Arrow.Color = obj.color;
  this.Arrow.Width = obj.width;
  this.Arrow.Length = obj.length;
  this.Arrow.Orientation = obj.orientation;
  this.Arrow.Origin = obj.origin;

  this.Arrow.UpdateBuffers();
}

DialogWidget.prototype.HandleKeyPress = function(keyCode, shift) {
  return true;
}

// The current effect of this function is to set the widget to the unmovable state.
DialogWidget.prototype.Deactivate = function() {
  this.Popup.StartHideTimer();
  //this.Cursor.hide();
  this.Viewer.DeactivateWidget(this);
  this.State = DIALOG_WIDGET_ACTIVE;
  if (this.Arrow) {
    this.Arrow.Active = false;
  }
  eventuallyRender();
}

DialogWidget.prototype.HandleMouseDown = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;

  if (event.SystemEvent.which == 1) {
    //this.State = DIALOG_WIDGET_WAITING;
    
    var pt = this.Viewer.ConvertPointWorldToViewer(x,y);
    
    //Finding the distance to the upper left by subtracting the upper left coordinates from the click event viewer coordinates
    var UpperLeft = getPos(this.Cursor);
    
    var dx = pt[0] - UpperLeft[0];
    var dy = pt[1] - UpperLeft[1];
    
    //Conditions for clicking on a portion of the div that is not the textarea.
    //Since clicking on another portion would trigger an event, I just test if they click within the cursor rectangle.
    
    if((dx > 0) && (dy > 0) && (dx < this.Cursor.getWidth()) && (dy < this.Cursor.getHeight())){
      alert("Drag Click");
    } else {
      this.Deactivate();
      this.CursorText.focus();
    }
  }
}

DialogWidget.prototype.HandleMouseUp = function(event) {
  if (event.SystemEvent.which == 3) {
    // Right mouse was pressed.
    // Pop up the properties dialog.
    this.ShowPropertiesDialog();
  }
  // Middle mouse deactivates (here, 'deletes') the widget.
  if (event.SystemEvent.which == 2) {
    // Middle mouse was pressed.
    this.Deactivate();
  }
  
  if(this.State == DIALOG_WIDGET_DRAGGING){
    this.Deactivate();
  }
  
  this.DragOffset = [0,0];
  return false;
}

DialogWidget.prototype.HandleDoubleClick = function(event) {
  this.Deactivate();
}

function getPos(el) {
  // yay readability
  for(var lx=0, ly=0;
    el != null;
    lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
  return {x: lx,y: ly};
}

DialogWidget.prototype.HandleMouseMove = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;
  
  
  
  

  // Move the arrow icon to follow the mouse.
  

  if (this.State == DIALOG_WIDGET_DRAGGING) {
    this.Cursor.css({'left': (x-350), 'top': (y-10)});
    this.WorldPoint = this.Viewer.ConveryPointViewerToWorld(cx, cy);
  }

  if (this.State == DIALOG_WIDGET_MOVING) {
    this.Cursor.css({'left': (x-350), 'top': (y-10)});
    this.WorldPoint = this.Viewer.ConvertPointViewerToWorld(x-400,y-10);
  }

}


//This also shows the popup if it is not visible already.
DialogWidget.prototype.PlacePopup = function () {
  var pt = this.Viewer.ConvertPointWorldToViewer(this.ActiveCenter[0],
                                                 this.ActiveCenter[1]);
  pt[0] += 40;
  pt[1] -= 40;
  this.Popup.Show(pt[0],pt[1]);
}

DialogWidget.prototype.CheckActive = function(event) {
  if (this.State == DIALOG_WIDGET_MOVING) { return; }

  var pt = this.Viewer.ConvertPointWorldToViewer(this.ActiveCenter[0],
                                                 this.ActiveCenter[1]);

  var dx = event.MouseX - pt[0];
  var dy = event.MouseY - pt[1];
  var active = false;

  if (dx*dx + dy*dy < 1600) {
    active = true;
  }
 this.SetActive(active);
 return active;
}

DialogWidget.prototype.GetActive = function() {
  return false;
}

// Setting to active always puts state into "active".
// It can move to other states and stay active.
DialogWidget.prototype.SetActive = function(flag) {
  if (flag) {
    this.Viewer.ActivateWidget(this);
    this.State = DIALOG_WIDGET_ACTIVE;
    for (var i = 0; i < this.Shapes.length; ++i) {
      this.Shapes[i].Active = true;
    }
    this.PlacePopup();
    eventuallyRender();
  } else {
    this.Deactivate();
    this.Viewer.DeactivateWidget(this);
  }
}

DialogWidget.prototype.RemoveFromViewer = function() {
  if (this.Viewer == null) {
    return;
  }
  var idx = this.Viewer.WidgetList.indexOf(this);
  if(idx!=-1) {
    this.Viewer.WidgetList.splice(idx, 1);
  }
}

// Can we bind the dialog apply callback to an objects method?
DialogWidget.prototype.ShowPropertiesDialog = function () {
}

function DialogPropertyDialogApply() {
}

function DialogPropertyDialogCancel() {
}

function DialogPropertyDialogDelete() {
}



