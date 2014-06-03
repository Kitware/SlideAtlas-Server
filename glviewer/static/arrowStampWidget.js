//==============================================================================
// Place an arrow with a click of the mouse.  It does not change the arrows length.
// It is state based widget, so the stamp does not go away until a double click ...
// This widget palys a dual role:  When Arrow is false, the object places
// new arrows with clicks.  When Arrow is set, this simply draws an arrow
// (and maye handles interaction in the future.)



var ARROW_STAMP_WIDGET_DRAWING = 0;
var ARROW_STAMP_WIDGET_ACTIVE = 1;
var ARROW_STAMP_WIDGET_WAITING = 2;


function ArrowStampWidget (viewer, newFlag) {
  if (viewer == null) {
    return;
  }
  this.Popup = new WidgetPopup(this);
  this.Viewer = viewer;
  // Do not push this to the viewers widget list because
  // we create a new arrowWidget for each click.

  this.Cursor = $('<img>').appendTo('body')
      .css({
        'position': 'absolute',
        'height': '28px',
        'z-index': '1'})
      .attr('type','image')
      .attr('src',"/webgl-viewer/static/arrowWidget.png");

  this.ActiveCenter = [0,0];

  this.Arrow = false;
  this.State = ARROW_STAMP_WIDGET_DRAWING;
  if ( ! newFlag) {
      this.Arrow = new Arrow();
      this.Arrow.FillColor = [0.0,1.0,1.0];
      this.State = ARROW_STAMP_WIDGET_WAITING;
      // Not interactive. Push to the viewer.
      this.Viewer.WidgetList.push(this);
      this.Cursor.hide();
  }
}


ArrowStampWidget.prototype.Draw = function(view) {
  if (this.Arrow) {
    this.Arrow.Draw(view);
  }
}



ArrowStampWidget.prototype.Serialize = function() {
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
ArrowStampWidget.prototype.Load = function(obj) {
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

ArrowStampWidget.prototype.HandleKeyPress = function(keyCode, shift) {
  return false;
}

ArrowStampWidget.prototype.Deactivate = function() {
  this.Popup.StartHideTimer();
  this.Cursor.hide();
  this.Viewer.DeactivateWidget(this);
  this.State = ARROW_STAMP_WIDGET_WAITING;
  if (this.Arrow) {
    this.Arrow.Active = false;
  }
  eventuallyRender();
}

ArrowStampWidget.prototype.HandleMouseDown = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;

  if (event.SystemEvent.which == 1 && ! this.Arrow) {
    var arrow = new ArrowStampWidget(this.Viewer, false);
    var pt = this.Viewer.ConvertPointViewerToWorld(x,y);
    arrow.Arrow.Origin = pt;
    eventuallyRender();
    // How should the other values be set .....
  }
}

ArrowStampWidget.prototype.HandleMouseUp = function(event) {
  if (event.SystemEvent.which == 3) {
    // Right mouse was pressed.
    // Pop up the properties dialog.
    this.ShowPropertiesDialog();
  }
  // Middle mouse deactivates the widget.
  if (event.SystemEvent.which == 2) {
    // Middle mouse was pressed.
    this.Deactivate();
  }

}

ArrowStampWidget.prototype.HandleDoubleClick = function(event) {
  this.Deactivate();
}

ArrowStampWidget.prototype.HandleMouseMove = function(event) {
  var x = event.MouseX;
  var y = event.MouseY;

  // Move the arrow icon to follow the mouse.
  this.Cursor.css({'left': (x+4), 'top': (y-32)});

  if (event.MouseDown == true) {
  }

  if (this.State == ARROW_STAMP_WIDGET_ACTIVE &&
      event.SystemEvent.which == 0) {
      // Deactivate
      this.SetActive(this.CheckActive(event));
      return;
    }

}


//This also shows the popup if it is not visible already.
ArrowStampWidget.prototype.PlacePopup = function () {
  var pt = this.Viewer.ConvertPointWorldToViewer(this.ActiveCenter[0],
                                                 this.ActiveCenter[1]);
  pt[0] += 40;
  pt[1] -= 40;
  this.Popup.Show(pt[0],pt[1]);
}

ArrowStampWidget.prototype.CheckActive = function(event) {
  if (this.State == ARROW_STAMP_WIDGET_DRAWING) { return; }

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

ArrowStampWidget.prototype.GetActive = function() {
  return false;
}

// Setting to active always puts state into "active".
// It can move to other states and stay active.
ArrowStampWidget.prototype.SetActive = function(flag) {
  if (flag) {
    this.Viewer.ActivateWidget(this);
    this.State = ARROW_STAMP_WIDGET_ACTIVE;
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

ArrowStampWidget.prototype.RemoveFromViewer = function() {
  if (this.Viewer == null) {
    return;
  }
  var idx = this.Viewer.WidgetList.indexOf(this);
  if(idx!=-1) {
    this.Viewer.WidgetList.splice(idx, 1);
  }
}

// Can we bind the dialog apply callback to an objects method?
ArrowStampWidget.prototype.ShowPropertiesDialog = function () {
}

function ArrowStampPropertyDialogApply() {
}

function ArrowStampPropertyDialogCancel() {
}

function ArrowStampPropertyDialogDelete() {
}

