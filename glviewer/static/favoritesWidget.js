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
            .appendTo(VIEW_PANEL)
            .addClass("sa-view-favorites-button")
            .attr('src',"webgl-viewer/static/favorite-star.png")
            .attr('draggable','false')
            .on("dragstart", function() {return false;})
            .click(function(){ self.FavoritesBar.ShowHideFavorites(); });

        this.MenuFavoriteButton.prop('title', "Favorites");
    }

    LoadFavorites();
}

FavoritesWidget.prototype.resize = function(width){
  this.FavoritesBar.resize(width);
}









