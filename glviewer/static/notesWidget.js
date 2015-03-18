// Stacks and notes are both in this file.  I should clean this up and make separate classes
// that possibly share a superclass.


// Notes can be nested (tree structure) to allow for student questions, comments or discussion.
// Sessions could be notes.
// Notes within the same level are ordered.
// Question answers can be sub notes.

// Students can save comments that are not seen by other students.
// Student notes are stored as "favorites".
// Notes keep an ID of their parent in the database.
// The recording API is used to save the state of viewers (ViewerRecord)
// Notes just add a tree structure on top of these states (with GUI).

// Right now we are loading the view and bookmarks as notes.
// Bookmarks have two notes: Question and a child answer.
// I need to change this to be more like the origin open layers presentation.

// TODO:
// Highlight icon on hover.
// Drag notes to change the order.
// Show the user "favorite" notes.
// Allow user to delete the favorite note (even if edit is not on).


var LINk_DIV;

// Time to make this an object to get rid of all these global variables.
function InitNotesWidget() {
    NOTES_WIDGET = new NotesWidget();
    
    // Popup div to display permalink.
    LINK_DIV = 
        $("<div>")
        .appendTo('body')
        .attr('contenteditable', "true")
        .css({'top':'30px',
              'left': '10%',
              'position': 'absolute',
              'width':'80%',
              'height': '50px',
              'z-index':'3',
              'background-color':'#FFF',
              'border':'1px solid #777',
              'border-radius': '8px',
              'text-align': 'center',
              'padding-top': '26px'})
        .hide()
        .mouseleave(function() { LINK_DIV.fadeOut(); });
}


function NotesWidget() {
    var self = this;

    // For animating the display of the notes window (DIV).
    this.WidthFraction = 0.0;
    this.Visibilty = false;

    // Root of the note tree.
    this.RootNote;

    // Iterator is used to implement the next and previous note buttons.
    this.Iterator;
    // For clearing selected GUI setting.
    this.SelectedNote;

    // GUI elements
    this.Window;
    this.NoteTreeDiv;
    this.NewButton;
    // We need this flag so cancel will get rid of a pending new note.
    // User can be editing an old note, or a new note.
    this.EditNew = false;
    // Have any notes been modified (and need to be saved to the database)?
    this.ModifiedFlag = false;

    // It would be nice to animate the transition
    // It would be nice to integrate all animation in a flexible utility.
    this.AnimationLastTime;
    this.AnimationDuration;
    this.AnimationTarget;

    this.Window = $('<div>').appendTo('body')
        .css({
            'background-color': 'white',
            'position': 'absolute',
            'top' : '0%',
            'left' : '0%',
            'height' : '100%',
            'width': '20%',
            'z-index': '2'})
        .hide()
        .attr('id', 'NoteWindow');


    if ( ! MOBILE_DEVICE) {
        this.OpenNoteWindowButton = $('<img>')
            .appendTo(VIEW_PANEL)
            .css({'position': 'absolute',
                  'height': '20px',
                  'width': '20px',
                  'top' : '0px',
                  'left' : '0px',
                  'opacity': '0.6',
                  '-moz-user-select': 'none',
                  '-webkit-user-select': 'none',
                  'z-index': '6'})
            .attr('src',"webgl-viewer/static/dualArrowRight2.png")
            .click(function(){self.ToggleNotesWindow();})
            .attr('draggable','false')
            .on("dragstart", function() {
                return false;});


        this.CloseNoteWindowButton = $('<img>')
            .appendTo(this.Window)
            .css({'position': 'absolute',
                  'height': '20px',
                  'width': '20x',
                  'top' : '0px',
                  'right' : '0px',
                  'opacity': '0.6',
                  '-moz-user-select': 'none',
                  '-webkit-user-select': 'none',
                  'z-index': '6'})
            .hide()
            .attr('src',"webgl-viewer/static/dualArrowLeft2.png")
            .click(function(){self.ToggleNotesWindow();})
            .attr('draggable','false')
            .on("dragstart", function() {
                return false;});

    }


    if (EDIT) {
        var buttonWrapper =
            $('<div>')
            .appendTo(this.Window)
            .css({'width': '100%',
                  'height': '40px',
                  'border-bottom':'1px solid #B0B0B0'});
        this.NewButton =
            $('<button>')
            .appendTo(buttonWrapper)
            .text("New")
            .css({'color' : '#278BFF',
                  'font-size': '18px',
                  'margin': '5px'})
            .click(function(){self.NewCallback();});
        this.SaveButton =
            $('<button>')
            .appendTo(buttonWrapper)
            .text("Save")
            .css({'color' : '#278BFF',
                  'font-size': '18px',
                  'margin': '5px'})
            .click(function(){self.SaveCallback();});
        /*this.RandomButton = $('<button>').appendTo(this.PopupMenu)
          .hide()
          .text("Randomize")
          .css({'color' : '#278BFF', 'width':'100%','font-size': '18px'})
          .click(function(){self.RandomCallback();});
        */
    }

    this.NoteTreeDiv = $('<div>')
        .appendTo(this.Window)
        .css({'width': '100%',
              'height': '50%',
              'overflow': 'auto',
              'text-align': 'left',
              'color': '#303030',
              'font-size': '18px'})
        .attr('id', 'NoteTree');


    // The next three elements are to handle the addition of comments.
    // Currently placeholders.
    // The top div wraps the text field and the submit button at the bottom
    // of the widget.
    this.TextDiv = $('<div>')
        .appendTo(this.Window)
        .css({'box-sizing': 'border-box',
              'width': '100%',
              'height': '40%',
              'padding': '3px'});

    this.TextEntry = $('<div>')
        .appendTo(this.TextDiv)
        .attr('contenteditable', "true")
        .css({'box-sizing': 'border-box',
              'width': '100%',
              'height': '100%',
              'border-style': 'solid',
              'background': '#ffffff',
              'resize': 'none'})
        .focusin(function() { EVENT_MANAGER.FocusOut(); })
        .focusout(function() { EVENT_MANAGER.FocusIn(); })
        .keypress(function() { NOTES_WIDGET.Modified(); })
        .attr('readonly', 'readonly');

    if (EDIT) {
        this.TextEntry.removeAttr('readonly');
        this.TextEntry.css({'border-style': 'inset',
                                    'background': '#f5f8ff'});
    } else {
        this.TextEntry.attr('readonly', 'readonly');
        this.TextEntry.css({'border-style': 'solid',
                                    'background': '#ffffff'});
    }

    // This sets "this.RootNote" and "this.Iterator"
    this.LoadViewId(VIEW_ID);
    // Setup the iterator using the view as root.
    // Bookmarks (sub notes) are loaded next.
    this.Iterator = this.RootNote.NewIterator();
}

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



