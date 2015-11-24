// TODO: 
//    $('#slideInformation')
//  ShowViewBrowser();});
// get rid of these.

//function ComparisonSaveAnnotations() {} (used wrongly in text widget.)
//function ShowViewerEditMenu(viewer) {

// Empty
//ViewEditMenu.prototype.SessionAdvanceAjax = function() {


// All edit menus share a ViewBrowser.  Next to consider.  Share the
// presentation browser panel.
var VIEW_BROWSER;


// Other viewer is a hack for copy camera.
// parent is for the view browser.
function ViewEditMenu (viewer, otherViewer) {
    var self = this; // trick to set methods in callbacks.
    this.Viewer = viewer;
    // Other viewer is a hack for copy camera.
    this.OtherViewer = otherViewer;
    this.Tab = new Tab(viewer.GetDiv(),"/webgl-viewer/static/Menu.jpg", "editTab");
    this.Tab.Div
        .css({'position':'absolute',
              'right':'47px',
              'bottom':'0px'})
        .prop('title', "View Menu");

    this.Tab.Panel.addClass("sa-view-edit-panel");

    if (VIEW_BROWSER) {
        $('<button>')
            .appendTo(this.Tab.Panel)
            .text("Load Slide")
            .addClass("sa-view-edit-button")
            .click(
                function(){
                    self.Tab.PanelOff();
                    VIEW_BROWSER.Open(self.Viewer);
                });
    }
    if (SA.Edit) {
        $('<button>')
            .appendTo(this.Tab.Panel)
            .text("Save View")
            .addClass("sa-view-edit-button")
            .click(function(){self.SaveView();});
    }
    if (SA.NotesWidget) {
        $('<button>')
            .appendTo(this.Tab.Panel)
            .text("Download Image")
            .addClass("sa-view-edit-button")
            .click(function(){self.Tab.PanelOff();
                              DownloadImage(self.Viewer);});

        $('<button>')
            .appendTo(this.Tab.Panel)
            .text("Slide Info")
            .addClass("sa-view-edit-button")
            .click(function(){self.ShowSlideInformation();});

        if (typeof(TIME_LINE) != "undefined") {
            // Test for showing coverage of view histor.
            this.HistoryMenuItem = $('<button>')
                .appendTo(this.Tab.Panel)
                .text("History On")
                .addClass("sa-view-edit-button")
                .click(function(){self.ToggleHistory();});
        }
        // Hack until we have some sort of scale.
        if (this.OtherViewer) {
            this.CopyZoomMenuItem = $('<button>')
                .appendTo(this.Tab.Panel)
                .text("Copy Zoom")
                .hide()
                .addClass("sa-view-edit-button")
                .click(function(){self.CopyZoom();});
        }
    
        $('<button>').appendTo(this.Tab.Panel)
            .text("Flip Horizontal")
            .addClass("sa-view-edit-button")
            .click(function(){self.FlipHorizontal();});
        /* cutout widget dialog is broken.
        $('<button>').appendTo(this.Tab.Panel)
            .text("Download image from server")
            .addClass("sa-view-edit-button")
            .click(function(){
                self.Tab.PanelOff();
                // When the circle button is pressed, create the widget.
                if ( ! self.Viewer) { return; }
                new CutoutWidget(parent, self.Viewer);
            });
        // color threshold is also broken
        for(var plugin in window.PLUGINS) {
            var that = this;
            if(window.PLUGINS[plugin].button_text) {
                (function (plugin) {
                    // console.log("Adding menu for " + plugin);
                    $('<button>').appendTo(that.Tab.Panel)
                        .text(window.PLUGINS[plugin].button_text)
                        .addClass("sa-view-edit-button")
                        .click(function () {
                            window.PLUGINS[plugin].Init();
                        });
                })(plugin);
            }
        }
        */

        // I need some indication that the behavior id different in edit mode.
        // If the user is authorized, the new bounds are automatically saved.
        if (SA.Edit) {
            $('<button>').appendTo(this.Tab.Panel)
                .text("Save Overview Bounds")
                .addClass("sa-view-edit-button")
                .click(function(){self.SetViewBounds();});
        } else {
            $('<button>').appendTo(this.Tab.Panel)
                .text("Set Overview Bounds")
                .addClass("sa-view-edit-button")
                .click(function(){self.SetViewBounds();});
        }
    }
}

