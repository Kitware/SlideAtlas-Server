var CONNECTOME_CURRENT_SECTION_INDEX = -1;
var CONNECTOME_SECTION_IDS;
var CONNECTOME_SECTIONS = [];
var CONNECTOME_SECTION_META_DATA;
var CONNECTOME_SECTION_LABEL;

var CONNECTOME_POPUP_MENU_BUTTON;
var CONNECTOME_POPUP_MENU;


byteArrayToInt32 = function(byteArray) {
    var parser = new BinaryParser(true,true);
    var value = 0;
    var numInts = byteArray.length / 4;
    var output = new Array(numInts);
    var data = new Uint8Array(4);
    for (var i = 0, j = 0; j < numInts; ++j) {
      //value = byteArray[i++];
      //value = (value * 256) + byteArray[i++];
      //value = (value * 256) + byteArray[i++];
      //value = (value * 256) + byteArray[i++];
      //output[j] = value;
      data[0] = byteArray[i++];
      data[1] = byteArray[i++];
      data[2] = byteArray[i++];
      data[3] = byteArray[i++];
      output[j] = parser.toInt(data);
    }

    return output;
};

byteArrayToFloat64 = function(byteArray) {
    var parser = new BinaryParser(true,true);
    var value = 0;
    var numFloats = byteArray.length / 8;
    var output = new Array(numFloats);
    var data = new Uint8Array(8);
    for (var i = 0, j = 0; j < numFloats; ++j) {
      data[0] = byteArray[i++];
      data[1] = byteArray[i++];
      data[2] = byteArray[i++];
      data[3] = byteArray[i++];
      data[4] = byteArray[i++];
      data[5] = byteArray[i++];
      data[6] = byteArray[i++];
      data[7] = byteArray[i++];
      output[j] = parser.toDouble(data);
    }

    return output;
};



function b64ToUint6 (nChr) {

  return nChr > 64 && nChr < 91 ?
      nChr - 65
	: nChr > 96 && nChr < 123 ?
      nChr - 71
	: nChr > 47 && nChr < 58 ?
      nChr + 4
	: nChr === 43 ?
      62
	: nChr === 47 ?
      63
	:
	0;

}

function base64DecToArr (sBase64, nBlocksSize) {

  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
	nMod4 = nInIdx & 3;
	nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
	if (nMod4 === 3 || nInLen - nInIdx === 1) {
	    for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
		taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
	    }
	    nUint24 = 0;

	}
    }

    return taBytes;
}

function base64DecToArr (sBase64, nBlocksSize) {

  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
	nMod4 = nInIdx & 3;
	nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
	if (nMod4 === 3 || nInLen - nInIdx === 1) {
	    for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
		taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
	    }
	    nUint24 = 0;

	}
    }

    return taBytes;
}



