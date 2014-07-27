// VCR like buttons to get to next/previous note/slide.
// entwined with the notes widget at the moment.

var FAVORITES_GUI


//------------------------------------------------------------------------------
// I intend to have only one object
function FavoritesWidget() {


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
 /* this.Div =
    $('<div>').appendTo('body')
              .css({'position': 'absolute',
                    'left' : left,
                    'bottom' : bottom,
                    'z-index': '2'});*/

  this.FavoritesList =
    $('<div>').appendTo('body')
              .css({
                'position': 'absolute',
                'height': '200px',
                'width': '100%',
                'left': '0px',
                'bottom': '0px',
                //'padding': '5px',
                'opacity': '0.6',
                'background-color': '#000000',
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

  this.ImageList =
    $('<div>')
      .appendTo(this.FavoritesList)
      .css({'float': 'left',
            'overflow-x': 'scroll',
            'overflow-y': 'hidden',
            'white-space': 'nowrap'});

  var self = this;
  this.MenuFavoriteButton =
    $('<img>')
      .appendTo('body')
      .css({'position': 'absolute',
            'height': size,
            'width': size,
            'left': '0px',
            'bottom': '10px',
            'padding' : '5px',
            'opacity': '0.6',
            'z-index': '3'})
      .attr('src',"webgl-viewer/static/favorite-star.png")
      .click(function(){ self.ShowHideFavorites(); });
  this.TextTip = new ToolTip(this.MenuFavoriteButton, "Favorites Menu");

  VIEWER1.AddGuiObject(this.MenuFavoriteButton, "Bottom", 0, "Left", 0);
  VIEWER1.AddGuiObject(this.FavoritesList, "Bottom", 0, "Left", 0);

  LoadFavorites();
}

FavoritesWidget.prototype.ShowHideFavorites = function(){
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
  var button = FAVORITES_WIDGET.SaveFavoriteButton;
  button.css({'opacity': '0.0'});
  setTimeout(function(){
               button.css({'opacity': '0.6'});
             }, 1000); // one second

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
                              'height': '120px',
                              'width': '90px',
                              'margin': '10px',
                              'display': 'inline-block',
                              'background-color': '#0000ff',
                              'opacity': '1.0'
                            });


    var db = sessionData.viewArray[i].ViewerRecords[0].Database;
    var img = sessionData.viewArray[i].ViewerRecords[0].Image._id;
    var view = $('<img>').appendTo(favorite)
                         .attr('src', './thumb?db=' + db + "&img=" + img)
                         .attr('height', '110px')
                         .attr('width', '80px')
                         .css({
                           'margin': '5px',
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

FavoritesWidget.prototype.resize = function(width){
  this.ImageList.css({
    'width': width - 60
  });
}









