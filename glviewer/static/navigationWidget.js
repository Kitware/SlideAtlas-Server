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

    var self = this;
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
        
        // fake a tab
        this.Tab = {};
        this.Tab.Panel = 
            $('<div>').appendTo('body')
                      .hide()
                      .css({'position': 'absolute',
                            'left' : left,
                            'bottom' : bottom,
                            'z-index': '5'});
    } else {
        this.Tab = new Tab("/webgl-viewer/static/nav.png", "navigationTab");
        new ToolTip(this.Tab.Div, "Navigation");
        this.Tab.Div.css({'left': '50px',
                          'bottom': '0px'});
        this.Tab.Panel
            .css({'left': '-45px',
                  'width': '200px',
                  'height': '50px',
                  'padding': '0px 2px'});

        // Put the stack display in the navigation button
        this.NoteDisplay = $('<div>')
            .appendTo(this.Tab.Div)
            .css({
                'opacity': '0.9',
                'position': 'absolute',
                'height':  '20px',
                'width':   '100%',
                'text-align' : 'center',
                'color' : '#000',
                'top' : '23px',
                'left' : '0px',
                'font-size':'10px',
                'z-index': '10',
                'pointer-events': 'none'})
            .html("");
    }


    this.PreviousSlideButton =
        $('<img>').appendTo(this.Tab.Panel)
        .css({'height': size,
              'width': size,
              'padding' : '5px',
              'opacity': '0.6'})
        .attr('src',"webgl-viewer/static/previousSlide.png")
        .click(function(){self.PreviousSlide();});
    this.PreviousSlideTip = new ToolTip(this.PreviousSlideButton, 
                                        "Previous Slide. (page-up)");

    this.PreviousNoteButton =
        $('<img>').appendTo(this.Tab.Panel)
        .css({'height': size,
              'width': size,
              'padding' : '5px',
              'opacity': '0.6'})
        .attr('src',"webgl-viewer/static/previousNote.png")
        .click(function(){self.PreviousNote();});
    this.PreviousNoteTip = new ToolTip(this.PreviousNoteButton, 
                                       "Previous Note. (p)");

    this.NextNoteButton =
        $('<img>').appendTo(this.Tab.Panel)
        .css({'height': size,
              'width': size,
              'padding' : '5px',
              'opacity': '0.6'})
        .attr('src',"webgl-viewer/static/nextNote.png")
        .click(function(){self.NextNote();});
    this.NextNoteTip = new ToolTip(this.NextNoteButton, 
                                   "Next Note, (n, space)");

    this.NextSlideButton =
        $('<img>').appendTo(this.Tab.Panel)
        .css({'height': size,
              'width': size,
              'padding' : '5px',
              'opacity': '0.6'})
        .attr('src',"webgl-viewer/static/nextSlide.png")
        .click(function(){self.NextSlide();});
    this.NextSlideTip = new ToolTip(this.NextSlideButton, 
                                    "Next Slide. (page-down)");

    this.CopyrightWrapper =
        $('<div>').appendTo(VIEW_PANEL)
        .css({
            'width': '100%',
            'text-align': 'center'
        }).html();
}


NavigationWidget.prototype.HandleKeyPress = function(keyCode, modifiers) {
    // 34=page down, 78=n, 32=space
    if (keyCode == 34) {
        this.NextSlide();
        return true;
    }
    if (keyCode == 78 || keyCode == 32) {
        this.NextNote();
        return true;
    }
    // 33=page up, 80=p
    if (keyCode == 33) {
        this.PreviousSlide();
        return true;
    }
    if (keyCode == 80) {
        this.PreviousNote();
        return true;
    }

    return false;
}


NavigationWidget.prototype.ToggleVisibility = function() {
    this.SetVisibility( ! this.Visibility);
}

// Used on mobile.
NavigationWidget.prototype.SetVisibility = function(v) {
    this.Visibility = v;
    if (v) {
        this.Tab.Panel.show();
    } else {
        this.Tab.Panel.hide();
    }
}

