// I have a couple thoughts:
// - Hangout / viewer
// Show a list of peoples viewers on bottom.
// User can click on one to slave their viewer to the other person.
// Consistent with screen share in Google hangout.
// Similar to Steve's idea: one viewer is yours, the other is the slave.

// - Google docs model
// Everyone sees the same viewer.
// Cursors show as different colors.
// App decides who is controlling the viewer (one at a time).
// Save a list of favorites, or session so views can be switched quickly.
// Person controlliung can undo, go back in history if someone changed.


// - Combination
// Google docs.  Everyone has there own viewer, but see annotation and cursor of others.
// You can slave your window to another person to also synchronize your camera / cache.
// The workspace is a session.  Anyone can add views like bookmarks and switch
// views easily.
// Have a chat window like google docs.


function ConferenceWidget () {
    var self = this; // trick to set methods in callbacks.
    
    if ( ! MOBILE_DEVICE) {
        this.Tab = new Tab("/webgl-viewer/static/conference1.png", "conferenceTab");
        new ToolTip(this.Tab.Div, "Conference");
        this.Tab.Div
            .css({'left': '250px',
                  'bottom': '0px'});
        // Needs to be a child of view panel to fill 100%.
        this.Tab.Panel
            .appendTo(VIEW_PANEL)
            .css({'width': 'auto',
                  'left': '2px',
                  'right': '62px',
                  'height': '110px'});
        //this.View = new View();



    }
}

ConferenceWidget.prototype.TogglePanel = function() {
    this.Panel.toggle();
    if (this.Panel.is(":visible")) {
        this.TabButton.css({'border-color': '#FFF #BBB #BBB #BBB',
                            'border-radius': '0px 0px 5px 5px',
                            'opacity': '1'});
    } else {
        // Should we deactivate any active widget tool?
        this.TabButton.css({'border-color': '#BBB',
                            'border-radius': '5px',
                            'opacity': '0.6'});
    }
}








