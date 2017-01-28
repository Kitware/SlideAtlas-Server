// CME
// TODO:


// Bugs:
// Get short answer questions working.

// Question resizable only after reload.
// Images have a minimum size.

// My feature requests from creating poster:
// Snap to objects.
// Text background options like rectange (gradient)
//   option to enter css text, or select color gui
// Group objects.
// Copy and paste object or group.
// Select objects.
// Move selected objects with arrow.
// Undo edits
// padding option in text dialog (conversion for px to %?)


// Feature Requests
// Text should selectively resize.
//    This is hard.  I cannot change a selection into a dom that can be manipulated.
// Full window should have overview window and dual view option.
// True false / short answer question.
// Mobile users: first view in session is off the edge.


// Snap 
//    to objects.
//    some indication of snap.
//    look at google.
// Slide menu/edit buttons
// Stack and subnotes.
// Improve session browser:
//   Close sessions.
//   Open notes with children.
//   Show multiple viewer records.
//   Choose Images and Notes
//   Merge search with browser.


//   Allow for relative font sizes in a saScalableFontDiv.
// Add GUI to add slides and slide items.
// Background of thumbs should be white.
// Embed option of viewer.


(function () {
    "use strict";


// TODO:

//==============================================================================
// TODO:
// - Resize the view area to fit the note text.
// - Edit mode: resize views
// - Allow views to go full screen.
// - Sortable slides in slide div.
// - Stop the timer when we leave full screen. Turn editing back on if EDIT.



//==============================================================================
function Presentation(rootNote, edit) {
    var self = this;
    this.RootNote = rootNote;
    this.Edit = edit;
    // We need this to know what to return to when a view goes full screen.
    this.FullScreen = false;

    // Setup default global properties.
    if ( typeof(rootNote.TypeData) == "undefined") {
        rootNote.TypeData = {};
    }
    if (! rootNote.TypeData.Background) {
        rootNote.TypeData.Background = '#EEEEEE';
    }
    if (! rootNote.TypeData.AspectRatio) {
        rootNote.TypeData.AspectRatio = 1.3333;
    }

    // Eliminate the GUI in the viewers.
    $(body).css({'overflow-x':'hidden'});

    this.WindowDiv = $('<div>')
        .appendTo('body')
        .css({
            'position':'fixed',
            'left':'0px',
            'width': '100%'})
        .saFullHeight();

    // Hack so all viewers will shar the same browser.
    // We should really use the brower tab in the left panel.
    SA.VIEW_BROWSER = new SA.ViewBrowser(this.WindowDiv);

    this.ResizePanel = new SA.ResizePanel(this.WindowDiv);

    //this.PresentationDiv = $('<div>')
    //    .appendTo(this.WindowDiv)
    //    .css({'position':'absolute',
    //          'top':'0px',
    //          'left':'0px',
    //          'width':'100%',
    //          'height':'100%'});
    this.PresentationDiv = this.ResizePanel.MainDiv;

    // Wow, really?  Timing caused the swipe bug?
    this.WindowDiv.on(
        'swipeleft',
        function (e) { 
            if ( self.ResizePanel.Visibility &&
                 e.swipestop.coords[0] < self.ResizePanel.Width) {
                self.ResizePanel.SetVisibility(false);
                return false;
            }
            self.GotoSlide(self.Index+1);
        });
    this.WindowDiv.on(
        'swiperight',
        function (e) { 
            if ( ! self.ResizePanel.Visibility &&
                 e.swipestart.coords[0] < 10) {
                self.ResizePanel.Show();
                return false;
            }
            self.GotoSlide(self.Index-1);
        });

    // A window with a constant aspect ratio that fits in
    // the PresentationDiv.
    this.AspectDiv = $('<div>')
        .css({'border' :'1px solid #AAA'})
        .appendTo(this.PresentationDiv)
        .saPresentation({aspectRatio : this.RootNote.TypeData.AspectRatio});

    this.LeftPanel = this.ResizePanel.PanelDiv;
    this.InitializeLeftPanel(this.LeftPanel);
    // Left panel is closed by default on mobile devices.
    if (SAM.detectMobile()) {
        this.ResizePanel.Hide();
    }

    // Float the two slide show buttons in the upper right corner.
    this.ShowButton = $('<img>')
        .appendTo(this.PresentationDiv)
        .prop('title', "present")
        .addClass('editButton')
        .attr('src',SA.ImagePathUrl+'slide_show.png')
        .css({'position':'absolute',
              'top':'2px',
              'right':'20px',
              'width':'20px',
              'z-index':'5'})
        .click(function () {
            self.StartFullScreen();
        });
    this.TimerButton = $('<img>')
        .appendTo(this.PresentationDiv)
        .prop('title', "present timed")
        .addClass('editButton')
        .attr('src',SA.ImagePathUrl+'timer.png')
        .css({'position':'absolute',
              'top':'2px',
              'right':'46px',
              'width':'20px',
              'z-index':'5'})
        .click(function () {
            self.StartTimerShow();
        });


    // TODO: Fix this.  At least hide the button for the title page,
    // or get rid of the title page.
    if (edit) {
        // Temporary way to delete a this.
        this.DeleteSlideButton = $('<img>')
            .appendTo(this.AspectDiv)
            .attr('src',SA.ImagePathUrl+"remove.png")
            .prop('title', "delete slide")
            .addClass('editButton')
            .css({'position':'absolute',
                  'width':'12px',
                  'height':'12px',
                  'left':'0px',
                  'top':'0px',
                  'z-index':'5'})
            .click(function () {
                // Hack to reload viewer records.
                self.DeleteCurentSlide();
            });
    }

    this.TitlePage = new TitlePage(this.AspectDiv, edit);
    this.SlidePage = new SlidePage(this.AspectDiv, edit);
    this.HtmlPage  = new HtmlPage(this.AspectDiv, edit,
                                  rootNote.TypeData.Background);

    this.GotoSlide(0);

    // Keep the browser from showing the left click menu.
    document.oncontextmenu = SA.cancelContextMenu;

    $('body').on(
        'keydown',
        function(e) {
            return self.HandleKeyDown(e);
        });

    this.UpdateSlidesTab();
}


Presentation.prototype.StartTimerShow = function () {
    var self = this;
    // hack to turn off key events.

    SA.ContentEditableHasFocus = true;
    var dialog = $('<div>')
        .dialog({
            modal: false,
            resizable:false,
            position: {
                my: "left top",
                at: "left top",
                of: window
            },
            beforeClose: function() {
                SA.ContentEditableHasFocus = false;
            },
            buttons: {
                "Start": function () {
                    self.StartFullScreen();
                    // Change seconds to milliseconds
                    var duration = parseInt(self.DurationInput.val())*1000;
                    // Also linger on the current slide.
                    setTimeout(function(){ self.TimerCallback(duration);}, duration);
                    // Should we just close and resuse the dialog?
                    $(this).dialog("destroy");
                }
            }
        });
    this.DurationLabel = $('<label>')
        .appendTo(dialog)
        .text("Seconds:");
    this.DurationInput = $('<input type="number" min="1" step="1">')
        .appendTo(dialog)
        .val(30)
        .css({'width':'4em'});
}


Presentation.prototype.StartFullScreen = function () {
    var elem = document.body;

    this.ResizePanel.Hide();
    this.EditOff();
    $(window).trigger('resize');
    this.ShowButton.hide();
    this.TimerButton.hide();

    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }

    this.FullScreen = true;

    // detect when we leave full screen.
    var self = this;
    $(elem).bind(
        'webkitfullscreenchange mozfullscreenchange fullscreenchange',
        function(e) {
            var state = document.fullScreen || document.mozFullScreen ||
                document.webkitIsFullScreen;
            //var event = state ? 'FullScreenOn' : 'FullScreenOff';
            
            self.FullScreen = state;
            if ( ! self.FullScreen) {
                self.ResizePanel.Show();
                self.EditOn();
                self.ShowButton.show();
                self.TimerButton.show();
                // TODO: Stop the timer when we leave full screen.
            }
        });
}


Presentation.prototype.EditOff = function () {
    if (SA.Edit && this.Edit) {
        this.Edit = false;

        this.SaveButton.hide();
        this.InsertMenuButton.hide();
        this.DeleteSlideButton.hide();
        // QuizMenu / label?
        this.EditTabs.DisableTabDiv(this.BrowserDiv);
        this.EditTabs.DisableTabDiv(this.SearchDiv);
        this.EditTabs.DisableTabDiv(this.ClipboardDiv);

        this.TitlePage.EditOff();
        this.SlidePage.EditOff();
        this.HtmlPage.EditOff();
    }
}


Presentation.prototype.EditOn = function () {
    if (this.FullScreen) { return; }
    if (SA.Edit && ! this.Edit) {
        this.Edit = true;

        this.SaveButton.show();
        this.InsertMenuButton.show();
        this.DeleteSlideButton.show();
        this.EditTabs.EnableTabDiv(this.BrowserDiv);
        this.EditTabs.EnableTabDiv(this.SearchDiv);
        this.EditTabs.EnableTabDiv(this.ClipboardDiv);

        this.TitlePage.EditOn();
        this.SlidePage.EditOn();
        this.HtmlPage.EditOn();
        this.DeleteSlideButton.show();
    }
}


Presentation.prototype.InitializeLeftPanel = function (parent) {
    this.EditTabs = new SA.TabbedDiv(parent);
    this.EditTabs.Div.css({'width':'100%',
                          'height':'100%'})

    this.SlidesDiv = this.EditTabs.NewTabDiv("Slides");
    this.SlidesDiv
        .css({'text-align': 'left',
              'color': '#303030',
              'font-size': '18px'});
    // The div that will hold the list of slides.
    this.SlideList = $('<div>')
        .appendTo(this.SlidesDiv)
        .css({'position':'absolute',
              'width':'100%',
              'top':'32px',
              'bottom':'3px',
              'overflow-y':'auto'});

    if (SA.Edit) {
        this.BrowserDiv = this.EditTabs.NewTabDiv("Browse");
        this.SearchDiv = this.EditTabs.NewTabDiv("Search");
        this.ClipboardDiv = this.EditTabs.NewTabDiv("Clipboard");
        var self = this;

        this.SaveButton = $('<img>')
            .appendTo(this.SlidesDiv)
            .prop('title', "save")
            .addClass('editButton')
            .attr('src',SA.ImagePathUrl+'save22.png')
            .css({'float':'right'})
            .click(function () { self.Save();});
        this.InsertMenuButton = $('<div>')
            .appendTo(this.SlidesDiv)
            .addClass('editButton')
            .css({'float':'right',
                  'position':'relative'})
            .saMenuButton( {
                'New Slide'       : function () {
                    self.InsertNewSlide("HTML");},
                'Copy Slide'      : function () {self.InsertSlideCopy();},
                'Insert Text'     : function () {
                    self.HtmlPage.InsertTextBox()
                        .css({'height':'25%'});},
                'Insert Question' : function () {self.HtmlPage.InsertQuestion();},
                'Insert Rectangle': function () {
                    self.HtmlPage.InsertRectangle('#073E87','0%','60%','97.5%','14%');},
                'Insert Image'    : function () {self.InsertImage();},
                'Insert MP4'      : function () {self.InsertVideo();},
                'Embed Youtube'   : function () {self.InsertYoutube();}
            });

        $('<img>')
            .appendTo(this.InsertMenuButton)
            .attr('src',SA.ImagePathUrl+'new_window.png');


        this.QuizMenu = $('<select name="quiz" id="quiz">')
            .appendTo(this.SlidesDiv)
            .css({'float':'right',
                  'margin':'3px'})
            .change(function () {
                if (this.value == "review") {
                    self.RootNote.Mode = "answer-show";
                } else if (this.value == "hidden") {
                    self.RootNote.Mode = "answer-hide";
                } else if (this.value == "interactive") {
                    self.RootNote.Mode = "answer-interactive";
                }
                self.UpdateQuestionMode();
            });
        $('<option>')
            .appendTo(this.QuizMenu)
            .text('review');
        $('<option>')
            .appendTo(this.QuizMenu)
            .text('hidden');
        $('<option>')
            .appendTo(this.QuizMenu)
            .text('interactive');
        this.QuizLabel = $('<div>')
            .appendTo(this.SlidesDiv)
            .css({'float':'right',
                  'font-size':'small',
                  'margin-top':'4px'})
            .text("quiz");
        // Set the question mode
        if (this.RootNote.Mode == 'answer-hide') {
            this.QuizMenu.val("hidden");
        } else if (this.RootNote.Mode == 'answer-interactive') {
            this.QuizMenu.val("interactive");
        } else {
            this.RootNote.Mode = 'answer-show';
            this.QuizMenu.val("review");
        }


        this.BrowserPanel = new SA.BrowserPanel(
            this.BrowserDiv,
            function (viewObj) {
                self.AddViewCallback(viewObj);
            });
        this.BrowserDiv.css({'overflow-y':'auto'});

        this.SearchPanel = new SA.SearchPanel(
            this.SearchDiv,
            function (imageObj) {
                self.AddImageCallback(imageObj);
            });
        this.ClipboardPanel = new SA.ClipboardPanel(
            this.ClipboardDiv,
            function (viewObj) {
                self.AddViewCallback(viewObj);
            });

    }

    this.UserTextDiv = this.EditTabs.NewTabDiv("Notes", "private notes");
    // Private notes.
    this.UserNoteEditor = new UserNoteEditor(this.UserTextDiv);

    this.EditTabs.ShowTabDiv(this.SlidesDiv);
}



//==============================================================================
// What should i do if the user starts editing before the note loads?
// Editor will not be active until it has a note.
function UserNoteEditor(parent) {
    this.Modified = false;
    this.UpdateTimer = null;
    this.ParentNote = null;
    //this.UserNote = null;
    this.TextEditor = $('<div>')
        .appendTo(parent)
        .css({'display':'inline-block',
              'position':'absolute',
              'overflow-y': 'auto',
              'padding'   : '5px',
              'fontFamily': "Verdana,sans-serif",
              'left' : '2px',
              'right' : '2px',
              'top'  : '20px',
              'bottom':'2px'});

    var self = this;
    this.TextEditor.attr('contenteditable', 'false')
        .bind('input', function () {
            self.Modified = true;
            // Leave events are not triggering.
            self.EventuallyUpdate();
        })
        .focusin(function() {
            SA.ContentEditableHasFocus = true;
        })
        .focusout(function() {
            SA.ContentEditableHasFocus = false;
            self.UpdateNote();
        })
        // Mouse leave events are not triggering.
        .mouseleave(function() { // back button does not cause loss of focus.
            self.UpdateNote();
        });

    this.TextEditor.change( function () { self.UpdateNote(); });
}

UserNoteEditor.prototype.EventuallyUpdate = function() {
    if (this.UpdateTimer) {
        clearTimeout(this.UpdateTimer);
        this.UpdateTimer = null;
    }
    var self = this;
    this.UpdateTimer = setTimeout(function () { self.UpdateNote() }, 5000);
}


UserNoteEditor.prototype.UpdateNote = function () {
    if (this.ParentNote && this.ParentNote.UserNote) {
        var userNote = this.ParentNote.UserNote;
        userNote.Text = this.TextEditor.html();
        // Do not save the user not until the parent has been saved.
        if (this.ParentNote.Id && this.Modified) {
            var self = this;
            userNote.Save(function() { self.Modified = false;});
        }
    }
}


// The parent not is set.  A user not is retrieved or created, and the
// editor is attached to the user note.
// TODO: Get rid of the local iVar UserNote.
// TODO: Make sure this works with temp note ids.
UserNoteEditor.prototype.SetNote = function (parentNote) {
    if (this.ParentNote == parentNote) { return; }

    // Save the previous note incase the user is in mid edit
    // TODO: Do not save it has not been modified.
    this.UpdateNote();
    // clear the editor and make not editable until we have another user note.
    this.ParentNote = null;
    //this.UserNote = null;
    this.TextEditor.html("");
    this.TextEditor
        .attr('contenteditable', 'false')
        .css('border','');

    // Null note means save previous and clear editor and make it no longer editable.
    if ( ! parentNote) {
        return;
    }

    this.ParentNote = parentNote;

    if (parentNote.UserNote) {
        //this.UserNote = parentNote.UserNote;
        this.TextEditor
            .html(parentNote.UserNote.Text)
            .attr('contenteditable', 'true')
            .css({'border':'2px inset #DDD'});
        return;
    }

    if ( ! parentNote.Id) {
        // If the parent does not have an id, it must be new and will not
        // have a user note.  Make a new one (do not try to load user note).
        // A new note.  I do not want to save empty user notes for every
        // note.  The check will be in the save method.
        parentNote.SetUserNote(new SA.Note());
        this.TextEditor
            .attr('contenteditable', 'true')
            .css({'border':'2px inset #DDD'});
        return;
    }

    // NOTE: This is probably not necessary because the server embeds user
    // notes when the parent is sent to the client.
    var self = this;
    $.ajax({
        type: "get",
        url: "/webgl-viewer/getusernotes",
        data: {"parentid": parentNote.Id},
        success: function(data,status) { self.LoadUserNote(data, parentNote.Id);},
        error: function() { SA.Debug( "AJAX - error() : getusernotes" ); },
    });
}

UserNoteEditor.prototype.LoadUserNote = function(data, parentNoteId) {
    if ( ! this.ParentNote || this.ParentNote.Id != parentNoteId) {
        // Many things could happen while waiting for the note to load.
        return;
    }

    var parentNote = this.ParentNote;
    parentNote.SetUserNote(new SA.Note());

    if (data.Notes && data.Notes.length > 0) {
        if (data.Notes.length > 1) {
            SA.Debug("Warning: Only showing the first user note.");
        }
        var noteData = data.Notes[0];
        parentNote.UserNote.Load(noteData);
    }

    // Must display the text.
    this.TextEditor.html(parentNote.UserNote.Text);
    this.TextEditor.attr('contenteditable', 'true')
        .css({'border':'2px inset #DDD'});
}


//==============================================================================

Presentation.prototype.UpdateQuestionMode = function() {

    if ( ! this.RootNote) { return;}
    $('.sa-question').saQuestion('SetMode', this.RootNote.Mode);

    // Do not hide the Title page title
    if (this.RootNote.Mode == 'answer-hide' && this.Index != 0) {
        // Experiment with hiding titles too.
        var title = $('.sa-presentation-title');
        var standin = title.clone();
        title.hide();
        standin
            .appendTo(title.parent())
            .html("#" + this.Index)
            .addClass('sa-standin')
            .attr('contenteditable', 'false')
            .saScalableFont();
    } else {
        // Experiment with hiding titles too.
        $('.sa-standin').remove();
        $('.sa-presentation-title').show();
    }
    this.UpdateSlidesTab();
}


Presentation.prototype.TimerCallback = function(duration) {
    if (this.Index == this.GetNumberOfSlides() - 1) {
        // Stop but stay in full screen mode.
        this.GotoSlide(0);
        SA.ContentEditableHasFocus = false;
        return;
    }   

    this.GotoSlide(this.Index+1);

    // Hack to get rid of anwers.
    // Select everything in the editor.
    var editor = this.SlidePage.List.TextEntry[0];
    $(editor).attr('contenteditable', 'true');
    var sel = window.getSelection();
    range = document.createRange();
    range.selectNodeContents(editor);
    sel.removeAllRanges();
    sel.addRange(range);
    // remove bold formating
    document.execCommand('bold',false,null);
    document.execCommand('bold',false,null);
    // Hide annotations
    // legacy
    if (this.SlidePage.AnnotationWidget1) {
        this.SlidePage.AnnotationWidget1.SetVisibility(false);
    }
    if (this.SlidePage.AnnotationWidget2) {
        this.SlidePage.AnnotationWidget2.SetVisibility(false);
    }
    // remove the selection
    range.collapse(false);
    // The collapse has no effect without this.
    sel.removeAllRanges();
    sel.addRange(range);
    $(editor).attr('contenteditable', 'false');

    // Wait before advancing.
    var self = this;
    setTimeout(function(){ self.TimerCallback(duration);}, duration);
}

// Adds a view to the current slide.
Presentation.prototype.AddViewCallback = function(viewObj) {
    if (viewObj.Type == "HTML") {
        // What will happen if you insert a whole presentation (root)?
        // Insert a new slide
        var idx = this.Index+1;
        var note = new SA.Note();
        note.Load(viewObj);
        // Record changes in the note before the copy.
        this.HtmlPage.UpdateEdits();

        this.RootNote.Children.splice(idx-1,0,note);
        this.GotoSlide(idx);
        this.UpdateSlidesTab();
        return;
    }

    if (this.Note.Type == "HTML") {
        // TODO: Change this to pass a viewer record of the view.
        //       Maybe show all the records as options.
        this.HtmlPage.InsertView(viewObj);
        return;
    }

    var record = new SA.ViewerRecord();
    record.Load(viewObj.ViewerRecords[0]);
    this.Note.ViewerRecords.push(record);

    this.SlidePage.DisplayNote(this.Note, SA.presentation.Index);
}

// Callback from search.
Presentation.prototype.AddImageCallback = function(image) {
    var record = new SA.ViewerRecord();
    record.OverviewBounds = image.bounds;
    record.Image = image;
    record.Camera = {FocalPoint:[(image.bounds[0]+image.bounds[1])/2,
                                 (image.bounds[2]+image.bounds[3])/2, 0],
                     Roll: 0,
                     Height: (image.bounds[3]-image.bounds[2]),
                     Width : (image.bounds[1]-image.bounds[0])};

    if (this.Note.Type == "HTML") {
        // This will be the primar path in the future.
        this.HtmlPage.InsertViewerRecord(record);
        return;
    }
    if (this.Note != this.RootNote) {
        var note = new SA.Note();
        note.ViewerRecords[0] = record;
        this.SlidePage.InsertViewNote(note);
        return;
    }

    // The root needs a record to show up in the session.
    // never executed because I add a presentation icon
    // NOTE: This might be a problem with the new html title page.
    //       Viewers inthe title pages are stored as records.
    if (this.RootNote.ViewerRecords.length == 0) {
        this.RootNote.ViewerRecords.push(record);
    } 
}


Presentation.prototype.HandleKeyDown = function(event) {
    // Hack to keep the slides from changing when editing.
    if ( SA.ContentEditableHasFocus) {
        return true;
    }

    // I cannot get the browser to paste into a new div
    // First, paste is executed before this callback.
    // Second, the execCommand paste does not appear to work.
    //if (event.keyCode == "86" && ! event.ctrlKey) { // check for control v paste
    //    if (this.Note.Type == "HTML") {
    //        this.HtmlPage.Paste();
    //   }
    //}

    if (event.keyCode == "32" || // space
        event.keyCode == "34" || // page down
        event.keyCode == "78" || // n
        event.keyCode == "39" || // right arrow
        event.keyCode == "40" || // down arrow
        event.keyCode == "13") { // enter
        this.GotoSlide(this.Index + 1);
        return false;
    }
    if (event.keyCode == "80" || // p
        event.keyCode == "37" || // back arrow
        event.keyCode == "38" || // up arrow
        event.keyCode == "33") { // page up
        this.GotoSlide(this.Index - 1);
        return false;
    }
    if (event.keyCode == "36") { // home
        this.GotoSetSlide(0);
        return false;
    }
    if (event.keyCode == "35") { // end
        this.GotoSlide(this.GetNumberOfSlides() - 1);
        return false;
    }
}


Presentation.prototype.Save = function () {
    // Get rid of interactive question formating.
    this.HtmlPage.Div.find('.sa-answer')
        .css({'color':'#000'});

    var self = this;
    this.TitlePage.UpdateEdits();
    this.SlidePage.UpdateEdits();
    this.HtmlPage.UpdateEdits();

    // NOTE: light boxes are saved as viewerRecords. (but not always?)
    // Insert viewer record versus note?
    // Save the user notes.  They are not saved with the parent notes like
    // the children are.
    for (var i = 0; i < SA.Notes.length; ++i) {
        var note = SA.Notes[i];
        if ( note.Type == "UserNote" ) {
            if (note.LoadState || note.Text != "") {
                note.Save();
            }
        }
    }

    // TODO:
    // Fix this. Session page needs every member view to have an image.
    // The root needs a record to show up in the session.
    var rootNote = this.RootNote;
    if (rootNote.ViewerRecords.length < 1) {
        var record = new SA.ViewerRecord();
        record.Load(
            {AnnotationVisibility: 2,
             Annotations: [],
             Camera: {FocalPoint: [510, 519],
                      Height: 1009,
                      Roll: 0,
                      Width: 1066},
             Database: "507f34a902e31010bcdb1366",
             Image: {TileSize: 256,
                     _id: "55b4e5c03ed65909a84cd938",
                     bounds: [0, 1020, 15, 1024],
                     components: 3,
                     database: "507f34a902e31010bcdb1366",
                     dimensions: [1020, 1009],
                     filename: "projection-screen.jpg",
                     label: "projection-screen.jpg",
                     levels: 3,
                     origin: [0, 0, 0],
                     spacing: [1, 1, 1],
                     NumberOfLevels: 3,
                     OverviewBounds: [0, 1020, 15, 1024]}
            });
        rootNote.ViewerRecords.push(record);
    }

    //this.SaveButton.css({'color':'#F00'});
    // And finally, we can save the presentation.
    this.RootNote.Save();

    // Check to see if the root is in the session. If not, add it.
    var noteInSession = false;
    var session = SA.Session.session.views;
    for (var i = 0; i < session.length && ! noteInSession; ++i) {
        if (session[i].id == this.RootNote.Id) {
            noteInSession = true;
        }
    }
    if ( ! noteInSession) {
        // Should we bother making a dummy view?
        // move-view is now smart enough to avoid adding twice.
        session.splice(0,0, {id:this.RootNote.Id});
        // if this is the first time we are saving the root note, then
        // add it to the session.
        $.ajax({
            type: "post",
            data: {"to" : SA.SessionId,
                   "view" : this.RootNote.Id},
            url: "webgl-viewer/move-view",
            success: function(data,status){
                if (status != "Success") {
                    SA.Debug(data);
                }
            },
            error: function() {
                SA.Debug( "AJAX - error() : session-add-view" );
            },
        });
    }
}


Presentation.prototype.DeleteSlide = function (index){
    var maxIdx = this.GetNumberOfSlides() - 1;
    if (index < 1 || index > maxIdx) {
        return;
    }
    this.RootNote.Children.splice(index-1,1);
    // The case when we are not deleting the current slide.
    // All slides after the one deleted cahnge their index.
    if (this.Index > index) { this.Index -= 1; }

    // Case where we are deleting the current slide.
    if (index == this.Index) {
        // index becomes the sldie we are going to.
        // Handles the case where we are on the last slide.
        // Move to the previous rather then the next.
        if (index == maxIdx) { --index; }
        // force GotoSlide to
        this.Index = -1;
        this.GotoSlide(index);
    }

    this.UpdateSlidesTab();
}


Presentation.prototype.DeleteCurentSlide = function () {
    this.DeleteSlide(this.Index);
}

Presentation.prototype.InsertNewSlide = function (type){
    var idx = this.Index+1;
    var note = new SA.Note();
    if (type) { note.Type = type; }
    this.RootNote.Children.splice(idx-1,0,note);
    note.Parent = this.RootNote;
    this.GotoSlide(idx);
    this.UpdateSlidesTab();
    if (type == 'HTML') {
        this.HtmlPage.InitializeSlidePage();
    }
    this.UpdateQuestionMode();
}

Presentation.prototype.InsertSlideCopy = function (type){
    var idx = this.Index+1;
    var note = new SA.Note();

    // Record changes in the note before the copy.
    this.HtmlPage.UpdateEdits();
    // Deep copy of note with children.
    note.DeepCopy(this.Note);

    this.RootNote.Children.splice(idx-1,0,note);
    this.GotoSlide(idx);
    this.UpdateSlidesTab();
}

Presentation.prototype.InsertImage = function () {
    var src = prompt("Image URL", "https://slide-atlas.org/static/img/SlideAtlas_home.jpg");
    this.HtmlPage.InsertImage(src);
}

Presentation.prototype.InsertVideo = function () {
    var src = prompt("Video URL", "https://slide-atlas.org/api/v2/sessions/53ac02d5a7a14110d929adcc/attachments/55fef0e6a7a14162dfb4da32");
    this.HtmlPage.InsertVideo(src);
}

Presentation.prototype.InsertYoutube = function () {
    var src = prompt("Video IFrame URL", '<iframe width="420" height="315" src="https://www.youtube.com/embed/9tCafgGZtxQ" frameborder="0" allowfullscreen></iframe>');
    this.HtmlPage.InsertIFrame(src);
}

// 0->Root/titlePage
// Childre/slides start at index 1
Presentation.prototype.GotoSlide = function (index){
    if (index < 0 || index >= this.GetNumberOfSlides() || index == this.Index) {
        return;
    }

    // Clear previous slides settings.
    this.TitlePage.ClearNote();
    this.SlidePage.ClearNote();
    this.HtmlPage.ClearNote();

    this.AspectDiv.show();
    this.Index = index;
    if (index == 0) { // Title page
        this.Note = this.RootNote;
        if (this.Note.Type == "Presentation") {
            // legacy
            this.SlidePage.Div.hide();
            this.HtmlPage.Div.hide();
            this.TitlePage.DisplayNote(this.Note);
        } else if (this.Note.Type == "HTML") {
            this.TitlePage.Div.hide();
            this.SlidePage.Div.hide();
            this.HtmlPage.Div.show();
            this.HtmlPage.DisplayNote(this.Note);
            if (this.Note.Text == "") {
                this.HtmlPage.InitializeTitlePage();
            }
        }
        this.UserNoteEditor.SetNote(this.Note);
    } else { // Slide page
        this.Note = this.GetSlide(index);
        if (this.Note.Type == "HTML") {
            this.TitlePage.Div.hide();
            this.SlidePage.Div.hide();
            this.HtmlPage.Div.show();
            this.HtmlPage.DisplayNote(this.Note);
            this.UserNoteEditor.SetNote(this.Note);
        } else {
            this.TitlePage.Div.hide();
            this.HtmlPage.Div.hide();
            this.SlidePage.DisplayNote(this.Note, index);
        }
    }
    // Start preloading the next slide.
    if (index < this.RootNote.Children.length) {
        var nextNote = this.RootNote.Children[index];
        // TODO: Better arg for LoadTiles.
        // Should I pass in the jquery selection or viewer.
        if (nextNote.ViewerRecords.length > 0) {
            // Hack: What size viewer will we be using?
            nextNote.ViewerRecords[0].LoadTiles([0,0,400,300]);
        }
        if (nextNote.ViewerRecords.length > 1) {
            // Hack: What size viewer will we be using?
            nextNote.ViewerRecords[1].LoadTiles([0,0,400,300]);
        }
    }

    this.UpdateSlidesTab();
    this.UpdateQuestionMode();

    // Font was not scaling when first loaded.
    $(window).trigger('resize');
}

Presentation.prototype.GetNumberOfSlides = function (){
    return this.RootNote.Children.length + 1;
}


Presentation.prototype.GetSlide = function (idx){
    if (idx < 0 || idx > this.RootNote.Children.length) {
        return null;
    }
    if (idx == 0) {
        return this.RootNote;
    }
    return this.RootNote.Children[idx-1];
}


Presentation.prototype.SortCallback = function (){
    // Change the list of GUI items into a list of notes.
    var items = this.SlideList.find('div');
    var newChildren = [];
    var newIndex = 0;
    for (var i = 0; i < items.length; ++i) {
        var idx = parseInt($(items[i]).data('index'));
        if (idx != 0) { // we have to skip the title page because it is
            // root.
            newChildren.push(this.GetSlide(idx));
        }
        if (this.Index == idx) {
            // If the current slide moved, update the index.
            // Note the offset by one to account for the root / title.
            // length is one more than the notes index.
            newIndex = newChildren.length;
        }
    }
    this.RootNote.Children = newChildren;
    this.Index = newIndex;
    this.UpdateSlidesTab();
}


Presentation.prototype.UpdateSlidesTab = function (){
    var self = this;

    if ( ! this.SlideList) { return;}

    // Add the title page 
    this.SlideList.empty();

    if (SA.Edit) {
        this.SlideList
            .sortable({update: function(event,ui){self.SortCallback();},
                       handle: ".ui-icon"});
    }

    for (var i = 0; i < this.GetNumberOfSlides(); ++i) {
        // get a title
        var note = this.GetSlide(i);
        var title;
        var title = note.Text;
        var idx = title.indexOf('sa-presentation-text');
        if (idx == -1) {
            title = note.Title;
            if (title == "") {
                // Nothing i the text / html to use as a title.
                title = "Slide " + i;
            }
        } else {
            title = title.substring(idx);
            idx = title.indexOf('>');
            title = title.substring(idx+1);
            idx = title.indexOf('<');
            // We may have other formating blocks.
            // An xml parser would be nice.
            while (idx == 0) {
                idx = title.indexOf('>');
                title = title.substring(idx+1);
                idx = title.indexOf('<');
            }
            title = title.substring(0,idx);
            if (note.Title == "") {
                note.Title = title;
            }
        }
        // Hide titles
        if (this.RootNote.Mode == 'answer-hide') {
            title = "#"+i;
        }

        var slideDiv = $('<div>')
            .appendTo(this.SlideList)
            .css({'position':'relative',
                  'padding-left':'1.5em',
                  'padding-right':'1.5em',
                  'margin': '5px',
                  'color': '#29C',
                  'cursor':'pointer'})
            .hover(function(){ $(this).css("color", "blue");},
                   function(){ $(this).css("color", "#29C");})
            .text(title)
            .data("index",i)
            .click(function () {
                SA.presentation.GotoSlide($(this).data("index"));
            });
        var sortHandle = $('<span>')
            .appendTo(slideDiv)
            .css({'position':'absolute',
                  'left':'7px',
                  'top' :'2px',
                  'opacity':'0.5'})
            .addClass('ui-icon ui-icon-bullet');
        if (SA.Edit) {
            sortHandle.addClass('sa-sort-handle');
        }

        if (this.Note == note) {
            slideDiv.css({'background':'#EEE'});
        }
    }
}



//==============================================================================
function SlidePage(parent, edit) {
    var self = this;
    this.FullWindowView = null;
    this.Edit = edit;
    this.Note = null;
    this.Records = []; // views.

    this.Div = $('<div>')
        .appendTo(parent)
        .hide()
        .addClass('sa-resize') // hack to get resize triggered.
        .css({
            'position' : 'absolute',
            'width': '100%',
            'height': '100%',
            'border': '1px solid #AAA'});
    this.Div[0].onresize=
        function(){
            self.ResizeViews();
        };

    this.ViewPanel = $('<div>')
            .appendTo(this.Div)
            .css({'background':'#FFF',
                  'position': 'absolute',
                  'top': '0px',
                  'bottom': '300px',
                  'left': '0px',
                  'width': '100%',
                  'height': 'auto'});

    this.BottomDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position': 'absolute',
              'bottom':'0px',
              'width':'100%',
              'height':'300px'});

    this.TitleBar = $('<div>')
        .appendTo(this.BottomDiv)
        .css({'position':'absolute',
              'top': '0px',
              'height': '80px',
              'line-height': '80px',
              'width':'100%',
              'padding-left': '3.3em',
              'color': 'white',
              'font-size': '160%',
              'background': '#444',
              'font-family': 'Arial'});
    this.Title = $('<span>')
        .appendTo(this.TitleBar)
        .css({'display':'inline-block',
              'vertical-align':'middle',
              'line-height':'normal'})
        .text("Slide: 1");

    this.TextDiv = $('<div>')
        .appendTo(this.BottomDiv)
        .css({'position':'absolute',
              'padding-left':'2em',
              'height': '210px',
              'bottom': '5px',
              'width': '100%'});
    // List of question answers.
    this.List = new SA.TextEditor(this.TextDiv, SA.VIEWERS);
    if ( ! edit) {
        this.List.EditOff();
    }

    // Add the viewers.
    this.ViewerDiv1 = $('<div>')
        .appendTo(this.ViewPanel)
        .css({'position':'absolute',
              'box-shadow': '10px 10px 5px #AAA'});
    // Make the viewer look like jquery
    //this.ViewerDiv1.viewer({overview:false});
    this.ViewerDiv1.saViewer();

    this.ViewerDiv2 = $('<div>')
        .appendTo(this.ViewPanel)
        .css({'position':'absolute',
              'box-shadow': '10px 10px 5px #AAA'});
    // Make the viewer look like jquery
    this.ViewerDiv2.saViewer();

    if (this.Edit) {
        // TODO: Better API (jquery) for adding widgets.
        // TODO: Better placement control for the widget.

        var viewer = this.ViewerDiv1[0].saViewer;
        this.AnnotationWidget1 = new SA.AnnotationWidget(
            viewer.GetAnnotationLayer(), viewer);
        this.AnnotationWidget1.SetVisibility(2);

        var viewer = this.ViewerDiv2[0].saViewer;
        this.AnnotationWidget2 = new SA.AnnotationWidget(
            viewer.GetAnnotationLayer(), viewer);
        this.AnnotationWidget2.SetVisibility(2);

        // TODO: Move this to bind in jquery.  (not sure how to do this yet)
        this.ViewerDiv1[0].saViewer.OnInteraction(function () {self.RecordView1();});
        this.ViewerDiv2[0].saViewer.OnInteraction(function () {self.RecordView2();});
        this.RemoveView1Button = $('<img>')
            .appendTo(this.ViewerDiv1)
            .attr('src',SA.ImagePathUrl+"remove.png")
            .prop('title', "remove view")
            .addClass('editButton')
            .css({'position':'absolute',
                  'right':'0px',
                  'top':'0px',
                  'width':'12px',
                  'height':'12px',
                  'z-index':'5'})
            .click(function () {
                SA.presentation.Note.ViewerRecords.splice(0,1);
                // Redisplay the viewers
                self.DisplayNote(self.Note, SA.presentation.Index);
            });
        this.RemoveView2Button = $('<img>')
            .appendTo(this.ViewerDiv2)
            .attr('src',SA.ImagePathUrl+"remove.png")
            .prop('title', "remove view")
            .addClass('editButton')
            .css({'position':'absolute',
                  'right':'0px',
                  'top':'0px',
                  'width':'12px',
                  'height':'12px',
                  'z-index':'5'})
            .click(function () {
                SA.presentation.Note.ViewerRecords.splice(1,1);
                // Redisplay the viewers
                self.DisplayNote(self.Note, SA.presentation.Index);
            });

        // Setup view resizing.
        this.ViewerDiv1.resizable();
        // For a method to get called when resize stops.
        // Gets call on other mouse ups, but this is ok.
        this.ViewerDiv1
            .mouseup(function () {
                this.saViewer.EnableInteraction();
                self.UpdateEdits();
                $(window).trigger('resize');
            });
        this.ViewerDiv1
            .resize(function () {
                this.saViewer.DisableInteraction();
                var vp = this.saViewer.GetViewport();
                vp[2] = $(this).width();
                vp[3] = $(this).height();
                this.saViewer.SetViewport(vp);
                this.saViewer.EventuallyRender(true);
                return false;
            });

        this.ViewerDiv2.resizable();
        // For a method to get called when resize stops.
        // Gets call on other mouse ups, but this is ok.
        this.ViewerDiv2
            .mouseup(function () {
                this.saViewer.EnableInteraction();
                self.UpdateEdits();
                $(window).trigger('resize');
            });
        this.ViewerDiv2
            .resize(function () {
                this.saViewer.DisableInteraction();
                var vp = this.saViewer.GetViewport();
                vp[2] = $(this).width();
                vp[3] = $(this).height();
                this.saViewer.SetViewport(vp);
                this.saViewer.EventuallyRender(true);
                return false;
            });
    }
    // Give the option for full screen
    // on each of the viewers.
    this.FullWindowView1Button = $('<img>')
        .appendTo(this.ViewerDiv1)
        .attr('src',SA.ImagePathUrl+"fullscreenOn.png")
        .prop('title', "full window")
        .css({'position':'absolute',
              'width':'12px',
              'left':'-5px',
              'top':'-5px',
              'opacity':'0.5',
              'z-index':'-1'})
        .hover(function(){$(this).css({'opacity':'1.0'});},
               function(){$(this).css({'opacity':'0.5'});})
        .click(function () {
            self.SetFullWindowView(self.ViewerDiv1);
        });
    this.FullWindowView2Button = $('<img>')
        .appendTo(this.ViewerDiv2)
        .attr('src',SA.ImagePathUrl+"fullscreenOn.png")
        .prop('title', "full window")
        .css({'position':'absolute',
              'width':'12px',
              'left':'-5px',
              'top':'-5px',
              'opacity':'0.5',
              'z-index':'-1'})
        .hover(function(){$(this).css({'opacity':'1.0'});},
               function(){$(this).css({'opacity':'0.5'});})
        .click(function () {
            self.SetFullWindowView(self.ViewerDiv2);
        });


    this.FullWindowViewOffButton = $('<img>')
        .appendTo(this.ViewPanel)
        .hide()
        .attr('src',SA.ImagePathUrl+"fullscreenOff.png")
        .prop('title', "full window off")
        .css({'position':'absolute',
              'background':'#FFF',
              'width':'16px',
              'left':'1px',
              'top':'1px',
              'opacity':'0.5',
              'z-index':'1'})
        .hover(function(){$(this).css({'opacity':'1.0'});},
               function(){$(this).css({'opacity':'0.5'});})
        .click(function () {
            self.SetFullWindowView(null);
        });
}


