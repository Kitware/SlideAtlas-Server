//==============================================================================
// A replacement for the right click option to get the properties menu.
// This could be multi touch friendly.


function WidgetPopup (widget) {
  this.Widget = widget;
  this.Visible = false;
  this.HideTimerId = 0;

  // buttons to replace right click.
  var self = this;
  this.ButtonDiv = 
    $('<div>').appendTo('body')
              .hide()
              .css({'position': 'absolute',
                    'z-index': '1'})
              .mouseenter(function() { self.CancelHideTimer(); })
              .mouseleave(function(){ self.StartHideTimer();});
  this.DeleteButton = $('<img>').appendTo(this.ButtonDiv)
      .css({'height': '20px'})
    .attr('src',"webgl-viewer/static/deleteSmall.png")
    .click(function(){self.DeleteCallback();});
  this.PropertiesButton = $('<img>').appendTo(this.ButtonDiv)
      .css({'height': '20px'})
    .attr('src',"webgl-viewer/static/Menu.jpg")
    .click(function(){self.PropertiesCallback();});  
}

WidgetPopup.prototype.DeleteCallback = function() {
  this.Widget.SetActive(false);
  this.Hide();
  // We need to remove an item from a list.
  // shape list and widget list.
  this.Widget.RemoveFromViewer();
  eventuallyRender();
  RecordState();
}

WidgetPopup.prototype.PropertiesCallback = function() {
  this.Hide();
  this.Widget.ShowPropertiesDialog();
}



//------------------------------------------------------------------------------
WidgetPopup.prototype.Show = function(x, y) {
  this.CancelHideTimer(); // Just in case: Show trumps previous hide.
  this.ButtonDiv.css({
                   'left'  : x+'px',
                   'bottom': y+'px'})
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
    this.HideTimerId = setTimeout(function(){self.HideTimerCallback();}, 800);
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






