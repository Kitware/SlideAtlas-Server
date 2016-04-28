//==============================================================================

// TODO: Fix
// Add stack option to Save large image GUI.
// SaveStackImages.

// I think this can go away now that we have hover mode in text.
var ANNOTATION_OFF = 0;
var ANNOTATION_NO_TEXT = 1;
var ANNOTATION_ON = 2;

var INTERACTION_NONE = 0;
var INTERACTION_DRAG = 1;
var INTERACTION_ROTATE = 2;
var INTERACTION_ZOOM = 3;
var INTERACTION_OVERVIEW = 4;
var INTERACTION_OVERVIEW_DRAG = 5;
var INTERACTION_ICON_ROTATE = 6;

// TODO: Can we get rid of args parameter now that we have ProcessArguments method?
// See the top of the file for description of args.
function Viewer (parent) {
    var self = this;

    this.Parent = parent;
    parent.addClass('sa-viewer');

    this.Div = $('<div>')
        .appendTo(this.Parent)
        .css({'position':'relative',
              'border-width':'0px',
              'width':'100%',
              'height':'100%',
              'box-sizing':'border-box'})
        .addClass('sa-resize');
    this.Div.saOnResize(
        function() {
            self.UpdateSize();
        });

    this.LayerDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position':'relative',
              'border-width':'0px',
              'width':'100%',
              'height':'100%',
              'box-sizing':'border-box'})
        .addClass('sa-resize');


    // I am moving the eventually render feature into viewers.
    this.Drawing = false;
    this.RenderPending = false;
    // TODO: Get rid of this viewport stuff
    var viewport = [0,0,100,100];

    this.HistoryFlag = false;

    // Interaction state:
    // What to do for mouse move or mouse up.
    this.InteractionState = INTERACTION_NONE;
    // External callbacks
    this.InteractionListeners = [];
    // TODO: Get rid of this.  Remove bindings instead.
    // This is a hack to turn off interaction.
    // Sometime I need to clean up the events for viewers.
    this.InteractionEnabled = true;

    this.AnimateLast;
    this.AnimateDuration = 0.0;
    this.TranslateTarget = [0.0,0.0];

    this.MainView = new View(this.Div);
    this.MainView.InitializeViewport(viewport);
    this.MainView.OutlineColor = [0,0,0];
    this.MainView.Camera.ZRange = [0,1];
    this.MainView.Camera.ComputeMatrix();

    this.AnnotationLayer = new SAM.AnnotationLayer(this.LayerDiv, 
                                                   this.MainView.Camera);

    if (! MOBILE_DEVICE || MOBILE_DEVICE == "iPad") {
        this.OverViewVisibility = true;
        this.OverViewScale = 0.02; // Experimenting with scroll
	      this.OverViewport = [viewport[0]+viewport[2]*0.8, viewport[3]*0.02,
                             viewport[2]*0.18, viewport[3]*0.18];
        this.OverViewDiv = $('<div>').appendTo(this.Div);
        this.OverView = new View(this.OverViewDiv);
	      this.OverView.InitializeViewport(this.OverViewport);
	      this.OverView.Camera.ZRange = [-1,0];
	      this.OverView.Camera.SetFocalPoint( [13000.0, 11000.0]);
	      this.OverView.Camera.SetHeight(22000.0);
	      this.OverView.Camera.ComputeMatrix();

        // One must be true for the icon to be active (opaque).
        this.RotateIconHover = false;
        // I am not making this part of the InteractionState because
        // I want to make the overview its own widget.
        this.RotateIconDrag = false;

        this.RotateIcon =
            $('<img>')
            .appendTo(this.OverView.CanvasDiv)
            .attr("src", SA.ImagePathUrl+"rotate.png")
            .addClass("sa-view-rotate")
            .mouseenter(function (e) {return self.RollEnter(e);})
            .mouseleave(function (e) {return self.RollLeave(e);})
            .mousedown( function (e) {return self.RollDown(e);})
            .attr('draggable','false')
            .on("dragstart", function() {
                return false;
            });
        // Try to make the overview be on top of the rotate icon
        // It should receive events before the rotate icon.
        this.OverView.CanvasDiv.css({'z-index':'2'});
    }
    this.ZoomTarget = this.MainView.Camera.GetHeight();
    this.RollTarget = this.MainView.Camera.Roll;
    
    this.DoubleClickX = 0;
    this.DoubleClickY = 0;
    

    // For stack correlations.
    this.StackCorrelations = undefined;
    // This is only for drawing correlations.
    this.RecordIndex = 0; // Only used for drawing correlations.

    var self = this;
    var can = this.MainView.CanvasDiv;
    can.on(
        "mousedown.viewer",
			  function (event){
            return self.HandleMouseDown(event);
        });
    can.on(
        "mousemove.viewer",
			  function (event){
            // So key events go the the right viewer.
            this.focus();
            // Firefox does not set which for mouse move events.
            saFirefoxWhich(event);
            return self.HandleMouseMove(event);
        });
    // We need to detect the mouse up even if it happens outside the canvas,
    $(document.body).on(
        "mouseup.viewer",
			  function (event){
            self.HandleMouseUp(event);
            return true;
        });
    can.on(
        "wheel.viewer",
        function(event){
            return self.HandleMouseWheel(event.originalEvent);
        });

    // I am delaying getting event manager out of receiving touch events.
    // It has too many helper functions.
    can.on(
        "touchstart.viewer",
        function(event){
            return self.HandleTouchStart(event.originalEvent);
        });
    can.on(
        "touchmove.viewer",
        function(event){
            return self.HandleTouchMove(event.originalEvent);
        });
    can.on(
        "touchend.viewer",
        function(event){
            self.HandleTouchEnd(event.originalEvent);
            return true;
        });

    // necesary to respond to keyevents.
    this.MainView.CanvasDiv.attr("tabindex","1");
    can.on(
        "keydown.viewer",
			  function (event){
            //alert("keydown");
            return self.HandleKeyDown(event);
        });

    // This did not work for double left click
    // Go back to my original way of handling this.
    //can.addEventListener("dblclick",
		//	                   function (event){self.HandleDoubleClick(event);},
		//	                   false);

    if (this.OverView) {
        var can = this.OverView.CanvasDiv;
        can.on(
            "mousedown.viewer",
            function (e) {
                return self.HandleOverViewMouseDown(e);
            });

        can.on(
            "mouseup.viewer",
			      function (e){
                return self.HandleOverViewMouseUp(e);
            });
        can.on(
            "mousemove.viewer",
			      function (e){
                return self.HandleOverViewMouseMove(e);
            });
        // I cannot get this to capture events.  The feature of resizing
        //    the overview with the mouse wheel is not important anyway.
        //can[0].addEventListener(
        //    function (e){return self.HandleOverViewMouseWheel(e);},
        //    "wheel",
			  //    false);
    }

    this.CopyrightWrapper = $('<div>')
        .appendTo(this.MainView.CanvasDiv)
        .addClass("sa-view-copyright");
}

// Try to remove all global references to this viewer.
Viewer.prototype.Delete = function () {
    this.Div.remove();
    // Remove circular references too?
    // This will probably affect all viewers.
    $(document.body).off('mouseup.viewer');
    this.MainView.Delete();
    if (this.OverView) {
        this.OverView.Delete();
        delete this.OverView;
    }
    delete this.MainView;
    delete this.Parent;
    delete this.Div;
    delete this.InteractionListeners;
    delete this.RotateIcon;
    delete this.StackCorrelations;
    delete this.CopyrightWrapper;
}

Viewer.prototype.GetAnnotationLayer = function () {
    return this.AnnotationLayer;
}

// Abstracting saViewer  for viewer and dualViewWidget.
// Save viewer state in a note.
Viewer.prototype.Record = function (note, viewIdx) {
    viewIdx = viewIdx || 0;
    note.ViewerRecords[viewIdx].CopyViewer(this);
}

// TODO: MAke the annotation layer optional.
// I am moving some of the saViewer code into this viewer object because
// I am trying to abstract the single viewer used for the HTML presentation
// note and the full dual view / stack note.
// TODO: Make an alternative path that does not require a note.
Viewer.prototype.ProcessArguments = function (args) {
    if (args.overview !== undefined) {
        this.SetOverViewVisibility(args.overview);
    }
    if (args.zoomWidget !== undefined) {
        this.SetZoomWidgetVisibility(args.zoomWidget);
    }
    if (args.drawWidget !== undefined) {
        this.SetAnnotationWidgetVisibility(args.drawWidget);
    }
    // The way I handle the viewer edit menu is messy.
    // TODO: Find a more elegant way to add tabs.
    // Maybe the way we handle the anntation tab shouodl be our pattern.
    if (args.menu !== undefined) {
        if ( ! this.Menu) {
            this.Menu = new ViewEditMenu(this, null);
        }
        this.Menu.SetVisibility(args.menu);
    }

    if (args.tileSource) {
        var w = args.tileSource.width;
        var h = args.tileSource.height;
        var cache = new Cache();
        cache.TileSource = args.tileSource;
        // Use the note tmp id as an image id so the viewer can index the
        // cache.
        var note = new Note();
        var image = {levels:     args.tileSource.maxLevel + 1,
                     dimensions: [w,h],
                     bounds: [0,w-1, 0,h-1],
                     _id: note.TempId};
        var record = new ViewerRecord();
        record.Image = image;
        record.OverviewBounds = [0,w-1,0,h-1];
        record.Camera = {FocalPoint: [w/2, h/2],
                         Roll: 0,
                         Height: h};
        note.ViewerRecords.push(record);
        cache.SetImageData(image);
        args.note = note;
    }

    if (args.note) {
        this.saNote = args.note;
        var index = this.saViewerIndex = args.viewerIndex || 0;
        args.note.ViewerRecords[index].Apply(this);
        this.Parent.attr('sa-note-id', args.note.Id || args.note.TempId);
        this.Parent.attr('sa-viewer-index', this.saViewerIndex);
    }
    if (args.hideCopyright != undefined) {
        this.SetCopyrightVisibility( ! args.hideCopyright);
    }
    if (args.interaction !== undefined) {
        this.SetInteractionEnabled(args.interaction);
    }
}

