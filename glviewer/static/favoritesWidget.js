// VCR like buttons to get to next/previous note/slide.
// entwined with the notes widget at the moment.


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
  
  
  var self = this;
 /* this.Div =
    $('<div>').appendTo('body')
              .css({'position': 'absolute',
                    'left' : left,
                    'bottom' : bottom,
                    'z-index': '2'});*/
                    
  this.FavoritesList =
    $('<div>').appendTo('body')
              .css({'position': 'absolute',
                    'height': '150px',
                    'width': '100%',
                    'left': '0px',
                    'bottom': '0px',
                    'padding': '5px',
                    'opacity': '0.6',
                    'background-color': '#000000',
                    'z-index': '2'})
            .hide();
                    
  this.ImageList = 
    $('<ul>').appendTo(this.FavoritesList);
              

  this.BookmarkButton =
    $('<img>').appendTo('body')
              .css({'position': 'absolute',
                    'height': size,
                    'width': size,
                    'left': '0px',
                    'bottom': '55px',
                    'padding' : '5px',
                    'opacity': '0.6',
                    'z-index': '3'})
              .attr('src',"webgl-viewer/static/favorite-star.png")
              .click(function(){
                self.ShowHideFavorites();
              });
  this.TextTip = new ToolTip(this.BookmarkButton, "Save Bookmark");
  
  /*$.get("/sessions?json=true"+"&sessdb=5074589202e31023d4292d8b&sessid=50763f3102e3100690258a95",
        function(data,status){
          if (status == "success") {
            ViewBrowserAddSessionViews(data);
          } else { alert("ajax failed."); }
        });*/
        
  $.ajax({
    type: "get",
    url: "/webgl-viewer/getfavoriteviews",
    success: function(data,status){
               if (status == "success") {
                 self.LoadFavorites(data);
               } else { alert("ajax failed - get favorite views"); }
             },
    error: function() { alert( "AJAX - error() : getfavoriteviews" ); },
    });

  /*this.PreviousSlideButton =
    $('<img>').appendTo(this.Div)
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/previousSlide.png")
              .click(function(){self.PreviousSlide();});
  this.PreviousSlideTip = new ToolTip(this.PreviousSlideButton, "Previous Slide");

  this.PreviousNoteButton =
    $('<img>').appendTo(this.Div)
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/previousNote.png")
              .click(function(){self.PreviousNote();});
  this.PreviousNoteTip = new ToolTip(this.PreviousNoteButton, "Previous Note");

  this.NextNoteButton =
    $('<img>').appendTo(this.Div)
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/nextNote.png")
              .click(function(){self.NextNote();});
  this.NextNoteTip = new ToolTip(this.NextNoteButton, "Next Note");

  this.NextSlideButton =
    $('<img>').appendTo(this.Div)
              .css({'height': size,
                    'width': size,
                    'padding' : '5px',
                    'opacity': '0.6'})
              .attr('src',"webgl-viewer/static/nextSlide.png")
              .click(function(){self.NextSlide();});
  this.NextSlideTip = new ToolTip(this.NextSlideButton, "Next Slide");*/
  
  
}

FavoritesWidget.prototype.ShowHideFavorites = function(){
  if(this.hidden){
    this.FavoritesList.show();
    this.hidden = false;
  } else {
    this.FavoritesList.hide();
    this.hidden = true;
  }
}

FavoritesWidget.prototype.LoadFavorites = function(sessionData) {
  //var sessionItem = $("[sessid="+sessionData.sessid+"]");
  
  //var viewList = $('<ul>').appendTo(sessionItem)
  
  for (var i = 0; i < sessionData.images.length; ++i) {
    /*var image = sessionData.images[i];
    //var item = $('<li>').appendTo(viewList)
    var item = $('<li>').appendTo(this.ImageList)
                        .css({'float': 'left'});
      // image.db did not work for ibriham stack (why?)
      .attr('db', sessionData.db)
      .attr('sessid', sessionData.sessid)
      .attr('viewid', image.view)
      .click(function(){ViewBrowserImageCallback(this);});
    $('<img>').appendTo(item)
      .attr('src', "tile?db="+image.db+"&img="+image.img+"&name=t.jpg")     // all images should have thumb.jpg
      .css({'height': '50px'});
    $('<span>').appendTo(item)
      .text(image.label);*/
      
    var image = sessionData.images[i];
    var favorite = $('<li>').appendTo(this.ImageList);
    var view = $('<img>').appendTo(favorite);
  }
}




