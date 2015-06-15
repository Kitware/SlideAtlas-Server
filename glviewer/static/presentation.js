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



// Main function called by the presentation.html template
function PresentationMain(viewId) {
    // We need to get the view so we know how to initialize the app.
    var rootNote = new Note();
    // Sanity check
    if (typeof(viewId) == "undefined" && viewId == "") { return; }

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
            'width': 'auto',
            'background-color': '#DFF'});

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
        this.InitEditPanel();
        this.SlideDiv = $('<div>')
            .appendTo(this.WindowDiv)
            .css({
                'position' : 'absolute',
                'top': '0%',
                'left': '25%',
                'width': '75%',
                'height': '100%',
                'border': '1px solid #AAA'});
    } else {
        this.SlideDiv = $('<div>')
            .appendTo(this.WindowDiv)
            .css({
                'width': '100%',
                'height': '100%',
            });
    }

    this.ViewPanel = $('<div>')
            .appendTo(this.SlideDiv)
            .css({'background':'#FFF',
                  'position': 'absolute',
                  'top': '0px',
                  'bottom': '300px',
                  'width': '100%',
                  'height': 'auto'});
    VIEW_PANEL = this.ViewPanel;

    this.BottomDiv = $('<div>')
        .appendTo(this.SlideDiv)
        .css({'position': 'absolute',
              'bottom':'0px',
              'width':'100%',
              'height':'300px'});

    this.Title = $('<h1>')
        .appendTo(this.BottomDiv)
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

    this.List = new TextEditor(this.BottomDiv, edit);
    this.List.TextEntry.css({'vertical-align' : 'bottom',
                             'height': 'auto',
                             'width': 'auto',
                             'left':'0px',
                             'right':'0px',
                             'min-height': '150px'});

    // Add the viewers.
    var width = CANVAS.innerWidth();
    var height = CANVAS.innerHeight();
    var halfWidth = width/2;
    VIEWER1 = initView([0,0, width, height]);
    VIEWER2 = initView([width, 0, 0, height]);

    if (edit) {
        VIEWER1.OnInteraction(function () {self.RecordView1();});
        VIEWER2.OnInteraction(function () {self.RecordView2();});
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
                self.Note.ViewerRecords.splice(0,1);
                // Hack to reload viewer records.
                self.GotoSlide(self.Index);
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
                self.Note.ViewerRecords.splice(1,1);
                // Hack to reposition viewers.
                self.HandleResize();
            });
        // Temporary way to delete a slide.
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
                self.DeleteSlide(self.Index);
            });
    }

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


Presentation.prototype.InitEditPanel = function () {
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
        .appendTo(this.ClipboardTab.Div);

    $.ajax({
        type: "get",
        url: "webgl-viewer/getfavoriteviews",
        success: function(data,status){
            if (status == "success") {
                self.LoadClipboardCallback(data);
            } else { alert("ajax failed - get favorite views 2"); }
        },
        error: function() { alert( "AJAX - error() : getfavoriteviews 2" ); },
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
    width = this.ViewPanel.width();
    height = this.ViewPanel.height();

    var record;
    if ( ! this.Note) { return; }
    if (this.Note.ViewerRecords.length == 0) {
        // Poor way to hide a viewer.
        VIEWER1.SetViewport([0, 0, 0, height]);
        if (this.RemoveView1Button) {this.RemoveView1Button.hide();}
        // Poor way to hide a viewer.
        VIEWER2.SetViewport([0, 0, 0, height]);
        if (this.RemoveView2Button) {this.RemoveView2Button.hide();}
    }
    if (this.Note.ViewerRecords.length == 1) {
        record = this.Note.ViewerRecords[0];
        this.PlaceViewer(VIEWER1, record, [0,0,width,height]);
        if (this.RemoveView1Button) {this.RemoveView1Button.show();}
        // Poor way to hide a viewer.
        VIEWER2.SetViewport([width, 0, 0, height]);
        if (this.RemoveView2Button) {this.RemoveView2Button.hide();}
    }
    if (this.Note.ViewerRecords.length > 1) {
        var halfWidth = width / 2;
        record = this.Note.ViewerRecords[0];
        this.PlaceViewer(VIEWER1, record, [0,0,halfWidth,height]);
        if (this.RemoveView1Button) {this.RemoveView1Button.show();}
        record = this.Note.ViewerRecords[1];
        this.PlaceViewer(VIEWER2, record, [halfWidth,0,halfWidth,height]);
        if (this.RemoveView2Button) {this.RemoveView2Button.show();}
    }
    if (EDIT) {
        var viewport = VIEWER1.GetViewport();
        this.RemoveView1Button.css({'left':viewport[0]+'px', 'top':viewport[1]+'px'});
        viewport = VIEWER2.GetViewport();
        this.RemoveView2Button.css({'left':viewport[0]+'px', 'top':viewport[1]+'px'});
    }
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


// Adds a margin, and keeps the aspect ratio of view.
Presentation.prototype.PlaceViewer = function(viewer, record, viewport) {
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


Presentation.prototype.Save = function (){
    this.SaveButton.css({'color':'#F00'});
    this.RootNote.Save(
        function() {
            PRESENTATION.SaveButton.css({'color':'#000'});
        });
}


Presentation.prototype.DeleteSlide = function (index){
    var maxIdx = this.RootNote.Children.length - 1;
    if (index < 0 || index > maxIdx) {
        return;
    }
    if (this.Index > index || this.Index == maxIdx) {
        // Handles the case where we are on the last slide.
        // Move to the previous rather then the next.
        this.Index -= 1;
    }
    this.RootNote.Children.splice(index,1);
    this.GotoSlide(this.Index);
}


Presentation.prototype.InsertNewSlide = function (index){
    var idx = this.Index+1;
    var note = new Note();
    this.RootNote.Children.splice(idx,0,note);
    this.GotoSlide(idx);
}


Presentation.prototype.GotoSlide = function (index){
    if (index < 0 || index >= this.RootNote.Children.length) {
        return;
    }
    this.Index = index;
    this.Title.text("Slide: " + (index+1))
    var note = this.RootNote.Children[index];
    this.Note = note;
    // Text
    this.List.LoadNote(note);
    // Views
    if (note.ViewerRecords.length == 0) {
        VIEWER1.Reset();
        VIEWER2.Reset();
        DUAL_VIEW = false;
    }
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
    VIEWER1.CopyrightWrapper.hide();
    VIEWER2.CopyrightWrapper.hide();
}
