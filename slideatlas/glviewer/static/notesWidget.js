// One note widget per window (even with two viewers).
// Notes are a tour of the slide.
// Notes canbe nested (tree structure) to allow for student questions, comments or discussion.
// Notes within the same level are ordered.

// For animating the display of the notes window.
var NOTES_FRACTION = 0.0;
var NOTES_VISIBILITY = false;
// First level notes of a "View" (used to be bookmarks)
var TOP_NOTES = [];
// Current top note displayed.
var TOP_NOTE_INDEX = 0;
var TOP_NOTE;

// GUI elements
var TOP_NOTE_WRAPPER_DIV;
var NOTE_TEXT;

var NOTENAV2;
var NOTE_PREV_BUTTON;
var NOTE_NEXT_BUTTON;

var REPLY_TO;
var EDIT_FLAG;

// There are notes and comments.
// Notes are loaded with the page; there will be a functionality to add them.
// Comment trees will be gotten when the corresponding note is loaded, AND DELETED AFTERWARDS.
// Each note contains a tree of comments associated with them, in the Data attribute.
// When the note is loaded, said comments will be loaded into the widget in tree form with a recursive function.
// Each comment has an array of children comments under it in the tree,
// the id of the parent, and a reference to the div it will be loaded in.

// TODO

// Finish the reply and edit buttons for individual comments
// Rework the loadComment function
// Add a cancel button next to the reply button at the bottom DONE
// TESTING!!! COMMITTING!!! CELEBRATION!!!


// data is the object retrieved from mongo (with string ids)
// Right now we expect bookmarks, but it will be generalized later.
function Note (data) {
  // I do not like saving the mongo object as "Data".
  // Could I somehow cast data to a note, or copy all fields to Note?
  this.Data = data;
  this.ChildrenDivs = [];
  
  // Notes are currently only populated with bookmarks.
  // In the future, they will have multiple (two for now) viewers and
  // sources specified.
  this.Source = VIEWER1.GetCache();
}

// Gui must be reset before this call.
// Used to reset the camera, the text of the div that contains the note title, and the comments.
// This is setup so a single note is displayed at a time.
// This constructs the HTML GUI from the mongo "Data" object.
// It also sets up the viewers with the source, camera and annotations.
Note.prototype.Show = function() {
  // Set GUI stuff. 
  NOTE_TEXT.text(this.Data.title);
  VIEWER2.SetCache(this.Source);
  VIEWER1.SetCache(this.Source);
  VIEWER1.SetCamera(this.Data.center,
                    this.Data.rotation,
                    900 << this.Data.zoom);
  
  // Create new annotations.
  // I do not like creating new annotations every time.
  // In the near future, create an "AddWidget" method.
  // Take the viewer argument out of the widget constructors.
  if (this.Data.annotation) {
    var annotation = this.Data.annotation;
    if (annotation.type == "pointer") {
      // All bookmarks are a single view.
      var arrow = new ArrowWidget(VIEWER1, false);
      arrow.SetColor(annotation.color);
      arrow.SetPoints(annotation.points[1], annotation.points[0]);
    }
  }

  var self = this;
  // TODO: Rename the URL to getchildcomments
  $.post("/webgl-viewer/getparentcomments", 
         {"db": ARGS.Viewer1.db, 'id': this.Data._id}, 
        self.LoadChildComments);
}


