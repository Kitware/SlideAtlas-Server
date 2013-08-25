var CONNECTOME_CURRENT_SECTION_INDEX = -1;
var CONNECTOME_SECTION_IDS;
var CONNECTOME_SECTIONS = [];
var CONNECTOME_SECTION_META_DATA;
var CONNECTOME_SECTION_LABEL;


function InitConnectome () {

  CONNECTOME_SECTION_LABEL =
    $('<div>').appendTo('body').attr({'id':'sectionLabel'})
              .css({'position': 'absolute',
                    'left': '45px',
                    'bottom': '30px',
                    'border-radius': '8px',
                    'font-size': '18px',
                    'background': '#ffffff',
                    'z-index': '2'});

  var correlationButton = $('<img>').appendTo('body')
    .css({
      'position': 'absolute',
      'height': '20px',
      'width': '20x',
      'bottom' : '32px',
      'left' : '20px',
      'z-index': '2'})
    .attr('src',"static/images/plus.jpg")
    .click(function(){ToggleCorrelations();});
              
  $.ajax({
    type: "get",
    url: "/getsections",
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
    VIEWER1.ShapeList = section.Markers;
    eventuallyRender();
    return;
  }

  var sectionId = CONNECTOME_SECTION_IDS[sectionIndex]._id;
  $.ajax({
    type: "get",
    url: "/getsections",
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
    cache.Source = "/tile?db="+data.imageDatabaseName+"&img="+imageData.collectionName+"&name=";
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
  // Empty here.
  VIEWER1.ShapeList = section.Markers;
  eventuallyRender();
}



function ToggleCorrelations() {
  var sectionIndex = CONNECTOME_CURRENT_SECTION_INDEX;
  var section = CONNECTOME_SECTIONS[sectionIndex];
  if (section.Markers.length > 0) {
    return;
  }

  var info = CONNECTOME_SECTION_IDS[sectionIndex];
  $.ajax({
    type: "get",
    url: "/getcorrelations",
    data: {"db"    : DATABASE_NAME,
           "col"   : COLLECTION_NAME,
           "wafer" : info.waferName,
           "sect"  : info.section},
    success: function(data,status) { ConnectomeLoadCorrelations(data);},
    error: function() { alert( "AJAX - error()" ); },
    });  
}





  
function ConnectomeLoadCorrelations(data) {
  var sectionIndex = CONNECTOME_CURRENT_SECTION_INDEX;
  var section = CONNECTOME_SECTIONS[sectionIndex];
  // Mark correlations for debugging.
  for (var i = 0; i < data.CorrelationArray0.length; ++i) {
    var point = data.CorrelationArray0[i].point0;
    // Find the image.  We need to convert the image coordinate to a world coordinate.
    var source = section.FindImage(point.imageCollectionName); 
    if (source) {
      addMarkerToSection(section, source.ImageToWorld(point.imageCoordinates), [1,0,0]);
    }
  }
  for (var i = 0; i < data.CorrelationArray1.length; ++i) {
    var point = data.CorrelationArray1[i].point1;
    // Find the image.  We need to convert the image coordinate to a world coordinate.
    var source = section.FindImage(point.imageCollectionName); 
    if (source) {
      addMarkerToSection(section, source.ImageToWorld(point.imageCoordinates), [0,1,1]);
    }
  }
  VIEWER1.ShapeList = section.Markers;
  VIEWER1.AnnotationVisibility = true;
  eventuallyRender();
}


function addMarkerToSection(section, worldPt, fillColor) {
  var mark = new CrossHairs();
  mark.LineWidth = 0;
  mark.Length = 20;
  mark.FillColor = fillColor;
  mark.OutlineColor = [1,1,1];
  mark.Origin = worldPt;
  section.Markers.push(mark);
}

      