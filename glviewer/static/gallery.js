



function Gallery() {
    var self = this;
    this.ImagePanel = $('<div>')
        .addClass("sa-view-gallery-panel");
    this.CollectionLabel = $('<label>')
        .appendTo(this.ImagePanel)
        .text("Collection");
    this.CollectionList = $('<select>')
        .appendTo(this.ImagePanel)
        .change(function(){self.CollectionCallback($(this).val());});

    this.SessionLabel = $('<label>')
        .appendTo(this.ImagePanel)
        .text("Session");
    this.SessionList = $('<select>')
        .appendTo(this.ImagePanel)
        .change(function(){ self.SessionCallback($(this).val()); });
    this.FilterDiv = $('<div>')
        .appendTo(this.ImagePanel)
        .text("Filter:");
    this.FilterInput = $('<input type="text">')
        .appendTo(this.FilterDiv);
    this.Submit = $('<button>')
        .appendTo(this.FilterDiv)
        .click(function () {self.FilterCallback();})
        .text("Submit");
    this.GalleryDiv = $('<ul>')
        .appendTo(this.ImagePanel)
        .addClass("sa-view-gallery-div");

    this.Collections = [];
    this.DefaultCollectionLabel = "";
    this.DefaultSessionLabel = "";
    this.SelectedSession = undefined;

    this.Initialize();
}


Gallery.prototype.AppendTo = function(parent) {
    this.ImagePanel.appendTo(parent);
}

Gallery.prototype.HandleResize = function() {
    // We need a dynamic resize
    var height = window.innerHeight - 2;
    // var height = this.ImagePanel.height();
    var tp = this.GalleryDiv.offset().top;
    this.GalleryDiv.css({"height":(height-tp)});
    //this.GalleryDiv.height(height-tp);
}


Gallery.prototype.Initialize = function() {
    var self = this;
    $.get("/sessions?json=true",
          function(data,status){
              if (status == "success") {
                  self.LoadCollectionList(data);
              } else {
                  alert("ajax failed.");
              }
          });
}


Gallery.prototype.LoadCollectionList = function(data) {
    // The first "sessions" list is actually collections.
    this.Collections = data.sessions;
    // Populate the collection menu.
    var defaultCollectionIndex = 0;
    for (var i = 0; i < this.Collections.length; ++i) {
        var option = $('<option>').appendTo(this.CollectionList)
            .val(i)
            .text(data.sessions[i].rule);
        // Set the default selected value.
        if (data.sessions[i].rule == this.DefaultCollectionLabel) {
            option.attr('selected', true);
            defaultCollectionIndex = i;
        }
    }
    if (this.Collections.length > 0) {
        this.SelectCollection(defaultCollectionIndex, this.DefaultSessionLabel);
    }
    this.HandleResize();
}

Gallery.prototype.SelectCollection = function(idx, defaultSessionLabel) {
    this.SelectedCollection = this.Collections[idx];
    // Populate the sessions menu.
    this.SessionList.empty();
    var defaultSessionIndex = 0;
    var sessions = this.SelectedCollection.sessions;
    for (var i = 0; i < sessions.length; ++i) {
        var option = $('<option>')
            .appendTo(this.SessionList)
            .val(i)
            .text(sessions[i].label);
        if (defaultSessionLabel && defaultSessionLabel == sessions[i].label) {
            defaultSessionIndex = i;
            option.attr('selected', true);
        }
    }
    $('<option>').appendTo(this.SessionList)
        .val(sessions.length)
        .text("All Images");
    if (sessions.length > 0) {
        this.SelectSession(defaultSessionIndex);
    }
    handleResize();
}

Gallery.prototype.SelectSession = function(idx) {
    var self = this;
    if (idx == this.SelectedCollection.sessions.length) {
        // Load all the images for a database.
        this.SelectedSession = undefined;
        // Retrieve the database id from one of the sessions.
        image_store_id = this.SelectedCollection.sessions[0].sessdb;
        $.get("/webgl-viewer/getimagenames?db="+image_store_id,
              function(data,status){
                  if (status == "success") {
                      self.LoadImages(data, image_store_id);
                  } else {
                      alert("ajax failed.");
                  }
              }
             );
    } else {
        this.SelectedSession = this.SelectedCollection.sessions[idx];
        $.get("/sessions?json=1&sessid="+this.SelectedSession.sessid,
              function(data,status){
                  if (status == "success") {
                      self.LoadSession(data);
                  } else {
                      alert("ajax failed."); }
              }
             );
    }
}