SlidePage.prototype.SetFullWindowView = function (viewerDiv) {
    if (viewerDiv) {
        SA.presentation.EditOff();
        this.FullWindowViewOffButton.show();
        this.FullWindowView1Button.hide();
        this.FullWindowView2Button.hide();
        this.BottomDiv.hide();
        this.ViewPanel.css({'height':'100%'});
    } else {
        this.FullWindowViewOffButton.hide();
        this.FullWindowView1Button.show();
        this.FullWindowView2Button.show();
        this.BottomDiv.show();
        this.ViewPanel.css({
            'bottom': '300px',
            'height': 'auto'});
        if (SA.Edit) {
            SA.presentation.EditOn();
        }

    }
    this.FullWindowView = viewerDiv;
    this.ResizeViews();
}


SlidePage.prototype.RecordView1 = function() {
    if (this.Edit && this.Note &&
        this.Note.ViewerRecords.length > 0 &&
        this.Note.ViewerRecords[0]) {
        this.Note.ViewerRecords[0].CopyViewer(this.ViewerDiv1[0].saViewer);
    }
}


SlidePage.prototype.RecordView2 = function() {
    if (this.Edit && this.Note &&
        this.Note.ViewerRecords.length > 1 &&
        this.Note.ViewerRecords[1]) {
        this.Note.ViewerRecords[1].CopyViewer(this.ViewerDiv2[0].saViewer);
    }
}


