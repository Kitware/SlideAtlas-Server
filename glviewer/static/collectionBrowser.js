// TODO: 
// Mouse down selects.  Mouse move (past threshold) starts drag.
// Multiple select (crtl) + drag and drop.
// Shift?
// Drag and copy with right click.
// (maybe) Right click menu.
// View names should be editable.
// Drop position indicator could be improved.


// I am not so sure I like this pattern.
// I am trying to hide helper object, but
// I could just declare them inside the contructor.
// This pattern does not make any of the methods
// private.  I do not think it makes any instance
// variables private either.


// Closure namespace 
CollectionBrowser = (function (){

    var SELECTED = [];
    var BROWSERS = [];

    function CollectionBrowser () {
        // I am keeping a tree down to the view "leaves".
        // I need to keep the view "tree index" so the view li knows its position.
        this.BrowserIndex = BROWSERS.length;
        BROWSERS.push(this);

        var self = this;
        this.Div = $('<div>')
            .css({'height': '100%'});
        this.OptionBar = $('<div>')
            .appendTo(this.Div)
            .css({'height': '20px',
                  'width':  '100%',
                  'position': 'relative',
                  'border': '1px solid #CCC'});
        
        this.Collections = [];

        this.CollectionItemList = $('<ul>')
            .appendTo(this.Div)
            .css({'list-style': 'none',
                  'margin-left': '0.5em',
                  'margin-top': '0',
                  'position':   'relative',
                  'padding':    '0',
                  'height':     '100%',
                  'overflow-y': 'auto'});
        
        this.DefaultCollectionLabel = "";
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
        // Populate the collection menu.
        var defaultCollection = undefined;
        // The first "sessions" list is actually collections.
        for (var i = 0; i < data.sessions.length; ++i) {
            // Note: data.sessions is actually a list of collections.
            var collection = new Collection(data.sessions[i],this);
            // Which collection should be open.
            if (data.sessions[i].rule == this.DefaultCollectionLabel) {
                defaultCollection = collection;
            }
        }
        if (defaultCollection) {
            defaultCollection.ToggleSessionList();
            // Now scroll to put the collection at the top.
            var scrollDiv = this.CollectionItemList;
            // Why won't it scroll if call directly?
            setTimeout(function () {var offset = defaultCollection.ListItem.offset();
                                    scrollDiv.scrollTop(offset.top);},
                       100);
        }
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

    function Collection(data, browser) {
        this.Browser = browser;
        this.CollectionIndex = browser.Collections.length;
        browser.Collections.push(this);
        var ul = browser.CollectionItemList;

        this.ListItem = $('<li>')
            .appendTo(ul)
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
            new Session(data.sessions[i], this);
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
                if (this.LoadState == LOAD_INITIAL) {
                    session.RequestMetaData();
                }
            }
        }
    }


//==============================================================================
    // State of loading a session.
    // The session name and id are loaded by default.
    // Collection has not been opened.
    var LOAD_INITIAL = 0;
    // A request has been made for the meta data.
    var LOAD_METADATA_WAITING = 1;
    // The meta data has arrived.
    // Collection is open, but the session is not.
    var LOAD_METADATA_LOADED = 2;
    // The images have been requested.
    var LOAD_IMAGES = 3;
    
    
    function Session(data, collection) {
        this.Collection = collection;
        var ul = collection.SessionList;
        this.SessionIndex = collection.Sessions.length;
        collection.Sessions.push(this);

        this.Id = data.sessid;
        this.Body = $('<li>')
            .appendTo(ul);
        this.OpenCloseIcon = $('<img>')
            .appendTo(this.Body)
            .attr('src',"/webgl-viewer/static/plus.png")
            .css({'height': '15px'});
        this.SessionLabel = $('<span>')
            .appendTo(this.Body)
            .text(data.label);

        this.Label = data.label;

        this.ViewList = $('<ul>')
            .appendTo(this.Body)
            .css({'list-style': 'none',
                  'width':'auto',
                  'margin-top': '0',
                  'padding': '0',
                  'outline': '1px solid transparent',
                  'margin-left': '2em'})
            .hide();

        this.ViewList.Open = false;
        
        var self = this;
        this.OpenCloseIcon.click(function(){self.ToggleViewList();});
        
        // Delay loading
        this.LoadState = LOAD_INITIAL;
    }

    
    Session.prototype.RequestMetaData = function() {
        this.LoadState = LOAD_METADATA_WAITING;

        this.ViewList.empty();

        // Throw a waiting icon until the meta data arrives.
        var listItem = $('<li>')
            .appendTo(this.ViewList)
            .css({'margin': '2px',
                  'padding': '2px'});
        
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
              });
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
                .data('viewid', data.session.views[i].id)
                .data('imgid', data.session.views[i].image_id)
                .data('imgdb', data.session.views[i].image_store_id)
                // I hate having to encode user data in attibutes.
                // Remeber where this jquery element is in the tree.
                .data("sessionIdx", this.SessionIndex)
                .data("collectionIdx", this.Collection.CollectionIndex)
                .data("browserIdx", this.Collection.Browser.BrowserIndex)
                .css({'float': 'left',
                      'list-style-type': 'none',
                      'margin': '2px',
                      'border': '2px solid #CCC',
                      'padding': '2px'})
                .hover(
                    function () {$(this).css({'border-color': '#333'});},
                    function () {$(this).css({'border-color': '#CCC'});})
                .mousedown(
                    function(event){
                        event.preventDefault();
                        // select


 
                        // Startdragging.
                        HideImagePopup();
                        StartViewDrag($(this), event);
                        return false;
                    });

            // This data array is only used to delay loading the images.
            this.Data.push({item:listItem, 
                            label: data.images[i].label,
                            src:"/thumb?db="+data.images[i].db+"&img="+data.images[i].img})
            var labelDiv = $('<div>')
                .appendTo(listItem)
                .text(data.images[i].label)
                .css({'color': '#333',
                      'font-size': '11px',
                      'display': 'block'});
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
                .mouseenter(
                    function (event) {
                        if (event.which == 0) {
                            // Show larger image after about 1 second.
                            ScheduleImagePopup($(this));
                        }
                    })
                .mouseleave(
                    function () {
                        // Cancel if the popup has not displayed yet.
                        ClearPendingImagePopup();
                    });            

        }
    }

    
    Session.prototype.ToggleViewList = function() {
        if (this.ViewList.Open) {
            this.ViewList.Open = false;
            this.ViewList.slideUp();
            this.OpenCloseIcon.attr('src',"/webgl-viewer/static/plus.png");
            RemoveDropTarget(this);
        } else {
            // It is not necessary to request meta data because opening the
            // collection already requests session metadata.  However,
            // This method does nothing if the request has already been made,
            // And someone might call this directly.
            if (this.LoadState == LOAD_INITIAL) {
                // This should not be necessary
                this.RequestMetaData();
            }
            this.RequestImages();
            
            this.ViewList.Open = true;
            this.ViewList.slideDown();
            this.OpenCloseIcon.attr('src',"/webgl-viewer/static/minus.png")
            AddDropTarget(this);
        }
    }


    // Sets DropTargetItem and DropTargetBefore.
    // It also handles highlighting the drop target.
    // Returns true if drop target was found.
    Session.prototype.UpdateDropTarget = function(x,y,source) {
        // Check to see if the mouse is in the body
        var pos = this.Body.offset();
        var width = this.Body.innerWidth();
        var height = this.Body.innerHeight();
        var rx = x - pos.left;
        var ry = y - pos.top;
        if (rx < 0 || ry < 0 || rx > width || ry > height) {
            if ( this.DropTargetItem) {
                this.DropTargetItem.css({'border-color':'#CCC',
                                         'border-width':'2'});
                this.DropTargetItem = undefined;
            }
            return false;
        }
        // Find the closest item.
        var bestDist = 1000000;
        var bestItem;
        var bestBefore = true;
        this.ViewList.children('li').each(
            function (index, item) {
                var pos = $(item).offset();
                var dist = 0;
                if (x < pos.left) { dist += pos.left - x; }
                if (y < pos.top) { dist += pos.top - y; }
                var right = pos.left + $(item).innerWidth();
                var bottom = pos.top + $(item).innerHeight();
                if (x > right) { dist += x - right; }
                if (y > bottom) { dist += y - bottom; }
                if (source[0] != item && dist < bestDist && $(item) != source) {
                    bestDist = dist;
                    bestItem = $(item);
                    bestBefore = x < (pos.left+right)*0.5;
                }
            });
        if ( this.DropTargetItem) {
            this.DropTargetItem.css({'border-color':'#CCC',
                                     'border-width':'2'});
            this.DropTargetItem = undefined;
        }
        if ( bestItem == source) {
            this.DropTargetItem = undefinedl
            return false;
        }

        this.DropTargetBefore = bestBefore;
        this.DropTargetItem = bestItem;
        if (this.DropTargetBefore) {
            bestItem.css({'border-left-color':'#333',
                          'border-left-width':'4px'});
        } else {
            bestItem.css({'border-right-color':'#333',
                          'border-right-width':'4px'});
        }
        return true;
    }


    Session.prototype.Drop = function(x,y, source, clone) {
        if (this.UpdateDropTarget(x,y, source)) {
            // Get the source session so we can save it.
            // This is the whole point of making a tree.
            var browserIdx = source.data("browserIdx");
            var collectionIdx = source.data("collectionIdx");
            var sessionIdx = source.data("sessionIdx");
            var sourceSession = 
                BROWSERS[browserIdx]
                  .Collections[collectionIdx]
                    .Sessions[sessionIdx];

            // Lets delete the original source <li>
            source.remove();
            // and keep the clone <li>
            clone
                .css({'position':'static',
                      'float': 'left',
                      'list-style-type': 'none',
                      'margin': '2px',
                      'border': '2px solid #CCC',
                      'padding': '2px'});
            // Record the new position of the view <li> inthe tree.
            // This session is the destination session.
            clone
                .data("sessionIdx", this.SessionIndex)
                .data("collectionIdx", this.Collection.CollectionIndex)
                .data("browserIdx", this.Collection.Browser.BrowserIndex);

            // Reparent the clone.
            if (this.DropTargetBefore) {
                clone.insertBefore(this.DropTargetItem);
            } else {
                clone.insertAfter(this.DropTargetItem);
            }
            // Get rid of the thick border indicator of where the
            // drop will take place.
            this.DropTargetItem.css({'border-color':'#CCC',
                                     'border-width':'2'});
            // Save the two sessions.
            this.Save();
            if (sourceSession != this) {
                sourceSession.Save();
            }

            return true;
        }
        return false;
    }

    Session.prototype.Save = function() {
        if (this.LoadState != LOAD_METADATA_LOADED &&
            this.LoadState != LOAD_IMAGES ) {
            alert("Error Save: Session not loaded.");
            return;
        }

        var views = [];
        this.ViewList.children('li').each(function () {
            var view = {
                'label' : $('div',this).text(),
                'imgdb' : $(this).data('imgdb'),
                'img'   : $(this).data('imgid'),
                'view'  :$(this).data('viewid')
            };

            var viewId = $(this).attr('view');
            if (viewId && viewId != "") {
                view.view = viewId;
            }
            views.push(view);
        });

        // Save the new order in the database.
        // Python will have to detect if any view objects have to be deleted.
        var args = {};
        args.views = views;
        args.session = this.Id;
        args.label = this.SessionLabel.text();

        $.ajax({
            type: "post",
            url: "/session-save",
            data: {"input" :  JSON.stringify( args )},
            success: function() {},
            error:   function() {alert( "AJAX - error: session-save (collectionBrowser)" ); }
        });

        // Update the other browser.
        var collectionIdx = this.Collection.CollectionIndex;
        // Browser index is different, but al the others are the same.
        var browserIdx = (this.Collection.Browser.BrowserIndex+1)%2;
        var otherSession = 
            BROWSERS[browserIdx].Collections[collectionIdx].Sessions[this.SessionIndex];
        if (otherSession.LoadState == LOAD_METADATA_WAITING ||
            otherSession.LoadState == LOAD_METADATA_LOADED) {
            // What to do?
            otherSession.RequestMetaData();
        } if (otherSession.LoadState == LOAD_IMAGES) {
            otherSession.RequestMetaData();
            /* this messed up the layout for some reason
            // Lets just copy / clone this session
            otherSession.ViewList.empty();
            this.ViewList.children('li').each(function () {
                viewItem = $(this).clone(true);
                viewItem
                    .data("browserIdx", browserIdx)
                    .appendTo(otherSession.ViewList);
            });
            */
        }
    }

    
    