// Callback for an ajax call that returns all children of an object.
// Notes keep the id of their parent object (view or note or comment).
// I want to use the same schema for all three (view or note or comment)
// I want to use note objects for comments too.
// Get all the child comments for this note and display them.
Note.prototype.LoadChildComments = function(data) {
  // Save the divs so we can remove them (collapse them).
  this.ChildrenDivs = [];

  //For each top-level comment returned, make the standard divs and stuff.
  for(var i=0; i < data.length; i++){
    //The new wrapper div.
    var d = $('<div>').appendTo(TOP_NOTE_WRAPPER_DIV)
                      .css({'left': '10px'}) //Not quite small enough to not get noticed.
                      .attr("id", data[i]._id);
    this.ChildrenDivs.push(d);
        
    // The div that actually contains the comment text.
    // As long as the class is unique - which it is - we can still select this element individually.
    var t = $('<div>').appendTo(d)
                      .attr("class", data[i]._id).innerHTML(data[i].text)
                      .css({'width': '100%'});
    
    // The reply button.  When this is clicked, we tell commentsubmit we're replying to this comment.
    var r = $('<button>').appendTo(d).text("Reply")
                         .css({'float': 'right'})
    // TODO: Clean this up.
      .click(function(){
        //Set the data attributes of commentSubmit.
        //The ajax request is simply for convenience of UI, so the commenter
        //can know who wrote the comment he's replying to.
        $.post('/webgl-viewer/getauthor', {'db': ARGS.Viewer1.db, 'commentid': data[i]._id}, function(data2){
            var author = data2;
            //jQuery.data(commentSubmit, "replyTo", data[i]._id).data(commentSubmit, 'editFlag', null);
            REPLY_TO = data[i]._id;
            EDIT_FLAG = "";
            commentSubmit.text("Reply to " + author);
          });
      });
      
    // The edit button.
    var e = $('<button>').appendTo(d).text("Edit")
      .css({
        'float': 'left'
      }).click(function(){
        // We need to load the current text into the field, and prepare the data attributes.
        // Once the commentsubmit button is clicked, we need to be able to tell that we're editing.
        commentSubmit.text("Edit");
        //jQuery.data(commentSubmit, "editFlag", data[i]._id);
        EDIT_FLAG = data[i]._id;
        commentTextField.val(data[i].text);
      });
    
    // Load the children comments.
    //for(var j = 0; j < data[i].children.length; j++){
    //  LoadChildComment(data[i].children[j]);
    //}
  }
}

Note.prototype.HideChildComments = function() {
  for(var i=0; i < this.ChildrenDivs.length; i++){
    this.ChildrenDivs[i].remove();
  }
}



/*function Comment (text, author, parent, children){
  var self = this;
  this.Text = text;
  this.Author = author; // The purpose of this is obvious.  When a student or teacher writes a comment, it should show.
  //In future, a variable containing the time of post could be added.
  this.Children = children; // This is a list of STRINGS that represent objectids.
  this.Parent = parent; // Again, this is a STRING representing an objectid.
}

// To load a comment, create the container element, load the data, then load all the children comments.
// We can remove comments from previously loaded notes by removing only the divs containing the root comments of the tree.
// Use SMALL indentations to distinguish children comments from parent comments.
Comment.prototype.load = function(){
  //First, make an ajax request to get the data.
  
 
  
  // The containing div.  Will be recreated on each load.
  // MAKE SURE TO REMOVE IT WHEN A NEW NOTE IS LOADED.  I don't know what'll happen if that's messed up...
  // Two cases - if the parent is a note, in which case this.Parent will be the empty string, and if the parent is another comment.
  if(this.Parent != ""){
    //The case of another comment.
    this.Container = $('<div>').appendTo(this.Parent.Container)
      .css({
        'left': '10px' //Not quite small enough to not get noticed.
      });
  } else {
    this.Container = $('<div>').appendTo(this.);
  }
  
  // The div containing the comment text.
  this.CommentText = $('<div>').appendTo(this.Container).text(this.Text)
    .css({
      'width': '100%'
    });
  
  // Load the children comments.
  for(var i = 0; i < this.Children.length; i++){
    this.Children[i].load();
  }
}*/

            

function DisplayTopNote (noteIndex) {
  if (TOP_NOTES.length == 0) { return; }

  // There could be errors if there are currently no notes.
  if(noteIndex < 0 || noteIndex >= TOP_NOTES.length) return;

  // Remove comments from the previous note.
  if (TOP_NOTE) {
    TOP_NOTE.HideChildComments();
    TOP_NOTE = null;
  }
  // Remove Annotations from the previous note.
  VIEWER1.Reset();
  VIEWER2.Reset();

  // Disable and enable prev/next buttons so we cannot go past the end.
  if (noteIndex == 0) {
    NOTE_PREV_BUTTON.attr("disabled", true);
  }
  if (noteIndex > 0) {
    NOTE_PREV_BUTTON.removeAttr("disabled");
  }
  if (noteIndex == TOP_NOTES.length - 1) {
    NOTE_NEXT_BUTTON.attr("disabled", true);
  }
  if (noteIndex < TOP_NOTES.length - 1) {
    NOTE_NEXT_BUTTON.removeAttr("disabled");
  }

  TOP_NOTE = TOP_NOTES[noteIndex]
  TOP_NOTE.Show();
  TOP_NOTE_INDEX = noteIndex;
}

