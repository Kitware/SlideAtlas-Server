//==============================================================================
// A gui for vigilant that controls layers in multiple viewers.


(function () {
    "use strict";


    function LayerView (parent, label) {
        this.Layers = [];
        this.Label = label;
        this.Color = [Math.random(),Math.random(),Math.random()];

        this.Initialize(parent,label);
    }

    LayerView.prototype.AddLayer = function (layer) {
        this.Layers.push(layer);
        if (this.CheckBox && this.Slider) {
            this.UpdateLayer(layer);
        }
    }

    // Initialize the gui / dom
    LayerView.prototype.Initialize = function (parent, label) {
        var self = this;

        // The wrapper div that controls a single layer.
        var layer_control = $('<div>')
            .appendTo(parent)
            .css({ 'border': '1px solid #CCC', 'width': '100%',
                   'height': '65px' });

        // the sub-div that holds the direct toggle and the label.
        var toggle_wrapper = $('<div>')
            .appendTo(layer_control)
            .css({ 'border': '1px solid #CCC', 'width': '20%',
                   'height': '100%', 'float': 'left' });

        this.CheckBox = $('<input type="checkbox">')
            .appendTo(toggle_wrapper)
            .on('change',
                function(){
                    self.CheckCallback();
                })
            .prop('checked', true);

        var layer_label = $('<div>')
            .appendTo(toggle_wrapper)
            .html(label);

        // Wrapper for the confidence slider.
        var conf_wrapper = $('<div>')
            .appendTo(layer_control)
            .css({ 'border': '1px solid #CCC', 'width': '60%',
                   'height': '100%', 'float': 'left' });

        this.Slider = $('<input type="range" min="75" max="100">')
            .appendTo(conf_wrapper)
            .on('input',
                function(){
                    self.SliderCallback();
                });
        //this.Slider[0].min = 75;

        var min_label = $('<div>')
            .appendTo(conf_wrapper)
            .html("75%")
            .css({ 'float': 'left' });

        var max_label = $('<div>')
            .appendTo(conf_wrapper)
            .html("100%")
            .css({ 'float': 'right' });

        var color_wrapper = $('<div>')
            .appendTo(layer_control)
            .css({ 'border': '1px solid #CCC',
                   'width': '20%',
                   'padding':'5px',
                   'height': '100%', 
                   'float': 'left' });
        this.ColorInput = $('<input type="color">')
            .appendTo(color_wrapper)
            .val(SAM.ConvertColorToHex(this.Color))
            .change(function () {
                self.ColorCallback();
            });

    }

    LayerView.prototype.ColorCallback = function () {
        this.Color = SAM.ConvertColor(this.ColorInput.val());
        for (var i = 0; i < this.Layers.length; ++i) {
            this.UpdateLayer(this.Layers[i]);
        }
    }

    LayerView.prototype.CheckCallback = function () {
        var checked = this.CheckBox.prop('checked');
        for (var i = 0; i < this.Layers.length; ++i) {
            this.Layers[i].SetVisibility(checked);
            this.Layers[i].EventuallyDraw();
        }
    }

    LayerView.prototype.SliderCallback = function () {
        for (var i = 0; i < this.Layers.length; ++i) {
            this.UpdateLayer(this.Layers[i]);
        }
    }

    LayerView.prototype.UpdateLayer = function (layer) {
        var checked = this.CheckBox.prop('checked');
        layer.SetVisibility(checked);
        if (checked) {
            var vis_value = parseInt(this.Slider.val()) / 100.0;
            for (var w_index = 0; w_index < layer.WidgetList.length; w_index++){
                var widget = layer.WidgetList[w_index];
                widget.Visibility = (widget.confidence > vis_value);
                widget.Shape.SetOutlineColor(this.Color);
            }
        }
        layer.EventuallyDraw();
    }

    SA.LayerView = LayerView;

})();




