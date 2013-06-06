// One note widget per window (even with two viewers).
// Notes are a tour of the slide.
// Notes canbe nested (tree structure) to allow for student questions, comments or discussion.
// Notes within the same level are ordered.

// For animating the display of the notes window.
var NOTES_FRACTION = 0.0;
var NOTES_VISIBILITY = false;

function InitNotesWidget() {

  $('<button>').appendTo('body').css({
      'opacity': '0.2',
      'position': 'absolute',
      'height': '30px',
      'width': '80px',
      'font-size': '18px',
      'top' : '5px',
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
    
  $('<textarea>').appendTo(d)
    .css({
      'position': 'absolute',
      'top': '40px',
      'height': '100px',
      'left' : '0px',
      'right' : '0px',
      'width': 'auto',
      'border': '1px solid #d3d3d3', 
      'resize': 'none'})
    .attr('id', 'NoteEditorText')
    .attr('wrap', 'logical');
    
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




