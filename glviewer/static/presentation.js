//==============================================================================
// TODO:
// - !!!!!!!!!!!!!!!!!!!!!! Copy note needs to change ids in html
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
function PresentationMain(viewId) {
    // We need to get the view so we know how to initialize the app.
    var rootNote = new Note();

     rootNote.LoadViewId(
        viewId,
        function () {
            PRESENTATION = new Presentation(rootNote, EDIT);
        });
}


//==============================================================================

function Presentation(rootNote, edit) {
    var self = this;
    this.Edit = edit;

    if (rootNote.Type != "Presentation") {
        rootNote.Type = "Presentation";
        rootNote.Save();
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
            'bottom':'0em',
            'position':'fixed',
            'left':'0em',
            'right':'0em',
            'width': 'auto'});

    if (this.Edit) {
        this.MakeEditPanel();
    }

    // Float the two slide show buttons in the upper right corner.
    this.ShowButton = $('<img>')
        .appendTo(this.WindowDiv)
        .prop('title', "present")
        .addClass('editButton')
        .attr('src','webgl-viewer/static/slide_show.png')
        .css({'position':'absolute',
              'top':'2px',
              'right':'0px',
              'width':'20px',
              'z-index':'5'})
        .click(function () {
            self.FullScreen();
        });
    this.TimerButton = $('<img>')
        .appendTo(this.WindowDiv)
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

    this.TitlePage = new TitlePage(this.WindowDiv, edit);
    this.SlidePage = new SlidePage(this.WindowDiv, edit);

    this.RootNote = rootNote;
    this.GotoSlide(0);

    // Keep the browser from showing the left click menu.
    document.oncontextmenu = cancelContextMenu;

    // The event manager still handles stack alignment.
    // This should be moved to a stack helper class.
    // Undo and redo too.
    document.onkeydown = function(e) {self.HandleKeyDown(e);};
    document.onkeyup = function(e) {self.HandleKeyUp(e);};

    if (EDIT) {
        this.UpdateSlidesTab();
    }

    $(window).resize(function() {
        self.HandleResize();
    }).trigger('resize');

    eventuallyRender();
}


