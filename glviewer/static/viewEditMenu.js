// TODO: 
//    $('#slideInformation')
//  ShowViewBrowser();});
// get rid of these.

//function ComparisonSaveAnnotations() {} (used wrongly in text widget.)
//function ShowViewerEditMenu(viewer) {

// Empty
//ViewEditMenu.prototype.SessionAdvanceAjax = function() {



function ViewEditMenu (viewer) {
    var self = this; // trick to set methods in callbacks.
    this.Viewer = viewer;
    this.Tab = new Tab("/webgl-viewer/static/Menu.jpg");
    // I think we can get rid of this "GuiObject" stuff.
    // css positioning can handle it now.
    viewer.AddGuiObject(this.Tab.Div, "Bottom", 0, "Right", 99);
    new ToolTip(this.Tab.Div, "View Menu");

    this.Tab.Panel
        .css({'left': '-78px',
              'width': '170px',
              'padding': '0px 2px'});

    $('<button>')
        .appendTo(this.Tab.Panel)
        .text("Load Slide")
        .css({'margin':'2px 0px',
              'width' : '100%'})
        .click(function(){self.Tab.PanelOff(); ShowViewBrowser(self.Viewer);});
    if (EDIT) {
        $('<button>')
            .appendTo(this.Tab.Panel)
            .text("Save View")
            .css({'margin':'2px 0px',
                  'width' : '100%'})
            .click(function(){self.SaveView();});
    }
    $('<button>')
        .appendTo(this.Tab.Panel)
        .text("Download Image")
        .css({'margin':'2px 0px',
              'width' : '100%'})
        .click(function(){self.Tab.PanelOff(); DownloadImage(self.Viewer);});
    $('<button>')
        .appendTo(this.Tab.Panel)
        .text("Slide Info")
        .css({'margin':'2px 0px',
              'width' : '100%'})
        .click(function(){self.ShowSlideInformation();});
    
    // Test for showing coverage of view histor.
    this.HistoryMenuItem = $('<button>')
        .appendTo(this.Tab.Panel)
        .text("History On")
        .css({'margin':'2px 0px',
              'width' : '100%'})
        .click(function(){self.ToggleHistory();});
    
    // Hack until we have some sort of scale.
    this.CopyZoomMenuItem = $('<button>')
        .appendTo(this.Tab.Panel)
        .text("Copy Zoom")
        .hide()
        .css({'margin':'2px 0px',
              'width' : '100%'})
        .click(function(){self.CopyZoom();});
    $('<button>').appendTo(this.Tab.Panel)
        .text("Flip Horizontal")
        .css({'margin':'2px 0px',
              'width' : '100%'})
        .click(function(){self.FlipHorizontal();});

    $('<button>').appendTo(this.Tab.Panel)
        .text("Download image from server")
        .css({'margin':'2px 0px',
              'width' : '100%'})
        .click(function(){
            // Define helper function to parse params
            function params_unserialize(p){
                var ret = {},
                seg = p.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
                for (;i<len;i++) {
                    if (!seg[i]) { continue; }
                    s = seg[i].split('=');
                    ret[s[0]] = s[1];
                }
                return ret;
            }

            // grab image source
            var image_source = params_unserialize(
                VIEWER1.GetCache().TileSource.Prefix.split("?")[1]);

            var viewer_bounds = VIEWER1.MainView.Camera.GetBounds();
            viewer_bounds[0] = parseInt(viewer_bounds[0]);
            viewer_bounds[1] = parseInt(viewer_bounds[1]);
            viewer_bounds[2] = parseInt(viewer_bounds[2]);
            viewer_bounds[3] = parseInt(viewer_bounds[3]);
            // console.log("Viewer bounds");
            // console.log(viewer_bounds);

            // Need to invert viewer bounds
            // i.e. bounds: [0, 800, 491, 1024],
            // to dimensions: [0, 800, 0, 533],
            $.ajax({
                type: "GET",
                url: "/webgl-viewer/getview?viewid=" + VIEW_ID,
                success: function(viewData){
                    var image_bounds = viewData.ViewerRecords[0].Image.bounds;

                    // clamp view to image boundaries
                    if(viewer_bounds[0] < image_bounds[0]) { viewer_bounds[0] = image_bounds[0]};
                    if(viewer_bounds[1] > image_bounds[1]) { viewer_bounds[1] = image_bounds[1]};

                    if(viewer_bounds[2] < image_bounds[2]) { viewer_bounds[2] = image_bounds[2]};
                    if(viewer_bounds[3] > image_bounds[3]) { viewer_bounds[3] = image_bounds[3]};

                    // Translate to cutout
                    var cutout_bounds = [];
                    cutout_bounds[0] = viewer_bounds[0];
                    cutout_bounds[1] = viewer_bounds[1];

                    // TODO: Deal with this in server side
                    cutout_bounds[3] = image_bounds[3]-viewer_bounds[2];
                    cutout_bounds[2] = image_bounds[3]-viewer_bounds[3];

                    if(cutout_bounds[3] < cutout_bounds[2]) {
                        temp = cutout_bounds[3];
                        cutout_bounds[3] = cutout_bounds[2];
                        cutout_bounds[2] = temp;
                    }

                    $.ajax({
                        type: "GET",
                        url: "/cutout/" + image_source.db + "/" +
                            image_source.img + "/image.png",
                        data: {debug:0, bounds:JSON.stringify(cutout_bounds)},
                    });
                }
            });
        });

    for(var plugin in window.PLUGINS) {
        var that = this;
        if(window.PLUGINS[plugin].button_text) {
            (function (plugin) {
                // console.log("Adding menu for " + plugin);
                $('<button>').appendTo(that.Tab.Panel)
                    .text(window.PLUGINS[plugin].button_text)
                    .css({
                        'margin': '2px 0px',
                        'width': '100%'
                    })
                    .click(function () {
                        window.PLUGINS[plugin].Init();
                    });
            })(plugin);
        }
    }
    
    // I need some indication that the behavior id different in edit mode.
    // If the user is authorized, the new bounds are automatically saved.
    if (EDIT) {
        $('<button>').appendTo(this.Tab.Panel)
            .text("Save Overview Bounds")
            .css({'margin':'2px 0px',
                  'width' : '100%'})
            .click(function(){self.SetViewBounds();});
    } else {
        $('<button>').appendTo(this.Tab.Panel)
            .text("Set Overview Bounds")
            .css({'margin':'2px 0px',
                  'width' : '100%'})
            .click(function(){self.SetViewBounds();});
    }

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
    NOTES_WIDGET.SaveCallback();
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
    var note = NOTES_WIDGET.GetCurrentNote();
    // Which view record?  Hack.
    var viewerRecord = note.ViewerRecords[0];
    if (this.Viewer == VIEWER2) {
        var viewerRecord = note.ViewerRecords[1];
    }
    viewerRecord.OverviewBounds = bounds;
    // Set the image bounds so the new bounds are used immediately.
    viewerRecord.Image.bounds = viewerRecord.OverviewBounds;
    this.Viewer.OverView.Camera.SetFocalPoint((bounds[0]+bounds[1])/2, 
                                              (bounds[2]+bounds[3])/2);
    this.Viewer.OverView.Camera.SetHeight(bounds[3]-bounds[2]);
    this.Viewer.OverView.Camera.ComputeMatrix();
    eventuallyRender();

    // Save automatically if user has permission.
    if (EDIT) {
        // I cannot do this because it first sets the viewer record and bounds are lost.
        //NOTES_WIDGET.SaveCallback();
        // Lets try just setting this one note.
        var noteObj = JSON.stringify(note.Serialize(false));
        var d = new Date();
        $.ajax({
            type: "post",
            url: "/webgl-viewer/saveviewnotes",
            data: {"note" : noteObj,
                   "date" : d.getTime()},
            success: function(data,status) {},
            error: function() { alert( "AJAX - error() : saveviewnotes (bounds)" ); },
        });
    }
}