// Which is better calling Note.Apply, or viewer.SetNote?  I think this
// will  win.
Viewer.prototype.SetViewerRecord = function(viewerRecord) {
    viewerRecord.Apply(this);
}
Viewer.prototype.SetNote = function(note, viewIdx) {
    if (! note || viewIdx < 0 || viewIdx >= note.ViewerRecords.length) {
        console.log("Cannot set viewer record of note");
        return;
    }
    this.SetViewerRecord(note.ViewerRecords[viewIdx]);
    this.saNote = note;
    this.saViewerIndex = viewIdx;
}
Viewer.prototype.SetNoteFromId = function(noteId, viewIdx) {
    var self = this;
    var note = GetNoteFromId(noteId);
    if ( ! note) {
        note = new Note();
        var self = this;
        note.LoadViewId(
            noteId,
            function () {
                self.SetNote(note, viewIdx);
            });
        return note;
    }
    this.SetNote(note,viewIdx);
    return note;
}


Viewer.prototype.SetOverViewVisibility = function(visible) {
    this.OverViewVisibility = visible;
    if ( ! this.OverViewDiv) { return;}
    if (visible) {
        this.OverViewDiv.show();
    } else {
        this.OverViewDiv.hide();
    }
}

Viewer.prototype.GetOverViewVisibility = function() {
    return this.OverViewVisibility;
}

Viewer.prototype.Hide = function() {
    this.MainView.CanvasDiv.hide();
    if (this.OverView) {
        this.OverView.CanvasDiv.hide();
    }
}

Viewer.prototype.Show = function() {
    this.MainView.CanvasDiv.show();
    if (this.OverView && this.OverViewVisibility) {
        this.OverView.CanvasDiv.show();
    }
}

// The interaction boolean argument will supress interaction events if false.
Viewer.prototype.EventuallyRender = function(interaction) {
    if (! this.RenderPending) {
        this.RenderPending = true;
        var self = this;
        requestAnimFrame(
            function() {
                self.RenderPending = false;
                self.Draw();
                if (interaction) {
                    // Easiest place to make sure interaction events are triggered.
                    self.TriggerInteraction();
                }
            });
    }
}

// These should be in an overview widget class.
Viewer.prototype.RollEnter = function (e) {
    this.RotateIconHover = true;
    this.RotateIcon.addClass("sa-active");
}
Viewer.prototype.RollLeave = function (e) {
    this.RotateIconHover = false;
    if ( ! this.RotateIconDrag) {
        this.RotateIcon.removeClass("sa-active");
    }
}
Viewer.prototype.RollDown = function (e) {
    if ( ! this.OverView) { return; }
    this.RotateIconDrag = true;
    // Find the center of the overview window.
    var w = this.OverView.CanvasDiv;
    var o = w.offset();
    var cx = o.left + (w.width()/2);
    var cy = o.top + (w.height()/2);
    this.RotateIconX = e.clientX - cx;
    this.RotateIconY = e.clientY - cy;

    return false;
}
Viewer.prototype.RollMove = function (e) {
    if ( ! this.OverView) { return; }
    if ( ! this.RotateIconDrag) { return; }
    if ( e.which != 1) {
        // We must have missed the mouse up event.
        this.RotateIconDrag = false;
        return;
    }
    // Find the center of the overview window.
    var origin = this.MainView.CanvasDiv.offset();
    // center of rotation
    var cx = this.OverViewport[0] + (this.OverViewport[2] / 2);
    var cy = this.OverViewport[1] + (this.OverViewport[3] / 2);

    var x = (e.clientX-origin.left) - cx;
    var y = (e.clientY-origin.top) - cy;
    var c = x*this.RotateIconY - y*this.RotateIconX;
    var r = c / (x*x + y*y);

    this.MainView.Camera.Roll -= r;
    this.UpdateCamera();
    this.EventuallyRender(true);

    this.RotateIconX = x;
    this.RotateIconY = y;

    return false;
}

// TODO: Get rid of viewer::SetViewport.
// onresize callback.  Canvas width and height and the camera need
// to be synchronized with the canvas div.
Viewer.prototype.UpdateSize = function () {
    if ( ! this.MainView) {
        return;
    }

    if (this.MainView.UpdateCanvasSize() ) {
        this.EventuallyRender();
    }

    // I do not know the way the viewport is used to place
    // this overview.  It should be like other widgets
    // and be placed relative to the parent.
    if (this.OverView) {
        var width = this.MainView.GetWidth();
        var height = this.MainView.GetHeight();
        var area = width*height;
        var bounds = this.GetOverViewBounds();
        var aspect = (bounds[1]-bounds[0])/(bounds[3]-bounds[2]);
        // size of overview
        var h = Math.sqrt(area*this.OverViewScale/aspect);
        var w = h*aspect;
        // Limit size
        if (h > height/2) {
            h = height/2;
            var w = h*aspect;
            this.OverViewScale = w*h/area;
        }
        // center of overview
        var radius = Math.sqrt(h*h+w*w)/2;
        // Construct the viewport.  Hack: got rid of viewport[0]
        // TODO: I really need to get rid of the viewport stuff
        this.OverViewport = [width-radius-w/2,
                             radius-h/2,
                             w, h];

        this.OverView.SetViewport(this.OverViewport);
        this.OverView.Camera.ComputeMatrix();
    }
}


// TODO: Events are a pain because most are handled by parent.
// Time to make the overview a real widget?
Viewer.prototype.RollUp = function (e) {
    this.RotateIconDrag = false;
    if ( ! this.RotateIconHover) {
        this.RotateIcon.addClass("sa-active");
    }

    return false;
}


Viewer.prototype.GetMainCanvas = function() {
    return this.MainView.Canvas;
}

// A way to have a method called every time the camera changes.
// Will be used for synchronizing viewers for stacks.
Viewer.prototype.OnInteraction = function(callback) {
    // How should we remove listners?
    // Global clear for now.
    if ( ! callback) {
        this.InteractionListeners = [];
    } else {
        this.InteractionListeners.push(callback);
    }
}


Viewer.prototype.TriggerInteraction = function() {
    for (var i = 0; i < this.InteractionListeners.length; ++i) {
        callback = this.InteractionListeners[i];
        callback();
    }
}

Viewer.prototype.GetDiv = function() {
    return this.MainView.CanvasDiv;
}

Viewer.prototype.InitializeZoomGui = function() {
    // Put the zoom bottons in a tab.
    this.ZoomTab = new Tab(this.GetDiv(),
                           SA.ImagePathUrl+"mag.png",
                           "zoomTab");
    this.ZoomTab.Div
        .css({'box-sizing': 'border-box',
              'position':'absolute',
              'bottom':'0px',
              'right':'7px'})
        .prop('title', "Zoom scroll");
    this.ZoomTab.Panel
        .addClass("sa-view-zoom-panel");

    // Put the magnification factor inside the magnify glass icon.
    this.ZoomDisplay = $('<div>')
        .appendTo(this.ZoomTab.Div)
        .addClass("sa-view-zoom-text")
        .html("");

    // Place the zoom in / out buttons.
    // Todo: Make the button become more opaque when pressed.
    // Associate with viewer (How???).
    // Place properly (div per viewer?) (viewer.SetViewport also places buttons).
    var self = this;

    this.ZoomDiv = $('<div>')
        .appendTo(this.ZoomTab.Panel)
        .addClass("sa-view-zoom-panel-div");
    this.ZoomInButton = $('<img>')
        .appendTo(this.ZoomDiv)
        .addClass("sa-view-zoom-button sa-zoom-in")
        .attr('type','image')
        .attr('src',SA.ImagePathUrl+"zoomin2.png")
        .click(function(){ self.AnimateZoom(0.5);})
        .attr('draggable','false')
        .on("dragstart", function() {
            return false;});

    this.ZoomOutButton = $('<img>').appendTo(this.ZoomDiv)
        .addClass("sa-view-zoom-button sa-zoom-out")
        .attr('type','image')
        .attr('src',SA.ImagePathUrl+"zoomout2.png")
        .click(function(){self.AnimateZoom(2.0);})
        .attr('draggable','false')
        .on("dragstart", function() {
            return false;});

    this.ZoomInButton.addClass('sa-active');
    this.ZoomOutButton.addClass('sa-active');

}

Viewer.prototype.UpdateZoomGui = function() {
    if ( ! this.ZoomDisplay) { return; }
    var camHeight = this.GetCamera().GetHeight();
    var windowHeight = this.GetViewport()[3];
    // Assume image scanned at 40x
    var zoomValue = 40.0 * windowHeight / camHeight;
    // 2.5 and 1.25 are standard in the geometric series.
    if ( zoomValue < 2) {
        zoomValue = zoomValue.toFixed(2);
    } else if (zoomValue < 4) {
        zoomValue = zoomValue.toFixed(1);
    } else {
        zoomValue = Math.round(zoomValue);
    }
    this.ZoomDisplay.html( 'x' + zoomValue);

    // I am looking for the best place to update this value.
    // Trying to fix a bug: Large scroll when wheel event occurs
    // first.
    this.ZoomTarget = camHeight;
}


Viewer.prototype.SaveImage = function(fileName) {
    this.MainView.Canvas[0].toBlob(function(blob) {saveAs(blob, fileName);}, "image/png");
}


// Cancel the large image request before it finishes.
Viewer.prototype.CancelLargeImage = function() {
    // This will abort the save blob that occurs after rendering.
    ClearFinishedLoadingCallbacks();
    // We also need to stop the request for pending tiles.
    ClearQueue();
     // Incase some of the queued tiles were for normal rendering.
    this.EventuallyRender(false);
}


// Create a virtual viewer to save a very large image.
Viewer.prototype.SaveLargeImage = function(fileName, width, height, stack,
                                           finishedCallback) {
    var self = this;
    var cache = this.GetCache();
    var viewport = [0,0, width, height];
    var cam = this.GetCamera();

    // Clone the main view.
    var view = new View();
    view.InitializeViewport(viewport);
    view.SetCache(cache);
    view.Canvas.attr("width", width);
    view.Canvas.attr("height", height);
    var newCam = view.Camera;

    newCam.SetFocalPoint( cam.FocalPoint );
    newCam.Roll = cam.Roll;
    newCam.Height = cam.GetHeight();
    newCam.Width = cam.GetWidth();
    newCam.ComputeMatrix();

    // Load only the tiles we need.
    var tiles = cache.ChooseTiles(newCam, 0, []);
    for (var i = 0; i < tiles.length; ++i) {
        LoadQueueAddTile(tiles[i]);
    }
    LoadQueueUpdate();

    //this.CancelLargeImage = false;
    AddFinishedLoadingCallback(
        function () {self.SaveLargeImage2(view, fileName,
                                          width, height, stack,
                                          finishedCallback);}
    );
}


