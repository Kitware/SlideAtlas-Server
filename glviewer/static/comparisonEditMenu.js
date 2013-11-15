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




function ShowComparisonEditMenu(x, y) {
    $('#comparisonEditMenu').css({'top': y, 'left':x}).show();
}

function InitComparisonEditMenus() {
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
    }).attr('id', 'comparisonEditMenu').hide()
      .mouseleave(function(){$(this).fadeOut();});
    
    var comparisonEditSelector = $('<ol>');
    comparisonEditSelector.appendTo('#comparisonEditMenu')
             .attr('id', 'comparisonEditSelector')
             .css({'width': '100%', 'list-style-type':'none'});
    $('<li>').appendTo(comparisonEditSelector)
             .text("add diagnosis")
             .click(function(){ComparisonAddDiagnosis();});
    $('<li>').appendTo(comparisonEditSelector)
             .text("delete diagnosis")
             .click(function(){ComparisonDeleteDiagnosis();});
    $('<li>').appendTo(comparisonEditSelector)
             .text("edit diagnosis label")
             .click(function(){ComparisonEditDiagnosisLabel();});
    $('<li>').appendTo(comparisonEditSelector)
             .text("save right view")
             .click(function(){ComparisonSaveRightView();});
    $('<li>').appendTo(comparisonEditSelector)
             .text("save left view")
             .click(function(){ComparisonSaveLeftView();});
    $('<li>').appendTo(comparisonEditSelector)
             .text("new annotaton")
             .click(function(){ComparisonNewAnnotation();});
    $('<li>').appendTo(comparisonEditSelector)
             .text("copy options")
             .click(function(){ComparisonCopyOptions();});
    $('<li>').appendTo(comparisonEditSelector)
             .text("paste options")
             .click(function(){ComparisonPasteOptions();});

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

    // Get info from the databse to fillout the the rest of the view menu.
    //$.get("http://localhost:8080/sessions?json=true",function(data,status){
    $.get(SESSIONS_URL+"?json=true",function(data,status){
        if (status == "success") {
            InitSessionMenuAjax(data);
        } else { alert("ajax failed."); }
    });


    // Create the dialog to edit diagnosis labels.
    var tmp = $('<div>').attr('id', 'comparisonDialog').hide();
    tmp.appendTo('body').css({
        'background-color': 'white',
        'border-style': 'solid',
        'border-width': '1px',
        'border-radius': '5px',
    }).attr('title', 'Edit Label');
    $('<label>').appendTo(tmp).text("Diagnosis : ");
    $('<input type="text"/>').appendTo(tmp).attr('id', 'diagnosisLabelInput').css({'width': '100%'});
    $('<button>').appendTo(tmp).text("Submit").click(function(){ComparisonEditDiagnosisLabelSubmit();});
}

function InitSessionMenuAjax(data) {
    for (i in data.sessions) {
        var group = data.sessions[i];
        $('<li>').appendTo('#sessionMenuSelector').css({'font-weight':'bold'}).text(group.rule);
        for (j in group.sessions) {
            session = group.sessions[j];
            $('<li>').appendTo('#sessionMenuSelector')
                .text(session.label)
                .attr('sessdb', session.sessdb).attr('sessid', session.sessid)
                .click(function(){ShowViewMenu(this);});
        }
    }
}
    
    
function ShowViewMenu(obj) {
    // Get info from the databse to fillout the the rest of the view menu.
    //$.get("http://localhost:8080/sessions?json=1&sessid="+$(obj).attr('sessid')+"&sessdb="+$(obj).attr('sessdb'),
    $.get(SESSIONS_URL+"?json=true&sessid="+$(obj).attr('sessid')+"&sessdb="+$(obj).attr('sessdb'),
          function(data,status){
            if (status == "success") {
              ShowViewMenuAjax(data);
            } else { alert("ajax failed."); }
          });
}
function ShowViewMenuAjax(data) {
    $('#viewMenuSelector').empty();
    for (i in data.images) {
        var slide = data.images[i];
        $('<li>').appendTo('#viewMenuSelector') // <option> for drop down
            .text(slide.label)
            .attr('db', slide.db).attr('viewid', slide.view)
            .click(function(){ViewMenuCallback(this);});
    }
    $('#viewMenu').show();    
}
function ViewMenuCallback(obj) {
    // We need the information in view, image and bookmark (startup_view) object.
    //window.location = "http://localhost:8080/webgl-viewer/comparison-option?db="+$(obj).attr('db')+"&viewid="+$(obj).attr('viewid');
    //$.get("http://localhost:8080/webgl-viewer/comparison-option?db="+$(obj).attr('db')+"&viewid="+$(obj).attr('viewid'),
    $.get(COMPARISON_OPTION_URL+"?db="+$(obj).attr('db')+"&viewid="+$(obj).attr('viewid'),
          function(data,status){
            if (status == "success") {
              AddComparisonOption(data);
            } else { alert("ajax failed."); }
          });
}


