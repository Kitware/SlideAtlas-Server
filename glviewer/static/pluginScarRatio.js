/*




*/


function Filter() {

};

function FilterColorThreshold() {
    Filter.call(this);

    // Define the selectors

    this.selectors = {};
    this.selectors['hue'] = {range : [0, 360]};
    this.selectors['hue'] ={range: [0, 256]};
    this.selectors['saturation'] = {range: [0, 256]};

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
        .attr('id', 'updateButton')
        .click(function () {
            alert('About to update');
            $.ajax({url: '/webgl-viewer/get_mask',
                data: {
                    img : VIEWER1.MainView.Canvas[0].toDataURL('image/jpeg')
                }
            })
            .done(function(data) {
                that.histograms = data;
                that.Start()
            });
        })

    $('<br>').appendTo(dialogDiv);

    var dialog = dialogDiv.dialog({width: 500, height: 'auto'});

    $('#updateButton').click(function() {
        alert("Ready to update !!");
    });

}
