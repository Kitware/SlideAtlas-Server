// One note widget per window (even with two viewers).
// Notes are a tour of the slide.
// Notes canbe nested (tree structure) to allow for student questions, comments or discussion.
// Notes within the same level are ordered.

// For animating the display of the notes window.
var NOTES_FRACTION = 0.0;
var NOTES_VISIBILITY = false;
var TOP_NOTES = [];
var NOTE_TEXT;

// There are notes and comments.
// Notes are loaded with the page; there will be a functionality to add them.
// Each note contains a tree of comments associated with them, in the Data attribute.
// When the note is loaded, said comments will be loaded into the widget in tree form with a recursive function.
// Each comment has an array of children comments under it in the tree,
// a reference to the parent, and a reference to the div it will be loaded in.

function Note (data) {
  var self = this; // trick to set methods in callbacks.
  //this.Children = [];
  this.Data = data;
  
  // Unused.  I'm pretty sure that this will become unnecessary.
  /*if(parent != null){
    this.Div = $('<div>').after(parent)
      .css({
        'background-color': 'white',
        'border': '1px solid #000000',
        'position': 'relative',
        'top' : '5px',
        'left' : '0%',
        'height' : '140px',
        'width': '95%',
        'z-index': '1',
        'text-align': 'left',
        'color': '#303030',
        'font-size': '15px',
        'word-wrap': 'break-word'
      });
  } else {
    this.Div = $('<div>').appendTo($('#NoteEditor'))
      .css({
        'background-color': 'white',
        'border': '1px solid #000000',
        'position': 'relative',
        'top' : '10px',
        //'left' : '0%',
        'height' : '140px',
        'width': '95%',
        'margin': '0 auto',
        'z-index': '1',
        'text-align': 'left',
        'color': '#303030',
        'font-size': '15px',
        'word-wrap': 'break-word'
      });
  }
      
  this.Text = $('<div>').appendTo(this.Div)
    .css({
      'position': 'relative',
      'top': '5px',
      'left': '0px',
      'font-size': '15px'
    }).attr('wrap', 'logical')
    .();
  
  this.Text.hide();
    
  this.Editor = $('<textarea>').appendTo(this.Div)
    .css({
      'position': 'relative',
      'top': '-10px',
      'height': '100px',
      'left': '2px',
      //'right': '5%',
      'width': '95%',
      'margin': '0 auto',
      'border': '1px solid #d3d3d3', 
      'resize': 'none'})
    //.attr('id', 'NoteEditorText')
    .attr('wrap', 'logical');
    
  this.Editor.val(data.title);
  
  //Cancel
  this.Cancel = $('<button>').appendTo(this.Div)
    .css({
      'position': 'relative',
      'top': '-20px',
      'bottom': '5px',
      'float': 'right'
    })
    .text('Cancel')
    .attr('wrap', 'logical')
    .click(function(){ document.getElementById('NoteEditorText').value = ""; });
    
  //Save
  this.Save = $('<button>').appendTo(this.Div)
    .css({
      'position': 'relative',
      'top': '-20px',
      'float': 'left'
    })
    .text('Save')
    .attr('wrap', 'logical')
    .click(function(){ self.SaveFunc(); }); 
  
  //Edit
  this.Edit = $('<button>').appendTo(this.Div)
    .css({
      'position': 'relative',
      'top': '5px',
      'bottom': '5px',
      'left': '0px',
      'float': 'left'
    })
    .text('Edit')
    .attr('wrap', 'logical').hide()
    .click(function(){ self.EditFunc(); });
  
  //Reply
  this.Reply = $('<button>').appendTo(this.Div)
    .css({
      'position': 'relative',
      'top': '5px',
      'float': 'right'
    })
    .text('Reply')
    .attr('wrap', 'logical').hide()
    .click(function(){ self.ReplyFunc(); }); */
  
  
}



function Comment (text, author, parent){
  var self = this;
  this.Text = text;
  this.Author = author; // The purpose of this is obvious.  When a student or teacher writes a comment, it should show.
  //In future, a variable containing the time of post could be added.
  this.Children = [];
  this.Parent = parent;
}