SlidePage.prototype.EditOff = function () {
    if (SA.Edit && this.Edit) {
        this.Edit = false;
        this.Div.css({'width': '100%', 'left': '0px'});
        this.AnnotationWidget1.hide();
        this.AnnotationWidget2.hide();
        // Clear the event callbacks
        this.ViewerDiv1[0].saViewer.OnInteraction();
        this.ViewerDiv2[0].saViewer.OnInteraction();
        this.RemoveView1Button.hide();
        this.RemoveView2Button.hide();
        this.List.EditOff();
        // This causes the viewers to look transparent.
        //SA.VIEWER.MainView.CanvasDiv.resizable('disable');
    }
}


SlidePage.prototype.EditOn = function () {
    if (SA.Edit &&  ! this.Edit) {
        this.Edit = true;
        //this.Div.css({'width': '100%', 'left': '0px'}); ???
        this.AnnotationWidget1.show();
        this.AnnotationWidget2.show();
        // Set the event callbacks
        var self = this;
        this.ViewerDiv1[0].saViewer.OnInteraction(function () {self.RecordView1();});
        this.ViewerDiv2[0].saViewer.OnInteraction(function () {self.RecordView2();});
        this.RemoveView1Button.show();
        this.RemoveView2Button.show();
        this.List.EditOn();
    }
}


