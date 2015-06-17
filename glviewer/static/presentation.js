//==============================================================================
// TODO:
// - !!!!!!!!!!!!!!!!!!!!!! Copy note needs to change ids in html
// - Resize the view area to fit the note text.
// - Edit mode: resize views
// - Allow views to go full screen.
// - Sortable slides in slide div.


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

Presentation.prototype.FullScreen = function () {
    var elem = document.body;

    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
}


Presentation.prototype.EditOff = function () {
    if (EDIT && this.Edit) {
        this.Edit = false;
        this.EditDiv.hide();
        this.TitlePage.EditOff();
        this.SlidePage.EditOff();
    }
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
    this.ShowButton = $('<img>')
        .appendTo(this.SlidesTab.Div)
        .prop('title', "present")
        .addClass('editButton')
        .attr('src','webgl-viewer/static/slide_show.png')
        .css({'float':'right'})
        .click(function () { 
            self.EditOff(); 
            self.HandleResize();
            self.FullScreen();
        });
    this.TimerButton = $('<img>')
        .appendTo(this.SlidesTab.Div)
        .prop('title', "present timed")
        .addClass('editButton')
        .attr('src','webgl-viewer/static/timer.png')
        .css({'float':'right'})
        .click(function () {
            self.EditOff();
            self.HandleResize();
            self.FullScreen();
            EVENT_MANAGER.FocusOut();
            var dialog = $('<div>')
                .dialog({
                    modal: true,
                    resizable:false,
                    position: {
                        my: "left top",
                        at: "left top",
                        of: window
                    },
                    buttons: {
                        "Start": function () {
                                     var duration = parseInt(self.DurationInput.val());
                                     self.TimerCallback(duration*1000);
                                     $(this).dialog("destroy");
                                 },
                    }
                });
            self.DurationLabel = $('<label>')
                .appendTo(dialog)
                .text("Seconds:");
            self.DurationInput = $('<input type="number" min="1" step="1">')
                .appendTo(dialog)
                .val(30)
                .css({'width':'4em'});
                
        });
    this.SaveButton = $('<img>')
        .appendTo(this.SlidesTab.Div)
        .prop('title', "save")
        .addClass('editButton')
        .attr('src','webgl-viewer/static/save22.png')
        .css({'float':'right'})
        .click(function () { self.Save();});
    this.InsertSlideButton = $('<img>')
        .appendTo(this.SlidesTab.Div)
        .prop('title', "new slide")
        .addClass('editButton')
        .attr('src','webgl-viewer/static/new_window.png')
        .css({'float':'right'})
        .click(function () { self.InsertNewSlide();});


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
        .css({'position':'relative',
              'width': '100%',
              'min-height':'95%',
              'overflow': 'auto',
              'border-width': '1px',
              'border-style': 'solid',
              'border-color': '#BBB',
              'bottom' : '0px',
              'text-align': 'left',
              'color': '#303030',
              'font-size': '18px'});
    this.SearchForm = $('<form>')
        .appendTo(this.SearchTab.Div)
        .css({'width':'100%',
              'display':'table'})
        .submit(function(e) {PRESENTATION.SearchCallback(); return false;});
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
        .appendTo(this.SearchTab.Div)
        .css({'position':'absolute',
              'top':'2em',
              'bottom':'0px',
              'width':'100%',
              'overflow-y':'auto'});

    this.SlidesTab.Open();
}

