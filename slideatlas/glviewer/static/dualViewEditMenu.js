//==============================================================================
// Create and manage the menu to edit dual views.

function InitDualViewEditMenu() {
    // Create the menu to select slides for the second view.    
    $('<div>').appendTo('body').css({
        'background-color': 'white',
        'border-radius': '5px',
        'position': 'absolute',
        'top' : '35px',
        'left' : '35px',
        'z-index': '2',
        'color': '#303030',
        'font-size': '20px'
    }).attr('id', 'dualViewEditMenu').hide();
    
    $('<ol>').appendTo('#dualViewEditMenu')
             .attr('id', 'dualViewEditMenuOrderedList')
             .css({'width': '100%', 'list-style-type':'none'});
    $('<li>').appendTo('#dualViewEditMenuOrderedList')
             .text("new question")
             .click(function(){EditDualNewQuestion();});
    $('<li>').appendTo('#dualViewEditMenuOrderedList')
             .text("copy question")
             .click(function(){EditDualCopyQuestion();});
    $('<li>').appendTo('#dualViewEditMenuOrderedList')
             .text("delete question")
             .click(function(){EditDualDeleteQuestion();});
    $('<li>').appendTo('#dualViewEditMenuOrderedList')
             .text("set slide")
             .click(function(){EditDualSetSlide();});
    $('<li>').appendTo('#dualViewEditMenuOrderedList')
             .text("save left view")
             .click(function(){EditDualSaveLeftView();});
    $('<li>').appendTo('#dualViewEditMenuOrderedList')
             .text("add diagnosis")
             .click(function(){EditDualAddDiagnosis();});
    $('<li>').appendTo('#dualViewEditMenuOrderedList')
             .text("delete diagnosis")
             .click(function(){EditDeleteDiagnosis();});
    $('<li>').appendTo('#dualViewEditMenuOrderedList')
             .text("save diagnosis view")
             .click(function(){EditDualSaveDiagnosisView();});
    
}

function ShowDualViewMenu(x, y) {
    $('#dualViewEditMenu').css({'top': y, 'left':x}).show();
}








function EditDualSaveLeftView() {
    $('#dualViewEditMenu').hide();
    
    
    
    
    
    alert("EditDualSaveSlideView");
}




function EditDualNewQuestion() {
    $('#dualViewEditMenu').hide();
    alert("EditDualNewQuestion");
}
function EditDualCopyQuestion() {
    $('#dualViewEditMenu').hide();
    alert("EditDualCopyQuestion");
}
function EditDualDeleteQuestion() {
    $('#dualViewEditMenu').hide();
    alert("EditDualDeleteQuestion");
}
function EditDualDeleteQuestion() {
    $('#dualViewEditMenu').hide();
    alert("EditDualDeleteQuestion");
}
function EditDualSetSlide() {
    $('#dualViewEditMenu').hide();
    alert("EditDualSetSlide");
}
function EditDualAddDiagnosis() {
    $('#dualViewEditMenu').hide();
    alert("EditDualAddDiagnosis");
}
function EditDeleteDiagnosis() {
    $('#dualViewEditMenu').hide();
    alert("EditDeleteDiagnosis");
}
function EditDualSaveDiagnosisView() {
    $('#dualViewEditMenu').hide();
    alert("EditDualSaveDiagnosisView");
}