// Adds a margin, and keeps the aspect ratio of view.
SlidePage.prototype.PlaceViewer = function(viewerDiv, record, viewport) {
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

    if (viewerDiv) {
        viewerDiv[0].saViewer.SetViewport([vLeft, vTop, vWidth, vHeight]);
        viewerDiv[0].saViewer.EventuallyRender(false);
    }
}


// Records == views.
SlidePage.prototype.ResizeViews = function ()
{
    var width = this.ViewPanel.width();
    var height = this.ViewPanel.height();
    if (this.FullWindowView) {
        this.ViewerDiv1[0].saViewer.SetViewport([0, 0, 0, height]);
        this.ViewerDiv2[0].saViewer.SetViewport([0, 0, 0, height]);
        this.FullWindowView[0].saViewer.SetViewport([0,0,width,height]);
        this.FullWindowView[0].saViewer.EventuallyRender(false);
        return;
    }

    var numRecords = this.Records.length;
    var record;

    if (numRecords == 0) {
        // Poor way to hide a viewer.
        this.ViewerDiv1[0].saViewer.SetViewport([0, 0, 0, height]);
        // Poor way to hide a viewer.
        this.ViewerDiv2[0].saViewer.SetViewport([0, 0, 0, height]);
    }
    if (numRecords == 1) {
        record = this.Records[0];
        this.PlaceViewer(this.ViewerDiv1, record, [0,0,width,height]);
        // Poor way to hide a viewer.
        this.ViewerDiv2[0].saViewer.SetViewport([0, 0, 0, height]);
    }
    if (numRecords > 1) {
        var halfWidth = width / 2;
        record = this.Records[0];
        this.PlaceViewer(this.ViewerDiv1, record, [0,0,halfWidth,height]);
        record = this.Records[1];
        this.PlaceViewer(this.ViewerDiv2, record, [halfWidth,0,halfWidth,height]);
    }
    if (this.Edit) {
        if (numRecords == 0) {
            // TODO: View should have hide/show methods and manage this.
            this.AnnotationWidget1.hide();
            this.AnnotationWidget2.hide();
        }
        if (numRecords == 1) {
            this.AnnotationWidget1.show();
            this.AnnotationWidget2.hide();
        }
        if (numRecords == 2) {
            this.AnnotationWidget1.show();
            this.AnnotationWidget2.show();
        }
    }
}