Viewer.prototype.SaveLargeImage2 = function(view, fileName,
                                            width, height, stack,
                                            finishedCallback) {
    var sectionFileName = fileName;
    if (stack) {
        var note = SA.DualDisplay.GetNote();
        var idx = fileName.indexOf('.');
        if (idx < 0) {
            sectionFileName = fileName + ZERO_PAD(note.StartIndex, 4) + ".png";
        } else {
            sectionFileName = fileName.substring(0, idx) +
                ZERO_PAD(note.StartIndex, 4) +
                fileName.substring(idx, fileName.length);
        }
    }
    console.log(sectionFileName + " " + SA.LoadQueue.length + " " + SA.LoadingCount);

    if ( ! view.DrawTiles() ) {
        console.log("Sanity check failed. Not all tiles were available.");
    }
    this.MainView.DrawShapes();
    this.AnnotationLayer.Draw(view);

    view.Canvas[0].toBlob(function(blob) {saveAs(blob, sectionFileName);}, "image/png");
    if (stack) {
        var note = SA.DualDisplay.GetNote();
        if (note.StartIndex < note.ViewerRecords.length-1) {
            SA.DualDisplay.NavigationWidget.NextNote();
            var self = this;
            setTimeout(function () {
                self.SaveLargeImage(fileName, width, height, stack,
                                    finishedCallback);}, 1000);
            return;
        }
    }

    finishedCallback();
}

// This method waits until all tiles are loaded before saving.
var SAVE_FINISH_CALLBACK;
Viewer.prototype.EventuallySaveImage = function(fileName, finishedCallback) {
    var self = this;
    AddFinishedLoadingCallback(
        function () {
            self.SaveImage(fileName);
            if (finishedCallback) {
                finishedCallback();
            }
        }
    );
    this.EventuallyRender(false);
}


// Not used anymore.  Incorpoarated in SaveLargeImage
// delete these.
// Save a bunch of stack images ----
Viewer.prototype.SaveStackImages = function(fileNameRoot) {
    var self = this;
    AddFinishedLoadingCallback(
        function () {
            self.SaveStackImage(fileNameRoot);
        }
    );
    this.EventuallyRender(false);
}

Viewer.prototype.SaveStackImage = function(fileNameRoot) {
    var self = this;
    var note = SA.DualDisplay.GetNote();
    var fileName = fileNameRoot + ZERO_PAD(note.StartIndex, 4);
    this.SaveImage(fileName);
    if (note.StartIndex < note.ViewerRecords.length-1) {
        SA.DualDisplay.NavigationWidget.NextNote();
        AddFinishedLoadingCallback(
            function () {
                self.SaveStackImage(fileNameRoot);
            }
        );
        this.EventuallyRender(false);
    }
}
//-----

Viewer.prototype.SetOverViewBounds = function(bounds) {
    this.OverViewBounds = bounds;
    if (this.OverView) {
        // With the rotating overview, the overview camera
        // never changes. Maybe this should be set in
        // "UpdateCamera".
        this.OverView.Camera.SetHeight(bounds[3]-bounds[2]);
        this.OverView.Camera.SetFocalPoint( [0.5*(bounds[0]+bounds[1]),
                                             0.5*(bounds[2]+bounds[3])]);
        this.OverView.Camera.ComputeMatrix();
    }
}

Viewer.prototype.GetOverViewBounds = function() {
    if (this.OverViewBounds) {
        return this.OverViewBounds;
    }
    var cache = this.GetCache();
    if (cache && cache.Image) {
        if (cache.Image.bounds) {
            return cache.Image.bounds;
        }
        if (cache.Image.dimensions) {
            var dims = cache.Image.dimensions;
            return [0, dims[0], 0, dims[1]];
        }
    }
    // Depreciated code.
    if (this.OverView) {
        var cam = this.OverView.Camera;
        var halfHeight = cam.GetHeight() / 2;
        var halfWidth = cam.GetWidth() / 2;
        this.OverViewBounds = [cam.FocalPoint[0] - halfWidth,
                               cam.FocalPoint[0] + halfWidth,
                               cam.FocalPoint[1] - halfHeight,
                               cam.FocalPoint[1] + halfHeight];
        return this.OverViewBounds;
    }
    // This method is called once too soon.  There is no image, and mobile devices have no overview.
    return [0,10000,0,10000];
}


Viewer.prototype.SetSection = function(section) {
    if (section == null) {
        return;
    }
    this.MainView.Section = section;
    if (this.OverView) {
        this.OverView.Section = section;
    }
    this.EventuallyRender(true);
}


// Change the source / cache after a viewer has been created.
Viewer.prototype.SetCache = function(cache) {
    if (cache && cache.Image) {
        if (cache.Image.bounds) {
            this.SetOverViewBounds(cache.Image.bounds);
        }

        if (cache.Image.copyright == undefined) {
            cache.Image.copyright = "Copyright 2016. All Rights Reserved.";
        }
        this.CopyrightWrapper
            .html(cache.Image.copyright);
    }

    this.MainView.SetCache(cache);
    if (this.OverView) {
        this.OverView.SetCache(cache);
        if (cache) {
            var bds = cache.GetBounds();
            if (bds) {
                this.OverView.Camera.SetFocalPoint( [(bds[0] + bds[1]) / 2,
                                                     (bds[2] + bds[3]) / 2]);
                var height = (bds[3]-bds[2]);
                // See if the view is constrained by the width.
                var height2 = (bds[1]-bds[0]) * this.OverView.Viewport[3] / this.OverView.Viewport[2];
                if (height2 > height) {
                    height = height2;
                }
                this.OverView.Camera.SetHeight(height);
                this.OverView.Camera.ComputeMatrix();
            }
        }
    }
    // Change the overview to fit the new image dimensions.
    // TODO: Get rid of this hack.
    $(window).trigger('resize');
}

Viewer.prototype.GetCache = function() {
    return this.MainView.GetCache();
}

// ORIGIN SEEMS TO BE BOTTOM LEFT !!!
// I intend this method to get called when the window resizes.
// TODO: Redo all this overview viewport junk.
// viewport: [left, top, width, height]
// When I remove this function, move the logic to UpdateSize().
Viewer.prototype.SetViewport = function(viewport) {

    // TODO: Get rid of this positioning hack.
    // Caller should be positioning the parent.
    // The whole "viewport" concept needs to be eliminated.
    this.MainView.SetViewport(viewport, this.Parent);
    this.MainView.Camera.ComputeMatrix();

    // I do not know the way the viewport is used to place
    // this overview.  It should be like other widgets
    // and be placed relative to the parent.
    if (this.OverView) {
        var area = viewport[2]*viewport[3];
        var bounds = this.GetOverViewBounds();
        var aspect = (bounds[1]-bounds[0])/(bounds[3]-bounds[2]);
        // size of overview
        var h = Math.sqrt(area*this.OverViewScale/aspect);
        var w = h*aspect;
        // Limit size
        if (h > viewport[3]/2) {
            h = viewport[3]/2;
            var w = h*aspect;
            this.OverViewScale = w*h/area;
        }
        // center of overview
        var radius = Math.sqrt(h*h+w*w)/2;
        // Construct the viewport.  Hack: got rid of viewport[0]
        // TODO: I really need to get rid of the viewport stuff
        this.OverViewport = [viewport[2]-radius-w/2,
                             viewport[1]+radius-h/2,
                             w, h];

        this.OverView.SetViewport(this.OverViewport);
        this.OverView.Camera.ComputeMatrix();
    }
}

Viewer.prototype.GetViewport = function() {
    return this.MainView.Viewport;
}

// To fix a bug in the perk and elmer uploader.
Viewer.prototype.ToggleMirror = function() {
    this.MainView.Camera.Mirror = ! this.MainView.Camera.Mirror;
    if (this.OverView) {
        this.OverView.Camera.Mirror = ! this.OverView.Camera.Mirror;
    }
}

// Same as set camera but use animation
Viewer.prototype.AnimateCamera = function(center, rotation, height) {

    this.ZoomTarget = height;
    // Compute traslate target to keep position in the same place.
    this.TranslateTarget[0] = center[0];
    this.TranslateTarget[1] = center[1];
    this.RollTarget = rotation;

    this.AnimateLast = new Date().getTime();
    this.AnimateDuration = 200.0; // hard code 200 milliseconds
    this.EventuallyRender(true);
}

// This sets the overview camera from the main view camera.
// The user can change the mainview camera and then call this method.
Viewer.prototype.UpdateCamera = function() {

    var cam = this.MainView.Camera;
    this.ZoomTarget = cam.Height;

    this.TranslateTarget[0] = cam.FocalPoint[0];
    this.TranslateTarget[1] = cam.FocalPoint[1];
    this.RollTarget = cam.Roll;
    if (this.OverView) {
        //this.OverView.Camera.Roll = cam.Roll;
        //this.OverView.Camera.ComputeMatrix();
        this.OverView.CanvasDiv.css({'transform':'rotate('+cam.Roll+'rad'});
        this.OverView.Camera.Roll = 0;
        this.OverView.Camera.ComputeMatrix();
    }

    this.MainView.Camera.ComputeMatrix();
    this.UpdateZoomGui();
}

// This is used to set the default camera so the complexities
// of the target and overview are hidden.
Viewer.prototype.SetCamera = function(center, rotation, height) {
    this.MainView.Camera.SetHeight(height);
    this.MainView.Camera.SetFocalPoint( [center[0], center[1]]);
    this.MainView.Camera.Roll = rotation * 3.14159265359 / 180.0;

    this.UpdateCamera();
    this.EventuallyRender(true);
}

Viewer.prototype.GetCamera = function() {
    return this.MainView.Camera;
}

