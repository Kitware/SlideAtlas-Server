//==============================================================================
// TODO:
// - !!!!!!!!!!!!!!!!!!!!!! Copy note needs to change ids in html !!!!!!!!!!!!!!!
// - control the size of the text.
// - Convert a session to a presentation.
// - Resize the view area to fit the note text.
// - Edit mode: resize views


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

    // Setup the view panel div to be the same as the two viewers.
    VIEW_PANEL.css({'left':   '0px',
                    'width':  width+'px',
                    'top':    '0px',
                    'height': height+'px'});

    // Now position the viewers in the view panel.
    var record;
    if ( ! PRESENTATION_NOTE) { return; }
    if (PRESENTATION_NOTE.ViewerRecords.length == 1) {
        record = PRESENTATION_NOTE.ViewerRecords[0];
        PresentationPlaceViewer(VIEWER1, record, [0,0,width,height]);
        // Poor way to hide a viewer.
        PresentationPlaceViewer(VIEWER2, record, [width,0,0,height]);
    }
    if (PRESENTATION_NOTE.ViewerRecords.length > 1) {
        var halfWidth = width / 2;
        record = PRESENTATION_NOTE.ViewerRecords[0];
        PresentationPlaceViewer(VIEWER1, record, [0,0,halfWidth,height]);
        record = PRESENTATION_NOTE.ViewerRecords[1];
        PresentationPlaceViewer(VIEWER2, record, [halfWidth,0,halfWidth,height]);
    }
}


// Adds a margin, and keeps the aspect ratio of view.
function PresentationPlaceViewer(viewer, record, viewport) {
    var vWidth = viewport[2] * 0.8;
    var vHeight = viewport[3] * 0.8;
    var cam = record.Camera;
    var scale = vHeight / cam.Height;
    var vWidth = scale * cam.Width;
    if (vWidth > viewport[2] * 0.8) {
        vWidth = viewport[2] * 0.8;
        scale = vWidth / cam.Width;
        vHeight = scale * cam.Height;
    }

    var vLeft = viewport[0] + (viewport[2]-vWidth) / 2;
    var vTop =  viewport[1] + (viewport[3]-vHeight) / 2;

    if (viewer) {
      viewer.SetViewport([vLeft, vTop, vWidth, vHeight]);
      eventuallyRender();
    }
}


//==============================================================================



// Main function called by the presentation.html template
function PresentationMain(viewId) {
    // We need to get the view so we know how to initialize the app.
    var rootNote = new Note();
    // Sanity check
    if (typeof(viewId) == "undefined" && viewId == "") { return; }

    rootNote.LoadViewId(viewId,
                        function () {PresentationMain2(rootNote);});
}

function PresentationMain2(rootNote) {
    if (rootNote.Type != "Presentation") {
        rootNote.Type = "Presentation";
        rootNote.Save();
    }
    MOBILE_DEVICE = "Simple";
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
            'z-index': '-1'
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

    PRESENTATION_LIST = new TextEditor(PRESENTATION_DIV, EDIT);
    PRESENTATION_LIST.TextEntry.css({'height':'150px'});

    // Add the viewers.
    var width = CANVAS.innerWidth();
    var height = CANVAS.innerHeight();
    var halfWidth = width/2;
    VIEWER1 = initView([0,0, width, height]);
    VIEWER1.ViewerIndex = 0;

    VIEWER2 = initView([width, 0, 0, height]);
    VIEWER2.ViewerIndex = 0;

    PRESENTATION_ROOT = rootNote;
    PresentationSetSlide(0);
    
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
    // Hack to keep the slides from changing when editing.
    if ( ! EVENT_MANAGER.HasFocus) {
        return true;
    }

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
    // Text
    PRESENTATION_LIST.LoadNote(note);
    // Views
    if (note.ViewerRecords.length > 0) {
        VIEWER1.Reset();
        note.ViewerRecords[0].Apply(VIEWER1);
        DUAL_VIEW = false;
    }
    if (note.ViewerRecords.length > 1) {
        VIEWER2.Reset();
        note.ViewerRecords[1].Apply(VIEWER2);
        // TODO: Get rid of this global variable.
        DUAL_VIEW = true;
    }
}
