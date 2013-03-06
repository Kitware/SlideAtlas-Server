//==============================================================================
// Create and manage the menu to edit annotations.

// Hack:  When the dialog is open, the viewer still gets key events.
// The viewer/ html file will check this global before processing events.
var DIALOG_OPEN = false;


function SetAnnotationVisibility(visibility) {
    VIEWER1.ShapeVisibility = visibility;
    if (visibility) {
        $("#annotationButton").css({'opacity': '0.6'});
    } else {
        $("#annotationButton").css({'opacity': '0.2'});
    }
    eventuallyRender();    
}


function ShowAnnotationEditMenu(x, y) {
    $('#AnnotationEditMenu').css({'top': y, 'left':x}).show();
}

function InitAnnotationEditMenus() {
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
    }).attr('id', 'AnnotationEditMenu').hide()
      .mouseleave(function(){$(this).fadeOut();});
    
    var AnnotationEditSelector = $('<ol>');
    AnnotationEditSelector.appendTo('#AnnotationEditMenu')
             .attr('id', 'AnnotationEditSelector')
             .css({'width': '100%', 'list-style-type':'none'});
    $('<li>').appendTo(AnnotationEditSelector)
             .text("new text")
             .click(function(){AnnotationNewText();});
    $('<li>').appendTo(AnnotationEditSelector)
             .text("new circle")
             .click(function(){AnnotationNewCircle();});
    $('<li>').appendTo(AnnotationEditSelector)
             .text("new free form")
             .click(function(){NewPolyline();});
    $('<li>').appendTo(AnnotationEditSelector)
             .text("save annotations")
             .click(function(){SaveAnnotations();});

    // annotation dialogs for editing properties
    $("#text-properties-dialog").dialog({
      autoOpen:false,
      height:250,
      width:350,
      modal:true,
      buttons:{
          Delete: function() {
              WidgetPropertyDialogDelete();
              DIALOG_OPEN = false;
              $(this).dialog("close");
          },
          Apply: function() {
              TextPropertyDialogApply();
              DIALOG_OPEN = false;
              $(this).dialog("close");
          }
      },
      close: function(event,ui) {
          if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
              WidgetPropertyDialogCancel();
              DIALOG_OPEN = false;
              $(this).dialog("close");
          }
          $("#textwidgetcontent").val( "" ).removeClass( "ui-state-error" );
      }
    });

    $("#arrow-properties-dialog").dialog({
      autoOpen:false,
      height:280,
      width:350,
      modal:true,
      buttons:{
          Delete: function() {
              WidgetPropertyDialogDelete();
              DIALOG_OPEN = false;
              $(this).dialog("close");
          },
          Apply: function() {
              ArrowPropertyDialogApply();
              DIALOG_OPEN = false;
              $(this).dialog("close");
          }
      },
      close: function(event,ui) {
          if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
              WidgetPropertyDialogCancel();
              DIALOG_OPEN = false;
              $(this).dialog("close");
          }
          //$("#arrowwidgetcontent").val( "" ).removeClass( "ui-state-error" );
      }
    });

    $("#circle-properties-dialog").dialog({
      autoOpen:false,
      height:300,
      width:350,
      modal:true,
      buttons:{
        Delete: function() {
          WidgetPropertyDialogDelete();
          DIALOG_OPEN = false;
          $(this).dialog("close");
        },
        Apply: function() {
          CirclePropertyDialogApply();
          DIALOG_OPEN = false;
          $(this).dialog("close");
        }
      },
      close: function(event,ui) {
        if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
          WidgetPropertyDialogCancel();
          DIALOG_OPEN = false;
          $(this).dialog("close");
        }
        //$("#arrowwidgetcontent").val( "" ).removeClass( "ui-state-error" );
      }
    });

    $("#polyline-properties-dialog").dialog({
      autoOpen:false,
      height:250,
      width:350,
      modal:true,
      buttons:{
        Delete: function() {
          WidgetPropertyDialogDelete();
          DIALOG_OPEN = false;
          $(this).dialog("close");
        },
        Apply: function() {
          PolylinePropertyDialogApply();
          DIALOG_OPEN = false;
          $(this).dialog("close");
        }
      },
      close: function(event,ui) {
        if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
          WidgetPropertyDialogCancel();
          DIALOG_OPEN = false;
          $(this).dialog("close");
        }
      }
    });             
             
}

// Hack.  We need some uniform way to save annotations.
// TODO fix this.
// This is called from TextWidget.
function ComparisonSaveAnnotations() {
}


// url: "http://localhost:8080/webgl-viewer/stack-save",
function SaveAnnotations() {
   $('#AnnotationEditMenu').hide();
  if ( ! EDIT) {
    return;
  }

  stack = [];
  for (i in SECTIONS) {
    inSection = SECTIONS[i];
    outSection = {"view": inSection.View, "annotations":[]};
    for (j in inSection.Annotations) {
        widget = inSection.Annotations[j];
        outSection.annotations.push(widget.Serialize());
    }
    stack.push(outSection);
  }

  $.ajax({
    type: "post",
    url: "/webgl-viewer/stack-save",
    data: {"db": DBID,
           "sess": SESSID,
           "data" :  JSON.stringify( {"annotations": stack} )},
    success: function(data,status){
       //alert(data + "\nStatus: " + status);
       },
    error: function() { alert( "AJAX - error()" ); },
    });
}


