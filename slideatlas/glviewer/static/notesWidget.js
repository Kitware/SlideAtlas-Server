// Notes canbe nested (tree structure) to allow for student questions, comments or discussion.
// Sessions could be notes.
// Notes within the same level are ordered.
// Question answers can be subnotes.

// Students can save comments that are not seen by other students.
// A separate "Notes" collection is used.
// Notes keep an ID of their parent in the database.
// The recording API is used to save the state of viewers (ViewerRecord)
// Notes just add a tree structure ontop of these states (with GUI).

// Right now we are loading the view and bookmarks as notes.
// Bookmarks have two notes: Question and a child answer.  
// I want to hide the answer in the quesetion note (not show the answer in the GUI).
// My problem is that the answer note does not have enough information to draw
// the Question GUI.  It is burried in the iterator.  I could have a state
// internal to the question note, but this breaks the iterator pattern.
// I am backing out of using the Answer array, but I am not removing it from the code.

// TODO:
// Save order of user notes.
// Detect whether user has permision to save notes.
// Automatically save view changes into application note.
// Automatically save note text and title into application.
// Refresh button to reload the current note. (Reload from database.) (should I refresh children?).
// Link the Save button to store all application notes into database.
// Keep track of whether application notes have been modified.
// Warning popup message to save notes when navigating off page.


// Discusion:  We have a local (not saved to server) edit state (turned on by edit and off by cancel).
// Edit is turned off by advancing to the next note or adding a note.  This is confusing.
// Changes are automatically saved locally. Save buttun saves to server.  This is confusing.


// How about a global lock / unlock button (like quick). Edit -> Clone, Save, Cancel.








// For animating the display of the notes window (DIV).
var NOTES_FRACTION = 0.0;
var NOTES_VISIBILITY = false;

// Root of the note tree.
var ROOT_NOTE;

// Iterator is used to implement the next and previous note buttons.
var NOTE_ITERATOR;
// For clearing selected GUI setting.
var SELECTED_NOTE;


// GUI elements
var NOTE_WINDOW;
var NOTE_TREE_DIV;
var NOTE_TITLE_ENTRY;
var NOTE_TEXT_ENTRY;
var NOTE_NEW_BUTTON;
var NOTE_DELETE_BUTTON;
var NOTE_SAVE_BUTTON;
var NOTE_EDIT_BUTTON;
// We need this flag to record view and text into notes when advancing notees.
var NOTE_EDIT_ACTIVE = false;
// We need this flag so cancel will get rid of a pending new note.
// User can be editing an old note, or a new note.
var NOTE_EDIT_NEW = false;
// Have any notes been modified (and need to be saved to the database)?
var NOTE_MODIFIED = false;



// Navigation buttons.
var NOTE_PREV;
var NOTE_NEXT;

var POPUP_MENU_BUTTON;
var POPUP_MENU;


//------------------------------------------------------------------------------
// Iterator to perform depth first search through note tree.
// Collapsed branches (children not visible) are not traversed.
// This iterator is a bit over engineered.  I made it so we can subclasses
// that iterate over internal states.  However, internal states require
// notes so I made an array of answers (which are hidden).
function NoteIterator(note) {
  this.Note = note;
  this.IteratingAnswers = false;
  this.ChildIterator = null;
}

NoteIterator.prototype.UpdateButtons = function() {
  // Disable and enable prev/next buttons so we cannot go past the end.
  if (this.IsStart()) {
    NOTE_PREV.css({'opacity': '0.1'});
  } else {
    NOTE_PREV.css({'opacity': '0.5'});
  }
  if (this.IsEnd()) {
    NOTE_NEXT.css({'opacity': '0.1'});
  } else {
    NOTE_NEXT.css({'opacity': '0.5'});
  }
}

