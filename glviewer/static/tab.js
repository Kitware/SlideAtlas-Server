// Tabbed gui.

// Closure namespace
Tab = (function () {

    var Tabs = [];

    // If a tabbed object is specified, only one tab for the object
    // will be allowed open at a time.
    function Tab (imageSrc) {
        var self = this; // trick to set methods in callbacks.

        this.Div = $('<div>')
            .appendTo(VIEW_PANEL)
            .attr('id', 'debug')
            .css({'z-index' : '5',
                  'position': 'absolute'});

        // Button has to have the border (not the tab) to be covered by Div.
        this.Button = $('<img>')
            .appendTo(this.Div)
            .attr('type','image')
            .attr('src',imageSrc)
            .css({'height': '28px',
                  'padding' : '2px',
                  'border-width': '1px',
                  'border-style': 'solid',
                  'border-radius': '5px',
                  'border-color': '#BBB',
                  'opacity': '0.6',
                  'background-color': '#FFF',
                  'position': 'relative',
                  'z-index' : '5'})
            .click(function(){self.TogglePanel();});

        this.Panel = $('<div>')
            .appendTo(this.Div)
            .hide()
            .css({
                'background-color': 'white',
                'border-style': 'solid',
                'border-width': '1px',
                'border-radius': '5px',
                'border-color': '#BBB',
                'position': 'absolute',
                'bottom': '37px',
                'left':  '-5px',
                'z-index': '4',
                'padding': '2px 2px 0px 2px'});

        Tabs.push(this);
    }


    Tab.prototype.TogglePanel = function() {
        if (this.Panel.is(":visible")) {
            this.PanelOff();
        } else {
            this.PanelOn();
        }
    }


    Tab.prototype.PanelOn = function() {
        if (this.Panel.is(":visible")) { return; }

        // position returns 0 if panel is hidden.
        this.Panel.show();

        // Close tabs that overlap.
        var minX0 = this.Panel.offset().left;
        var maxX0 = minX0 + this.Panel.outerWidth();
        for (var i = 0; i < Tabs.length; ++i) {
            if (Tabs[i] !== this) {
                var minX1 = Tabs[i].Panel.offset().left;
                var maxX1 = minX1 + Tabs[i].Panel.outerWidth();
                // Overlap
                minX1 = Math.max(minX0,minX1);
                maxX1 = Math.min(maxX0,maxX1);
                if (minX1 < maxX1) {
                    Tabs[i].PanelOff();
                }
            }
        }

        // Make the tab look like it is part of the panel.
        this.Button.css({'border-color': '#FFF #BBB #BBB #BBB',
                         'border-radius': '0px 0px 5px 5px',
                         'opacity': '1'});
    }

    Tab.prototype.PanelOff = function() {
        this.Panel.hide();
        this.Button.css({'border-color': '#BBB',
                         'border-radius': '5px',
                         'opacity': '0.6'});
    }



    // Export the tab object.
    return Tab;
})();
    
    

