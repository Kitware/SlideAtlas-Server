// Could be a subclass of navigationWidget or an option to
// navigationWidget.
// Will have a slider and a thumbnail (like common online video players).


(function () {
    "use strict";



    //------------------------------------------------------------------------------
    // I intend to have only one object
    function StackNavigationWidget(parent,display) {
        this.Display = display;

        // Load the session slides from the localStorage
        this.SlideIndex = 0;
        this.Session = [];

        var self = this;
        var size = '40px';
        var left = '210px';
        var bottom = '10px';
        if (SAM.detectMobile()) {
            // fake a tab
            this.Tab = {};
            this.Tab.Panel = $('<div>')
                .appendTo(display.GetViewer(0).GetDiv())
                .hide()
            //.addClass("sa-view-navigation-div ui-responsive");
                .addClass("ui-responsive")
                .css({'position': 'absolute',
                      'left': '50px',
                      'bottom': '20px',
                      'z-index': '5'});
            var panel = this.Tab.Panel;
            this.Tab.show = function () {panel.show();}
            this.Tab.hide = function () {
                panel.hide();
            }
            //SA.OnStartInteraction( function () { panel.hide();} );
        } else {
            this.Tab = new SA.Tab(parent,SA.ImagePathUrl+"nav.png", "navigationTab");
            this.Tab.Div.prop('title', "Navigation");
            this.Tab.Div.addClass("sa-view-navigation-div");
            this.Tab.Panel.addClass("sa-view-navigation-panel");

            // Put the stack display in the navigation button
            this.NoteDisplay = $('<div>')
                .appendTo(this.Tab.Div)
                .addClass("sa-view-note")
                .html("");
        }

        this.PreviousNoteButton =
            $('<img>').appendTo(this.Tab.Panel)
            .addClass("sa-view-navigation-button")
            .attr('src',SA.ImagePathUrl+"previousNote.png")
            .prop('title', "Previous Note. (p)")
            .click(function(){self.PreviousNote();});

        this.NextNoteButton =
            $('<img>').appendTo(this.Tab.Panel)
            .addClass("sa-view-navigation-button")
            .attr('src',SA.ImagePathUrl+"nextNote.png")
            .prop('title',"Next Note, (n, space)")
            .click(function(){self.NextNote();});

        // Frame slider
        //var conf_wrapper = $('<div>')
        //    .appendTo(layer_control)
        //    .css({ 'border': '1px solid #CCC', 'width': '100%', 'height':'50px'});
        this.Slider = $('<input type="range" min="0" max="100">')
            .appendTo(this.Tab.Panel)
            .on('input',
                function(){
                    self.SliderCallback();
                });

        // TODO: Fix the main css file for mobile.  Hack this until fixed.
        if (SAM.MOBILE_DEVICE) {
            size = '80px';
            if (SAM.MOBILE_DEVICE == "iPhone") {
                size = '100px';
            }
            this.PreviousNoteButton
                .css({'height': size,
                      'width' : size,
                      'opacity':'0.8'})
                .on('touchend', function(){self.PreviousNote();});
            this.NextNoteButton
                .css({'height': size,
                      'width' : size,
                      'opacity':'0.8'})
                .on('touchend', function(){self.NextNote();});
        }
    }


    // Making a stack navigator. Starting to abstract an interface.
    StackNavigationWidget.prototype.GetNote = function() {
        return this.Note;
    }


    StackNavigationWidget.prototype.SetInteractionEnabled = function(flag) {
        var self = this;
        if (flag) {
            this.Display.Parent.on(
                'keydown.navigation',
                function (event) {
                    return self.HandleKeyDown(event);
                });
        } else {
            this.Display.Parent.off('keydown.navigation');
        }
    }

    StackNavigationWidget.prototype.HandleKeyDown = function(event) {
        var keyCode = event.keyCode;
        // 34=page down, 78=n, 32=space
        if (keyCode == 78 || keyCode == 32) {
            this.NextNote();
            return false;
        }
        if (keyCode == 80) {
            this.PreviousNote();
            return false;
        }

        return true;
    }

    StackNavigationWidget.prototype.SetNote = function(note) {
        if (this.GetNote() == note) {
            return;
        }

        var self = this;
        // Initialize the session neede to get the next slide.
        if ( ! this.SessionId) {
            if (SA.Session) {
                this.Session = SA.Session.session.views;
                this.SessionId = SA.Session.sessid;
                this.Update();
            } else if (note.SessionId && SA.RootNote.Type != "HTML") {
                this.SessionId = note.SessionId;
                $.ajax({
                    type: "get",
                    url: SA.SessionUrl+"?json=true&sessid="+this.SessionId,
                    success: function(data,status) {
                        if (self.SessionId != data.sessid) {
                            // This will never happen.
                            console.log("expecting a second session to load.");
                            return;
                        }
                        self.Session = data.session.views;
                        self.Update();
                    },
                    error: function() {
                        SA.Debug("AJAX - error() : session" );
                    },
                });
            }
        } else {
            // Correct an error.  SessionId's are wrong because the
            // notes sessionId is not being updated when a session is
            // copied.
            note.SessionId = this.SessionId;
        }

        this.Note = note;
        this.Update();
    }

    StackNavigationWidget.prototype.ToggleVisibility = function() {
        this.SetVisibility( ! this.Visibility);
    }

    // Used on mobile.
    StackNavigationWidget.prototype.SetVisibility = function(v) {
        this.Visibility = v;
        if (v) {
            this.Tab.show();
        } else {
            this.Tab.hide();
        }
    }

    StackNavigationWidget.prototype.Update = function() {
        // Disable prev/next note buttons by default.
        this.PreviousNoteButton.removeClass("sa-active");
        this.NextNoteButton.removeClass("sa-active");
        var note = this.GetNote();
        if (note) {
            for (var i = 0; i < this.Session.length; ++i) {
                if (this.Session[i].id == note.Id) {
                    this.SlideIndex = i;
                }
            }

            if (note.Type == "Stack") {
                // Next note refers to ViewerRecords.
                if (note.StartIndex > 0) {
                    this.PreviousNoteButton.addClass("sa-active");
                }
                if (note.StartIndex < note.ViewerRecords.length - 1) {
                    this.NextNoteButton.addClass("sa-active");
                }
            }
        }
    }

    StackNavigationWidget.prototype.PreviousNote = function() {
        SA.StackCursorFlag = false;

        // Make sure user not changes are not pending to be saved.
        if (SA.notesWidget){ SA.notesWidget.Flush();}

        var current = this.GetNote();
        if (current.Type == "Stack") {
            if (current.StartIndex <= 0) { return;}

            // Move camera
            // Hardcoded for dual display
            var viewer1 = this.Display.GetViewer(1);
            var viewer0 = this.Display.GetViewer(0);
            var cam = viewer0.GetCamera();
            var fp = cam.FocalPoint.slice();
            var rot = cam.GetRotation();
            var height = cam.GetHeight();

            this.Display.RecordAnnotations();
            --current.StartIndex;

            // We need to skip setting the camera.
            SA.display = this.Display;
            SA.SetNote(current);
            SA.UpdateUserNotes();
            // Set the camera after the note has been applied.
            viewer1.SetCamera(fp, rot, height);

            current.DisplayStack(this.Display);
            this.Display.SynchronizeViews(1, current);
            // activate or deactivate buttons.
            this.Update();
            if (this.NoteDisplay) {
                this.NoteDisplay.html("" + current.StartIndex);
            }
            return;
        }
    }

    StackNavigationWidget.prototype.NextNote = function() {
        SA.StackCursorFlag = false;

        // Make sure user not changes are not pending to be saved.
        if (SA.notesWidget){ SA.notesWidget.Flush();}

        var current = this.GetNote();
        if (current.Type == "Stack") {
            if (current.StartIndex >= current.ViewerRecords.length - 1) {
                return;
            }
            // Move camera
            // Hard coded for dual display.
            var viewer0 = this.Display.GetViewer(0);
            var viewer1 = this.Display.GetViewer(1);
            var cam = viewer1.GetCamera();
            var fp = cam.FocalPoint.slice();
            var rot = cam.GetRotation();
            var height = cam.GetHeight();

            this.Display.RecordAnnotations();
            ++current.StartIndex;
            // We need to skip setting the camera.
            SA.display = this.Display;
            SA.SetNote(current);
            SA.UpdateUserNotes();
            // Set the camera after the note has been applied.
            viewer0.SetCamera(fp, rot, height);
            current.DisplayStack(this.Display);
            this.Display.SynchronizeViews(0, current);
            // activate or deactivate buttons.
            this.Update();
            if (this.NoteDisplay) {
                this.NoteDisplay.html("" + current.StartIndex);
            }
            return;
        }
    }


    SA.StackNavigationWidget = StackNavigationWidget;

})();
