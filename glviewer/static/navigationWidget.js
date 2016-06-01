// VCR like buttons to get to next/previous note/slide.
// entwined with the notes widget at the moment.




(function () {
    "use strict";



//------------------------------------------------------------------------------
// I intend to have only one object
function NavigationWidget(parent,display) {
    this.Display = display;

   // Load the session slides from the localStorage
    this.SlideIndex = 0;
    this.Session = [];
    this.NoteIterator = new SA.NoteIterator();

    var self = this;
    var size = '40px';
    var left = '170px';
    var bottom = '10px';
    if (SA.MOBILE_DEVICE) {
        // fake a tab
        this.Tab = {};
        this.Tab.Panel = $('<div>')
            .appendTo(display.GetViewer(0).GetDiv())
            .hide()
            //.addClass("sa-view-navigation-div ui-responsive");
            .addClass("ui-responsive")
            .css({'position': 'absolute',
                  'left': '50px',
                  'bottom': '20px',
                  'z-index': '5'});
        var panel = this.Tab.Panel;
        this.Tab.show = function () {panel.show();}
        this.Tab.hide = function () {
            panel.hide();
        }
        //SA.OnStartInteraction( function () { panel.hide();} );
    } else {
        this.Tab = new SA.Tab(parent,SA.ImagePathUrl+"nav.png", "navigationTab");
        this.Tab.Div.prop('title', "Navigation");
        this.Tab.Div.addClass("sa-view-navigation-div");
        this.Tab.Panel.addClass("sa-view-navigation-panel");

        // Put the stack display in the navigation button
        this.NoteDisplay = $('<div>')
            .appendTo(this.Tab.Div)
            .addClass("sa-view-note")
            .html("");
    }

    this.PreviousSlideButton =
        $('<img>').appendTo(this.Tab.Panel)
        .addClass("sa-view-navigation-button")
        .attr('src',SA.ImagePathUrl+"previousSlide.png")
        .prop('title', "Previous Slide. (page-up)")
        .click(function(){self.PreviousSlide();});

    this.PreviousNoteButton =
        $('<img>').appendTo(this.Tab.Panel)
        .addClass("sa-view-navigation-button")
        .attr('src',SA.ImagePathUrl+"previousNote.png")
        .prop('title', "Previous Note. (p)")
        .click(function(){self.PreviousNote();});

    this.NextNoteButton =
        $('<img>').appendTo(this.Tab.Panel)
        .addClass("sa-view-navigation-button")
        .attr('src',SA.ImagePathUrl+"nextNote.png")
        .prop('title',"Next Note, (n, space)")
        .click(function(){self.NextNote();});

    this.NextSlideButton =
        $('<img>').appendTo(this.Tab.Panel)
        .addClass("sa-view-navigation-button")
        .attr('src',SA.ImagePathUrl+"nextSlide.png")
        .prop('title',"Next Slide. (page-down)")
        .click(function(){self.NextSlide();});

    // TODO: Fix the main css file for mobile.  Hack this until fixed.
    if (SA.MOBILE_DEVICE) {
        size = '80px';
        if (SA.MOBILE_DEVICE == "iPhone") {
            size = '100px';
        }
        this.PreviousSlideButton
            .css({'height': size,
                  'width' : size,
                  'opacity':'0.8'})
            .on('touchend', function(){self.PreviousSlide();});
        this.PreviousNoteButton
            .css({'height': size,
                  'width' : size,
                  'opacity':'0.8'})
            .on('touchend', function(){self.PreviousNote();});
        this.NextNoteButton
            .css({'height': size,
                  'width' : size,
                  'opacity':'0.8'})
            .on('touchend', function(){self.NextNote();});
        this.NextSlideButton
            .css({'height': size,
                  'width' : size,
                  'opacity':'0.8'})
            .on('touchend', function(){self.NextSlide();});
    }

    this.CopyrightWrapper =
        $('<div>').appendTo(parent)
        .css({
            'width': '100%',
            'text-align': 'center'
        }).html();
}

NavigationWidget.prototype.SetInteractionEnabled = function(flag) {
    var self = this;
    if (flag) {
        this.Display.Parent.on(
            'keydown.navigation',
            function (event) {
                return self.HandleKeyDown(event);
            });
    } else {
        this.Display.Parent.off('keydown.navigation');
    }
}

NavigationWidget.prototype.HandleKeyDown = function(event) {
    var keyCode = event.keyCode;
    // 34=page down, 78=n, 32=space
    if (keyCode == 34) {
        this.NextSlide();
        return false;
    }
    if (keyCode == 78 || keyCode == 32) {
        this.NextNote();
        return false;
    }
    // 33=page up, 80=p
    if (keyCode == 33) {
        this.PreviousSlide();
        return false;
    }
    if (keyCode == 80) {
        this.PreviousNote();
        return false;
    }

    return true;
}

NavigationWidget.prototype.SetNote = function(note) {
    var self = this;
    if ( ! this.SessionId) {
        if (SA.Session) {
            this.Session = SA.Session.session.views;
            this.SessionId = SA.Session.sessid;
            this.Update();
        } else if (note.SessionId && SA.RootNote.Type != "HTML") {
            this.SessionId = note.SessionId;
            $.ajax({
                type: "get",
                url: SA.SessionUrl+"?json=true&sessid="+this.SessionId,
                success: function(data,status) {
                    if (self.SessionId != data.sessid) {
                        // This will never happen.
                        console.log("expecting a second session to load.");
                        return;
                    }
                    self.Session = data.session.views;
                    self.Update();
                },
                error: function() {
                    SA.Debug("AJAX - error() : session" );
                },
            });
        }
    } else {
        // Correct an error.  SessionId's are wrong because the
        // notes sessionId is not being updated when a session is
        // copied.
        note.SessionId = this.SessionId;
    }

    this.NoteIterator.SetNote(note);
    this.Update();
}

NavigationWidget.prototype.GetNote = function() {
    return this.NoteIterator.GetNote();
}

NavigationWidget.prototype.ToggleVisibility = function() {
    this.SetVisibility( ! this.Visibility);
}

// Used on mobile.
NavigationWidget.prototype.SetVisibility = function(v) {
    this.Visibility = v;
    if (v) {
        this.Tab.show();
    } else {
        this.Tab.hide();
    }
}

NavigationWidget.prototype.Update = function() {
    // Disable prev/next note buttons by default.
    this.PreviousNoteButton.removeClass("sa-active");
    this.NextNoteButton.removeClass("sa-active");
    var note = this.NoteIterator.GetNote();
    if (note) {
        for (var i = 0; i < this.Session.length; ++i) {
            if (this.Session[i].id == note.Id) {
                this.SlideIndex = i;
            }
        }

        if (note.Type == "Stack") {
            // Next note refers to ViewerRecords.
            if (note.StartIndex > 0) {
                this.PreviousNoteButton.addClass("sa-active");
            }
            if (note.StartIndex < note.ViewerRecords.length - 1) {
                this.NextNoteButton.addClass("sa-active");
            }
        } else {
            // Next note refers to children.
            if ( ! this.NoteIterator.IsStart()) {
                this.PreviousNoteButton.addClass("sa-active");
            }
            if ( ! this.NoteIterator.IsEnd()) {
                this.NextNoteButton.addClass("sa-active");
            }
        }
    }

    // Disable and enable prev/next slide buttons so we cannot go past the end.
    if (this.SlideIndex <= 0) {
        this.PreviousSlideButton.removeClass("sa-active");
    } else {
        this.PreviousSlideButton.addClass("sa-active");
    }
    if (this.SlideIndex >= this.Session.length-1) {
        this.NextSlideButton.removeClass("sa-active");
    } else {
        this.NextSlideButton.addClass("sa-active")
    }

    // Hack because next slide does not with presentations.
    if (SA.RootNote && SA.RootNote.Type == "HTML") {
        this.PreviousSlideButton.removeClass("sa-active");
        this.NextSlideButton.removeClass("sa-active");
    }

}

NavigationWidget.prototype.PreviousNote = function() {
    SA.StackCursorFlag = false;

    var current = this.NoteIterator.GetNote();
    if (current.Type == "Stack") {
        if (current.StartIndex <= 0) { return;}
        // Copy viewer annotation to the viewer record.
        current.RecordAnnotations(this.Display);

        // Move camera
        // Hardcoded for dual display
        var viewer1 = this.Display.GetViewer(1);
        var viewer0 = this.Display.GetViewer(0);
        var cam = viewer0.GetCamera();
        viewer1.SetCamera(cam.GetFocalPoint(),
                          cam.GetRotation(),
                          cam.Height);

        --current.StartIndex;
        current.DisplayStack(this.Display);
        this.Display.SynchronizeViews(1, current);
        // activate or deactivate buttons.
        this.Update();
        if (this.NoteDisplay) {
            this.NoteDisplay.html("" + current.StartIndex);
        }
        return;
    }

    if (this.NoteIterator.IsStart()) {
        // if not previous notes move to the previous slide
        this.PreviousSlide();
        return;
    }

    // This is such a good idea I am doing it with children notes too.
    // Before everytime a new child was selected, we lost new annotations.
    // Copy viewer annotation to the viewer record.
    current.RecordAnnotations(this.Display);

    var note = this.NoteIterator.Previous();
    // change this so the NotesWidget dows not display the note in the
    // view. Trigger an update the notes widget.
    // TODO: Clean this up. Is a call to display SetNote enough?
    if (SA.dualDisplay) {
        SA.dualDisplay.SetNote(note);
    } else {
        note.DisplayView(this.Display);
    }
}

NavigationWidget.prototype.NextNote = function() {
    SA.StackCursorFlag = false;

    var current = this.NoteIterator.GetNote();
    if (current.Type == "Stack") {
        if (current.StartIndex >= current.ViewerRecords.length - 1) {
            return;
        }
        // Copy viewer annotation to the viewer record.
        current.RecordAnnotations(this.Display);
        // Move camera
        // Hard coded for dual display.
        var viewer0 = this.Display.GetViewer(0);
        var viewer1 = this.Display.GetViewer(1);
        var cam = viewer1.GetCamera();
        viewer0.SetCamera(cam.GetFocalPoint(),
                          cam.GetRotation(),
                          cam.Height);

        ++current.StartIndex;
        current.DisplayStack(this.Display);
        this.Display.SynchronizeViews(0, current);
        // activate or deactivate buttons.
        this.Update();
        if (this.NoteDisplay) {
            this.NoteDisplay.html("" + current.StartIndex);
        }
        return;
    }

    if (this.NoteIterator.IsEnd()) {
        // If we have no more notes, then move to the next slide.
        this.NextSlide();
        return;
    }

    // This is such a good idea I am doing it with children notes too.
    // Before everytime a new child was selected, we lost new annotations.
    // Copy viewer annotation to the viewer record.
    current.RecordAnnotations(this.Display);

    var note = this.NoteIterator.Next();
    // change this so the NotesWidget dows not display the note in the
    // view. Trigger an update the notes widget.
    if (SA.dualDisplay) {
        SA.dualDisplay.SetNote(note);
    } else {
        note.DisplayView(this.Display);
    }
}


NavigationWidget.prototype.PreviousSlide = function() {
    SA.StackCursorFlag = false;
    // Find the previous slide ( skip presentations)
    var prevSlideIdx = this.SlideIndex - 1;
    while (prevSlideIdx >= 0 &&
           this.Session[prevSlideIdx].Type == "Presentation") {
        --prevSlideIdx;
    }
    if (prevSlideIdx < 0) { return; }

    var check = true;
    if (SA.notesWidget && SA.notesWidget.Modified) {
        check = confirm("Unsaved edits will be lost.  Are you sure you want to move to the next slide?");
    }
    if (check) {
        // TODO: Improve the API here.  Get rid of global access.
        if (SA.notesWidget) {SA.notesWidget.MarkAsNotModified();}
        this.SlideIndex = prevSlideIdx;
        this.Display.SetNoteFromId(this.Session[this.SlideIndex].id);

        if (this.NoteDisplay) {
            this.NoteDisplay.html("");
        }
    }
}

NavigationWidget.prototype.NextSlide = function() {
    SA.StackCursorFlag = false;
    // Find the next slide ( skip presentations)
    var nextSlideIdx = this.SlideIndex + 1;
    while (nextSlideIdx < this.Session.length &&
           this.Session[nextSlideIdx].Type == "Presentation") {
        ++nextSlideIdx;
    }
    if (nextSlideIdx >= this.Session.length) { return; }
    var check = true;
    if ( SA.notesWidget && SA.notesWidget.Modified) {
        check = confirm("Unsaved edits will be lost.  Are you sure you want to move to the next slide?");
    }
    if (check) {
        if (SA.notesWidget) {SA.notesWidget.MarkAsNotModified();}
        this.SlideIndex = nextSlideIdx;
        this.Display.SetNoteFromId(this.Session[this.SlideIndex].id);

        if (this.NoteDisplay) {
            this.NoteDisplay.html("");
        }
    }
}

//==============================================================================


//------------------------------------------------------------------------------
// Iterator to perform depth first search through note tree.
// Collapsed branches (children not visible) are not traversed.
// This iterator is a bit over engineered.  I made it so we can subclasses
// that iterate over internal states.  However, internal states require
// notes so I made an array of answers (which are hidden).
function NoteIterator(note) {
    this.Note = note;
    this.ChildIterator = null;
}

// Because of sorting, the child array gets reset on us.
// I need a dynamic way to get the Children array based on the state.
NoteIterator.prototype.GetChildArray = function() {
    if ( ! this.Note) {
        return [];
    }
    return this.Note.Children;
}

// Because of sorting, I have to make the index dynamic
// and it cannot be stored as an ivar.
NoteIterator.prototype.GetChildIndex = function() {
    if (this.ChildIterator == null) {
        return -1;
    }
    return this.GetChildArray().indexOf( this.ChildIterator.Note );
}

// Get the parent note of the current note.
// Notes do not keep a pointer to parents.
// The iterator has this information for active notes.
NoteIterator.prototype.GetParentNote = function() {
    if (this.ChildIterator == null) {
        // We are at the current note.  Let the caller supply the parent.
        return null;
    }

    var parent = this.ChildIterator.GetParentNote();
    if (parent == null) {
        // This level contains the parent.
        parent = this.Note;
    }

    return parent;
}


// We use this to see (peek) if next or previous should be disabled.
NoteIterator.prototype.IsStart = function() {
    if (this.ChildIterator == null) {
        return true;
    }
    return false;
}


NoteIterator.prototype.IsEnd = function() {
    if ( ! this.Note) { return true; }

    // Case note is active.
    if (this.ChildIterator == null) {
        if (this.Note.Children.length > 0 && this.Note.ChildrenVisibility) {
            return false;
        }
        return true;
    }

    // sub answer is active.
    var childIndex = this.GetChildIndex();

    // sub child is active
    if (childIndex == this.GetChildArray().length - 1) {
        return this.ChildIterator.IsEnd();
    }
    return false;
}


// Parent note is traversed before children.
// Move forward one step.  Return the new note. At end the last note returned again.
// IsEnd method used to detect terminal case.
NoteIterator.prototype.Next = function() {
    if ( ! this.Note) { return; }

    // Case 1:  Iterator is on its own node.
    if (this.ChildIterator == null) {
        // Next check for children notes
        if (this.Note.Children.length > 0 && this.Note.ChildrenVisibility) {
            // Move to the first child.
            this.ChildIterator = this.GetChildArray()[0].NewIterator();
            return this.ChildIterator.GetNote();
        }
        // No answers or children: we are at the end.
        return this.Note;
    }

    // Try to advance the child iterator.
    if ( ! this.ChildIterator.IsEnd()) {
        return this.ChildIterator.Next();
    }

    // Child iterator is finished.
    // Try to create a new iterator with the next child in the array.
    var childIndex = this.GetChildIndex();
    if (childIndex < this.GetChildArray().length-1) {
        this.ChildIterator = this.GetChildArray()[childIndex+1].NewIterator();
        return this.ChildIterator.GetNote();
    }

    // We are at the end of the children array.
    return this.ChildIterator.GetNote();
}


// Move backward one step.  See "Next" method comments for description of tree traversal.
NoteIterator.prototype.Previous = function() {
    if ( ! this.Note) { return; }

    if (this.ChildIterator == null) {
        // At start.
        return this.Note;
    }
    if ( ! this.ChildIterator.IsStart()) {
        return this.ChildIterator.Previous();
    }

    // Move to the previous child.
    var childIndex = this.GetChildIndex() - 1;
    if (childIndex >= 0) {
        this.ChildIterator = this.GetChildArray()[childIndex].NewIterator();
        this.ChildIterator.ToEnd();
        return this.ChildIterator.GetNote();
    }

    // No more sub notes left.  Move to the root.
    this.ChildIterator = null;
    return this.Note;
}

// Move the iterator to the start.
NoteIterator.prototype.ToStart = function() {
    if (this.ChildIterator) {
        this.ChildIterator = null;
    }
}

// Move the iterator to the end. Used in Previous method.
NoteIterator.prototype.ToEnd = function() {
    if ( ! this.Note) { return; }

    if (this.Note.Children.length > 0 && this.Note.ChildrenVisibility) {
        this.ChildArray = this.Note.Children;
        var childIndex = this.ChildArray.length - 1;
        this.ChildIterator = this.ChildArray[childIndex].NewIterator();
        return this.ChildIterator.ToEnd();
    }
    // leaf note
    this.ChildArray = null;
    this.ChildIterator = null;
    return this.Note;
}

// If the note is not in the tree, Set the note as root.
// Otherwise, point the iterator to the note in the tree.
NoteIterator.prototype.SetNote = function(note) {
    if (this.GetNote() == note) { return; }
    // See if the note is in the tree.
    this.ToStart();
    while (true) {
        if (this.GetNote() == note) { 
            // Found the note in the tree.
            return; 
        }
        if (this.IsEnd()) {
            // not found.  New tree.
            this.ToStart();
            this.Note = note;
            // BIG Hack here.
            // I got rid of a special SetRootNote call too soon.
            if (SA.notesWidget) {
                SA.notesWidget.SetRootNote(note);
            }
            return;
        }
        this.Next();
    }
}

NoteIterator.prototype.GetNote = function() {
    if (this.ChildIterator != null) {
        return this.ChildIterator.GetNote();
    }
    return this.Note;
}



    SA.NoteIterator = NoteIterator;
    SA.NavigationWidget = NavigationWidget;

})();
