//==============================================================================
// Is it time to switch to lowercase?  No.  I still like lower case for
// local variables. Upper case for instance variables 


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
}

// I want to hide the TabPanel object, so I return the div.
TabbedDiv.prototype.NewTabDiv = function (title) {
    var tabPanel = new TabPanel(this, title);
    this.TabPanels.push(tabPanel);
    // First panel added should be open by default.
    if (this.TabPanels.length == 1) {
        this.ShowTabPanel(tabPanel);
    }

    return tabPanel.Div;
}

// Private
TabbedDiv.prototype.ShowTabPanel = function (tabPanel) {
    for (var i = 0; i < this.TabPanels.length; ++i) {
        var otherTabPanel = this.TabPanels[i];
        otherTabPanel.Div.hide();
        // The z-index does not seem to be working.
        // When the panel is zoomed, Tab looks like it is on top.
        otherTabPanel.Tab.css({'color': '#AAA',
                               'z-index' : '4',
                               'border-color': '#BBB'});
        otherTabPanel.IsOpen = true;
    }

    tabPanel.Div.show();
    tabPanel.Tab.css({'color': '#000',
                      'z-index' : '6',
                      'border-color': '#BBB #BBB #FFF #BBB'});
}

TabbedDiv.prototype.ShowTabDiv = function (tabDiv) {
    for (var i = 0; i < this.TabPanels.length; ++i) {
        var tabPanel = this.TabPanels[i];
        if (tabPanel.Div == tabDiv) {
            this.ShowTabPanel(tabPanel);
        }
    }
}

TabbedDiv.prototype.ShowTabIndex = function (index) {
    if (index < 0 || index >= this.TabPanels.length) {
        console.log("ShowTabPanelIndex("+index +"): error"); 
        return;
    }
    this.ShowTabPanel(this.TabPanels[index]);
}


//==============================================================================


function TabPanel(tabbedDiv, title) {
    var self = this;
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
            tabbedDiv.ShowTabPanel(self);
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

    // I do not think this flag is used or needed.
    this.IsOpen = false;
}


//==============================================================================

