//I will have to think about this ...
//save state vs. save delta state.
//State is simple .... Supports undo better ....
//How deep do you go into the state?  I assume annotation, but what about notes ...

// Start by implementing undo.

// This class gives an API for recording events.
// Events to be recorded:
// View switch: {single, dual}
// Load a new image: db, viewId, viewIdx {0,1} // Which viewer got a new source.
// Camera Changed: Height, FocalPoint, Roll, viewIdx {0,1}
// Annotation: Id, eventType: {New, Delete, Change}, info // options, annotation specific
// Load Note: Id

// Should we save the recording state in a cookie so the user can change sessions?
// A recording icon (stop button) should be visible.

// Maybe students can link to the instructor recording session.  The could add notes which are added to the recording.

// It might be nice to know where the mouse is pointing at all times.  We need a pointing tool. That is alot of events though.  LATER....

// Recording can implement undo too.  Save in local array vs aave in database.
// DESIGN ISSUE:
// Records have Object and State
//   Example of objects are Viewers and AnnotationWidgets.
//   I could save the object or an ID / index for the object.
//   Local is easy. However, we will probably want to synchronize clients.
//   Database ID would be natural, but object may not be in the database.

// DESIGN ISSUE:
// We cannot rely on the consistancy of the database, recording will
// have to build eveything from atomic object. i.e. when a viewer
// loads an image, we must separatly record the default camera and annotations
// that get loaded with it.  When recording is turned on, we must serialize the current state
 


var TIME_LINE = [];
var UNDO_BUTTON;
// set by the viewEditMenu (for the moment).
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

  // Add an item "button" to the start menu.  
}


function NewPageRecord() {
  stateRecord = {};
  stateRecord.Viewers = [];
  stateRecord.Viewers.push(NewViewerRecord(VIEWER1));
  if (DUAL_VIEW) {
  stateRecord.Viewers.push(NewViewerRecord(VIEWER2));
  }
  // Note state?
  
  return stateRecord;
}


function NewViewerRecord(viewer) {
  var cache = viewer.Cache;
  
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
    for (var i = 0; i < viewer.Annotations.length; ++i) {
      viewerRecord.Annotations.push(NewAnnotationRecord(viewer.Annotations[i]));
    }
  }
  
  return viewerRecord;
}


function NewAnnotationRecord(annotation) {
  var cache = viewer.Cache;
}  


// Generic
// Schema of events is assume to be consistent as defined by the user.
function RecordState() {
  var info = {};
  // We do not need this object reference yet.
  // It would be useful for undo.
  // info.Object = object;
  //info.Id = id;
  var d = new Date();
  info.Time = d.getTime();
  info.User = "bev"; // Place holder until I figure out user ids.
  TIME_LINE.push(info);
}


