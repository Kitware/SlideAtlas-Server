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
// Open close item
function BrowserFolder(parent, label, data, initCallback) {
    var self = this;
    this.Data = data;
    this.InitializeCallback = initCallback;
    this.TitleDiv = $('<div>')
        .css({'position':'relative'})
        .appendTo(parent);
    this.Bullet = $('<span>')
        .appendTo(this.TitleDiv)
        .css({'position':'absolute',
              'left':'0px',
              'top':'1px',
              'opacity':'0.75'})
        .addClass('ui-icon ui-icon-plus')
        .on('click.open',
            function() {
                self.OpenCallback();
            })
        .addClass('saButton'); // for hover highlighting

    this.Title = $('<div>')
        .appendTo(this.TitleDiv)
        .css({'margin-left':'20px'})
        .text(label);
    this.List = $('<ul>')
        .appendTo(parent)
        .addClass('sa-ul')
        .hide();
}

BrowserFolder.prototype.OpenCallback = function() {
    var self = this;
    if (this.InitializeCallback) {
        (this.InitializeCallback)(this);
        delete this.InitializeCallback;
    }
    // Remove the binding.
    this.Bullet.off('click.open');
    // Setup next click to close.
    this.Bullet
        .removeClass('ui-icon-plus')
        .addClass('ui-icon-minus');
    this.Bullet.on(
        'click.close',
        function () {
            self.CloseCallback();
        });
    this.List.show();
}

BrowserFolder.prototype.CloseCallback = function() {
    var self = this;
    this.Bullet.off('click.close');
    // Setup next click to open.
    this.Bullet
        .removeClass('ui-icon-minus')
        .addClass('ui-icon-plus');
    this.Bullet.on(
        'click.open',
        function () {
            self.OpenCallback();
        });
    this.List.hide();
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
    groupList = $('<ul>')
        .addClass('sa-ul')
        .appendTo(this.BrowserDiv);

    for (i=0; i < data.sessions.length; ++i) {
        groupItem = $('<li>')
            .appendTo(groupList);
        var group = data.sessions[i];
        var groupFolder = new BrowserFolder(groupItem, group.rule);
        // Initialize immediately.
        var sessionList = groupFolder.List;
        for (j=0; j < group.sessions.length; ++j) {
            var session = group.sessions[j];
            var sessionData = {'db': session.sessdb, 'sessid': session.sessid};
            sessionItem = $('<li>')
                .appendTo(sessionList);
            new BrowserFolder(
                sessionItem, session.label, sessionData,
                function (folder) {
                    self.RequestSessionViews(folder)
                });
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

BrowserPanel.prototype.RequestSessionViews = function(sessionFolder) {
    var self = this;
    this.BrowserDiv.css({'cursor':'progress'});
    var sessId = sessionFolder.Data.sessid;
    $.get("/sessions?json=true"+"&sessid="+sessId,
          function(data,status){
              self.BrowserDiv.css({'cursor':'default'});
              if (status == "success") {
                  self.AddSessionViews(sessionFolder, data);
              } else { saDebug("ajax failed."); }
          });
}

BrowserPanel.prototype.AddSessionViews = function(sessionFolder, sessionData) {
    var self = this;
    var viewList = sessionFolder.List;
    for (var i = 0; i < sessionData.images.length; ++i) {
        var image = sessionData.images[i];
        var item = $('<li>')
            .appendTo(viewList)
        // We do not know if views have subviews until we get the viewObj.
        // Just make them all folders for now.
        var viewData = {db:image.db, sessid:sessionData.sessid, viewid:image.view};
        var viewFolder = new BrowserFolder(
            item, image.label, viewData,
            function (folder) {
                self.RequestViewChildren(folder)
            });
        // Add the image to the label.
        $('<img>').prependTo(viewFolder.Title)
            .attr('src', "/thumb?db="+image.db+"&img="+image.img)
            .css({'height': '50px',
                  'display':'inline-block'});
        viewFolder.Title
            .attr('db', image.db)
            .attr('sessid', sessionData.sessid)
            .attr('viewid', image.view)
            .click(function(){self.ViewClickCallback(this);})
            .addClass('saButton'); // for hover highlighting
    }
}

BrowserPanel.prototype.RequestViewChildren = function(viewFolder) {
    /*
    var self = this;
    this.BrowserDiv.css({'cursor':'progress'});
    var sessId = sessionFolder.Data.sessid;
    $.get("/sessions?json=true"+"&sessid="+sessId,
          function(data,status){
              self.BrowserDiv.css({'cursor':'default'});
              if (status == "success") {
                  self.AddSessionViews(sessionFolder, data);
              } else { saDebug("ajax failed."); }
          });
    */
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






