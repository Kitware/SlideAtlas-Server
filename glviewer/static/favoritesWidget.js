// VCR like buttons to get to next/previous note/slide.
// entwined with the notes widget at the moment.

var FAVORITES_GUI;


//------------------------------------------------------------------------------
// I intend to have only one object
function FavoritesWidget() {

  this.FavoritesBar = new FavoritesBar();
  
  if(!MOBILE_DEVICE){
    var self = this;
    this.MenuFavoriteButton =
      $('<img>')
        .appendTo('body')
        .css({'position': 'absolute',
              'height': '40px',
              'width': '40px',
              'left': '0px',
              'bottom': '10px',
              'padding' : '5px',
              'opacity': '0.6',
              'z-index': '3'})
        .attr('src',"webgl-viewer/static/favorite-star.png")
        .click(function(){ self.FavoritesBar.ShowHideFavorites(); });
    this.TextTip = new ToolTip(this.MenuFavoriteButton, "Favorites Menu");

    VIEWER1.AddGuiObject(this.MenuFavoriteButton, "Bottom", 0, "Left", 0);
  }

  LoadFavorites();
}

FavoritesWidget.prototype.resize = function(width){
  this.FavoritesBar.resize(width);
}









