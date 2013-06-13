// One note widget per window (even with two viewers).
// Notes are a tour of the slide.
// Notes canbe nested (tree structure) to allow for student questions, comments or discussion.
// Notes within the same level are ordered.

// For animating the display of the notes window.
var NOTES_FRACTION = 0.0;
var NOTES_VISIBILITY = false;
var TOP_NOTES = [];


function Note (parent) {
  var self = this; // trick to set methods in callbacks.
  this.Parent = parent;
  this.Children = [];
  if(parent != null){
    this.Div = $('<div>').after(parent)
      .css({
        'background-color': 'white',
        'border': '1px solid #000000',
        'position': 'relative',
        'top' : '5px',
        'left' : '0%',
        'height' : '145px',
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
        'top' : '5px',
        //'left' : '0%',
        'height' : '145px',
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
      'left': '-70px',
      'font-size': '15px'
    }).attr('wrap', 'logical');
  
  this.Text.hide();
    
  this.Editor = $('<textarea>').appendTo(this.Div)
    .css({
      'position': 'relative',
      'top': '-20px',
      'height': '100px',
      'left': '2px',
      //'right': '5%',
      'width': '95%',
      'margin': '0 auto',
      'border': '1px solid #d3d3d3', 
      'resize': 'none'})
    //.attr('id', 'NoteEditorText')
    .attr('wrap', 'logical')
  
  //Cancel
  this.Cancel = $('<button>').appendTo(this.Div)
    .css({
      'position': 'relative',
      'top': '-20px',
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
      'left': '-65px',
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
    .click(function(){ self.ReplyFunc(); }); 
  
  
}
// saving means:
// replace the text field with regular text
// replace the save and cancel buttons with reply and edit buttons.
Note.prototype.SaveFunc = function() {
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
  Children.push(new Note(this));
}

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
      'font-size': '20px'})
    .hide()
    .attr('id', 'NoteEditor');
    
  var d2 = $('<div>').appendTo(d);
    
  var NewNote = $('<button>').appendTo(d)
    .css({
      'position': 'relative',
      'top': '5px',
      'float': 'left'
    }).text('New Note')
    .click(function(){ TOP_NOTES.push(new Note()); });
    
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