/*FavoritesWidget.prototype.SaveBookmark = function() {
  NOTES_WIDGET.SaveBrownNote();
  // Hide shifts the other buttons to the left to fill the gap.
  this.BookmarkButton.css({'opacity': '0.0'});
  var button = this.BookmarkButton;
  setTimeout(function(){
               button.css({'opacity': '0.6'});
             }, 1000); // one second
}

FavoritesWidget.prototype.ToggleVisibility = function() {
  this.SetVisibility( ! this.Visibility);
}

FavoritesWidget.prototype.SetVisibility = function(v) {
  this.Visibility = v;
  if (v) {
    this.Div.show();
  } else {
    this.Div.hide();
  }
}

FavoritesWidget.prototype.Update = function() {
  // Disable and enable prev/next note buttons so we cannot go past the end.
  if (NOTES_WIDGET.Iterator.IsStart()) {
    this.PreviousNoteButton.css({'opacity': '0.1'});
    this.PreviousNoteTip.SetActive(false);
  } else {
    this.PreviousNoteButton.css({'opacity': '0.5'});
    this.PreviousNoteTip.SetActive(true);
  }
  if (NOTES_WIDGET.Iterator.IsEnd()) {
    this.NextNoteButton.css({'opacity': '0.1'});
    this.NextNoteTip.SetActive(false);
  } else {
    this.NextNoteButton.css({'opacity': '0.5'});
    this.NextNoteTip.SetActive(true);
  }

  // Disable and enable prev/next slide buttons so we cannot go past the end.
  if (this.SlideIndex <= 0) {
    this.PreviousSlideButton.css({'opacity': '0.1'});
    this.PreviousSlideTip.SetActive(false);
  } else {
    this.PreviousSlideButton.css({'opacity': '0.5'});
    this.PreviousSlideTip.SetActive(true);
  }
  if (this.SlideIndex >= this.Session.length-1) {
    this.NextSlideButton.css({'opacity': '0.1'});
    this.NextSlideTip.SetActive(false);
  } else {
    this.NextSlideButton.css({'opacity': '0.5'});
    this.NextSlideTip.SetActive(true);
  }
}

FavoritesWidget.prototype.PreviousNote = function() {
  if (NOTES_WIDGET.Iterator.IsStart()) { return; }

  NOTES_WIDGET.Iterator.Previous();
  NOTES_WIDGET.Iterator.GetNote().Select();
}

FavoritesWidget.prototype.NextNote = function() {
  if (NOTES_WIDGET.Iterator.IsEnd()) { return; }

  NOTES_WIDGET.Iterator.Next();
  NOTES_WIDGET.Iterator.GetNote().Select();
}


FavoritesWidget.prototype.PreviousSlide = function() {
  if (this.SlideIndex <= 0) { return; }
  var check = true;
  if (EDIT) {
    check = confirm("Unsaved edits will be lost.  Are you sure you want to move to the previous slide?");
  }
  if (check) {
    this.SlideIndex -= 1;
    NOTES_WIDGET.LoadViewId(this.Session[this.SlideIndex]);
    }
}

FavoritesWidget.prototype.NextSlide = function() {
  if (this.SlideIndex >= this.Session.length - 1) { return; }
  var check = true;
  if (EDIT) {
    check = confirm("Unsaved edits will be lost.  Are you sure you want to move to the next slide?");
  }
  if (check) {
    this.SlideIndex += 1;
    NOTES_WIDGET.LoadViewId(this.Session[this.SlideIndex]);
  }
}

FavoritesWidget.prototype.LoadViewId = function(viewId) {
  VIEW_ID = viewId;
  NOTES_WIDGET.RootNote = new Note();
  if (typeof(viewId) != "undefined" && viewId != "") {
    NOTES_WIDGET.RootNote.LoadViewId(viewId);
  }
  // Since loading the view is asynchronous,
  // the NOTES_WIDGET.RootNote is not complete at this point.
}*/