// I could merge zoom methods if position defaulted to focal point.
Viewer.prototype.AnimateZoomTo = function(factor, position) {
    if (this.AnimateDuration > 0.0) {
        // Odd effect with multiple fast zoom clicks.  Center shifted.
        return;
    }

    SA.StackCursorFlag = false;

    this.ZoomTarget = this.MainView.Camera.GetHeight() * factor;
    if (this.ZoomTarget < 0.9 / (1 << 5)) {
        this.ZoomTarget = 0.9 / (1 << 5);
    }

    // Lets restrict discrete zoom values to be standard values.
    var windowHeight = this.GetViewport()[3];
    var tmp = Math.round(Math.log(32.0 * windowHeight / this.ZoomTarget) /
                         Math.log(2));
    this.ZoomTarget = 32.0 * windowHeight / Math.pow(2,tmp);

    factor = this.ZoomTarget / this.MainView.Camera.GetHeight(); // Actual factor after limit.

    // Compute translate target to keep position in the same place.
    this.TranslateTarget[0] = position[0]
        - factor * (position[0] - this.MainView.Camera.FocalPoint[0]);
    this.TranslateTarget[1] = position[1]
        - factor * (position[1] - this.MainView.Camera.FocalPoint[1]);

    this.RollTarget = this.MainView.Camera.Roll;

    this.AnimateLast = new Date().getTime();
    this.AnimateDuration = 200.0; // hard code 200 milliseconds
    this.EventuallyRender(true);
}

Viewer.prototype.AnimateZoom = function(factor) {
    // I cannot get the canvas from processing this event too.
    // Issue with double click. Hack to stop double click from firing.
    this.MouseUpTime -= 1000.0;

    if (this.AnimateDuration > 0.0) {
        return;
    }

    var focalPoint = this.GetCamera().GetFocalPoint();
    this.AnimateZoomTo(factor, focalPoint);
}

Viewer.prototype.AnimateTranslate = function(dx, dy) {
    this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0] + dx;
    this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1] + dy;

    this.ZoomTarget = this.MainView.Camera.GetHeight();
    this.RollTarget = this.MainView.Camera.Roll;

    this.AnimateLast = new Date().getTime();
    this.AnimateDuration = 200.0; // hard code 200 milliseconds
    this.EventuallyRender(true);
}

Viewer.prototype.AnimateRoll = function(dRoll) {
    dRoll *= Math.PI / 180.0;
    this.RollTarget = this.MainView.Camera.Roll + dRoll;

    this.ZoomTarget = this.MainView.Camera.GetHeight();
    this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0];
    this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1];

    this.AnimateLast = new Date().getTime();
    this.AnimateDuration = 200.0; // hard code 200 milliseconds
    this.EventuallyRender(true);
}

Viewer.prototype.AnimateTransform = function(dx, dy, dRoll) {
    this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0] + dx;
    this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1] + dy;

    this.RollTarget = this.MainView.Camera.Roll + dRoll;

    this.ZoomTarget = this.MainView.Camera.GetHeight();

    this.AnimateLast = new Date().getTime();
    this.AnimateDuration = 200.0; // hard code 200 milliseconds
    this.EventuallyRender(true);
}

Viewer.prototype.DegToRad = function(degrees) {
    return degrees * Math.PI / 180;
}

Viewer.prototype.Draw = function() {
    // I do not think this is actaully necessary.
    // I was worried about threads, but javascript does not work that way.
    if (this.Drawing) { return; }
    this.Drawing = true;

    if (GL) {
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    }

    // This just changes the camera based on the current time.
    this.Animate();

    //console.time("ViewerDraw");

    // connectome
    if ( ! this.MainView || ! this.MainView.Section) {
        return;
    }

    this.ConstrainCamera();
    // Should the camera have the viewport in them?
    // The do not currently hav a viewport.

    // Rendering text uses blending / transparency.
    if (GL) {
        GL.disable(GL.BLEND);
        GL.enable(GL.DEPTH_TEST);
    }

    if ( this.AnnotationLayer) {
        this.AnnotationLayer.Clear();
    }

    // If we are still waiting for tiles to load, schedule another render.
    // This works fine, but results in many renders while waiting.
    // TODO: Consider having the tile load callback scheduling the next render.
    if ( ! this.MainView.DrawTiles() ) {
        this.EventuallyRender();
    }

    // This is only necessary for webgl, Canvas2d just uses a border.
    this.MainView.DrawOutline(false);
    if (this.OverView) {
        this.OverView.DrawTiles();
        this.OverView.DrawOutline(true);
    }

    // This is not used anymore
    this.MainView.DrawShapes();
    this.AnnotationLayer.Draw();

    // Draw a rectangle in the overview representing the camera's view.
    if (this.OverView) {
        this.MainView.Camera.Draw(this.OverView);
        if (this.HistoryFlag) {
            this.OverView.DrawHistory(this.MainView.Viewport[3]);
        }
    }

    var cache = this.GetCache();
    if (cache != undefined) {
        var copyright = cache.Image.copyright;
        //this.MainView.DrawCopyright(copyright);
    }

    // TODO: Drawing correlations should not be embedded in a single
    // viewer. Maybe dualViewWidget or a new stack object should handle it.

    // I am using shift for stack interaction.
    // Turn on the focal point when shift is pressed.
    if (SA.StackCursorFlag && SA.Edit) {
        this.MainView.DrawFocalPoint();
        if (this.StackCorrelations) {
            this.MainView.DrawCorrelations(this.StackCorrelations, this.RecordIndex);
        }
    }

    // Here to trigger SA.FinishedLoadingCallbacks
    LoadQueueUpdate();
    //console.timeEnd("ViewerDraw");
    this.Drawing = false;
}

// Makes the viewer clean to setup a new slide...
Viewer.prototype.Reset = function() {
    this.SetCache(null);
    if (this.AnnotationLayer) {
        this.AnnotationLayer.Reset();
    }
    this.MainView.ShapeList = [];
}

// A list of shapes to render in the viewer
Viewer.prototype.AddShape = function(shape) {
    this.MainView.AddShape(shape);
}

Viewer.prototype.Animate = function() {
    if (this.AnimateDuration <= 0.0) {
        return;
    }
    var timeNow = new Date().getTime();
    if (timeNow >= (this.AnimateLast + this.AnimateDuration)) {
        this.AnimateDuration = 0;
        // We have past the target. Just set the target values.
        this.MainView.Camera.SetHeight(this.ZoomTarget);
        this.MainView.Camera.Roll = this.RollTarget;
        if (this.OverView) {
            //this.OverView.Camera.Roll = this.RollTarget;
            var roll = this.RollTarget;
            this.OverView.CanvasDiv.css({'transform':'rotate('+roll+'rad'});
            this.OverView.Camera.Roll = 0;
            this.OverView.Camera.ComputeMatrix();
        }
        this.MainView.Camera.SetFocalPoint( [this.TranslateTarget[0],
                                             this.TranslateTarget[1]]);
        this.UpdateZoomGui();
        // Save the state when the animation is finished.
        if (RECORDER_WIDGET) {
            RECORDER_WIDGET.RecordState();
        }
    } else {
        // Interpolate
        var currentHeight = this.MainView.Camera.GetHeight();
        var currentCenter = this.MainView.Camera.GetFocalPoint();
        var currentRoll   = this.MainView.Camera.Roll;
        this.MainView.Camera.SetHeight(
            currentHeight + (this.ZoomTarget-currentHeight)
                *(timeNow-this.AnimateLast)/this.AnimateDuration);
        this.MainView.Camera.Roll
            = currentRoll + (this.RollTarget-currentRoll)
            *(timeNow-this.AnimateLast)/this.AnimateDuration;
        if (this.OverView) {
            //this.OverView.Camera.Roll = this.MainView.Camera.Roll;
            var roll = this.MainView.Camera.Roll;
            this.OverView.CanvasDiv.css({'transform':'rotate('+roll+'rad'});
            this.OverView.Camera.Roll = 0;
            this.OverView.Camera.ComputeMatrix();
        }
        this.MainView.Camera.SetFocalPoint(
            [currentCenter[0] + (this.TranslateTarget[0]-currentCenter[0])
                *(timeNow-this.AnimateLast)/this.AnimateDuration,
             currentCenter[1] + (this.TranslateTarget[1]-currentCenter[1])
                *(timeNow-this.AnimateLast)/this.AnimateDuration]);
        this.AnimateDuration -= (timeNow-this.AnimateLast);
        // We are not finished yet.
        // Schedule another render
        this.EventuallyRender(true);
    }
    this.MainView.Camera.ComputeMatrix();
    if (this.OverView) {
        this.OverView.Camera.ComputeMatrix();
    }
    this.AnimateLast = timeNow;
    // Synchronize cameras is necessary
}

Viewer.prototype.OverViewPlaceCamera = function(x, y) {
    if ( ! this.OverView) {
        return;
    }
    // Compute focal point from inverse overview camera.
    x = x/this.OverView.Viewport[2];
    y = y/this.OverView.Viewport[3];
    x = (x*2.0 - 1.0)*this.OverView.Camera.Matrix[15];
    y = (1.0 - y*2.0)*this.OverView.Camera.Matrix[15];
    var m = this.OverView.Camera.Matrix;
    var det = m[0]*m[5] - m[1]*m[4];
    var xNew = (x*m[5]-y*m[4]+m[4]*m[13]-m[5]*m[12]) / det;
    var yNew = (y*m[0]-x*m[1]-m[0]*m[13]+m[1]*m[12]) / det;

    // Animate to get rid of jerky panning (overview to low resolution).
    this.TranslateTarget[0] = xNew;
    this.TranslateTarget[1] = yNew;
    this.AnimateLast = new Date().getTime();
    this.AnimateDuration = 100.0;
    this.EventuallyRender(true);
}

Viewer.prototype.SetInteractionEnabled = function(enabled) {
    this.InteractionEnabled = enabled;
}
Viewer.prototype.EnableInteraction = function() {
    this.InteractionEnabled = true;
}
Viewer.prototype.DisableInteraction = function() {
    this.InteractionEnabled = false;
}

