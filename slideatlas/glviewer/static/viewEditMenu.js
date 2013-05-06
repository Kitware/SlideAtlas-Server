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
             .text("Dual View")
             .attr('id', 'toggleDualItem')
             .click(function(){ToggleDualView();});
    $('<li>').appendTo(viewEditSelector)
             .text("New Text")
             .click(function(){AnnotationNewText();});
    $('<li>').appendTo(viewEditSelector)
             .text("New Circle")
             .click(function(){AnnotationNewCircle();});
    $('<li>').appendTo(viewEditSelector)
             .text("New Free Form")
             .click(function(){NewPolyline();});
    $('<li>').appendTo(viewEditSelector)
             .attr('id', 'toggleAnnotationVisibility')
             .text("Show Annotations")
             .click(function(){ToggleAnnotationVisibility();});
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


// It would be nice to animate the transition
// It would be nice to integrate all animation in a flexible utility.
var ANIMATION_LAST_TIME;
var ANIMATION_DURATION;
var ANIMATION_TARGET;

function ToggleDualView() {
  $('#viewEditMenu').hide();

  DUAL_VIEW = ! DUAL_VIEW;

  if (DUAL_VIEW) {
    ANIMATION_CURRENT = 1.0;
    ANIMATION_TARGET = 0.5;
    $('#toggleDualItem').text("single view");    
  } else {
    ANIMATION_CURRENT = 0.5;
    ANIMATION_TARGET = 1.0;
    $('#toggleDualItem').text("dual view");    
  }
  ANIMATION_LAST_TIME = new Date().getTime();
  ANIMATION_DURATION = 200.0;
  AnimateViewToggle();
}

function AnimateViewToggle() {
  var timeStep = new Date().getTime() - ANIMATION_LAST_TIME;
  if (timeStep > ANIMATION_DURATION) {
    // end the animation.
    VIEWER1_FRACTION = ANIMATION_TARGET;
    handleResize();
    return;
    }
  
  var k = timeStep / ANIMATION_DURATION;
  
  // update
  ANIMATION_DURATION *= (1.0-k);
  VIEWER1_FRACTION += (ANIMATION_TARGET-VIEWER1_FRACTION) * k;
  handleResize();
  requestAnimFrame(AnimateViewToggle);
}

function AnnotationNewText() {
  $('#viewEditMenu').hide();
  var viewer = EVENT_MANAGER.CurrentViewer;
  if ( ! viewer) { return; }
  SetAnnotationVisibility(viewer, true);
  var widget = new TextWidget(viewer, "");
  // Set default color from the last text widget setting.
  var hexcolor = document.getElementById("textcolor").value;
  widget.Shape.SetColor(hexcolor);
  widget.AnchorShape.SetFillColor(hexcolor);
  // Default value for anchor shape visibility
  widget.AnchorShape.Visibility = document.getElementById("TextMarker").value;
  viewer.ActiveWidget = widget;

  // The dialog is used to set the initial text.
  widget.ShowPropertiesDialog();
}

function NewPolyline() {
    $('#viewEditMenu').hide();
    // When the text button is pressed, create the widget.
    var viewer = EVENT_MANAGER.CurrentViewer;
    if ( ! viewer) { return; }
    SetAnnotationVisibility(viewer, true);
    var widget = new PolylineWidget(viewer, true);
    widget.Shape.SetOutlineColor(document.getElementById("polylinecolor").value);
    viewer.ActiveWidget = widget;
}

function AnnotationNewCircle() {
    $('#viewEditMenu').hide();
    // When the circle button is pressed, create the widget.
    var viewer = EVENT_MANAGER.CurrentViewer;
    if ( ! viewer) { return; }
    SetAnnotationVisibility(viewer, true);
    var widget = new CircleWidget(viewer, true);
    widget.Shape.SetOutlineColor(document.getElementById("circlecolor").value);
    viewer.ActiveWidget = widget;
}

function SetAnnotationVisibility(viewer, visibility) {
    viewer.ShapeVisibility = visibility;
    eventuallyRender();    
}

function GetAnnotationVisibility(viewer) {
  return viewer.ShapeVisibility;
}

function ToggleAnnotationVisibility() {
    $('#viewEditMenu').hide();
    var viewer = EVENT_MANAGER.CurrentViewer;
    if ( ! viewer) { return; }
    SetAnnotationVisibility(viewer, ! GetAnnotationVisibility(viewer));
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






