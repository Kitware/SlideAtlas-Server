3// CME
// TODO:
// Light box option.


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
    //MOBILE_DEVICE = "Simple";
    $(body).css({'overflow-x':'hidden'});

    // Hack.  It is only used for events.
    // TODO: Fix events and get rid of this.
    CANVAS = $('<div>')
            .appendTo('body')
            .css({
                'position': 'absolute',
                'width': '100%',
                'height': '100%',
                'top' : '0px',
                'left' : '0px',
                'z-index': '-1'
            });
    // This is necessary for some reason.
    EVENT_MANAGER = new EventManager(CANVAS);

    this.WindowDiv = $('<div>')
        .appendTo('body')
        .css({
            'position':'fixed',
            'left':'0px',
            'width': '100%'})
        .saFullHeight();

    // Hack so all viewers will shar the same browser.
    // We should really use the brower tab in the left panel.
    VIEW_BROWSER = new ViewBrowser(this.WindowDiv);

    this.ResizePanel = new ResizePanel(this.WindowDiv);

    //this.PresentationDiv = $('<div>')
    //    .appendTo(this.WindowDiv)
    //    .css({'position':'absolute',
    //          'top':'0px',
    //          'left':'0px',
    //          'width':'100%',
    //          'height':'100%'});
    this.PresentationDiv = this.ResizePanel.MainDiv;

    // A window with a constant aspect ratio that fits in
    // the PresentationDiv.
    this.AspectDiv = $('<div>')
        .css({'border' :'1px solid #AAA'})
        .appendTo(this.PresentationDiv)
        .saPresentation({aspectRatio : this.RootNote.TypeData.AspectRatio});

    this.LeftPanel = this.ResizePanel.PanelDiv;
    this.InitializeLeftPanel(this.LeftPanel);

    // Float the two slide show buttons in the upper right corner.
    this.ShowButton = $('<img>')
        .appendTo(this.PresentationDiv)
        .prop('title', "present")
        .addClass('editButton')
        .attr('src','webgl-viewer/static/slide_show.png')
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
        .attr('src','webgl-viewer/static/timer.png')
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
            .attr('src',"webgl-viewer/static/remove.png")
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

    // Problem with event manager (we get two key up events.
    //this.ViewerPage = new ViewerPage(this.PresentationDiv, edit);

    this.GotoSlide(0);

    // Keep the browser from showing the left click menu.
    document.oncontextmenu = cancelContextMenu;

    //document.onkeyup = function(e) {self.HandleKeyUp(e);};
    $('body').keyup(function(e) {self.HandleKeyUp(e);});

    this.UpdateSlidesTab();
}


