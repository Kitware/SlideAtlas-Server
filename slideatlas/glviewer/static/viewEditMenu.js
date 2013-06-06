// Used wrongly in textWidget.js
// Stub it out until we fix this.
function ComparisonSaveAnnotations() {}


// We need to remeber which viewer an open dialog applies to.




//==============================================================================
// Create and manage the menu to edit dual views.

// We need cookies for copy and past options.
function setCookie(c_name,value,exdays)
{
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name)
{
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++)
    {
      x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
      y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
      x=x.replace(/^\s+|\s+$/g,"");
      if (x==c_name)
        {
        return unescape(y);
        }
      }
}




function ShowViewEditMenu(x, y) {
    // Viewers have independent annotation visibility (which could be annoying.
    var viewer = EVENT_MANAGER.CurrentViewer;
    if ( ! viewer) { return; }

    var color = "#A0A0A0";
    if (viewer.WidgetList.length > 0) {
      color = "#000000";
    }

    if (GetAnnotationVisibility(viewer)) {
      $('#toggleAnnotationVisibility').text("Hide Annotations").css({'color': color});
    } else {
      $('#toggleAnnotationVisibility').text("Show Annotations").css({'color': color});
    }
 
    $('#viewEditMenu').css({'top': y, 'left':x}).show();
}

function InitViewEditMenus() {
    // Create the menu of edit options.
    $('<div>').appendTo('body').css({
        'background-color': 'white',
        'border-style': 'solid',
        'border-width': '1px',
        'border-radius': '5px',
        'position': 'absolute',
        'top' : '35px',
        'left' : '35px',
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
             .text("Load View")
             .click(function(){ShowViewBrowser();});
    // Hack until we have some sort of scale.
    $('<li>').appendTo(viewEditSelector)
             .attr('id', 'dualViewCopyZoom')
             .text("Copy Zoom")
             .hide()
             .click(function(){CopyZoom();});
    $('<li>').appendTo(viewEditSelector)
             .text("Flip Horizontal")
             .click(function(){FlipHorizontal();});
         

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
  
  viewer.AnimateCamera(cam.FocalPoint, cam.Roll, copyCam.Height);
}


// Mirror image
function FlipHorizontal() {
    $('#viewEditMenu').hide();
    // When the circle button is pressed, create the widget.
    var viewer = EVENT_MANAGER.CurrentViewer;
    if ( ! viewer) { return; }

    var cam = viewer.GetCamera();
    viewer.ToggleMirror();
    viewer.SetCamera(cam.FocalPoint, cam.GetRotation()+180.0, cam.Height);
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






