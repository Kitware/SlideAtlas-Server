

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
        .addClass("sa-view-favorites-div")
        .hide();

    this.SaveFavoriteButton =
        $('<img>')
        .appendTo(this.FavoritesList)
        .addClass("sa-view-favorites-icon")
        .attr('src',"webgl-viewer/static/saveNew.png")
        .click(function(){SaveFavorite();});
    this.SaveFavoriteButton.prop('title', "Save Favorite");

    if(MOBILE_DEVICE){
        this.SaveFavoriteButton
            .addClass("sa-view-favorites-button");
    }

    this.ImageList =
        $('<div>')
        .appendTo(this.FavoritesList)
        .addClass("sa-view-favorites-img-list")
  
    VIEWER1.AddGuiObject(this.FavoritesList, "Bottom", 0, "Left", 0);

    LoadFavorites();
}


FavoritesBar.prototype.Hide = function(){
    if( ! this.hidden){
        this.FavoritesList.fadeOut();
        this.hidden = true;
    }
}


FavoritesBar.prototype.ShowHideFavorites = function(){
    if(this.hidden){
        this.FavoritesList.show();
        this.hidden = false;
        var self = this;
        VIEWER1.OnInteraction( function () { self.Hide();} );
        VIEWER2.OnInteraction( function () { self.Hide();} );
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
  button.addClass("sa-inactive");
  setTimeout(function(){
               button.removeClass("sa-inactive");
             }, 500); // one half second

  //ShowImage(CreateThumbnailImage(110));
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
                            .addClass("sa-view-favorites-callback-div");


    //var db = sessionData.viewArray[i].ViewerRecords[0].Database;
    //var img = sessionData.viewArray[i].ViewerRecords[0].Image._id;
    
    var thumb = sessionData.viewArray[i].Thumb;
    
    var view = $('<img>').appendTo(favorite)
                         .attr('src', thumb)
                         .attr('height', '110px')
                         //.attr('width', '80px')
                         .addClass("sa-view-favorites-callback-img")
                         .attr('index', i)
                         .click(function(){ loadFavorite(this); });

    var del = $('<div>').appendTo(favorite)
                        .html("X")
                        .addClass("sa-view-favorites-callback-del")
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
             "col" : "views"},//"favorites"
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



