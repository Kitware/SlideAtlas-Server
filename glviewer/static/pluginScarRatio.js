/*




*/


function Filter() {

};

function FilterColorThreshold() {
  Filter.call(this);
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
        that.Start()
    });
}

FilterColorThreshold.prototype.Start = function() {




    // Create a div
    var dialogDiv = $('<div>')
        .attr('id', 'scar_ratio_dialog')
        .attr('title', 'Color thresholding filter');

    // Add graphs
    var selectors = [ { name: 'hue', max: 360}, { name: 'saturation', max: 256} , {name: 'value', max: 256}];

    for(var i = 0; i < selectors.length; i ++) {
        $('<h3>' + selectors[i].name  + ' </h3>').appendTo(dialogDiv);

        $('<img>')
            .attr('src', '/webgl-viewer/static/temp/' + selectors[i].name + ".png")
            .attr('width','100%')
            .appendTo(dialogDiv);

        $('<br>').appendTo(dialogDiv);
        selectors[i].sliderDiv = $('<div>').appendTo(dialogDiv);
        selectors[i].sliderDiv.slider({
            range:true,
            min: 0,
            max: selectors[i].max,
            values: [ 0, selectors[i].max ],
        });

    }

    $('<button>').appendTo(dialogDiv)
        .text('Update')
        .attr('id', 'updateButton');

    $('<br>').appendTo(dialogDiv);

    var dialog = dialogDiv.dialog({width: 500, height: 'auto'});

    $('#updateButton').click(function() {
        alert("Ready to update !!");
    });

}