function InitConnectome () {

  CONNECTOME_SECTION_LABEL =
    $('<div>')
      .appendTo('body').attr({'id':'sectionLabel'})
      .css({'position': 'absolute',
            'left': '45px',
            'bottom': '30px',
            'border-radius': '8px',
            'font-size': '18px',
            'background': '#ffffff',
            'z-index': '2'});

  CONNECTOME_POPUP_MENU_BUTTON = $('<img>')
    .appendTo('body')
    .css({
      'position': 'absolute',
      'height': '20px',
      'width': '20x',
      'left' : '20px',
      'bottom' : '32px',
      'z-index': '2'})
    .attr('src',"static/images/plus.jpg")
    .mouseenter(function() {CONNECTOME_POPUP_MENU.fadeIn(); })
    .click(function(){ShowCorrelationsCallback();});

  // For less used buttons that appear when mouse is over the pulldown button.
  // I would like to make a dynamic bar that puts extra buttons into the pulldown as it resizes.
  CONNECTOME_POPUP_MENU = $('<div>').attr({'id':'popup'})
    .appendTo('body')
    .css({'position': 'absolute',
         'left': '20px',
         'bottom': '32px',
         'z-index': '2',
         'background-color': 'white',
         'padding': '5px',
         'border-radius': '8px',
         'border-style': 'solid',
         'border-width':'1px'})
    .hide()
    .mouseleave(function(){
      var self = $(this),
      timeoutId = setTimeout(function(){CONNECTOME_POPUP_MENU.fadeOut();}, 650);
      //set the timeoutId, allowing us to clear this trigger if the mouse comes back over
      self.data('timeoutId', timeoutId);  })
    .mouseenter(function(){
      clearTimeout($(this).data('timeoutId')); });                       

  var removeButton = $('<button>')
    .appendTo(CONNECTOME_POPUP_MENU)
    .text("Remove Section")
    .css({'color' : '#278BFF', 'width':'100%','font-size': '18px'})
    .click( RemoveSectionCallback  );

  var loadButton = $('<button>')
    .appendTo(CONNECTOME_POPUP_MENU)
    .text("Load Neighborhood")
    .css({'color' : '#278BFF', 'width':'100%','font-size': '18px'})
    .click( LoadNeighborhoodCallback  );

  var showMeshButton = $('<button>')
    .appendTo(CONNECTOME_POPUP_MENU)
    .text("Show Mesh")
    .css({'color' : '#278BFF', 'width':'100%','font-size': '18px'})
    .click( ShowMeshCallback  );
    
  var showCorrelationsButton = $('<button>')
    .appendTo(CONNECTOME_POPUP_MENU)
    .text("Show Correlations")
    .css({'color' : '#278BFF', 'width':'100%','font-size': '18px'})
    .click( ShowCorrelationsCallback  );
    
  $.ajax({
    type: "get",
    url: "/getsections",
    data: {"db"  : DATABASE_NAME,
           "col" : COLLECTION_NAME,
           "type": "Section"},
    success: function(data,status) { ConnectomeLoadSectionIds(data);},
    error: function() { alert( "AJAX - error(): getsections ids" ); },
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
  // Look at cookies to find out what section was being viewed
  var wafer = getCookie("wafer");
  var section = getCookie("section");
  if (wafer && section) {
    section = parseInt(section);
    for (var idx = 0; idx < CONNECTOME_SECTION_IDS.length; ++idx) {
      var info = CONNECTOME_SECTION_IDS[idx];
      if (info.waferName == wafer && info.section == section) {
        ConnectomeSetCurrentSectionIndex(idx);
        return;
      }
    }
  }
  ConnectomeSetCurrentSectionIndex(0);
}



function ConnectomeSetCurrentSectionIndex (sectionIndex) {
  if (CONNECTOME_CURRENT_SECTION_INDEX == sectionIndex) {
    return;
  }
  CONNECTOME_CURRENT_SECTION_INDEX = sectionIndex;

  var info = CONNECTOME_SECTION_IDS[sectionIndex];
  CONNECTOME_SECTION_LABEL.text(info.waferName + " : " + info.section);
  setCookie("wafer",info.waferName, 30);
  setCookie("section",info.section.toFixed(), 30);

  var section = CONNECTOME_SECTIONS[sectionIndex];
  if (section) {
    // Load the section
    VIEWER1.SetSection(section);
    VIEWER1.ShapeList = section.Markers;
    eventuallyRender();
    return;
  }

  section = new Section();
  section.Index = sectionIndex; // for debugging
  CONNECTOME_SECTIONS[sectionIndex] = section;

  var t = new Date().getTime();
  console.log("Start loading " + t);
  
  var sectionId = CONNECTOME_SECTION_IDS[sectionIndex]._id;
  $.ajax({
    type: "get",
    url: "/getsections",
    data: {"db"  : DATABASE_NAME,
           "col" : COLLECTION_NAME,
           "id"  : sectionId,
           "idx" : sectionIndex,
           "type": "Section"},
    success: function(data,status) { ConnectomeLoadSection(data, true);},
    error: function() { alert( "AJAX - error(): getsections " + sectionId ); },
    });  
}




// Mesh from points and connectivity.
function ConnectomeCreateMeshWarp (imageData, worldPoints) {
  // Create the points array.
  var points = [];
  for (var j = 0; j < imageData.meshPoints.length; ++j) {
    var meshPt = new Object();
    meshPt.ImagePt = imageData.meshPoints[j].pixelLocation;
    meshPt.WorldPt = worldPoints[imageData.meshPoints[j].worldPointId].coordinates;
    points.push(meshPt);
  }
  // Create the triangle array.
  var triangles = [];
  for (var j = 0; j < imageData.meshTriangles.length; ++j) {
    triangles.push([imageData.meshTriangles[j][0],
                    imageData.meshTriangles[j][1],
                    imageData.meshTriangles[j][2]]);
  }

  return new meshWarp(points, triangles);
}

// Mesh from points and connectivity.
function ConnectomeCreateMeshWarpFromLoop (imageData, worldPoints) {
  var centerPt = new Object();
  centerPt.ImagePt = imageData.center.pixelLocation;
  centerPt.WorldPt = worldPoints[imageData.center.worldPointId].coordinates;

  // Create the points array.
  var points = [centerPt];

  for (var j = 0; j < imageData.loop.length; ++j) {
    var loopPt = new Object();
    loopPt.ImagePt = imageData.loop[j].pixelLocation;
    loopPt.WorldPt = worldPoints[imageData.loop[j].worldPointId].coordinates;
    points.push(loopPt);
  }

  // Create the triangle array.
  var triangles = [];
  for (var j = 1; j < imageData.loop.length; ++j) {
    triangles.push([0,j,j+1]);
  }
  // create the last triangle. (loops around).
  triangles.push([0, imageData.loop.length, 1]);


  return new meshWarp(points, triangles);
}


function ConnectomeCreateLoopWarp (imageData, worldPoints) {
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
  return new LoopWarp(loop, centerPt);
}


//
function ConnectomeLoadSection (data, showFlag) {
  var section = new Section();

  // for debugging
  CONNECTOME_SECTION_META_DATA = data;

  var t = new Date().getTime();
  console.log("Received section data " + t);


  if (data.worldPointsFloat64) {
    var tmp = base64DecToArr(data.worldPointsFloat64);
    var numPts = tmp.length / 16;
    tmp = byteArrayToFloat64(tmp);
    data.worldPoints = new Array(numPts);
    for (var i=0, j=0; i < numPts; ++i) {
      data.worldPoints[i] = {"coordinates": [tmp[j++],tmp[j++]]};
    }    
  }
  
  section.Bounds = data.bounds;
  var worldPoints = data.worldPoints;

  for (var imIdx = 0; imIdx < data.images.length; ++imIdx) {
    var imageData = data.images[imIdx];
    if (imageData.meshPointsInt32) {
      var tmp = base64DecToArr(imageData.meshPointsInt32);
      var numPts = tmp.length / 8;
      tmp = byteArrayToInt32(tmp);
      tmpIds = byteArrayToInt32(base64DecToArr(imageData.meshPointIdsInt32));      
      imageData.meshPoints = new Array(numPts);
      for (var i = 0, j=0; i < numPts; ++i) {
        imageData.meshPoints[i] = {"worldPointId":tmpIds[i], "pixelLocation": [tmp[j++],tmp[j++]]};
      }    
    }

    if (imageData.meshTrianglesInt32) {
      var tmp = base64DecToArr(imageData.meshTrianglesInt32);
      var numTris = tmp.length / 12;
      tmp = byteArrayToInt32(tmp);
      imageData.meshTriangles = new Array(numTris);
      for (var i = 0, j=0; i < numTris; ++i) {
        imageData.meshTriangles[i] = [tmp[j++],tmp[j++],tmp[j++]];
      }    
    }

    var t2 = new Date().getTime();
    console.log("Decoded binary data " + t2);


    // TODO: Take bounds out of cache and keep it in section.
    // Or make cache have bounds of only its image (if this is useful).
    var cache = new Cache({"database" : data.imageDatabaseName, 
                           "_id"      : imageData.collectionName, 
                           "levels"   : 8, 
                           "bounds"   : data.bounds});
    cache.Source = "/tile?db="+data.imageDatabaseName+"&img="+imageData.collectionName+"&name=";
    //var warp = ConnectomeCreateLoopWarp(imageData, worldPoints);

    if (imageData.center) {
      cache.Warp = ConnectomeCreateMeshWarpFromLoop(imageData, worldPoints);
    } else {
      cache.Warp = ConnectomeCreateMeshWarp(imageData, worldPoints);
    }
    section.Caches.push(cache);
  }
  
  // index passed to server and returned.
  // Better solution would be to use a section.method as the ajax callback.
  CONNECTOME_SECTIONS[data.index] = section;

  if (showFlag) {
    // Skip roots for pre loading
    section.LoadRoots();
    // Load the section
    VIEWER1.SetSection(section);
    // The marker array is empty here.
    VIEWER1.ShapeList = section.Markers;
    eventuallyRender();
  } else {
    // Loading in the background.
    // Load the tiles for the current view but do not show them.
    section.LoadTilesInView2(VIEWER1.MainView);
  }

  var t3 = new Date().getTime();
  console.log("done setting up caches " + t3);
}

// Load 100 sections after the current section.
// Load for the current view.

// It would be nice to have a progress bar.
function LoadNeighborhoodCallback() {
  CONNECTOME_POPUP_MENU.hide();  

  InitProgressBar();

  var endIdx = CONNECTOME_CURRENT_SECTION_INDEX + 10;
  if (endIdx >= CONNECTOME_SECTION_IDS.length) {
    endIdx = CONNECTOME_SECTION_IDS.length - 1;
  }

  // Trouble hanging. Lets try to slow dow the requests.
  CONNECTOME_SECTION_TO_LOAD = endIdx;
  LoadNextNeighborSection();
}



function LoadNextNeighborSection() {
  var i = CONNECTOME_SECTION_TO_LOAD;
  $.ajax({
    type: "get",
    url: "/getsections",
    data: {"db"  : DATABASE_NAME,
           "col" : COLLECTION_NAME,
           "id"  : CONNECTOME_SECTION_IDS[i]._id,
           "idx" : i,
           "type": "Section"},
        success: function(data,status) { ConnectomeLoadSection(data, false);},
        error: function() { alert( "AJAX - error(): getsections (next) " + CONNECTOME_SECTION_IDS[i]._id ); },
      });  

  --CONNECTOME_SECTION_TO_LOAD;
  if (CONNECTOME_SECTION_TO_LOAD > CONNECTOME_CURRENT_SECTION_INDEX) {
      setTimeout(function(){LoadNextNeighborSection();}, 250);
  } else {
    // Reverse order so the proximal sections get loaded first.
    var endIdx = CONNECTOME_CURRENT_SECTION_INDEX + 10;
    if (endIdx >= CONNECTOME_SECTION_IDS.length) {
      endIdx = CONNECTOME_SECTION_IDS.length - 1;
    }
    for (var i = endIdx; i > CONNECTOME_CURRENT_SECTION_INDEX; --i) {
      section = CONNECTOME_SECTIONS[i];
      if (section) {
        section.LoadTilesInView(VIEWER1.MainView);
      }
    }
  }
}


function RemoveSectionCallback() {
  var info = CONNECTOME_SECTION_IDS[CONNECTOME_CURRENT_SECTION_INDEX];
  $.ajax({
    type: "get",
    url: "/removeobject",
    data: {"db"    : DATABASE_NAME,
           "col"   : COLLECTION_NAME,
           "id"    : info._id},
    success: function(data,status) { ConnectomeAdvance(1);},
    error: function() { alert( "AJAX - error(): removeobject " + info._id ); },
    });  
}


function ShowCorrelationsCallback() {
  CONNECTOME_POPUP_MENU.hide();
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
    error: function() { alert( "AJAX - error(): getcorrelations" ); },
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


// For debugging the mesh interpolation.
function ShowMeshCallback() {
  var section = CONNECTOME_SECTIONS[CONNECTOME_CURRENT_SECTION_INDEX];  
  for (var i = 0; i < section.Caches.length; ++i) {
    var cache = section.Caches[i];
    var shape = new Mesh();
    shape.LineWidth = 0;
    shape.OutlineColor = [1,0,0];
    shape.FixedSize = false;
    shape.WireFrame = true;
    for (var j = 0; j < cache.Warp.Points.length; ++j) {
      shape.Points.push(cache.Warp.Points[j].WorldPt);  
    }
    shape.Triangles = cache.Warp.Triangles;
    shape.UpdateBuffers();
    VIEWER1.ShapeList.push(shape);
  }

  VIEWER1.AnnotationVisibility = true;
  eventuallyRender();
}
