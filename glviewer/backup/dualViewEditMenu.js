//==============================================================================
// Create and manage the menu to edit dual views.

function InitComparisonEditMenus() {
    // Create the menu of edit options.    
    $('<div>').appendTo('body').css({
        'background-color': 'white',
        'border-radius': '5px',
        'position': 'absolute',
        'top' : '35px',
        'left' : '35px',
        'z-index': '2',
        'color': '#303030',
        'font-size': '20px'
    }).attr('id', 'comparisonEditMenu').hide();
    
    $('<ol>').appendTo('#comparisonEditMenu')
             .attr('id', 'comparisonEditSelector')
             .css({'width': '100%', 'list-style-type':'none'});
    $('<li>').appendTo('#comparisonEditSelector')
             .text("add diagnosis")
             .click(function(){ComparisonAddDiagnosis();});
    $('<li>').appendTo('#comparisonEditSelector')
             .text("save left view")
             .click(function(){ComparisonSaveLeftView();});


    // Create a selection list of sessions.   
    $('<div>').appendTo('body').css({
        'background-color': 'white',
        'border-radius': '5px',
        'position': 'absolute',
        'top' : '35px',
        'left' : '35px',
        'width' : '500px',
        'height' : '500px',
        'z-index': '2',
        'color': '#303030',
        'font-size': '20px'
    }).attr('id', 'sessionMenu').hide();


    // Create a selector for views.   
    $('<div>').appendTo('body').css({
        'background-color': 'white',
        'border-radius': '5px',
        'position': 'absolute',
        'top' : '35px',
        'left' : '35px',
        'width' : '500px',
        'height' : '500px',
        'z-index': '2',
        'color': '#303030',
        'font-size': '20px'
    }).attr('id', 'viewMenu').hide();


    // Get info from the databse to fillout the the rest of the view menu.
    $.get("http://localhost:8080/sessions?json=true",function(data,status){
        if (status == "success") {
            InitSessionMenu(data);
        }
    });        
}

function InitSessionMenu(data) {
    $('<ul>').appendTo('#sessionMenu').attr('id', 'sessionMenuSelector');
    for (i in data.sessions) {
        var group = data.sessions[i];
        $('<li>').appendTo('#sessionMenuSelector').css({'font-weight':'bold'}).text(group.rule);
        for (j in group.sessions) {
            session = group.sessions[j];
            $('<li>').appendTo('#sessionMenuSelector').text(session.label);
        }
    }
    
}
    
    
    






function ComparisonAddDiagnosis() {
    $('#comparisonEditMenu').hide();
    $('#sessionMenu').show();
}

function ComparisonSaveLeftView() {
   alert("Preston is writing this"); 
   $('#comparisonEditMenu').hide();
}







function ShowComparisonEditMenu(x, y) {
    $('#comparisonEditMenu').css({'top': y, 'left':x}).show();
}