// Used to be in EventManager. 
// TODO: Evaluate and cleanup.
Viewer.prototype.RecordMouseDown = function(event) {
    // Evaluate where LastMouseX / Y are used.
    this.LastMouseX = this.MouseX || 0;
    this.LastMouseY = this.MouseY || 0;
    this.LastMouseTime = this.MouseTime || 0;
    this.SetMousePositionFromEvent(event);

    // TODO:  Formalize a call back to make GUI disappear when
    // navigation starts.  I think I did this already but have not
    // converted this code yet.
    // Get rid of the favorites and the link divs if they are visible
    if ( SA.LinkDiv && SA.LinkDiv.is(':visible')) {
	      SA.LinkDiv.fadeOut();
    }
    if (typeof FAVORITES_WIDGET !== 'undefined' &&
	      FAVORITES_WIDGET.hidden == false) {
	      FAVORITES_WIDGET.ShowHideFavorites();
    }

    var date = new Date();
    var dTime = date.getTime() - this.MouseUpTime;
    if (dTime < 200.0) { // 200 milliseconds
        this.DoubleClick = true;
    }

    //this.TriggerStartInteraction();
}
// Used to be in EventManager. 
// TODO: Evaluate and cleanup.
Viewer.prototype.SetMousePositionFromEvent = function(event) {
    if (event.offsetX && event.offsetY) {
        this.MouseX = event.offsetX;
        this.MouseY = event.offsetY;
        this.MouseTime = (new Date()).getTime();
    } else if (event.layerX && event.layerY) {
        this.MouseX = event.layerX;
        this.MouseY = event.layerY;
        this.MouseTime = (new Date()).getTime();
        event.offsetX = event.layerX;
        event.offsetY = event.layerY;
    }
}
Viewer.prototype.RecordMouseMove = function(event) {
    this.LastMouseX = this.MouseX;
    this.LastMouseY = this.MouseY;
    this.LastMouseTime = this.MouseTime;
    this.SetMousePositionFromEvent(event);
    this.MouseDeltaX = this.MouseX - this.LastMouseX;
    this.MouseDeltaY = this.MouseY - this.LastMouseY;
    this.MouseDeltaTime = this.MouseTime - this.LastMouseTime;
    return this.MouseDeltaX != 0 || this.MouseDeltaY != 0;
}
Viewer.prototype.RecordMouseUp = function(event) {
    this.SetMousePositionFromEvent(event);
    this.MouseDown = false;

    // Record time so we can detect double click.
    var date = new Date();
    this.MouseUpTime = date.getTime();
    this.DoubleClick = false;
}



/**/
// Save the previous touches and record the new
// touch locations in viewport coordinates.
Viewer.prototype.HandleTouch = function(e, startFlag) {
    var date = new Date();
    var t = date.getTime();
    // I have had trouble on the iPad with 0 delta times.
    // Lets see how it behaves with fewer events.
    // It was a bug in iPad4 Javascript.
    // This throttle is not necessary.
    if (t-this.Time < 20 && ! startFlag) { return false; }

    this.LastTime = this.Time;
    this.Time = t;

    if (!e) {
        var e = event;
    }

    // Still used on mobile devices?
    var viewport = this.GetViewport();
    this.LastTouches = this.Touches;
    var can = this.Canvas;
    this.Touches = [];
    for (var i = 0; i < e.targetTouches.length; ++i) {
        var offset = this.MainView.Canvas.offset();
        var x = e.targetTouches[i].pageX - offset.left;
        var y = e.targetTouches[i].pageY - offset.top;
        this.Touches.push([x,y]);
    }

    this.LastMouseX = this.MouseX;
    this.LastMouseY = this.MouseY;

    // Compute the touch average.
    var numTouches = this.Touches.length;
    this.MouseX = this.MouseY = 0.0;
    for (var i = 0; i < numTouches; ++i) {
        this.MouseX += this.Touches[i][0];
        this.MouseY += this.Touches[i][1];
    }
    this.MouseX = this.MouseX / numTouches;
    this.MouseY = this.MouseY / numTouches;

    // Hack because we are moving away from using the event manager
    // Mouse interaction are already independant...
    this.offsetX = this.MouseX;
    this.offsetY = this.MouseY;

    return true;
}

Viewer.prototype.HandleTouchStart = function(event) {
    if ( ! this.InteractionEnabled) { return true; }

    // Stuff from event manager
    this.HandleTouch(event, true);
    if (this.StartTouchTime == 0) {
        this.StartTouchTime = this.Time;
    }

    SA.TriggerStartInteraction();

    this.MomentumX = 0.0;
    this.MomentumY = 0.0;
    this.MomentumRoll = 0.0;
    this.MomentumScale = 0.0;
    if (this.MomentumTimerId) {
        window.cancelAnimationFrame(this.MomentumTimerId)
        this.MomentumTimerId = 0;
    }

    // Four finger grab resets the view.
    if ( this.Touches.length >= 4) {
        var cam = this.GetCamera();
        var bds = this.MainView.Section.GetBounds();
        cam.SetFocalPoint( [(bds[0]+bds[1])*0.5, (bds[2]+bds[3])*0.5]);
        cam.Roll = 0.0;
        cam.SetHeight(bds[3]-bds[2]);
        cam.ComputeMatrix();
        this.EventuallyRender();
        // Return value hides navigation widget
        return true;
    }

    // See if any widget became active.
    /*
    if (this.AnnotationLayer && this.AnnotationLayer.GetVisibility()) {
        // TODO:
        // I do not like storing these ivars in this object.
        // I think the widgets rely on them being in the layer.
        this.MouseX = event.Touches[touchIdx][0];
        this.MouseY = event.Touches[touchIdx][1];
        this.MouseWorld = this.ComputeMouseWorld(event);
        return this.AnnotationLayer.HandleTouchStart(event,viewer);
    }
    */
    return false;
}


Viewer.prototype.HandleTouchMove = function(e) {
    // Put a throttle on events
    if ( ! this.HandleTouch(e, false)) { return; }

    if (SA.DualDisplay.NavigationWidget && 
        SA.DualDisplay.NavigationWidget.Visibility) {
        // No slide interaction with the interface up.
        // I had bad interaction with events going to browser.
        SA.DualDisplay.NavigationWidget.ToggleVisibility();
    }

    if (typeof(MOBILE_ANNOTATION_WIDGET) != "undefined" && 
               MOBILE_ANNOTATION_WIDGET.Visibility) {
        // No slide interaction with the interface up.
        // I had bad interaction with events going to browser.
        MOBILE_ANNOTATION_WIDGET.ToggleVisibility();
    }

    if (this.Touches.length == 1) {
        this.HandleTouchPan(this);
        return;
    }
    if (this.Touches.length == 2) {
        this.HandleTouchPinch(this);
        return
    }
    if (this.Touches.length == 3) {
        this.HandleTouchRotate(this);
        return
    }
}


// Only one touch
Viewer.prototype.HandleTouchPan = function(event) {
    if ( ! this.InteractionEnabled) { return true; }
    if (this.Touches.length != 1 || this.LastTouches.length != 1) {
        // Sanity check.
        return;
    }

    // Forward the events to the widget if one is active.
    /*
    if (this.AnnotationLayer && this.AnnotationLayer.GetVisibility() &&
        ! this.AnnotationLayer.HandleTouchPan(event, this)) {
        return false;
    }
    */

    // I see an odd intermittent camera matrix problem
    // on the iPad that looks like a thread safety issue.
    if (this.MomentumTimerId) {
        window.cancelAnimationFrame(this.MomentumTimerId)
        this.MomentumTimerId = 0;
    }

    // Convert to world by inverting the camera matrix.
    // I could simplify and just process the vector.
    w0 = this.ConvertPointViewerToWorld(this.LastMouseX, this.LastMouseY);
    w1 = this.ConvertPointViewerToWorld(    this.MouseX,     this.MouseY);

    // This is the new focal point.
    var dx = w1[0] - w0[0];
    var dy = w1[1] - w0[1];
    var dt = event.Time - this.LastTime;

    // Remember the last motion to implement momentum.
    var momentumX = dx/dt;
    var momentumY = dy/dt;

    // Integrate momentum over a time period to avoid a fast event
    // dominating behavior.
    var k = Math.min(this.Time - this.LastTime, 250) / 250;
    this.MomentumX += (momentumX-this.MomentumX)*k;
    this.MomentumY += (momentumY-this.MomentumY)*k;
    this.MomentumRoll = 0.0;
    this.MomentumScale = 0.0;

    var cam = this.GetCamera();
    cam.Translate( -dx, -dy, 0);
    cam.ComputeMatrix();
    this.EventuallyRender(true);
}

Viewer.prototype.HandleTouchRotate = function(event) {
    if ( ! this.InteractionEnabled) { return true; }
    var numTouches = this.Touches.length;
    if (this.LastTouches.length != numTouches || numTouches  != 3) {
        // Sanity check.
        return;
    }

    // I see an odd intermittent camera matrix problem
    // on the iPad that looks like a thread safety issue.
    if (this.MomentumTimerId) {
        window.cancelAnimationFrame(this.MomentumTimerId)
        this.MomentumTimerId = 0;
    }

    w0 = this.ConvertPointViewerToWorld(this.LastMouseX, this.LastMouseY);
    w1 = this.ConvertPointViewerToWorld(    this.MouseX,     this.MouseY);
    var dt = event.Time - this.LastTime;

    // Compute rotation.
    // Consider weighting rotation by vector length to avoid over contribution of short vectors.
    // We could also take the maximum.
    var x;
    var y;
    var a = 0;
    for (var i = 0; i < numTouches; ++i) {
        x = this.LastTouches[i][0] - this.LastMouseX;
        y = this.LastTouches[i][1] - this.LastMouseY;
        var a1  = Math.atan2(y,x);
        x = this.Touches[i][0] - this.MouseX;
        y = this.Touches[i][1] - this.MouseY;
        a1 = a1 - Math.atan2(y,x);
        if (a1 > Math.PI) { a1 = a1 - (2*Math.PI); }
        if (a1 < -Math.PI) { a1 = a1 + (2*Math.PI); }
        a += a1;
    }
    a = a / numTouches;

    // rotation and scale are around the mid point .....
    // we need to compute focal point height and roll (not just a matrix).
    // Focal point is the only difficult item.
    var cam = this.GetCamera();
    w0[0] = cam.FocalPoint[0] - w1[0];
    w0[1] = cam.FocalPoint[1] - w1[1];
    var c = Math.cos(a);
    var s = Math.sin(a);
    // This is the new focal point.
    x = w1[0] + (w0[0]*c - w0[1]*s);
    y = w1[1] + (w0[0]*s + w0[1]*c);

    // Remember the last motion to implement momentum.
    var momentumRoll = a/dt;

    this.MomentumX = 0.0;
    this.MomentumY = 0.0;
    this.MomentumRoll = (this.MomentumRoll + momentumRoll) * 0.5;
    this.MomentumScale = 0.0;

    cam.Roll = cam.Roll - a;
    cam.ComputeMatrix();
    if (this.OverView) {
        var cam2 = this.OverView.Camera;
        cam2.Roll = cam.Roll;
        cam2.ComputeMatrix();
    }
    this.EventuallyRender(true);
}

