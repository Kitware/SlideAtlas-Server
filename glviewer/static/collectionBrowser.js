// I am not so sure I like this pattern.
// I am trying to hide helper object, but
// it is probably easier to declare them inside the contructor.
// This pattern does not make any of the methods
// private.  I do not this it makes any instance
// variables provate either.


// Closure namespace 
CollectionBrowser = (function (){



    function CollectionBrowser () {
        var self = this;
        this.Div = $('<div>')
            .css({'height': '100%',
                  'width': 'auto'});
        
        this.CollectionList = $('<ul>')
            .appendTo(this.Div)
            .css({'list-style': 'none',
                  'margin-left': '0.5em',
                  'margin-top': '0',
                  'position':   'relative',
                  'padding':    '0',
                  'height':     '100%',
                  'overflow-y': 'auto'});
        
        this.Collections = [];
        this.DefaultCollectionLabel = "";
        this.DefaultSessionLabel = "";
        this.SelectedSession = undefined;
        this.Initialize();        
    }


    CollectionBrowser.prototype.Initialize = function() {
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


    CollectionBrowser.prototype.AppendTo = function(parent) {
        this.Div.appendTo(parent);
    }


    CollectionBrowser.prototype.HandleResize = function() {
        return;
        // We need a dynamic resize
        var height = window.innerHeight - 2;
        var width = window.innerWidth - 2;
        var pos = this.Div.position();
        var top = pos.top + 15;
        var left = pos.left + 15;
        this.Div.css({"height":(height-top),
                      "width":(width-left)});
    }
    
    
    CollectionBrowser.prototype.LoadCollectionList = function(data) {
        var self = this;
        // The first "sessions" list is actually collections.
        this.Collections = data.sessions;
        // Populate the collection menu.
        var defaultCollectionIndex = 0;
        for (var i = 0; i < this.Collections.length; ++i) {
            // Note: data.sessions is actually a list of collections.
            var collection = new Collection(data.sessions[i],this.CollectionList);
        }
        //if (this.Collections.length > 0) {
        //    this.SelectCollection(defaultCollectionIndex, this.DefaultSessionLabel);
        //}
        //this.HandleResize();
    }
    

    CollectionBrowser.prototype.OnSelect = function(callback) {
        this.OnSelectCallback = callback;
    }

    
    CollectionBrowser.prototype.SelectCallback = function(db,img,label,view) {
        if (this.OnSelectCallback) {
            this.OnSelectCallback(db,img,label,view);
        }
    }


//==============================================================================
    function Collection(data, list) {
        this.ListItem = $('<li>')
            .appendTo(list)
            .css({'left':'o'});
        this.OpenCloseIcon = $('<img>')
            .appendTo(this.ListItem)
            .attr('src',"/webgl-viewer/static/plus.png")
            .css({'height': '15px'});
        $('<span>')
            .appendTo(this.ListItem)
            .text(data.rule);
        this.SessionList = $('<ul>')
            .appendTo(this.ListItem)
            .css({'list-style': 'none',
                  'margin-left': '2em',
                  'padding-left': '0'})
            .hide();
        this.SessionList.Open = false;
        
        var self = this;
        this.OpenCloseIcon.click(function(){self.ToggleSessionList();});
        
        // data contains the sessions too.
        // Populate the sessions list.
        this.Sessions = [];
        for (var i = 0; i < data.sessions.length; ++i) {
            this.Sessions.push(new Session(data.sessions[i], this.SessionList));
        }
    }


    Collection.prototype.ToggleSessionList = function() {
        if (this.SessionList.Open) {
            this.SessionList.Open = false;
            this.SessionList.slideUp();
            this.OpenCloseIcon.attr('src',"/webgl-viewer/static/plus.png")
        } else {
            this.SessionList.Open = true;
            this.SessionList.slideDown();
            this.OpenCloseIcon.attr('src',"/webgl-viewer/static/minus.png")
            for (var i = 0; i < this.Sessions.length; ++i) {
                var session = this.Sessions[i];
                session.RequestMetaData();
            }
        }
    }


//==============================================================================
    // State of loading a session.
    // The session name and id are loaded by default.
    var LOAD_INITIAL = 0;
    // A request has been made for the meta data.
    var LOAD_METADATA_WAITING = 1;
    // The meta data has arrived.
    var LOAD_METADATA_LOADED = 2;
    // The images have been requested.
    var LOAD_IMAGES = 3;
    
    
    
    function Session(data, list) {
        this.Id = data.sessid;
        this.Body = $('<li>')
            .appendTo(list);
        this.OpenCloseIcon = $('<img>')
            .appendTo(this.Body)
            .attr('src',"/webgl-viewer/static/plus.png")
            .css({'height': '15px'});
        $('<span>')
            .appendTo(this.Body)
            .text(data.label);
        this.ViewList = $('<ul>')
            .appendTo(this.Body)
            .css({'list-style': 'none',
                  'width':'auto',
                  'margin-top': '0',
                  'padding': '0',
                  'margin-left': '2em'})
            .hide();

        this.ViewList.Open = false;
        
        var self = this;
        this.OpenCloseIcon.click(function(){self.ToggleViewList();});
        
        // Delay loading
        this.LoadState = LOAD_INITIAL;
    }

    
    Session.prototype.RequestMetaData = function() {
        if (this.LoadState != LOAD_INITIAL) { return; }
        this.LoadState = LOAD_METADATA_WAITING;

        // Throw a waiting icon until the meta data arrives.
        var listItem = $('<li>')
            .appendTo(this.ViewList)
            .css({'margin': '2px',
                  'padding': '2px'})
        var image = $('<img>')
            .appendTo(listItem)
            .attr("src", "/webgl-viewer/static/circular.gif")
            .attr("alt", "waiting...")
            .css({'width':'40px'});
        
        var self = this;
        // Make the request to populate the view list.
        $.get("/sessions?json=1&sessid="+this.Id,
              function(data,status){
                  if (status == "success") {
                      self.LoadMetaData(data);
                  } else {
                      alert("ajax failed: sessions?json=1"); }
              }
             );
    }

    
    Session.prototype.LoadMetaData = function(data) {
        var self = this;
        this.LoadState = LOAD_METADATA_LOADED;
        
        this.Data = [];
        // Get rid of the waiting icon.
        this.ViewList.empty();
        for (var i = 0; i < data.session.views.length; ++i) {
            // Make a draggable list item
            var listItem = $('<li>')
                .appendTo(this.ViewList)
                .css({'float': 'left',
                      'margin': '2px',
                      'border': '2px solid #CCC',
                      'padding': '2px'})
                .hover(
                    function () {$(this).css({'border-color': '#333'});},
                    function () {$(this).css({'border-color': '#CCC'});})
                .mousedown(
                    function(event){
                        // Start dragging.
                        HideImagePopup();
                        var item = $(this)
                            .clone(false)
                            .appendTo(self.Body)
                            .css({'position':'fixed',
                                  'left': event.clientX-20,
                                  'top' : event.clientY-20})
                            .mousemove(
                                function(event) {
                                    $(this).css({
                                        'left': event.clientX-20,
                                        'top' : event.clientY-20});
                                    return false;
                                })
                            .mouseup(
                                function() {
                                    $(this).remove();
                                    return false;
                                });
                        return false;
                    });


            this.Data.push({item:listItem, 
                            label: data.images[i].label,
                            src:"/thumb?db="+data.images[i].db+"&img="+data.images[i].img})
            var labelDiv = $('<div>')
                .appendTo(listItem)
                .text(data.images[i].label)
                .css({'color': '#333',
                      'font-size': '11px'});
        }
        $('<div>')
            .appendTo(this.ViewList)
            .css('clear','both');
        
        if (this.ViewList.Open) {
            // View list was opened before we got the metadata.
            // Load the images too.
            this.RequestImages();
        }
    }
    

    Session.prototype.RequestImages = function() {
        if (this.LoadState != LOAD_METADATA_LOADED) { return; }
        this.LoadState = LOAD_IMAGES;
        
        for (var i = 0; i < this.Data.length; ++i) {
            var image = $('<img>')
                .appendTo(this.Data[i].item)
                .css({'height':'32px'})
                .attr("src", this.Data[i].src)
                .attr("alt", this.Data[i].label)
                .hover(
                    function () {
                        // Show larger image after 2 seconds.
                        //ScheduleImagePopup($(this));
                    },
                    function () {
                        //if (POPUP_IMAGE === undefined) {
                        //    HideImagePopup();
                        //}
                    });

        }
    }

    
    Session.prototype.ToggleViewList = function() {
        if (this.ViewList.Open) {
            this.ViewList.Open = false;
            this.ViewList.slideUp();
            this.OpenCloseIcon.attr('src',"/webgl-viewer/static/plus.png")
        } else {
            // It is not necessary to request meta data because opening the
            // collection already requests session metadata.  However,
            // This method does nothing if the request has already been made,
            // And someone might call this directly.
            this.RequestMetaData();
            this.RequestImages();
            
            this.ViewList.Open = true;
            this.ViewList.slideDown();
            this.OpenCloseIcon.attr('src',"/webgl-viewer/static/minus.png")
        }
    }
    
    




//==============================================================================
/*    var POPUP_TIMER_ID = 0;
    var POPUP_IMAGE = undefined;
    var POPUP_SOURCE_IMAGE;
    function ScheduleImagePopup(img) {
        // Clear any previous timer
        HideImagePopup();
        POPUP_TIMER_ID = window.setTimeout(function(){ShowImagePopup(img);}, 2000);
    }
    function HideImagePopup () {
        if (POPUP_TIMER_ID) {
            window.clearTimeout(POPUP_TIMER_ID);
            POPUP_TIMER_ID = 0;
        }
        if (POPUP_IMAGE) {
            //POPUP_IMAGE.css({'height':'32px'});
            POPUP_IMAGE.remove();
            POPUP_IMAGE = undefined;
        }
    }
    function ShowImagePopup (img) {
        POPUP_SOURCE_IMAGE = img;
        var pos = img.position();
        POPUP_IMAGE = img.clone(false);
        POPUP_IMAGE
            .appendTo(img.parent())
            .hide()
            .css({
                'position':'absolute',
                'height': img[0].naturalHeight,
                'left' : pos.left,
                'top' : pos.top,
                'border': '2px solid #CCC'});
        POPUP_IMAGE
            .slideDown()
            .mousemove(
                function (event) {
                    var height = POPUP_SOURCE_IMAGE.height();
                    var width = POPUP_SOURCE_IMAGE.width();
                    if (event.offsetX < 0 || event.offsetY < 0 ||
                        event.offsetX > width || event.offsetY > height) {
                        HideImagePopup();
                    }

                });

    }
*/







    // Export this CollectionBrowser object.
    return CollectionBrowser;
})(); // End of closure namespace