ViewEditMenu.prototype.SetVisibility = function(flag) {
    if (flag) {
        this.Tab.show();
    } else {
        this.Tab.hide();
    }
}

ViewEditMenu.prototype.DetectTissueSections = function() {
    initHagfish();
    findHagFishSections(2, 0.0002, 0.01);
}


ViewEditMenu.prototype.ToggleHistory = function() {
    this.Tab.PanelOff();

    this.Viewer.HistoryFlag = ! this.Viewer.HitoryFlag;
    if (this.Viewer.HistoryFlag) {
        this.HistoryMenuItem.text("History Off")
    } else {
        this.HistoryMenuItem.text("History On")
    }
    eventuallyRender();
}


// Record the viewer into the current note and save into the database.
ViewEditMenu.prototype.SaveView = function() {
    this.Tab.PanelOff();
    if (SA.NotesWidget) SA.NotesWidget.SaveCallback();
}

ViewEditMenu.prototype.GetViewerBounds = function (viewer) {
    var cam = viewer.GetCamera();
    var fp = cam.GetFocalPoint(); 
    var halfWidth = cam.GetWidth()/2;
    var halfHeight = cam.GetHeight()/2;
    return [fp[0]-halfWidth, fp[0]+halfWidth, fp[1]-halfHeight, fp[1]+halfHeight];
}

// Add bounds to view to overide image bounds.
ViewEditMenu.prototype.SetViewBounds = function() {
    this.Tab.PanelOff();
    var bounds = this.GetViewerBounds(this.Viewer);
    var note = SA.DualDisplay.GetNote();
    // Which view record?
    var viewerRecord = note.ViewerRecords[this.Viewer.RecordIndex];

    viewerRecord.OverviewBounds = bounds;
    // Set the image bounds so the new bounds are used immediately.
    viewerRecord.Image.bounds = viewerRecord.OverviewBounds;
    this.Viewer.OverView.Camera.SetFocalPoint( [(bounds[0]+bounds[1])/2,
                                                (bounds[2]+bounds[3])/2]);
    this.Viewer.OverView.Camera.SetHeight(bounds[3]-bounds[2]);
    this.Viewer.OverView.Camera.ComputeMatrix();
    eventuallyRender();

    // Save automatically if user has permission.
    if (SA.Edit) {
        // I cannot do this because it first sets the viewer record and bounds are lost.
        //SA.NotesWidget.SaveCallback();
        // Lets try just setting this one note.
        var noteObj = JSON.stringify(note.Serialize(false));
        var d = new Date();
        $.ajax({
            type: "post",
            url: "/webgl-viewer/saveviewnotes",
            data: {"note" : noteObj,
                   "date" : d.getTime()},
            success: function(data,status) {},
            error: function() { saDebug( "AJAX - error() : saveviewnotes (bounds)" ); },
        });
    }
}

// Add bounds to view to overide image bounds.
ViewEditMenu.prototype.SetImageBounds = function() {
    this.Tab.PanelOff();

    var viewer = this.Viewer;
    var imageDb = viewer.GetCache().Image.database;
    var imageId = viewer.GetCache().Image._id;
    var bounds = this.GetViewerBounds(viewer);

    // Set the image bounds so the new bounds are used immediately.
    viewer.GetCache().Image.bounds = bounds;
    viewer.OverView.Camera.SetFocalPoint( [(bounds[0]+bounds[1])/2,
                                           (bounds[2]+bounds[3])/2]);
    viewer.OverView.Camera.SetHeight(bounds[3]-bounds[2]);
    viewer.OverView.Camera.ComputeMatrix();
    eventuallyRender();

    var data = JSON.stringify(bounds);
    $.ajax({
        type: "post",
        url: "/webgl-viewer/set-image-bounds",
        data: {"img" : imageId,
               "imgdb"  : imageDb,
               "bds" : JSON.stringify(bounds)},
        success: function(data,status) {},
        error: function() {
            saDebug( "AJAX - error() : saveusernote 1" );
        },
    });
}


