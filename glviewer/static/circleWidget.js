
//==============================================================================
// Mouse down defined the center.
// Drag defines the radius.


// The circle has just been created and is following the mouse.
// I can probably merge this state with drag. (mouse up vs down though)
var CIRCLE_WIDGET_NEW = 0;
var CIRCLE_WIDGET_DRAG = 1; // The whole arrow is being dragged.
var CIRCLE_WIDGET_DRAG_RADIUS = 2;
var CIRCLE_WIDGET_WAITING = 3; // The normal (resting) state.
var CIRCLE_WIDGET_ACTIVE = 4; // Mouse is over the widget and it is receiving events.
var CIRCLE_WIDGET_PROPERTIES_DIALOG = 5; // Properties dialog is up

function CircleWidget (viewer, newFlag) {
  this.Dialog = new Dialog(this);
  // Customize dialog for a circle.
  this.Dialog.Title.text('Circle Annotation Editor');
  // Color
  this.Dialog.ColorDiv =
    $('<div>')
      .appendTo(this.Dialog.Body)
      .css({'display':'table-row'});
  this.Dialog.ColorLabel =
    $('<div>')
      .appendTo(this.Dialog.ColorDiv)
      .text("Color:")
      .css({'display':'table-cell',
            'text-align': 'left'});
  this.Dialog.ColorInput =
    $('<input type="color">')
      .appendTo(this.Dialog.ColorDiv)
      .val('#30ff00')
      .css({'display':'table-cell'});

  // Line Width
  this.Dialog.LineWidthDiv =
    $('<div>')
      .appendTo(this.Dialog.Body)
      .css({'display':'table-row'});
  this.Dialog.LineWidthLabel =
    $('<div>')
      .appendTo(this.Dialog.LineWidthDiv)
      .text("Line Width:")
      .css({'display':'table-cell',
            'text-align': 'left'});
  this.Dialog.LineWidthInput =
    $('<input type="number">')
      .appendTo(this.Dialog.LineWidthDiv)
      .css({'display':'table-cell'})
      .keypress(function(event) { return event.keyCode != 13; });

  // Area
  this.Dialog.AreaDiv =
    $('<div>')
      .appendTo(this.Dialog.Body)
      .css({'display':'table-row'});
  this.Dialog.AreaLabel =
    $('<div>')
      .appendTo(this.Dialog.AreaDiv)
      .text("Area:")
      .css({'display':'table-cell',
            'text-align': 'left'});
  this.Dialog.Area =
    $('<div>')
      .appendTo(this.Dialog.AreaDiv)
      .css({'display':'table-cell'});

  // Get default properties.
  if (localStorage.CircleWidgetDefaults) {
    var defaults = JSON.parse(localStorage.CircleWidgetDefaults);
    if (defaults.Color) {
      this.Dialog.ColorInput.val(ConvertColorToHex(defaults.Color));
    }
    if (defaults.LineWidth) {
      this.Dialog.LineWidthInput.val(defaults.LineWidth);
    }
  }

  this.Tolerance = 0.05;
  if (MOBILE_DEVICE) {
    this.Tolerance = 0.1;
  }

  if (viewer == null) {
    return;
  }

  // Lets save the zoom level (sort of).
  // Load will overwrite this for existing annotations.
  // This will allow us to expand annotations into notes.
  this.CreationCamera = viewer.GetCamera().Serialize();

  this.Viewer = viewer;
  this.Popup = new WidgetPopup(this);
  var cam = viewer.MainView.Camera;
  var viewport = viewer.MainView.Viewport;
  this.Shape = new Circle();
  this.Shape.Origin = [0,0];
  this.Shape.OutlineColor = [0.0,0.0,0.0];
  this.Shape.SetOutlineColor(this.Dialog.ColorInput.val());
  this.Shape.Radius = 50*cam.Height/viewport[3];
  this.Shape.LineWidth = 5.0*cam.Height/viewport[3];
  this.Shape.FixedSize = false;

  this.Viewer.WidgetList.push(this);

  // Note: If the user clicks before the mouse is in the
  // canvas, this will behave odd.

  if (newFlag) {
    this.State = CIRCLE_WIDGET_NEW;
    this.Viewer.ActivateWidget(this);
    return;
  }

  this.State = CIRCLE_WIDGET_WAITING;

}

CircleWidget.prototype.Draw = function(view) {
   this.Shape.Draw(view);
}

// This needs to be put in the Viewer.
CircleWidget.prototype.RemoveFromViewer = function() {
  if (this.Viewer == null) {
    return;
  }
  var idx = this.Viewer.WidgetList.indexOf(this);
  if(idx!=-1) {
    this.Viewer.WidgetList.splice(idx, 1);
  }
}

CircleWidget.prototype.PasteCallback = function(data, mouseWorldPt) {
  this.Load(data);
  // Place the widget over the mouse.
  // This would be better as an argument.
  this.Shape.Origin = [mouseWorldPt[0], mouseWorldPt[1]];
  eventuallyRender();
}

