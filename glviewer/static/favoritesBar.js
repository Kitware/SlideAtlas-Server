


function FavoritesBar(parent, display){
    this.FavoritesGUI = this;
    this.Display = display;

    this.FavoritesList = parent;

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
        .addClass("sa-view-favorites-img-list");

    this.LoadFavorites();
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
        for (var i = 0; i < this.Display.GetNumberOfViewers(); ++i) {
            this.Display.GetViewer(i).OnInteraction( function () { self.Hide();} );
        }
    } else {
        this.FavoritesList.fadeOut();
        this.hidden = true;
    }
}


FavoritesBar.prototype.SaveFavorite = function() {
    NOTES_WIDGET.SaveBrownNote();
    // Hide shifts the other buttons to the left to fill the gap.
    var button = FAVORITES_WIDGET.FavoritesBar.SaveFavoriteButton;
    button.addClass("sa-inactive");
    setTimeout(function(){ button.removeClass("sa-inactive");}, 
               500); // one half second

    //ShowImage(CreateThumbnailImage(110));
}

FavoritesBar.prototype.LoadFavorites = function () {
    var self = this;
    $.ajax({
        type: "get",
        url: "/webgl-viewer/getfavoriteviews",
        success: function(data,status){
            if (status == "success") {
                self.LoadFavoritesCallback(data);
            } else { alert("ajax failed - get favorite views"); }
        },
        error: function() { alert( "AJAX - error() : getfavoriteviews" ); },
    });
}

FavoritesBar.prototype.LoadFavoritesCallback = function(sessionData) {
    //var sessionItem = $("[sessid="+sessionData.sessid+"]");

    //var viewList = $('<ul>').appendTo(sessionItem)

    this.Favorites = sessionData.viewArray;

    this.FavoritesGUI.ImageList.html("");

    //for (var i = 0; i < sessionData.viewArray.length; ++i) {
    for (var i = sessionData.viewArray.length-1; i >= 0; --i) {
        var favorite = $('<div>').appendTo(FAVORITES_GUI.ImageList)
            .addClass("sa-view-favorites-callback-div");

        var thumb = sessionData.viewArray[i].Thumb;

        var view = $('<img>').appendTo(favorite)
            .attr('src', thumb)
            .attr('height', '110px')
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

FavoritesBar.prototype.LoadFavorite = function(img){
    var note = new Note();
    var index = $(img).attr('index');
    note.Load(this.Favorits[index]);

    note.DisplayView();
}

FavoritesBar.prototype.DeleteFavorite = function(img){
    var index = $(img).attr('index');

    $.ajax({
        type: "post",
        url: "/webgl-viewer/deleteusernote",
        data: {"noteId": this.Favorties[index]._id,
               "col" : "views"},//"favorites"
        success: function(data,status) {
        },
        error: function() {
            alert( "AJAX - error() : deleteusernote" );
        },
    });
    this.FavoritesGUI.ImageList.html("");

    this.LoadFavorites();
}

