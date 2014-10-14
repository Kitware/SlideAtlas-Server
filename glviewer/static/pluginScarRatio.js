function Filter() {

};

function FilterColorThreshold() {
  Filter.call(this);

};

FilterColorThreshold.prototype = new Filter;


FilterColorThreshold.prototype.destructor=function() {
    // Get rid of the buffers?

}

FilterColorThreshold.prototype.Start = function() {
    alert("Scar Ratio plugin is not implemented")
}

function pluginScarRatio() {
    // Create a div
    var dialogDiv = $('<div>')
        .attr('id', 'scar_ratio_dialog')
        .attr('title', 'Color thresholding filter');

    // Add graphs
    graphs = ['hue', 'saturation', 'value'];

    for(var i = 0; i < graphs.length; i ++) {
        var chart = $('<img>')
            .attr('src', '/webgl-viewer/static/temp/' + graphs[i] + ".png")
            .attr('width','100%')
            .appendTo(dialogDiv);

        $('<br>').appendTo(dialogDiv);

    }

    $('<button>').appendTo(dialogDiv)
        .text('Update')
        .attr('id', 'updateButton');

    var dialog = dialogDiv.dialog();

    $('#updateButton').click(function() {
        alert("Ready to update !!");
    });

}