Viewer.prototype.HandleTouchPinch = function(event) {
    if ( ! this.InteractionEnabled) { return true; }
    var numTouches = this.Touches.length;
    if (this.LastTouches.length != numTouches || numTouches  != 2) {
        // Sanity check.
        return;
    }

    // I see an odd intermittent camera matrix problem
    // on the iPad that looks like a thread safety issue.
    if (this.MomentumTimerId) {
        window.cancelAnimationFrame(this.MomentumTimerId)
        this.MomentumTimerId = 0;
    }

    w0 = this.ConvertPointViewerToWorld(this.LastMouseX, this.LastMouseY);
    w1 = this.ConvertPointViewerToWorld(    this.MouseX,     this.MouseY);
    var dt = event.Time - this.LastTime;
    // iPad / iPhone must have low precision time
    if (dt == 0) {
        return;
    }

    // Compute scale.
    // Consider weighting rotation by vector length to avoid over contribution of short vectors.
    // We could also take max.
    // This should rarely be an issue and could only happen with 3 or more touches.
    var scale = 1;
    var s0 = 0;
    var s1 = 0;
    for (var i = 0; i < numTouches; ++i) {
        x = this.LastTouches[i][0] - this.LastMouseX;
        y = this.LastTouches[i][1] - this.LastMouseY;
        s0 += Math.sqrt(x*x + y*y);
        x = this.Touches[i][0] - this.MouseX;
        y = this.Touches[i][1] - this.MouseY;
        s1 += Math.sqrt(x*x + y*y);
    }
    // This should not happen, but I am having trouble with NaN camera parameters.
    if (s0 < 2 || s1 < 2) {
         return;
    }
    scale = s1/ s0;

    // Forward the events to the widget if one is active.
    //if (this.AnnotationLayer && this.AnnotationLayer.GetVisibility() &&
    //    ! this.AnnotationLayer.HandleTouchPinch(event, this)) {
    //    return false;
    //}

    // scale is around the mid point .....
    // we need to compute focal point height and roll (not just a matrix).
    // Focal point is the only difficult item.
    var cam = this.GetCamera();
    w0[0] = cam.FocalPoint[0] - w1[0];
    w0[1] = cam.FocalPoint[1] - w1[1];
    // This is the new focal point.
    var x = w1[0] + w0[0] / scale;
    var y = w1[1] + w0[1] / scale;

    // Remember the last motion to implement momentum.
    var momentumScale = (scale-1)/dt;

    this.MomentumX = 0.0;
    this.MomentumY = 0.0;
    this.MomentumRoll = 0.0;
    this.MomentumScale = (this.MomentumScale + momentumScale) * 0.5;

    cam.FocalPoint[0] = x;
    cam.FocalPoint[1] = y;
    cam.SetHeight(cam.GetHeight() / scale);
    cam.ComputeMatrix();
    this.EventuallyRender(true);
}

Viewer.prototype.HandleTouchEnd = function(event) {
    if ( ! this.InteractionEnabled) { return true; }

    // Code from a conflict
    var t = new Date().getTime();
    this.LastTime = this.Time;
    this.Time = t;

    var k = Math.min(this.Time - this.LastTime, 250) / 250;

    this.MomentumX = this.MomentumX*(1-k);
    this.MomentumY = this.MomentumY*(1-k);
    this.MomentumRoll = this.MomentumRoll*(1-k);
    this.MomentumScale = this.MomentumScale*(1-k);

    t = t - this.StartTouchTime;
    if (event.targetTouches.length == 0 && MOBILE_DEVICE) {
        this.StartTouchTime = 0;
        if (t < 90) {
            // We should not have a navigation widget on mobile
            // devices. (maybe iPad?).
            if (SA.DualDisplay && SA.DualDisplay.NavigationWidget) {
                SA.DualDisplay.NavigationWidget.ToggleVisibility();
            }
            if (typeof(MOBILE_ANNOTATION_WIDGET) != "undefined") {
                MOBILE_ANNOTATION_WIDGET.ToggleVisibility();
            }
            return;
        }
        if (this.ActiveWidget != null) {
            this.ActiveWidget.HandleTouchEnd(event);
            return;
        }
        //this.UpdateZoomGui();
        this.HandleMomentum();
    }
    // end conflict


    // Forward the events to the widget if one is active.
    //if (this.AnnotationLayer && 
    //    this.AnnotationLayer.GetVisibility() &&
    //    ! this.AnnotationLayer.HandleTouchEnd(event, this)) {
    //    return false;
    //}

    //this.UpdateZoomGui();
    this.HandleMomentum(event);
}

Viewer.prototype.HandleMomentum = function() {
    // I see an odd intermittent camera matrix problem
    // on the iPad that looks like a thread safety issue.
    if (this.MomentumTimerId) {
        window.cancelAnimationFrame(this.MomentumTimerId)
        this.MomentumTimerId = 0;
    }

    var t = new Date().getTime();
    if (t - this.LastTime < 50) {
        var self = this;
        this.MomentumTimerId = requestAnimFrame(function () { self.HandleMomentum();});
        return;
    }

    // Integrate the momentum.
    this.LastTime = this.Time;
    this.Time = t;
    var dt = this.Time - this.LastTime;

    var k = 200.0;
    var decay = Math.exp(-dt/k);
    var integ = (-k * decay + k);

    var cam = this.MainView.Camera;
    cam.Translate(-(this.MomentumX * integ), -(this.MomentumY * integ), 0);
    cam.SetHeight(cam.Height / ((this.MomentumScale * integ) + 1));
    cam.Roll = cam.Roll - (this.MomentumRoll* integ);
    cam.ComputeMatrix();
    if (this.OverView) {
        var cam2 = this.OverView.Camera;
        cam2.Roll = cam.Roll;
        cam2.ComputeMatrix();
    }
    // I think the problem with the ipad is thie asynchronous render.
    // Maybe two renders occur at the same time.
    //this.EventuallyRender();
    draw();

    // Decay the momentum.
    this.MomentumX *= decay;
    this.MomentumY *= decay;
    this.MomentumScale *= decay;
    this.MomentumRoll *= decay;

    if (Math.abs(this.MomentumX) < 0.01 && Math.abs(this.MomentumY) < 0.01 &&
        Math.abs(this.MomentumRoll) < 0.0002 && Math.abs(this.MomentumScale) < 0.00005) {
        // Change is small. Stop the motion.
        this.MomentumTimerId = 0;
        if (this.InteractionState != INTERACTION_NONE) {
            this.InteractionState = INTERACTION_NONE;
            if (RECORDER_WIDGET) {
                RECORDER_WIDGET.RecordState();
            }
        }
        this.UpdateZoomGui();
    } else {
        var self = this;
        this.MomentumTimerId = requestAnimFrame(function () { self.HandleMomentum();});
    }
}


Viewer.prototype.ConstrainCamera = function () {
    var bounds = this.GetOverViewBounds();
    if ( ! bounds) {
        // Cache has not been set.
        return;
    }
    var spacing = this.MainView.GetLeafSpacing();
    var viewport = this.MainView.GetViewport();
    var cam = this.MainView.Camera;

    var modified = false;
    if (cam.FocalPoint[0] < bounds[0]) {
        cam.SetFocalPoint( [bounds[0], cam.FocalPoint[1]]);
        modified = true;
    }
    if (cam.FocalPoint[0] > bounds[1]) {
        cam.SetFocalPoint( [bounds[1], cam.FocalPoint[1]]);
        modified = true;
    }
    if (cam.FocalPoint[1] < bounds[2]) {
        cam.SetFocalPoint( [cam.FocalPoint[0], bounds[2]]);
        modified = true;
    }
    if (cam.FocalPoint[1] > bounds[3]) {
        cam.SetFocalPoint( [cam.FocalPoint[0], bounds[3]]);
        modified = true;
    }
    var heightMax = 2*(bounds[3]-bounds[2]);
    if (cam.GetHeight() > heightMax) {
        cam.SetHeight(heightMax);
        this.ZoomTarget = heightMax;
        modified = true;
    }
    var heightMin = viewport[3] * spacing * 0.5;
    if (cam.GetHeight() < heightMin) {
        cam.SetHeight(heightMin);
        this.ZoomTarget = heightMin;
        modified = true;
    }
    if (modified) {
        cam.ComputeMatrix();
    }
}

Viewer.prototype.HandleMouseDown = function(event) {
    if ( ! this.InteractionEnabled) { return true; }

    this.FireFoxWhich = event.which;
    event.preventDefault(); // Keep browser from selecting images.
    this.RecordMouseDown(event);

    if (this.RotateIconDrag) {
        // Problem with leaving the browser with mouse down.
        // This is a mouse down outside the icon, so the mouse must
        // have been let up and we did not get the event.
        this.RotateIconDrag = false;
    }

    if (this.DoubleClick) {
        // Without this, double click selects sub elementes.
        event.preventDefault();
        return this.HandleDoubleClick(event);
    }

    // Forward the events to the widget if one is active.
    //if (this.AnnotationLayer && this.AnnotationLayer.GetVisibility() &&
    //    ! this.AnnotationLayer.HandleMouseDown(event, this)) {
    //    return false;
    //}

    // Choose what interaction will be performed.
    if (event.which == 1 ) {
        if (event.ctrlKey) {
            this.InteractionState = INTERACTION_ROTATE;
        } else if (event.altKey) {
            this.InteractionState = INTERACTION_ZOOM;
        } else {
            this.InteractionState = INTERACTION_DRAG;
        }
        return false;
    }
    if (event.which == 2 ) {
        this.InteractionState = INTERACTION_ROTATE;
        return false;
    }
    return true;
}