Presentation.prototype.StartTimerShow = function () {
    var self = this;
    EVENT_MANAGER.FocusOut();
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
                //document.onkeydown = function(e) {self.HandleKeyDown(e);};
                //document.onkeyup = function(e) {self.HandleKeyUp(e);};
                EVENT_MANAGER.FocusIn();
            },
            buttons: {
                "Start": function () {
                    self.FullScreen();
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


Presentation.prototype.FullScreen = function () {
    var elem = document.body;

    this.EditOff();
    this.HandleResize();
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

    // detect when we leav full screen.
    $(elem).bind(
        'webkitfullscreenchange mozfullscreenchange fullscreenchange',
        function(e) {
            var state = document.fullScreen || document.mozFullScreen ||
                document.webkitIsFullScreen;
            var event = state ? 'FullScreenOn' : 'FullScreenOff';

            // TODO: Stop the timer when we leave full screen.
            // Turn editing back on if EDIT.
        });
}


Presentation.prototype.EditOff = function () {
    if (EDIT && this.Edit) {
        this.Edit = false;
        this.EditTabs.Div.hide();
        this.TitlePage.EditOff();
        this.SlidePage.EditOff();
    }
}


Presentation.prototype.MakeEditPanel = function () {
    this.EditTabs = new TabbedDiv(this.WindowDiv);
    this.EditTabs.Div.css({'width':'25%'})

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
    this.InsertSlideButton = $('<img>')
        .appendTo(this.SlidesDiv)
        .prop('title', "new slide")
        .addClass('editButton')
        .attr('src','webgl-viewer/static/new_window.png')
        .css({'float':'right'})
        .click(function () { self.InsertNewSlide();});
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
        EVENT_MANAGER.FocusIn();
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

Presentation.prototype.RecordView1 = function() {
    if (this.Edit && this.Note &&
        this.Note.ViewerRecords.length > 0 &&
        this.Note.ViewerRecords[0]) {
        this.Note.ViewerRecords[0].CopyViewer(VIEWER1);
    }
}

Presentation.prototype.RecordView2 = function() {
    if (this.Edit && this.Note &&
        this.Note.ViewerRecords.length > 1 &&
        this.Note.ViewerRecords[1]) {
        this.Note.ViewerRecords[1].CopyViewer(VIEWER2);
    }
}

Presentation.prototype.AddViewCallback = function(viewObj) {
    var record = new ViewerRecord();
    record.Load(viewObj.ViewerRecords[0]);
    this.Note.ViewerRecords.push(record);
    // The root needs a record to show up in the session.
    if (this.RootNote.ViewerRecords.length == 0) {
        this.RootNote.ViewerRecords.push(record);
    }

    // Hack to reload viewer records.
    this.GotoSlide(this.Index);
}

// Callback from search.
Presentation.prototype.AddImageCallback = function(image) {
    var note = new Note();
    var record = new ViewerRecord();
    note.ViewerRecords[0] = record;
    record.OverViewBounds = image.bounds;
    record.Image = image;
    record.Camera = {FocalPoint:[(image.bounds[0]+image.bounds[1])/2,
                                 (image.bounds[2]+image.bounds[3])/2, 0],
                     Roll: 0,
                     Height: (image.bounds[3]-image.bounds[2]),
                     Width : (image.bounds[1]-image.bounds[0])};

    this.Note.ViewerRecords.push(record);
    // The root needs a record to show up in the session.
    if (this.RootNote.ViewerRecords.length == 0) {
        this.RootNote.ViewerRecords.push(record);
    }

    // Hack: Since GotoSlide copies the viewer to the record,
    // We first have to push the new record to the view.
    if (this.Note.ViewerRecords.length == 1) {
        this.Note.ViewerRecords[0].Apply(VIEWER1);
    } else if (this.Note.ViewerRecords.length == 2) {
        this.Note.ViewerRecords[1].Apply(VIEWER2);
    }

    // Hack to reload viewer records.
    this.GotoSlide(this.Index);
}


// Getting resize right was a major pain.
Presentation.prototype.HandleResize = function() {
    var width = CANVAS.width();
    var height = CANVAS.height();

    if(height == 0){
      height = window.innerHeight;
    }

    // Presentation specific stuff

    // Setup the view panel div to be the same as the two viewers.
    this.WindowDiv
        .css({'left':   '0px',
              'width':  width+'px',
              'top':    '0px',
              'height': height+'px'});

    // Now position the viewers in the view panel.
    this.SlidePage.ResizeViews();
}


Presentation.prototype.HandleKeyDown = function(event) {
}


Presentation.prototype.HandleKeyUp = function(event) {
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


Presentation.prototype.Save = function (){
    var self = this;
    if (this.Index == 0) {
        this.TitlePage.UpdateEdits();
        this.SlidePage.UpdateEdits();
    }
    //this.SaveButton.css({'color':'#F00'});
    this.WindowDiv.css({'cursor':'progress'});
    this.RootNote.Save(
        function() {
            //PRESENTATION.SaveButton.css({'color':'#000'});
            self.SearchDiv.css({'cursor':'default'});
        });
}


Presentation.prototype.DeleteSlide = function (index){
    var maxIdx = this.GetNumberOfSlides() - 1;
    if (index < 1 || index > maxIdx) {
        return;
    }
    if (this.Index > index || this.Index == maxIdx) {
        // Handles the case where we are on the last slide.
        // Move to the previous rather then the next.
        this.Index -= 1;
    }
    this.RootNote.Children.splice(index-1,1);
    this.GotoSlide(this.Index);
}


Presentation.prototype.InsertNewSlide = function (){
    var idx = this.Index+1;
    var note = new Note();
    this.RootNote.Children.splice(idx-1,0,note);
    this.GotoSlide(idx);
    this.UpdateSlidesTab();
}

// 0->Root/titlePage
// Childre/slidesn start at index 1
Presentation.prototype.GotoSlide = function (index){
    if (index < 0 || index >= this.GetNumberOfSlides()) {
        return;
    }
    // Insert view calls Goto with the same index.
    // We do not want to overwrite the new view with a blank viewer.
    if (this.Edit && index != this.Index) {
        // Save any GUI changesinto the note before 
        // we move to the next slide.
        if (this.Index == 0) {
            this.TitlePage.UpdateEdits();
        } else {
            this.SlidePage.UpdateEdits();
        }
    }


    this.Index = index;
    if (index == 0) { // Title page
        this.SlidePage.Div.hide();
        this.Note = this.RootNote;
        this.TitlePage.DisplayNote(this.Note);
    } else { // Slide page
        this.TitlePage.Div.hide();
        this.Note = this.GetSlide(index);
        this.SlidePage.DisplayNote(index, this.Note);
    }
    // Start preloading the next slide.
    if (index < this.RootNote.Children.length) {
        var nextNote = this.RootNote.Children[index];
        if (nextNote.ViewerRecords.length > 0) {
            nextNote.ViewerRecords[0].LoadTiles(VIEWER1.GetViewport());
        }
        if (nextNote.ViewerRecords.length > 1) {
            nextNote.ViewerRecords[1].LoadTiles(VIEWER2.GetViewport());
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
// TODO:
// Get rid of the width dependency on edit
function SlidePage(parent, edit) {
    var self = this;
    this.FullWindowView = null;
    this.Edit = edit;
    this.Note = null;
    this.Records = []; // views.

    this.Div = $('<div>')
        .appendTo(parent)
        .hide()
        .css({
            'position' : 'absolute',
            'width': '100%',
            'height': '100%',
            'border': '1px solid #AAA'});
    if (edit) {
        // get rid of this.
        // parent should resize, and this object should just follow.
        this.Div
            .css({
                'top': '0%',
                'left': '25%',
                'width': '75%'});
    }

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
    this.List = new TextEditor(this.TextDiv);
    if ( ! edit) {
        this.List.EditOff();
    }

    // Add the viewers.
    var width = CANVAS.innerWidth();
    var height = CANVAS.innerHeight();
    var halfWidth = width/2;
    VIEWER1 = initView([0,0, width, height]);
    VIEWER2 = initView([width, 0, 0, height]);

    VIEWER1.MainView.Canvas.css({'box-shadow': '10px 10px 5px #AAA'});
    VIEWER2.MainView.Canvas.css({'box-shadow': '10px 10px 5px #AAA'});


    if (this.Edit) {
        this.AnnotationWidget1 = new AnnotationWidget(VIEWER1);
        this.AnnotationWidget1.SetVisibility(2);

        this.AnnotationWidget2 = new AnnotationWidget(VIEWER2);
        this.AnnotationWidget2.SetVisibility(2);

        VIEWER1.OnInteraction(function () {PRESENTATION.RecordView1();});
        VIEWER2.OnInteraction(function () {PRESENTATION.RecordView2();});
                this.RemoveView1Button = $('<img>')
            .appendTo(VIEWER1.MainView.CanvasDiv)
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
                // Hack to reload viewer records.
                PRESENTATION.GotoSlide(PRESENTATION.Index);
            });
        this.RemoveView2Button = $('<img>')
            .appendTo(VIEWER2.MainView.CanvasDiv)
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
                // Hack to reposition viewers.
                PRESENTATION.HandleResize();
            });
        // Temporary way to delete a this.
        this.DeleteSlideButton = $('<img>')
            .appendTo(this.ViewPanel)
            .attr('src',"webgl-viewer/static/remove.png")
            .prop('title', "delete slide")
            .addClass('editButton')
            .css({'position':'absolute',
                  'width':'12px',
                  'height':'12px',
                  'left':'0px',
                  'right':'0px',
                  'z-index':'5'})
            .click(function () {
                // Hack to reload viewer records.
                PRESENTATION.DeleteSlide(self.Index);
            });

        // Setup view resizing.
        VIEWER1.MainView.CanvasDiv.resizable();
        // For a method to get called when resize stops.
        // Gets call on other mouse ups, but this is ok.
        VIEWER1.MainView.CanvasDiv
            .mouseup(function () {
                VIEWER1.Focus = true;
                self.UpdateEdits();
                PRESENTATION.HandleResize();
            });
        VIEWER1.MainView.CanvasDiv
            .resize(function () {
                VIEWER1.Focus = false;
                var vp = VIEWER1.GetViewport();
                vp[2] = $(this).width();
                vp[3] = $(this).height();
                VIEWER1.SetViewport(vp);
                eventuallyRender();
                return false;
            });

        VIEWER2.MainView.CanvasDiv.resizable();
        // For a method to get called when resize stops.
        // Gets call on other mouse ups, but this is ok.
        VIEWER2.MainView.CanvasDiv
            .mouseup(function () {
                VIEWER2.Focus = true;
                self.UpdateEdits();
                PRESENTATION.HandleResize();
            });
        VIEWER2.MainView.CanvasDiv
            .resize(function () {
                VIEWER2.Focus = false;
                var vp = VIEWER2.GetViewport();
                vp[2] = $(this).width();
                vp[3] = $(this).height();
                VIEWER2.SetViewport(vp);
                eventuallyRender();
                return false;
            });
    }
    // Give the option for full screen
    // on each of the viewers.
    this.FullWindowView1Button = $('<img>')
        .appendTo(VIEWER1.MainView.CanvasDiv)
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
            self.SetFullWindowView(VIEWER1);
        });
    this.FullWindowView2Button = $('<img>')
        .appendTo(VIEWER2.MainView.CanvasDiv)
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
            self.SetFullWindowView(VIEWER2);
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


SlidePage.prototype.SetFullWindowView = function (viewer) {
    if (viewer) {
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

    }
    this.FullWindowView = viewer;
    this.ResizeViews();
}


SlidePage.prototype.EditOff = function () {
    if (EDIT && this.Edit) {
        this.Edit = false;
        this.Div.css({'width': '100%', 'left': '0px'});
        this.AnnotationWidget1.hide();
        this.AnnotationWidget2.hide();
        VIEWER1.OnInteraction();
        VIEWER2.OnInteraction();
        this.RemoveView1Button.hide();
        this.RemoveView2Button.hide();
        this.DeleteSlideButton.hide();
        this.List.EditOff();
        // This causes the viewers to look transparent.
        //VIEWER1.MainView.CanvasDiv.resizable('disable');
        //VIEWER2.MainView.CanvasDiv.resizable('disable');
    }
}


// Adds a margin, and keeps the aspect ratio of view.
SlidePage.prototype.PlaceViewer = function(viewer, record, viewport) {
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


// Records == views.
SlidePage.prototype.ResizeViews = function ()
{
    var width = this.ViewPanel.width();
    var height = this.ViewPanel.height();
    if (this.FullWindowView) {
        VIEWER1.SetViewport([0, 0, 0, height]);
        VIEWER2.SetViewport([0, 0, 0, height]);
        this.FullWindowView.SetViewport([0,0,width,height]);
        eventuallyRender();
        return;
    }

    var numRecords = this.Records.length;
    var record;

    if (numRecords == 0) {
        // Poor way to hide a viewer.
        VIEWER1.SetViewport([0, 0, 0, height]);
        // Poor way to hide a viewer.
        VIEWER2.SetViewport([0, 0, 0, height]);
    }
    if (numRecords == 1) {
        record = this.Records[0];
        this.PlaceViewer(VIEWER1, record, [0,0,width,height]);
        // Poor way to hide a viewer.
        VIEWER2.SetViewport([0, 0, 0, height]);
    }
    if (numRecords > 1) {
        var halfWidth = width / 2;
        record = this.Records[0];
        this.PlaceViewer(VIEWER1, record, [0,0,halfWidth,height]);
        record = this.Records[1];
        this.PlaceViewer(VIEWER2, record, [halfWidth,0,halfWidth,height]);
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
        var viewport = VIEWER2.GetViewport();
    }
}


SlidePage.prototype.DisplayNote = function (index, note) {
    this.Div.show();
    this.Note = note;
    VIEWER1.Reset();
    VIEWER2.Reset();
    this.Records = note.ViewerRecords; // save this for resizing.

    this.Title.text("Slide: " + index)
    // Text
    this.List.LoadNote(note);
    // Views
    if (this.Records.length == 0) {
        DUAL_VIEW = false;
    }
    if (this.Records.length > 0) {
        this.Records[0].Apply(VIEWER1);
        DUAL_VIEW = false;
    }
    if (this.Records.length > 1) {
        this.Records[1].Apply(VIEWER2);
        // TODO: Get rid of this global variable.
        DUAL_VIEW = true;
    }
    VIEWER1.CopyrightWrapper.hide();
    VIEWER2.CopyrightWrapper.hide();
}


// We need to copy the annotation (maybe view in the future)
// Interaction does not actach all annotation changes.
SlidePage.prototype.UpdateEdits = function () {
    if (this.Note &&
        this.Note.ViewerRecords.length > 0 &&
        this.Note.ViewerRecords[0]) {
        this.Note.ViewerRecords[0].CopyViewer(VIEWER1);
    }

    if (this.Note &&
        this.Note.ViewerRecords.length > 1 &&
        this.Note.ViewerRecords[1]) {
        this.Note.ViewerRecords[1].CopyViewer(VIEWER2);
    }
}


//==============================================================================

// TODO:
// Get rid of the width dependency on edit.
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
    if (edit) {
        this.Div
            .css({
                'top': '0%',
                'left': '25%',
                'width': '75%'});
    }

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
              'min-height':'3em',
              'min-width':'10em',
              'left': '13%'});

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
              'minimum-height':'4em',
              'minimum-width':'10em',
              'top': '2em'});

    if (this.Edit) {
        var self = this;
        this.Title
            .focusin(function() { EVENT_MANAGER.FocusOut(); })
            .focusout(function() { EVENT_MANAGER.FocusIn(); });
        this.AuthorText
            .focusin(function() { EVENT_MANAGER.FocusOut(); })
            .focusout(function() { EVENT_MANAGER.FocusIn(); });
    }
}


