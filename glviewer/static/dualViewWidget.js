// Interface for ViewerSet
// GetNumberOfViewers();

// Does not have to abide.
// SetNumberOfViewers(n);

// GetViewer(idx);




// Create and repond to the dual / single view toggle button.
// How the window is deived between viewer1 and viewer1.
// Default: viewer1 uses all available space.


// TODO: Get rid of these gloabal variable.
var VIEWERS = [];
var VIEWER1;
var VIEWER2;


function DualViewWidget() {
    var self = this;
    this.Viewers = [];

    var width = CANVAS.innerWidth();
    var height = CANVAS.innerHeight();
    var halfWidth = width/2;

    for (var i = 0; i < 2; ++i) {
        var viewerDiv = $('<div>')
            .appendTo(VIEW_PANEL)
            .saViewer({overview:true, zoomWidget:true});
        this.Viewers[i] = viewerDiv[0].saViewer;
        // TODO: Get rid of this.
        // I beleive the note should sets this, and we do not need to do it
        // here..
        this.Viewers[i].RecordIndex = i;
    }

    // TODO: Get rid of these.
    VIEWERS = this.Viewers;
    VIEWER1 = this.Viewers[0];
    VIEWER2 = this.Viewers[1];

    this.DualView = false;
    this.Viewer1Fraction = 1.0;
    // It would be nice to integrate all animation in a flexible utility.
    this.AnimationLastTime = 0;
    this.AnimationDuration = 0;
    this.AnimationTarget = 0;

    if ( ! MOBILE_DEVICE) {
        // Todo: Make the button become more opaque when pressed.
        $('<img>')
            .appendTo(VIEW_PANEL)
            .addClass("sa-view-dualview-div")
            .attr('id', 'dualWidgetLeft')
            .attr('src',"webgl-viewer/static/dualArrowLeft2.png")
            .click(function(){self.ToggleDualView();})
            .attr('draggable','false')
            .on("dragstart", function() {
                return false;});

        $('<img>').appendTo(VIEW_PANEL)
            .hide()
            .addClass("sa-view-dualview-img")
            .attr('id', 'dualWidgetRight')
            .attr('src',"webgl-viewer/static/dualArrowRight2.png")
            .click(function(){self.ToggleDualView();})
            .attr('draggable','false')
            .on("dragstart", function() {
                return false;});

        this.Viewers[0].AddGuiElement("#dualWidgetLeft", "Top", 0, "Right", 20);
        this.Viewers[0].AddGuiElement("#dualWidgetRight", "Top", 0, "Right", 0);
    }
}

// API for ViewerSet
DualViewWidget.prototype.GetNumberOfViewers = function() {
    if (this.DualView) {
        return 2;
    }

    return 1;
}

// API for ViewerSet
DualViewWidget.prototype.GetViewer = function(idx) {
    return this.Viewers[idx];
}

// Called programmatically. No animation.
DualViewWidget.prototype.SetNumberOfViewers = function(numViews) {
    this.DualView = (numViews > 1);

    if (this.DualView) {
        this.Viewer1Fraction = 0.5;
    } else {
        this.Viewer1Fraction = 1.0;
    }

    handleResize();
    this.UpdateGui();
}


DualViewWidget.prototype.ToggleDualView = function () {
    this.DualView = ! this.DualView;

    if (this.DualView) {
        // If there is no image in the second viewer, copy it from the first.
        if ( ! this.Viewers[1].GetCache()) {
            this.Viewers[1].SetCache(this.Viewers[0].GetCache());
            this.Viewers[1].GetCamera().DeepCopy(this.Viewers[0].GetCamera());
        }
        this.AnimationCurrent = 1.0;
        this.AnimationTarget = 0.5;
        // Edit menu option to copy camera zoom between views.
        // I do not call update gui here because I want
        // the buttons to appear at the end of the animation.
        $('#dualViewCopyZoom').show();
        // Animation takes care of switching the buttons
    } else {
        this.AnimationCurrent = 0.5;
        this.AnimationTarget = 1.0;
        this.UpdateGui();
    }

    RecordState();

    this.AnimationLastTime = new Date().getTime();
    this.AnimationDuration = 1000.0;
    this.AnimateViewToggle();
}

DualViewWidget.prototype.UpdateGui = function () {
    // Now swap the buttons.
    if (this.DualView) {
        $('#dualWidgetLeft').hide();
        $('#dualWidgetRight').show();
        this.Viewers[1].ShowGuiElements();
        // Edit menu option to copy camera zoom between views.
        $('#dualViewCopyZoom').show();
    } else {
        $('#dualWidgetRight').hide();
        $('#dualViewCopyZoom').hide();
        this.Viewers[1].HideGuiElements();
        $('#dualWidgetLeft').show();
        // Edit menu option to copy camera zoom between views.
    }
}

DualViewWidget.prototype.AnimateViewToggle = function () {
    var timeStep = new Date().getTime() - this.AnimationLastTime;
    if (timeStep > this.AnimationDuration) {
        // end the animation.
        this.Viewer1Fraction = this.AnimationTarget;
        handleResize();
        this.UpdateGui();
        // this function is defined in init.js
        this.Draw();
        return;
    }

    var k = timeStep / this.AnimationDuration;

    // update
    this.AnimationDuration *= (1.0-k);
    this.Viewer1Fraction += (this.AnimationTarget - this.Viewer1Fraction) * k;

    handleResize();
    // 2d canvas does not draw without this.
    this.Draw();
    var self = this;
    requestAnimFrame(function () { self.AnimateViewToggle()});
}


DualViewWidget.prototype.CreateThumbnailImage = function(height) {
    var canvas = document.createElement("canvas"); //create
    var ctx = canvas.getContext("2d");
    var img1 = this.Viewers[0].MainView.CaptureImage();
    var scale = height / img1.height;
    var width1 = Math.round(img1.width * scale);
    var height1 = Math.round(img1.height * scale);
    if (this.DualView) {
        var img2 = this.Viewers[2].MainView.CaptureImage();
        var width2 = Math.round(img2.width * scale);
        var height2 = Math.round(img2.height * scale);
        canvas.width = width1 + width2;
        canvas.height = Math.max(height1, height2);
        ctx.drawImage(img2, 0, 0, img2.width, img2.height,
                      width1, 0, width2, height2);
    } else {
        canvas.width = width1;
        canvas.height = height1;
    }
    ctx.drawImage(img1, 0, 0, img1.width, img1.height,
                  0, 0, width1, height1);

    var url = canvas.toDataURL('image/jpeg', 0.8);
    var thumb = document.createElement("img"); //create
    thumb.src = url;

    return thumb;
}


DualViewWidget.prototype.ShowImage = function (img) {
    //document.body.appendChild(img);
    var disp =
        $('<img>').appendTo(VIEW_PANEL)
        .addClass("sa-active")
        .attr('src',img.src);
}

DualViewWidget.prototype.Draw = function () {
    if (GL) {
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    }

    // This just changes the camera based on the current time.
    if (this.Viewers[0]) {
        this.Viewers[0].Animate();
        if (this.DualView) { this.Viewers[1].Animate(); }
        this.Viewers[0].Draw();
    }
    if (this.Viewers[1] && this.DualView) { this.Viewers[1].Draw(); }
}
