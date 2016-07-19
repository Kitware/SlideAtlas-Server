//==============================================================================
// Is it time to switch to lowercase?  No.  I still like lower case for
// local variables. Upper case for instance variables 

(function () {
    "use strict";


function TabbedDiv(parent) {
    // Default css can be changed by the caller.
    this.Div = $('<div>')
        .appendTo(parent)
        .css({'position':'relative',
              'width':'100%',
              'height':'100%'});
    // div for the tab buttons.
    this.TabDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'width':'100%',
              'height':'30px'});
    // div for the tab bodies.
    this.BodyDiv = $('<div>')
        .appendTo(this.Div)
        .css({'position':'absolute',
              'width':'100%',
              'top':'30px',
              'bottom':'0px'});

    this.TabPanels = [];
    this.CurrentTabPanel = null;
}

// I want to hide the TabPanel object, so I return the div.
TabbedDiv.prototype.NewTabDiv = function (label, helpString) {
    var tabPanel = new TabPanel(this, label);
    if (helpString) {
        tabPanel.Tab.prop('title', helpString);
    }
    this.TabPanels.push(tabPanel);
    // First panel added should be open by default.
    if (this.TabPanels.length == 1) {
        this.OpenTabPanel(tabPanel);
    }

    return tabPanel.Div;
}

// Private
TabbedDiv.prototype.OpenTabPanel = function (tabPanel) {
    if ( ! tabPanel) { return;}
    // close to previous tab
    // NOTE: If we only close the previous panel, tab buttons wrap to the next line
    for (var i = 0; i < this.TabPanels.length; ++i) {
        var panel = this.TabPanels[i];
        panel.Div.hide();
        // The z-index does not seem to be working.
        // When the panel is zoomed, Tab looks like it is on top.
        panel.Tab.css({'color': '#AAA',
                       'z-index' : '4',
                       'border-color': '#BBB'});
    }
    // open the new tab.
    tabPanel.Div.show();
    tabPanel.Tab.css({'color': '#000',
                      'z-index' : '6',
                      'border-color': '#BBB #BBB #FFF #BBB'});
    this.CurrentTabPanel = tabPanel;
    // The FillDiv callback does not work when the editor is hidden.  
    // Trigger onResize after the text tab is made visible.
    $(window).trigger('resize');
}

// Internal helper method
TabbedDiv.prototype.GetTabPanelFromDiv = function (tabDiv) {
    for (var i = 0; i < this.TabPanels.length; ++i) {
        var tabPanel = this.TabPanels[i];
        if (tabPanel.Div == tabDiv) {
            return tabPanel;
        }
    }
    return null;
}

// Internal helper method
TabbedDiv.prototype.GetTabPanelFromIndex = function (index) {
    if (index < 0 || index >= this.TabPanels.length) {
        console.log("GetTabPanelFromIndex("+index +"): error");
        return null;
    }
    return this.TabPanels[index];
}

TabbedDiv.prototype.ShowTabDiv = function (tabDiv) {
    this.OpenTabPanel(this.GetTabPanelFromDiv(tabDiv));
}

TabbedDiv.prototype.ShowTabIndex = function (index) {
    this.OpenTabPanel(this.GetTabPanelFromIndex(index));
}

TabbedDiv.prototype.EnableTabDiv = function (tabDiv) {
    var panel = this.GetTabPanelFromDiv(tabDiv);
    panel.Enabled = true;
    panel.Tab.show();
}

TabbedDiv.prototype.DisableTabDiv = function (tabDiv) {
    var panel = this.GetTabPanelFromDiv(tabDiv);
    if ( ! panel) { return;}

    panel.Enabled = false;
    if (panel == this.CurrentTabPanel) {
        this.CurrentTabPanel = null;
        // Find another panel to display.
        for ( var i = 0; i < this.TabPanels.length; ++i) {
            if (this.TabPanels[i].Enabled) {
                this.OpenTabPanel(this.TabPanel[i]);
                break;
            }
        }
    }

    panel.Tab.css({'color': '#AAA',
                   'z-index' : '4',
                   'border-color': '#BBB'});
    panel.Div.hide();
    panel.Tab.hide();
}


//==============================================================================


function TabPanel(tabbedDiv, title) {
    var self = this;
    this.Enabled = true;
    this.Tab = $('<div>')
        .appendTo(tabbedDiv.TabDiv)
        .text(title)
        .css({'color': '#AAA',
              'border-color': '#BBB',
              'position': 'relative',
              'bottom': '-2px',
              'padding' : '2px 7px 2px 7px',
              'margin'  : '5px 0px 0px 5px',
              'display': 'inline-block',
              'border-width': '1px',
              'border-style': 'solid',
              'border-radius': '5px 5px 0px 0px',
              'position': 'relative',
              'z-index' : '6',
              'background': 'white'})
        .click(function(){
            tabbedDiv.OpenTabPanel(self);
        });
    this.Div = $('<div>')
        .hide()
        .appendTo(tabbedDiv.BodyDiv)
        .css({'position':'absolute',
              'top':'0px',
              'bottom':'3px',
              'left':'3px',
              'right':'3px',
              'border-width': '1px',
              'border-style': 'solid',
              'border-color': '#BBB',
              'z-index' : '5',
              'background': 'white'})

}


//==============================================================================

    SA.TabbedDiv = TabbedDiv;
    SA.TabPanel = TabPanel;
})();
