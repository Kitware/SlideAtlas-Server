// Create and repond to the dual / single view toggle button.

// How the window is deived between viewer1 and viewer1.
// Default: viewer1 uses all available space.
var VIEWER1_FRACTION = 1.0;

  
function InitDualViewWidget() {
    // Todo: Make the button become more opaque when pressed.
    $('<img>').appendTo('body')
      .css({
        'opacity': '0.4',
        'position': 'absolute',
        'height': '20px',
        'width': '20x',
        'top' : '0px',
        'right' : '0%',
        'z-index': '1'})
    .attr('id', 'dualWidgetLeft')
    .attr('type','image')
    .attr('src',"webgl-viewer/static/dualArrowLeft2.png")
    .click(function(){ToggleDualView();});

    $('<img>').appendTo('body')
      .hide()
      .css({
        'opacity': '0.4',
        'position': 'absolute',
        'height': '20px',
        'width': '20px',
        'top' : '0px',
        'left' : '50%',
        'z-index': '1'})
    .attr('id', 'dualWidgetRight')
    .attr('type','image')
    .attr('src',"webgl-viewer/static/dualArrowRight2.png")
    .click(function(){ToggleDualView();});
    
    VIEWER1.AddGuiElement("#dualWidgetLeft", "Top", 0, "Right", 20);
    VIEWER1.AddGuiElement("#dualWidgetRight", "Top", 0, "Right", 0);    
}


// It would be nice to animate the transition
// It would be nice to integrate all animation in a flexible utility.
var DUAL_ANIMATION_LAST_TIME;
var DUAL_ANIMATION_DURATION;
var DUAL_ANIMATION_TARGET;

function ToggleDualView() {
  $('#viewEditMenu').hide();

  DUAL_VIEW = ! DUAL_VIEW;
  
  if (DUAL_VIEW) {
    DUAL_ANIMATION_CURRENT = 1.0;
    DUAL_ANIMATION_TARGET = 0.5;
    // Edit menu option to copy camera zoom between views.
    $('#dualViewCopyZoom').show();
    // Animation takes care of switching the buttons
  } else {
    DUAL_ANIMATION_CURRENT = 0.5;
    DUAL_ANIMATION_TARGET = 1.0;
    DualViewUpdateGui();
  }

  RecordState();

  DUAL_ANIMATION_LAST_TIME = new Date().getTime();
  DUAL_ANIMATION_DURATION = 1000.0;
  AnimateViewToggle();
}

function DualViewUpdateGui() {
    // Now swap the buttons.
    if (DUAL_VIEW) {
      $('#dualWidgetLeft').hide();
      $('#dualWidgetRight').show();
      VIEWER2.ShowGuiElements();
      // Edit menu option to copy camera zoom between views.
      $('#dualViewCopyZoom').show();
    } else {
      $('#dualWidgetRight').hide();
      $('#dualViewCopyZoom').hide();
      VIEWER2.HideGuiElements();
      $('#dualWidgetLeft').show();
      // Edit menu option to copy camera zoom between views.
    }
}



function AnimateViewToggle() {
  var timeStep = new Date().getTime() - DUAL_ANIMATION_LAST_TIME;
  if (timeStep > DUAL_ANIMATION_DURATION) {
    // end the animation.
    VIEWER1_FRACTION = DUAL_ANIMATION_TARGET;
    handleResize();    
    DualViewUpdateGui();
    return;
    }
  
  var k = timeStep / DUAL_ANIMATION_DURATION;
  
  // update
  DUAL_ANIMATION_DURATION *= (1.0-k);
  VIEWER1_FRACTION += (DUAL_ANIMATION_TARGET-VIEWER1_FRACTION) * k;

  handleResize();
  requestAnimFrame(AnimateViewToggle);
}





