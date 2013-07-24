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


// For animating the display of the notes window (DIV).
var NOTES_FRACTION = 0.0;
var NOTES_VISIBILITY = false;

// Root of the note tree.
var ROOT_NOTE;

// Iterator is used to implement the next and previous note buttons.
var NOTE_ITERATOR;

// GUI elements
var NOTE_WINDOW;
var TOP_NOTE_WRAPPER_DIV;
var NOTE_TEXT_ENTRY;


// Navigation buttons.
var NOTE_PREV;
var NOTE_NEXT;

var EDIT_FLAG;



//------------------------------------------------------------------------------
// Iterator to perform depth first search through note tree.
// Collapsed branches (children not visible) are not traversed.
function NoteIterator() {
  this.Stack = null;
}

NoteIterator.prototype.Initialize = function(rootNote) {
  var item = {};
  item.Note = rootNote;
  item.Index = 0;
  item.Parent = null;
  this.Stack = item;
}


// Should not be necessary
NoteIterator.prototype.GetNote = function() {
  if (this.Stack == null) { return null; }
  return this.Stack.Note;
}


// Peek to see if next or previous should be disabled.
NoteIterator.prototype.IsStart = function() {
  if (this.Stack == null) { return true; }
  if (this.Stack.Parent == null) {return true;}
  return false;
}

NoteIterator.prototype.IsEnd = function() {
  if (this.Stack == null) { return true; }
  var item = this.Stack;
  var note = item.Note;
  // If we are not at a leaf, then there are more notes to traverse.
  if (note.ChildrenVisible && note.Children.length > 0) {
    return false;
  }
  // If any note in the stack is not the last child, there are more to traverse
  while (item.Parent) {
    var parent = item.Parent.Note;
    if (item.Index < parent.Children.length - 1) {
      return false;
    }
    item = item.Parent;
  }
  return true;
}

// Parent note is traversed before children.
// Move forward one step.  Return the new note. At end the last note returned again. 
// IsEnd method used to detect terminal case.
NoteIterator.prototype.Next = function() {
  if (this.Stack == null) { return null; }
  var note = this.Stack.Note;
  // Traverse children (if any).
  if (note.ChildrenVisible && note.Children.length > 0) {
    item = {};
    item.Note = note.Children[0];
    item.Index = 0;
    item.Parent = this.Stack;
    this.Stack = item;
    return item.Note;
    }
  // Find the next child of any item in the stack.
  // If any note in the stack is not the last child, there are more to traverse
  while (item.Parent) {
    var parent = item.Parent;
    // Does the parent.Note have children after item.Note?
    if (item.Index < parent.Note.Children.length - 1) {
      // Yes.  Move the iterator to the next sibling.
      // Reuse sibling item.
      ++item.Index;
      item.Note = parent.Note.Children[item.Index];
      this.Stack = item;
      return item.Note;
    }
    // No.  Move to the next parent up the stack.
    item = parent;
  }

  // We must be stuck at the end.
  return this.Stack.Note;
}

// Move backward one step.  See "Next" method comments.
NoteIterator.prototype.Previous = function() {
  if (this.Stack == null) { return null; }
  var item = this.Stack;
  // Case 0: Root. End case.  Just keep returning the root note.
  if (item.Parent == null) {
    return item.Note;
  }
  // Case 1: First child.  Just go to the parent.
  if (item.Index == 0 && item.Parent) {
    this.Stack = item.Parent;
    return this.Stack.Note;
  }
  // Case 2: Later childr.  Move to older sibling.
  // Move item to sibling (reuse the item object).
  --item.Index;
  // Parent must exist if index is > 0;
  item.Note = item.Parent.Note.Children[item.Index];
  // Children are traversed before (reverse) parent.
  // If the older sbling has children,  We have to parse them first.
  while (item.Note.ChildrenVisible && item.Note.Children.length > 0) {
    var childItem = {};
    childItem.Parent = item;
    // Goto the last sibling.
    childItem.Index = item.Note.Children.length-1;
    childItem.Note = item.Note.Children[childItem.Index];
    this.Stack = childItem;
    item = childItem;
  }
  return item.Note;
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
  
  this.Text = "";
  // Upto two for dual view.
  this.ViewerRecords = [];

  // Sub notes
  this.Children = [];
  this.ChildrenVisible = true;

  // GUI elements.
  this.Icon = $('<img>').css({'height': '20px',
                              'width': '20x',
                              'float':'left'})
                        .attr('src',"webgl-viewer/static/dot.png");
  this.TextDiv = $('<div>').css({'font-size': '18px',
                                 'margin-left':'20px'})
                           .text(this.Text);
  this.ChildrenDiv = $('<div>').css({'margin-left':'15px'});
}

