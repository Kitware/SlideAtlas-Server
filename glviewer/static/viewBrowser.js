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
    // Bad name for this div because it contains the bullet too.
    // TODO: Change the name.
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
        .css({'margin-left':'20px'});
    this.Label = $('<div>')
        .appendTo(this.Title)
        .css({'display':'block'})
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
    // Setup next click to close.
    this.Bullet.off('click.open')
        .removeClass('ui-icon-plus')
        .addClass('ui-icon-minus')
        .on(
            'click.close',
            function () {
                self.CloseCallback();
            });
    this.List.show();
}

BrowserFolder.prototype.CloseCallback = function() {
    var self = this;
    // Setup next click to open.
    this.Bullet.off('click.close')
        .removeClass('ui-icon-minus')
        .addClass('ui-icon-plus')
        .on(
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
    this.ProgressCount = 0;
}

BrowserPanel.prototype.PushProgress = function() {
    this.BrowserDiv.css({'cursor':'progress'});
    this.ProgressCount += 1;
}

BrowserPanel.prototype.PopProgress = function() {
    this.ProgressCount -= 1;
    if (this.ProgressCount <= 0) {
        this.BrowserDiv.css({'cursor':'default'});
    }
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

    this.PushProgress();
    $.get("/sessions?json=true",
          function(data,status){
              self.PopProgress();
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
    this.PushProgress();
    var sessId = sessionFolder.Data.sessid;
    $.get("/sessions?json=true"+"&sessid="+sessId,
          function(data,status){
              self.PopProgress();
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
        var viewFolder = self.AddViewFolder(viewList,image.label,image.view);
        this.RequestViewChildren(viewFolder);
    }
}


// NOTE: It would be cleaner to wait for the view data before creating the folder.
// However, we might loose the order of the views in a session.
BrowserPanel.prototype.AddViewFolder = function(viewList, label, viewId) {
    var self = this;
    var item = $('<li>')
        .appendTo(viewList);
    // We do not know if views have subviews until we get the viewObj.
    // Just make them all folders for now.
    var viewData = {viewid:viewId};
    var viewFolder = new BrowserFolder(item, label, viewData);
    viewFolder.Bullet.hide();
    viewFolder.Title
        .click(function(){self.ViewClickCallback(viewFolder);})
        .addClass('saButton'); // for hover highlighting

    return viewFolder;
}


BrowserPanel.prototype.RequestViewChildren = function(viewFolder) {
    var self = this;
    this.PushProgress();
    var viewId = viewFolder.Data.viewid;
    $.ajax({
        type: "get",
        url: "/webgl-viewer/getview",
        data: {"viewid": viewId},
        success: function(data,status) {
            self.PopProgress();
            self.LoadViewChildren(viewFolder, data);
        },
        error: function() { 
            saDebug( "AJAX - error() : getview" ); 
            self.PopProgress();
        },
    });
}

BrowserPanel.prototype.LoadViewChildren = function(viewFolder, data) {
    // Replace image with thumb?
    if (data.Type == 'HTML') {
        // Add a small slide html page.
        var div1 = $('<div>')
            .appendTo(viewFolder.Title)
            .css({'position': 'relative',
                  'height': '100px',
                  'width':  '134px',
                  'margin-bottom':'2px',
                  'border' :'1px solid #AAA'})
        var div = $('<div>')
            .appendTo(div1)
            .saPresentation({aspectRatio : 1.3333});
        div.saHtml(data.Text);
        // Viewers do not work yet.
        div.find('.sa-viewer').remove();
        div.trigger('resize');
        div.find('.sa-element').saElement({editable:false, lock:true});
        // Look for an alternative label.
        if (! data.Title || data.Title == "") {
            var titleDiv = div.find('.sa-presentation-title');
            if (titleDiv.length > 0) {
                viewFolder.Label.text(titleDiv.text());
            }
        }
    } else if (data.ViewerRecords && data.ViewerRecords.length > 0) {
        // Add the image to the label.
        var image = data.ViewerRecords[0].Image;
        $('<img>')
            .appendTo(viewFolder.Title)
            .attr('src', "/thumb?db="+image.database+"&img="+image._id)
            .css({'height': '50px',
                  'display':'block'});
    }

    if ( ! data.Children || data.Children.length < 1) { return; }
    viewFolder.Bullet.show();
    for (var i = 0; i < data.Children.length; ++i) {
        var child = data.Children[i];
        var childFolder = this.AddViewFolder(viewFolder.List, child.Title,
                                             child._id);

        this.LoadViewChildren(childFolder, child);
    }
}


BrowserPanel.prototype.ViewClickCallback = function(viewFolder) {
    var self = this;

    // null implies the user wants an empty view. ?????????????????
    //if (obj == null) {
    //    this.SelectView(null);
    //    return;
    //}

    // TODO: Get rid of this arg.
    var viewid = viewFolder.Data.viewid;

    // "sessid": $(obj).attr('sessid'),
    // Ok, so we only have the viewId at this point.
    // We need to get the view object to get the image id.
    this.PushProgress();
    $.ajax({
        type: "get",
        url: "/webgl-viewer/getview",
        data: {"viewid": viewid},
        success: function(data,status) {
            self.PopProgress();
            self.SelectView(data);
        },
        error: function() {
            self.PopProgress();
            saDebug( "AJAX - error() : getview (browser)" );
        },
    });
}






