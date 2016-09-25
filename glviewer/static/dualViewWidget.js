// It seems I cannot control the order these files are loaded.
window.SA = window.SA || {};

// Interface for ViewerSet
// GetNumberOfViewers();

// Does not have to abide.
// SetNumberOfViewers(n);

// GetViewer(idx);




// Create and repond to the dual / single view toggle button.
// How the window is derived between viewer1 and viewer1.
// Default: viewer1 uses all available space.


(function () {
    "use strict";

    // TODO: Get rid of these gloabal variable.
    SA.VIEWERS = [];
    SA.VIEWER1;
    SA.VIEWER2;

    function DualViewWidget(parent) {
        var self = this;
        this.Viewers = []; // It would be nice to get rid of this.
        this.ViewerDivs = [];

        // Rather than getting the current note from the NotesWidget, keep a
        // reference here.  SlideShow can have multiple "displays".
        // We might consider keep a reference in the dua
        this.saNote = null;
        this.saNoteStartIndex = 0;

        this.Parent = parent;
        parent.addClass('sa-dual-viewer');
        // I need relative position but should not modify parent.
        this.TopDiv = $('<div>')
            .appendTo(parent)
            .css({'position':'relative',
                  'width':'100%',
                  'height':'100%'});

        // This parent used to be CANVAS.
        var width = parent.innerWidth();
        var height = parent.innerHeight();
        var halfWidth = width/2;

        for (var i = 0; i < 2; ++i) {
            var viewerDiv = $('<div>')
                .appendTo(this.TopDiv)
                .css({'position':'absolulute',
                      'top':'0px'})
                .saViewer({overview:true, zoomWidget:true})
                .addClass("sa-view-canvas-div");

            this.ViewerDivs[i] = viewerDiv;
            this.Viewers[i] = viewerDiv[0].saViewer;
            // TODO: Get rid of this.
            // I beleive the note should sets this, and we do not need to do it
            // here..
            this.Viewers[i].RecordIndex = i;
        }

        // TODO: Get rid of these.
        SA.VIEWERS = this.Viewers;
        SA.VIEWER1 = this.Viewers[0];
        SA.VIEWER2 = this.Viewers[1];

        this.DualView = false;
        this.Viewer1Fraction = 1.0;
        // It would be nice to integrate all animation in a flexible utility.
        this.AnimationLastTime = 0;
        this.AnimationDuration = 0;
        this.AnimationTarget = 0;

        // DualViewer is the navigation widgets temporary home.
        // SlideShow can have multiple nagivation widgets so it is no
        // longer a singlton.
        // This is for moving through notes, session views and stacks.
        // It is not exactly related to dual viewer. It is sort of a child
        // of the dual viewer.
        this.NavigationWidget = new SA.NavigationWidget(this.TopDiv,this);

        if ( ! SAM.MOBILE_DEVICE) { // || SAM.MOBILE_DEVICE == 'iPad') {
            // Todo: Make the button become more opaque when pressed.
            $('<img>')
                .appendTo(this.ViewerDivs[0])
                .css({'position':'absolute',
                      'right':'0px',
                      'top':'0px'})
                .addClass("sa-view-dualview-div")
                .attr('id', 'dualWidgetLeft')
                .attr('src',SA.ImagePathUrl+"dualArrowLeft2.png")
                .click(function(){self.ToggleDualView();})
                .attr('draggable','false')
                .on("dragstart", function() {
                    return false;});

            $('<img>').appendTo(this.TopDiv)
                .appendTo(this.ViewerDivs[1])
                .css({'position':'absolute',
                      'left':'0px',
                      'top':'0px'})
                .hide()
                .addClass("sa-view-dualview-img")
                .attr('id', 'dualWidgetRight')
                .attr('src',SA.ImagePathUrl+"dualArrowRight2.png")
                .click(function(){self.ToggleDualView();})
                .attr('draggable','false')
                .on("dragstart", function() {
                    return false;});
        } else {
            this.NavigationWidget.SetVisibility(false);
        }
    }

    DualViewWidget.prototype.EventuallyRender = function () {
        for ( var i = 0; i < this.Viewers.length; ++i) {
            this.GetViewer(i).EventuallyRender(false);
        }
    }

    // Abstracting saViewer  for viewer and dualViewWidget.
    // Save viewer state in a note.
    DualViewWidget.prototype.Record = function (note, startViewIdx) {
        if (startViewIdx) {
            note.StartIndex = startViewIdx;
        }
        startViewIdx = startViewIdx || 0;
        // TODO: Deal with multiple  windows consistently.
        // Now num viewRecords indicates the number of views in the display,
        // but not for stacks.  We have this start index which implies stack behavior.
        if ( note.Type != "Stack") {
            if (! this.DualView && note.ViewerRecords.length > 1) {
                note.ViewerRecords = [note.ViewerRecords[0]];
            }
            if (this.DualView && note.ViewerRecords.length < 2) {
                while ( note.ViewerRecords.length < 2) {
                    note.ViewerRecords.push(new SA.ViewerRecord());
                }
            }
        }

        for (var i = 0; i  < this.GetNumberOfViewers(); ++i) {
            if (i + startViewIdx < note.ViewerRecords.length) {
                this.GetViewer(i).Record(note, i+startViewIdx);
            }
        }
    }


    // Abstracting the saViewer class to support dual viewers and stacks.
    DualViewWidget.prototype.ProcessArguments = function (args) {
        if (args.note) {
            // TODO: DO we need both?
            this.SetNote(args.note,args.viewIndex);
            // NOTE: TempId is legacy
            this.Parent.attr('sa-note-id', args.note.Id || args.note.TempId);
        }

        if (args.tileSource) {
            var w = args.tileSource.width;
            var h = args.tileSource.height;
            var cache = new SA.Cache();
            cache.TileSource = args.tileSource;
            // Use the note tmp id as an image id so the viewer can index the
            // cache.
            var note = new SA.Note();
            var image = {levels:     args.maxLevel + 1,
                         dimensions: [w,h],
                         bounds: [0,w-1, 0,h-1],
                         _id: note.TempId};
            var record = new SA.ViewerRecord();
            record.Image = image;
            record.OverviewBounds = [0,w-1,0,h-1];
            record.Camera = {FocalPoint: [w/2, h/2],
                             Roll: 0,
                             Height: h};
            note.ViewerRecords.push(record);
            cache.SetImageData(image);
            this.SetNote(args.note,args.viewIndex);
        }

        for (var i = 0; i < this.Viewers.length; ++i) {
            var viewer = this.Viewers[i];

            if (args.hideCopyright != undefined) {
                viewer.SetCopyrightVisibility( ! args.hideCopyright);
            }
            if (args.overview !== undefined) {
                viewer.SetOverViewVisibility(args.overview);
            }
            if (args.navigation !== undefined) {
                this.NavigationWidget.SetVisibility(args.navigation);
            }
            if (args.dualWidget !== undefined) {
                this.HideHandles = ! args.dualWidget;
                this.UpdateGui();
            }
            if (args.zoomWidget !== undefined) {
                viewer.SetZoomWidgetVisibility(args.zoomWidget);
            }
            if (args.drawWidget !== undefined) {
                viewer.SetAnnotationWidgetVisibility(args.drawWidget);
            }
            // The way I handle the viewer edit menu is messy.
            // TODO: Find a more elegant way to add tabs.
            // Maybe the way we handle the anntation tab shouodl be our pattern.
            if (args.menu !== undefined) {
                if ( ! viewer.Menu) {
                    viewer.Menu = new SA.ViewEditMenu(viewer, null);
                }
                viewer.Menu.SetVisibility(args.menu);
            }

            if (args.interaction !== undefined) {
                viewer.SetInteractionEnabled(args.interaction);
                if (this.NavigationWidget) {
                    this.NavigationWidget.SetInteractionEnabled(args.interaction);
                }
            }
        }
    }

    DualViewWidget.prototype.RecordAnnotations = function() {
        // Agressively record annotations.  User still needs to hit the
        // save button.
        if (SA.Edit && this.saNote) {
            this.saNote.RecordAnnotations(this);
        }
    }

    DualViewWidget.prototype.SetNote = function(note) {
        // NOTE: Even when this.saNote == note, we still need to set the
        // camera and annotations because the user might have changed these.

        // If the note is not loaded, request the note, and call this method
        // when the note is finally loaded.
        var self = this;
        if (note && note.LoadState != 2) {
            note.LoadViewId(
                note.Id,
                function () {
                    self.SetNote(note);
                });
            return;
        }

        this.saNote = note;
        this.saNoteStartIndex = note.StartIndex;
        var viewIdx = note.StartIndex || 0;

        if (! note || viewIdx < 0 || viewIdx >= note.ViewerRecords.length) {
            console.log("Cannot set viewer record of note");
            return;
        }
        this.saViewerIndex = viewIdx;
        if (this.NavigationWidget) {
            this.NavigationWidget.SetNote(note);
            //this.NavigationWidget.Update(); // not sure if this is necessary
        }
        this.DisplayNote(note);
        if (note.Type == "Stack") {
            // TODO: Can I move this logic into the display? SetNote maybe?
            // Possibly nagivationWidget (we need to know which viewer is referecne.
            // Select only gets called when the stack is first loaded.
            var self = this;
            this.GetViewer(0).OnInteraction(function () {
                self.SynchronizeViews(0, note);});
            this.GetViewer(1).OnInteraction(function () {
                self.SynchronizeViews(1, note);});
            note.DisplayStack(this);
            // First view is set by viewer record camera.
            // Second is set relative to the first.
            this.SynchronizeViews(0, note);
        }
    }


    DualViewWidget.prototype.MatrixMultiply = function(M, p) {
        var x = p[0]*M[0] + p[1]*M[1] + M[2];
        var y = p[0]*M[3] + p[1]*M[4] + M[5];
        var k = p[0]*M[6] + p[1]*M[7] + M[8];
        p[0] = x/k;
        p[1] = y/k;
    }


    DualViewWidget.prototype.InitializeSynchronousViewsWithPoints = function(p1a,p2a, p1b,p2b, p1c,p2c) {
        // Just fashoin a not for now.
        var note = new SA.Note();
        var viewerRecord1 = new SA.ViewerRecord();
        viewerRecord1.Transform = new SA.PairTransformation(); // not necessary
        var viewerRecord2 = new SA.ViewerRecord();
        viewerRecord2.Transform = new SAM.MatrixTransformation();
        viewerRecord2.Transform.InitializeWithPoints(p1a,p2a, p1b,p2b, p1c,p2c);

        var pt;
        var p1 = p1a;
        var p2 = p2a;
        pt = viewerRecord2.Transform.ForwardTransformPoint(p1);
        console.log(p2[0] + "," + p2[1] + ":" + pt[0] + "," + pt[1]);
        var p1 = p1b;
        var p2 = p2b;
        pt = viewerRecord2.Transform.ForwardTransformPoint(p1);
        console.log(p2[0] + "," + p2[1] + ":" + pt[0] + "," + pt[1]);
        var p1 = p1c;
        var p2 = p2c;
        pt = viewerRecord2.Transform.ForwardTransformPoint(p1);
        console.log(p2[0] + "," + p2[1] + ":" + pt[0] + "," + pt[1]);


        note.ViewerRecords = [viewerRecord1, viewerRecord2];
        note.StartIndex = 0;
        note.Type = "Stack";

        this.saNote = note;
        this.saNoteStartIndex = note.StartIndex;
        this.saViewerIndex = 0;

        var self = this;
        this.GetViewer(0).OnInteraction(function () {
            self.SynchronizeViews(0, note);});
        this.GetViewer(1).OnInteraction(function () {
            self.SynchronizeViews(1, note);});

        // First view is set by viewer record camera.
        // Second is set relative to the first.
        this.SynchronizeViews(0, note);
    }
    DualViewWidget.prototype.InitializeSynchronousViews = function(camModel1, camModel2) {
        // Just fashoin a not for now.
        var note = new SA.Note();
        var viewerRecord1 = new SA.ViewerRecord();
        viewerRecord1.Transform = new SA.PairTransformation(); // not necessary
        var viewerRecord2 = new SA.ViewerRecord();
        viewerRecord2.Transform = new SAM.MatrixTransformation(camModel1, camModel2);


        var pt;
        pt = viewerRecord2.Transform.ForwardTransformPoint([259,656]);
        console.log("(345,261):" + pt[0] + "," + pt[1]);
        pt = viewerRecord2.Transform.ForwardTransformPoint([285,8896]);
        console.log("(167,7265):" + pt[0] + "," + pt[1]);
        pt = viewerRecord2.Transform.ForwardTransformPoint([9406,16]);
        console.log("(7789,306):" + pt[0] + "," + pt[1]);
        pt = viewerRecord2.Transform.ForwardTransformPoint([7977,6215]);
        console.log("(6689,5510):" + pt[0] + "," + pt[1]);

        note.ViewerRecords = [viewerRecord1, viewerRecord2];
        note.StartIndex = 0;
        note.Type = "Stack";

        this.saNote = note;
        this.saNoteStartIndex = note.StartIndex;
        this.saViewerIndex = 0;

        var self = this;
        this.GetViewer(0).OnInteraction(function () {
            self.SynchronizeViews(0, note);});
        this.GetViewer(1).OnInteraction(function () {
            self.SynchronizeViews(1, note);});

        // First view is set by viewer record camera.
        // Second is set relative to the first.
        this.SynchronizeViews(0, note);
    }

    // Display Note
    // Set the state of the WebGL viewer from this notes ViewerRecords.
    // Lock camera is for when the user note updates and we only want to
    // update the annotations.
    DualViewWidget.prototype.DisplayNote = function(note, lockCamera) {
        var numViewers = this.GetNumberOfViewers();
        if (numViewers == 0) { return; }
        if (note.Type == 'Stack') {
            // Stack display needs to keep both viewers up to date.
            numViewers = 2;
        }

        // We could have more than two in the future.
        if (note.Type != 'Stack') {
            // I want the single view (when set by the user) to persist for rthe stack.
            numViewers = note.ViewerRecords.length;
            this.SetNumberOfViewers(numViewers);
        }

        var idx = note.StartIndex;
        for (var i = 0; i < numViewers; ++i) {
            var viewer = this.GetViewer(i);

            if (i + idx < note.ViewerRecords.length) {
                viewer.SetViewerRecord(note.ViewerRecords[idx + i], lockCamera);
                // This is for synchroninzing changes in the viewer back to the note.
                viewer.RecordIndex = i;

            }
        }
    }

    // User notes are load on demand and will show up after the root note.
    // When we add the user note annotations, We cannot reset the camera.
    DualViewWidget.prototype.UpdateUserNotes = function() {
        // Wwhere do we record annotations before wiping the viewer
        // annotations out?
        var note = this.saNote;
        this.DisplayNote(note, true);
    }

    DualViewWidget.prototype.GetNote = function () {
        return this.saNote;
    }

    DualViewWidget.prototype.GetRootNote = function () {
        var note = this.saNote;
        while (note.Parent) {
            note = note.Parent;
        }
        return note;
    }

    DualViewWidget.prototype.SetNoteFromId = function(noteId) {
        var note = SA.GetNoteFromId(noteId);
        if ( ! note) {
            note = new SA.Note();
        }
        if (note.LoadState != 2) {
            var self = this;
            note.LoadViewId(
                noteId,
                function () {
                    self.SetNote(note);
                });
            return note;
        }

        this.SetNote(note);
        return note;
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

        this.UpdateSize();
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

        SA.RecordState();

        this.AnimationLastTime = new Date().getTime();
        this.AnimationDuration = 1000.0;
        this.AnimateViewToggle();
    }

    DualViewWidget.prototype.UpdateGui = function () {
        if ( this.HideHandles) {
            $('#dualWidgetLeft').hide();
            $('#dualWidgetRight').hide();
            return;
        }
        // Now swap the buttons.
        if (this.DualView) {
            $('#dualWidgetLeft').hide();
            $('#dualWidgetRight').show();
            // Edit menu option to copy camera zoom between views.
            $('#dualViewCopyZoom').show();
        } else {
            $('#dualWidgetRight').hide();
            $('#dualViewCopyZoom').hide();
            $('#dualWidgetLeft').show();
            // Edit menu option to copy camera zoom between views.
        }
    }

    DualViewWidget.prototype.AnimateViewToggle = function () {
        var timeStep = new Date().getTime() - this.AnimationLastTime;
        if (timeStep > this.AnimationDuration) {
            // end the animation.
            this.Viewer1Fraction = this.AnimationTarget;
            this.UpdateSize();
            this.UpdateGui();
            this.Draw();
            return;
        }

        var k = timeStep / this.AnimationDuration;

        // update
        this.AnimationDuration *= (1.0-k);
        this.Viewer1Fraction += (this.AnimationTarget - this.Viewer1Fraction) * k;

        this.UpdateSize();
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


    DualViewWidget.prototype.Draw = function (gl) {
        if (gl) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        if (this.saNote && this.saNote.WaterMark) {
            SA.WaterMark = true;
        } else {
            SA.WaterMark = false;
        }   

        // This just changes the camera based on the current time.
        if (this.Viewers[0]) {
            this.Viewers[0].Animate();
            if (this.DualView) { this.Viewers[1].Animate(); }
            this.Viewers[0].Draw();
        }
        if (this.Viewers[1] && this.DualView) { this.Viewers[1].Draw(); }
    }


    DualViewWidget.prototype.UpdateSize = function () {
        var percent = this.Viewer1Fraction*100;
        if (this.ViewerDivs[0]) {
            this.ViewerDivs[0].css({'left':'0%',
                                    'width':percent+'%',
                                    'height':'100%'});
            this.Viewers[0].UpdateSize();
        }
        if (this.ViewerDivs[1]) {
            this.ViewerDivs[1].css({'left':percent+'%',
                                    'width':(100-percent)+'%',
                                    'height':'100%'});
            this.Viewers[1].UpdateSize();
        }

        if (percent >= 90) {
            this.Viewers[1].Hide();
        } else {
            this.Viewers[1].Show();
        }

        // This looks problematic.
        // TODO: Try to get rid of it.
        //$(window).trigger('resize');
    }


    DualViewWidget.prototype.AnnotationWidgetOn = function() {
        for (var i = 0; i < this.Viewers.length; ++i) {
            this.Viewers.AnnotationWidgetOn();
        }
    }

    DualViewWidget.prototype.AnnotationWidgetOff = function() {
        for (var i = 0; i < this.Viewers.length; ++i) {
            this.Viewers.AnnotationWidgetOff();
        }
    }

    // refViewerIdx is the viewer that changed and other viewers need 
    // to be updated to match that reference viewer.
    DualViewWidget.prototype.SynchronizeViews = function (refViewerIdx, note) {
        // We allow the viewer to go one past the end.
        if (refViewerIdx + note.StartIndex >= note.ViewerRecords.length) {
            return;
        }

        // Special case for when the shift key is pressed.
        // Translate only one camera and modify the tranform to match.
        if (SA.Edit && SA.StackCursorFlag) {
            var trans = note.ViewerRecords[note.StartIndex + 1].Transform;
            if ( ! note.ActiveCorrelation && trans.Correlations) {
                if ( ! trans) {
                    alert("Missing transform");
                    return;
                }
                // Remove all correlations visible in the window.
                var cam = this.GetViewer(0).GetCamera();
                var bds = cam.GetBounds();
                var idx = 0;
                while (idx < trans.Correlations.length) {
                    var cor = trans.Correlations[idx];
                    if (cor.point0[0] > bds[0] && cor.point0[0] < bds[1] &&
                        cor.point0[1] > bds[2] && cor.point0[1] < bds[3]) {
                        trans.Correlations.splice(idx,1);
                    } else {
                        ++idx;
                    }
                }

                // Now make a new replacement correlation.
                note.ActiveCorrelation = new SA.PairCorrelation();
                trans.Correlations.push(note.ActiveCorrelation);
            }
            var cam0 = this.GetViewer(0).GetCamera();
            var cam1 = this.GetViewer(1).GetCamera();
            note.ActiveCorrelation.SetPoint0(cam0.GetFocalPoint());
            note.ActiveCorrelation.SetPoint1(cam1.GetFocalPoint());
            // I really do not want to set the roll unless the user specifically changed it.
            // It would be hard to correct if the wrong value got set early in the aligment.
            var deltaRoll = cam1.Roll - cam0.Roll;
            if (trans.Correlations && trans.Correlations.length > 1) {
                deltaRoll = 0;
                // Let roll be set by multiple correlation points.
            }
            note.ActiveCorrelation.SetRoll(deltaRoll);
            note.ActiveCorrelation.SetHeight(0.5*(cam1.Height + cam0.Height));
            return; 
        } else {
            // A round about way to set and unset the active correlation.
            // Note is OK, because if there is no interaction without the shift key
            // the active correlation will not change anyway.
            note.ActiveCorrelation = undefined;
        }

        // No shift modifier:
        // Synchronize all the cameras.
        // Hard coded for two viewers (recored 0 and 1 too).
        // First place all the cameras into an array for code simplicity.
        // Cameras used for preloading.
        if (! note.PreCamera) { note.PreCamera = new SAM.Camera();}
        if (! note.PostCamera) { note.PostCamera = new SAM.Camera();}
        var cameras = [note.PreCamera,
                       this.GetViewer(0).GetCamera(),
                       this.GetViewer(1).GetCamera(),
                       note.PostCamera];
        var refCamIdx = refViewerIdx+1; // An extra to account for PreCamera.
        // Start with the reference section and move forward.
        // With two sections, the second has the transform.

        for (var i = refCamIdx+1; i < cameras.length; ++i) {
            var transIdx = i - 1 + note.StartIndex;
            if (transIdx < note.ViewerRecords.length) {
                note.ViewerRecords[transIdx].Transform
                    .ForwardTransformCamera(cameras[i-1],cameras[i]);
            } else {
                cameras[i] = undefined;
            }
        }

        // Start with the reference section and move backward.
        // With two sections, the second has the transform.
        for (var i = refCamIdx; i > 0; --i) {
            var transIdx = i + note.StartIndex-1;
            if (transIdx > 0) { // First section does not have a transform
                note.ViewerRecords[transIdx].Transform
                    .ReverseTransformCamera(cameras[i],cameras[i-1]);
            } else {
                cameras[i-1] = undefined;
            }
        }

        // Preload the adjacent sections.
        if (cameras[0]) {
            var cache = SA.FindCache(note.ViewerRecords[note.StartIndex-1].Image);
            cameras[0].SetViewport(this.GetViewer(0).GetViewport());
            var tiles = cache.ChooseTiles(cameras[0], 0, []);
            for (var i = 0; i < tiles.length; ++i) {
                tiles[i].LoadQueueAdd();
            }
            SA.LoadQueueUpdate();
        }
        if (cameras[3]) {
            var cache = SA.FindCache(note.ViewerRecords[note.StartIndex+2].Image);
            cameras[3].SetViewport(this.GetViewer(0).GetViewport());
            var tiles = cache.ChooseTiles(cameras[3], 0, []);
            for (var i = 0; i < tiles.length; ++i) {
                tiles[i].LoadQueueAdd();
            }
            SA.LoadQueueUpdate();
        }

        // OverView cameras need to be updated.
        if (refViewerIdx == 0) {
            this.GetViewer(1).UpdateCamera();
            this.GetViewer(1).EventuallyRender(false);
        } else {
            this.GetViewer(0).UpdateCamera();
            this.GetViewer(0).EventuallyRender(false);
        }

        // Synchronize annotation visibility.
        var refViewer = this.GetViewer(refViewerIdx);
        for (var i = 0; i < 2; ++i) {
            if (i != refViewerIdx) {
                var viewer = this.GetViewer(i);
                if (viewer.AnnotationWidget && refViewer.AnnotationWidget) {
                    viewer.AnnotationWidget.SetVisibility(
                        refViewer.AnnotationWidget.GetVisibility());
                }
            }
        }
    }


    // Called from the console for renal stack.
    // For every polyline in the left viewer, try to find a corresponding
    // polyline in the right viewer. If found, change its color to match.
    DualViewWidget.prototype.MatchPolylines = function (tolerance) {
        tolerance = tolerance || 0.5;
        var widgets0 = this.Viewers[0].GetAnnotationLayer().GetWidgets();
        var widgets1 = this.Viewers[1].GetAnnotationLayer().GetWidgets();
        var note = this.saNote;

        var trans = note.ViewerRecords[note.StartIndex + 1].Transform;
        var sigma = this.Viewers[0].GetCamera().Height / 2;

        for (var i = 0; i < widgets0.length; ++i) {
            var w0 = widgets0[i];
            if (w0.Polyline) {
                var polyline0 = w0.Polyline;
                // get the center and area.
                var center0 = [(polyline0.Bounds[0]+polyline0.Bounds[1])*0.5,
                               (polyline0.Bounds[2]+polyline0.Bounds[3])*0.5];
                var size = Math.abs(polyline0.Bounds[1] - polyline0.Bounds[0])
                    + Math.abs(polyline0.Bounds[3]-polyline0.Bounds[2]);

                var area0 = polyline0.ComputeArea();
                var bestMatch;
                var bestPolyline;
                var bestIdx = -1;
                for (var j = 0; j < widgets1.length; ++j) {
                    var w1 = widgets1[j];
                    if (w1.Polyline) {
                        var polyline1 = w1.Polyline;
                        // get the center and area.
                        var center0b = trans.ForwardTransform(center0,size); //sigma);

                        var center1 = [(polyline1.Bounds[0]+polyline1.Bounds[1])*0.5,
                                       (polyline1.Bounds[2]+polyline1.Bounds[3])*0.5];
                        var area1 = polyline1.ComputeArea();
                        var dx = center1[0]-center0b[0];
                        var dy = center1[1]-center0b[1];
                        var match = (dx*dx + dy*dy + Math.abs(area1-area0))
                                       / area0;
                        if (bestIdx == -1 || match < bestMatch) {
                            bestMatch = match;
                            bestPolyline = w1;
                            bestIdx = j;
                        }
                    }
                }

                if (bestIdx == -1) {
                    // Should not happen
                    console.log("+++ No candidates: Widget"+i);
                } else if (bestMatch < tolerance) {
                    bestPolyline.Polyline.OutlineColor =
                        w0.Polyline.OutlineColor.slice(0);
                    console.log("+++ Match: Widget "+i+" = "+bestIdx+", ("+bestMatch+")");
                } else {
                    console.log("--- No match: Widget "+i+", Closest "+bestIdx+", ("+bestMatch+")");
                }
            }
        }

        this.EventuallyRender();
    }


    // For debugging called from console.
    // Resets the colors of the poly lines lin viewer 2 so we can see what
    // has changed when we run MatchPolylines
    // color is an array [1,1,1]
    DualViewWidget.prototype.SetPolylineColor = function (color) {
        var widgets1 = this.Viewers[1].GetAnnotationLayer().GetWidgets();

        for (var i = 0; i < widgets1.length; ++i) {
            var w1 = widgets1[i];
            if (w1.Polyline) {
                w1.Polyline.OutlineColor = color.slice(0);
            }
        }

        this.EventuallyRender();
    }


    SA.DualViewWidget = DualViewWidget;

})();