NoteIterator.prototype.GetNote = function() {
  if (this.ChildIterator != null) {
    return this.ChildIterator.GetNote();
  }
  return this.Note;
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


// Move the iterator to the end. Used in Previous method.
NoteIterator.prototype.ToEnd = function() {
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



//------------------------------------------------------------------------------
// Note object (maybe will be used for views and sessions too).

// data is the object retrieved from mongo (with string ids)
// Right now we expect bookmarks, but it will be generalized later.
function Note () {
  var self = this;

  this.User = GetUser(); // Reset by flask.
  var d = new Date();
  this.Date = d.getTime(); // Also reset later.
  this.Type = "Note";


  this.Title = "";
  this.Text = "";
  // Upto two for dual view.
  this.ViewerRecords = [];

  // ParentNote (it would be nice to make the session a note too).
  this.Parent = null;

  // Sub notes
  this.Children = [];
  this.ChildrenVisibility = true;

  // GUI elements.
  this.Div =
    $('<div>').attr({'class':'note'})
        .css({'position':'relative'})
        .sortable('disable');

  this.Icon =
    $('<img>')
        .css({'height': '20px',
              'width': '20x',
              'float':'left',
              '-moz-user-select': 'none',
              '-webkit-user-select': 'none'})
        .attr('src',"webgl-viewer/static/dot.png")
        .appendTo(this.Div)
        .sortable('disable')
        .attr('draggable','false')
        .on("dragstart", function() {
            return false;});


  // I could reuse this menu, but this is easy for callbacks
  this.IconMenuDiv =
    $('<div>').appendTo(this.Div)
      .hide()
      .css({'position': 'absolute',
            'left': '0px',
            'margin-top':'20px',
            'top' : '0px',
            'width' : '80px',
            'z-index': '1',
            'background-color': '#F0F0F0',
            'padding': '5px',
            'border-color': '#B0B0B0',
            'border-radius': '8px',
            'border-style': 'solid',
            'border-width':'1px'});
  this.TitleDiv = $('<div>')
        .css({'font-size': '18px',
               'margin-left':'20px',
               'color':'#379BFF',})
        .text(this.Title)
        .appendTo(this.Div);
  if (this.HideAnnotations && this.HiddenTitle) {
      this.TitleDiv.text(this.HiddenTitle);
  }


  if (EDIT) {
    this.TitleDiv
      .attr('contenteditable', "true")
      .focusin(function() { self.TitleFocusInCallback(); })
      .focusout(function() { self.TitleFocusOutCallback(); })
  } else {
    this.TitleDiv.click(function() {self.Select()})
  }

  // The div should attached even if nothing is in it.
  // A child may appear and UpdateChildrenGui called.
  // If we could tell is was removed, UpdateChildGUI could append it.
  this.ChildrenDiv = $('<div>').css({'margin-left':'15px'})
                               .appendTo(this.Div);

  // This is for stack notes (which could be a subclass).
  this.StartIndex = 0;
  this.ActiveCorrelation = undefined;
  this.StackDivs = [];
}

Note.prototype.SetParent = function(parent) {
  var self = this;
  this.Parent = parent;
  if (parent) {
    this.DeleteButton =
      $('<button>').appendTo(this.IconMenuDiv)
        .text("delete")
        .css({'color' : '#278BFF',
              'font-size': '14px',
              'border-radius': '3px',
              'width':'100%'});
  }
}

Note.prototype.TitleFocusInCallback = function() {
  // Keep the viewer from processing arrow keys.
  EVENT_MANAGER.FocusOut();
  this.Select();
}


Note.prototype.TitleFocusOutCallback = function() {
  // Allow the viewer to process arrow keys.
  EVENT_MANAGER.FocusIn();
  var text = this.TitleDiv.text();
  if (this.Title != text && ! this.HideAnnotations) {
    this.Title = text;
    NOTES_WIDGET.Modified();
  }
  if (this.HiddenTitle != text && this.HideAnnotations) {
    this.HiddenTitle = text;
    NOTES_WIDGET.Modified();
  }
}


Note.prototype.IconEnterCallback = function() {
  if (EDIT) {
    this.IconMenuDiv.fadeIn(1000);
  }
}

Note.prototype.IconLeaveCallback = function() {
  if (EDIT) {
    var self = this;
    this.HideIconMenuTimerId = setTimeout(
      function() {
        self.HideIconMenuTimerId = 0;
        self.IconMenuDiv.hide();
      },
      300);
  }
}

Note.prototype.IconMenuEnterCallback = function() {
  if (this.HideIconMenuTimerId) {
    clearTimeout(this.HideIconMenuTimerId);
    this.HideIconMenuTimerId = 0;
  }
}

Note.prototype.IconMenuLeaveCallback = function() {
  this.IconMenuDiv.hide();
}

Note.prototype.LinkCallback = function() {
  this.IconMenuDiv.hide();
  LINK_DIV.html("slide-atlas.org/webgl-viewer?view="+this.Id);
  LINK_DIV.show();
}

Note.prototype.DeleteCallback = function() {
  this.IconMenuDiv.hide();
  var parent = this.Parent;
  if (parent == null) {
    return;
  }

  if (NOTES_WIDGET.Iterator.GetNote() == this) {
    // Move the current note off this note.
    // There is always a previous.
    NAVIGATION_WIDGET.PreviousNote();
  }

  // Get rid of the note.
  var index = parent.Children.indexOf(this);
  parent.Children.splice(index, 1);
  this.Parent = null;

  NOTES_WIDGET.Modified();

  // Redraw the GUI.
  parent.UpdateChildrenGUI();
}

Note.prototype.UserCanEdit = function() {
  return EDIT;
}

Note.prototype.RecordView = function() {
    if (this.Type == "Stack") {
        // All we want to do is record the default
        // camera of the first section (if we at 
        // the start of the stack).
        if (this.StartIndex == 0) {
            this.ViewerRecords[0].CopyViewer(VIEWER1);
        }
        return;
    }
    this.ViewerRecords = [];
    //  Viewer1
    var viewerRecord = new ViewerRecord();
    viewerRecord.CopyViewer(VIEWER1);
    this.ViewerRecords.push(viewerRecord);
    // Viewer2
    if (DUAL_VIEW) {
        var viewerRecord = new ViewerRecord();
        viewerRecord.CopyViewer(VIEWER2);
        this.ViewerRecords.push(viewerRecord);
    }

}


Note.prototype.AddChild = function(childNote, first) {
  // Needed to get the order after a sort.
  childNote.Div.data("index", this.Children.length);

  if (first) {
    this.Children.splice(0, 0, childNote);
  } else {
    this.Children.push(childNote);
  }

  this.UpdateChildrenGUI();
}

Note.prototype.UpdateChildrenGUI = function() {
    // Callback trick
    var self = this;
    
    // Clear
    this.ChildrenDiv.empty();

    // Stacks
    if (this.Type == "Stack") {
        // I want viewer records to look like children for stacks.
        this.StackDivs = [];
        for (var i = 0; i < this.ViewerRecords.length; ++i) {
            var sectionDiv = $('<div>')
                .attr({'class':'note'})
                .css({'position':'relative'})
                .appendTo(this.ChildrenDiv);
            if (this.HideAnnotations) {
                sectionDiv.text(i.toString())
            } else {
                sectionDiv.text(this.ViewerRecords[i].Image.label)
            }
            this.StackDivs.push(sectionDiv);
            if (i == this.StartIndex) {
                sectionDiv.css({'background-color':'#BBB'});
            }
        }
        return;
    }

    // Notes
    if (this.Children.length == 0) {
        this.Icon.attr('src',"webgl-viewer/static/dot.png");
        return;
    }
    
    for (var i = 0; i < this.Children.length; ++i) {
        this.Children[i].DisplayGUI(this.ChildrenDiv);
    }
    
    if (this.Children.length > 1 && this.UserCanEdit() ) {
        // Make sure the indexes are set correctly.
        for (var i = 0; i < this.Children.length; ++i) {
            this.Children[i].Div.data("index", i);
        }
    }
}

// So this is a real pain.  I need to get the order of the notes from
// the childrenDiv jquery element.
// I could use jQuery.data(div,"note",this) or store the index in an attribute.
Note.prototype.ReorderChildren = function() {
  var newChildren = [];
  var children = this.ChildrenDiv.children();
  for (var newIndex = 0; newIndex < children.length; ++newIndex) {
    var oldIndex = $(children[newIndex]).data('index');
    var note = this.Children[oldIndex];
    note.Div.data("index", newIndex);
    if (newIndex != oldIndex) {
      NOTES_WIDGET.Modified();
    }
    newChildren.push(note);
  }

  this.Children = newChildren;
}


Note.prototype.NewIterator = function() {
  return new NoteIterator(this);
}

Note.prototype.Contains = function(decendent) {
  for (var i = 0; i < this.Children.length; ++i) {
    var child = this.Children[i];
    if (child == decendent) {
      return true;
    }
    if (child.Contains(decendent)) {
      return true;
    }
  }
  return false;
}


Note.prototype.Select = function() {

    // Save Text Entry into note before selecting a new note.
    NOTES_WIDGET.RecordTextChanges();

    // This should method should be split between Note and NotesWidget
    if (LINK_DIV.is(':visible')) { LINK_DIV.fadeOut();}
    if (NOTES_WIDGET.Iterator.GetNote() != this) {
        // For when user selects a note from a list.
        // Find the note and set a new iterator
        // This is so the next and previous buttons will behave.
        var iter = NOTES_WIDGET.RootNote.NewIterator();
        while (iter.GetNote() != this) {
            if ( iter.IsEnd()) {
                alert("Could not find note.");
                return;
            }
            iter.Next();
        }
        NOTES_WIDGET.Iterator = iter;
    }


    // Handle the note that is being unselected.
    // Clear the selected background of the deselected note.
    if (NOTES_WIDGET.SelectedNote) {
        NOTES_WIDGET.SelectedNote.TitleDiv.css({'background':'white'});
    }


    NOTES_WIDGET.SelectedNote = this;
    // Indicate which note is selected.
    this.TitleDiv.css({'background':'#f0f0f0'});

    if (NAVIGATION_WIDGET) {NAVIGATION_WIDGET.Update(); }

    if (typeof VIEWER2 !== 'undefined') {
        VIEWER2.Reset();
        // TODO:
        // It would be nice to store the viewer configuration 
        // as a separate state variable.  We might want a stack
        // that defaults to a single viewer.
        SetNumberOfViews(this.ViewerRecords.length);
    }

    if (this.Type == "Stack") {
        // Select only gets called when the stack is first loaded.
        var self = this;
        VIEWER1.OnInteraction(function () { self.SynchronizeViews(0);});
        VIEWER2.OnInteraction(function () { self.SynchronizeViews(1);});
        this.DisplayStack();
        // First view is set by viewer record camera.
        // Second is set relative to the first.
        this.SynchronizeViews(0);
        // We do not support inserting sections in a stack right now.
        NOTES_WIDGET.NewButton.hide();
    } else {
        // Clear the sync callback.
        VIEWER1.OnInteraction();
        VIEWER2.OnInteraction();
        this.DisplayView();
    }


    // Put the note into the details section.
    NOTES_WIDGET.TextEntry.text(this.Text);
}

Note.prototype.RecordAnnotations = function() {
    this.ViewerRecords[this.StartIndex].CopyAnnotations(VIEWER1);
    if (this.StartIndex + 1 < this.ViewerRecords.length) {
        this.ViewerRecords[this.StartIndex+1].CopyAnnotations(VIEWER2);
    }
}

// No clearing.  Just draw this notes GUI in a div.
Note.prototype.DisplayGUI = function(div) {
    // Put an icon to the left of the text.
    var self = this;
    this.Div.appendTo(div);

    var self = this;

    if (this.HideAnnotations && this.HiddenTitle) {
        this.TitleDiv.text(this.HiddenTitle);
    } else {
        this.TitleDiv.text(this.Title);
    }

    // Changing a div "parent/appendTo" removes all event bindings like click.
    // I would like to find a better solution to redraw.
    this.Icon
        .click(function() {self.Select()})
        .mouseenter(function() { self.IconEnterCallback(); })
        .mouseleave(function() { self.IconLeaveCallback(); });
    if (EDIT) {
        this.IconMenuDiv
            .mouseenter(function() { self.IconMenuEnterCallback(); })
            .mouseleave(function() { self.IconMenuLeaveCallback(); });
        if (this.LinkButton) {
            this.LinkButton.click(function(){self.LinkCallback();});
        }

        if (this.DeleteButton) { 
            this.DeleteButton.click(function(){self.DeleteCallback();});
        }
    }
    this.UpdateChildrenGUI();
}



Note.prototype.Serialize = function(includeChildren) {
  var obj = {};
  obj.SessionId = localStorage.sessionId;
  obj.Type = this.Type;
  obj.User = this.User;
  obj.Date = this.Date;

  if (this.Id) {
    obj._id = this.Id;
  }
  // I would like to put the session as parent, but this would be an inclomplete reference.
  // A space is not a valid id. Niether is 'false'. Lets leave it blank. 
  if (this.Parent) {
    obj.ParentId = this.Parent.Id;
  }
  obj.Title = this.Title;
  obj.HiddenTitle = this.HiddenTitle;
  obj.Text = this.Text;
  // We should probably serialize the ViewerRecords too.
  obj.ViewerRecords = [];

  // The database wants an image id, not an embedded iamge object.
  //  The server should really take care of this since if
  for (var i = 0; i < this.ViewerRecords.length; ++i) {
    if(!this.ViewerRecords[i].Image) continue;
    var record = this.ViewerRecords[i].Serialize();
    obj.ViewerRecords.push(record);
  }

  // upper left pixel
  obj.CoordinateSystem = "Pixel";

  if (includeChildren) {
    obj.Children = [];
    for (var i = 0; i < this.Children.length; ++i) {
      obj.Children.push(this.Children[i].Serialize(includeChildren));
    }
  }
  return obj;
}

// This method of loading is causing a pain.
// Children ...
Note.prototype.Load = function(obj){
    var self = this;
    for (ivar in obj) {
        this[ivar] = obj[ivar];
    }
    // I am not sure blindly copying all of the variables is a good idea.
    if (this._id) {
        this.Id = this._id;
    }
    delete this._id;

    if (this.HideAnnotations && this.HiddenTitle) {
        this.TitleDiv.text(this.HiddenTitle);
    } else {
        this.TitleDiv.text(this.Title);
    }

    for (var i = 0; i < this.Children.length; ++i) {
        var childObj = this.Children[i];
        var childNote = new Note();
        childNote.SetParent(this);
        childNote.Load(childObj);
        this.Children[i] = childNote;
        childNote.Div.data("index", i);
    }

    for (var i = 0; i < this.ViewerRecords.length; ++i) {
        if (this.ViewerRecords[i]) {
            obj = this.ViewerRecords[i];
            // It would be nice to have a constructor that took an object.
            this.ViewerRecords[i] = new ViewerRecord();
            this.ViewerRecords[i].Load(obj);
        }
    }

    if (this.Id) {
        this.LinkButton =
            $('<button>').appendTo(this.IconMenuDiv)
            .text("link")
            .css({'color' : '#278BFF',
                  'font-size': '14px',
                  'border-radius': '3px',
                  'width':'100%'});
    }

    // Hack to fix timing (Load after select)
    if (this == NOTES_WIDGET.RootNote) {
        NOTES_WIDGET.DisplayRootNote();
    }
}


Note.prototype.LoadViewId = function(viewId) {
  var self = this;
  $.ajax({
    type: "get",
    url: "/webgl-viewer/getview",
    data: {"sessid": localStorage.sessionId,
           "viewid": viewId},
    success: function(data,status) { 
        self.Load(data);
        // This is necessary because we delay moving entry text to note.
        // It has to be initialized with the first selected note (root).
        NOTES_WIDGET.TextEntry.text(data.Text);
    },
    error: function() { alert( "AJAX - error() : getview" ); },
    });
}

// Get any children notes (this note as parent)
// Authored by the current user.
// The notes will have no order.
// The server knows who the user is.
Note.prototype.RequestUserNotes = function() {
  var self = this;
  $.ajax({
    type: "get",
    url: "/webgl-viewer/getchildnotes",
    data: {"ParentId": this.Id},
    success: function(data,status) { self.LoadUserNotes(data);},
    error: function() { alert( "AJAX - error() : getchildnotes" ); },
    });
}


Note.prototype.LoadUserNotes = function(data) {
  for (var i = 0; i < data.Notes.length; ++i) {
    var noteData = data.Notes[i];
    var note = new Note();
    note.Load(noteData);
    this.Children.push(note);
    this.UpdateChildrenGUI();

    note.RequestUserNotes();
  }
}

Note.prototype.Collapse = function() {
  this.ChildrenVisibility = false;
  if (this.Contains(NOTES_WIDGET.SelectedNote)) {
    // Selected note should not be in collapsed branch.
    // Make the visible ancestor active.
    this.Select();
  }
  this.UpdateChildrenGUI();
  NAVIGATION_WIDGET.Update();
}

Note.prototype.Expand = function() {
  this.ChildrenVisibility = true;
  this.UpdateChildrenGUI();
  NAVIGATION_WIDGET.Update();
}


// Extra stuff for stack.
Note.prototype.DisplayStack = function() {
    this.DisplayView();
    // For editing correlations
    if (EDIT && this.StartIndex+1 < this.ViewerRecords.length) {
        var trans = this.ViewerRecords[this.StartIndex + 1].Transform;
        if (trans) {
            VIEWER1.StackCorrelations = trans.Correlations;
            VIEWER2.StackCorrelations = trans.Correlations;
        }
    }
    // Indicate which section is being displayed in VIEWER1
    for (var i = 0; i < this.StackDivs.length; ++i) {
        if (i == this.StartIndex) {
            this.StackDivs[i].css({'background-color':'#BBB'});
        } else {
            this.StackDivs[i].css({'background-color':'#FFF'});
        }
    }
}

// Set the state of the WebGL viewer from this notes ViewerRecords.
Note.prototype.DisplayView = function() {
    // Remove Annotations from the previous note.
    VIEWER1.Reset();
    if (VIEWER2) {VIEWER2.Reset();}

    if (this.Type == "Stack") {
        var idx0 = this.StartIndex;
        var idx1 = idx0 + 1;
        
        if (this.ViewerRecords.length > idx0) {
            this.ViewerRecords[idx0].Apply(VIEWER1);
        }
        if (this.ViewerRecords.length > idx1) {
            this.ViewerRecords[idx1].Apply(VIEWER2);
        }
        return;
    }


    // Two views should always exist.  Check anyway (for now).
    SetNumberOfViews(this.ViewerRecords.length);
    if (typeof VIEWER1 !== 'undefined' && this.ViewerRecords.length > 0) {
        this.ViewerRecords[0].Apply(VIEWER1);
    }
    if (typeof VIEWER2 !== 'undefined') {
        VIEWER2.Reset();
        if ( this.ViewerRecords.length > 1) {
            this.ViewerRecords[1].Apply(VIEWER2);
        } else if ( this.ViewerRecords.length > 0) {
            // Default the second viewer (closed) to be the same as the first.
            this.ViewerRecords[0].Apply(VIEWER2);
        }
    }
}



// Creates default transforms for Viewer Records 1-n
// (if they do not exist already).  Uses cameras focal point.
Note.prototype.InitializeStackTransforms = function () {
    for (var i = 1; i < this.ViewerRecords.length; ++i) {
        if ( ! this.ViewerRecords[i].Transform) {
            var cam0 = this.ViewerRecords[i-1].Camera;
            var cam1 = this.ViewerRecords[i].Camera;
            var dRoll = cam1.Roll - cam0.Roll;
            if (dRoll < 0.0) { dRoll += 2*Math.PI; }
            var trans = new PairTransformation();
            trans.AddCorrelation(cam0.FocalPoint, cam1.FocalPoint, dRoll, 
                                 0.5*(cam0.Height+cam1.Height));
            this.ViewerRecords[i].Transform = trans;
        }
    }
}


// refViewerIdx is the viewer that changed and other viewers need 
// to be updated to match that reference viewer.
Note.prototype.SynchronizeViews = function (refViewerIdx) {
    if (refViewerIdx + this.StartIdx >= this.ViewerRecords.length) {
        return;
    }

    // Special case for when the shift key is pressed.
    // Translate only one camera and modify the tranform to match.
    if (EDIT && EVENT_MANAGER.CursorFlag) {
        var trans = this.ViewerRecords[this.StartIndex + 1].Transform;
        if ( ! this.ActiveCorrelation) {
            if ( ! trans) {
                alert("Missing transform");
                return;
            }
            // Remove all correlations visible in the window.
            var cam = VIEWER1.GetCamera();
            var bds = cam.GetBounds();
            var idx = 0;
            while (idx < trans.Correlations.length) {
                var cor = trans.Correlations[idx];
                if (cor.point0[0] > bds[0] && cor.point0[0] < bds[1] && 
                    cor.point0[1] > bds[2] && cor.point0[1] < bds[3]) {
                    trans.Correlations.splice(idx,1);
                } else {
                    ++idx;
                }
            }

            // Now make a new replacement correlation.
            this.ActiveCorrelation = new PairCorrelation();
            trans.Correlations.push(this.ActiveCorrelation);
        }
        var cam0 = VIEWER1.GetCamera();
        var cam1 = VIEWER2.GetCamera();
        this.ActiveCorrelation.SetPoint0(cam0.GetFocalPoint());
        this.ActiveCorrelation.SetPoint1(cam1.GetFocalPoint());
        // I really do not want to set the roll unless the user specifically changed it.
        // It would be hard to correct if the wrong value got set early in the aligment.
        var deltaRoll = cam1.Roll - cam0.Roll;
        if (trans.Correlations.length > 1) {
            deltaRoll = 0;
            // Let roll be set by multiple correlation points.
        }
        this.ActiveCorrelation.SetRoll(deltaRoll);
        this.ActiveCorrelation.SetHeight(0.5*(cam1.Height + cam0.Height));
        return;
    } else {
        // A round about way to set and unset the active correlation.
        // This is OK, because if there is no interaction without the shift key
        // the active correlation will not change anyway.
        this.ActiveCorrelation = undefined;
    }

    // No shift modifier:
    // Synchronize all the cameras.
    // Hard coded for two viewers (recored 0 and 1 too).
    // First place all the cameras into an array for code simplicity.
    // Cameras used for preloading.
    if (! this.PreCamera) { this.PreCamera = new Camera();}
    if (! this.PostCamera) { this.PostCamera = new Camera();}
    var cameras = [this.PreCamera, VIEWER1.GetCamera(), VIEWER2.GetCamera(), this.PostCamera];
    var refCamIdx = refViewerIdx+1; // An extra to account for PreCamera.
    // Start with the reference section and move forward.
    // With two sections, the second has the transform.
    for (var i = refCamIdx+1; i < cameras.length; ++i) {
        var transIdx = i - 1 + this.StartIndex;
        if (transIdx < this.ViewerRecords.length) {
            this.ViewerRecords[transIdx].Transform
                .ForwardTransformCamera(cameras[i-1],cameras[i]);
        } else {
            cameras[i] = undefined;
        }
    }

    // Start with the reference section and move backward.
    // With two sections, the second has the transform.
    for (var i = refCamIdx; i > 0; --i) {
        var transIdx = i + this.StartIndex-1;
        if (transIdx > 0) { // First section does not have a transform
            this.ViewerRecords[transIdx].Transform
                .ReverseTransformCamera(cameras[i],cameras[i-1]);
        } else {
            cameras[i-1] = undefined;
        }
    }

    // Preload the adjacent sections.
    if (cameras[0]) {
        var cache = FindCache(this.ViewerRecords[this.StartIndex-1].Image);
        cameras[0].SetViewport(VIEWER1.GetViewport());
        var tiles = cache.ChooseTiles(cameras[0], 0, []);
        for (var i = 0; i < tiles.length; ++i) {
            LoadQueueAddTile(tiles[i]);
        }
        LoadQueueUpdate();
    }
    if (cameras[3]) {
        var cache = FindCache(this.ViewerRecords[this.StartIndex+2].Image);
        cameras[3].SetViewport(VIEWER1.GetViewport());
        var tiles = cache.ChooseTiles(cameras[3], 0, []);
        for (var i = 0; i < tiles.length; ++i) {
            LoadQueueAddTile(tiles[i]);
        }
        LoadQueueUpdate();
    }

    // Overview cameras need to be updated.
    if (refViewerIdx == 0) {
        VIEWER2.UpdateCamera();
    } else {
        VIEWER1.UpdateCamera();
    }
}


NotesWidget.prototype.RecordTextChanges = function () {
    if (this.SelectedNote) {
        this.SelectedNote.Text = this.TextEntry.text();
    }
}


NotesWidget.prototype.GetCurrentNote = function() {
  return this.Iterator.GetNote();
}


NotesWidget.prototype.SaveUserNote = function() {
  // Create a new note.
  var childNote = new Note();
  var d = new Date();
  this.Date = d.getTime(); // Also reset later.

  childNote.ViewerRecords = [];
  //  Viewer1
  var viewerRecord = new ViewerRecord();
  viewerRecord.CopyViewer(VIEWER1);
  childNote.ViewerRecords.push(viewerRecord);
  // Viewer2
  if (DUAL_VIEW) {
    var viewerRecord = new ViewerRecord();
    viewerRecord.CopyViewer(VIEWER2);
    childNote.ViewerRecords.push(viewerRecord);
  }

  // Now add the note as the last child to the current note.
  parentNote = this.Iterator.GetNote();
  parentNote.Children.push(childNote);
  // ParentId is how we retrieve notes from the database.
  // It is the only tree structure saved.
  childNote.SetParent(parentNote);
  // Expand the parent so that the new note is visible.
  parentNote.ChildrenVisible = true;

  // Save the note in the database for this specific user.
  // TODO: If author privileges, save note in the actual session / view.
  var bug = JSON.stringify( childNote );
  $.ajax({
    type: "post",
    url: "/webgl-viewer/saveusernote",
    data: {"note": JSON.stringify(childNote.Serialize(false)),
           "col" : "notes",
           "date": d.getTime(),
           "type": "UserNote"},
    success: function(data,status) { childNote.Id = data;},
    error: function() {
      alert( "AJAX - error() : saveusernote 1" );
    },
  });

  // Redraw the GUI. should we make the parent or the new child active?
  // If we choose the child, then we need to update the iterator,
  // which will also update the gui and viewers.
  NAVIGATION_WIDGET.NextNote();
}


NotesWidget.prototype.Modified = function() {
  window.onbeforeunload =
    function () {
      return "Some changes have not been saved to the database.";
    }
  this.ModifiedFlag = true;
  this.SaveButton.css({'color' : '#E00'});
}


NotesWidget.prototype.SaveBrownNote = function() {
    // Create a new note.
    var note = new Note();
    note.RecordView();

    // This is not used and will probably be taken out of the scheme,
    note.SetParent(this.Iterator.GetNote());

    // Make a thumbnail image to represent the favorite.
    // Bug: canvas.getDataUrl() not supported in Safari on iPad.
    // Fix: If on mobile, use the thumbnail for the entire slide.
    var src;
    if(MOBILE_DEVICE){
        var image = VIEWER1.GetCache().Image;
        src = "http://slide-atlas.org/thumb?db=" + image.database + "&img=" + image._id + "";
    } else {
        var thumb = CreateThumbnailImage(110);
        src = thumb.src;
    }

    // Save the favorite (note) in the admin database for this specific user.
    $.ajax({
        type: "post",
        url: "/webgl-viewer/saveusernote",
        data: {"note": JSON.stringify(note.Serialize(false)),
               "thumb": src,
               "col" : "views",
               "type": "Favorite"},//"favorites"
        success: function(data,status) {
            note.Id = data;
            LoadFavorites();
        },
        error: function() {
            alert( "AJAX - error() : saveusernote 2" );
        },
    });
}


NotesWidget.prototype.ToggleNotesWindow = function() {
  this.Visibilty = ! this.Visibilty;
  RecordState();

  if (this.Visibilty) {
    this.AnimationCurrent = this.WidthFraction;
    this.AnimationTarget = 0.2;
  } else {
    this.Window.hide();
    this.AnimationCurrent = this.WidthFraction;
    this.AnimationTarget = 0.0;
  }
  this.AnimationLastTime = new Date().getTime();
  this.AnimationDuration = 1000.0;
  this.AnimateNotesWindow();
}


// Randomize the order of the children
NotesWidget.prototype.RandomCallback = function() {
  var note = this.Iterator.GetNote();
  note.Children.sort(function(a,b){return Math.random() - 0.5;});
  note.UpdateChildrenGUI();
}

NotesWidget.prototype.SaveCallback = function() {
    // Copy the current view into the note.
    // This used to be "Snap Shot", which was too complex.
    this.RecordTextChanges();
    var note = this.SelectedNote;
    note.RecordView();
    if (note.Type == "Stack") {
        // Copy viewer annotation to the viewer record.
        note.RecordAnnotations();
    }
    
    var self = this;
    var d = new Date();
    
    // Save this users notes in the user specific collection.
    var noteObj = JSON.stringify(this.RootNote.Serialize(true));
    $.ajax({
        type: "post",
        url: "/webgl-viewer/saveviewnotes",
        data: {"note" : noteObj,
               "date" : d.getTime()},
        success: function(data,status) {
            self.SaveButton.css({'color' : '#278BFF'});
            self.ModifiedFlag = false;
            window.onbeforeunload = null;
        },
        error: function() { alert( "AJAX - error() : saveviewnotes" ); },
    });
}

NotesWidget.prototype.CheckForSave = function() {
  if (this.ModifiedFlag) {
    var message = "Save changes in database?\n\nPress Cancel to discard changes.";
    if (confirm(message)) { SaveCallback(); }
  }
  return true;
}


NotesWidget.prototype.AnimateNotesWindow = function() {
  var timeStep = new Date().getTime() - this.AnimationLastTime;
  if (timeStep > this.AnimationDuration) {
    // end the animation.
    this.WidthFraction = this.AnimationTarget;
    handleResize();
    if (this.Visibilty) {
      this.CloseNoteWindowButton.show();
      this.OpenNoteWindowButton.hide();
      this.Window.fadeIn();
    } else {
      this.CloseNoteWindowButton.hide();
      this.OpenNoteWindowButton.show();
    }
    draw();
    return;
  }

  var k = timeStep / this.AnimationDuration;

  // update
  this.AnimationDuration *= (1.0-k);
  this.WidthFraction += (this.AnimationTarget-this.WidthFraction) * k;

  handleResize();
  draw();
  var self = this;
  requestAnimFrame(function () {self.AnimateNotesWindow();});
}

// Called when a new slide/view is loaded.
NotesWidget.prototype.DisplayRootNote = function() {
  this.TextEntry.val(this.RootNote.Text);
  this.NoteTreeDiv.empty();
  this.RootNote.DisplayGUI(this.NoteTreeDiv);
  this.RootNote.Select();
}

NotesWidget.prototype.LoadViewId = function(viewId) {
  VIEW_ID = viewId;
  this.RootNote = new Note();
  if (typeof(viewId) != "undefined" && viewId != "") {
    this.RootNote.LoadViewId(viewId);
  }
  // Since loading the view is asynchronous,
  // the this.RootNote is not complete at this point.
}



// Add a user note to the currently selected notes children.
NotesWidget.prototype.NewCallback = function() {
  var childIdx = 0;
  var currentNote = this.Iterator.GetNote();
  var parentNote = this.Iterator.GetParentNote();
  if (parentNote) {
    childIdx = parentNote.Children.indexOf(currentNote)+1;
  } else {
    parentNote = currentNote;
  }

  // Create a new note.
  var childNote = new Note();
  childNote.Title = "New Note";
  var d = new Date();
  childNote.Date = d.getTime(); // Temporary. Set for real by server.
  childNote.RecordView();

  // Now insert the child after the current note.
  parentNote.Children.splice(childIdx,0,childNote);
  childNote.SetParent(parentNote);
  parentNote.UpdateChildrenGUI();
  childNote.Select();

  this.Modified();
}

