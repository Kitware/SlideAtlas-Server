//==============================================================================
// A replacement for the right click option to get the properties menu.
// This could be multi touch friendly.


function WidgetPopup (widget) {
    this.Widget = widget;
    this.Visible = false;
    this.HideTimerId = 0;

    var parent = widget.Viewer.MainView.CanvasDiv;

    // buttons to replace right click.
    var self = this;

    // We cannot append this to the canvas, so just append
    // it to the view panel, and add the viewport offset for now.
    // I should probably create a div around the canvas.
    // This is this only place I need viewport[0], [1] and I
    // was thinking of getting rid of the viewport offset.
    this.ButtonDiv =
        $('<div>').appendTo(parent)
        .hide()
        .css({'position': 'absolute',
              'z-index': '1'})
        .mouseenter(function() { self.CancelHideTimer(); })
        .mouseleave(function(){ self.StartHideTimer();});
    this.DeleteButton = $('<img>').appendTo(this.ButtonDiv)
        .css({'height': '20px'})
        .attr('src',SA.ImagePathUrl+"deleteSmall.png")
        .click(function(){self.DeleteCallback();});
    this.PropertiesButton = $('<img>').appendTo(this.ButtonDiv)
        .css({'height': '20px'})
        .attr('src',SA.ImagePathUrl+"Menu.jpg")
        .click(function(){self.PropertiesCallback();});
}

WidgetPopup.prototype.DeleteCallback = function() {
    this.Widget.SetActive(false);
    this.Hide();
    // This has to be called before the viewer is removed (next call).
    this.Widget.Viewer.EventuallyRender(true);
    this.Widget.RemoveFromViewer();
    RecordState();
}

WidgetPopup.prototype.PropertiesCallback = function() {
  this.Hide();
  this.Widget.ShowPropertiesDialog();
}



//------------------------------------------------------------------------------
WidgetPopup.prototype.Show = function(x, y) {
    // Have to add the viewport offset because I cannot use Canvas as
    // parent.
    //var viewport = this.Widget.Viewer.GetViewport();
    //x += viewport[0];
    //y += viewport[1];
    this.CancelHideTimer(); // Just in case: Show trumps previous hide.
    this.ButtonDiv.css({
        'left' : x+'px',
        'top'  : y+'px'})
        .show();
}

// When some other event occurs, we want to hide the pop up quickly
WidgetPopup.prototype.Hide = function() {
  this.CancelHideTimer(); // Just in case: Show trumps previous hide.
  this.ButtonDiv.hide();
}

WidgetPopup.prototype.StartHideTimer = function() {
  if ( ! this.HideTimerId) {
      var self = this;
    
    if(MOBILE_DEVICE) {
      this.HideTimerId = setTimeout(function(){self.HideTimerCallback();}, 1500);
    } else {
      this.HideTimerId = setTimeout(function(){self.HideTimerCallback();}, 800);
    }
  }
}

WidgetPopup.prototype.CancelHideTimer = function() {
  if (this.HideTimerId) {
    clearTimeout(this.HideTimerId);
    this.HideTimerId = 0;
  }
}

WidgetPopup.prototype.HideTimerCallback = function() {
  this.ButtonDiv.hide();
  this.HideTimerId = 0;
}