// No clearing.  Just draw this notes GUI in a div.
Note.prototype.DisplayGUI = function(div) {
  // Put an icon to the left of the text.
  
  this.Icon.appendTo(div);
  this.TextDiv.appendTo(div).text(this.Text);
  // The div should attached even if nothing is in it.
  // A child may appear and UpdateChildrenGui called.
  // If we could tell is was removed, UpdateChildGUI could append it.
  this.ChildrenDiv.appendTo(div);
  this.UpdateChildrenGUI();
}

Note.prototype.UpdateChildrenGUI = function() {
  // Clear
  this.ChildrenDiv.empty();
  if (this.Children.length == 0) {
    this.Icon.attr('src',"webgl-viewer/static/dot.png");
    return;
  }
  if (this.ChildrenVisible == false) {
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
  obj.User = this.User;
  obj.Date = this.Date;
  obj.ParentId = this.ParentId;
  obj.Text = this.Text;
  // We should probably serialize the ViewerRecords too.
  obj.ViewerRecords = this.ViewerRecords;
  if (includeChildren) {
    obj.Children = [];
    for (var i = 0; i < this.Children.length; ++i) {
      obj.Children.push(this.Children[i].Serialize());
    }
  }
  return obj;
}

Note.prototype.Load = function(obj){
  for (ivar in obj) {
    this[ivar] = obj[ivar];
  }
  for (var i = 0; i < this.Children; ++i) {
    var childObj = this.Children[i];
    this.Children[i] = new Note();
    this.Children[i].Load(childObj);
  }
  for (var i = 0; i < this.ViewerRecords.length; ++i) {
    if (obj.ViewerRecords[i]) {
      obj.ViewerRecords[i].__proto__ = ViewerRecord.prototype;
    }
  }
}



Note.prototype.LoadBookmark = function(data) {
  // What should we do about date? I do not think Bookmarks record the date.
  this.Id = data._id;
  this.ParentId = ARGS.Viewer1.viewid;

  this.Text = data.title;
  var viewerRecord = new ViewerRecord();
  viewerRecord.LoadBookmark(data);
  this.ViewerRecords = [viewerRecord];

  this.RequestUserNotes();
}


function SaveUserNote() {
  // Create a new note.
  var childNote = new Note();
  var d = new Date();
  this.Date = d.getTime(); // Also reset later.

  childNote.Text = NOTE_TEXT_ENTRY.val();
  NOTE_TEXT_ENTRY.val("");
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
  parentNote.ChildrenVisible = true;

  // Save the note in the database for this specific user.
  // TODO: If author privaleges, save note in the actual session / view.
  var dbid = ARGS.Viewer1.db;
  var bug = JSON.stringify( childNote );
  $.ajax({
    type: "post",
    url: "/webgl-viewer/saveusernote",
    data: {"note": JSON.stringify(childNote.Serialize(false)),
           "db"  : SESSION_DB,
           "date": d.getTime()},
    success: function(data,status) { childNote.Id = data;},
    error: function() { alert( "AJAX - error()" ); },
    });  
  
  // Redraw the GUI. should we make the parent or the new child active?
  // If we choose the child, then we need to update the iterator,
  // which will also update the gui and viewers.
  NextNoteCallback();
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
  this.Text = args.Label;
  this.Id = args.Viewer1.viewid;
  this.ParentId = "";
  var viewerRecord = new ViewerRecord();
  viewerRecord.LoadRootViewer(args.Viewer1);
  this.ViewerRecords = [viewerRecord];
  
  this.RequestUserNotes();
}


Note.prototype.Collapse = function() {
  //alert("Collapse "+this.Text);
  this.ChildrenVisible = false;
  this.UpdateChildrenGUI();
}

Note.prototype.Expand = function() {
  //alert("Expand "+this.Text);
  this.ChildrenVisible = true;
  this.UpdateChildrenGUI();
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

// I do not want to reference the iterator in a note method, so this is separate.
// Just update the states of the forward and next buttons, then call the Note display methods.
function DisplayNote(note) {
  // Disable and enable prev/next buttons so we cannot go past the end.
  if (NOTE_ITERATOR.IsStart()) {
    NOTE_PREV.css({'opacity': '0.1'});
  } else {
    NOTE_PREV.css({'opacity': '0.5'});
  }
  if (NOTE_ITERATOR.IsEnd()) {
    NOTE_NEXT.css({'opacity': '0.1'});
  } else {
    NOTE_NEXT.css({'opacity': '0.5'});
  }
  
  TOP_NOTE_WRAPPER_DIV.empty();
  note.DisplayGUI(TOP_NOTE_WRAPPER_DIV);
  note.DisplayView();
}

// Previous button
function PreviousNoteCallback() {
  if (NOTE_ITERATOR.IsStart()) { return; }

  // Remove Annotations from the previous note.
  VIEWER1.Reset();
  VIEWER2.Reset();

  note = NOTE_ITERATOR.Previous();
  DisplayNote(note);
}

// Next button
function NextNoteCallback() {
  if (NOTE_ITERATOR.IsEnd()) { return; }

  // Remove Annotations from the previous note.
  VIEWER1.Reset();
  VIEWER2.Reset();

  note = NOTE_ITERATOR.Next();
  DisplayNote(note);
}


// When bookmarks are eliminated, this method will be legacy.
function BookmarksCallback (data, status) {
  if (status == "success") {
    var length = data.Bookmarks.length;
    for(var i=0; i < length; i++){
      var note = new Note();
      note.LoadBookmark(data.Bookmarks[i]);
      ROOT_NOTE.Children.push(note);
    }
    // Load the root note.
    DisplayNote(NOTE_ITERATOR.GetNote());
  } else { alert("ajax failed."); }
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


  TOP_NOTE_WRAPPER_DIV = $('<div>').appendTo(NOTE_WINDOW)
    .css({
      'position': 'absolute',
      'top' : '0%',
      'left' : '0%',
      'bottom' : '130px',
      'width': '100%',
      'z-index': '1',
      'text-align': 'left',
      'color': '#303030',
      'font-size': '14px'})
    .attr('id', 'NoteTree');
  
    
  // The next three elements are to handle the addition of comments.  Currently placeholders.
  // The top div wraps the text field and the submit button at the bottom of the widget.
  var commentTextFieldWrapper = $('<div>').appendTo(NOTE_WINDOW)
    .css({
      'position': 'absolute',
      'width': '96%',
      'margin': '0 auto',
      'bottom': '15px'
    });
  
  NOTE_TEXT_ENTRY = $('<textarea>').appendTo(commentTextFieldWrapper)
                                   .css({
                                      'position': 'relative',
                                      'width': '98%',
                                      'left': '2%',
                                      'top': '5px',
                                      'bottom-margin': '50px',
                                      'height': '70px',
                                      'resize': 'none'
                                   });
    
  var commentButtonWrapper = $('<div>').appendTo(commentTextFieldWrapper)
                                       .css({
                                          'float': 'right',
                                          'top': '7px',
                                          'bottom': '7px'
                                       });
  
  EDIT_FLAG = ""; //Set this attribute to the stringified id of the comment you're editing
  
  var commentSubmit = $('<button>').appendTo(commentButtonWrapper)
                                   .css({'float': 'right'})
                                   .text("Save")
                                   .click(function(){ SaveUserNote();});

  // Setup the iterator using the view as root.
  // Bookmarks (sub notes) are loaded next.
  NOTE_ITERATOR = new NoteIterator();
  NOTE_ITERATOR.Initialize(ROOT_NOTE);
  
  // Load the bookmarks, and encapsulate them into notes.
  $.get(window.location.href + '&bookmarks=1',
        BookmarksCallback);    
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
    TOP_NOTE_WRAPPER_DIV.hide();
    NOTES_ANIMATION_CURRENT = NOTES_FRACTION;
    NOTES_ANIMATION_TARGET = 0.0;
  }
  NOTES_ANIMATION_LAST_TIME = new Date().getTime();
  NOTES_ANIMATION_DURATION = 1000.0;
  AnimateNotesWindow();
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


  
/*
  //Set the data attributes of commentSubmit.
  //The ajax request is simply for convenience of UI, so the commenter
  //can know who wrote the comment he's replying to.
////////
      //we need dbid, commentid, commenttext, children, and parent
      // This function should serve both replying and editing purposes.
      var dbid = ARGS.Viewer1.db;
      var commentid = EDIT_FLAG;
      //if(EDIT_FLAG)
        //commentid = EDIT_FLAG;
      var commenttext = commentTextField.val();
      var children = [];
      //var parent = REPLY_TO;
      //var author = "Random Person";
      //Add author here by changing this line to get the cookie.
      
      // NOTE: We don't get the author with Javascript; the Python portion reads the session variable.
      
      //Save the comment to the database.
      $.post("/webgl-viewer/savecomment",
        { "db": dbid, "commentid": commentid, "text": commenttext, "children": JSON.stringify(children), "parent": parent},
        SaveCommentCallback);
    });    
*/

