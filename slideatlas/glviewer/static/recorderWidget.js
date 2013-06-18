//I will have to think about this ...
//save state vs. save delta state.
//State is simple .... Supports undo better .... Start with this.

// Maybe students can link to the instructor recording session.  The could add notes which are added to the recording.

// It might be nice to know where the mouse is pointing at all times.  We need a pointing tool. That is alot of events though.  LATER....

// Design issue:
// Should I save the state at the end of a move or the begining?





// Pointer to 
var TIME_LINE = [];
var REDO_STACK = [];

var UNDO_BUTTON;
var REDO_BUTTON;

function InitRecorderWidget() {
    // Optional buttons.  Exposed for testing.
    UNDO_BUTTON = $('<img>').appendTo('body')
      .css({
        'opacity': '0.5',
        'position': 'absolute',
        'height': '30px',
        'bottom' : '5px',
        'right' : '100px',
        'z-index': '1'})
      .attr('src','webgl-viewer/static/undo.png')
      .hide()
      .click(function(){alert("undo");});
    REDO_BUTTON = $('<img>').appendTo('body').css({
        'opacity': '0.5',
        'position': 'absolute',
        'height': '30px',
        'bottom' : '5px',
        'right' : '70px',
        'z-index': '1'})
      .attr('src','webgl-viewer/static/redo.png')
      .hide()
      .click(function(){alert("REDO");});


    // We have to start with one state (since we are recording states at the end of a move).
    RecordState();
}


function NewPageRecord() {
  stateRecord = {};
  stateRecord.Viewers = [];
  stateRecord.Viewers.push(NewViewerRecord(VIEWER1));
  if (DUAL_VIEW) {
    stateRecord.Viewers.push(NewViewerRecord(VIEWER2));
  }
  // Note state? Which note is current.
  // Placeholder. Notes are not ready yet.
  
  return stateRecord;
}


function NewViewerRecord(viewer) {
  var cache = viewer.GetCache();
  
  var viewerRecord = {};
  
  viewerRecord.Database = cache.Database;
  viewerRecord.Collection = cache.Collection;
  // I could get this from the image / collection.
  viewerRecord.NumberOfLevels = cache.NumberOfLevels;

  var cam = viewer.GetCamera();
  var cameraRecord = {};
  cameraRecord.FocalPoint = cam.GetFocalPoint();
  cameraRecord.Height = cam.GetHeight();
  cameraRecord.Roll = cam.GetRotation();
  viewerRecord.Camera = cameraRecord;
  
  viewerRecord.AnnotationVisibility = viewer.GetAnnotationVisibility();
  if (viewerRecord.AnnotationVisibility) {
    viewerRecord.Annotations = [];
    for (var i = 0; i < viewer.WidgetList.length; ++i) {
      viewerRecord.Annotations.push(viewer.WidgetList[i].Serialize());
    }
  }
  
  return viewerRecord;
}

// Create a snapshot of the current state and push it on  the TIME_LINE stack.
function RecordState() {
  // Redo is an option after undo, until we save a new state.
  REDO_STACK = [];

  var pageRecord = NewPageRecord();
  var d = new Date();
  pageRecord.Time = d.getTime();
  //pageRecord.User = "bev"; // Place holder until I figure out user ids.
  TIME_LINE.push(pageRecord);
}


// Move the state back in time.
function UndoState() {
  if (TIME_LINE.length > 1) {
    // We need at least 2 states to undo.  The last state gets removed,
    // the second to last get applied.
    var record = TIME_LINE.pop();
    REDO_STACK.push(record);

    // Get the new end state
    record = TIME_LINE[TIME_LINE.length-1];
    // Now change the page to the state at the end of the timeline.
    SetNumberOfViews(record.Viewers.length);
    ApplyViewerRecord(VIEWER1, record.Viewers[0]);
    if (record.Viewers.length > 1) {
      ApplyViewerRecord(VIEWER2, record.Viewers[1]);
    }
  }
}

// Move the state forward in time.
function RedoState() {
  if (REDO_STACK.length == 0) {
    return;
  }
  var record = REDO_STACK.pop();
  TIME_LINE.push(record);

  // Now change the page to the state at the end of the timeline.
  SetNumberOfViews(record.Viewers.length);
  ApplyViewerRecord(VIEWER1, record.Viewers[0]);
  if (record.Viewers.length > 1) {
    ApplyViewerRecord(VIEWER2, record.Viewers[1]);
  }
}

function ApplyViewerRecord(viewer, viewerRecord) {
  var cache = viewer.GetCache();
  if (viewerRecord.Collection != cache.Collection) {
    var newCache = new Cache(viewerRecord.Database, 
                             viewerRecord.Collection, 
                             viewerRecord.NumberOfLevels);
    viewer.SetCache(newCache);
  }

  if (viewerRecord.Camera != undefined) {
    var cameraRecord = viewerRecord.Camera;
    viewer.SetCamera(cameraRecord.FocalPoint,
                     cameraRecord.Roll,
                     cameraRecord.Height);
  }
  
  if (viewerRecord.AnnotationVisibility != undefined) {
    viewer.AnnotationWidget.SetVisibility(viewerRecord.AnnotationVisibility);
  }
  if (viewerRecord.Annotations != undefined) {
    // For now lets just do the easy thing and recreate all the annotations.
    viewer.WidgetList = [];
    viewer.ShapeList = [];
    for (var i = 0; i < viewerRecord.Annotations.length; ++i) {
      viewer.LoadWidget(viewerRecord.Annotations[i]);
    }
  }
}


