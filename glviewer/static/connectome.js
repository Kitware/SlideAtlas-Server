var CONNECTOME_CURRENT_SECTION_INDEX = -1;
var CONNECTOME_SECTION_IDS;
var CONNECTOME_SECTIONS = [];
var CONNECTOME_SECTION_META_DATA;
var CONNECTOME_SECTION_LABEL;


function InitConnectome () {

  CONNECTOME_SECTION_LABEL =
    $('<div>').appendTo('body').attr({'id':'sectionLabel'})
              .css({'position': 'absolute',
                    'left': '20px',
                    'bottom': '30px',
                    'border-radius': '8px',
                    'font-size': '18px',
                    'background': '#ffffff',
                    'z-index': '2'});
              
  $.ajax({
    type: "get",
    url: "/webgl-viewer/getconnectomesections",
    data: {"db"  : DATABASE_NAME,
           "col" : COLLECTION_NAME,
           "type": "Section"},
    success: function(data,status) { ConnectomeLoadSectionIds(data);},
    error: function() { alert( "AJAX - error()" ); },
    });  
}


function ConnectomeAdvance(dz) {
  var idx = CONNECTOME_CURRENT_SECTION_INDEX + dz;
  if (idx < 0) { idx = 0; }
  if (idx >= CONNECTOME_SECTION_IDS.length) {
    idx = CONNECTOME_SECTION_IDS.length - 1;
  }
  ConnectomeSetCurrentSectionIndex(idx);
}


function ConnectomeLoadSectionIds (data) {
  CONNECTOME_SECTION_IDS = data.sections;
  ConnectomeSetCurrentSectionIndex(0);
}



function ConnectomeSetCurrentSectionIndex (sectionIndex) {
  if (CONNECTOME_CURRENT_SECTION_INDEX == sectionIndex) {
    return;
  }
  CONNECTOME_CURRENT_SECTION_INDEX = sectionIndex;

  var info = CONNECTOME_SECTION_IDS[sectionIndex];
  CONNECTOME_SECTION_LABEL.text(info.waferName + " : " + info.section);


  if (CONNECTOME_SECTIONS[sectionIndex]) {
    var section = CONNECTOME_SECTIONS[sectionIndex];

    // Load the section
    VIEWER1.SetSection(section);
    eventuallyRender();
    return;
  }

  var sectionId = CONNECTOME_SECTION_IDS[sectionIndex]._id;
  $.ajax({
    type: "get",
    url: "/webgl-viewer/getconnectomesections",
    data: {"db"  : DATABASE_NAME,
           "col" : COLLECTION_NAME,
           "id"  : sectionId,
           "type": "Section"},
    success: function(data,status) { ConnectomeLoadSection(data);},
    error: function() { alert( "AJAX - error()" ); },
    });  
}


function ConnectomeLoadSection (data) {
  // for debugging
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
  CONNECTOME_SECTIONS[CONNECTOME_CURRENT_SECTION_INDEX] = section;

  // Load the section
  VIEWER1.SetSection(section);
  eventuallyRender();
}




  