// When bookmarks are eliminated, this method will be legacy.
function BookmarksCallback (data, status) {
  if (status == "success") {
    var length = data.Bookmarks.length;
    for(var i=0; i < length; i++){
      var note = new Note(data.Bookmarks[i]);
      TOP_NOTES.push(note);
    }
    if(TOP_NOTES.length != 0){
      // Load the first note.
      DisplayTopNote(0);
    }
  } else { alert("ajax failed."); }
}




function SaveCommentCallback (data) {
  //Now that we know placement in the database was successful, we can do whatever we need to.
  //This section is an expanded clone of the loadComment function, but it's different.
  //Now that we've saved the comment to the database, we need to display the new comment dynamically,
  //and I don't know if the loadComment function can be adapted to do that.  Perhaps it could be,
  //but I was in a hurry.  So, I made a new function.
  
  // If we were replying to an existing comment, create the new comment div in the note widget.
  if(REPLY_TO == ""){
    //The new wrapper div.
    var d = $('<div>').appendTo(document.getElementById(parent))
                      .css({'left': '10px'}) //Not quite small enough to not get noticed.
                      .attr("id", commentid);
      
    // The div that actually contains the comment text.
    // As long as the class is unique - which it is - we can still select this element individually.
    var t = $('<div>').appendTo(d).attr("class", commentid).innerHTML(commenttext)
                      .css({'width': '100%'});
    
    // The reply button.  When this is clicked, we tell commentsubmit we're replying to this comment.
    var r = $('<button>').appendTo(d).text("Reply")
                         .css({'float': 'right'})
                         .click(
      function(){
        //Set the data attributes of commentSubmit.
        //The ajax request is simply for convenience of UI, so the commenter
        //can know who wrote the comment he's replying to.
        $.post('/webgl-viewer/getauthor', {'db': ARGS.Viewer1.db, 'commentid': parent}, 
          function(data){
            var author = data;
            //jQuery.data(commentSubmit, "replyTo", commentid).data(commentSubmit, 'editFlag', null);
            REPLY_TO = commentid;
            EDIT_FLAG = "";
            commentSubmit.text("Reply to " + author);
          });
      });
    
    // The edit button.
    var e = $('<button>').appendTo(d).text("Edit")
                         .css({'float': 'left'})
                         .click(
      function(){
        // We need to load the current text into the field, and prepare the data attributes.
        // Once the commentsubmit button is clicked, we need to be able to tell that we're editing.
        commentSubmit.text("Edit");
        //jQuery.data(commentSubmit, "editFlag", commentid);
        EDIT_FLAG = commentid;
        commentTextField.val(commenttext);
      });
    
  } else if(EDIT_FLAG != "") {
    //We need to edit the visible comment.
    //var q = "." + commentid;
    //var e = $(q);
    //var v = commentTextField.val();
    //e.innerHTML(v);
    $("."+commentid).innerHTML(commentTextField.val());
  } else {
    //We're posting a new top level comment.  Slightly different from the reply-to-parent code.
    //It's different in that we append it directly to TOP_NOTE_WRAPPER_DIV,
    //and that we need to add it to the list of top-level comments for that note.  Which is difficult.
    
    //The new wrapper div.
    var d = $('<div>').appendTo(TOP_NOTE_WRAPPER_DIV)
                      .css({'left': '10px'}) //Not quite small enough to not get noticed.
                      .attr("id", commentid);
      
    // The div that actually contains the comment text.
    // As long as the class is unique - which it is - we can still select this element individually.
    var t = $('<div>').appendTo(d).attr("class", commentid).innerHTML(commenttext)
                      .css({'width': '100%'});
    
    // The reply button.  When this is clicked, we tell commentsubmit we're replying to this comment.
    var r = $('<button>').appendTo(d).text("Reply")
                         .css({'float': 'right'})
                         .click(
      function(){
        //Set the data attributes of commentSubmit.
        //The ajax request is simply for convenience of UI, so the commenter
        //can know who wrote the comment he's replying to.
        $.post('/webgl-viewer/getauthor', {'db': ARGS.Viewer1.db, 'commentid': commentid}, function(data){
            var author = data;
            //jQuery.data(commentSubmit, "replyTo", commentid).data(commentSubmit, 'editFlag', null);
            REPLY_TO = commentid;
            EDIT_FLAG = "";
            commentSubmit.text("Reply to " + author);
          });
      });
    
    // The edit button.
    var e = $('<button>').appendTo(d).text("Edit")
                         .css({'float': 'left'})
                         .click(
      function() {
        // We need to load the current text into the field, and prepare the data attributes.
        // Once the commentsubmit button is clicked, we need to be able to tell that we're editing.
        commentSubmit.text("Edit");
        //jQuery.data(commentSubmit, "editFlag", commentid);
        EDIT_FLAG = commentid;
        commentTextField.val(commenttext);
      });
  }
  
  //Reset the data attributes and other stuff, just in case.
  //jQuery.data(commentSubmit, 'replyTo', null).data(commentSubmit, 'editFlag', null);
  REPLY_TO = "";
  EDIT_FLAG = "";
  commentSubmit.text("Reply");
  commentTextField.val("");
}




