//==============================================================================
// Create and manage the menu to browse and select views.
// I am changing this to be more about selecting an image.
// I am also making this into a dialog object. (not based on the dialog class).

// It may be better to undock and redock


function ViewBrowser(parent) {
    var self = this;
    // A view browser (short cut menu) for the text input.
    this.Div = $('<div>')
        .appendTo(parent)
        .hide().css({
            'position'  : 'absolute',
            'top'       : '5%',
            'height'    : '80%',
            'left'      : '10%',
            'width'     : '70%',
            'padding'   : '5%',
            'z-index'   : '1007',
            'text-align': 'left',
            'color'     : '#303030'})
        .mouseleave(function () {self.Div.fadeOut();});

    this.TabbedDiv = new TabbedDiv(this.Div);
    this.BrowserDiv = this.TabbedDiv.NewTabDiv("Browser");
    this.BrowserDiv.css({'overflow-y':'auto'});
    this.SearchDiv = this.TabbedDiv.NewTabDiv("Search");
    this.ClipboardDiv = this.TabbedDiv.NewTabDiv("Clipboard");

    this.BrowserPanel = new BrowserPanel(
        this.BrowserDiv,
        function (viewObj) {
            self.SelectView(viewObj);
        });

    this.SearchPanel = new SearchPanel(
        this.SearchDiv,
        function (imageObj) {
            self.SelectImage(imageObj);
        });

    this.ClipboardPanel = new ClipboardPanel(
        this.ClipboardDiv,
        function (viewObj) {
            self.SelectView(viewObj);
        });

    this.Viewer = null;
}

ViewBrowser.prototype.SelectView = function(viewObj) {
    if (viewObj == null) {
        this.Viewer.SetCache(null);
        eventuallyRender();
    }

    this.SelectImage(viewObj.ViewerRecords[0].Image);
}

ViewBrowser.prototype.SelectImage = function(imgobj) {
    this.Div.fadeOut();
    var source = FindCache(imgobj);

    // We have to get rid of annotation which does not apply to the new image.
    this.Viewer.Reset();
    this.Viewer.SetCache(source);    

    RecordState();

    eventuallyRender();
}


// Open the dialog. (ShowViewBrowser).
ViewBrowser.prototype.Open = function(viewer) {
    this.Viewer = viewer;
    if ( ! viewer) { return; }

    this.Div.show();
}


//==============================================================================


function BrowserPanel(browserDiv, callback) {
    this.BrowserDiv = browserDiv;
    this.SelectView = callback;

    this.BrowserInfo = null;
    this.ReloadViewBrowserInfo();
}

BrowserPanel.prototype.LoadGUI = function() {
    var self = this;
    var data = this.BrowserInfo;
    this.BrowserDiv.empty();
    groupList = $('<ul>').appendTo(this.BrowserDiv)

    for (i=0; i < data.sessions.length; ++i) {
        var group = data.sessions[i];
        var groupItem = $('<li>').appendTo(groupList).text(group.rule);
        var sessionList = $('<ul>').appendTo(groupItem)
        for (j=0; j < group.sessions.length; ++j) {
            var session = group.sessions[j];
            $('<li>').appendTo(sessionList)
                .text(session.label)
                .attr('db', session.sessdb).attr('sessid', session.sessid)
                .bind('click',function(){self.SessionClickCallback(this);})
                .addClass('saButton'); // for hover highlighting

        }
    }
}

BrowserPanel.prototype.ReloadViewBrowserInfo = function() {
    var self = this;
    // Get the sessions this user has access to.

    this.BrowserDiv.css({'cursor':'progress'});
    $.get("/sessions?json=true",
          function(data,status){
              self.BrowserDiv.css({'cursor':'default'});
              if (status == "success") {
                  self.BrowserInfo = data;
                  // I might want to open a session to avoid an extra click.
                  // I might want to sort the sessions to put the recent at the top.
                  self.LoadGUI(data);
              } else { 
                  saDebug("ajax failed."); 
              }
          });
}


BrowserPanel.prototype.SessionClickCallback = function(obj) {
    var self = this;
    // No closing yet.
    // Already open. disable iopening twice.
    $(obj).unbind('click');
    $(obj).removeClass('saButton'); // for hover highlighting

    // We need the information in view, image and bookmark (startup_view) object.
    var sess = $(obj).attr('sessid');
    this.BrowserDiv.css({'cursor':'progress'});
    $.get("/sessions?json=true"+"&sessid="+$(obj).attr('sessid'),
          function(data,status){
              self.BrowserDiv.css({'cursor':'default'});
              if (status == "success") {
                  self.AddSessionViews(data);
              } else { saDebug("ajax failed."); }
          });
}


BrowserPanel.prototype.AddSessionViews = function(sessionData) {
    var self = this;
    var sessionItem = $("[sessid="+sessionData.sessid+"]");
    var viewList = $('<ul>').appendTo(sessionItem)
    for (var i = 0; i < sessionData.images.length; ++i) {
      var image = sessionData.images[i];
      var item = $('<li>').appendTo(viewList)
        // image.db did not work for ibriham stack (why?)
            .attr('db', image.db)
            .attr('sessid', sessionData.sessid)
            .attr('viewid', image.view)
            .click(function(){self.ViewClickCallback(this);})
            .addClass('saButton'); // for hover highlighting
      $('<img>').appendTo(item)
          .attr('src', "/thumb?db="+image.db+"&img="+image.img)
          .css({'height': '50px'});
      $('<span>').appendTo(item)
          .text(image.label);
      }
}


BrowserPanel.prototype.ViewClickCallback = function(obj) {
    var self = this;

    // null implies the user wants an empty view.
    if (obj == null) {
        this.SelectView(null);
        return;
    }

    var db = $(obj).attr('db');
    var viewid = $(obj).attr('viewid');

    // Ok, so we only have the viewId at this point.
    // We need to get the view object to get the image id.
    this.BrowserDiv.css({'cursor':'progress'});
    $.ajax({
        type: "get",
        url: "/webgl-viewer/getview",
        data: {"sessid": $(obj).attr('sessid'),
               "viewid": $(obj).attr('viewid'),
               "db"  : $(obj).attr('db')},
        success: function(data,status) {
            self.BrowserDiv.css({'cursor':'default'});
            self.SelectView(data);
        },
        error: function() {
            self.BrowserDiv.css({'cursor':'default'});
            saDebug( "AJAX - error() : getview (browser)" );
        },
    });
}