Presentation.prototype.TimerCallback = function(duration) {
    if (this.Index == this.RootNote.Children.length) {
        this.GotoSlide(0);
        // stop
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

Presentation.prototype.SearchCallback = function() {
    var self = this;
    var terms = this.SearchInput.val();
    $.ajax({
        type: "get",
        url: "/query",
        data: {'terms': terms},
        success: function(data,status){
            self.LoadSearchResults(data);
        },
        error: function() { alert( "AJAX - error() : query" );},
    });
}


Presentation.prototype.LoadSearchResults = function(data) {
    var self = this;
    this.SearchResults.empty();

    // Lets get the collection too.
    var collectionTitles = {};
    var collections = data.selected_and_accessible_views_in_collections;
    for (var i = 0; i < collections.length; ++i) {
        var collection = collections[i];
        for (var j = 0; j < collection.sessions.length; ++j) {
            var session = collection.sessions[j];
            var collectionTitle = session.collection_label;
            for (var k = 0; k < session.views.length; ++k) {
                var viewId = session.views[k];
                collectionTitles[viewId] = collectionTitle;
            }
        }
    }

    // These are in order of best match.
    for (prop in data.selected_and_accessible_views) {
        var aview = data.selected_and_accessible_views[prop];
        var collectionTitle = collectionTitles[prop];
        var thumb = $('<img>')
            .appendTo(this.SearchResults)
            .attr('src', this.MakeDataUri(aview))
            .prop('title', aview.Title + '\n' + collectionTitle)
            .css({'float':'left',
                  'margin':'5px',
                  'border': '1px solid #AAA',
                  'height': '60px'})
            .attr('id', aview._id)
            .hover(function(){$(this).css({'border-color':'#00F'});},
                   function(){$(this).css({'border-color':'#AAA'});})
            .click(function(){
                self.AddViewCallback2(this.id);
            });
    }
}

Presentation.prototype.MakeDataUri = function(aview) {
    // Makes a data-uri for macro thumbs if supplied, or else refers
    // to url endpoint
    if(aview.thumbs && aview.thumbs.macro && aview.thumbs.macro.length > 0) {
        return "data:image/jpeg;base64," + aview.thumbs.macro;
    } else {
        return "/viewthumb?viewid=" +aview._id + "&binary=1";
    }
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
    this.Note.ViewerRecords.push(record);
    // The root needs a record to show up in the session.
    if (this.RootNote.ViewerRecords.length == 0) {
        this.RootNote.ViewerRecords.push(record);
    }

    // Hack to reload viewer records.
    this.GotoSlide(this.Index);
}

Presentation.prototype.AddViewCallback2 = function(id) {
    var self = this;
    var note = new Note();
    note.LoadViewId(id, function () {
        var record = note.ViewerRecords[0];
        self.Note.ViewerRecords.push(record);
        // The root needs a record to show up in the session.
        if (self.RootNote.ViewerRecords.length == 0) {
            self.RootNote.ViewerRecords.push(record);
        }

        // Hack to reload viewer records.
        self.GotoSlide(self.Index);
    });
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
    if (this.Index == 0) { 
        this.TitlePage.UpdateEdits();
        this.SlidePage.UpdateEdits();
    }
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
    if (this.Edit) {
        if (this.Index == 0) {
            this.TitlePage.UpdateEdits();
        } else {
            this.SlidePage.UpdateEdits();
        }
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
    var self = this;
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


    if (this.Edit) {
        this.AnnotationWidget1 = new AnnotationWidget(VIEWER1);
        this.AnnotationWidget1.SetVisibility(2);

        this.AnnotationWidget2 = new AnnotationWidget(VIEWER2);
        this.AnnotationWidget2.SetVisibility(2);

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
            // TODO: View shoulw have hide/show methods and manage this.
            this.RemoveView1Button.hide();
            this.AnnotationWidget1.hide();
            this.RemoveView2Button.hide();
            this.AnnotationWidget2.hide();
        }
        if (numRecords == 1) {
            this.RemoveView1Button.show();
            this.AnnotationWidget1.show();
            this.RemoveView2Button.hide();
            this.AnnotationWidget2.hide();
        }
        if (numRecords == 2) {
            this.RemoveView1Button.show();
            this.AnnotationWidget1.show();
            this.RemoveView2Button.show();
            this.AnnotationWidget2.show();
        }
        var viewport = VIEWER1.GetViewport();
        this.RemoveView1Button.css({'left':viewport[0]+'px', 'top':viewport[1]+'px'});
        viewport = VIEWER2.GetViewport();
        this.RemoveView2Button.css({'left':viewport[0]+'px', 'top':viewport[1]+'px'});
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
            .unbind('focusin')
            .unbind('focusout')
            .blur();
        this.AuthorText.attr('readonly', 'readonly')
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