// It would be nice to share this method with the initialization code.
function AddComparisonOption(option) {
    var index = ARGS.Options.length;
    // Add a new option.
    var view = {};
    
    view.label = option.label.replace(/&#39;/g,"'");
    view.label = option.label.replace(".ndpi","");

    view.db = option.db;
    view.img = option.img;
    view.center = option.center;
    view.viewHeight = option.viewHeight;
    view.rotation = option.rotation;
    ARGS.Options.push(view);

    var info = {};
    info.origin = option.origin;
    info.spacing = option.spacing;
    info.levels = option.levels;
    info.dimensions = option.dimension;
    ARGS.OptionInfo.push(info);
    
    // Unselect any selected items.
    $(".ui-selected", '#optionMenu').removeClass("ui-selected").addClass("ui-unselecting");
    // Add the new item and select it.
    $('<li>').appendTo('#optionMenu').text(ARGS.Options[index].label).addClass("ui-selected");
    // trigger the mouse stop event (this will select all .ui-selecting elements, and deselect all .ui-unselecting elements)
    //$('#optionMenu')._mouseStop(null);
    // Calling this method directly will leave the option menu visible.
    changeOption(index);
    
    // Save the new options in mongo
    ComparisonSave("options");
}

//    url: "http://localhost:8080/webgl-viewer/comparison-save",
function ComparisonSave(operation) {
  if ( ! EDIT) {
    return;
  }
  $.ajax({
    type: "post",
    url: COMPARISON_SAVE_URL,
    data: {"input" :  JSON.stringify( ARGS ),
           "operation" : operation},
    success: function(data,status){
       //alert(data + "\nStatus: " + status);
       },
    error: function() { alert( "AJAX - error()" ); },
    });
 }

function ComparisonSaveAnnotations() {
    ARGS.Viewer1.annotations = [];
    for (i in VIEWER1.WidgetList) {
        widget = VIEWER1.WidgetList[i];
        ARGS.Viewer1.annotations.push(widget.Serialize());
    }
    ComparisonSave("view");
}

// Set the current option / diagnosis.
function changeOption(index) {
    if (index < 0) {
        // Create a new source for the viewer.
        // We may want to save sources so they do not have to reload when selected.
        VIEWER2.SetCache(null);
        VIEWER2.OptionIndex = undefined;
        $('#diagnosis').text("Diagnosis");
        $('.viewer2').hide();
    } else {
        // Create a new source for the viewer.
        // We may want to save sources so they do not have to reload when selected.
        var option = ARGS.Options[index];
        var optionInfo = ARGS.OptionInfo[index];
        var imgobj = {};
        imgobj._id = option.img;
        imgobj.database = option.db;
        imgobj.levels = optionInfo.levels;
        imgobj.bounds = [0,optionInfo.dimensions[0], 0,optionInfo.dimensions[1]];
        var source = new Cache(imgobj);
        VIEWER2.SetCache(source);
        VIEWER2.SetCamera(option.center, option.rotation, option.viewHeight);
        VIEWER2.SetDimensions(optionInfo.dimensions);
        // I need to remember which option is currently selected
        // so it can be edited (save view, delete).
        VIEWER2.OptionIndex = index;
        $('.viewer2').show();
    }

    eventuallyRender();
}
  













function ComparisonAddDiagnosis() {
    $('#comparisonEditMenu').hide();
    $('#sessionMenu').show();
}

function ComparisonDeleteDiagnosis() {
    $('#comparisonEditMenu').hide();
    if (VIEWER2.OptionIndex == undefined) {
        alert("No diangosis selected to delete.");
        return;
    }
    var indexToDelete = VIEWER2.OptionIndex;
    var newOptions = [];
    for (i in ARGS.Options) {
        if (i != indexToDelete) {
            newOptions.push(ARGS.Options[i]);
        }
    }
    ARGS.Options = newOptions;

    var newOptionInfo = [];
    for (i in ARGS.OptionInfo) {
        if (i != indexToDelete) {
            newOptionInfo.push(ARGS.OptionInfo[i]);
        }
    }
    ARGS.OptionInfo = newOptionInfo;

    // delete the selected item from the option list.
    //$("#foo > option[value='2']").remove();
    $("#optionMenu > li").remove(".ui-selected");    
    
    $("#diagnoses").fadeIn();    
    changeOption(-1);
    
    // Save the new options in mongo
    ComparisonSave("options");
}

function ComparisonEditDiagnosisLabel() {
    if (VIEWER2.OptionIndex == undefined) {
        alert("No diangosis selected to edit.");
        return;
    }
    var selectedIndex = VIEWER2.OptionIndex;

    $('#diagnosisLabelInput').attr('value', ARGS.Options[selectedIndex].label);
    $('#comparisonDialog').dialog();
    
    // Save the new options in mongo
    ComparisonSave("options");
}
function ComparisonEditDiagnosisLabelSubmit() {
    if (VIEWER2.OptionIndex == undefined) { // check should not be necessary here.
        alert("No diangosis selected to edit.");
        return;
    }
    var selectedIndex = VIEWER2.OptionIndex;
    var txt = $('#diagnosisLabelInput').attr('value');
    ARGS.Options[selectedIndex].label = txt;
    
    // Now we have to change the label in the diagnosis option list.
    $("#optionMenu > li.ui-selected").text(txt);   
    // The menu button needs to change because the option is selected.
    $('#diagnosis').text(txt);

    $('#comparisonDialog').dialog( "close" );    

    // Save the new options in mongo
    ComparisonSave("options");
}


function ComparisonSaveRightView() {
    if (VIEWER2.OptionIndex == undefined) {
        alert("No diangosis selected to edit.");
        return;
    }
    var selectedIndex = VIEWER2.OptionIndex;

    var cam = VIEWER2.GetCamera();
    ARGS.Options[selectedIndex].viewHeight = cam.Height;
    // Copy values not pointer reference.
    ARGS.Options[selectedIndex].center = [cam.FocalPoint[0], cam.FocalPoint[1]];
    ARGS.Options[selectedIndex].rotation = 180 * cam.Roll / 3.14159265;
    
    $('#comparisonEditMenu').hide();
    
    // Save the new options in mongo
    ComparisonSave("options");
}


function ComparisonSaveLeftView() {
    var cam = VIEWER1.GetCamera();
    ARGS.Viewer1.viewHeight = cam.Height;
    // Copy values not pointer reference.
    ARGS.Viewer1.center = [cam.FocalPoint[0], cam.FocalPoint[1]];
    ARGS.Viewer1.rotation = 180 * cam.Roll / 3.14159265;
    
    $('#comparisonEditMenu').hide();
    
    // Save the new options in mongo
    ComparisonSave("view");
}


// Use cookies as a clipboard for copy and paste.
function ComparisonCopyOptions() {
  setCookie("ComparisonOptions",JSON.stringify(ARGS.Options),1);
  setCookie("ComparisonOptionInfo",JSON.stringify(ARGS.OptionInfo),1);
  $('#comparisonEditMenu').hide();
}

function ComparisonPasteOptions() {
    var options = getCookie("ComparisonOptions");
    var optionInfo = getCookie("ComparisonOptionInfo");
    if (options == null || options == "" || optionInfo == null || optionInfo == "") {
        alert("Nothing on the clipboard.");
        return;
    }
    
    changeOption(-1);
    
    
    ARGS.Options = JSON.parse(options);
    ARGS.OptionInfo = JSON.parse(optionInfo);
    
    // Rebuild the option menu.
    $('#optionMenu').empty();
    for (i in ARGS.Options) {
        $('<li>').appendTo('#optionMenu').text(ARGS.Options[i].label).css({'border-radius': '5px'});
    }

    // Save the new options in mongo
    ComparisonSave("options");

    $('#comparisonEditMenu').hide();
}


function ComparisonNewAnnotation() {
    SetAnnotationVisibility(true);
   // The text is created when the apply button is pressed.
   $("#text-properties-dialog").dialog("open");
    
   $('#comparisonEditMenu').hide();
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