SlidePage.prototype.ClearNote = function () {
    if (this.Edit && this.Note) {
        this.UpdateEdits();
    }
    this.Note = null;
}


SlidePage.prototype.DisplayNote = function (note, index) {

    this.Div.show();
    this.Note = note;
    this.ViewerDiv1[0].saViewer.Reset();
    this.ViewerDiv2[0].saViewer.Reset();
    this.Records = note.ViewerRecords; // save this for resizing.

    this.Title.text("Slide: " + index)
    // Text
    this.List.LoadNote(note);
    // Views
    if (this.Records.length > 0) {
        this.ViewerDiv1[0].saViewer.SetViewerRecord(this.Records[0]);
    }
    if (this.Records.length > 1) {
        this.ViewerDiv2[0].saViewer.SetViewerRecord(this.Records[1]);
    }
    this.ViewerDiv1[0].saViewer.CopyrightWrapper.hide();
    this.ViewerDiv2[0].saViewer.CopyrightWrapper.hide();
    this.ResizeViews();
}


// We need to copy the annotation (maybe view in the future)
// Interaction does not actach all annotation changes.
SlidePage.prototype.UpdateEdits = function () {
    if (this.Note &&
        this.Note.ViewerRecords.length > 0 &&
        this.Note.ViewerRecords[0]) {
        this.Note.ViewerRecords[0].CopyViewer(this.ViewerDiv1[0].saViewer);
    }

    if (this.Note &&
        this.Note.ViewerRecords.length > 1 &&
        this.Note.ViewerRecords[1]) {
        this.Note.ViewerRecords[1].CopyViewer(this.ViewerDiv2[0].saViewer);
    }
}


SlidePage.prototype.InsertViewNote = function (note) {
    if (note.ViewerRecords.length < 1) { return; }

    // we just use the record for slide pages.
    var record = note.ViewerRecords[0];

    this.Note.ViewerRecords.push(record);

    // Hack: Since GotoSlide copies the viewer to the record,
    // We first have to push the new record to the view.
    if (this.Note.ViewerRecords.length == 1) {
        // TODO: jquery arg
        this.ViewerDiv1[0].saViewer.SetViewerRecord(this.Note.viewerRecords[0]);
    } else if (this.Note.ViewerRecords.length == 2) {
        this.ViewerDiv2[0].saViewer.SetViewerRecord(this.Note.viewerRecords[1]);
    }

    this.DisplayNote(this.Note, SA.presentation.Index);
}