//==============================================================================
// Create and manage the menu to edit dual views.


// hack: Find the other viewer to copy.
ViewEditMenu.prototype.CopyZoom = function() {
    this.Tab.PanelOff();

    var cam = this.Viewer.GetCamera();
    var copyCam;
    var copyCam = this.OtherViewer.GetCamera();
    
    this.Viewer.AnimateCamera(cam.GetFocalPoint(), cam.Roll, copyCam.Height);
}

ViewEditMenu.prototype.ShowSlideInformation = function() {
    this.Tab.PanelOff();
    
    imageObj = this.Viewer.MainView.Section.Caches[0].Image;

    $('#slideInformation')
        .html("File Name: " + imageObj.filename
              + "<br>Dimensions: " + imageObj.dimensions[0] + ", "
              + imageObj.dimensions[1]
              + "<br>Levels: " + imageObj.levels)
        .show();
}


// Mirror image
ViewEditMenu.prototype.FlipHorizontal = function() {
    this.Tab.PanelOff();
    // When the circle button is pressed, create the widget.
    if ( ! this.Viewer) { return; }

    var cam = this.Viewer.GetCamera();
    this.Viewer.ToggleMirror();
    this.Viewer.SetCamera(cam.GetFocalPoint(), cam.GetRotation()+180.0, cam.Height);
    RecordState();
}


// Stuff that should be moved to some other file.