CircleWidget.prototype.Serialize = function() {
  if(this.Shape === undefined){ return null; }
  var obj = new Object();
  obj.type = "circle";
  obj.origin = this.Shape.Origin;
  obj.outlinecolor = this.Shape.OutlineColor;
  obj.radius = this.Shape.Radius;
  obj.linewidth = this.Shape.LineWidth;
  obj.creation_camera = this.CreationCamera;
  return obj;
}

// Load a widget from a json object (origin MongoDB).
CircleWidget.prototype.Load = function(obj) {
  this.Shape.Origin[0] = parseFloat(obj.origin[0]);
  this.Shape.Origin[1] = parseFloat(obj.origin[1]);
  this.Shape.OutlineColor[0] = parseFloat(obj.outlinecolor[0]);
  this.Shape.OutlineColor[1] = parseFloat(obj.outlinecolor[1]);
  this.Shape.OutlineColor[2] = parseFloat(obj.outlinecolor[2]);
  this.Shape.Radius = parseFloat(obj.radius);
  this.Shape.LineWidth = parseFloat(obj.linewidth);
  this.Shape.FixedSize = false;
  this.Shape.UpdateBuffers();

  // How zoomed in was the view when the annotation was created.
  if (obj.creation_camera !== undefined) {
    this.CreationCamera = obj.CreationCamera;
  }
}

CircleWidget.prototype.HandleKeyPress = function(keyCode, shift) {
  // The dialog consumes all key events.
  if (this.State == CIRCLE_WIDGET_PROPERTIES_DIALOG) {
      return false;
  }

  // Copy
  if (event.keyCode == 67 && event.ctrlKey) {
    // control-c for copy
    // The extra identifier is not needed for widgets, but will be
    // needed if we have some other object on the clipboard.
    var clip = {Type:"CircleWidget", Data: this.Serialize()};
    localStorage.ClipBoard = JSON.stringify(clip);
    return false;
  }

  return true;
}

CircleWidget.prototype.HandleDoubleClick = function(event) {
    return true;
}

CircleWidget.prototype.HandleMouseDown = function(event) {
    if (event.which != 1) {
        return false;
    }
    if (this.State == CIRCLE_WIDGET_NEW) {
        // We need the viewer position of the circle center to drag radius.
        this.OriginViewer =
            this.Viewer.ConvertPointWorldToViewer(this.Shape.Origin[0], 
                                                  this.Shape.Origin[1]);
        this.State = CIRCLE_WIDGET_DRAG_RADIUS;
    }
    if (this.State == CIRCLE_WIDGET_ACTIVE) {
        // Determine behavior from active radius.
        if (this.NormalizedActiveDistance < 0.5) {
            this.State = CIRCLE_WIDGET_DRAG;
        } else {
            this.OriginViewer =
                this.Viewer.ConvertPointWorldToViewer(this.Shape.Origin[0], 
                                                      this.Shape.Origin[1]);
            this.State = CIRCLE_WIDGET_DRAG_RADIUS;
        }
    }
    return true;
}

// returns false when it is finished doing its work.
CircleWidget.prototype.HandleMouseUp = function(event) {
    if ( this.State == CIRCLE_WIDGET_DRAG || this.State == CIRCLE_WIDGET_DRAG_RADIUS) {
        this.SetActive(false);
        RecordState();
    }
}

CircleWidget.prototype.HandleMouseMove = function(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    
    if (event.which == 0 && this.State == CIRCLE_WIDGET_ACTIVE) {
        this.CheckActive(event);
        return;
    }
    
    if (this.State == CIRCLE_WIDGET_NEW || this.State == CIRCLE_WIDGET_DRAG) {
        this.Shape.Origin = this.Viewer.ConvertPointViewerToWorld(x, y);
        this.PlacePopup();
        eventuallyRender();
    }
    
    if (this.State == CIRCLE_WIDGET_DRAG_RADIUS) {
        var viewport = this.Viewer.GetViewport();
        var cam = this.Viewer.MainView.Camera;
        var dx = x-this.OriginViewer[0];
        var dy = y-this.OriginViewer[1];
        // Change units from pixels to world.
        this.Shape.Radius = Math.sqrt(dx*dx + dy*dy) * cam.Height / viewport[3];
        this.Shape.UpdateBuffers();
        this.PlacePopup();
        eventuallyRender();
    }
    
    if (this.State == CIRCLE_WIDGET_WAITING) {
        this.CheckActive(event);
    }
}


CircleWidget.prototype.HandleTouchPan = function(event) {
  w0 = this.Viewer.ConvertPointViewerToWorld(EVENT_MANAGER.LastMouseX, 
                                             EVENT_MANAGER.LastMouseY);
  w1 = this.Viewer.ConvertPointViewerToWorld(event.offsetX,event.offsetY);

  // This is the translation.
  var dx = w1[0] - w0[0];
  var dy = w1[1] - w0[1];

  this.Shape.Origin[0] += dx;
  this.Shape.Origin[1] += dy;
  eventuallyRender();
}

