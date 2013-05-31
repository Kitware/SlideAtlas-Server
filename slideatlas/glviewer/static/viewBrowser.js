//==============================================================================
// Create and manage the menu to browse and select views.
// Until I get a tree browser (open / close, expand / collapse),
// Just show one session.

// When the menu first is shown, this gets set to remeber which viewer to change.
var ACTIVE_VIEWER;
var VIEW_BROWSER_INFO;

function ShowViewBrowser() {
  ACTIVE_VIEWER = EVENT_MANAGER.CurrentViewer;
  if ( ! ACTIVE_VIEWER) { return; }

  $('#viewBrowser').show();
}

function InitViewBrowser() {
    // A view browser (short cut menu) for the text input.
    $('<div>').appendTo('body').hide().css({
        'background-color': 'white',
        'opacity': '0.9',
        'border-radius': '5px',
        'position': 'absolute',
        'top' : '10%',
        'height' : '80%',
        'left' : '20%',
        'width': '60%',
        'z-index': '2',
        'text-align': 'left',
        'color': '#303030',
        'font-size': '20px',
        'overflow': 'scroll'
    }).attr('id', 'viewBrowser')
      .mouseleave(function () {$('#viewBrowser').hide();});
    
    ReloadViewBrowserInfo();
}

function ReloadViewBrowserInfo() {
  // Get the sessions this user has access to.
  $.get("./sessions?json=true",
          function(data,status){
            if (status == "success") {
              VIEW_BROWSER_INFO = data;
              // I might want to open a session to avoid an extra click.
              // I might want to sort the sessions to put the recent at the top.
              LoadViewBrowserGUI(data);
            } else { alert("ajax failed."); }
          });
}

function LoadViewBrowserGUI() {
  var data = VIEW_BROWSER_INFO;
  $('#viewBrowser').empty();
  groupList = $('<ul>').appendTo('#viewBrowser')
  for (i=0; i < data.sessions.length; ++i) {
    var group = data.sessions[i];
    var groupItem = $('<li>').appendTo(groupList).text(group.rule);
    var sessionList = $('<ul>').appendTo(groupItem)
    for (j=0; j < group.sessions.length; ++j) {
      var session = group.sessions[j];
      $('<li>').appendTo(sessionList)
          .text(session.label)
          .attr('db', session.sessdb).attr('sessid', session.sessid)
          .bind('click', function(){ViewBrowserSessionCallback(this);});
    }
  }
}

function ViewBrowserSessionCallback(obj) {
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
            ViewBrowserAddSessionViews(data);
          } else { alert("ajax failed."); }
        });
}

//tile?db=5074589002e31023d4292d83&img=4f14a3975877180e08000001&name=thumb.jpg
function ViewBrowserAddSessionViews(sessionData) {
    var sessionItem = $("[sessid="+sessionData.sessid+"]");
    var viewList = $('<ul>').appendTo(sessionItem)
    for (var i = 0; i < sessionData.images.length; ++i) {
      var image = sessionData.images[i];
      var item = $('<li>').appendTo(viewList)
          .attr('db', image.db).attr('viewid', image.view)
          .click(function(){ViewBrowserImageCallback(this);});
//<img src="{{url_for('tile.tile')}}?db={{animage.db}}&img={{animage.img}}&name=t.jpg" width=100px>
//tile?db=5074589002e31023d4292d83&img=4f14a3975877180e08000001&name=thumb.jpg
      $('<img>').appendTo(item)
          .attr('src', "tile?db="+image.db+"&img="+image.img+"&name=thumb.jpg")
          .css({'height': '50px'});
      $('<span>').appendTo(item)
          .text(image.label);
      }
}
        
function ViewBrowserImageCallback(obj) {
  $('#viewBrowser').hide();

  var db = $(obj).attr('db');
  var viewid = $(obj).attr('viewid');

  $.get("./webgl-viewer?json=true"+"&db="+$(obj).attr('db')+"&view="+$(obj).attr('viewid'),
        function(data,status){
          if (status == "success") {
            ViewBrowserLoadImage(data);
          } else { alert("ajax failed."); }
        });
}

function ViewBrowserLoadImage(viewData) {
  var source = new Cache("/tile?img="+viewData.collection+"&db="+viewData.db+"&name=", viewData.levels);
  ACTIVE_VIEWER.SetCache(source);
  
  ACTIVE_VIEWER.SetDimensions(viewData.dimensions);
  ACTIVE_VIEWER.SetCamera(viewData.center, 
                          viewData.rotation, 
                          viewData.viewHeight);
  eventualyRender();
}