// Make the download dialog / function a module.
var DownloadImage = (function () {

    // Dialogs require an object when accept is pressed.
    var DOWNLOAD_WIDGET = undefined;
    var VIEWER;

    function DownloadImage(viewer) {
        // Use a global so apply callback can get the viewer.
        VIEWER = viewer;

        if ( ! DOWNLOAD_WIDGET) {
            InitializeDialogs();
        }

        // Setup default dimensions.
        var viewport = viewer.GetViewport();
        var d = DOWNLOAD_WIDGET.DimensionDialog;
        d.PxWidthInput.val(viewport[2]);
        d.PxHeightInput.val(viewport[3]);
        var pixelsPerInch = parseInt(d.SizeResInput.val());
        d.SizeWidthInput.val((viewport[2]/pixelsPerInch).toFixed(2));
        d.SizeHeightInput.val((viewport[3]/pixelsPerInch).toFixed(2));
        d.AspectRatio = viewport[2] / viewport[3];

        // Hide or show the stack option.
        if (SA.DualDisplay.GetNote().Type == "Stack") {
            DOWNLOAD_WIDGET.DimensionDialog.StackDiv.show();
        } else {
            DOWNLOAD_WIDGET.DimensionDialog.StackDiv.hide();
        }

        DOWNLOAD_WIDGET.DimensionDialog.Show(1);
    }

    function InitializeDialogs() {

        DOWNLOAD_WIDGET = {};

        // Two dialogs.
        // Dialog to choose dimensions and initiate download.
        // A dialog to cancel the download while waiting for tiles.
        var CancelDownloadCallback = function () {
            if ( DOWNLOAD_WIDGET.Viewer) {
                // We are in the middle of rendering.
                // This method was called by the cancel dialog.
                DOWNLOAD_WIDGET.Viewer.CancelLargeImage();
                DOWNLOAD_WIDGET.Viewer = undefined;
                // The dialog hides itself.
            }
        }
        var StartDownloadCallback = function () {
            // Trigger the process to start rendering the image.
            DOWNLOAD_WIDGET.Viewer = VIEWER;
            var width = parseInt(DOWNLOAD_WIDGET.DimensionDialog.PxWidthInput.val());
            var height = parseInt(DOWNLOAD_WIDGET.DimensionDialog.PxHeightInput.val());
            var stack = DOWNLOAD_WIDGET.DimensionDialog.StackCheckbox.prop('checked');

            // Show the dialog that empowers the user to cancel while rendering.
            DOWNLOAD_WIDGET.CancelDialog.Show(1);
            // We need a finished callback to hide the cancel dialog.
            if (stack) {
                DOWNLOAD_WIDGET.CancelDialog.StackMessage.show();
            } else {
                DOWNLOAD_WIDGET.CancelDialog.StackMessage.hide();
            }
            VIEWER.SaveLargeImage("slide-atlas.png", width, height, stack,
                                  function () {
                                      // Rendering has finished.
                                      // The user can no longer cancel.
                                      DOWNLOAD_WIDGET.Viewer = undefined;
                                      DOWNLOAD_WIDGET.CancelDialog.Hide();
                                  });
        }

        
        var d = new Dialog(StartDownloadCallback);
        d.Body.css({'margin':'1em 2em'});
        DOWNLOAD_WIDGET.DimensionDialog = d;
        d.Title.text('Download Image');
        
        // Pixel Dimensions
        d.PxDiv = $('<div>')
            .appendTo(d.Body)
            .css({'border':'1px solid #555',
                  'margin': '15px',
                  'padding-left': '5px'});
        d.PxLabel =
            $('<div>')
            .appendTo(d.PxDiv)
            .text("Dimensions:")
            .css({'position': 'relative',
                  'top': '-9px',
                  'display': 'inline-block',
                  'background-color': 'white'});
        
        d.PxWidthDiv =
            $('<div>')
            .appendTo(d.PxDiv)
            .css({'display':'table-row'});
        
        d.PxWidthLabel =
            $('<div>')
            .appendTo(d.PxWidthDiv)
            .text("Width:")
            .css({'display':'table-cell',
                  'text-align': 'right',
                  'width': '6em'});
        d.PxWidthInput =
            $('<input type="number">')
            .appendTo(d.PxWidthDiv)
            .val('1900')
            .css({'display':'table-cell',
                  'width': '100px',
                  'margin': '5px'})
            .change(function () {PxWidthChanged();});
        d.PxWidthUnits =
            $('<div>')
            .appendTo(d.PxWidthDiv)
            .text("Pixels")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        
        d.PxHeightDiv =
            $('<div>')
            .appendTo(d.PxDiv)
            .css({'display':'table-row',
                  'margin': '5px'});
        d.PxHeightLabel =
            $('<div>')
            .appendTo(d.PxHeightDiv)
            .text("Height:")
            .css({'display':'table-cell',
                  'text-align': 'right'});
        d.PxHeightInput =
            $('<input type="number">')
            .appendTo(d.PxHeightDiv)
            .val('1080')
            .css({'display':'table-cell',
                  'width': '100px',
                  'margin': '5px'})
            .change(function () {PxHeightChanged();});
        
        d.PxHeightUnits =
            $('<div>')
            .appendTo(d.PxHeightDiv)
            .text("Pixels")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        
        
        // Document Size
        d.SizeDiv = $('<div>')
            .appendTo(d.Body)
            .css({'border':'1px solid #555',
                  'margin': '15px',
                  'padding-left': '5px'});
        d.SizeLabel =
            $('<div>')
            .appendTo(d.SizeDiv)
            .text("Document Size:")
            .css({'position': 'relative',
                  'top': '-9px',
                  'display': 'inline-block',
                  'background-color': 'white'});
        
        d.SizeWidthDiv =
            $('<div>')
            .appendTo(d.SizeDiv)
            .css({'display':'table-row',
                  'margin': '5px'});
        d.SizeWidthLabel =
            $('<div>')
            .appendTo(d.SizeWidthDiv)
            .text("Width:")
            .css({'display':'table-cell',
                  'text-align': 'right',
                  'width': '6em'});
        d.SizeWidthInput =
            $('<input type="number">')
            .appendTo(d.SizeWidthDiv)
            .val('1900')
            .css({'display':'table-cell',
                  'width': '100px',
                  'margin': '5px'})
            .change(function () {SizeWidthChanged();});
        
        d.SizeWidthUnits =
            $('<div>')
            .appendTo(d.SizeWidthDiv)
            .text("Inches")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        
        d.SizeHeightDiv =
            $('<div>')
            .appendTo(d.SizeDiv)
            .css({'display':'table-row',
                  'margin': '5px'});
        d.SizeHeightLabel =
            $('<div>')
            .appendTo(d.SizeHeightDiv)
            .text("Height:")
            .css({'display':'table-cell',
                  'text-align': 'right'});
        d.SizeHeightInput =
            $('<input type="number">')
            .appendTo(d.SizeHeightDiv)
            .val('1900')
            .css({'display':'table-cell',
                  'width': '100px',
                  'margin': '5px'})
            .change(function () {SizeHeightChanged();});
        
        d.SizeHeightUnits =
            $('<div>')
            .appendTo(d.SizeHeightDiv)
            .text("Inches")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        
        d.SizeResDiv =
            $('<div>')
            .appendTo(d.SizeDiv)
            .css({'display':'table-row',
                  'margin': '5px'});
        d.SizeResLabel =
            $('<div>')
            .appendTo(d.SizeResDiv)
            .text("Resolution:")
            .css({'display':'table-cell',
                  'text-align': 'right'});
        d.SizeResInput =
            $('<input type="number">')
            .appendTo(d.SizeResDiv)
            .val('72')
            .css({'display':'table-cell',
                  'width': '100px',
                  'margin': '5px'})
            .change(function () {ResChanged();});
        
        d.SizeResUnits =
            $('<div>')
            .appendTo(d.SizeResDiv)
            .text("Pixels/Inch")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        
        
        d.ProportionsDiv = 
            $('<div>')
            .appendTo(d.Body)
            .css({'margin': '15px',
                  'padding-left': '5px'});
        d.ProportionsLabel =
            $('<div>')
            .appendTo(d.ProportionsDiv)
            .text("Constrain Proportions:")
            .css({'display':'inline'});
        d.ProportionsCheckbox =
            $('<input type="checkbox">')
            .appendTo(d.ProportionsDiv)
            .css({'display':'inline'})
            .prop('checked', true);


        d.StackDiv =
            $('<div>')
            .appendTo(d.Body)
            .css({'margin': '15px',
                  'padding-left': '5px'})
            .hide();
        d.StackLabel =
            $('<div>')
            .appendTo(d.StackDiv)
            .text("All stack sections:")
            .css({'display':'inline'});
        d.StackCheckbox =
            $('<input type="checkbox">')
            .appendTo(d.StackDiv)
            .css({'display':'inline'})
            .prop('checked', false);


        d.AspectRatio = 1.0;


        // A dialog to cancel the download before we get all the tiles
        // needed to render thie image.
        d = new Dialog(CancelDownloadCallback);
        DOWNLOAD_WIDGET.CancelDialog = d;
        d.Title.text('Processing');

        d.WaitingImage = $('<img>')
            .appendTo(d.Body)
            .attr("src", "/webgl-viewer/static/circular.gif")
            .attr("alt", "waiting...")
            .css({'width':'40px'});

        d.StackMessage = $('<div>')
            .appendTo(d.Body)
            .text("Downloading multiple images.  Turn off browser's prompt-on-download option.")
            .hide();

        d.ApplyButton.text("Cancel");

    }

    function PxWidthChanged () {
        var d = DOWNLOAD_WIDGET.DimensionDialog;
        var pixelsPerInch = parseInt(d.SizeResInput.val());
        var width = parseInt(d.PxWidthInput.val());
        d.SizeWidthInput.val((width/pixelsPerInch).toFixed(2));
        if (d.ProportionsCheckbox.prop('checked')) {
            var height = width / d.AspectRatio;
            d.PxHeightInput.val(height.toFixed());
            d.SizeHeightInput.val((height/pixelsPerInch).toFixed(2));
        } else {
            var height = parseInt(d.PxHeightInput.val());
            d.AspectRatio = width / height;
        }
    }

    function PxHeightChanged () {
        var d = DOWNLOAD_WIDGET.DimensionDialog;
        var pixelsPerInch = parseInt(d.SizeResInput.val());
        var height = parseInt(d.PxHeightInput.val());
        d.SizeHeightInput.val((height/pixelsPerInch).toFixed(2));
        if (d.ProportionsCheckbox.prop('checked')) {
            var width = height * d.AspectRatio;
            d.PxWidthInput.val(width.toFixed());
            d.SizeWidthInput.val((width/pixelsPerInch).toFixed(2));
        } else {
            var width = parseInt(d.PxWidthInput.val());
            d.AspectRatio = width / height;
        }
    }

    function SizeWidthChanged () {
        var d = DOWNLOAD_WIDGET.DimensionDialog;
        var pixelsPerInch = parseInt(d.SizeResInput.val());
        var width = parseInt(d.SizeWidthInput.val());
        d.PxWidthInput.val((width*pixelsPerInch).toFixed());
        if (d.ProportionsCheckbox.prop('checked')) {
            var height = width / d.AspectRatio;
            d.SizeHeightInput.val(height.toFixed(2));
            d.PxHeightInput.val((height*pixelsPerInch).toFixed());
        } else {
            var height = parseInt(d.SizeHeightInput.val());
            d.AspectRatio = width / height;
        }
    }

    function SizeHeightChanged () {
        var d = DOWNLOAD_WIDGET.DimensionDialog;
        var pixelsPerInch = parseInt(d.SizeResInput.val());
        var height = parseInt(d.SizeHeightInput.val());
        d.PxHeightInput.val((height*pixelsPerInch).toFixed());
        if (d.ProportionsCheckbox.prop('checked')) {
            var width = height * d.AspectRatio;
            d.SizeWidthInput.val(width.toFixed(2));
            d.PxWidthInput.val((width*pixelsPerInch).toFixed());
        } else {
            var width = parseInt(d.SizeWidthInput.val());
            d.AspectRatio = width / height;
        }
    }

    function ResChanged () {
        var d = DOWNLOAD_WIDGET.DimensionDialog;
        var pixelsPerInch = parseInt(d.SizeResInput.val());
        var height = parseInt(d.SizeHeightInput.val());
        var width = parseInt(d.SizeWidthInput.val());
        d.PxHeightInput.val((height*pixelsPerInch).toFixed());
        d.PxWidthInput.val((width*pixelsPerInch).toFixed());
    }



    return DownloadImage;
})();



