//==============================================================================
// TODO:
// - !!!!!!!!!!!!!!!!!!!!!! Copy note needs to change ids in html
// - control the size of the text.
// - Convert a session to a presentation.
// - Resize the view area to fit the note text.
// - Edit mode: resize views


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

    this.EditPanel = null;
    if (edit) {
        this.EditDiv = $('<div>')
            .appendTo(this.WindowDiv)
            .css({
                'background':'#FFF',
                'position' : 'absolute',
                'top': '0%',
                'left': '0%',
                'right':'26%',
                'width': '25%',
                'height': '100%'});
        this.MakeEditPanel();
    }

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

    $(window).resize(function() {
        self.HandleResize();
    }).trigger('resize');

    eventuallyRender();
}




Presentation.prototype.MakeEditPanel = function () {
    this.SlidesTab = new NotesWidgetTab(this.EditDiv, "Slides");
    this.ClipboardTab = new NotesWidgetTab(this.EditDiv, "Clipboard");
    this.SearchTab = new NotesWidgetTab(this.EditDiv, "Search");

    var self = this;

    this.SlidesTab.Div 
        .appendTo(this.EditDiv)
        .css({'width': '100%',
              'overflow': 'auto',
              'border-width': '1px',
              'border-style': 'solid',
              'border-color': '#BBB',
              'bottom' : '0px',
              'text-align': 'left',
              'color': '#303030',
              'font-size': '18px'});
    this.InsertSlideButton = $('<button>')
        .appendTo(this.SlidesTab.Div)
        .click(function () { self.InsertNewSlide();})
        .text("New Slide");
    this.ShowButton = $('<button>')
        .appendTo(this.SlidesTab.Div)
        .click(function () { alert("Show");})
        .text("Show");
    this.SaveButton = $('<button>')
        .appendTo(this.SlidesTab.Div)
        .css({'float':'right'})
        .click(function () { self.Save();})
        .text("Save");

    this.ClipboardTab.Div 
        .appendTo(this.EditDiv)
        .hide()
        .css({'width': '100%',
              'min-height':'50%',
              'overflow': 'auto',
              'border-width': '1px',
              'border-style': 'solid',
              'border-color': '#BBB',
              'bottom' : '0px',
              'text-align': 'left',
              'color': '#303030',
              'font-size': '18px'});
    this.ClearButton = $('<button>')
        .appendTo(this.ClipboardTab.Div)
        .click(function () { self.ClipboardDeleteAll(); })
        .text("Remove All");
    this.ClipboardDiv = $('<div>')
        .css({'overflow_y':'auto'})
        .appendTo(this.ClipboardTab.Div);

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

    this.SearchTab.Div 
        .appendTo(this.EditDiv)
        .hide()
        .css({'width': '100%',
              'min-height':'50%',
              'overflow': 'auto',
              'border-width': '1px',
              'border-style': 'solid',
              'border-color': '#BBB',
              'bottom' : '0px',
              'text-align': 'left',
              'color': '#303030',
              'font-size': '18px'});

    this.ClipboardTab.Show();
}


Presentation.prototype.LoadClipboardCallback = function(sessionData) {
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
                self.AddViewCallback(parseInt(this.getAttribute("index")));
            });
    }
}

