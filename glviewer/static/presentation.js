//==============================================================================
// TODO:
// - Get dual view working.
// - Use the proper aspect ratio.
// - render the note text.
// - Resize the view area to fit the note text.
// - Edit mode.


//==============================================================================
// hack a presentation mode:
// presentation object?

//var PRESENTATION_DIV;
//var PRESENTATION_LIST;
//var PRESENTATION_TITLE;

// A note whose children are slides of a presentation.
var PRESENTATION_ROOT;
var PRESENTATION_INDEX;
var PRESENTATION_NOTE;


// Getting resize right was a major pain.
function presentationHandleResize() {
    var width = CANVAS.width();
    var height = CANVAS.height();

    if(height == 0){
      height = window.innerHeight;
    }

    // Presentation specific stuff
    height = height - PRESENTATION_DIV.height();

    var vHeight = height * 0.8;
    var vWidth = width * 0.8;
    if (PRESENTATION_NOTE) {
        var cam = PRESENTATION_NOTE.ViewerRecords[0].Camera;
        var scale = vHeight / cam.Height;
        var vWidth = scale * cam.Width;
        if (vWidth > width * 0.8) {
            vWidth = width * 0.8;
            scale = vWidth / cam.Width;
            vHeight = scale * cam.Height;
        }
    }

    var viewPanelLeft = (width-vWidth) / 2;
    var viewPanelTop = (height - vHeight) / 2;

    // Setup the view panel div to be the same as the two viewers.
    VIEW_PANEL.css({'left':   viewPanelLeft+'px',
                    'width':  vWidth+'px',
                    'top':    viewPanelTop+'px',
                    'height': vHeight+'px'});

    // TODO: Make a multi-view object.
    if (VIEWER1) {
      VIEWER1.SetViewport([0, 0, vWidth, vHeight]);
      eventuallyRender();
    }
}



//==============================================================================



// Main function called by the default view.html template
function StartPresentation() {
    MOBILE_DEVICE = "Simple";
    EDIT = false;
    $(body).css({'overflow-x':'hidden'});

    // Hack.  It is only used for events.
    // TODO: Fix events and get rid of this.
    CANVAS = $('<div>')
        .appendTo('body').css({
            'position': 'absolute',
            'width': '100%',
            'height': '100%',
            'top' : '0px',
            'left' : '0px',
            'z-index': '1'
        });

    VIEW_PANEL = $('<div>')
        .appendTo('body')
        .css({
            'position': 'absolute',
            'width': '100%',
            'height': '100%',
            'top' : '0px',
            'left' : '0px',
            'z-index': '3'
        });

    // This is necessary for some reason.
    EVENT_MANAGER = new EventManager(CANVAS);

    //PRESENTATION = true;
    PRESENTATION_DIV = $('<div>')
        .appendTo('body')
        .css({
            'bottom':'0em',
            'position':'fixed',
            'left':'0em',
            'right':'0em',
            'width': 'auto',
            'background-color': '#DFF'});

    PRESENTATION_TITLE = $('<h1>')
        .appendTo(PRESENTATION_DIV)
        .text("Slide: 1")
        .css({
            'top': '.3em',
            'bottom': '0px',
            'padding-top': '1em',
            'padding-bottom': '0em',
            'padding-left': '3.3em',
            'min-height': '2.3em',
            'color': 'white',
            'font-size': '160%',
            'line-height': '1.1em',
            'background': '#444',
            'font-family': 'Arial'});

    PRESENTATION_LIST = $('<ol>')
        .css({
            'font-size': '150%',
            'background-color': '#DDD',
            'font-family': 'Arial'})
        .appendTo(PRESENTATION_DIV);
    var item;
    item = $('<li>')
        .appendTo(PRESENTATION_LIST)
        .text("Water");
    item = $('<li>')
        .appendTo(PRESENTATION_LIST)
        .text("Juice");
    item = $('<li>')
        .appendTo(PRESENTATION_LIST)
        .text("Wine");


    var width = CANVAS.innerWidth();
    var height = CANVAS.innerHeight();
    var halfWidth = width/2;
    VIEWER1 = initView([0,0, width, height]);
    VIEWER1.ViewerIndex = 0;

    PRESENTATION_ROOT = new Note();
    PRESENTATION_ROOT.LoadViewId(VIEW_ID,
                                 function () {
                                     PresentationSetSlide(0);
                                 });

    $(window).resize(function() {
        presentationHandleResize();
    }).trigger('resize');

    // Keep the browser from showing the left click menu.
    document.oncontextmenu = cancelContextMenu;

    // The event manager still handles stack alignment.
    // This should be moved to a stack helper class.
    // Undo and redo too.
    document.onkeydown = PresentationHandleKeyDown;
    document.onkeyup = PresentationHandleKeyUp;


    eventuallyRender();
}


function PresentationHandleKeyDown(event) {

}
function PresentationHandleKeyUp(event) {
    if (event.keyCode == "32" || // space
        event.keyCode == "34" || // page down
        event.keyCode == "78" || // n
        event.keyCode == "39" || // right arrow
        event.keyCode == "40" || // down arrow
        event.keyCode == "13") { // enter
        PresentationSetSlide(PRESENTATION_INDEX + 1);
    }
    if (event.keyCode == "80" || // p
        event.keyCode == "37" || // back arrow
        event.keyCode == "38" || // up arrow
        event.keyCode == "33") { // page up
        PresentationSetSlide(PRESENTATION_INDEX - 1);
    }
    if (event.keyCode == "36") { // home
        PresentationSetSlide(0);
    }
    if (event.keyCode == "35") { // end
        PresentationSetSlide(PRESENTATION_ROOT.Children.length - 1);
    }

}

function PresentationSetSlide(index){
    if (index < 0 || index >= PRESENTATION_ROOT.Children.length) {
        return;
    }
    PRESENTATION_INDEX = index;
    PRESENTATION_TITLE.text("Slide: " + (index+1))
    var note = PRESENTATION_ROOT.Children[index];
    PRESENTATION_NOTE = note;
    VIEWER1.Reset();
    if (note.ViewerRecords.length > 0) {
        note.ViewerRecords[0].Apply(VIEWER1);
    }
}
