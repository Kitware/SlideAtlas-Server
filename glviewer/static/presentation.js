// CME
// TODO:
// fix font color.
// Embed video
// Stack and subnotes.
// Session browser.
// Added viewer flickers and changes camera when resized.


//   Allow for relative font sizes in a saScalableFontDiv.
// Change font size in gui.
// Change font color in GUI.
// Title note type: HtmlSlide
// Add GUI to add slides and slide items.
// Background of thumbs should be white.
// text showing up the wrong size in title bar when first loaded.





// TODO:
// First: content.
// Actual title page.
// 1: jquery iFrame.
// 2: isolate dragable for iFrame.
// 3: editable off option for text.
// 4: HtmlPage not expanding during presentation.


//==============================================================================
// TODO:
// - Resize the view area to fit the note text.
// - Edit mode: resize views
// - Allow views to go full screen.
// - Sortable slides in slide div.
// - Stop the timer when we leave full screen. Turn editing back on if EDIT.


//==============================================================================
// hack a presentation mode:
// presentation object?


// Only called by the presentation html file.
// Getting rid of this.
// Main function called by the presentation.html template
/*function PresentationMain(viewId) {
    // We need to get the view so we know how to initialize the app.
    var rootNote = new Note();

    rootNote.LoadViewId(
        viewId,
        function () {
            PRESENTATION = new Presentation(rootNote, EDIT);
        });
}
*/


//==============================================================================