Viewer.prototype.HandleDoubleClick = function(event) {
    if ( ! this.InteractionEnabled) { return true; }

    // Forward the events to the widget if one is active.
    //if (this.AnnotationLayer && this.AnnotationLayer.GetVisibility() &&
    //    ! this.AnnotationLayer.HandleDoubleClick(event, this)) {
    //    return false;
    //}

    mWorld = this.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
    if (event.which == 1) {
        this.AnimateZoomTo(0.5, mWorld);
    } else if (event.which == 3) {
        this.AnimateZoomTo(2.0, mWorld);
    }
    return true;
}

Viewer.prototype.HandleMouseUp = function(event) {
    if ( ! this.InteractionEnabled) { return true; }
    var date = new Date();
    this.MouseUpTime = date.getTime();
    this.FireFoxWhich = 0;
    this.RecordMouseUp(event);

    if (this.RotateIconDrag) {
        this.RollUp(event);
        return false;
    }

    if (this.InteractionState == INTERACTION_OVERVIEW ||
        this.InteractionState == INTERACTION_OVERVIEW_DRAG) {
        return this.HandleOverViewMouseUp(event);
    }

    // Forward the events to the widget if one is active.
    //if (this.AnnotationLayer && this.AnnotationLayer.GetVisibility() &&
    //    ! this.AnnotationLayer.HandleMouseUp(event, this)) {
    //    return false;
    //}

    if (this.InteractionState != INTERACTION_NONE) {
        this.InteractionState = INTERACTION_NONE;
        if (RECORDER_WIDGET) {
            RECORDER_WIDGET.RecordState();
        }
    }

    return false; // trying to keep the browser from selecting images
}

/*
Viewer.prototype.ComputeMouseWorld = function(event) {
    // We need to save these for pasting annotation.
    this.MouseWorld = this.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
    // Put this extra ivar in the even object.
    // This could be obsolete because we never pass this event to another object.
    event.worldX = this.MouseWorld[0];
    event.worldY= this.MouseWorld[1];
    // NOTE: DANGER!  user could change this pointer.
    return this.MouseWorld;
}
*/

Viewer.prototype.HandleMouseMove = function(event) {
    if ( ! this.InteractionEnabled) { return true; }

    // The event position is relative to the target which can be a tab on
    // top of the canvas.  Just skip these events.
    if ($(event.target).width() != $(event.currentTarget).width()) {
        return true;
    }


    // TODO: Get rid of this. Should be done with image properties.
    //event.preventDefault(); // Keep browser from selecting images.
    if ( ! this.RecordMouseMove(event)) { return true; }
    //this.ComputeMouseWorld(event);

    // I think we need to deal with the move here because the mouse can
    // exit the icon and the events are lost.
    if (this.RotateIconDrag) {
        this.RollMove(event);
        return false;
    }

    if (this.InteractionState == INTERACTION_OVERVIEW ||
        this.InteractionState == INTERACTION_OVERVIEW_DRAG) {
        return this.HandleOverViewMouseMove(event);
    }

    // Forward the events to the widget if one is active.
    //if (this.AnnotationLayer && this.AnnotationLayer.GetVisibility() &&
    //    ! this.AnnotationLayer.HandleMouseMove(event, this)) {
    //    return false;
    //}

    if (this.InteractionState == INTERACTION_NONE) {
        // Allow the ResizePanel drag to process the events.
        return true;
    }

    var x = event.offsetX;
    var y = event.offsetY;

    // Drag camera in main view.
    // Dragging is too slow.  I want to accelerate dragging the further
    // this mouse moves.  This is a moderate change, so I am
    // going to try to accelerate with speed.
    if (this.InteractionState == INTERACTION_ROTATE) {
        // Rotate
        // Origin in the center.
        // GLOBAL GL will use view's viewport instead.
        var cx = x - (this.MainView.Viewport[2]*0.5);
        var cy = y - (this.MainView.Viewport[3]*0.5);
        // GLOBAL views will go away when views handle this.
        this.MainView.Camera.HandleRoll(cx, cy,
                                        this.MouseDeltaX,
                                        this.MouseDeltaY);
        this.RollTarget = this.MainView.Camera.Roll;
        this.UpdateCamera();
    } else if (this.InteractionState == INTERACTION_ZOOM) {
        var dy = this.MouseDeltaY / this.MainView.Viewport[2];
        this.MainView.Camera.SetHeight(this.MainView.Camera.GetHeight()
                                       / (1.0 + (dy* 5.0)));
        this.ZoomTarget = this.MainView.Camera.GetHeight();
        this.UpdateCamera();
    } else if (this.InteractionState == INTERACTION_DRAG) {

        // Translate
        // Convert to view [-0.5,0.5] coordinate system.
        // Note: the origin gets subtracted out in delta above.
        var dx = -this.MouseDeltaX / this.MainView.Viewport[2];
        var dy = -this.MouseDeltaY / this.MainView.Viewport[2];
        // compute the speed of the movement.
        var speed = Math.sqrt(dx*dx + dy*dy) / this.MouseDeltaTime;
        speed = 1.0 + speed*1000; // f(0) = 1 and increasing.
        // I am not sure I like the speed acceleration.
        // Lets try a limit.
        if (speed > 3.0) { speed = 3.0; }
        dx = dx * speed;
        dy = dy * speed;
        this.MainView.Camera.HandleTranslate(dx, dy, 0.0);
    }
    // The only interaction that does not go through animate camera.
    this.TriggerInteraction();
    this.EventuallyRender(true);

    var x = event.offsetX;
    var y = event.offsetY;

    return false; 
}

Viewer.prototype.HandleMouseWheel = function(event) {
    if ( ! this.InteractionEnabled) { return true; }

    // Forward the events to the widget if one is active.
    //if (this.AnnotationLayer && this.AnnotationLayer.GetVisibility() &&
    //    ! this.AnnotationLayer.HandleMouseWheel(event, this)) {
    //    return false;
    //}

    if ( ! event.offsetX) {
        // for firefox
        event.offsetX = event.layerX;
        event.offsetY = event.layerY;
    }

    // We want to accumulate the target, but not the duration.
    var tmp = 0;
    if (event.deltaY) {
        tmp = event.deltaY;
    } else if (event.wheelDelta) {
        tmp = event.wheelDelta;
    }
    // Wheel event seems to be in increments of 3.
    // depreciated mousewheel had increments of 120....
    // Initial delta cause another bug.
    // Lets restrict to one zoom step per event.
    if (tmp > 0) {
        this.ZoomTarget *= 1.1;
    } else if (tmp < 0) {
        this.ZoomTarget /= 1.1;
    }

    // Compute translate target to keep position in the same place.
    //this.TranslateTarget[0] = this.MainView.Camera.FocalPoint[0];
    //this.TranslateTarget[1] = this.MainView.Camera.FocalPoint[1];
    var position = this.ConvertPointViewerToWorld(event.offsetX, event.offsetY);
    var factor = this.ZoomTarget / this.MainView.Camera.GetHeight();
    this.TranslateTarget[0] = position[0]
        - factor * (position[0] - this.MainView.Camera.FocalPoint[0]);
    this.TranslateTarget[1] = position[1]
        - factor * (position[1] - this.MainView.Camera.FocalPoint[1]);

    this.RollTarget = this.MainView.Camera.Roll;

    this.AnimateLast = new Date().getTime();
    this.AnimateDuration = 200.0; // hard code 200 milliseconds
    this.EventuallyRender(true);
    return false;
}

