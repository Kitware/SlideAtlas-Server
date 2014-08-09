

var FAVORITES_GUI;

function FavoritesBar(){
  var size = '40px';
  var left = '120px';
  var bottom = '60px';
  if (MOBILE_DEVICE) {
    size = '80px';
     if (MOBILE_DEVICE == "iPhone") {
      size = '100px';
      bottom = '80px';
      left = '80px';
    }
  }

  this.hidden = true;

  FAVORITES_GUI = this;

  this.FavoritesList =
    $('<div>').appendTo('body')
              .css({
                'position': 'absolute',
                'height': '160px',
                'width': '100%',
                'left': '0px',
                'bottom': '0px',
                //'padding': '5px',
                //'opacity': '0.6',
                'background-color': 'rgba(0,0,0,.6)',
                'overflow': 'visible',
                'z-index': '2'
              })
              .hide();

  this.SaveFavoriteButton =
    $('<img>')
      .appendTo(this.FavoritesList)
      .css({'left': '0px',
            'height': size,
            'width': size,
            'float': 'left',
            'margin-top': '50px',
            'padding' : '5px',
            'opacity': '0.6'})
      .attr('src',"webgl-viewer/static/saveNew.png")
      .click(function(){SaveFavorite();});
  this.TextTip = new ToolTip(this.SaveFavoriteButton, "Save Favorite");
  
  if(MOBILE_DEVICE){
    this.SaveFavoriteButton
        .css({
          'margin-top': '25px'
        });
  }

  this.ImageList =
    $('<div>')
      .appendTo(this.FavoritesList)
      .css({'float': 'left',
            'overflow-x': 'scroll',
            'overflow-y': 'hidden',
            'white-space': 'nowrap',
            'height': '100%'});
  
  VIEWER1.AddGuiObject(this.FavoritesList, "Bottom", 0, "Left", 0);

  LoadFavorites();
}

FavoritesBar.prototype.ShowHideFavorites = function(){
  if(this.hidden){
    this.FavoritesList.show();
    this.hidden = false;
  } else {
    this.FavoritesList.fadeOut();
    this.hidden = true;
  }
}

var FAVORITES;



function SaveFavorite() {
  NOTES_WIDGET.SaveBrownNote();
  // Hide shifts the other buttons to the left to fill the gap.
  var button = FAVORITES_WIDGET.FavoritesBar.SaveFavoriteButton;
  button.css({'opacity': '0.0'});
  setTimeout(function(){
               button.css({'opacity': '0.6'});
             }, 500); // one half second

  //ShowImage(CreateThumbnailImage(110));

  LoadFavorites();
}

function LoadFavorites(){
  $.ajax({
    type: "get",
    url: "/webgl-viewer/getfavoriteviews",
    success: function(data,status){
               if (status == "success") {
                 LoadFavoritesCallback(data);
               } else { alert("ajax failed - get favorite views"); }
             },
    error: function() { alert( "AJAX - error() : getfavoriteviews" ); },
    });
}

function LoadFavoritesCallback(sessionData) {
  //var sessionItem = $("[sessid="+sessionData.sessid+"]");

  //var viewList = $('<ul>').appendTo(sessionItem)

  FAVORITES = sessionData.viewArray;

  FAVORITES_GUI.ImageList.html("");

  for (var i = 0; i < sessionData.viewArray.length; ++i) {
    var favorite = $('<div>').appendTo(FAVORITES_GUI.ImageList)
                            .css({
                              'position': 'relative',
                              'height': '110px',
                              //'width': '90px',
                              'margin': '10px',
                              'display': 'inline-block',
                              //'background-color': '#0000ff',
                              'border': '5px solid rgba(0,0,255,1)',
                              'background-color': 'rgba(255,0,0,1)'
                              //'opacity': '1.0'
                            });


    //var db = sessionData.viewArray[i].ViewerRecords[0].Database;
    //var img = sessionData.viewArray[i].ViewerRecords[0].Image._id;
    
    var thumb = sessionData.viewArray[i].Thumb;
    
    var view = $('<img>').appendTo(favorite)
                         .attr('src', thumb)
                         .attr('height', '110px')
                         //.attr('width', '80px')
                         .css({
                           //'margin': '5px',
                           'opacity': '1.0'
                         })
                         .attr('index', i)
                         .click(function(){ loadFavorite(this); });

    var del = $('<div>').appendTo(favorite)
                        .html("X")
                        .css({
                          'position': 'absolute',
                          'top': '0px',
                          'left': '0px',
                          'background-color': '#ff0000',
                          'z-index': '3'
                        })
                        .attr('index', i)
                        .click(function(){ deleteFavorite(this); });

  }
}

function loadFavorite(img){
  var note = new Note();
  var index = $(img).attr('index');
  note.Load(FAVORITES[index]);

  note.DisplayView();
}

function deleteFavorite(img){
  var index = $(img).attr('index');

  $.ajax({
    type: "post",
    url: "/webgl-viewer/deleteusernote",
      data: {"noteId": FAVORITES[index]._id,
             "col" : "favorites"},
    success: function(data,status) {

    },
    error: function() {
      alert( "AJAX - error() : deleteusernote" );
    },
    });
  FAVORITES_GUI.ImageList.html("");

  LoadFavorites();
}

FavoritesBar.prototype.resize = function(width){
  if(MOBILE_DEVICE){
    this.ImageList.css({
      'width': width - 90
    });
  } else {
    this.ImageList.css({
      'width': width - 50
    });
  }
}