//==============================================================================
function TitlePage (parent, edit) {
    this.Edit = edit;
    this.Note = null;
    this.Div = $('<div>')
        .appendTo(parent)
        .css({
            'background':'#FFF',
            'position' : 'absolute',
            'width': '100%',
            'height': '100%',
            'border': '1px solid #AAA'});

    this.TopBar = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'top': '0%',
              'height': '2%',
              'left': '13%',
              'right': '3%',
              'background':'#DDF1FD'});

    this.Image = $('<img>')
        .appendTo(this.Div)
        .attr('src', 'static/img/SlideAtlas_home.jpg')
        .css({'position':'absolute',
              'top': '46%',
              'height':'50%',
              'left': '13%',
              'box-shadow': '10px 10px 5px #888'});

    this.TitleBar = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'top': '18%',
              'bottom': '58%',
              'left': '0%',
              'right': '3%',
              'background':'#073E87',
              'color':'#FFF'});
    this.Title = $('<span>')
        .appendTo(this.TitleBar)
        .attr('contenteditable', 'true')
        .css({'position':'absolute',
              'top': '1em',
              //'min-height':'3em',
              //'min-width':'10em',
              'left': '13%'})
        .saScalableFont({scale:'0.3'});

    this.AuthorBar = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'top': '42%',
              'bottom': '0%',
              'left': '62%',
              'right': '3%',
              'background':'#E9F5FE',
              'color':'#888',
              'padding-left':'2em'});
    this.AuthorText = $('<span>')
        .appendTo(this.AuthorBar)
        .attr('contenteditable', 'true')
        .css({'position':'absolute',
              //'minimum-height':'4em',
              //'minimum-width':'10em',
              'top': '2em'})
        .saScalableFont({scale:'0.1'});


    if (this.Edit) {
        var self = this;
        this.Title
            .focusin(function() { SA.ContentEditableHasFocus = true;})
            .focusout(function() { SA.ContentEditableHasFocus = false;});
        this.AuthorText
            .focusin(function() { SA.ContentEditableHasFocus = true;})
            .focusout(function() { SA.ContentEditableHasFocus = false;});
    }
}


TitlePage.prototype.EditOff = function () {
    if (SA.Edit && this.Edit) {
        this.Edit = false;
        this.Div.css({'width': '100%', 'left': '0px'});
        this.Title
            .attr('readonly', 'readonly')
            .attr('spellcheck', 'false')
            .unbind('focusin')
            .unbind('focusout')
            .blur();
        this.AuthorText.attr('readonly', 'readonly')
            .attr('readonly', 'readonly')
            .attr('spellcheck', 'false')
            .unbind('focusin')
            .unbind('focusout')
            .blur();
    }
}


TitlePage.prototype.EditOn = function () {
    if (SA.Edit &&  ! this.Edit) {
        this.Edit = true;
        //this.Div.css({'width': '100%', 'left': '0px'}); ???
        this.Title
            .attr('contenteditable', 'true')
            .attr('spellcheck', 'true')
            .focusin(function() { SA.ContentEditableHasFocus = true;})
            .focusout(function() { SA.ContentEditableHasFocus = false;});
        this.AuthorText.attr('readonly', 'readonly')
            .attr('contenteditable', 'true')
            .attr('spellcheck', 'true')
            .focusin(function() { SA.ContentEditableHasFocus = true;})
            .focusout(function() { SA.ContentEditableHasFocus = false;});
    }
}


TitlePage.prototype.ClearNote = function () {
    if (this.Edit && this.Note) {
        this.UpdateEdits();
    }
    this.Note = null;
}


TitlePage.prototype.DisplayNote = function (note) {
    this.Note = note;
    this.Div.show();
    this.Title.html(note.HiddenTitle);
    this.AuthorText.html(note.Text);

    // What is this doing?
    // Select the title?
    var sel = window.getSelection();
    var range;
    range = document.createRange();
    range.noCursor = true;
    range.selectNodeContents(this.Title[0]);
    sel.removeAllRanges();
    sel.addRange(range);
    // Changes it to be bigger and white
    document.execCommand('foreColor', false, "#FFF");
    document.execCommand('fontSize', false, '6');
    document.execCommand('fontName', false, 'Arial');

    // Format the author text.
    // Bad way to format.  Title page should go away and
    // be replaced by HtmlPage.
    range.selectNodeContents(this.AuthorText[0]);
    sel.removeAllRanges();
    sel.addRange(range);

    document.execCommand('fontSize', false, '5');
    document.execCommand('fontName', false, 'Arial');

    sel.removeAllRanges();
    // Remove focus from the two text boxes.
    this.Title.blur();
    this.AuthorText.blur();
}


TitlePage.prototype.UpdateEdits = function () {
    if (this.Note) {
        this.Note.Text = this.AuthorText.html();
        this.Note.HiddenTitle = this.Title.html();
    }
}


//==============================================================================
// How to save css stuff?
// embedded viewers will be children (what to do about multiple records, stacks?).
// Ignore edit for now.
function HtmlPage (parent, edit, background) {
    this.Edit = edit;
    this.Note = null;
    // Should I make another div or just use the parent?
    this.Div = $('<div>')
        .appendTo(parent)
        .hide()
        .css({
            'background-color':background,
            'position' : 'absolute',
            'width': '100%',
            'height': '100%'});
}


HtmlPage.prototype.EditOff = function () {
    if (SA.Edit && this.Edit) {
        this.Edit = false;
        this.Div.css({'width': '100%', 'left': '0px'});
        this.SaEditOff();
    }
}
HtmlPage.prototype.EditOn = function () {
    if (SA.Edit &&  ! this.Edit) {
        this.Edit = true;
        // this.Div.css({'width': '100%', 'left': '0px'}); ???
        this.SaEditOn();
    }
}

// Hide/show the edit gui on all the sa elements
HtmlPage.prototype.SaEditOff = function () {
    $('.sa-edit-gui').saButtons('disable');
    $('.sa-presentation-text').attr('contenteditable', 'false');
    $('.sa-presentation-rectangle').saElement({'editable':false,
                                               'interactive':false});
    $('.sa-light-box').saLightBox({'editable':false,
                                   'interactive':true});
}

HtmlPage.prototype.SaEditOn = function () {
    $('.sa-edit-gui').saButtons('enable');
    $('.sa-presentation-text').attr('contenteditable', 'true');
    $('.sa-presentation-rectangle').saElement({'editable':true,
                                               'interactive':true});
    $('.sa-light-box').saLightBox({'editable':true,
                                   'interactive':true});
}


HtmlPage.prototype.ClearNote = function () {
    if (this.Edit && this.Note) {
        this.UpdateEdits();
    }
    this.Note = null;
}


HtmlPage.prototype.DisplayNote = function (note) {
    // Lets record to position of the previous slides viewers to use
    // as the position of any viewers in the new slide.
    this.DefaultViewerPositions = [];
    var lastViewers = $('.sa-lightbox-viewer');
    for (var i = 0; i < lastViewers.length; ++i) {
        this.DefaultViewerPositions.push(
            {left:lastViewers[i].style.left,
             top:lastViewers[i].style.top,
             width:lastViewers[i].style.width,
             height:lastViewers[i].style.height});
    }

    this.Note = note;
    this.Div.show();
    // This version setsup the saTextEditor and other jquery extensions.
    this.Div.saHtml(note.Text);

    if ( ! this.Edit) {
        // TODO: Reevaulate SaEdit functions.
        this.SaEditOff();
    } else {
        this.SaEditOn();
    }
    // hack
    // Do not let students edit text.
    if ( ! SA.Edit) {
        $('.sa-text-editor').attr('contenteditable', "false")
    }

    // Change the edit status of the elements.
    var self = this;
    this.Div.find('.sa-presentation-image')
        .saLightBox({'editable':SA.Edit,
                     'aspectRatio':true});
    this.Div.find('.sa-lightbox-viewer')
        .saLightBoxViewer({
            'editable':SA.Edit,
            'delete' : function (dom) {self.ViewDeleteCallback(dom);}});
    this.Div.find('.sa-presentation-rectangle')
        .saRectangle({'editable':SA.Edit});
    // Make viewers into lightbox elements.
    // MOVE
    //this.InitializeViews(this.Div.find('.sa-presentation-view'));

    // Set stops.
    $('sa-draggable').saDraggable();
    // still needed for iframes.
    this.BindElements();
    // I do not want to shuffle questions between test and review.
    //if (SA.Edit) {
    //    this.ShuffleQuestion();
    //}
}


// Add the initial html for a title page.
HtmlPage.prototype.InitializeTitlePage = function() {
    this.Div.empty();
    this.Div[0].className = 'sa-presentation-title-page';
    // Title bar
    this.InsertRectangle('#073E87','0%','31%','97.5%','25%');
    // Should everything be have Div as parent?
    // Todo: make this look like jquery.
    var titleText = this.InsertTextBox(50)
        .addClass('sa-presentation-title')
        .css({'color':'white',
              'left' :'10%',
              'width':'88%',
              'top':'40%'})
        .text("Title");

    var authorText = this.InsertTextBox(28)
        .css({'left':'10%',
              'width':'88%',
              'top':'59%'})
        .text("Author");

    this.UpdateEdits();
    this.BindElements();
}

// Add the initial html for a slide page.
HtmlPage.prototype.InitializeSlidePage = function() {
    this.Div.empty();
    this.Div[0].className = 'sa-presentation-slide-page';

    // Title bar
    this.InsertRectangle('#073E87','0%','6%','97.5%','14%');

    // Should everything be have Div as parent?
    // Todo: make this look like jquery.
    var titleText = this.InsertTextBox(42)
        .css({'color':'white',
              'left' :'18%',
              'width':'70%',
              'top':'7.25%',
              'height':'11.5%'})
        .text("Title")
        .addClass('sa-presentation-title');

    this.UpdateEdits();
    this.BindElements();
}

// TODO: make sa jquery handle this. 
HtmlPage.prototype.InsertImage = function(src) {

    var imgDiv;
    var left = 5 + Math.floor(Math.random() * 10);
    var top = 20 + Math.floor(Math.random() * 10);

    /* // link option
    if (ref != "") {
        imgDiv = $('<a>')
            .appendTo(this.Div)
            .attr('href', ref)
            .css({'position':'absolute',
                  'left'    :left+'%',
                  'top'     :top+'%',
                  'z-index' :'1'})
            .addClass('sa-presentation-image')
            .saLightBox();
    } else {*/
    imgDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'left'    :left+'%',
              'top'     :top+'%',
              'z-index' :'1'})
        .saLightBox({aspectRatio: true,
                     editable: SA.Edit})
        .addClass('sa-presentation-image');
    var img = $('<img>')
        .appendTo(imgDiv)
        .css({'width':'100%',
              'height':'100%'});
    img[0].onload = function () {
        // Bug.  imgDiv had no style.width
        // Not scalling
        this.parentNode.style.width = this.width + 'px';
        this.parentNode.style.height = this.height + 'px';
        this.parentNode.saElement.ConvertToPercentages();
    }
    img.attr('src',src);

    return imgDiv;
}

