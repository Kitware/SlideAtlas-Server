/*




*/


function Filter() {

};

function FilterColorThreshold() {
    Filter.call(this);

    // Define the selectors
    this.selectors = {};
    this.selectors['hue'] = {range : [0, 360]};
    this.selectors['saturation'] ={range: [0, 256]};
    this.selectors['value'] = {range: [0, 256]};

    // Current range is the default range
    for(var key in this.selectors) {
        if(this.selectors.hasOwnProperty(key)) {
            this.selectors[key].current = this.selectors[key].range;
        }
    }
};

FilterColorThreshold.prototype = new Filter;


FilterColorThreshold.prototype.destructor=function() {
    // Get rid of the buffers?

}

FilterColorThreshold.prototype.Init = function() {
  // Gets the graphs and constructs the dialog
    var that=this;

    $.ajax({url: '/webgl-viewer/get_image_histograms',
        data: {
            img : VIEWER1.MainView.Canvas[0].toDataURL('image/jpeg')
        }
    })
    .done(function(data) {
        that.histograms = data;
        that.Start()
    });
}

FilterColorThreshold.prototype.Start = function() {
    var that = this;
    // Create a div
    var dialogDiv = $('<div>')
        .attr('id', 'scar_ratio_dialog')
        .attr('title', 'Color thresholding filter');

    // Add graphs
    var values = {};

    for(var key in this.selectors) {
        if(this.selectors.hasOwnProperty(key)) {
            selector = this.selectors[key];
            $('<h3>' + key  + ' <span id="value_' + key + '"> </span> </h3>').appendTo(dialogDiv);

            $('<img>')
                .attr('src', 'data:image/png;base64,' + this.histograms[key])
                .attr('width','100%')
                .appendTo(dialogDiv);

            $('<br>').appendTo(dialogDiv);
            selector.sliderDiv = $('<div>').appendTo(dialogDiv);
            $(selector.sliderDiv).data({key : key});
            selector.sliderDiv.slider({
                range:true,
                min: selector.range[0],
                max: selector.range[1],
                values: selector.current,
                slide: function( event, ui ) {
                    key = $(event.target).data('key');
                    selector = that.selectors[key];
                    selector.current = ui.values;
                    $('#value_' + key).html('' + JSON.stringify(selector.current));
                }
            });
        }
    }

    $('<button>').appendTo(dialogDiv)
        .text('Update')
        .click(function () {
            // alert('About to update');
            $.ajax({url: '/webgl-viewer/get_mask',
                data: {
                    img : VIEWER1.MainView.Canvas[0].toDataURL('image/jpeg'),

                    hmin: that.selectors["hue"].current[0],
                    hmax: that.selectors["hue"].current[1],

                    smin: that.selectors["saturation"].current[0],
                    smax: that.selectors["saturation"].current[1],

                    vmin: that.selectors["value"].current[0],
                    vmax: that.selectors["value"].current[1],
                }
            })
            .done(function(data) {
                // show the image popup
                that.mask = data["mask"]
                // alert("Got the image !");
                var img = new Image();
                img.src = 'data:image/png;base64,' + that.mask;
                VIEWER1.MainView.Context2d.drawImage(img, 0, 0);

            });
        })

    $('<br>').appendTo(dialogDiv);

    var dialog = dialogDiv.dialog({width: 500, height: 'auto'});
}