// Recursively loads comments.
/*
function LoadChildComment(id){
  $.post("/webgl-viewer/getcomment", {"db": ARGS.Viewer1.db, 'id': id},
      function(data){
          //The new wrapper div.
          var d = $('<div>').appendTo(document.getElementById(data.parent))
            .css({
              'left': '10px' //Not quite small enough to not get noticed.
            }).attr("id", data._id);
              
          // The div that actually contains the comment text.
          // As long as the class is unique - which it is - we can still select this element individually.
          var t = $('<div>').appendTo(d).attr("class", data._id).innerHTML(data.text)
            .css({
              'width': '100%'
            });
          
          // The reply button.  When this is clicked, we tell commentsubmit we're replying to this comment.
          var r = $('<button>').appendTo(d).text("Reply")
            .css({
              'float': 'right'
            })
            .click(function(){
              //Set the data attributes of commentSubmit.
              //The ajax request is simply for convenience of UI, so the commenter
              //can know who wrote the comment he's replying to.
              $.post('/webgl-viewer/getauthor', {'db': ARGS.Viewer1.db, 'commentid': data._id}, function(data2){
                  var author = data2;
                  //jQuery.data(commentSubmit, "replyTo", data._id).data('editFlag', null);
                  REPLY_TO = data._id;
                  EDIT_FLAG = "";
                  commentSubmit.text("Reply to " + author);
                });
            });
            
          // The edit button.
          var e = $('<button>').appendTo(d).text("Edit")
            .css({
              'float': 'left'
            }).click(function(){
              // We need to load the current text into the field, and prepare the data attributes.
              // Once the commentsubmit button is clicked, we need to be able to tell that we're editing.
              commentSubmit.text("Edit");
              //jQuery.data(commentSubmit, "editFlag", data._id);
              EDIT_FLAG = data._id;
              commentTextField.val(data.text);
            });
          
          // Load the children comments.
          //for(var i = 0; i < data.children.length; i++){
          //  LoadChildComment(data.children[i]);
          //}
      });
}
*/

// saving means:
// replace the text field with regular text
// replace the save and cancel buttons with reply and edit buttons.
/*Note.prototype.SaveFunc = function() {
  this.Cancel.hide();
  this.Save.hide();
  this.Edit.show();
  this.Reply.show();
  
  this.Text.text(this.Editor.val());
  this.Editor.hide();
  this.Text.show();
  
}

Note.prototype.EditFunc = function() {
  this.Cancel.show();
  this.Save.show();
  this.Edit.hide();
  this.Reply.hide();
  
  this.Text.hide();
  this.Editor.show();
  
  //this.Editor.value
}

// What we do here is, is we make a new note right under the one we clicked 'reply' on, and add it to the list of children.
Note.prototype.ReplyFunc = function() {
  Children.push(new Note(this, ""));
}*/

