// Tabbed gui.

// Closure namespace
Tab = (function () {

    var Tabs = [];

    // If a tabbed object is specified, only one tab for the object
    // will be allowed open at a time.
    function Tab (imageSrc, tabID) {
        var self = this; // trick to set methods in callbacks.

        this.Div = $('<div>')
            .appendTo(VIEW_PANEL)
            .attr('id', tabID)
            .addClass('sa-view-div');

        // Button has to have the border (not the tab) to be covered by Div.
        this.Button = $('<img>')
            .appendTo(this.Div)
            .attr('type','image')
            .attr('src',imageSrc)
            .addClass("sa-view-button")
            .click(function(){self.TogglePanel();})
            .attr('draggable','false')
            .on("dragstart", function() {
                return false;});


        this.Panel = $('<div>')
            .appendTo(this.Div)
            .hide()
            .addClass("sa-view-panel");

        Tabs.push(this);

        // I need to maintain this state even when the whole tab is not
        // visible.
        this.PanelOpen = false;
    }


    Tab.prototype.show = function() {
        this.Div.show();
    }
    Tab.prototype.hide = function() {
        this.Div.hide();
    }


    Tab.prototype.TogglePanel = function() {
        if (this.PanelOpen) {
            this.PanelOff();
        } else {
            this.PanelOn();
        }
    }


    Tab.prototype.PanelOn = function() {
        if (this.PanelOpen) { return; }
        this.PanelOpen = true;

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
        this.Button.addClass("sa-active")
    }

    Tab.prototype.PanelOff = function() {
        this.PanelOpen = false;
        this.Panel.hide();
        this.Button.removeClass("sa-active")
    }



    // Export the tab object.
    return Tab;
})();
    
    

