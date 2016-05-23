//==============================================================================
// Subclass of view that renders tiled images.


(function () {
    "use strict";


    function TileView (parent, useWebGL) {
        SAM.View.call(this, parent, useWebGL);

        // connectome : default section so we cen set cache
        this.Section = new Section;

        this.Tiles = []; // Not really used

        if (useWebGL) {
            this.gl = this.Canvas[0].getContext("webgl") || this.Canvas[0].getContext("experimental-webgl");
            GL = this.gl; //(hack)  Viewer clears the "shared" webgl canvas.
            // TODO: Fix this.
        }
        if (this.gl) {
            initWebGL(this.gl);
        } else {
            this.Context2d = this.Canvas[0].getContext("2d");
        }
    }
    TileView.prototype = new SAM.View;


    TileView.prototype.GetBounds = function() {
        return this.Section.GetBounds();
    }
    TileView.prototype.GetLeafSpacing = function() {
        return this.Section.GetLeafSpacing();
    }


    // connectome
    TileView.prototype.AddCache = function(cache) {
        if ( ! cache) { return; }
        this.Section.Caches.push(cache);
    }


    TileView.prototype.SetCache = function(cache) {
        // connectome
        if ( ! cache) {
            this.Section.Caches = [];
        } else {
            this.Section.Caches = [cache];
        }
    }

    TileView.prototype.GetCache = function() {
        // connectome: This makes less sense with a section with many caches.
        // TODO: try to get rid of this
        return this.Section.Caches[0];
    }

    // I want only the annotation to create a mask image.
    var MASK_HACK = false;
    // Note: Tile in the list may not be loaded yet.
    // Returns true if all the tiles to render were available.
    // False implies that the user shoudl render again.
    TileView.prototype.DrawTiles = function () {
        // Download view is not visible, but still needs to render tiles.
        // This causes black/blank download images
        //if ( ! this.CanvasDiv.is(':visible') ) {
        //    return;
        //}
        //console.time("  ViewDraw");
        if ( this.gl) {
            if (MASK_HACK ) {
                return;
            }
            return this.Section.Draw(this);
        } else {
            this.Clear();
            // Clear the canvas to start drawing.
            this.Context2d.fillStyle="#ffffff";
            //this.Context2d.fillRect(0,0,this.Viewport[2],this.Viewport[3]);

            // Start with a transform that flips the y axis.
            // This is an issue later because the images will be upside down.
            this.Context2d.setTransform(1, 0, 0, -1, 0, this.Viewport[3]);

            // Map (-1->1, -1->1) to the viewport.
            // Origin of the viewport does not matter because drawing is relative
            // to this view's canvas.
            this.Context2d.transform(0.5*this.Viewport[2], 0.0,
                                     0.0, 0.5*this.Viewport[3],
                                     0.5*this.Viewport[2],
                                     0.5*this.Viewport[3]);

            if (MASK_HACK ) {
                return;
            }
            return this.Section.Draw(this);
        }
    }

    SA.TileView = TileView;

})();




