


function FavoritesBar(parent, display){
    var self = this;
    this.FavoritesGUI = this;
    this.Display = display;

    this.FavoritesList = parent;

    this.SaveFavoriteButton =
        $('<img>')
        .appendTo(this.FavoritesList)
        .addClass("sa-view-favorites-icon")
        .attr('src',SA.ImagePathUrl+"saveNew.png")
        .click(function(){self.SaveFavorite();});
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
    SA.NotesWidget.SaveBrownNote();
    // Hide shifts the other buttons to the left to fill the gap.
    var button = FAVORITES_WIDGET.FavoritesBar.SaveFavoriteButton;
    button.addClass("sa-inactive");
    setTimeout(function(){ button.removeClass("sa-inactive");},
               500); // one half second
}

FavoritesBar.prototype.LoadFavorites = function () {
    var self = this;
    $.ajax({
        type: "get",
        url: "/webgl-viewer/getfavoriteviews",
        success: function(data,status){
            if (status == "success") {
                self.LoadFavoritesCallback(data);
            } else { saDebug("ajax failed - get favorite views"); }
        },
        error: function() { saDebug( "AJAX - error() : getfavoriteviews" ); },
    });
}

FavoritesBar.prototype.LoadFavoritesCallback = function(sessionData) {
    //var sessionItem = $("[sessid="+sessionData.sessid+"]");
    //var viewList = $('<ul>').appendTo(sessionItem)
    var self = this;

    this.Favorites = sessionData.viewArray;

    this.FavoritesGUI.ImageList.html("");

    //for (var i = 0; i < sessionData.viewArray.length; ++i) {
    for (var i = sessionData.viewArray.length-1; i >= 0; --i) {
        var favorite = $('<div>').appendTo(this.FavoritesGUI.ImageList)
            .addClass("sa-view-favorites-callback-div");

        var thumb = sessionData.viewArray[i].Thumb;

        var view = $('<img>').appendTo(favorite)
            .attr('src', thumb)
            .attr('height', '110px')
            .addClass("sa-view-favorites-callback-img")
            .attr('index', i)
            .click(function(){ self.LoadFavorite(this); });

        var del = $('<div>').appendTo(favorite)
            .html("X")
            .addClass("sa-view-favorites-callback-del")
            .attr('index', i)
            .click(function(){ self.DeleteFavorite(this); });
    }
}

FavoritesBar.prototype.LoadFavorite = function(img){
    var note = new SA.Note();
    var index = $(img).attr('index');
    note.Load(this.Favorites[index]);

    note.DisplayView(SA.DualDisplay);
}

FavoritesBar.prototype.DeleteFavorite = function(img){
    var index = $(img).attr('index');

    $.ajax({
        type: "post",
        url: "/webgl-viewer/deleteusernote",
        data: {"noteId": this.Favorites[index]._id,
               "col" : "views"},//"favorites"
        success: function(data,status) {
        },
        error: function() {
            saDebug( "AJAX - error() : deleteusernote" );
        },
    });
    this.FavoritesGUI.ImageList.html("");

    this.LoadFavorites();
}