// returns false if the event was "consumed" (browser convention).
// Returns true if nothing was done with the event.
Viewer.prototype.HandleKeyDown = function(event) {
    if ( ! this.InteractionEnabled) { return true; }
    if (event.keyCode == 83 && event.ctrlKey) { // control -s to save.
        if ( ! SAVING_IMAGE) {
            SAVING_IMAGE = new SAM.Dialog();
            SAVING_IMAGE.Title.text('Saving');
            SAVING_IMAGE.Body.css({'margin':'1em 2em'});
            SAVING_IMAGE.WaitingImage = $('<img>')
                .appendTo(SAVING_IMAGE.Body)
                .attr("src", SA.ImagePathUrl+"circular.gif")
                .attr("alt", "waiting...")
                .addClass("sa-view-save")
            SAVING_IMAGE.ApplyButton.hide();
            SAVING_IMAGE.SavingFlag = false;
            SAVING_IMAGE.Count = 0;
        }
        if ( ! SAVING_IMAGE.SavingFlag) {
            SAVING_IMAGE.SavingFlag = true;
            SAVING_IMAGE.Show(1);
            this.EventuallySaveImage("slideAtlas"+ZERO_PAD(SAVING_IMAGE.Count,3),
                                     function() {
                                         SAVING_IMAGE.SavingFlag = false;
                                         SAVING_IMAGE.Count += 1;
                                         SAVING_IMAGE.Hide();
                                     });
        }
        return false;
    }

    // Handle paste
    if (event.keyCode == 86 && event.ctrlKey) {
        // control-v for paste

        var clip = JSON.parse(localStorage.ClipBoard);
        var camera;
        if (clip.Camera) {
            camera = new Camera();
            camera.Load(clip.Camera);
        }
        if (clip.Type == "CircleWidget") {
            var widget = new CircleWidget(this, false);
            widget.PasteCallback(clip.Data, this.MouseWorld, camera);
        }
        if (clip.Type == "PolylineWidget") {
            var widget = new PolylineWidget(this, false);
            widget.PasteCallback(clip.Data, this.MouseWorld, camera);
        }
        if (clip.Type == "TextWidget") {
            var widget = new TextWidget(this, "");
            widget.PasteCallback(clip.Data, this.MouseWorld, camera);
        }
        if (clip.Type == "RectWidget") {
            var widget = new RectWidget(this, "");
            widget.PasteCallback(clip.Data, this.MouseWorld, camera);
        }
        if (clip.Type == "GridWidget") {
            var widget = new GridWidget(this, "");
            widget.PasteCallback(clip.Data, this.MouseWorld, camera);
        }

        return false;
    }

    //----------------------
    // Forward the events to the widget if one is active.
    //if (this.AnnotationLayer && this.AnnotationLayer.GetVisibility() &&
    //    ! this.AnnotationLayer.HandleKeyDown(event, this)) {
    //    return false;
    //}

    if (String.fromCharCode(event.keyCode) == 'R') {
        //this.MainView.Camera.Reset();
        this.MainView.Camera.ComputeMatrix();
        this.ZoomTarget = this.MainView.Camera.GetHeight();
        this.EventuallyRender(true);
        return false;
    }

    if (event.keyCode == 38) {
        // Up cursor key
        var cam = this.GetCamera();
        var c = Math.cos(cam.Roll);
        var s = -Math.sin(cam.Roll);
        var dx = 0.0;
        var dy = -0.9 * cam.GetHeight();
        var rx = dx*c - dy*s;
        var ry = dx*s + dy*c;
        this.TranslateTarget[0] = cam.FocalPoint[0] + rx;
        this.TranslateTarget[1] = cam.FocalPoint[1] + ry;
        this.AnimateLast = new Date().getTime();
        this.AnimateDuration = 200.0;
        this.EventuallyRender(true);
        return false;
    } else if (event.keyCode == 40) {
        // Down cursor key
        var cam = this.GetCamera();
        var c = Math.cos(cam.Roll);
        var s = -Math.sin(cam.Roll);
        var dx = 0.0;
        var dy = 0.9 * cam.GetHeight();
        var rx = dx*c - dy*s;
        var ry = dx*s + dy*c;
        this.TranslateTarget[0] = cam.FocalPoint[0] + rx;
        this.TranslateTarget[1] = cam.FocalPoint[1] + ry;
        this.AnimateLast = new Date().getTime();
        this.AnimateDuration = 200.0;
        this.EventuallyRender(true);
        return false;
    } else if (event.keyCode == 37) {
        // Left cursor key
        var cam = this.GetCamera();
        var c = Math.cos(cam.Roll);
        var s = -Math.sin(cam.Roll);
        var dx = -0.9 * cam.GetWidth();
        var dy = 0.0;
        var rx = dx*c - dy*s;
        var ry = dx*s + dy*c;
        this.TranslateTarget[0] = cam.FocalPoint[0] + rx;
        this.TranslateTarget[1] = cam.FocalPoint[1] + ry;
        this.AnimateLast = new Date().getTime();
        this.AnimateDuration = 200.0;
        this.EventuallyRender(true);
        return false;
    } else if (event.keyCode == 39) {
        // Right cursor key
        var cam = this.GetCamera();
        var c = Math.cos(cam.Roll);
        var s = -Math.sin(cam.Roll);
        var dx = 0.9 * cam.GetWidth();
        var dy = 0.0;
        var rx = dx*c - dy*s;
        var ry = dx*s + dy*c;
        this.TranslateTarget[0] = cam.FocalPoint[0] + rx;
        this.TranslateTarget[1] = cam.FocalPoint[1] + ry;
        this.AnimateLast = new Date().getTime();
        this.AnimateDuration = 200.0;
        this.EventuallyRender(true);
        return false;
    }
    return true;
}

// Get the current scale factor between pixels and world units.
Viewer.prototype.GetPixelsPerUnit = function() {
    return this.MainView.GetPixelsPerUnit();
}

// Convert a point from world coordiante system to viewer coordinate system (units pixels).
Viewer.prototype.ConvertPointWorldToViewer = function(x, y) {
    var cam = this.MainView.Camera;
    return cam.ConvertPointWorldToViewer(x, y);
}

Viewer.prototype.ConvertPointViewerToWorld = function(x, y) {
    var cam = this.MainView.Camera;
    return cam.ConvertPointViewerToWorld(x, y);
}


// Where else should I put this?
function colorNameToHex(color)
{
    var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
                  "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
                  "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
                  "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
                  "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
                  "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
                  "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
                  "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
                  "honeydew":"#f0fff0","hotpink":"#ff69b4",
                  "indianred ":"#cd5c5c","indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
                  "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
                  "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
                  "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
                  "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
                  "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
                  "navajowhite":"#ffdead","navy":"#000080",
                  "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
                  "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
                  "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
                  "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
                  "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
                  "violet":"#ee82ee",
                  "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
                  "yellow":"#ffff00","yellowgreen":"#9acd32"};

    if (typeof colors[color.toLowerCase()] != 'undefined')
        return colors[color.toLowerCase()];

    return false;
}





//==============================================================================
// OverView slide widget stuff.

Viewer.prototype.OverViewCheckActive = function(event) {
    if ( ! this.OverView) {
        return false;
    }
    var x = event.offsetX;
    var y = event.offsetY;
    // Half height and width
    var hw = this.OverViewport[2]/2;
    var hh = this.OverViewport[3]/2;
    // Center of the overview.
    var cx = this.OverViewport[0]+hw;
    var cy = this.OverViewport[1]+hh;

    x = x-cx;
    y = y-cy;
    // Rotate into overview slide coordinates.
    var roll = this.MainView.Camera.Roll;
    var c = Math.cos(roll);
    var s = Math.sin(roll);
    var nx = Math.abs(c*x+s*y);
    var ny = Math.abs(c*y-s*x);
    if ((Math.abs(hw-nx) < 5 && ny < hh) ||
        (Math.abs(hh-ny) < 5 && nx < hw)) {
        this.OverViewActive = true;
        this.OverView.CanvasDiv.addClass("sa-view-overview-canvas sa-active");
    } else {
        this.OverViewActive = false;
        this.OverView.CanvasDiv.removeClass("sa-view-overview-canvas sa-active");
    }
    //return this.OverViewActive;
}





// Interaction events that change the main camera.


// Resize of overview window will be drag with left mouse.
// Reposition camera with left click (no drag).
// Removing drag camera in overview.

// TODO: Make the overview slide a widget.
Viewer.prototype.HandleOverViewMouseDown = function(event) {
    if ( ! this.InteractionEnabled) { return true; }
    if (this.RotateIconDrag) { return;}

    this.InteractionState = INTERACTION_OVERVIEW;

    // Delay actions until we see if it is a drag or click.
    this.OverviewEventX = event.pageX;
    this.OverviewEventY = event.pageY;

    return false;
}


Viewer.prototype.HandleOverViewMouseUp = function(event) {
    if ( ! this.InteractionEnabled) { return true; }
    if (this.RotateIconDrag) { return;}
    if (this.InteractionState == INTERACTION_OVERVIEW_DRAG)
    {
        this.InteractionState = INTERACTION_NONE;
        return;
    }

    // This target for animation is not implemented cleanly.
    // This fixes a bug: OverView translated rotates camamera back to zero.
    this.RollTarget = this.MainView.Camera.Roll;

    if (event.which == 1) {
        var x = event.offsetX;
        var y = event.offsetY;
        if (x == undefined) {x = event.layerX;}
        if (y == undefined) {y = event.layerY;}
        // Transform to view's coordinate system.
        this.OverViewPlaceCamera(x, y);
    }

    this.InteractionState = INTERACTION_NONE;

    return false;
}

Viewer.prototype.HandleOverViewMouseMove = function(event) {
    if ( ! this.InteractionEnabled) { return true; }
    if (this.RotateIconDrag) {
        this.RollMove(event);
        return false;
    }

    if (this.InteractionState == INTERACTION_OVERVIEW) {
        // Do not start dragging until the mouse has moved some distance.
        if (Math.abs(event.pageX - this.OverviewEventX) > 5 ||
            Math.abs(event.pageY - this.OverviewEventY) > 5) {
            // Start dragging the overview window.
            this.InteractionState = INTERACTION_OVERVIEW_DRAG;
            var w = this.GetViewport()[2];
            var p = Math.max(w-event.pageX,event.pageY);
            this.OverViewScaleLast = p;
        }
        return false;
    }

    // This consumes events even when I return true. Why?
    if (this.InteractionState !== INTERACTION_OVERVIEW_DRAG) {
        // Drag originated outside overview.
        // Could be panning.
        return true;
    }

    // Drag to change overview size
    var w = this.GetViewport()[2];
    var p = Math.max(w-event.pageX,event.pageY);
    var d = p/this.OverViewScaleLast;
    this.OverViewScale *= d*d;
    this.OverViewScaleLast = p;
    if (p < 60) {
        this.RotateIcon.hide();
    } else {
        this.RotateIcon.show();
    }

    // TODO: Get rid of this hack.
    $(window).trigger('resize');

    return false;
}

Viewer.prototype.HandleOverViewMouseWheel = function(event) {
    if ( ! this.InteractionEnabled) { return true; }
    var tmp = 0;
    if (event.deltaY) {
	      tmp = event.deltaY;
    } else if (event.wheelDelta) {
	      tmp = event.wheelDelta;
    }

    if (tmp > 0) {
        this.OverViewScale *= 1.2;
	  } else if (tmp < 0) {
        this.OverViewScale /= 1.2;
    }

    // TODO: Get rid of this hack.
    $(window).trigger('resize');

    return true;
}

Viewer.prototype.SetAnnotationWidgetVisibility = function(vis) {
    if (vis) {
        if ( ! this.AnnotationWidget) {
            this.AnnotationWidget = new AnnotationWidget(this.AnnotationLayer);
        }
        this.AnnotationWidget.show();
    } else {
        if ( this.AnnotationWidget) {
            this.AnnotationWidget.hide();
        }
    }
}

Viewer.prototype.SetZoomWidgetVisibility = function(vis) {
    if (vis) {
        if ( ! this.ZoomTab) {
            this.InitializeZoomGui();
        }
        this.ZoomTab.show();
    } else {
        if ( this.ZoomTab) {
            this.ZoomTab.hide();
        }
    }
}

Viewer.prototype.SetCopyrightVisibility = function(vis) {
    if (vis) {
        this.CopyrightWrapper.show();
    } else {
        this.CopyrightWrapper.hide();
    }
}






