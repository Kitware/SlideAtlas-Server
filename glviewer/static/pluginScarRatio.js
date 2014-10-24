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
        .attr('title', 'Color thresholding filter')

    // Add graphs
    dialogDiv.dialog();
}