function Presentation(rootNote, edit) {
    var self = this;
    this.Edit = edit;
    // We need this to know what to return to when a view goes full screen.
    this.FullScreen = false;

    // TODO:
    // Fix this. Session page needs every member view to have an image.
    // The root needs a record to show up in the session.
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

    // Eliminate the GUI in the viewers.
    MOBILE_DEVICE = "Simple";
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

    this.PresentationDiv = $('<div>')
        .appendTo(this.WindowDiv)
        .css({'position':'absolute',
              'top':'0px',
              'left':'0px',
              'width':'100%',
              'height':'100%'});
    // A window with a contant aspect ratio that fits in
    // the PresentationDiv.
    this.AspectDiv = $('<div>')
        .css({'border' :'1px solid #AAA'})
        .appendTo(this.PresentationDiv)
        .saPresentation({aspectRatio : 1.333});

    if (this.Edit) {
        // I am trying a new pattern.  Jquery UI seems to use it.
        // Modify a div after it is created.  That way the creator has full
        // standard access to jquery methods.
        this.LeftPanel = $('<div>')
            .appendTo(this.WindowDiv)
            .css({'position':'absolute',
                  'left':'0px',
                  'right':'0px',
                  'height':'100%',
                  'width':'25%'});
        this.MakeEditPanel(this.LeftPanel);
        this.PresentationDiv
            .css({'left':'25%',
                  'width':'75%'});
    }

    // Float the two slide show buttons in the upper right corner.
    this.ShowButton = $('<img>')
        .appendTo(this.PresentationDiv)
        .prop('title', "present")
        .addClass('editButton')
        .attr('src','webgl-viewer/static/slide_show.png')
        .css({'position':'absolute',
              'top':'2px',
              'right':'0px',
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
              'right':'26px',
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
    this.HtmlPage  = new HtmlPage(this.AspectDiv, edit);

    this.RootNote = rootNote;
    this.GotoSlide(0);

    // Keep the browser from showing the left click menu.
    document.oncontextmenu = cancelContextMenu;

    //document.onkeyup = function(e) {self.HandleKeyUp(e);};
    $('body').keyup(function(e) {self.HandleKeyUp(e);});

    if (EDIT) {
        this.UpdateSlidesTab();
    }
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
        this.EditTabs.Div.hide();
        this.TitlePage.EditOff();
        this.SlidePage.EditOff();
        this.HtmlPage.EditOff();
        this.DeleteSlideButton.hide();
        this.PresentationDiv
            .css({'left':'0%',
                  'width':'100%'});
        this.LeftPanel.hide();
    }
}


Presentation.prototype.EditOn = function () {
    if (this.FullScreen) { return; }
    if (EDIT && ! this.Edit) {
        this.Edit = true;
        this.EditTabs.Div.show();
        this.TitlePage.EditOn();
        this.SlidePage.EditOn();
        this.HtmlPage.EditOn();
        this.DeleteSlideButton.show();
        this.PresentationDiv
            .css({'left':'25%',
                  'width':'75%'});
        this.LeftPanel.show();
    }
}


Presentation.prototype.MakeEditPanel = function (parent) {
    this.EditTabs = new TabbedDiv(parent);
    this.EditTabs.Div.css({'width':'100%',
                          'height':'100%'})

    this.SlidesDiv = this.EditTabs.NewTabDiv("Slides");
    this.ClipboardDiv = this.EditTabs.NewTabDiv("Clipboard");
    this.SearchDiv = this.EditTabs.NewTabDiv("Search");

    var self = this;

    this.SlidesDiv
        .css({'text-align': 'left',
              'color': '#303030',
              'font-size': '18px'});
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
            'New Slide'    : function () {self.InsertNewSlide("HTML");},
            'New Question' : function () {alert("Question not implemented yet");},
            'Insert Text'  : function () {self.HtmlPage.InsertTextBox();},
            'Insert Rectangle': function () {
                self.HtmlPage.InsertRectangle('#073E87','0%','60%','97.5%','14%');},
            'Insert Image' : function () {self.InsertImage();}
        });
    $('<img>')
        .appendTo(this.InsertMenuButton)
        .attr('src','webgl-viewer/static/new_window.png');

    // The div that will hold the list of slides.
    this.SlideList = $('<div>')
        .appendTo(this.SlidesDiv)
        .css({'position':'absolute',
              'width':'100%',
              'top':'32px',
              'bottom':'3px',
              'overflow-y':'auto'});

    this.ClipboardPanel = new ClipboardPanel(
        this.ClipboardDiv,
        function (viewObj) {
            self.AddViewCallback(viewObj);
        });
    this.SearchPanel = new SearchPanel(
        this.SearchDiv,
        function (imageObj) {
            self.AddImageCallback(imageObj);
        });

    this.EditTabs.ShowTabDiv(this.SlidesDiv);
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
    this.SlidePage.AnnotationWidget1.SetVisibility(false);
    this.SlidePage.AnnotationWidget2.SetVisibility(false);
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
    record.OverViewBounds = image.bounds;
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

    // Hack hack hack.  I should just hang onto the DOM for each slide
    // rather than reloading with saHtml.  It is necessary to convert
    // temporary note ids to real note ids.
    for (var i = 0; i < NOTES.length; ++i) {
        note = NOTES[i];
        if ( ! note.Id ) {
            note.Save(function() {
                // This could break if save sets more than one id.
                note.Text.replace(note.TempId, note.Id);
                self.Save();
            });
            return;
        }
    }
    //this.SaveButton.css({'color':'#F00'});
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
}

