// Todo There are two viewer menues for dual view.  
// I do not think we handle this well.


var HISTORY_MENU_ITEM;
function ToggleHistory() {
  $('#viewEditMenu').hide();
  var viewer = EVENT_MANAGER.CurrentViewer;
  if ( ! viewer) { return; }

  viewer.HistoryFlag = ! viewer.HitoryFlag;
  if (viewer.HistoryFlag) {
    HISTORY_MENU_ITEM.text("History Off")
  } else {
    HISTORY_MENU_ITEM.text("History On")
  }
  eventuallyRender();
}

// Legacy  get rid of this.
// Used wrongly in textWidget.js
// Stub it out until we fix this.
function ComparisonSaveAnnotations() {}


// Record the viewer into the current note and save into the database.
function SaveView() {
  NOTES_WIDGET.SaveCallback();
  $('#viewEditMenu').hide();
}

function GetViewerBounds (viewer) {
  var cam = viewer.GetCamera();
  var fp = cam.GetFocalPoint(); 
  var halfWidth = cam.GetWidth()/2;
  var halfHeight = cam.GetHeight()/2;
  return [fp[0]-halfWidth, fp[0]+halfWidth, fp[1]-halfHeight, fp[1]+halfHeight];
}

// Add bounds to view to overide image bounds.
function SetViewBounds() {
  var viewer = EVENT_MANAGER.CurrentViewer;
  var bounds = GetViewerBounds(viewer);
  var note = NOTES_WIDGET.GetCurrentNote();
  // Which view record?  Hack.
  var viewerRecord = note.ViewerRecords[0];
  if (viewer == VIEWER2) {
    var viewerRecord = note.ViewerRecords[1];
  }
  viewerRecord.OverviewBounds = bounds;
  // Set the image bounds so the new bounds are used immediately.
  viewerRecord.Image.bounds = viewerRecord.OverviewBounds;
  viewer.OverView.Camera.SetFocalPoint((bounds[0]+bounds[1])/2, (bounds[2]+bounds[3])/2);
  viewer.OverView.Camera.SetHeight(bounds[3]-bounds[2]);
  viewer.OverView.Camera.ComputeMatrix();
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
  $('#viewEditMenu').hide();
}

// Add bounds to view to overide image bounds.
function SetImageBounds() {
  var viewer = EVENT_MANAGER.CurrentViewer;
  var imageDb = viewer.GetCache().Image.database;
  var imageId = viewer.GetCache().Image._id;
  var bounds = GetViewerBounds(viewer);

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


  $('#viewEditMenu').hide();
}


//==============================================================================
// Create and manage the menu to edit dual views.


function ShowViewerEditMenu(viewer) {
    EVENT_MANAGER.CurrentViewer = viewer;
    var viewport = viewer.GetViewport();
    $('#viewEditMenu').css({'bottom': 10,
                            'left': viewport[0]+viewport[2]-230})
                      .show();
}


function InitViewEditMenus() {
    // Create the menu of edit options.
    $('<div>').appendTo('body').css({
        'background-color': 'white',
        'border-style': 'solid',
        'border-width': '1px',
        'border-radius': '5px',
        'position': 'absolute',
        'bottom' : '10px',
        'left' : '35px',
        'padding-right' : '30px',
        'z-index': '2',
        'color': '#303030',
        'font-size': '20px'
    }).attr('id', 'viewEditMenu').hide()
      .mouseleave(function(){$(this).fadeOut();});

    var viewEditSelector = $('<ol>');
    viewEditSelector.appendTo('#viewEditMenu')
             .attr('id', 'viewEditSelector')
             .css({'width': '100%', 'list-style-type':'none'});
    $('<li>').appendTo(viewEditSelector)
             .text("Load Slide")
             .click(function(){ShowViewBrowser();});
    if (EDIT) {
      $('<li>').appendTo(viewEditSelector)
               .text("Save View")
               .click(function(){SaveView();});
    }
    if (EDIT) {
      $('<li>').appendTo(viewEditSelector)
               .text("Download Image")
               .click(function(){DownloadImage();});
    }
    $('<li>').appendTo(viewEditSelector)
             .text("Slide Info")
             .click(function(){ShowSlideInformation();});

    // Test for showing coverage of view histor.
    HISTORY_MENU_ITEM = $('<li>').appendTo(viewEditSelector)
             .text("History On")
             .click(function(){ToggleHistory();});

    // Hack until we have some sort of scale.
    $('<li>').appendTo(viewEditSelector)
             .attr('id', 'dualViewCopyZoom')
             .text("Copy Zoom")
             .hide()
             .click(function(){CopyZoom();});
    $('<li>').appendTo(viewEditSelector)
             .text("Flip Horizontal")
             .click(function(){FlipHorizontal();});

    $('<li>').appendTo(viewEditSelector)
      .text('Color thresholding')
      .click(function() {pluginScarRatio.Start();});

    // I need some indication that the behavior id different in edit mode.
    // If the user is authorized, the new bounds are automatically saved.
    if (EDIT) {
      $('<li>').appendTo(viewEditSelector)
               .text("Save Overview Bounds")
               .click(function(){SetViewBounds();});
    } else {
      $('<li>').appendTo(viewEditSelector)
               .text("Set Overview Bounds")
               .click(function(){SetViewBounds();});
    }
    // Create a selection list of sessions.
    $('<div>').appendTo('body').css({
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
        'z-index': '2',
        'color': '#303030',
        'font-size': '20px'
    }).attr('id', 'sessionMenu').hide()
        .mouseleave(function(){$(this).fadeOut();});
    $('<ul>').appendTo('#sessionMenu').attr('id', 'sessionMenuSelector');

    // Create a selector for views.
    $('<div>').appendTo('body').css({
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
        'z-index': '2',
        'color': '#303030',
        'font-size': '20px'
    }).attr('id', 'viewMenu').hide()
        .mouseleave(function(){$(this).fadeOut();});
    $('<ul>').appendTo('#viewMenu').attr('id', 'viewMenuSelector'); // <select> for drop down

    $('<div>').appendTo('body').css({
        'background-color': 'white',
        'border-style': 'solid',
        'border-width': '1px',
        'border-radius': '5px',
        'position': 'absolute',
        'top' : '30%',
        'left' : '30%',
        'width': '40%',
        'height': '40%',
        'z-index': '2',
        'color': '#303030',
        'font-size': '20px'
    }).attr('id', 'slideInformation').hide()
      .mouseleave(function(){$(this).fadeOut();});
}