// TODO: Change type based on extension
HtmlPage.prototype.InsertVideo = function(src) {
    // resizable makes a containing div anyway.
    var vidDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'left'    :'10%',
              'top'     :'30%',
              'z-index' :'1'})
        .addClass('sa-presentation-video')
        .saDraggable()
        .saDeletable();

    var vid = $('<video controls>')
        .appendTo(vidDiv);
    var src = $('<source type="video/mp4">')
        .appendTo(vid)
        .attr('src',src);

    vid[0].addEventListener('loadeddata', function() {
        // Video is loaded
        // compute the aspect ratio.
        var aRatio = $(this).width() / $(this).height();
        vidDiv.saResizable({
            aspectRatio: aRatio,
        });
        vid.css({'height' :'100%',
                 'width'  :'100%'});
    }, false);

    return vidDiv;
}

// Make the title bar movable and resizable.
// left, top, width and height should be in percentages. i.e. '50%'
HtmlPage.prototype.InsertRectangle = function(color, left, top, width, height) {
    var bar = $('<div>')
        .appendTo(this.Div)
        .css({'background-color': color,
              'border':'1px solid rgba(255, 255, 255, 0)',
              'position':'absolute',
              'left':left,
              'width':width,
              'top':top,
              'height':height})
        .saRectangle({editable: SA.Edit});
}

// The execCommand paste does not work
HtmlPage.prototype.Paste = function() {
    // resizable makes a containing div anyway.
    var containerDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'left'    :'5%',
              'top'     :'25%'})
        .text("paste here")
        .saDraggable()
        .saDeletable();

    // Select the container
    containerDiv
        .attr('contenteditable', 'true')
        .focus();

    // Select everything.
    var sel = window.getSelection();
    var range = document.createRange();
    range.noCursor = true;
    range.selectNodeContents(containerDiv[0]);
    sel.removeAllRanges();
    sel.addRange(range);
    // This does not work.
    document.execCommand('paste',false,null);
}

// Embed youtube.
//'<iframe width="420" height="315" src="https://www.youtube.com/embed/9tCafgGZtxQ" frameborder="0" allowfullscreen></iframe>');
HtmlPage.prototype.InsertIFrame = function(html) {
    // Youtube size has to be set in the original html string.
    var width, height;
    var start = html.indexOf('width');
    if (start != -1) {
        var str = html.substring(start+7);
        var end = str.indexOf('"');
        var tmp = str.substr(0,end);
        width = parseInt(tmp) / (800*1.333);
        width = Math.round(width*100);
        width = width + '%';
        html = html.replace(tmp, width);
    }
    start = html.indexOf('height');
    if (start != -1) {
        var str = html.substring(start+8);
        var end = str.indexOf('"');
        var tmp = str.substr(0,end);
        height = parseInt(tmp) / 800;
        height = Math.round(height*100);
        height = height + '%';
        html = html.replace(tmp, height);
    }

    var frame = $(html)
        .appendTo(this.Div)
        .css({'position':'absolute',
              'display':'block',
              'left': '5%',
              'top' : '5%',
              'z-index':'1'})
        .saDraggable()
        .saDeletable();

    return frame;
}

HtmlPage.prototype.InsertURL = function(src) {
    // iframes do not scale with css.  I have to have a resize callback.
    var div = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'left':'5%',
              'right':'2.5%',
              'top':'25%',
              'bottom':'10%',
              'z-index':'1'})
        .saDraggable()
        .saDeletable()
        .resizable();
    var frame = $('<iframe>')
        .appendTo(div)
        .css({'position':'absolute',
              'display':'block',
              'width':'100%',
              'height':'100%'})
        .attr('src',src)
        .attr('scrolling','no')
        .addClass('sa-presentation-iframe');

    this.BindElements();
    return frame;
}


// This could be eliminated and just use the jquery saTextEditor.
// Interactively place the initial box.
// First lets see if we can reposition it.
HtmlPage.prototype.InsertTextBox = function(size) {
    size = size || 30;

    // Arbitrary height so I do not need to specify
    // text in percentages.
    var scale = size / 800; 

    // Should everything be have Div as parent?
    var text = $('<div>')
        // note: parent has to be set before saTextEditor is called.
        .appendTo(this.Div)
        .css({'display':'inline-block',
              'position':'absolute',
              'overflow': 'visible',
              'fontFamily': "Verdana,sans-serif",
              'border' : '1px solid rgba(255, 255, 255, 0)',
              // defaults caller can reset these.
              'box-sizing':'border-box',
              'left'   : '5%',
              'width'  : '50%',
              'top'    : '30%',
              'height' : '10%',
              'padding': '2% 1% 1% 1%', // top right bottom left
              'z-index': '1'})
        .addClass('sa-presentation-text')
        // This makes the font scale with height of the window.
        .saScalableFont({scale:scale,
                         editable: SA.Edit})
        // default content
        .text("Text");

    if (this.Edit) {
        // Make this div into a text editor.
        text.saTextEditor({dialog:   true,
                           editable: true});
    }

    return text;
}

HtmlPage.prototype.ShuffleQuestion = function() {
    var questions = this.Div.find('.sa-q [type="multiple-choice"]');
    for (var i = 0; i < questions.length; ++i) {
        var q = questions[i];
        // Shuffle the list.
        for (j = q.childNodes.length; j > 0; --j) {
            var idx = Math.floor(Math.random() * j);
            q.appendChild(q.removeChild(q.childNodes[idx]));
        }
    }
}

// Multiple choice for now.
// Answers stored as list items <li>.
HtmlPage.prototype.InsertQuestion = function() {
    var bar = $('<div>')
        .css({'position':'absolute',
              'left':'2%',
              'width':'92%',
              'top':'75%',
              'height':'22.5%',
              'background':'#FFF',
              'border':'1px solid #AAA',
              'padding':'1% 1% 1% 1%', // top right bottom left
              'z-index' :'1'})
        .saScalableFont({scale:'0.03'})
        .saQuestion({editable: SA.Edit});

    // This is for interactive adding new question from the GUI / dialog.
    // Do not apped the question until apply is selected.
    var self = this;
    bar.saQuestion('OpenDialog',
                   function () {
                       bar.appendTo(self.Div);
                       bar.trigger('resize');
                   });
}





// Should save the view as a child notes, or viewer record?
// For saving, it would be easy to encode the view id into the html as an
// attribute, but what would I do with the other viewer records?  Ignore
// them. One issue:  I have to save the new note to get the id, which is
// necessary, for the saViewer.  Well, maybe not.  I could pass in the
// note, and then get the id when saHtml() is called to save.
HtmlPage.prototype.InsertView = function(viewObj) {
    if ( ! this.Note) {
        return;
    }

    // First make a copy of the view as a child.
    var newNote = new SA.Note();
    var tmpId = newNote.Id;
    newNote.Load(viewObj);
    delete newNote.Id;
    newNote.Id = tmpId;
    if (newNote.ViewerRecords.length == 0) {
        SA.Debug("Insert failed: Note has no viewer records.");
    } else if (this.Note.Parent) {
        this.Note.Children.push(newNote);
        newNote.Parent = this.Note;
        this.InsertView2(newNote);
    } else {
        // We cannot add a dual view to a tile page because the child note
        // will be interpreted as a new slide.
        this.InsertViewerRecord(newNote.ViewerRecords[0]);
    }
}


// The html page is a note.  It contains viewer whose states are saved in
// viewerRecords.
// Helper method
// TODO: Change newNote to viewerRecord.
HtmlPage.prototype.InsertViewerRecord = function(viewerRecord) {
    if ( ! this.Note) {
        return;
    }

    var viewerIdx = this.Note.ViewerRecords.length;
    this.Note.ViewerRecords.push(viewerRecord);

    var defaultPosition = {left:'5%',top:'25%',width:'40%',height:'40%'};
    if (this.DefaultViewerPositions.length > 0) {
        defaultPosition = this.DefaultViewerPositions.splice(0,1)[0];
    } else {
        var n = (this.Div.children().length) * 5;
        defaultPosition.left = n.toString()+'%';
        defaultPosition.top = (n+15).toString()+'%';
    }

    var self = this;
    var viewerDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'box-shadow': '10px 10px 5px #AAA',
              'background-color':'#FFF',
              'opacity':'1.0',
              'left'   : defaultPosition.left,
              'width'  : defaultPosition.width,
              'top'    : defaultPosition.top,
              'height' : defaultPosition.height})
        .saLightBoxViewer({
            'note'         : this.Note,
            'viewerIndex'  : viewerIdx,
            'hideCopyright': true,
            'editable'     : SA.Edit,
            'delete' : function (dom) {self.ViewDeleteCallback(dom);}});

    return viewerDiv;
}
// The html page is a note.  It contains viewer whose states are saved in
// viewerRecords.
// Helper method
// TODO: Change newNote to viewerRecord.
HtmlPage.prototype.InsertView2 = function(view) {
    if ( ! this.Note) {
        return;
    }

    var defaultPosition = {left:'5%',top:'25%',width:'45%',height:'45%'};
    if (this.DefaultViewerPositions.length > 0) {
        defaultPosition = this.DefaultViewerPositions.splice(0,1)[0];
    }

    var self = this;
    var viewerDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'box-shadow': '10px 10px 5px #AAA',
              'background-color':'#FFF',
              'opacity':'1.0',
              'left'   : defaultPosition.left,
              'width'  : defaultPosition.width,
              'top'    : defaultPosition.top,
              'height' : defaultPosition.height})
        .saLightBoxViewer({
            'note'         : view,
            'dual'         : true,
            'hideCopyright': true,
            'delete' : function (dom) {self.ViewDeleteCallback(dom);},
            'editable'     : SA.Edit});

    return viewerDiv;
}
// This was for development debugging
HtmlPage.prototype.InsertViewId2 = function(viewId) {
    if ( ! this.Note) {
        return;
    }

    var defaultPosition = {left:'5%',top:'25%',width:'45%',height:'45%'};
    if (this.DefaultViewerPositions.length > 0) {
        defaultPosition = this.DefaultViewerPositions.splice(0,1)[0];
    }

    var viewerDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'box-shadow': '10px 10px 5px #AAA',
              'background-color':'#FFF',
              'opacity':'1.0',
              'left'   : defaultPosition.left,
              'width'  : defaultPosition.width,
              'top'    : defaultPosition.top,
              'height' : defaultPosition.height})
        .saLightBoxViewer({
            'viewId'       : viewId,
            'dual'         : true,
            'hideCopyright': true,
            'editable'     : SA.Edit});

    return viewerDiv;
}