Presentation.prototype.InsertImage = function () {
    var src = prompt("Image URL", "https://slide-atlas.org/static/img/SlideAtlas_home.jpg");
    this.HtmlPage.InsertImage(src);
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
    } else { // Slide page
        this.Note = this.GetSlide(index);
        if (this.Note.Type == "HTML") {
            this.TitlePage.Div.hide();
            this.SlidePage.Div.hide();
            this.HtmlPage.Div.show();
            this.HtmlPage.DisplayNote(this.Note);
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


Presentation.prototype.UpdateSlidesTab = function (){
    // Add the title page 
    this.SlideList.empty();

    for (var i = 0; i < this.GetNumberOfSlides(); ++i) {
        //var slide = this.GetSlide(i);
        var slideDiv = $('<div>')
            .appendTo(this.SlideList)
            .css({'padding-left':'1.5em',
                  'padding-right':'1.5em',
                  'margin': '5px',
                  'border':'2px outset #CCC'})
            .text("Slide " + i)
            .data("index",i)
            .hover(
                function() {$(this).css({'background':'#EEE'});},
                function() {$(this).css({'background':'#FFF'});})
            .click(function () {
                PRESENTATION.GotoSlide($(this).data("index"));
            });
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
                  'width': '100%',
                  'height': 'auto'});
    // TODO: Get rid of this global variable.
    VIEW_PANEL = this.ViewPanel;

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
                this.saViewer.Focus = true;
                self.UpdateEdits();
                $(window).trigger('resize');
            });
        this.ViewerDiv1
            .resize(function () {
                this.saViewer.Focus = false;
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
                this.saViewer.Focus = true;
                self.UpdateEdits();
                $(window).trigger('resize');
            });
        this.ViewerDiv2
            .resize(function () {
                this.saViewer.Focus = false;
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
function HtmlPage (parent, edit) {
    this.Edit = edit;
    this.Note = null;
    // Should I make another div or just use the parent?
    this.Div = $('<div>')
        .appendTo(parent)
        .hide()
        .css({
            'background-color':'#E5F3FE',
            'position' : 'absolute',
            'width': '100%',
            'height': '100%'});
}


HtmlPage.prototype.EditOff = function () {
    if (EDIT && this.Edit) {
        this.Edit = false;
        this.Div.css({'width': '100%', 'left': '0px'});
    }
}


HtmlPage.prototype.EditOn = function () {
    if (EDIT &&  ! this.Edit) {
        this.Edit = true;
        // this.Div.css({'width': '100%', 'left': '0px'}); ???
    }
}


HtmlPage.prototype.ClearNote = function () {
    if (this.Edit && this.Note) {
        this.UpdateEdits();
    }
    this.Note = null;
}


HtmlPage.prototype.DisplayNote = function (note) {
    this.Note = note;
    this.Div.show();
    // This version setsup the saTextEditor and other jquery extensions.
    this.Div.saHtml(note.Text);
    this.Div.find('.sa-presentation-view').saViewer({'hideCopyright':true});
    // still needed for iframes.
    this.BindElements();
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
        .text("Title");

    this.UpdateEdits();
    this.BindElements();
}

// TODO: make sa jquery handle this. 
HtmlPage.prototype.InsertImage = function(src) {
    // resizable makes a containing div anyway.
    var imgDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'left'    :'5%',
              'top'     :'25%'})
        .addClass('sa-presentation-image')
        .attr('contenteditable', 'true')
        .saDraggable()
        .saDeletable();
    var img = $('<img>')
        .appendTo(imgDiv)
        .attr('src',src)
        .load(function () {
            // compute the aspect ratio.
            var aRatio = $(this).width() / $(this).height();
            imgDiv.saResizable({
                aspectRatio: aRatio,
            });
            img.css({'height' :'100%',
                     'width'   :'100%'});
        });

    return imgDiv;
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
    .saDraggable()
    .saDeletable()
    .saResizable();
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


HtmlPage.prototype.InsertIFrame = function(src) {
    // iframes do not scale with css.  I have to have a resize callback.
    var div = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'left':'5%',
              'right':'2.5%',
              'top':'25%',
              'bottom':'10%'})
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
              'left' : '18%',
              'top'  : '90%'})
        .addClass('sa-presentation-text')
        // This makes the font scale with height of the window.
        .saScalableFont({scale:scale})
        // default content
        .text("Text");

    if (this.Edit) {
        // Make this div into a text editor.
        text.saTextEditor({dialog:true});
    }

    return text;
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
    this.InsertViewerRecord(newNote);
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

    var viewerDiv = $('<div>')
        .appendTo(this.Div)
        .addClass('sa-presentation-view')
        .css({'position':'absolute',
              'box-shadow': '10px 10px 5px #AAA',
              'background-color':'#FFF',
              'opacity':'1.0',
              'left':'5%',
              'right':'2.5%',
              'top':'25%',
              'bottom':'10%'})
        .saViewer({'note': this.Note,
                   'viewerIndex':viewerIdx,
                   'hideCopyright':true})
        .saDeletable()
        .saDraggable()
        .saResizable()
        .saFullWindowOption();

    return viewerDiv;
}


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
        this.Div.find('.sa-presentation-view').saRecordViewer();
        // Doing this here forces us to save the notes
        // TODO: This may created orphaned views. fix this be either
        // delaying copying saHtml to note, or incrementally saving
        // presentation to the database.
        var htmlDiv = this.Div;
        var note = this.Note;
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


