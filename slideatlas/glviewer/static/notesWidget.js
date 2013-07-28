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


// Navigation buttons.
var NOTE_PREV;
var NOTE_NEXT;

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
  // this.Id = "";
  // this.ParentId = "";
  this.User = ARGS.User; // Reset by flask.
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


Note.prototype.AddChild = function(childNote) {
  // Needed to get the order after a sort.
  childNote.Div.attr("index", this.Children.length);

  this.Children.push(childNote);

  if (this.Children.length == 2) {
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
  var self = this;
  var newChildren = [];
  this.ChildrenDiv.children().each(function(){
      var i = parseInt($(this).attr('index'));
      var note = self.Children[i];
      note.Div.attr("index", newChildren.length);
      newChildren.push(note);
  });
 
  this.Children = newChildren;

  // In case the selected note changed position. Update the iterator.
  // Not necessary anymore.
  //SELECTED_NOTE.Select();  
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

  // Only change the GUI
  // Indicate which note is selected.
  if (SELECTED_NOTE) {
    SELECTED_NOTE.TitleDiv.css({'background':'white'});
  }
  SELECTED_NOTE = this;
  this.TitleDiv.css({'background':'#f0f0f0'});
  // Put the note into the details section.
  NOTE_TITLE_ENTRY.val(this.Title);
  NOTE_TEXT_ENTRY.val(this.Text);

  NOTE_ITERATOR.UpdateButtons();

  this.DisplayView();
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

  obj.Answers = [];
  for (var i = 0; i < this.Answers.length; ++i) {
    obj.Answers.push(this.Answers[i].Serialize());
  }

  if (includeChildren) {
    obj.Children = [];
    for (var i = 0; i < this.Children.length; ++i) {
      obj.Children.push(this.Children[i].Serialize());
    }
  }
  return obj;
}


Note.prototype.Load = function(obj){
  // Shared (superclass?)
  for (ivar in obj) {
    this[ivar] = obj[ivar];
  }
  for (var i = 0; i < this.Answers.length; ++i) {
    var answerObj = this.Answers[i];
    this.Answers[i] = new Note();
    this.Answers[i].Load(answerObj);
  }
  for (var i = 0; i < this.Children.length; ++i) {
    var childObj = this.Children[i];
    var childNote = new Note();
    childNote.Load(childObj);
    this.AddChild(childNote); 
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


// I am going to create two notes for each bookmark so the annotations appear
// like question and answer.
Note.prototype.LoadBookmark = function(data) {
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
           "db"  : SESSION_DB},
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


// Previous button
function PreviousNoteCallback() {
  if (NOTE_ITERATOR.IsStart()) { return; }

  // Remove Annotations from the previous note.
  VIEWER1.Reset();
  VIEWER2.Reset();

  NOTE_ITERATOR.Previous();
  NOTE_ITERATOR.GetNote().Select();
}

// Next button
function NextNoteCallback() {
  if (NOTE_ITERATOR.IsEnd()) { return; }

  // Remove Annotations from the previous note.
  VIEWER1.Reset();
  VIEWER2.Reset();

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
function ReplyCallback () {
  POPUP_MENU.hide();
  // Create a new note.
  var childNote = new Note();
  var d = new Date();
  this.Date = d.getTime(); // Temporary. Set for real by server.

  NOTE_TITLE_ENTRY.val("");
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
  parentNote.Children.push(childNote);
  // ParentId is how we retrieve notes from the database.
  // It is the only tree structure saved.
  childNote.ParentId = parentNote.Id;
  // Expand the parent so that the new note is visible.
  parentNote.ChildrenVisibility = true;
  parentNote.UpdateChildrenGUI();
  
  childNote.Select();
}

// TODO: Activate and inactivate save button based on whether anything has changed.
function SaveCallback() {
  POPUP_MENU.hide();

  currentNote = NOTE_ITERATOR.GetNote();
  currentNote.Title = NOTE_TITLE_ENTRY.val();
  currentNote.Text = NOTE_TEXT_ENTRY.val();
  
  // Save the state of the viewers
  currentNote.ViewerRecords = [];
  //  Viewer1
  var viewerRecord = new ViewerRecord();
  viewerRecord.CopyViewer(VIEWER1);
  currentNote.ViewerRecords.push(viewerRecord);
  // Viewer2
  if (DUAL_VIEW) {
    var viewerRecord = new ViewerRecord();
    viewerRecord.CopyViewer(VIEWER2);
    currentNote.ViewerRecords.push(viewerRecord);
  }
  
  // Save the note in the database for this specific user.
  // TODO: If author privaleges, save note in the actual session / view.
  /*
  var dbid = ARGS.Viewer1.db;
  $.ajax({
    type: "post",
    url: "/webgl-viewer/saveusernote",
    data: {"note": JSON.stringify(childNote.Serialize(false)),
           "db"  : SESSION_DB,
           "date": d.getTime()},
    success: function(data,status) { childNote.Id = data;},
    error: function() { alert( "AJAX - error()" ); },
    });  
  */  
}

// TODO: Disable button when we are not the root note or we do not own the note.
function DeleteCallback () {
  POPUP_MENU.hide();

  var parent = NOTE_ITERATOR.GetParentNote();
  if (parent == null) { return; }
  var note = NOTE_ITERATOR.GetNote();
  
  // Move the current note off this note.
  // There is always a previous.
  PreviousNoteCallback();

  // Get rid of the note.
  var index = parent.Children.indexOf(note);
  parent.Children.splice(index, 1);

  // Redraw the GUI.
  parent.UpdateChildrenGUI();
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
  ROOT_NOTE.LoadRootView(ARGS);

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

  $('<button>').appendTo('body').css({
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
                                          'border-style': 'inset',
                                          'resize': 'none'});
  NOTE_TEXT_ENTRY = $('<textarea>').appendTo(noteDetailDiv)
                                   .css({'position': 'absolute',
                                         'left': '3px',
                                         'right': '3px',
                                         'top': '26px',
                                         'bottom': '43px',
                                         'border-style': 'inset',
                                         'resize': 'none'});
  var commentButtonWrapper = $('<div>').appendTo(noteDetailDiv)
                                       .css({'position': 'absolute',
                                             'width': '100%',
                                             'height': '40px',
                                             'bottom': '0px'});
    
  var popupMenuButton = $('<div>').appendTo(commentButtonWrapper)
                                  .css({'position': 'relative',
                                        'float': 'right'});

  // For less used buttons that appear when mouse is over the pulldown button.
  // I would like to make a dynamic bar that puts extra buttons into the pulldown as it resizes.
  POPUP_MENU = $('<div>').appendTo(popupMenuButton)
                       .css({'position': 'absolute',
                             'left': '0px',
                             'bottom': '0px',
                             'z-index': '2',
                             'background-color': 'white',
                             'padding': '10px',
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
                       
  var replyButton = $('<div>').appendTo(POPUP_MENU)
                              .text("Reply")
                              .css({'color' : '#278BFF', 'width':'100%','font-size': '18px'})
                              .mouseenter(function () { $(this).css({'background': '#e0f0f0'}); })
                              .mouseleave(function () { $(this).css({'background': '#ffffff'}); })
                              .click( ReplyCallback  );
  var SaveButton = $('<div>').appendTo(POPUP_MENU)
                              .text("Save")
                              .css({'color' : '#278BFF', 'width':'100%','font-size': '18px'})
                              .mouseenter(function () { $(this).css({'background': '#e0f0f0'}); })
                              .mouseleave(function () { $(this).css({'background': '#ffffff'}); })
                              .click( SaveCallback  );
  var deleteButton = $('<div>').appendTo(POPUP_MENU)
                               .text("Delete")
                               .css({'color' : '#278BFF', 'width':'100%','font-size': '18px'})
                               .mouseenter(function () { $(this).css({'background': '#e0f0f0'}); })
                               .mouseleave(function () { $(this).css({'background': '#ffffff'}); })
                               .click(DeleteCallback);
                       
  var popupMenuButtonImage = $('<img>').appendTo(popupMenuButton)
    .css({'height': '30px',
          'width': '30x',
          'opacity': '0.6'})
    .attr('src',"webgl-viewer/static/dropDown2.jpg")
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





  
