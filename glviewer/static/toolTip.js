// Bubble help.

function ToolTip(widget, text) {
  var self = this;
  this.Active = true;
  this.Widget = widget;
  this.Div =
    $('<div>').appendTo(widget.offsetParent())
              .hide()
              .text(text)
              .css({'position': 'absolute',
                    'z-index': '3'});
  widget.mouseenter(function() { self.HandleMouseEnter(); })
        .mouseleave(function(){ self.HandleMouseLeave();});

  this.TimerId = 0;
}

ToolTip.prototype.HandleMouseEnter = function() {
  if ( ! this.Active) {
    return;
  }
  if ( ! this.TimerId) {
    var self = this;
    this.TimerId = setTimeout(function(){self.TimerCallback();}, 2000); // two seconds
  }

}

ToolTip.prototype.TimerCallback = function() {
  this.TimerId = 0;
  // Where to place the help....
  // on top:
  var pos = this.Widget.offset(); // top, left
  var tipHeight = this.Div.height();
  this.Div.show()
          .css({'top': (pos.top-tipHeight)+'px',
                'left' : pos.left+'px'});
  //.innerWidth();  .innerHeight(); offsetParent()
}

ToolTip.prototype.HandleMouseLeave = function() {
  if (this.TimerId) {
    clearTimeout(this.TimerId);
    this.TimerId = 0;
  }
  this.Div.hide();
}

// Called externally
ToolTip.prototype.Hide = function() {
  this.HandleMouseLeave();
}

ToolTip.prototype.SetActive = function (flag) {
  if ( ! flag) {
    this.Hide();
  }
  this.Active = flag;
}