HtmlPage.prototype.ViewDeleteCallback = function (dom) {
    // When a viewer is deleted the next should replace it.
    this.DefaultViewerPositions.push(
        {left:dom.style.left,
         top:dom.style.top,
         width:dom.style.width,
         height:dom.style.height});

    // Extra viewer records get pruned when the page is converted to html
    // Get rid of dual viewer notes.
    if (dom.saViewer.saNote != this.Note) {
        var childIdx = this.Note.Children.indexOf(dom.saViewer.saNote);
        if ( childIdx >= 0) {
            this.Note.Children.splice(childIdx,1);
        }
    }
}

// NOTE: This should be lagacy now.  The jquery extensions should handle this.
// Text elements need to resize explicitly.
// TODO: Activate text (saScalatFont, saTextEditor, resize) on load.
// I could make this scalabe ifram as a jquery extension too.
HtmlPage.prototype.BindElements = function() {
    // Similar to text, we need to scale the content.
    var frameElements = $('.sa-presentation-iframe');
    frameElements.addClass('sa-resize');
    for (var i = 0; i < frameElements.length; ++i) {
        var frame = frameElements[i];
        frame.onresize =
            function () {
                var w = $(this).parent().width();
                var h = $(this).parent().height();
                var scale = Math.min(h,w/1.62) / 700;
                scaleStr = scale.toString();
                w = (Math.floor(w/scale)).toString();
                h = (Math.floor(h/scale)).toString();

                $(this).css({'-ms-zoom': scaleStr,
                             '-ms-transform-origin': '0 0',
                             '-moz-transform': 'scale('+scaleStr+')',
                             '-moz-transform-origin': '0px 50px',
                             '-o-transform': 'scale('+scaleStr+')',
                             '-o-transform-origin': '0px 50px',
                             '-webkit-transform': 'scale('+scaleStr+')',
                             '-webkit-transform-origin': '0 0',
                             'width':  w +'px',
                             'height': h +'px'});
            };
        frame.onresize();
    }
}


HtmlPage.prototype.UpdateEdits = function () {
    if (this.Note) {
        // Record the camera position (and annotations).
        this.Div.find('.sa-lightbox-viewer').saRecordViewer();
        // Doing this here forces us to save the notes
        // TODO: This may created orphaned views. fix this be either
        // delaying copying saHtml to note, or incrementally saving
        // presentation to the database.
        var htmlDiv = this.Div;
        var note = this.Note;

        // prune deleted records.
        // I should really do this when a view is deleted, but there are
        // deleted records in the database.
        // NOTE: THIS ASSUME THAT ALL THE SA.VIEWERS USE THIS NOTE!!!
        var newRecords = [];
        for (var i = 0; i < this.Note.ViewerRecords.length; ++i) {
            var record = this.Note.ViewerRecords[i];
            var str = i.toString();
            var items = $('[sa-viewer-index='+str+']');
            if (items.length > 0) {
                // Replace the index with the new index
                items.attr('sa-viewer-index', newRecords.length);
                newRecords.push(record);
            }
        }
        this.Note.ViewerRecords = newRecords;

        note.Text = htmlDiv.saHtml();
    }
}



//==============================================================================
function SearchPanel(parent, callback) {
    var self = this;
    this.UserCallback = callback;
    this.Parent = parent;

    // List of image data needed for callback.
    this.SearchData = [];

    // TODO:
    // User should probably be formating the parent.
    parent
        .css({'overflow': 'auto',
              'text-align': 'left',
              'color': '#303030',
              'font-size': '18px'});
    this.SearchForm = $('<form>')
        .appendTo(parent)
        .css({'width':'100%',
              'display':'table'})
        .submit(function(e) {self.SearchCallback(); return false;});
    this.SearchLabel = $('<span>')
        .appendTo(this.SearchForm)
        .css({'display':'table-cell',
              'padding':'8px',
              'width':'3.5em'})
        .text("Search:");
    this.SearchInput = $('<input>')
        .appendTo(this.SearchForm)
        .css({'width':'95%',
              'display':'table-cell',
              'border':'2px inset #CCC'})
        .focusin(function() { SA.ContentEditableHasFocus = true;})
        .focusout(function() { SA.ContentEditableHasFocus = false;});
    this.SearchResults = $('<div>')
        .appendTo(parent)
        .css({'position':'absolute',
              'top':'2em',
              'bottom':'0px',
              'width':'100%',
              'overflow-y':'auto'});
}


SearchPanel.prototype.SearchCallback = function() {
    var self = this;
    var terms = this.SearchInput.val();

    this.Parent.css({'cursor':'progress'});
    $.ajax({
        type: "get",
        url: "/webgl-viewer/query",
        data: {'terms': terms},
        success: function(data,status){
            self.LoadSearchResults(data);
            self.Parent.css({'cursor':'default'});
        },
        error: function() {
            SA.Debug( "AJAX - error() : query" );
            self.Parent.css({'cursor':'default'});
        },
    });
}


SearchPanel.prototype.LoadSearchResults = function(data) {
    var self = this;
    this.SearchResults.empty();
    this.SearchData = data.images;

    // These are in order of best match.
    for (var i = 0; i < data.images.length; ++i) {
        var imgObj = data.images[i];

        var imageDiv = $('<div>')
            .appendTo(this.SearchResults)
            .css({'float':'left',
                  'margin':'5px',
                  'border': '1px solid #AAA'})
            .attr('id', imgObj._id)
            .data('index', i)
            .hover(function(){$(this).css({'border-color':'#00F'});},
                   function(){$(this).css({'border-color':'#AAA'});})
            .click(function(){
                self.SelectCallback($(this).data('index'));
            });

        var image  = {img       : imgObj._id,
                      db        : imgObj.database,
                      levels    : imgObj.levels,
                      tile_size : imgObj.TileSize,
                      bounds    : imgObj.bounds,
                      label     : imgObj.label};
        if ( ! image.bounds ) {
            image.bounds = [0, imgObj.dimensions[0], 0,
                      imgObj.dimensions[1]];
        }
        var thumb = new SA.CutoutThumb(image, 100);
        thumb.Div.appendTo(imageDiv)
        var labelDiv = $('<div>')
            .css({'font-size':'50%'})
            .appendTo(imageDiv)
            .text(imgObj.label); // Should really have the image label.
    }
}

SearchPanel.prototype.SelectCallback = function(index) {
    // Search data is just a list of image objects.
    if (this.UserCallback && index >=0 && index<this.SearchData.length) {
        (this.UserCallback)(this.SearchData[index]);
    }
}

//==============================================================================

function ClipboardPanel(parent, callback) {
    var self = this;
    this.UserCallback = callback;

    parent
        .css({'overflow': 'auto',
              'text-align': 'left',
              'color': '#303030',
              'font-size': '18px'});
    this.ClearButton = $('<button>')
        .appendTo(parent)
        .click(function () { self.ClipboardDeleteAll(); })
        .text("Remove All");
    this.ClipboardDiv = $('<div>')
        .css({'overflow_y':'auto'})
        .appendTo(parent);

    $.ajax({
        type: "get",
        url: "webgl-viewer/getfavoriteviews",
        success: function(data,status){
            if (status == "success") {
                self.LoadClipboardCallback(data);
            } else { SA.Debug("ajax failed - get favorite views 2"); }
        },
        error: function() { SA.Debug( "AJAX - error() : getfavoriteviews 2" );
        },
    });
}

ClipboardPanel.prototype.LoadClipboardCallback = function(sessionData) {
    var self = this;
    this.ClipboardDiv.empty();
    this.ClipboardViews = sessionData.viewArray;

    for (var i = 0; i < this.ClipboardViews.length; ++i) {
        var view = this.ClipboardViews[i];
        if (view.Thumb.substring(0,6) == "http:/") {
            view.Thumb = view.Thumb.substring(6);
        }
        var thumb = $('<img>')
            .appendTo(this.ClipboardDiv)
            .attr('src', view.Thumb)
            .prop('title', view.Title)
            .css({'float':'left',
                  'margin':'5px',
                  'border': '1px solid #AAA',
                  'height': '60px'})
            .attr('index', i)
            .hover(function(){$(this).css({'border-color':'#00F'});},
                   function(){$(this).css({'border-color':'#AAA'});})
            .click(function(){
                self.ClickViewCallback(parseInt(this.getAttribute("index")));
            });
    }
}


ClipboardPanel.prototype.ClickViewCallback = function(idx) {
    if (this.UserCallback && idx >= 0 && idx < this.ClipboardViews.length) {
        (this.UserCallback)(this.ClipboardViews[idx]);
    }
}


ClipboardPanel.prototype.ClipboardDeleteAll = function() {
    var self = this;
    this.ClipboardDiv.empty();

    for (var i = 0; i < this.ClipboardViews.length; ++i) {
        $.ajax({
            type: "post",
            url: "/webgl-viewer/deleteusernote",
            data: {"noteId": this.ClipboardViews[i]._id,
                   "col" : "views"},//"favorites"
            success: function(data,status) {
            },
            error: function() {
                SA.Debug( "AJAX - error() : deleteusernote" );
            },
        });
    }
}



    SA.SearchPanel = SearchPanel;
    SA.ClipboardPanel = ClipboardPanel;
    SA.Presentation = Presentation;

})();