//==============================================================================
    var DROP_TARGETS = [];
    var DRAG_ITEM = undefined;
    var DRAG_CLONE = undefined;
    function StartViewDrag(source, event) {
        var x = event.clientX;
        var y = event.clientY;

        DRAG_ITEM = source;

        var clone = source
            .clone(true)
            .appendTo('body')
            .css({'position':'fixed',
                  'left': x,
                  'top' : y,
                  'margin': 0});
        DRAG_CLONE = clone;

        // Change the original div to a placeholder.
        source.children().css({'opacity':'0.2'});

        $('body')
            .mousemove(
                function(event) {
                    event.preventDefault();
                    ViewDrag(event);
                    return false;
                })
            .mouseup(
                function(event) {
                    $(this).unbind('mousemove');
                    $(this).unbind('mouseup');
                    $(this).unbind('mouseleave');
                    ViewDrop(event);
                    return false;
                })
            .mouseleave(
                function(event) {
                    $(this).unbind('mousemove');
                    $(this).unbind('mouseup');
                    $(this).unbind('mouseleave');
                    ViewDrop(event);
                    return false;
                });
        
        ClearPendingImagePopup();
        return false;
    }

    function ViewDrag(event) {
        var x = event.clientX;
        var y = event.clientY;
        DRAG_CLONE
            .css({'left': x-20,
                  'top' : y-20});

        for (var i = 0; i < DROP_TARGETS.length; ++i) {
            DROP_TARGETS[i].UpdateDropTarget(x, y, DRAG_ITEM);
        }
    }

    function ViewDrop(event) {
        var x = event.clientX;
        var y = event.clientY;
        // This just drags the clone if the mouse postion changed.
        // It is probably not necessary.
        DRAG_CLONE
            .css({'left': event.clientX-20,
                  'top' : event.clientY-20});
        // Look through all open sessions to se if we dropped in one.
        for (var i = 0; i < DROP_TARGETS.length; ++i) {
            var destinationSession = DROP_TARGETS[i];
            if (destinationSession.Drop(x, y, DRAG_ITEM, DRAG_CLONE)) {
                // Found the dropp session.  Drop does all the shuffling.
                return true;
            }
        }
        // No drop destination, undo the drag / move.
        DRAG_CLONE.remove();
        DRAG_ITEM.children().css({'opacity':'1.0'});
        return false;
    }

    function UndoDrop(source){
        alert("Undo move");
    }

    function AddDropTarget(dropTarget) {
        DROP_TARGETS.push(dropTarget);
    }

    function RemoveDropTarget(dropTarget) {
        var idx = DROP_TARGETS.indexOf(dropTarget);
        if (idx > -1) {
            DROP_TARGETS.splice(idx,1);
        }
    }