Gallery.prototype.ComputeGalleryImageSize = function(number) {
    
    // Lets compute an optimal size for images.
    var w = this.GalleryDiv.innerWidth();
    var h = this.GalleryDiv.innerHeight();
    var size = Math.sqrt(w*h / number);
    // This would be good images would 'wrap' ...
    var nx = Math.ceil(w / size);
    var ny = Math.ceil(h / size);
    var xSize = w/nx;
    var ySize = h/ny;
    size = xSize;
    if (size > ySize) { size = ySize; }
    // Take some away for borders and padding.
    size = size - 14; // more vertical padding than horizontal ?
    // Not smaller than 72 or bigger than 256.
    if (size < 64) { size = 64;}
    if (size > 128) { size = 128;}
    return size;
}


Gallery.prototype.OnSelect = function(callback) {
    this.OnSelectCallback = callback;
}

Gallery.prototype.SelectCallback = function(db,img,label,view) {
    if (this.OnSelectCallback) {
        this.OnSelectCallback(db,img,label,view);
    }
}

Gallery.prototype.LoadImages = function(data, imgdb) {
    var self = this;
    var labelStrings = [];
    this.GalleryDiv.empty();

    // Lets compute an optimal size for images.
    var size = this.ComputeGalleryImageSize(data.Images.length);
    for (var i = 0; i < data.Images.length; ++i) {
        var imgObj = data.Images[i];
        labelStrings.push(imgObj.label);
        var listItem = $('<li>')
            .appendTo(this.GalleryDiv)
            .data('imgdb', imgdb)
            .data('imgid', imgObj._id)
            .data("label", imgObj.label)
            .addClass("sa-view-gallery-item")
            .hover(
                function () {$(this).addClass("sa-active")},
                function () {$(this).removeClass("sa-active")});
            .mousedown(function(event) {
                // TODO: Make this a callback
                self.SelectCallback($(this).data('imgdb'),
                                    $(this).data('imgid'),
                                    $(this).data('label'));
            });

        var image = $('<img>').appendTo(listItem)
            .data('imgdb', imgdb)
            .data('imgid', imgObj._id)
            .attr("alt", imgObj.label)
            .attr("height", size+"px")
            .attr("src", "/thumb?db="+imgdb+"&img="+imgObj._id);
        var labelDiv = $('<div>')
            .appendTo(listItem)
            .text(data.Images[i].label)
            .addClass("sa-view-gallery-item-div");

    }
    this.FilterInput.autocomplete({source: labelStrings});
}


Gallery.prototype.LoadSession = function(data) {
    var self = this;
    var labelStrings = [];
    this.GalleryDiv.empty();

    var size = this.ComputeGalleryImageSize(data.images.length);
    // It is odd that sessions have separate image and view arrays.
    // (The one I inspected had different number of elements).
    for (var i = 0; i < data.session.views.length; ++i) {
        labelStrings.push(data.session.views[i].label);
        var listItem = $('<li>')
            .appendTo(this.GalleryDiv)
            .addClass("sa-view-gallery-item")
            .hover(
                function () {$(this).addClass("sa-active")},
                function () {$(this).removeClass("sa-active")});
        var image = $('<img>')
            .appendTo(listItem)
            .attr("copy",  1)
            .attr("imgdb", data.images[i].db)
            .attr("img", data.images[i].img)
            .attr("view", data.session.views[i].id)
            .attr("height", size+"px")
            .attr("src", "/thumb?db="+data.images[i].db+"&img="+data.images[i].img)
            .attr("alt", data.images[i].label)
            .mousedown(function() {
                // TODO: Make this a call back
                self.SelectCallback($(this).attr('imgdb'),
                                    $(this).attr('img'),
                                    $(this).attr('alt'),
                                    $(this).attr('view'));
            });
        var labelDiv = $('<div>')
            .appendTo(listItem)
            .text(data.images[i].label)
            .addClass("sa-view-gallery-item-div");
    }

    this.FilterInput.autocomplete({source: labelStrings});
}

Gallery.prototype.FilterCallback = function() {
    var str = this.FilterInput.val().toLowerCase();
    keys = str.split(" ");
    // Todo: find a different way to iterate through the images.
    items = this.GalleryDiv.children();
    for (var i = 0; i < items.length; ++i) {
        var item = $(items[i]);
        var label = item.children('div').text();
        var found = true;
        for (var j = 0; j < keys.length && found; ++j) {
            if (label.toLowerCase().indexOf(keys[j]) == -1) { found = false; }
        }
        if (found) {
            item.show();
        } else {
            item.hide();
        }
    }
}

Gallery.prototype.CollectionCallback = function(idx) {
    this.GalleryDiv.empty();
    this.SelectCollection(parseInt(idx));
}

Gallery.prototype.SessionCallback = function(idx) {
    this.GalleryDiv.empty();
    this.SelectSession(parseInt(idx));
}