Presentation.prototype.StartTimerShow = function () {
    var self = this;
    // hack to turn off key events.
    CONTENT_EDITABLE_HAS_FOCUS = true;
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
                CONTENT_EDITABLE_HAS_FOCUS = false;
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
    if (EDIT && this.Edit) {
        this.Edit = false;

        this.SaveButton.hide();
        this.InsertMenuButton.hide();
        this.DeleteSlideButton.hide();
        this.AnswersButton.hide();
        this.AnswersLabel.hide();
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
    if (EDIT && ! this.Edit) {
        this.Edit = true;

        this.SaveButton.show();
        this.InsertMenuButton.show();
        this.DeleteSlideButton.show();
        this.AnswersButton.show();
        this.AnswersLabel.show();
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
    this.EditTabs = new TabbedDiv(parent);
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

    if (EDIT) {
        this.BrowserDiv = this.EditTabs.NewTabDiv("Browse");
        this.SearchDiv = this.EditTabs.NewTabDiv("Search");
        this.ClipboardDiv = this.EditTabs.NewTabDiv("Clipboard");
        var self = this;

        this.SaveButton = $('<img>')
            .appendTo(this.SlidesDiv)
            .prop('title', "save")
            .addClass('editButton')
            .attr('src','webgl-viewer/static/save22.png')
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
                    self.HtmlPage.InsertTextBox();},
                'Insert Question' : function () {self.HtmlPage.InsertQuestion();},
                'Insert Rectangle': function () {
                    self.HtmlPage.InsertRectangle('#073E87','0%','60%','97.5%','14%');},
                'Insert Image'    : function () {self.InsertImage();},
                'Insert MP4'      : function () {self.InsertVideo();},
                'Embed Youtube'   : function () {self.InsertYoutube();}
            });

        $('<img>')
            .appendTo(this.InsertMenuButton)
            .attr('src','webgl-viewer/static/new_window.png');


        this.AnswersButton = $('<input type="checkbox">')
            .appendTo(this.SlidesDiv)
            .prop('title', "show / hide answers")
            .css({'float':'right'});
        this.AnswersButton[0].checked = true;
        this.AnswersButton
            .change(function () {
                if (this.checked) {
                    self.RootNote.Mode = "answer-show";
                } else {
                    self.RootNote.Mode = "answer-hide";
                }
                self.UpdateQuestionMode();
            });
        // Set the question mode
        if (this.RootNote.Mode && this.RootNote.Mode == 'answer-hide') {
            this.AnswersButton[0].checked = false;
        }

        this.AnswersLabel = $('<div>')
            .appendTo(this.SlidesDiv)
            .text("answers")
            .css({'float':'right'});

        this.BrowserPanel = new BrowserPanel(
            this.BrowserDiv,
            function (viewObj) {
                self.AddViewCallback(viewObj);
            });
        this.BrowserDiv.css({'overflow-y':'auto'});

        this.SearchPanel = new SearchPanel(
            this.SearchDiv,
            function (imageObj) {
                self.AddImageCallback(imageObj);
            });
        this.ClipboardPanel = new ClipboardPanel(
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
        //.saTextEditor();

    var self = this;
    this.TextEditor.attr('contenteditable', 'false')
        .bind('input', function () {
            // Leave events are not triggering.
            self.EventuallyUpdate();
        })
        .focusin(function() {
            CONTENT_EDITABLE_HAS_FOCUS = true;
        })
        .focusout(function() {
            CONTENT_EDITABLE_HAS_FOCUS = false;
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
        if (this.ParentNote.Id) {
            // Do not save new empty user notes.
            if(userNote.Id || userNote.Text != "") {
                // Do not save the user not if it has no text.
                userNote.Save();
            }
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
        parentNote.SetUserNote(new Note());
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
        error: function() { saDebug( "AJAX - error() : getusernotes" ); },
    });
}

UserNoteEditor.prototype.LoadUserNote = function(data, parentNoteId) {
    if ( ! this.ParentNote || this.ParentNote.Id != parentNoteId) {
        // Many things could happen while waiting for the note to load.
        return;
    }

    var parentNote = this.ParentNote;
    parentNote.SetUserNote(new Note());

    if (data.Notes && data.Notes.length > 0) {
        if (data.Notes.length > 1) {
            saDebug("Warning: Only showing the first user note.");
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
    if (this.RootNote.Mode == 'answer-hide' && this.Index != 0) {
        $('.sa-multiple-choice-answer').css({'font-weight':'normal'});
        // Experiment with hiding titles too.
        var title = $('.sa-presentation-title');
        var standin = title.clone();
        title.hide();
        standin
            .appendTo(title.parent())
            .html("#" + this.Index)
            .addClass('sa-standin')
            .attr('contenteditable', 'false');
    } else {
        $('.sa-multiple-choice-answer').css({'font-weight':'bold'});
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
        CONTENT_EDITABLE_HAS_FOCUS = false;
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
    if (this.Note.Type == "HTML") {
        // TODO: Change this to pass a viewer record of the view.
        //       Maybe show all the records as options.
        this.HtmlPage.InsertView(viewObj);
        return;
    }

    var record = new ViewerRecord();
    record.Load(viewObj.ViewerRecords[0]);
    this.Note.ViewerRecords.push(record);

    this.SlidePage.DisplayNote(this.Note, PRESENTATION.Index);
}

// Callback from search.
Presentation.prototype.AddImageCallback = function(image) {
    var record = new ViewerRecord();
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
        var note = new Note();
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
    return true;
}


Presentation.prototype.HandleKeyUp = function(event) {
    // Hack to keep the slides from changing when editing.
    if ( CONTENT_EDITABLE_HAS_FOCUS) {
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
    }
    if (event.keyCode == "80" || // p
        event.keyCode == "37" || // back arrow
        event.keyCode == "38" || // up arrow
        event.keyCode == "33") { // page up
        this.GotoSlide(this.Index - 1);
    }
    if (event.keyCode == "36") { // home
        this.GotoSetSlide(0);
    }
    if (event.keyCode == "35") { // end
        this.GotoSlide(this.GetNumberOfSlides() - 1);
    }
}


Presentation.prototype.Save = function () {
    var self = this;
    this.TitlePage.UpdateEdits();
    this.SlidePage.UpdateEdits();
    this.HtmlPage.UpdateEdits();

    // It is necessary to convert
    // temporary note ids to real note ids. (for the html
    // sa-presentation-views)
    // This is also important for the user notes.  They have to save the
    // correct parent id.
    var waitingCount = 0;
    for (var i = 0; i < NOTES.length; ++i) {
        note = NOTES[i];
        if ( ! note.Id && note.Type != "UserNote" ) {
            ++waitingCount;
            note.Save(function() {
                --waitingCount;
                // Synchonize asynchronous calls.
                if (waitingCount == 0) {
                    // reenter this method to finish the rest.
                    self.Save();
                }
            });
        }
    }
    // It will take time for the ids to come back
    if (waitingCount > 0) {
        return;
    }

    // Save the user notes.  They are not saved with the parent notes like
    // the children are.
    for (var i = 0; i < NOTES.length; ++i) {
        note = NOTES[i];
        if ( note.Type == "UserNote" ) {
            if (note.Id || note.Text != "") {
                // Parent will have an id at this point.
                note.Save();
                if (note.TempId) {
                    delete note.TempId;
                }
            }
        }
    }

    // TODO:
    // Fix this. Session page needs every member view to have an image.
    // The root needs a record to show up in the session.
    var rootNote = this.RootNote;
    if (rootNote.ViewerRecords.length < 1) {
        var record = new ViewerRecord();
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

    // Replacing the temp ids in the html is harder than I would expect.
    // I change it in the save callback, but cosure magic change it back
    // Before the root note was saved.
    // Try changing them here.
    for (var i = 0; i < NOTES.length; ++i) {
        note = NOTES[i];
        if (note.TempId) {
            // Replace al the occurances of the id in the string.
            note.Text = note.Text.replace(
                new RegExp(note.TempId, 'g'), note.Id);
            delete note.TempId;
        }
    }


    //this.SaveButton.css({'color':'#F00'});
    // And finally, we can save the presentation.
    this.RootNote.Save();
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
    var note = new Note();
    if (type) { note.Type = type; }
    this.RootNote.Children.splice(idx-1,0,note);
    this.GotoSlide(idx);
    this.UpdateSlidesTab();
    if (type == 'HTML') {
        this.HtmlPage.InitializeSlidePage();
    }
    this.UpdateQuestionMode();
}

Presentation.prototype.InsertSlideCopy = function (type){
    var idx = this.Index+1;
    var note = new Note();

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


// Viewer option only works for html pages.
Presentation.prototype.ShowViewer = function(recordIdx) {
    this.AspectDiv.hide();
    //this.ViewerPage.SetViewerRecord(this.Note.ViewerRecords[recordIdx]);
    //this.ViewerPage.Div.show();

    $(window).trigger('resize');
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

    // These two are to get rid of the ViewerPage.
    //this.ViewerPage.Div.hide();
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

    if (EDIT) {
        this.SlideList
            .sortable({update: function(event,ui){self.SortCallback();},
                       handle: ".ui-icon"});
    }

    for (var i = 0; i < this.GetNumberOfSlides(); ++i) {
        // get a title
        var note = this.GetSlide(i);
        var title = note.Title;
        if (title == "") { // No title set in the note
            title = note.Text;
            var idx = title.indexOf('sa-presentation-text');
            if (idx == -1) {
                // Nothing i the text / html to use as a title.
                title = "Slide " + i;
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
            }
            // Hide titles
            if (this.RootNote.Mode == 'answer-hide') {
                title = "#"+i;
            }
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
                PRESENTATION.GotoSlide($(this).data("index"));
            });
        var sortHandle = $('<span>')
            .appendTo(slideDiv)
            .css({'position':'absolute',
                  'left':'7px',
                  'top' :'2px',
                  'opacity':'0.5'})
            .addClass('ui-icon ui-icon-bullet');
        if (EDIT) {
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
    this.List = new TextEditor(this.TextDiv, VIEWERS);
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
        this.AnnotationWidget1 = new AnnotationWidget(
            this.ViewerDiv1[0].saViewer);
        this.AnnotationWidget1.SetVisibility(2);

        this.AnnotationWidget2 = new AnnotationWidget(
            this.ViewerDiv2[0].saViewer);
        this.AnnotationWidget2.SetVisibility(2);

        // TODO: Move this to bind in jquery.  (not sure how to do this yet)
        this.ViewerDiv1[0].saViewer.OnInteraction(function () {self.RecordView1();});
        this.ViewerDiv2[0].saViewer.OnInteraction(function () {self.RecordView2();});
        this.RemoveView1Button = $('<img>')
            .appendTo(this.ViewerDiv1)
            .attr('src',"webgl-viewer/static/remove.png")
            .prop('title', "remove view")
            .addClass('editButton')
            .css({'position':'absolute',
                  'right':'0px',
                  'top':'0px',
                  'width':'12px',
                  'height':'12px',
                  'z-index':'5'})
            .click(function () {
                PRESENTATION.Note.ViewerRecords.splice(0,1);
                // Redisplay the viewers
                self.DisplayNote(self.Note, PRESENTATION.Index);
            });
        this.RemoveView2Button = $('<img>')
            .appendTo(this.ViewerDiv2)
            .attr('src',"webgl-viewer/static/remove.png")
            .prop('title', "remove view")
            .addClass('editButton')
            .css({'position':'absolute',
                  'right':'0px',
                  'top':'0px',
                  'width':'12px',
                  'height':'12px',
                  'z-index':'5'})
            .click(function () {
                PRESENTATION.Note.ViewerRecords.splice(1,1);
                // Redisplay the viewers
                self.DisplayNote(self.Note, PRESENTATION.Index);
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
        .attr('src',"webgl-viewer/static/fullscreenOn.png")
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
        .attr('src',"webgl-viewer/static/fullscreenOn.png")
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
        .attr('src',"webgl-viewer/static/fullscreenOff.png")
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
        PRESENTATION.EditOff();
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
        if (EDIT) {
            PRESENTATION.EditOn();
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
    if (EDIT && this.Edit) {
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
        //VIEWER.MainView.CanvasDiv.resizable('disable');
    }
}


SlidePage.prototype.EditOn = function () {
    if (EDIT &&  ! this.Edit) {
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
        this.Records[0].Apply(this.ViewerDiv1[0].saViewer);
    }
    if (this.Records.length > 1) {
        this.Records[1].Apply(this.ViewerDiv2[0].saViewer);
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
        this.Note.ViewerRecords[0].Apply(this.ViewerDiv1[0].saViewer);
    } else if (this.Note.ViewerRecords.length == 2) {
        this.Note.ViewerRecords[1].Apply(this.ViewerDiv2[0].saViewer);
    }

    this.DisplayNote(this.Note, PRESENTATION.Index);
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
              'font-color':'#FFF'});
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
              'font-color':'#888',
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
            .focusin(function() { CONTENT_EDITABLE_HAS_FOCUS = true;})
            .focusout(function() { CONTENT_EDITABLE_HAS_FOCUS = false;});
        this.AuthorText
            .focusin(function() { CONTENT_EDITABLE_HAS_FOCUS = true;})
            .focusout(function() { CONTENT_EDITABLE_HAS_FOCUS = false;});
    }
}


TitlePage.prototype.EditOff = function () {
    if (EDIT && this.Edit) {
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
    if (EDIT &&  ! this.Edit) {
        this.Edit = true;
        //this.Div.css({'width': '100%', 'left': '0px'}); ???
        this.Title
            .attr('contenteditable', 'true')
            .attr('spellcheck', 'true')
            .focusin(function() { CONTENT_EDITABLE_HAS_FOCUS = true;})
            .focusout(function() { CONTENT_EDITABLE_HAS_FOCUS = false;});
        this.AuthorText.attr('readonly', 'readonly')
            .attr('contenteditable', 'true')
            .attr('spellcheck', 'true')
            .focusin(function() { CONTENT_EDITABLE_HAS_FOCUS = true;})
            .focusout(function() { CONTENT_EDITABLE_HAS_FOCUS = false;});
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
    if (EDIT && this.Edit) {
        this.Edit = false;
        this.Div.css({'width': '100%', 'left': '0px'});
        this.SaEditOff();
    }
}
HtmlPage.prototype.EditOn = function () {
    if (EDIT &&  ! this.Edit) {
        this.Edit = true;
        // this.Div.css({'width': '100%', 'left': '0px'}); ???
        this.SaEditOn();
    }
}

// Hide/show the edit gui on all the sa elements
HtmlPage.prototype.SaEditOff = function () {
    $('.sa-annotation-widget').saAnnotationWidget('hide');
    $('.sa-edit-gui').saButtons('disable');
    $('.sa-presentation-text').attr('contenteditable', 'false');

}
HtmlPage.prototype.SaEditOn = function () {
    $('.sa-annotation-widget').saAnnotationWidget('show');
    $('.sa-edit-gui').saButtons('enable');
    $('.sa-presentation-text').attr('contenteditable', 'true');
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

    // hack to get rid of tmp ids.  I can not reproduce the problem.
    if ( ! note.TempId && note.Text && note.Id) {
        var idx0 = note.Text.indexOf('sa-note-id="tmp');
        while (idx0 >= 0) {
            idx0 += 12;
            var idx1 = note.Text.indexOf('"',idx0);
            var tmpId = note.Text.substring(idx0,idx1);
            console.log("Replacing temp id " + tmpId + " with " + note.Id);
            note.Text = note.Text.replace(tmpId, note.Id);
            idx0 = note.Text.indexOf('sa-note-id="tmp');
        }
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
    if ( ! EDIT) {
        $('.sa-text-editor').attr('contenteditable', "false")
    }

    // Change the edit status of the elements.
    this.Div.find('.sa-presentation-image')
        .saLightBox({'editable':EDIT,
                     'aspectRatio':true});
    this.Div.find('.sa-lightbox-viewer')
        .saLightBoxViewer({'editable':EDIT});
    this.Div.find('.sa-presentation-rectangle')
        .saRectangle({'editable':EDIT});
    // Make viewers into lightbox elements.
    // MOVE
    //this.InitializeViews(this.Div.find('.sa-presentation-view'));

    // Set stops.
    $('sa-draggable').saDraggable();
    // still needed for iframes.
    this.BindElements();

    this.ShuffleQuestion();
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
              'left':'10%',
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
              'left':'18%',
              'top':'8%'})
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
                     editable: EDIT})
        .addClass('sa-presentation-image');
    var img = $('<img>')
        .appendTo(imgDiv)
        .attr('src',src);

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
              'position':'absolute',
              'left':left,
              'width':width,
              'top':top,
              'height':height})
        .saRectangle({editable: EDIT});
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
              // defaults caller can reset these.
              'left' : '5%',
              'top'  : '30%',
              'z-index':'1'})
        .addClass('sa-presentation-text')
        // This makes the font scale with height of the window.
        .saScalableFont({scale:scale})
        // default content
        .text("Text");

    if (this.Edit) {
        // Make this div into a text editor.
        text.saTextEditor({dialog:true});
        text.saDraggable();
        text.saDeletable();
    }

    return text;
}

HtmlPage.prototype.ShuffleQuestion = function() {
    var questions = this.Div.find('.sa-multiple-choice-question');
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
    var self = this;

    CONTENT_EDITABLE_HAS_FOCUS = true;
    var dialog = $('<div>')
        .dialog({
            modal: false,
            resizable:true,
            minWidth: 450,
            beforeClose: function() {
                CONTENT_EDITABLE_HAS_FOCUS = false;
            },
            buttons: {
                "create": function () {
                    // This creates the question from the dialog entries.
                    var textBox = self.InsertTextBox(22);
                    textBox
                        .html(self.Question.html())
                        .css({'background-color':'#ffffff',
                              'border':'1px solid #AAA',
                              'left':'2%',
                              'width': '90%',
                              'top': '75%',
                              'height':'20%'})
                    if (self.MultipleChoiceOptions.length > 0) {
                        // MULTIPLE CHOICE
                        var q = $('<ol>')
                            .appendTo(textBox)
                            .addClass('sa-multiple-choice-question');
                        var a = $('<li>')
                            .appendTo(q)
                            .text(self.MultipleChoiceAnswer.html())
                            .addClass('sa-multiple-choice-answer');
                        for (var i = 0; i < self.MultipleChoiceOptions.length; ++i) {
                            var a = $('<li>')
                                .appendTo(q)
                                .text(self.MultipleChoiceOptions[i].html());
                        }
                        self.ShuffleQuestion();
                    } else {
                        // SHORT ANSWER
                        var q = $('<ol>')
                            .appendTo(textBox)
                            .addClass('sa-short-answer-question');
                        var a = $('<li>')
                            .appendTo(q)
                            .text(self.Answer.html())
                            .addClass('sa-short-answer');
                    }

                    PRESENTATION.UpdateQuestionMode();

                    $(this).dialog("destroy");
                }
            }
        });

    // TODO: Do not make these instance variables of presentation.


    this.QuestionTypeSelect = $('<select>')
        .appendTo(dialog);
    this.QuestionTypeMultipleChoice = $('<option>')
        .appendTo(this.QuestionTypeSelect)
        .text("Multiple Choice");
    this.QuestionTypeSortAnswer = $('<option>')
        .appendTo(this.QuestionTypeSelect)
        .text("Short Answer");
    this.QuestionTypeTrueFalse = $('<option>')
        .appendTo(this.QuestionTypeSelect)
        .text("True or False");
    this.QuestionTypeSelect.change(function (){alert("select")});

    this.QuestionLabel = $('<div>')
        .appendTo(dialog)
        .text("Question:");
    this.Question = $('<div>')
        .appendTo(dialog)
        .css({'border':'1px solid #AAA',
              'margin':'2px'})
        .attr('contenteditable', 'true');

    this.MultipleChoiceDiv = $('<div>')
        .appendTo(dialog);
    this.MultipleChoiceAnswerLabel = $('<div>')
        .appendTo(this.MultipleChoiceDiv)
        .addClass('sa-answer')
        .text("Answer:");
    this.MultipleChoiceAnswer = $('<div>')
        .appendTo(this.MultipleChoiceDiv)
        .css({'border':'1px solid #AAA',
              'margin':'2px'})
        .attr('contenteditable', 'true');

    this.MultipleChoiceOptionLabel = $('<div>')
        .appendTo(this.MultipleChoiceDiv)
        .text("Options:");
    this.MultipleChoiceOptions = [];
    this.MultipleChoiceAddOptionButton = $('<button>')
        .appendTo(this.MultipleChoiceDiv)
        .text("+ Option")
        .click(function () {
            var option = $('<div>')
                .insertBefore(self.MultipleChoiceAddOptionButton)
                .css({'border':'1px solid #AAA',
                      'margin':'2px'})
                .attr('contenteditable', 'true');
            self.MultipleChoiceOptions.push(option);
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
    var newNote = new Note();
    newNote.Load(viewObj);
    if (newNote.ViewerRecords.length > 0) {
        this.InsertViewerRecord(newNote.ViewerRecords[0]);
    } else {
        saDebug("Insert failed: Note has no viewer records.");
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
        .saLightBoxViewer({'note'         : this.Note,
                           'viewerIndex'  : viewerIdx,
                           'hideCopyright': true,
                           'interaction'  : false,
                           'editable'     : EDIT});
    // MOVE
        //.addClass('sa-presentation-view')
        //.saAnnotationWidget("hide")
    //this.InitializeViews(viewerDiv);

    return viewerDiv;
}

// This is done on creation and when it is realoded so I am making it its
// own function.  I do not want to put this into the viewer-utilities
// because it is too specific to presentations.  I could make a composite
// lightboxViewer jquery element though.
// TODO: Make this a composite lightboxviewer.
/* MOVE
HtmlPage.prototype.InitializeViews = function(viewerDiv) {
    viewerDiv
        .saViewer({'hideCopyright': true,
                   'overview'     : false})
        .saAnnotationWidget("hide")
        .saLightBox(
            {editable:EDIT,
             onExpand : function(expanded) {
                 viewerDiv.saViewer({interaction:expanded});
                 if (expanded) {
                     viewerDiv.saAnnotationWidget("show");
                     viewerDiv.saViewer({overview : true,
                                         menu     : true});
                 } else {
                     viewerDiv.saAnnotationWidget("hide");
                     viewerDiv.saViewer({overview : false,
                                         menu     : false});
                     // TODO: Formalize this hack. Viewer formally needs a note.
                     // If not editable, restore the note.
                     var viewer = viewerDiv[0].saViewer;
                     var note = viewer.saNote;
                     var index = viewer.saViewerIndex || 0;
                     if ( ! EDIT && note) {
                         note.ViewerRecords[index].Apply(viewer);
                     }
                 }
             }
            });
}
*/

// NOTE: This should be lagacy now.  The jquery extensions should handle this.
// Text elements need to resize explicitly.
// TODO: Activate text (saScalatFont, saTextEditor, resize) on load.
// I could make this scalabe ifram as a jquery extension too.
HtmlPage.prototype.BindElements = function() {
    // Similar to text, we need to scale the content.
    frameElements = $('.sa-presentation-iframe');
    frameElements.addClass('sa-resize');
    for (var i = 0; i < frameElements.length; ++i) {
        frame = frameElements[i];
        frame.onresize =
            function () {
                var w = $(this).parent().width();
                var h = $(this).parent().height();
                scale = Math.min(h,w/1.62) / 700;
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
        // NOTE: THIS ASSUME THAT ALL THE VIEWERS USE THIS NOTE!!!
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



// TODO: Simplify this.
//==============================================================================
// I am making a full fledge viewer for the full window option.
function ViewerPage (parent, edit) {
    this.Note = null;
    this.RecordIndex = 0;

    // Should I make another div or just use the parent?
    this.Div = $('<div>')
        .appendTo(parent)
        .hide()
        .css({
            'background-color':'#FFF',
            'position' : 'absolute',
            'width': '100%',
            'height': '100%'});

    // TODO: Get Rid of EVENT_MANAGER and CANVAS globals.
    EVENT_MANAGER = new EventManager(CANVAS);

    DUAL_DISPLAY = new DualViewWidget(this.Div);
    // TODO: Is this really needed here?  Try it at the end.
    //handleResize();

    // TODO: Get rid of this global variable.
    NAVIGATION_WIDGET = new NavigationWidget(this.Div,DUAL_DISPLAY);

    //NOTES_WIDGET = new NotesWidget(this.Div, DUAL_DISPLAY);
    //NOTES_WIDGET.SetModifiedCallback(NotesModified);
    //NOTES_WIDGET.SetModifiedClearCallback(NotesNotModified);

    // It handles the singlton global.
    // Not now
    //new RecorderWidget(DUAL_DISPLAY);

    // Do not let guests create favorites.
    // TODO: Rework how favorites behave on mobile devices.
    if (USER != "" && ! MOBILE_DEVICE) {
        if ( EDIT) {
            // Put a save button here when editing.
            SAVE_BUTTON = $('<img>')
                .appendTo(this.Div)
                .css({'position':'absolute',
                      'bottom':'4px',
                      'left':'10px',
                      'height': '28px',
                      'z-index': '5'})
                .prop('title', "save to databse")
                .addClass('editButton')
                .attr('src',"webgl-viewer/static/save22.png")
                .click(SaveCallback);
            //for (var i = 0; i < DUAL_DISPLAY.Viewers.length; ++i) {
            //    DUAL_DISPLAY.Viewers[i].OnInteraction(
            //        function () {NOTES_WIDGET.RecordView();});
            //}
        } else {
            // Favorites when not editing.
            FAVORITES_WIDGET = new FavoritesWidget(this.Div, DUAL_DISPLAY);
            FAVORITES_WIDGET.HandleResize(CANVAS.innerWidth());
        }
    }

    if (MOBILE_DEVICE) {
        NAVIGATION_WIDGET.SetVisibility(false);
        //MOBILE_ANNOTATION_WIDGET.SetVisibility(false);
    }

    // The event manager still handles stack alignment.
    // This should be moved to a stack helper class.
    // Undo and redo too.
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    // Keep the browser from showing the left click menu.
    document.oncontextmenu = cancelContextMenu;

    if ( ! MOBILE_DEVICE) {
        InitSlideSelector(this.Div);
        var viewMenu1 = new ViewEditMenu(DUAL_DISPLAY.Viewers[0],
                                         DUAL_DISPLAY.Viewers[1]);
        var viewMenu2 = new ViewEditMenu(DUAL_DISPLAY.Viewers[1],
                                         DUAL_DISPLAY.Viewers[0]);

        var annotationWidget1 = new AnnotationWidget(DUAL_DISPLAY.Viewers[0]);
        annotationWidget1.SetVisibility(2);
        var annotationWidget2 = new AnnotationWidget(DUAL_DISPLAY.Viewers[1]);
        annotationWidget1.SetVisibility(2);
        DUAL_DISPLAY.UpdateGui();
    }

    $(window).bind('orientationchange', function(event) {
        handleResize();
    });

    $(window).resize(function() {
        handleResize();
    }).trigger('resize');
}


ViewerPage.prototype.SetNote = function(note) {
    //NOTES_WIDGET.SetRootNote(note);
    note.DisplayView(DUAL_DISPLAY);
    eventuallyRender();
}


ViewerPage.prototype.SetViewerRecord = function(record) {
    var note = new Note();
    note.ViewerRecords.push(record);
    this.SetNote(note);
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
        .focusin(function() { CONTENT_EDITABLE_HAS_FOCUS = true;})
        .focusout(function() { CONTENT_EDITABLE_HAS_FOCUS = false;});
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
            saDebug( "AJAX - error() : query" );
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
        imgObj = data.images[i];

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
        var thumb = new CutoutThumb(image, 100);
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
            } else { saDebug("ajax failed - get favorite views 2"); }
        },
        error: function() { saDebug( "AJAX - error() : getfavoriteviews 2" );
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
                saDebug( "AJAX - error() : deleteusernote" );
            },
        });
    }
}





