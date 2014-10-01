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
  $.get("/sessions?json=true",
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
  var sess = $(obj).attr('sessid');
  $.get("/sessions?json=true"+"&sessid="+$(obj).attr('sessid'),
        function(data,status){
          if (status == "success") {
            ViewBrowserAddSessionViews(data);
          } else { alert("ajax failed."); }
        });
}

function ViewBrowserAddSessionViews(sessionData) {
    var sessionItem = $("[sessid="+sessionData.sessid+"]");
    var viewList = $('<ul>').appendTo(sessionItem)
    for (var i = 0; i < sessionData.images.length; ++i) {
      var image = sessionData.images[i];
      var item = $('<li>').appendTo(viewList)
          // image.db did not work for ibriham stack (why?)
          .attr('db', image.db)
          .attr('sessid', sessionData.sessid)
          .attr('viewid', image.view)
          .click(function(){ViewBrowserImageCallback(this);});
      $('<img>').appendTo(item)
          .attr('src', "/thumb?db="+image.db+"&img="+image.img)
          .css({'height': '50px'});
      $('<span>').appendTo(item)
          .text(image.label);
      }
}

function ViewBrowserImageCallback(obj) {
  $('#viewBrowser').hide();

  // null implies the user wants an empty view.
  if (obj == null) {
    ACTIVE_VIEWER.SetCache(null);
    eventuallyRender();
    return;
  }

  var db = $(obj).attr('db');
  var viewid = $(obj).attr('viewid');

  $.ajax({
    type: "get",
    url: "/webgl-viewer/getview",
    data: {"sessid": $(obj).attr('sessid'),
           "viewid": $(obj).attr('viewid'),
           "db"  : $(obj).attr('db')},
    success: function(data,status) { ViewBrowserLoadImage(data);},
    error: function() { alert( "AJAX - error() : getview (browser)" ); },
  });
}

function ViewBrowserLoadImage(viewData) {
  // If we want to take origin and spacing into account, then we need to change tile geometry computation.
  var imgobj = viewData.ViewerRecords[0].Image;
  var source = new Cache(imgobj);

  ACTIVE_VIEWER.SetCache(source);

  RecordState();

  eventuallyRender();
}