function CopyZoom() {
  $('#viewEditMenu').hide();
  var viewer = EVENT_MANAGER.CurrentViewer;
  if ( ! viewer) { return; }

  var cam = viewer.GetCamera();
  var copyCam;
  if (viewer == VIEWER1) {
    var copyCam = VIEWER2.GetCamera();
  } else {
    var copyCam = VIEWER1.GetCamera();
  }

  viewer.AnimateCamera(cam.GetFocalPoint(), cam.Roll, copyCam.Height);
}

function ShowSlideInformation() {
  $('#viewEditMenu').hide();
  var viewer = EVENT_MANAGER.CurrentViewer;
  if ( ! viewer) { return; }

  imageObj = viewer.MainView.Section.Caches[0].Image;

  $('#slideInformation')
    .html("File Name: " + imageObj.filename
          + "<br>Dimensions: " + imageObj.dimensions[0] + ", "
                               + imageObj.dimensions[1]
          + "<br>Levels: " + imageObj.levels)
    .show();
}


function ShowSlideInformation() {
  $('#viewEditMenu').hide();
  var viewer = EVENT_MANAGER.CurrentViewer;
  if ( ! viewer) { return; }

  imageObj = viewer.MainView.Section.Caches[0].Image;

  $('#slideInformation')
    .html("File Name: " + imageObj.filename
          + "<br>Dimensions: " + imageObj.dimensions[0] + ", "
                               + imageObj.dimensions[1]
          + "<br>Levels: " + imageObj.levels)
    .show();
}


// Mirror image
function FlipHorizontal() {
    $('#viewEditMenu').hide();
    // When the circle button is pressed, create the widget.
    var viewer = EVENT_MANAGER.CurrentViewer;
    if ( ! viewer) { return; }

    var cam = viewer.GetCamera();
    viewer.ToggleMirror();
    viewer.SetCamera(cam.GetFocalPoint(), cam.GetRotation()+180.0, cam.Height);
    RecordState();
}


function SessionAdvance() {
// I do not have the session id and it is hard to get!
//    $.get(SESSIONS_URL+"?json=true&sessid="+$(obj).attr('sessid')+"&sessdb="+$(obj).attr('sessdb'),
//          function(data,status){
//            if (status == "success") {
//              ShowViewMenuAjax(data);
//            } else { alert("ajax failed."); }
//          });
}

function SessionAdvanceAjax() {
}


// Make the download dialog / function a module.
var DownloadImage = (function () {

    // Dialogs require an object when accept is pressed.
    var DOWNLOAD_WIDGET = undefined;

    function DownloadImage() {
        if ( ! DOWNLOAD_WIDGET) {
            InitializeDialogs();
        }

        // Setup default dimensions.
        var viewport = EVENT_MANAGER.CurrentViewer.GetViewport();
        var d = DOWNLOAD_WIDGET.DimensionDialog;
        d.PxWidthInput.val(viewport[2]);
        d.PxHeightInput.val(viewport[3]);
        var pixelsPerInch = parseInt(d.SizeResInput.val());
        d.SizeWidthInput.val((viewport[2]/pixelsPerInch).toFixed(2));
        d.SizeHeightInput.val((viewport[3]/pixelsPerInch).toFixed(2));
        d.AspectRatio = viewport[2] / viewport[3];

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
                var viewer = EVENT_MANAGER.CurrentViewer;
                DOWNLOAD_WIDGET.Viewer = viewer;
                var width = parseInt(DOWNLOAD_WIDGET.DimensionDialog.PxWidthInput.val());
                var height = parseInt(DOWNLOAD_WIDGET.DimensionDialog.PxHeightInput.val());
                // Show the dialog that empowers the user to cancel while rendering.
                DOWNLOAD_WIDGET.CancelDialog.Show(1);
                // We need a finished callback to hide the cancel dialog.
                viewer.SaveLargeImage("slide-atlas.png", width, height,
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