// Create a selection list of sessions.
// This does not belong here.
function InitSlideSelector(parent) {
    $('<div>')
        .appendTo(parent)
        .css({
            'background-color': 'white',
            'border-style': 'solid',
            'border-width': '1px',
            'border-radius': '5px',
            'position': 'absolute',
            'top' : '35px',
            'left' : '35px',
            'width' : '500px',
            'height' : '700px',
            'overflow': 'auto',
            'z-index': '4',
            'color': '#303030',
            'font-size': '20px' })
        .attr('id', 'sessionMenu').hide()
        .mouseleave(function(){$(this).fadeOut();});
    $('<ul>').appendTo('#sessionMenu').attr('id', 'sessionMenuSelector');
    
    // Create a selector for views.
    $('<div>')
        .appendTo(parent)
        .css({
            'background-color': 'white',
            'border-style': 'solid',
            'border-width': '1px',
            'border-radius': '5px',
            'position': 'absolute',
            'top' : '135px',
            'left' : '135px',
            'width' : '500px',
            'height' : '700px',
            'overflow': 'auto',
            'z-index': '4',
            'color': '#303030',
            'font-size': '20px' })
        .attr('id', 'viewMenu').hide()
        .mouseleave(function(){$(this).fadeOut();});
    $('<ul>').appendTo('#viewMenu').attr('id', 'viewMenuSelector'); // <select> for drop down
    
    $('<div>')
        .appendTo(parent)
        .css({
            'background-color': 'white',
            'border-style': 'solid',
            'border-width': '1px',
            'border-radius': '5px',
            'position': 'absolute',
            'top' : '30%',
            'left' : '30%',
            'width': '40%',
            'height': '40%',
            'z-index': '4',
            'color': '#303030',
            'font-size': '20px'})
        .attr('id', 'slideInformation')
        .hide()
        .mouseleave(function(){$(this).fadeOut();});
}