// Add bounds to view to overide image bounds.
ViewEditMenu.prototype.SetImageBounds = function() {
    this.Tab.PanelOff();

    var viewer = EVENT_MANAGER.CurrentViewer;
    var imageDb = viewer.GetCache().Image.database;
    var imageId = viewer.GetCache().Image._id;
    var bounds = this.GetViewerBounds(viewer);

    // Set the image bounds so the new bounds are used immediately.
    viewer.GetCache().Image.bounds = bounds;
    viewer.OverView.Camera.SetFocalPoint((bounds[0]+bounds[1])/2, (bounds[2]+bounds[3])/2);
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
            alert( "AJAX - error() : saveusernote 1" );
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
    if (this.Viewer == VIEWER1) {
        var copyCam = VIEWER2.GetCamera();
    } else {
        var copyCam = VIEWER1.GetCamera();
    }
    
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
    var viewer = EVENT_MANAGER.CurrentViewer;
    if ( ! viewer) { return; }

    var cam = viewer.GetCamera();
    viewer.ToggleMirror();
    viewer.SetCamera(cam.GetFocalPoint(), cam.GetRotation()+180.0, cam.Height);
    RecordState();
}


ViewEditMenu.prototype.SessionAdvance = function() {
// I do not have the session id and it is hard to get!
//    $.get(SESSIONS_URL+"?json=true&sessid="+$(obj).attr('sessid')+"&sessdb="+$(obj).attr('sessdb'),
//          function(data,status){
//            if (status == "success") {
//              ShowViewMenuAjax(data);
//            } else { alert("ajax failed."); }
//          });
}

ViewEditMenu.prototype.SessionAdvanceAjax = function() {
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
        if (NOTES_WIDGET.GetCurrentNote().Type == "Stack") {
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

        
        var d = new Dialog(DOWNLOAD_WIDGET);
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
        d = new Dialog(DOWNLOAD_WIDGET);
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

        DOWNLOAD_WIDGET.DialogApplyCallback = function () {
            if ( DOWNLOAD_WIDGET.Viewer) {
                // We are in the middle of rendering.
                // This method was called by the cancel dialog.
                DOWNLOAD_WIDGET.Viewer.CancelLargeImage();
                DOWNLOAD_WIDGET.Viewer = undefined;
                // The dialog hides itself.
            } else {
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
        }
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
function InitSlideSelector() {
    $('<div>')
        .appendTo(VIEW_PANEL)
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
        .appendTo(VIEW_PANEL)
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
        .appendTo(VIEW_PANEL)
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