function AnnotationNewText() {
  SetAnnotationVisibility(true);
  // The text is created when the apply button is pressed.
  DIALOG_OPEN = true;
  $("#text-properties-dialog").dialog("open");
  $('#AnnotationEditMenu').hide();
}


function NewPolyline() {
    SetAnnotationVisibility(true);
    // When the text button is pressed, create the widget.
    var widget = new PolylineWidget(VIEWER1, true);
    widget.Shape.SetOutlineColor(document.getElementById("polylinecolor").value);
    VIEWER1.ActiveWidget = widget;

    $('#AnnotationEditMenu').hide();
}


function AnnotationNewCircle() {
    SetAnnotationVisibility(true);
    // When the circle button is pressed, create the widget.
    var widget = new CircleWidget(VIEWER1, true);
    widget.Shape.SetOutlineColor(document.getElementById("circlecolor").value);
    VIEWER1.ActiveWidget = widget;
    $('#AnnotationEditMenu').hide();
}

  function TextPropertyDialogApply() {
    var string = document.getElementById("textwidgetcontent").value;
    var hexcolor = document.getElementById("textcolor").value;
    if (string == "") {
      alert("Empty String");
      return;
    }
    var widget = VIEWER1.ActiveWidget;
    var markerFlag = document.getElementById("TextMarker").checked;

    if (widget == null) {
      // This is a new widget.
      var widget = new TextWidget(VIEWER1, string);
    } else {
      widget.Shape.String = string;
      widget.Shape.UpdateBuffers();
      widget.SetActive(false);
    }
    widget.Shape.SetColor(hexcolor);
    widget.AnchorShape.SetFillColor(hexcolor);
    widget.SetAnchorShapeVisibility(markerFlag);

    //ComparisonSaveAnnotations();
    
    eventuallyRender();
  }

  function ArrowPropertyDialogApply() {
    var hexcolor = document.getElementById("arrowcolor").value;
    var widget = VIEWER1.ActiveWidget;
    //var fixedSizeFlag = document.getElementById("ArrowFixedSize").checked;
    widget.Shape.SetFillColor(hexcolor);
    if (widget != null) {
      widget.SetActive(false);
      //widget.SetFixedSize(fixedSizeFlag);
    }
    eventuallyRender();
  }

  function CirclePropertyDialogApply() {
    var hexcolor = document.getElementById("circlecolor").value;
    var widget = VIEWER1.ActiveWidget;
    widget.Shape.SetOutlineColor(hexcolor);
    var lineWidth = document.getElementById("circlelinewidth");
    widget.Shape.LineWidth = parseFloat(lineWidth.value);
    widget.Shape.UpdateBuffers();

    if (widget != null) {
      widget.SetActive(false);
    }
    eventuallyRender();
  }

  function PolylinePropertyDialogApply() {
    var hexcolor = document.getElementById("polylinecolor").value;
    var widget = VIEWER1.ActiveWidget;
    widget.Shape.SetOutlineColor(hexcolor);
    var lineWidth = document.getElementById("polylinewidth");
    widget.Shape.LineWidth = parseFloat(lineWidth.value);
    widget.Shape.UpdateBuffers();
    if (widget != null) {
      widget.SetActive(false);
    }
    eventuallyRender();
  }

  function WidgetPropertyDialogCancel() {
    var widget = VIEWER1.ActiveWidget;
    if (widget != null) {
      widget.SetActive(false);
    }
  }

  function WidgetPropertyDialogDelete() {
    var widget = VIEWER1.ActiveWidget;
    if (widget != null) {
      VIEWER1.ActiveWidget = null;
      // We need to remove an item from a list.
      // shape list and widget list.
      widget.RemoveFromViewer();
      WidgetPropertyDialogDelete();
      //ComparisonSaveAnnotations();
      eventuallyRender();
    }
  }


  
function LoadWidget(viewer, serializedWidget) {
    if (serializedWidget.type == "text") {
        var widget = new TextWidget(viewer, "");
        widget.Load(serializedWidget);
        return widget;
    }
    if (serializedWidget.type == "circle") {
        var widget = new CircleWidget(viewer, false);
        widget.Load(serializedWidget);
        return widget;
    }
    if (serializedWidget.type == "polyline") {
        var widget = new PolylineWidget(viewer, false);
        widget.Load(serializedWidget);
        return widget;
    }
    return null;
}


function ToggleAnnotationVisibility() {
    SetAnnotationVisibility( ! VIEWER1.ShapeVisibility);
}

function SetAnnotationVisibility(visibility) {
    VIEWER1.ShapeVisibility = visibility;
    if (visibility) {
        $("#annotationButton").css({'opacity': '0.6'});
    } else {
        $("#annotationButton").css({'opacity': '0.2'});
    }
    eventuallyRender();    
}


  
  