function InitNotesWidget() {

  $('<button>').appendTo('body').css({
      'opacity': '0.2',
      'position': 'absolute',
      'height': '30px',
      'width': '80px',
      'font-size': '18px',
      'bottom' : '5px',
      'left' : '5px',
      'z-index': '2'})
    .attr('id', 'notesButton').text("Notes")
    .click(function(){ToggleNotesVisibility();});


  TOP_NOTE_WRAPPER_DIV = $('<div>').appendTo('body')
    .css({
      'background-color': 'white',
      'position': 'absolute',
      'top' : '0%',
      'left' : '0%',
      'height' : '100%',
      'width': '20%',
      'z-index': '1',
      'text-align': 'left',
      'color': '#303030',
      'font-size': '14px'})
    .hide()
    .attr('id', 'NoteEditor');
  
  
  // Wrapper element.  
  // Wraps the admin's new-note button and the nav buttons
  // where they won't get in the way of the text.
  
  var notenav1 = $('<div>').appendTo(TOP_NOTE_WRAPPER_DIV)
    .css({
      'position': 'relative',
      'top': '5px',
      'margin-bottom': '5px'
      //'float': 'left'
    });
  
  // Unused/a placeholder at the moment.  Will be fleshed out later.
  //I propose this mechanic for use:
  //1. Set the camera view, annotations, etc.
  //2. Type the title of the note into the comment text field at the bottom.
  //3. Click this button to save the note.
  //Essentially, turn it into a submit button that grabs what's there for another purpose.
  //To add later: Should be only visible if the person who's logged in is an admin.
  
  var NewNote = $('<button>').appendTo(notenav1).text('New Note');
  
  /*$.ajax({url: window.location.href + '&bookmarks=1',
          success: function(data){
            bookmarks = JSON.parse(data);
          })*/
  
  
  //To wrap the previous and next buttons.
  NOTENAV2 = $('<div>').appendTo(notenav1)
    .css({
      'float': 'right'
    });
    
  // Nav buttons, to cycle around the notes.
  
  NOTE_PREV_BUTTON = $('<button>').appendTo(NOTENAV2).text("Prev")
                                  .css({'float': 'left'})
                                  .click(function(){
                                           DisplayTopNote(TOP_NOTE_INDEX-1);
                                         });
  
  NOTE_NEXT_BUTTON = $('<button>').appendTo(NOTENAV2).text("Next")
                                  .css({'float': 'right'})
                                  .click(function(){
                                           DisplayTopNote(TOP_NOTE_INDEX+1);
                                         });
        
  // The next three elements are to handle the addition of comments.  Currently placeholders.
  // The top div wraps the text field and the submit button at the bottom of the widget.
  
  var commentTextFieldWrapper = $('<div>').appendTo(TOP_NOTE_WRAPPER_DIV)
    .css({
      'position': 'absolute',
      'width': '96%',
      'margin': '0 auto',
      'bottom': '15px'
    });
  
  var commentTextField = $('<textarea>').appendTo(commentTextFieldWrapper)
    .css({
      'position': 'relative',
      'width': '98%',
      'left': '2%',
      'top': '5px',
      'bottom-margin': '50px',
      'height': '70px',
      'resize': 'none'
    });
  
  // Ok, so I want a cancel button next to the comment submit button.  This means one more wrapper div.
  
  var commentButtonWrapper = $('<div>').appendTo(commentTextFieldWrapper)
    .css({
      'float': 'right',
      'top': '7px',
      'bottom': '7px'
    });
  
  // I might not have to define the commentsubmit button first, but just to be safe...
  
  // The admittedly very complex comment submit button.
  // What I'm doing is, I'm using the button for multiple purposes.
  // When the button is clicked, I look at data attributes attached to the button
  // to see whether I'm posting a new comment, replying to another comment, or editing an existing comment.
  
  //The data attribute will contain a reference to the comment object that
  //the commenter is replying to.  The text of the button should be changed to match, for clarity of UI.
  //jQuery.data(commentSubmit, "replyTo", null)
    //.data(commentSubmit, "editFlag", null); 
  
  REPLY_TO = "";
  EDIT_FLAG = "";//Set this attribute to the stringified id of the comment you're editing
  
  var commentSubmit = $('<button>').appendTo(commentButtonWrapper)
    .css({
      'float': 'right'
    }).text("Reply")
    .click(function(){
      //we need dbid, commentid, commenttext, children, and parent
      // This function should serve both replying and editing purposes.
      var dbid = ARGS.Viewer1.db;
      var commentid = EDIT_FLAG;
      //if(EDIT_FLAG)
        //commentid = EDIT_FLAG;
      var commenttext = commentTextField.val();
      var children = [];
      var parent = REPLY_TO;
      //var author = "Random Person";
      //Add author here by changing this line to get the cookie.
      
      // NOTE: We don't get the author with Javascript; the Python portion reads the session variable.
      
      //Save the comment to the database.
      $.post("/webgl-viewer/savecomment",
        { "db": dbid, "commentid": commentid, "text": commenttext, "children": JSON.stringify(children), "parent": parent},
        SaveCommentCallback);
    });
  
  //And the cancel button.  When clicked, just reset the data attributes and text.
  var cancelComment = $('<button>').appendTo(commentButtonWrapper).text("Cancel")
    .css({
      'float': 'left'
    }).click(function(){
      //jQuery.data(commentSubmit, 'replyTo', null).data('editFlag', null);
      REPLY_TO = "";
      EDIT_FLAG = "";
      commentSubmit.text("Reply");
      commentTextField.val("");
    });
    

  // There may not be any notes associate with the slide, in which case this will be left blank.
  // But we will need to initialize the element in order to prepare for notes which might be added.
  NOTE_TEXT = $('<div>').appendTo(TOP_NOTE_WRAPPER_DIV)
                        .css({'width': '96%',
                              'margin': '0 auto',
                              'font-size': '18px'});

  // Load the bookmarks, and encapsulate them into notes.
  $.get(window.location.href + '&bookmarks=1',
        BookmarksCallback);    
}