// Because of sorting, the child array gets reset on us.
// I need a dynamic way to get the Children or Answers array based on the state.
NoteIterator.prototype.GetChildArray = function() {
  if ( ! this.Note) {
    return [];
  }
  if (this.IteratingAnswers) {
    return this.Note.Answers;
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
    // Always iterate through answers
    if (this.Note.Answers.length > 0) {
      return false;
    }
    if (this.Note.Children.length > 0 && this.Note.ChildrenVisibility) {
      return false;
    }
    return true;
  }

  // sub answer is active.
  var childIndex = this.GetChildIndex();
  if (this.IteratingAnswers) {
    if (this.Note.Children.length > 0 && this.Note.ChildrenVisibility) {
      // We have children which come after answers.
      return false;
    } 
    // No children.  Answer array is the last. Check is current is last answer.
    if (childIndex == this.GetChildArray().length - 1) {
      return this.ChildIterator.IsEnd();
    }
    // More answers after current.
    return false;
  }
  
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
    // First check for answers
    if (this.Note.Answers.length > 0) {
      // Move to the first answer.
      this.IteratingAnswers = true;
      this.ChildIterator = this.GetChildArray()[0].NewIterator();
      return this.ChildIterator.GetNote();
    }
    // Next check for children notes
    if (this.Note.Children.length > 0 && this.Note.ChildrenVisibility) {
      // Move to the first child.
      this.IteratingAnswers = false;
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
  
  // Move from answers to children
  if (this.IteratingAnswers && 
      this.Note.Children.length > 0 && 
      this.Note.ChildrenVisibility) {
    this.IteratingAnswers = false;
    this.ChildIterator = this.Note.Children[0].NewIterator();
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
  
  // We are at the begining of an array.
  // If we are in the child array, try to move to the answer array
  if ( ! this.IteratingAnswers && this.Note.Answers.length > 0) {
    this.IteratingAnswers = true;
    var childIndex = this.GetChildArray().length -1;
    this.ChildIterator = this.GetChildArray()[childIndex].NewIterator();
    this.ChildIterator.ToEnd();
    return this.ChildIterator.GetNote();
  }

  // No more sub notes left.  Move to the root.
  this.ChildIterator = null;
  this.IteratingAnswers = false;
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
  if (this.Note.Answers.length > 0) {
    this.ChildArray = this.Note.Answers;
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
  this.User = GetUser(); // Reset by flask.
  var d = new Date();
  this.Date = d.getTime(); // Also reset later.
  this.Type = "Note";
  
  
  this.Title = "";
  this.Text = "";
  // Upto two for dual view.
  this.ViewerRecords = [];

  // Hidden children for questions.
  this.Answers = [];
  
  // Sub notes
  this.Children = [];
  this.ChildrenVisibility = true;

  // GUI elements.
  this.Div = $('<div>').attr({'class':'note'});

  this.Icon = $('<img>').css({'height': '20px',
                              'width': '20x',
                              'float':'left'})
                        .attr('src',"webgl-viewer/static/dot.png")
                        .appendTo(this.Div);
  this.TitleDiv = $('<div>').css({'font-size': '18px',
                                 'margin-left':'20px',
                                 'color':'#379BFF',})
                           .text(this.Title)
                           .appendTo(this.Div);
  // The div should attached even if nothing is in it.
  // A child may appear and UpdateChildrenGui called.
  // If we could tell is was removed, UpdateChildGUI could append it.
  this.ChildrenDiv = $('<div>').css({'margin-left':'15px'})
                               .appendTo(this.Div);

}


Note.prototype.UserCanEdit = function() {
  return true;
}


Note.prototype.RecordView = function() {
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
  
  if (this.Children.length == 2 && this.UserCanEdit() && NOTE_EDIT_ACTIVE) {
    var self = this;
    this.ChildrenDiv.sortable({axis: "y",
                               containment: "parent",
                               update: function( event, ui ){self.ReorderChildren();}});                               
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
      NoteModified();
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
  if (NOTE_ITERATOR.GetNote() != this) {
    // For when user selects a note from a list.
    // Find the note and set a new iterator
    // This is so the next and previous buttons will behave.
    var iter = ROOT_NOTE.NewIterator();
    while (iter.GetNote() != this) {
      if ( iter.IsEnd()) {
        alert("Could not find note.");
        return;
      }
      iter.Next();
    }
    NOTE_ITERATOR = iter;    
  }

  // Handle the note that is being unselected.
  // Clear the selected background of the deselected note.
  if (SELECTED_NOTE) {
    SELECTED_NOTE.TitleDiv.css({'background':'white'});
    if (NOTE_EDIT_ACTIVE && SELECTED_NOTE.UserCanEdit()) {
      SELECTED_NOTE.RecordGUIChanges();
      NoteModified();     
    }
  }
  
  if (this.UserCanEdit() && NOTE_EDIT_ACTIVE) {
    NOTE_TITLE_ENTRY.removeAttr('readonly');
    NOTE_TITLE_ENTRY.css({'border-style': 'inset',
                          'background': '#f5f8ff'});
    NOTE_TEXT_ENTRY.removeAttr('readonly');
    NOTE_TEXT_ENTRY.css({'border-style': 'inset',
                         'background': '#f5f8ff'});
    NOTE_DELETE_BUTTON.show();  
  } else {
    NOTE_TITLE_ENTRY.attr('readonly', 'readonly');
    NOTE_TITLE_ENTRY.css({'border-style': 'solid',
                          'background': '#ffffff'});
    NOTE_TEXT_ENTRY.attr('readonly', 'readonly');
    NOTE_TEXT_ENTRY.css({'border-style': 'solid',
                         'background': '#ffffff'});
    NOTE_DELETE_BUTTON.hide();  
  }

  if (this == ROOT_NOTE){
    // We do not allow the user to delete the root note / slide.
    // We need a session editor to do that.
    NOTE_DELETE_BUTTON.hide();
  }
  
  SELECTED_NOTE = this;
  // Indicate which note is selected.
  this.TitleDiv.css({'background':'#f0f0f0'});
  // Put the note into the details section.
  NOTE_TITLE_ENTRY.val(this.Title);
  NOTE_TEXT_ENTRY.val(this.Text);
  
  NOTE_ITERATOR.UpdateButtons();

  this.DisplayView();
}


Note.prototype.RecordGUIChanges = function () {
  this.Title = NOTE_TITLE_ENTRY.val();
  this.TitleDiv.text(SELECTED_NOTE.Title);
  this.Text = NOTE_TEXT_ENTRY.val();
  this.RecordView();
}


// No clearing.  Just draw this notes GUI in a div.
Note.prototype.DisplayGUI = function(div) {
  // Put an icon to the left of the text.
  var self = this;
  this.Div.appendTo(div);

  var self = this;
  
  this.TitleDiv.text(this.Title);
  this.TitleDiv.click(function() {self.Select()});
  this.TitleDiv.hover(function(){self.TitleDiv.css({'text-decoration':'underline'});},
                     function(){self.TitleDiv.css({'text-decoration':'none'});});
                     
  this.UpdateChildrenGUI();
}


Note.prototype.UpdateChildrenGUI = function() {
  // Clear
  this.ChildrenDiv.empty();
  if (this.Children.length == 0) {
    this.Icon.attr('src',"webgl-viewer/static/dot.png");
    return;
  }
  if (this.ChildrenVisibility == false) {
    var self = this;
    this.Icon.attr('src',"webgl-viewer/static/plus.png")
             .click(function() {self.Expand();});
    return;
  }

  // Callback trick
  var self = this;
  
  // Redraw
  this.Icon.attr('src',"webgl-viewer/static/minus.png")
           .click(function() {self.Collapse();});
  for (var i = 0; i < this.Children.length; ++i) {
    this.Children[i].DisplayGUI(this.ChildrenDiv);
  }
}


Note.prototype.Serialize = function(includeChildren) {
  var obj = {};
  obj.Type = this.Type;
  obj.User = this.User;
  obj.Date = this.Date;
  obj.ParentId = this.ParentId;
  obj.Title = this.Title;
  obj.Text = this.Text;
  // We should probably serialize the ViewerRecords too.
  obj.ViewerRecords = this.ViewerRecords;

  //obj.Answers = [];
  //for (var i = 0; i < this.Answers.length; ++i) {
  //  obj.Answers.push(this.Answers[i].Serialize());
  //}

  if (includeChildren) {
    obj.Children = [];
    for (var i = 0; i < this.Children.length; ++i) {
      obj.Children.push(this.Children[i].Serialize());
    }
  }
  return obj;
}

// This method of loading is causing a pain.
// Children ...
Note.prototype.Load = function(obj){
  // Shared (superclass?)
  for (ivar in obj) {
    this[ivar] = obj[ivar];
  }
  this.TitleDiv.text(this.Title);
  //for (var i = 0; i < this.Answers.length; ++i) {
  //  var answerObj = this.Answers[i];
  //  this.Answers[i] = new Note();
  //  this.Answers[i].Load(answerObj);
  //}
  for (var i = 0; i < this.Children.length; ++i) {
    var childObj = this.Children[i];
    var childNote = new Note();
    childNote.Load(childObj);
    this.Children[i] = childNote;
    childNote.Div.data("index", i);

  }
  // Because we are not using add child.
  if (this.Children.length > 1 && this.UserCanEdit() && NOTE_EDIT_ACTIVE) {
    var self = this;
    this.ChildrenDiv.sortable({axis: "y",
                               containment: "parent",
                               update: function( event, ui ){self.ReorderChildren();}});                               
  }

  for (var i = 0; i < this.ViewerRecords.length; ++i) {
    if (obj.ViewerRecords[i]) {
      obj.ViewerRecords[i].__proto__ = ViewerRecord.prototype;
    }
  }

  if ( ! obj.Type || obj.Type == "Note") {
    return;
  }

  // I could try to combone bookmark and question, but bookmark
  // is geared to interactive presentation not offline quiz. 
  if (obj.Type == "Bookmark") {
    // No difference yet.
    return;
  }
  if (obj.Type == "Answer") {
    // No difference yet.
    return;
  }

  
  alert("Cannot load note of type " + obj.Type);
}



Note.prototype.LoadView = function(viewId) {
  var self = this;
  $.ajax({
    type: "get",
    url: "/webgl-viewer/getview",
    data: {"viewid": viewId,
           "db"  : GetSessionDatabase()},
    success: function(data,status) { self.Load(data);},
    error: function() { alert( "AJAX - error()" ); },
    });  
}




// I am going to create two notes for each bookmark so the annotations appear
// like question and answer.
Note.prototype.LoadBookmark = function(data) {
  if ( ! ARGS) { return; }
  
  // What should we do about date? I do not think Bookmarks record the date.
  this.Id = data._id;
  this.ParentId = ARGS.Viewer1.viewid;

  this.Title = data.title;
  this.Text = data.title;
  var viewerRecord = new ViewerRecord();
  viewerRecord.LoadBookmark(data);
  this.ViewerRecords = [viewerRecord];

  this.RequestUserNotes();
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
    data: {"parentid": this.Id,
           "db"  : GetSessionDatabase()},
    success: function(data,status) { self.LoadUserNotes(data);},
    error: function() { alert( "AJAX - error()" ); },
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


// Root view with default bookmark
// Eventually all these loads will be the same.
Note.prototype.LoadRootView = function(args) {
  this.Title = args.Label;
  if (args.Text) {
    this.Text = args.Text;
  }
  this.Id = args.Viewer1.viewid;
  this.ParentId = "";
  var viewerRecord = new ViewerRecord();
  viewerRecord.LoadRootViewer(args.Viewer1);
  this.ViewerRecords = [viewerRecord];
  
  this.RequestUserNotes();
}


Note.prototype.Collapse = function() {
  this.ChildrenVisibility = false;
  if (this.Contains(SELECTED_NOTE)) {
    // Selected note should not be in collapsed branch.
    // Make the visible ancestor active.
    this.Select();
  }
  this.UpdateChildrenGUI();
  NOTE_ITERATOR.UpdateButtons();
}


Note.prototype.Expand = function() {
  this.ChildrenVisibility = true;
  this.UpdateChildrenGUI();
  NOTE_ITERATOR.UpdateButtons();
}


// Set the state of the WebGL viewer from this notes ViewerRecords.
Note.prototype.DisplayView = function() { 

  // Remove Annotations from the previous note.
  VIEWER1.Reset();
  VIEWER2.Reset();

  SetNumberOfViews(this.ViewerRecords.length);

  if (this.ViewerRecords.length > 0) {
    this.ViewerRecords[0].Apply(VIEWER1);
  }
  if (this.ViewerRecords.length > 1) {
    this.ViewerRecords[1].Apply(VIEWER2);
  } else {
    // Default source.
    VIEWER2.SetCache(VIEWER1.GetCache());
  }
}


//------------------------------------------------------------------------------


function NoteModified() {
  NOTE_MODIFIED = true;
}


// Previous button
function PreviousNoteCallback() {
  if (NOTE_ITERATOR.IsStart()) { return; }

  NOTE_ITERATOR.Previous();
  NOTE_ITERATOR.GetNote().Select();
}

// Next button
function NextNoteCallback() {
  if (NOTE_ITERATOR.IsEnd()) { return; }

  NOTE_ITERATOR.Next();
  NOTE_ITERATOR.GetNote().Select();
}


// When bookmarks are eliminated, this method will be legacy.
function BookmarksCallback (data, status) {
  if (status == "success") {
    var length = data.Bookmarks.length;
    for(var i=0; i < length; i++){
      // I am going to create two notes for each bookmark so the annotations appear
      // like question and answer.
      var note = new Note();
      note.LoadBookmark(data.Bookmarks[i]);
      note.Title = "Question";
      note.Text = "";
      note.Type = "Bookmark";
      note.ViewerRecords[0].AnnotationVisibility = ANNOTATION_NO_TEXT; 
      ROOT_NOTE.AddChild(note);
      var note2 = new Note();
      note2.Type = "Answer";
      note2.LoadBookmark(data.Bookmarks[i]);
      note2.Title = "Answer";
      note2.ViewerRecords[0].AnnotationVisibility = ANNOTATION_ON; 
      note.AddChild(note2);
      }
    ROOT_NOTE.UpdateChildrenGUI();
  } else { alert("ajax failed."); }
  NOTE_ITERATOR.GetNote().Select();
}


// It would be nice to animate the transition
// It would be nice to integrate all animation in a flexible utility.
var NOTES_ANIMATION_LAST_TIME;
var NOTES_ANIMATION_DURATION;
var NOTES_ANIMATION_TARGET;

function ToggleNotesWindow() {
  NOTES_VISIBILITY = ! NOTES_VISIBILITY;
  RecordState();

  if (NOTES_VISIBILITY) {
    NOTES_ANIMATION_CURRENT = NOTES_FRACTION;
    NOTES_ANIMATION_TARGET = 0.2;
  } else {
    NOTE_WINDOW.hide();
    NOTES_ANIMATION_CURRENT = NOTES_FRACTION;
    NOTES_ANIMATION_TARGET = 0.0;
  }
  NOTES_ANIMATION_LAST_TIME = new Date().getTime();
  NOTES_ANIMATION_DURATION = 1000.0;
  AnimateNotesWindow();
}


// Add a user note to the currently selected notes children.
function NewCallback () {
  POPUP_MENU.hide();
  
  // Clean up if the user was editing a note.
  DeactivateEdit(true);

  // Create a new note.
  var childNote = new Note();
  childNote.Title = "New Note";
  var d = new Date();
  this.Date = d.getTime(); // Temporary. Set for real by server.

  NOTE_TITLE_ENTRY.val("New Note");
  NOTE_TEXT_ENTRY.val("");
  
  // Save the state of the viewers.
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
  parentNote = NOTE_ITERATOR.GetNote();
  parentNote.AddChild(childNote, true);
  // ParentId is how we retrieve notes from the database.
  // It is the only tree structure saved.
  childNote.ParentId = parentNote.Id;
  // Expand the parent so that the new note is visible.
  parentNote.ChildrenVisibility = true;
  parentNote.UpdateChildrenGUI();
  
  childNote.Select();
  
  // New notes are immediatly editable.
  // What happens if cancel is selected?  We should delete the new note.
  NOTE_EDIT_NEW = true;
  EditCallback();
}


// TODO: Activate and inactivate save button based on user owning note
// This callback is for both the edit and cancel behaviors.
function EditCallback() {

  NOTE_EDIT_ACTIVE = true;

  NOTE_EDIT_BUTTON.hide();
  POPUP_MENU_BUTTON.show();  
  NOTE_NEW_BUTTON.show();
  NOTE_SAVE_BUTTON.show();
  // This handles making the note editable (including showing and hiding the delete button).
  SELECTED_NOTE.Select();

  // This handles making children sortable.
  var iter = ROOT_NOTE.NewIterator();
  do {
    var note = iter.GetNote();
    iter.Next();
    if (note.Children.length > 1 && note.UserCanEdit()) {
      var self = note;
      note.ChildrenDiv.sortable({axis: "y",
                                 containment: "parent",
                                 update: function( event, ui ){self.ReorderChildren();}});
      // Indicate the children are sortable...
      note.ChildrenDiv.css({'border-left': '2px solid #00a0ff'});
    }                                
  } while ( ! iter.IsEnd());

  window.onbeforeunload = function () {
    if (NOTE_EDIT_ACTIVE && SELECTED_NOTE.UserCanEdit()) {
      SELECTED_NOTE.RecordGUIChanges();
    }
    return "Some changes have not been saved to database.";
  }  
}


function CancelCallback() {
  POPUP_MENU.hide();
  if (NOTE_EDIT_ACTIVE) {
    // Cancel edit
    DeactivateEdit(false);
    // This resets the old note values to the GUI / view/
    SELECTED_NOTE.Select();

    if (NOTE_EDIT_NEW) {
      var parent = NOTE_ITERATOR.GetParentNote();
      DeleteCallback();
      parent.Select();
    }
    return;
  }
}



// TODO: Activate and inactivate save button based on whether anything has changed.
function SaveCallback() {
  POPUP_MENU.hide();

  if (NOTE_EDIT_ACTIVE && SELECTED_NOTE.UserCanEdit()) {
    SELECTED_NOTE.RecordGUIChanges();
  }
  
  var d = new Date();
  
  // If user owns the root note, then upload all notes to the view.
  if (ROOT_NOTE.UserCanEdit()) {
    // Save this users notes in the user specific collection.
    var dbid = GetSessionDatabase();
    
    var noteObj = JSON.stringify(ROOT_NOTE.Serialize(true));
    $.ajax({
      type: "post",
      url: "/webgl-viewer/saveviewnotes",
      data: {"note" : noteObj,
             "db"   : GetSessionDatabase(),
             "view" : GetViewId(),
             "date" : d.getTime()},
      success: function(data,status) {},
      error: function() { alert( "AJAX - error()" ); },
      });  
  } else {
    // Save just the users notes to the notes collection.    
    // Save all of the users notes in the database for this specific user.
    // Save this users notes in the user specific collection.
    var iter = ROOT_NOTE.GetIterator();
    do {
      var note = iter.GetNote();
      if (note.UserCanEdit()) {
        $.ajax({
          type: "post",
          url: "/webgl-viewer/saveusernote",
          data: {"note": JSON.stringify(note.Serialize(false)),
                 "db"  : GetSessionDatabase(),
                 "date": d.getTime()},
          success: function(data,status) { note.Id = data;},
          error: function() { alert( "AJAX - error()" ); },
          });  
      }
    } while(iter.IsEnd());
  }
  
  window.onbeforeunload = null;
  NOTE_MODIFIED = false;
  NOTE_EDIT_ACTIVE = false;
  
  POPUP_MENU_BUTTON.hide();
  NOTE_SAVE_BUTTON.hide();
  NOTE_DELETE_BUTTON.hide();
  NOTE_NEW_BUTTON.hide();
  NOTE_EDIT_BUTTON.show();
  SELECTED_NOTE.Select();
}

// TODO: Disable button when we are not the root note or we do not own the note.
function DeleteCallback () {
  POPUP_MENU.hide();

  NoteModified();
  
  var parent = NOTE_ITERATOR.GetParentNote();
  if (parent == null) {
    return;
  }
  var note = NOTE_ITERATOR.GetNote();
  
  // Move the current note off this note.
  // There is always a previous.
  PreviousNoteCallback();

  // Get rid of the note.
  var index = parent.Children.indexOf(note);
  parent.Children.splice(index, 1);

  // If this user does not own the lesson, 
  // then immediatley remove the note from the database.
  // Lesson autho will have to select save to change the database.
  /* Should we immediately change the database, or wait until the user selects save?
  $.ajax({
    type: "post",
    url: "/webgl-viewer/deleteusernote",
    data: {"id"  : note.Id,
           "db"  : GetSessionDatabase()},
    success: function(data,status) {},
    error: function() { alert( "AJAX - error()" ); },
    });  
  */
  
  // Redraw the GUI.
  parent.UpdateChildrenGUI();
}

function CheckForSave() {
  if (NOTE_EDIT_ACTIVE && SELECTED_NOTE.UserCanEdit()) {
    SELECTED_NOTE.RecordGUIChanges();
    NoteModified();
  }

  if (NOTE_MODIFIED) {
    var message = "Save changes in database?\n\nPress Cancel to discard changes.";
    if (confirm(message)) { SaveCallback(); }
  }
  return true;
}


function AnimateNotesWindow() {
  var timeStep = new Date().getTime() - NOTES_ANIMATION_LAST_TIME;
  if (timeStep > NOTES_ANIMATION_DURATION) {
    // end the animation.
    NOTES_FRACTION = NOTES_ANIMATION_TARGET;
    handleResize();
    if (NOTES_VISIBILITY) {
      NOTE_WINDOW.fadeIn();
    }
  return;
  }
  
  var k = timeStep / NOTES_ANIMATION_DURATION;
    
  // update
  NOTES_ANIMATION_DURATION *= (1.0-k);
  NOTES_FRACTION += (NOTES_ANIMATION_TARGET-NOTES_FRACTION) * k;
  
  handleResize();
  requestAnimFrame(AnimateNotesWindow);
}


function InitNotesWidget() {
  ROOT_NOTE = new Note();
  if (typeof(ARGS) != "undefined") { // legacy
    ROOT_NOTE.LoadRootView(ARGS);
  }
  if (typeof(NOTE_ID) != "undefined") {
    ROOT_NOTE.LoadView(NOTE_ID);
  }
  
  // Nav buttons, to cycle around the notes.  
  NOTE_PREV = $('<img>').appendTo('body')
    .css({
      'opacity': '0.5',
      'position': 'absolute',
      'height': '35px',
      'width': '35x',
      'bottom' : '5px',
      'left' : '5px',
      'z-index': '2'})
    .attr('src',"webgl-viewer/static/leftArrow2.png")
    .click(function(){PreviousNoteCallback();});

  $('<button>').appendTo('body')
    .css({
      'opacity': '0.5',
      'position': 'absolute',
      'height': '35px',
      'width': '80px',
      'font-size': '18px',
      'bottom' : '5px',
      'left' : '45px',
      'color' : '#379BFF',
      'z-index': '2'})
    .text("Notes")
    .click(function(){ToggleNotesWindow();});

  NOTE_NEXT = $('<img>').appendTo('body')
    .css({
      'opacity': '0.5',
      'position': 'absolute',
      'height': '35px',
      'width': '35x',
      'bottom' : '5px',
      'left' : '130px',
      'z-index': '2'})
  .attr('src',"webgl-viewer/static/rightArrow2.png")
  .click(function(){NextNoteCallback();});

  NOTE_WINDOW = $('<div>').appendTo('body')
    .css({
      'background-color': 'white',
      'position': 'absolute',
      'top' : '0%',
      'left' : '0%',
      'height' : '100%',
      'width': '20%',
      'z-index': '1'})
    .hide()
    .attr('id', 'NoteWindow');


  NOTE_TREE_DIV = $('<div>').appendTo(NOTE_WINDOW)
    .css({
      'position': 'absolute',
      'top' : '0%',
      'left' : '0%',
      'height' : '60%',
      'width': '100%',
      'overflow': 'auto',
      'z-index': '1',
      'text-align': 'left',
      'color': '#303030',
      'font-size': '18px'})
    .attr('id', 'NoteTree');
  
    
  // The next three elements are to handle the addition of comments.  Currently placeholders.
  // The top div wraps the text field and the submit button at the bottom of the widget.
  var noteDetailDiv = $('<div>').appendTo(NOTE_WINDOW)
    .css({'position': 'absolute',
          'width': '100%',
          'top': '60%',
          'height': '40%'});
  
  NOTE_TITLE_ENTRY = $('<textarea>').appendTo(noteDetailDiv)
                                    .css({'position': 'absolute',
                                          'left': '3px',
                                          'right': '3px',
                                          'height': '20px',
                                          'border-style': 'solid',
                                          'background': '#ffffff',
                                          'resize': 'none'});                                                                                    
  NOTE_TEXT_ENTRY = $('<textarea>').appendTo(noteDetailDiv)
                                   .css({'position': 'absolute',
                                         'left': '3px',
                                         'right': '3px',
                                         'top': '26px',
                                         'bottom': '43px',
                                         'border-style': 'solid',
                                         'background': '#ffffff',
                                         'resize': 'none'});
  NOTE_TITLE_ENTRY.attr('readonly', 'readonly');
  NOTE_TEXT_ENTRY.attr('readonly', 'readonly');

  var buttonWrapper = $('<div>').appendTo(noteDetailDiv)
                                       .css({'position': 'absolute',
                                             'width': '100%',
                                             'height': '40px',
                                             'bottom': '0px'});
  
  // Only visible when in edit mode.
  POPUP_MENU_BUTTON = $('<div>').appendTo(buttonWrapper)
                                .hide()
                                .css({'position': 'relative',
                                      'float': 'right',
                                      'margin': '5px'});
  NOTE_EDIT_BUTTON = $('<button>').appendTo(buttonWrapper)
                                .text("Edit")
                                .css({'color' : '#278BFF',
                                      'font-size': '18px',
                                      'position': 'relative',
                                      'float': 'right',
                                      'margin': '5px'})
                                .click( EditCallback  );
  NOTE_NEW_BUTTON = $('<button>').appendTo(buttonWrapper)
                                .hide()
                                .text("New")
                                .css({'color' : '#278BFF',
                                      'font-size': '18px',
                                      'position': 'relative',
                                      'float': 'right',
                                      'margin': '5px'})
                                .click( NewCallback  );

  // For less used buttons that appear when mouse is over the pulldown button.
  // I would like to make a dynamic bar that puts extra buttons into the pulldown as it resizes.
  POPUP_MENU = $('<div>').appendTo(POPUP_MENU_BUTTON)
                       .css({'position': 'absolute',
                             'left': '0px',
                             'bottom': '0px',
                             'z-index': '2',
                             'background-color': 'white',
                             'padding': '5px 5px 30px 5px',
                             'border-radius': '8px',
                             'border-style': 'solid',
                             'border-width':'1px'})
                       .hide()
                       .mouseleave(function(){
                          var self = $(this),
                          timeoutId = setTimeout(function(){POPUP_MENU.fadeOut();}, 650);
                          //set the timeoutId, allowing us to clear this trigger if the mouse comes back over
                          self.data('timeoutId', timeoutId);  })
                       .mouseenter(function(){
                          clearTimeout($(this).data('timeoutId')); });                       

  NOTE_DELETE_BUTTON = $('<button>').appendTo(POPUP_MENU)
                                .hide()
                                .text("Delete")
                                .css({'color' : '#278BFF', 'width':'100%','font-size': '18px'})
                                .click( DeleteCallback  );

  NOTE_SAVE_BUTTON = $('<button>').appendTo(POPUP_MENU)
                                  .hide()
                                  .text("Save")
                                  .css({'color' : '#278BFF', 'width':'100%','font-size': '18px'})
                                  .click( SaveCallback  );
                       
  var popupMenuButtonImage = $('<img>').appendTo(POPUP_MENU_BUTTON)
    .css({'height': '30px',
          'width': '30x',
          'opacity': '0.6'})
    .attr('src',"webgl-viewer/static/dropDown1.jpg")
    .mouseenter(function() {POPUP_MENU.fadeIn(); });

  // Setup the iterator using the view as root.
  // Bookmarks (sub notes) are loaded next.
  NOTE_ITERATOR = ROOT_NOTE.NewIterator();

  // Load the root note.
  NOTE_TREE_DIV.empty();
  ROOT_NOTE.DisplayGUI(NOTE_TREE_DIV);
  NOTE_ITERATOR.GetNote().Select();
  
  // Load the bookmarks, and encapsulate them into notes.
  $.get(window.location.href + '&bookmarks=1',
        BookmarksCallback);            
}





  