NavigationWidget.prototype.Update = function() {
  // Disable and enable prev/next note buttons so we cannot go past the end.
  var note = NOTES_WIDGET.GetCurrentNote();
  if (note.Type == "Stack") {
      // Next note refers to ViewerRecords.
      if (note.StartIndex > 0) {
          this.PreviousNoteButton.css({'opacity': '0.5'});
          this.PreviousNoteTip.SetActive(true);
      } else {
          this.PreviousNoteButton.css({'opacity': '0.2'});
          this.PreviousNoteTip.SetActive(false);
      }
      if (note.StartIndex < note.ViewerRecords.length - 1) {
          this.NextNoteButton.css({'opacity': '0.5'});
          this.NextNoteTip.SetActive(true);
      } else {
          this.NextNoteButton.css({'opacity': '0.2'});
          this.NextNoteTip.SetActive(false);
      }
  } else {
      // Next note refers to children.
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
    EVENT_MANAGER.CursorFlag = false;

    var iterator = NOTES_WIDGET.Iterator;
    var current = iterator.GetNote();
    if (current.Type == "Stack") {
        if (current.StartIndex <= 0) { return;}
        // Copy viewer annotation to the viewer record.
        current.RecordAnnotations();
        // Move camera
        var cam = VIEWER1.GetCamera();
        VIEWER2.SetCamera(cam.GetFocalPoint(), cam.GetRotation(), cam.Height);
        --current.StartIndex;
        current.DisplayStack();
        current.SynchronizeViews(1);
        // activate or deactivate buttons.
        this.Update();
        if (this.NoteDisplay) {
            this.NoteDisplay.html("" + current.StartIndex);
        }
        return;
    }

    if (iterator.IsStart()) { 
        // if not previous notes move to the previous slide
        this.PreviousSlide();
        return; 
    }

    // This is such a good idea I am doing it with children notes too.
    // Before everytime a new child was selected, we lost new annotations.
    // Copy viewer annotation to the viewer record.
    current.RecordAnnotations();

    iterator.Previous();
    iterator.GetNote().Select();
}

NavigationWidget.prototype.NextNote = function() {
    EVENT_MANAGER.CursorFlag = false;

    var iterator = NOTES_WIDGET.Iterator;
    var current = iterator.GetNote();
    if (current.Type == "Stack") {
        if (current.StartIndex >= current.ViewerRecords.length - 1) {
            return;
        }
        // Copy viewer annotation to the viewer record.
        current.RecordAnnotations();
        // Move camera
        var cam = VIEWER2.GetCamera();
        VIEWER1.SetCamera(cam.GetFocalPoint(), cam.GetRotation(), cam.Height);
        ++current.StartIndex;
        current.DisplayStack();
        current.SynchronizeViews(0);
        // activate or deactivate buttons.
        this.Update();
        if (this.NoteDisplay) {
            this.NoteDisplay.html("" + current.StartIndex);
        }
        return;
    }

    if (iterator.IsEnd()) {
        // If we have no more notes, then move to the next slide.
        this.NextSlide();
        return; 
    }

    // This is such a good idea I am doing it with children notes too.
    // Before everytime a new child was selected, we lost new annotations.
    // Copy viewer annotation to the viewer record.
    current.RecordAnnotations();

    iterator.Next();
    iterator.GetNote().Select();
}


NavigationWidget.prototype.PreviousSlide = function() {
    EVENT_MANAGER.CursorFlag = false;
    if (this.SlideIndex <= 0) { return; }
    var check = true;
    if (EDIT) {
        //check = confirm("Unsaved edits will be lost.  Are you sure you want to move to the previous slide?");
    }
    if (check) {
        this.SlideIndex -= 1;
        NOTES_WIDGET.LoadViewId(this.Session[this.SlideIndex]);
        if (this.NoteDisplay) {
            this.NoteDisplay.html("");
        }
    }
}

NavigationWidget.prototype.NextSlide = function() {
    EVENT_MANAGER.CursorFlag = false;
    if (this.SlideIndex >= this.Session.length - 1) { return; }
    var check = true;
    if (EDIT) {
        //check = confirm("Unsaved edits will be lost.  Are you sure you want to move to the next slide?");
    }
    if (check) {
        this.SlideIndex += 1;
        NOTES_WIDGET.LoadViewId(this.Session[this.SlideIndex]);
        if (this.NoteDisplay) {
            this.NoteDisplay.html("");
        }
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