// To load a comment, create the container element, load the data, then load all the children comments.
// We can remove comments from previously loaded notes by removing only the divs containing the root comments of the tree.
// Use SMALL indentations to distinguish children comments from parent comments.
Comment.prototype.load(){
  // The containing div.  Will be recreated on each load.
  // MAKE SURE TO REMOVE IT WHEN A NEW NOTE IS LOADED.  I don't know what'll happen if that's messed up...
  // Two cases - if the parent is a note, in which case this.Parent will be null, and if the parent is another comment.
  if(this.Parent){
    //The case of another comment.
    this.Container = $('<div>').appendTo(this.Parent.Container)
      .css({
        'left': '10px' //Not quite small enough to not get noticed.
      });
  } else {
    
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
}



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


  var d = $('<div>').appendTo('body')
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
  
  
  // Wrapper element.  Wraps the admin's new-note button and the nav buttons
  // where they won't get in the way of the text.
  
  var notenav1 = $('<div>').appendTo(d)
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
    //.click(function(){ TOP_NOTES.push(new Note(null, null)) });
  
  /*$.ajax({url: window.location.href + '&bookmarks=1',
          success: function(data){
            bookmarks = JSON.parse(data);
          })*/
  
  // Load the bookmarks, and encapsulate them into notes.
  $.get(window.location.href + '&bookmarks=1',
        function(data,status){
          if (status == "success") {
            var length = data.Bookmarks.length;
            for(var i=0; i < length; i++){
              var note = new Note(data.Bookmarks[i]);
              TOP_NOTES.push(note);
            }
            // There may not be any notes associate with the slide, in which case this will be left blank.
            // But we will need to initialize the element in order to prepare for notes which might be added.
            NOTE_TEXT = $('<div>').appendTo(d)
              .css({
                'width': '96%',
                'margin': '0 auto',
                'font-size': '18px'
              });
            if(TOP_NOTES.length != 0){
              // Load the first note.
              refreshNote();
              
              //Not sure if I'll need these two lines in future.
              
              //.text(TOP_NOTES[0].Data.title);
              //VIEWER1.SetCamera(TOP_NOTES[0].Data.center, TOP_NOTES[0].Data.rotation, 900 << TOP_NOTES[0].Data.height);
            }
          } else { alert("ajax failed."); }
        });
  
  // Used to reset the camera, the text of the div that contains the note title, and the comments.
  function refreshNote(){
    var index = notenav2.data("index");
    //There could be errors if there are currently no notes.  This check is very much needed.
    if(index < 0 || index >= TOP_NOTES.length) return;
    
    // Set the stuff.
    NOTE_TEXT.text(TOP_NOTES[index].Data.title);
    VIEWER1.SetCamera(TOP_NOTES[index].Data.center,
                      TOP_NOTES[index].Data.rotation,
                      900 << TOP_NOTES[index].Data.height);
    //Need to let the comments be in the database.
  }
  
  //To wrap the previous and next buttons.
  var notenav2 = $('<div>').appendTo(notenav1)
    .css({
      'float': 'right'
    }).data("index", 0);
  
  // Nav buttons, to cycle around the notes.
  
  var prev = $('<button>').appendTo(notenav2).text("Prev")
    .css({
      'float': 'left'
    })
    .click(function(){
      notenav2.data("index", notenav2.data("index") - 1);
      if(notenav2.data("index") == -1) notenav2.data("index", TOP_NOTES.length-1);
      refreshNote();
    });
  
  var next = $('<button>').appendTo(notenav2).text("Next")
    .css({
      'float': 'right'
    })
    .click(function(){
      notenav2.data("index", notenav2.data("index") + 1);
      if(notenav2.data("index") == TOP_NOTES.length) notenav2.data("index", 0);
      refreshNote();
    });
    
  
  
  
  // The next three elements are to handle the addition of comments.  Currently placeholders.
  // The top div wraps the text field and the submit button at the bottom of the widget.
  
  var commentTextWrapper = $('<div>').appendTo(d)
    .css({
      'position': 'absolute',
      'width': '96%',
      'margin': '0 auto',
      'bottom': '15px'
    });
  
  var commentTextField = $('<textarea>').appendTo(commentTextWrapper)
    .css({
      'position': 'relative',
      'width': '98%',
      'left': '2%',
      'top': '5px',
      'bottom-margin': '50px',
      'height': '70px',
      'resize': 'none'
    });
  
  //The data attribute will contain a reference to the comment object that
  //the commenter is replying to.  The text of the button should be changed to match, for clarity of UI.
  var commentSubmit = $('<button>').appendTo(commentTextWrapper)
    .css({
      'float': 'right',
      'top': '7px',
      'bottom': '7px'
    }).text("Reply")
    .data("replyTo", null);
  
    
  //var note = new Note();
  //TOP_NOTES.push(note);
  //var note2 = new Note();
}





// It would be nice to animate the transition
// It would be nice to integrate all animation in a flexible utility.
var NOTES_ANIMATION_LAST_TIME;
var NOTES_ANIMATION_DURATION;
var NOTES_ANIMATION_TARGET;

function ToggleNotesVisibility() {
  $('#viewEditMenu').hide();

  NOTES_VISIBILITY = ! NOTES_VISIBILITY;

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