TitlePage.prototype.EditOff = function () {
    if (EDIT && this.Edit) {
        this.Edit = false;
        this.Div.css({'width': '100%', 'left': '0px'});
        this.Title.attr('readonly', 'readonly')
            .attr('spellcheck', 'false')
            .unbind('focusin')
            .unbind('focusout')
            .blur();
        this.AuthorText.attr('readonly', 'readonly')
            .attr('spellcheck', 'false')
            .unbind('focusin')
            .unbind('focusout')
            .blur();
    }
}


TitlePage.prototype.DisplayNote = function (note) {
    this.Note = note;
    this.Div.show();
    this.Title.html(note.HiddenTitle);
    this.AuthorText.html(note.Text);

    var sel = window.getSelection();
    var range;
    range = document.createRange();
    range.noCursor = true;
    range.selectNodeContents(this.Title[0]);
    sel.removeAllRanges();
    sel.addRange(range);

    document.execCommand('foreColor', false, "#FFF");
    document.execCommand('fontSize', false, '6');
    document.execCommand('fontName', false, 'Arial');

    range.selectNodeContents(this.AuthorText[0]);
    sel.removeAllRanges();
    sel.addRange(range);

    document.execCommand('fontSize', false, '5');
    document.execCommand('fontName', false, 'Arial');

    sel.removeAllRanges();
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
        .focusin(function() { EVENT_MANAGER.FocusOut(); })
        .focusout(function() { EVENT_MANAGER.FocusIn(); });
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
            alert( "AJAX - error() : query" );
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
            } else { alert("ajax failed - get favorite views 2"); }
        },
        error: function() { alert( "AJAX - error() : getfavoriteviews 2" );
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
                alert( "AJAX - error() : deleteusernote" );
            },
        });
    }
}


