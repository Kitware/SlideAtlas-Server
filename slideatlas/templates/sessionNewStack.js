{% extends 'frontend_base.html' %}


{% block title %}{{ super() }} - Session Editor{% endblock title %}


{% block styles %}
{# TODO: base style assumes navbar will be present #}
{#{{ super() }}#}
    <link rel="stylesheet" href="/static/thirdparty/jquery-ui/1.10.2/jquery-ui.css">
    <style>
        #stack-div {
            float: left;
            height: 100%;
            border: 1px solid #999;
        }




        #sortable {
            list-style-type: none;
            margin: 0;
            padding: 0;
        }
        #sortable li {
            margin: 0 3px 3px 3px;
            padding: 3px 3px 3px 1.5em;
            height: 37px;
            position: relative;
        }
        #sortable li span {
            position: absolute;
            margin-left: -1.3em;
        }
        #sortable li img {
            margin: 0;
            padding: 0;
            width: 38px;
            float: left;
            height: 38px;
        }
        #sortable li input {
            padding: 4px;
            margin: 5px;
            float: left;
            width: 22em;
        }
        body {
            margin: 0;
        }
        #wrapper {
            width: auto;
            overflow: hidden;
        }
        #session div {
            padding-bottom: 10px;
        }
        #slideScroll {
            border: 1px solid #999;
            overflow-y: scroll;
        }
        #slideList {
            padding-top: 3px;
        }
        h2 {
            text-align: center;
            margin: 0;
        }
        #imagePanel {
            height: 100%;
            width: auto;
        }
        #gallery {
            position: relative;
            padding: 0;
            border: 1px solid #CCC;
            height: 100%;
            list-style: none;
            overflow-y: auto;
        }
        #gallery li {
            float: left;
            padding: 2px;
        }
        #gallery li img {
            border: 2px solid #CCC;
            padding: 2px;
        }
        #gallery li img:hover {
            border-color: #333;
        }
    </style>
{% endblock styles %}


{% block scripts %}
{{ super() }}
    <script src="/static/thirdparty/jquery-ui/1.10.2/jquery-ui.min.js"></script>
    <script>
var SESSION_ID = "{{ session.id }}";

$(window).resize(function() { handleResize(); })
         .trigger('resize');

function handleResize() {
    // We need a dynamic resize
    var height = window.innerHeight - 2;
    $('#wrapper').css({"height": height});
    // I am having trouble getting the scroll bar to appear.
    var top = $('#slideScroll').position().top + 10;
    $('#slideScroll').css({"height":(height-top)});
    if ($('#slideList').outerHeight() < height-top) {
        $('#slideScroll').css({'overflow-y':'hidden'});
    }

    top = $('#gallery').position().top + 15;
    $('#gallery').css({"height":(height-top)});
}

$(document).ready(function() { main(); });

function main() {
    loadSessionFromId(SESSION_ID);
}

function loadSessionFromId(sessionId) {
    $.get("/sessions?json=1&sessid="+sessionId,
          function(data,status){
              if (status == "success") {
                  LoadSession(data);
              } else {
                  alert("ajax failed."); }
          });

}

// Put all the session views into the gallery.
function loadSessionData(data) {
    $('#gallery').empty();

    for (var i = 0; i < data.session.views.length; ++i) {
        // Create a div that has both an image and a label.
        var listItem = $('<li>').appendTo($('#gallery'));
        { // for closure scoping
            var viewIdx = i;
            var image = $('<img>')
                .appendTo(listItem)
                .attr("width", "256px")
                .attr("src", "/thumb?db="+data.images[i].db+"&img="+data.images[i].img)
                .attr("alt", data.images[i].label)
                .mousedown(function(event) {
                    // We need to get x, y location too
                    addViewToStack(viewIdx);
                })
        };
        var labelDiv = $('<div')
            .appendTo(listItem)
            .text(data.session.views[i].label); // Should really have the image label.
        }
}

function modified () {
    $('#saveButton').css({"color":"#E00"});
}





    </script>
{% endblock scripts %}


{# TODO: with navbar at the top, the session editor isn't the correct vertical height #}
{% block navbar %}{% endblock navbar %}


{% block content %}
{{ super() }}
    <div id="wrapper">
        <div id="stack-div">
            <h3>{{ collection.label }} : {{ session_son.label }}</h3>
            <div>
                <label>Label</label>
                <input type="text" id="title" onkeyup="updateOptions()"
                       name="views" style="width: 340px;" value="New Stack"/>
            </div>
            <div>
                <button id="saveButton" onclick="save(false)" >Save</button>
                <button onclick="cancel()" >Cancel</button>
            </div>

            <div id="slideScroll">
                <div id="slideList">
                    <ul id="sortable">
                    </ul>
                </div>
            </div>
        </div>
        <div id="imagePanel">
            <ul id="gallery">
            </ul>
        </div>
    </div>
{% endblock content %}
