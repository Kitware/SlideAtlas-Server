//==============================================================================
// Create a menu to select images.



function ImageBrowser(parent) {
  this.Parent = parent;
  ReloadImageBrowserInfo();
}

function Load() {
  // Get a list of databases this user has access to.

  $.get("./sessions?json=true",
          function(data,status){
            if (status == "success") {
              VIEW_BROWSER_INFO = data;
              // I might want to open a session to avoid an extra click.
              // I might want to sort the sessions to put the recent at the top.
              LoadImageBrowserGUI(data);
            } else { alert("ajax failed."); }
          });
}



function ShowImageBrowser() {
  ACTIVE_VIEWER = EVENT_MANAGER.CurrentViewer;
  if ( ! ACTIVE_VIEWER) { return; }

  $('#ImageBrowser').show();
}



function LoadImageBrowserGUI() {
  var data = VIEW_BROWSER_INFO;
  $('#ImageBrowser').empty();
  groupList = $('<ul>').appendTo('#ImageBrowser')

  for (i=0; i < data.sessions.length; ++i) {
    var group = data.sessions[i];
    var groupItem = $('<li>').appendTo(groupList).text(group.rule);
    var sessionList = $('<ul>').appendTo(groupItem)
    for (j=0; j < group.sessions.length; ++j) {
      var session = group.sessions[j];
      $('<li>').appendTo(sessionList)
          .text(session.label)
          .attr('db', session.sessdb).attr('sessid', session.sessid)
          .bind('click', function(){ImageBrowserSessionCallback(this);});
    }
  }
}

function ImageBrowserSessionCallback(obj) {
  // No closing yet.
  // Already open. disable iopening twice.
  $(obj).unbind('click');

  // We need the information in view, image and bookmark (startup_view) object.
  //window.location = "http://localhost:8080/webgl-viewer/comparison-option?db="+$(obj).attr('db')+"&viewid="+$(obj).attr('viewid');
  //$.get("http://localhost:8080/webgl-viewer/comparison-option?db="+$(obj).attr('db')+"&viewid="+$(obj).attr('viewid'),
  var db = $(obj).attr('db');
  var sess = $(obj).attr('sessid');
  $.get("./sessions?json=true"+"&sessdb="+$(obj).attr('db')+"&sessid="+$(obj).attr('sessid'),
        function(data,status){
          if (status == "success") {
            ImageBrowserAddSessionViews(data);
          } else { alert("ajax failed."); }
        });
}

function ImageBrowserAddSessionViews(sessionData) {
    var sessionItem = $("[sessid="+sessionData.sessid+"]");
    var viewList = $('<ul>').appendTo(sessionItem)
    for (var i = 0; i < sessionData.images.length; ++i) {
      var image = sessionData.images[i];
      var item = $('<li>').appendTo(viewList)
          .attr('db', image.db).attr('viewid', image.view)
          .click(function(){ImageBrowserImageCallback(this);});
      $('<img>').appendTo(item)
          .attr('src', "tile?db="+image.db+"&img="+image.img+"&name=t.jpg")     // all images should have thumb.jpg
          .css({'height': '50px'});
      $('<span>').appendTo(item)
          .text(image.label);
      }
}
        
function ImageBrowserImageCallback(obj) {
  $('#ImageBrowser').hide();
  
  // null implies the user wants an empty view.
  if (obj == null) {
    ACTIVE_VIEWER.SetCache(null);
    eventuallyRender();
    return;
  }
  
  var db = $(obj).attr('db');
  var viewid = $(obj).attr('viewid');

  $.get("./webgl-viewer?json=true"+"&db="+$(obj).attr('db')+"&view="+$(obj).attr('viewid'),
        function(data,status){
          if (status == "success") {
            ImageBrowserLoadImage(data);
          } else { alert("ajax failed."); }
        });
}

function ImageBrowserLoadImage(viewData) {
  // If we want to take origin and spacing into account, then we need to change tile geometry computation.
  var image = viewData.collection;
  if ( typeof(viewData.image) != undefined) {
    image = viewData.image;
  }
  var imgobj = {};
  imgobj._id = image;
  imgobj.database = viewData.db;
  imgobj.levels = viewData.levels;
  imgobj.bounds = [0, viewData.dimensions[0], 0, viewData.dimensions[1]];
  var source = new Cache(imgobj);

  ACTIVE_VIEWER.SetCache(source);
   
  // all this does is set the default camera.
  ACTIVE_VIEWER.SetDimensions(viewData.dimensions);

    // Handle exceptions in database schema.
  if ( viewData.center) {
    ACTIVE_VIEWER.SetCamera(viewData.center, 
                            viewData.rotation, 
                            viewData.viewHeight);
  }
  
  RecordState();

  eventuallyRender();
}