CircleWidget.prototype.HandleTouchPinch = function(event) {
  this.Shape.Radius *= event.PinchScale;
  this.Shape.UpdateBuffers();
  eventuallyRender();
}

CircleWidget.prototype.HandleTouchEnd = function(event) {
  this.SetActive(false);
}


CircleWidget.prototype.CheckActive = function(event) {
  var x = event.offsetX;
  var y = event.offsetY;

  // change dx and dy to vector from center of circle.
  if (this.FixedSize) {
    dx = event.offsetX - this.Shape.Origin[0];
    dy = event.offsetY - this.Shape.Origin[1];
  } else {
    dx = event.worldX - this.Shape.Origin[0];
    dy = event.worldY - this.Shape.Origin[1];
  }

  var d = Math.sqrt(dx*dx + dy*dy)/this.Shape.Radius;
  var active = false;
  var lineWidth = this.Shape.LineWidth / this.Shape.Radius;
  this.NormalizedActiveDistance = d;

  if (this.Shape.FillColor == undefined) { // Circle
    if ((d < (1.0+ this.Tolerance +lineWidth) && d > (1.0-this.Tolerance)) ||
         d < (this.Tolerance+lineWidth)) {
      active = true;
    }
  } else { // Disk
    if (d < (1.0+this.Tolerance+lineWidth) && d > (this.Tolerance+lineWidth) ||
        d < lineWidth) {
      active = true;
    }
  }

  this.SetActive(active);
  return active;
}

// Multiple active states. Active state is a bit confusing.
CircleWidget.prototype.GetActive = function() {
  if (this.State == CIRCLE_WIDGET_WAITING) {
    return false;
  }
  return true;
}

CircleWidget.prototype.Deactivate = function() {
    this.Popup.StartHideTimer();
    this.State = CIRCLE_WIDGET_WAITING;
    this.Shape.Active = false;
    this.Viewer.DeactivateWidget(this);
    if (this.DeactivateCallback) {
        this.DeactivateCallback();
    }
    eventuallyRender();
}

// Setting to active always puts state into "active".
// It can move to other states and stay active.
CircleWidget.prototype.SetActive = function(flag) {
  if (flag == this.GetActive()) {
    return;
  }

  if (flag) {
    this.State = CIRCLE_WIDGET_ACTIVE;
    this.Shape.Active = true;
    this.Viewer.ActivateWidget(this);
    eventuallyRender();
    // Compute the location for the pop up and show it.
    this.PlacePopup();
  } else {
    this.Deactivate();
  }
  eventuallyRender();
}


//This also shows the popup if it is not visible already.
CircleWidget.prototype.PlacePopup = function () {
  // Compute the location for the pop up and show it.
  var roll = this.Viewer.GetCamera().Roll;
  var x = this.Shape.Origin[0] + 0.8 * this.Shape.Radius * (Math.cos(roll) - Math.sin(roll));
  var y = this.Shape.Origin[1] - 0.8 * this.Shape.Radius * (Math.cos(roll) + Math.sin(roll));
  var pt = this.Viewer.ConvertPointWorldToViewer(x, y);
  this.Popup.Show(pt[0],pt[1]);
}

// Can we bind the dialog apply callback to an objects method?
var CIRCLE_WIDGET_DIALOG_SELF;
CircleWidget.prototype.ShowPropertiesDialog = function () {
  this.Dialog.ColorInput.val(ConvertColorToHex(this.Shape.OutlineColor));

  this.Dialog.LineWidthInput.val((this.Shape.LineWidth).toFixed(2));

  var area = (2.0*Math.PI*this.Shape.Radius*this.Shape.Radius) * 0.25 * 0.25;
  var areaString = "";
  if (this.Shape.FixedSize) {
      areaString += area.toFixed(2);
      areaString += " pixels^2";
  } else {
      if (area > 1000000) {
          areaString += (area/1000000).toFixed(2);
          areaString += " mm^2";
      } else {
          areaString += area.toFixed(2);
          areaString += " um^2";
      }
  }
  this.Dialog.Area.text(areaString);

  this.Dialog.Show(true);
}

CircleWidget.prototype.DialogApplyCallback = function() {
  var hexcolor = this.Dialog.ColorInput.val();
  this.Shape.SetOutlineColor(hexcolor);
  this.Shape.LineWidth = parseFloat(this.Dialog.LineWidthInput.val());
  this.Shape.UpdateBuffers();
  this.SetActive(false);
  RecordState();
  eventuallyRender();

  localStorage.CircleWidgetDefaults = JSON.stringify({Color: hexcolor, LineWidth: this.Shape.LineWidth});
}


