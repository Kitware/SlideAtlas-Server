var CONNECTOME_SECTIONS;
var CONNECTOME_SECTION_META_DATA;

function InitConnectome () {
  $.ajax({
    type: "get",
    url: "/webgl-viewer/getconnectomesections",
    data: {"db"  : "TestVolume",
           "col" : "stitch_upload"},
    success: function(data,status) { ConnectomeLoadData(data);},
    error: function() { alert( "AJAX - error()" ); },
    });  
}

function ConnectomeLoadData (data) {
  CONNECTOME_SECTIONS = data.sections;
  ConnectomeLoadSection(CONNECTOME_SECTIONS[0]._id);
}

function ConnectomeLoadSection (sectionId) {
  $.ajax({
    type: "get",
    url: "/webgl-viewer/getconnectomesections",
    data: {"db"  : "TestVolume",
           "col" : "stitch_upload",
           "section" : sectionId},
    success: function(data,status) { ConnectomeLoadSectionData(data);},
    error: function() { alert( "AJAX - error()" ); },
    });  
}


// I am not exactly sure what the image coordinate system is.
function ConnectomeLoadSectionData (data) {
  CONNECTOME_SECTION_META_DATA = data;
  
  var section = new Section();
  section.Bounds = data.bounds;
  var worldPoints = data.worldPoints;

  for (var i = 0; i < data.images.length; ++i) {
    var imageData = data.images[i];
    // TODO: Take bounds out of cache and keep it in section.
    // Or make cache have bounds of only its image (if this is useful).
    var cache = new Cache(data.imageDatabaseName, imageData.collectionName, 8, data.bounds);
    cache.Source = "/webgl-viewer/tile?db="+data.imageDatabaseName+"&img="+imageData.collectionName+"&name=";
    var loop = [];
    for (var j = 0; j < imageData.loop.length; ++j) {
      var loopPt = new Object();
      loopPt.ImagePt = imageData.loop[j].pixelLocation;
      loopPt.WorldPt = worldPoints[imageData.loop[j].worldPointId].coordinates;
      loop.push(loopPt);
    }
    var centerPt = new Object();
    centerPt.ImagePt = imageData.center.pixelLocation;
    centerPt.WorldPt = worldPoints[imageData.center.worldPointId].coordinates;
    var warp = new LoopWarp(loop, centerPt);
    cache.Warp = warp;
    section.Caches.push(cache);
  }
  
  section.LoadRoots();
  VIEWER1.SetSection(section);
}




  
