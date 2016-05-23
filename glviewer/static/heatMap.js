
(function () {
    "use strict";


    function HeatMap(parent) {
        this.HeatMapDiv = $('<div>')
            .appendTo(this.Div)
            .css({'position':'absolute',
                  'left':'0px',
                  'top':'0px',
                  'border-width':'0px',
                  'width':'100%',
                  'height':'100%',
                  'box-sizing':'border-box',
                  'z-index':'150'})
            .addClass('sa-resize');

        this.HeatMapDiv.saOnResize(
            function() {
                self.View.UpdateCanvasSize();
                // Rendering will be a slave to the view because it needs the
                // view's camera anyway.
            });

        this.View = new SA.View(this.HeatMapDiv,true);

        var heatMapSource = new SlideAtlasSource();
        heatMapSource.Prefix = "/tile?img=560b4011a7a1412197c0cc76&db=5460e35a4a737abc47a0f5e3&name="
        var heatMapCache = new Cache();
        heatMapCache.TileSource = heatMapSource;
        heatMapCache.SetImageData(
            {levels:     12,
             dimensions: [419168, 290400, 1],
             bounds: [0,419167, 0, 290399, 0,0]});
        this.View.SetCache(heatMapCache);

        this.View.Camera.Load(
            {FocalPoint: [209808, 145200],
             Roll: 0,
             Height: 419617});
        this.View.Camera.ComputeMatrix();
        this.View.UpdateCanvasSize();
    }

    HeatMap.prototype.Draw = function (Camera* cam) {
        this.View.DrawTiles();
    }



    SA.HeatMap = HeatMap;

})();





