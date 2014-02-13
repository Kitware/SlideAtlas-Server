// Testing annotation widget with touch events.


//------------------------------------------------------------------------------
// I intend to have only one object
function MobileAnnotationWidget() {

  var size = '80px';
  var left = '620px';
  var bottom = '10px';
  if (MOBILE_DEVICE == "iPhone") {
    size = '100px';
    bottom = '80px';
    left = '80px';
  }

  var self = this;
  this.Div = 
    $('<div>').appendTo('body')
              .css({'position': 'absolute',
                    'left' : left,
                    'bottom' : bottom,
                    'z-index': '2'});

  // I cannot get touch events that start in the image to continue in
  // the document / viewer.  Press to place, then interact to position.
  this.CircleButton =
    $('<img>').appendTo(this.Div)
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/Circle128.jpg")
              .click(function(){self.CircleCallback();});
  this.CircleTip = new ToolTip(this.CircleButton, "Circle Annotation");

  this.TextButton =
    $('<img>').appendTo(this.Div)
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/Text128.jpg")
              .click(function(){self.TextCallback();});
  this.TextTip = new ToolTip(this.TextButton, "Text Annotation");

  this.SaveButton =
    $('<img>').appendTo(this.Div)
              .hide()
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/save.png")
              .click(function(){self.SaveBrownNote();});
  this.TextTip = new ToolTip(this.SaveButton, "Save Note");

  this.Visibility = false;
}


MobileAnnotationWidget.prototype.SaveBrownNote = function() {
  NOTES_WIDGET.SaveBrownNote(); 
  this.SaveButton.hide();
  var button = this.SaveButton;
  setTimeout(function(){
               button.show();
             }, 1000); // one second
}


MobileAnnotationWidget.prototype.CircleCallback = function() {
  console.log("New circle");

  // Hard code only a single view for now.
  this.Viewer = VIEWER1;
  
  if ( this.Viewer.ActiveWidget != undefined && widget ) {
    this.Viewer.ActiveWidget.Deactivate();
  }
  var widget = new CircleWidget(this.Viewer, false);
  widget.Shape.SetOutlineColor(document.getElementById("circlecolor").value);
  
  var cam = this.Viewer.GetCamera();
  var x = cam.FocalPoint[0];
  var y = cam.FocalPoint[1];

  widget.Shape.Origin = [x, y];
  widget.Shape.Radius = cam.Height / 4.0;
  widget.Shape.UpdateBuffers();
  eventuallyRender();
  
  //this.Viewer.ActiveWidget = widget;
  this.Viewer.SetAnnotationVisibility(ANNOTATION_ON);
  this.SaveButton.show();
}

MobileAnnotationWidget.prototype.TextCallback = function() {
  this.Viewer = VIEWER1;
  var widget = this.Viewer.ActiveWidget;
  if ( widget ) {
    widget.Deactivate();
  }
  
  this.Viewer.SetAnnotationVisibility(ANNOTATION_ON);
  var widget = new TextWidget(this.Viewer, "");
  // Set default color rom the last text widget setting.
  var hexcolor = document.getElementById("textcolor").value;
  widget.Shape.SetColor(hexcolor);
  widget.AnchorShape.SetFillColor(hexcolor);
  // Default value for anchor shape visibility
  widget.AnchorShape.Visibility = document.getElementById("TextMarker").value;

  var cam = this.Viewer.GetCamera();
  var x = cam.FocalPoint[0];
  var y = cam.FocalPoint[1];
  widget.Shape.Anchor[0] = x;
  widget.Shape.Anchor[1] = y;
  eventuallyRender();

  this.Viewer.ActiveWidget = widget;

  // The dialog is used to set the initial text.
  widget.ShowPropertiesDialog();
  this.SaveButton.show();
}

MobileAnnotationWidget.prototype.SetVisibility = function(v) {
  this.Visibility = v;
  if (v) {
    this.Div.show();
  } else {
    this.Div.hide();
  }
}

MobileAnnotationWidget.prototype.ToggleVisibility = function() {
  this.SetVisibility( ! this.Visibility);
}