// It would be nice to animate the transition
// It would be nice to integrate all animation in a flexible utility.
var NOTES_ANIMATION_LAST_TIME;
var NOTES_ANIMATION_DURATION;
var NOTES_ANIMATION_TARGET;

function ToggleNotesVisibility() {
  $('#viewEditMenu').hide();

  NOTES_VISIBILITY = ! NOTES_VISIBILITY;
  RecordState();

  if (NOTES_VISIBILITY) {
    NOTES_ANIMATION_CURRENT = NOTES_FRACTION;
    NOTES_ANIMATION_TARGET = 0.2;
  } else {
    $('#NoteEditor').hide();
    NOTES_ANIMATION_CURRENT = NOTES_FRACTION;
    NOTES_ANIMATION_TARGET = 0.0;
  }
  NOTES_ANIMATION_LAST_TIME = new Date().getTime();
  NOTES_ANIMATION_DURATION = 1000.0;
  AnimateNotesToggle();
}

function AnimateNotesToggle() {
  var timeStep = new Date().getTime() - NOTES_ANIMATION_LAST_TIME;
  if (timeStep > NOTES_ANIMATION_DURATION) {
    // end the animation.
    NOTES_FRACTION = NOTES_ANIMATION_TARGET;
    handleResize();
    if (NOTES_VISIBILITY) {
      $('#NoteEditor').fadeIn();
    }

    
    return;
    }
  
  var k = timeStep / NOTES_ANIMATION_DURATION;
    
  // update
  NOTES_ANIMATION_DURATION *= (1.0-k);
  NOTES_FRACTION += (NOTES_ANIMATION_TARGET-NOTES_FRACTION) * k;
  
  handleResize();
  requestAnimFrame(AnimateNotesToggle);
}




