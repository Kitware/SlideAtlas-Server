// VCR like buttons to get to next/previous note/slide.
// entwined with the notes widget at the moment.


//------------------------------------------------------------------------------
// I intend to have only one object
function NavigationWidget() {
  // Load the session slides from the localStorage
  this.SlideIndex = 0;
  this.Session = [];
  if (localStorage && localStorage.session) {
    this.Session = JSON.parse(localStorage.session);
    // Find the index of the current slide.
    while (this.SlideIndex < this.Session.length &&
           this.Session[this.SlideIndex] != VIEW_ID) {
      ++this.SlideIndex;
    }
    if (this.SlideIndex >= this.Session.length) {
      // We did not find the slide.
      this.SlideIndex = 0;
      this.Session = [];
    }
  }

  var size = '40px';
  var left = '170px';
  var bottom = '10px';
  if (MOBILE_DEVICE) {
    size = '80px';
    bottom = '170px';
    left = '0px';
    if (MOBILE_DEVICE == "iPhone") {
      size = '100px';
      bottom = '80px';
      left = '80px';
    }
  }
  var self = this;
  this.Div =
    $('<div>').appendTo('body')
              .css({'position': 'absolute',
                    'left' : left,
                    'bottom' : bottom,
                    'z-index': '2'});

  this.PreviousSlideButton =
    $('<img>').appendTo(this.Div)
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/previousSlide.png")
              .click(function(){self.PreviousSlide();});
  this.PreviousSlideTip = new ToolTip(this.PreviousSlideButton, "Previous Slide");

  this.PreviousNoteButton =
    $('<img>').appendTo(this.Div)
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/previousNote.png")
              .click(function(){self.PreviousNote();});
  this.PreviousNoteTip = new ToolTip(this.PreviousNoteButton, "Previous Note");

  this.NextNoteButton =
    $('<img>').appendTo(this.Div)
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/nextNote.png")
              .click(function(){self.NextNote();});
  this.NextNoteTip = new ToolTip(this.NextNoteButton, "Next Note");

  this.NextSlideButton =
    $('<img>').appendTo(this.Div)
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/nextSlide.png")
              .click(function(){self.NextSlide();});
  this.NextSlideTip = new ToolTip(this.NextSlideButton, "Next Slide");

  this.CopyrightWrapper =
    $('<div>').appendTo('body')
              .css({
                'width': '100%',
                'text-align': 'center'
              }).html();

}


NavigationWidget.prototype.HandleKeyPress = function(keyCode, modifiers) {
  // 34=page down, 78=n, 32=space
  if (keyCode == 34 || keyCode == 78 || keyCode == 32) {
    this.NextNote();
    return true;
  }
  // 33=page up, 80=p
  if (keyCode == 33 || keyCode == 80) {
    this.PreviousNote();
    return true;
  }

  return false;
}


NavigationWidget.prototype.ToggleVisibility = function() {
  this.SetVisibility( ! this.Visibility);
}

NavigationWidget.prototype.SetVisibility = function(v) {
  this.Visibility = v;
  if (v) {
    this.Div.show();
  } else {
    this.Div.hide();
  }
}

NavigationWidget.prototype.Update = function() {
  // Disable and enable prev/next note buttons so we cannot go past the end.
  if (NOTES_WIDGET.Iterator.IsStart()) {
    this.PreviousNoteButton.css({'opacity': '0.2'});
    this.PreviousNoteTip.SetActive(false);
  } else {
    this.PreviousNoteButton.css({'opacity': '0.5'});
    this.PreviousNoteTip.SetActive(true);
  }
  if (NOTES_WIDGET.Iterator.IsEnd()) {
    this.NextNoteButton.css({'opacity': '0.2'});
    this.NextNoteTip.SetActive(false);
  } else {
    this.NextNoteButton.css({'opacity': '0.5'});
    this.NextNoteTip.SetActive(true);
  }

  // Disable and enable prev/next slide buttons so we cannot go past the end.
  if (this.SlideIndex <= 0) {
    this.PreviousSlideButton.css({'opacity': '0.2'});
    this.PreviousSlideTip.SetActive(false);
  } else {
    this.PreviousSlideButton.css({'opacity': '0.5'});
    this.PreviousSlideTip.SetActive(true);
  }
  if (this.SlideIndex >= this.Session.length-1) {
    this.NextSlideButton.css({'opacity': '0.2'});
    this.NextSlideTip.SetActive(false);
  } else {
    this.NextSlideButton.css({'opacity': '0.5'});
    this.NextSlideTip.SetActive(true);
  }
}

NavigationWidget.prototype.PreviousNote = function() {
    var iterator = NOTES_WIDGET.Iterator;
    if (iterator.IsStart()) { return; }

    // We need both the last active note and next note
    // To implement transformations for stacks.
    var current = iterator.GetNote();
    iterator.Previous();
    iterator.GetNote().Select(current);
}

NavigationWidget.prototype.NextNote = function() {
    var iterator = NOTES_WIDGET.Iterator;
    if (iterator.IsEnd()) { return; }

    // We need both the last active note and next note
    // To implement transformations for stacks.
    var current = iterator.GetNote();
    iterator.Next();
    iterator.GetNote().Select(current);
}


NavigationWidget.prototype.PreviousSlide = function() {
  if (this.SlideIndex <= 0) { return; }
  var check = true;
  if (EDIT) {
    //check = confirm("Unsaved edits will be lost.  Are you sure you want to move to the previous slide?");
  }
  if (check) {
    this.SlideIndex -= 1;
    NOTES_WIDGET.LoadViewId(this.Session[this.SlideIndex]);
    }
}

NavigationWidget.prototype.NextSlide = function() {
  if (this.SlideIndex >= this.Session.length - 1) { return; }
  var check = true;
  if (EDIT) {
    //check = confirm("Unsaved edits will be lost.  Are you sure you want to move to the next slide?");
  }
  if (check) {
    this.SlideIndex += 1;
    NOTES_WIDGET.LoadViewId(this.Session[this.SlideIndex]);
  }
}

NavigationWidget.prototype.LoadViewId = function(viewId) {
  VIEW_ID = viewId;
  NOTES_WIDGET.RootNote = new Note();
  if (typeof(viewId) != "undefined" && viewId != "") {
    NOTES_WIDGET.RootNote.LoadViewId(viewId);
  }
  // Since loading the view is asynchronous,
  // the NOTES_WIDGET.RootNote is not complete at this point.
}