Presentation.prototype.ClipboardDeleteAll = function() {
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


Presentation.prototype.RecordView1 = function() {
    if (this.Note && 
        this.Note.ViewerRecords.length > 0 &&
        this.Note.ViewerRecords[0]) {
        this.Note.ViewerRecords[0].CopyViewer(VIEWER1);
    }
}


Presentation.prototype.RecordView2 = function() {
    if (this.Note && 
        this.Note.ViewerRecords.length > 1 &&
        this.Note.ViewerRecords[1]) {
        this.Note.ViewerRecords[1].CopyViewer(VIEWER2);
    }
}


// TODO: Separate the viewer records (maybe also children).
Presentation.prototype.AddViewCallback = function(idx) {
    this.ClipboardViews[idx];
    var record = new ViewerRecord();
    record.Load(this.ClipboardViews[idx].ViewerRecords[0]);
    if (record.Camera.Width == undefined) {
        record.Camera.Width = record.Camera.Height*1.62;
    }
    this.Note.ViewerRecords.push(record);
    // The root needs a record to show up in the session.
    if (this.RootNote.ViewerRecords.length == 0) {
        this.RootNote.ViewerRecords.push(record);
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
        this.GotoSlide(this.RootNote.Children.length - 1);
    }
}


Presentation.prototype.Save = function (){
    this.SaveButton.css({'color':'#F00'});
    this.RootNote.Save(
        function() {
            PRESENTATION.SaveButton.css({'color':'#000'});
        });
}


Presentation.prototype.DeleteSlide = function (index){
    var maxIdx = this.RootNote.Children.length;
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
}

// 0->Root/titlePage
// Childre/slidesn start at index 1
Presentation.prototype.GotoSlide = function (index){
    if (index < 0 || index > this.RootNote.Children.length) {
        return;
    }
    this.Index = index;
    if (index == 0) {
        this.SlidePage.Div.hide();
        this.Note = this.RootNote;
        this.TitlePage.DisplayNote(this.Note);
        return;
    }
    this.TitlePage.Div.hide();
    this.Note = this.RootNote.Children[index-1];
    this.SlidePage.DisplayNote(index, this.Note);
}



//==============================================================================

// TODO:
// Get rid of the width dependency on edit
function SlidePage(parent, edit) {
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
              'height': '210px',
              'bottom': '5px',
              'width': '100%'});
    this.List = new TextEditor(this.TextDiv, edit);

    // Add the viewers.
    var width = CANVAS.innerWidth();
    var height = CANVAS.innerHeight();
    var halfWidth = width/2;
    VIEWER1 = initView([0,0, width, height]);
    VIEWER2 = initView([width, 0, 0, height]);

    VIEWER1.MainView.Canvas.css({'box-shadow': '10px 10px 5px #AAA'});
    VIEWER2.MainView.Canvas.css({'box-shadow': '10px 10px 5px #AAA'});


    if (edit) {
        VIEWER1.OnInteraction(function () {PRESENTATION.RecordView1();});
        VIEWER2.OnInteraction(function () {PRESENTATION.RecordView2();});
        this.RemoveView1Button = $('<img>')
            .appendTo(this.ViewPanel)
            .hide()
            .attr('src',"webgl-viewer/static/remove.png")
            .prop('title', "remove view")
            .addClass('editButton')
            .css({'position':'absolute',
                  'width':'12px',
                  'height':'12px',
                  'z-index':'5'})
            .click(function () {
                PRESENTATION.Note.ViewerRecords.splice(0,1);
                // Hack to reload viewer records.
                PRESENTATION.GotoSlide(PRESENTATION.Index);
            });
        this.RemoveView2Button = $('<img>')
            .appendTo(this.ViewPanel)
            .hide()
            .attr('src',"webgl-viewer/static/remove.png")
            .prop('title', "remove view")
            .addClass('editButton')
            .css({'position':'absolute',
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
    if (EDIT) {
        if (numRecords == 0) {
            this.RemoveView1Button.hide();
            this.RemoveView2Button.hide();
        }
        if (numRecords == 1) {
            this.RemoveView1Button.show();
            this.RemoveView2Button.hide();
        }
        if (numRecords == 2) {
            this.RemoveView1Button.show();
            this.RemoveView2Button.show();
        }
        var viewport = VIEWER1.GetViewport();
        this.RemoveView1Button.css({'left':viewport[0]+'px', 'top':viewport[1]+'px'});
        viewport = VIEWER2.GetViewport();
        this.RemoveView2Button.css({'left':viewport[0]+'px', 'top':viewport[1]+'px'});
    }
}


SlidePage.prototype.DisplayNote = function (index, note) {
    this.Div.show();
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


//==============================================================================

// TODO:
// Get rid of the width dependency on edit.
function TitlePage (parent, edit) {
    this.Div = $('<div>')
        .appendTo(parent)
        .css({
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

    if (edit) {
        var self = this;
        this.Title
            .focusin(function() { EVENT_MANAGER.FocusOut(); })
            .focusout(
                function() {
                    EVENT_MANAGER.FocusIn();
                    if (PRESENTATION)
                        PRESENTATION.Note.HiddenTitle = self.Title.html();
                });
        this.AuthorText
            .focusin(function() {
                EVENT_MANAGER.FocusOut();
            })
            .focusout(
                function() {
                    EVENT_MANAGER.FocusIn();
                    if (PRESENTATION)
                        PRESENTATION.Note.Text = self.AuthorText.html();
                });
    }
}

TitlePage.prototype.DisplayNote = function (note) {
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