//==============================================================================
    var POPUP_TIMER_ID = 0;
    var POPUP_IMAGE = undefined;
    var POPUP_SOURCE_IMAGE;
    function ScheduleImagePopup(img) {
        // Clear any previous timer
        HideImagePopup();
        POPUP_TIMER_ID = window.setTimeout(function(){ShowImagePopup(img);}, 1200);
    }
    function ClearPendingImagePopup() {
        if (POPUP_TIMER_ID) {
            window.clearTimeout(POPUP_TIMER_ID);
            POPUP_TIMER_ID = 0;
        }
    }
    function HideImagePopup () {
        ClearPendingImagePopup();
        if (POPUP_IMAGE) {
            //POPUP_IMAGE.css({'height':'32px'});
            POPUP_IMAGE.remove();
            POPUP_IMAGE = undefined;
        }
    }
    function ShowImagePopup (img) {
        POPUP_SOURCE_IMAGE = img;
        var pos = img.offset();
        POPUP_IMAGE = img.clone(false);
        POPUP_IMAGE
            .appendTo(img.parent())
            .hide()
            .css({
                'position':'fixed',
                'height': img[0].naturalHeight,
                'left' : pos.left,
                'top' : pos.top,
                'border': '2px solid #CCC'});
        POPUP_IMAGE
            .slideDown()
            .mouseleave(
                function () {
                    HideImagePopup();
                })
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





    // Export this CollectionBrowser object.
    return CollectionBrowser;
})(); // End of closure namespace

