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
  if (MOBILE_DEVICE) {
    size = '80px';
  }
  var self = this;
  this.Div = 
    $('<div>').appendTo('body')
              .css({'position': 'absolute',
                    'left' : '120px',
                    'bottom' : '5px',
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
  if (NOTE_ITERATOR.IsStart()) {
    this.PreviousNoteButton.css({'opacity': '0.1'});
    this.PreviousNoteTip.SetActive(false);
  } else {
    this.PreviousNoteButton.css({'opacity': '0.5'});
    this.PreviousNoteTip.SetActive(true);
  }
  if (NOTE_ITERATOR.IsEnd()) {
    this.NextNoteButton.css({'opacity': '0.1'});
    this.NextNoteTip.SetActive(false);
  } else {
    this.NextNoteButton.css({'opacity': '0.5'});
    this.NextNoteTip.SetActive(true);
  }

  // Disable and enable prev/next slide buttons so we cannot go past the end.
  if (this.SlideIndex <= 0) {
    this.PreviousSlideButton.css({'opacity': '0.1'});
    this.PreviousSlideTip.SetActive(false);
  } else {
    this.PreviousSlideButton.css({'opacity': '0.5'});
    this.PreviousSlideTip.SetActive(true);
  }
  if (this.SlideIndex >= this.Session.length-1) {
    this.NextSlideButton.css({'opacity': '0.1'});
    this.NextSlideTip.SetActive(false);
  } else {
    this.NextSlideButton.css({'opacity': '0.5'});
    this.NextSlideTip.SetActive(true);
  }
}

NavigationWidget.prototype.PreviousNote = function() {
  if (NOTE_ITERATOR.IsStart()) { return; }

  NOTE_ITERATOR.Previous();
  NOTE_ITERATOR.GetNote().Select();
}

NavigationWidget.prototype.NextNote = function() {
  if (NOTE_ITERATOR.IsEnd()) { return; }

  NOTE_ITERATOR.Next();
  NOTE_ITERATOR.GetNote().Select();
}


NavigationWidget.prototype.PreviousSlide = function() {
  this.SlideIndex -= 1;
  this.LoadViewId(this.Session[this.SlideIndex]);
}

NavigationWidget.prototype.NextSlide = function() {
  this.SlideIndex += 1;
  this.LoadViewId(this.Session[this.SlideIndex]);
}

NavigationWidget.prototype.LoadViewId = function(viewId) {
  VIEW_ID = viewId;
  ROOT_NOTE = new Note();
  if (typeof(viewId) != "undefined" && viewId != "") {
    ROOT_NOTE.LoadViewId(viewId);
  }
  // Setup the iterator using the view as root.
  // Bookmarks (sub notes) are loaded next.
  NOTE_ITERATOR = ROOT_NOTE.NewIterator();

  // Since loading the view is asynchronous,
  // the ROOT_NOTE is not complete at this point.  
}






