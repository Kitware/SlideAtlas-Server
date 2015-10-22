

function Dialog(callback) {
    this.Overlay =
        $('<div>')
        .appendTo('body')
        .addClass("sa-view-dialog-div")
        .hide();

    this.Dialog =
        $('<div>')
        .appendTo('body')
        .addClass("sa-view-dialog-div");

    this.Row1 = $('<div>')
        .addClass("sa-view-dialog-title")
        .appendTo(this.Dialog)
        .css({'width':'100%',
              'height':'2.25em',
              'box-sizing': 'border-box'});
    this.Title = $('<div>')
        .appendTo(this.Row1)
        .css({'float':'left'})
        .addClass("sa-view-dialog-title")
        .text("Title");
    this.CloseButton = $('<div>')
        .appendTo(this.Row1)
        .css({'float':'right'})
        .addClass("sa-view-dialog-close")
        .text("Close");

  this.Body =
    $('<div>')
        .appendTo(this.Dialog)
        .css({'width':'100%',
              'box-sizing': 'border-box',
              'margin-botton':'30px'});

    this.ApplyButtonDiv = $('<div>')
        .appendTo(this.Dialog)
        .addClass("sa-view-dialog-apply-div");
    this.ApplyButton = $('<button>')
        .appendTo(this.ApplyButtonDiv)
        .addClass("sa-view-dialog-apply-button")
        .text("Apply");

    // Closure to pass a stupid parameter to the callback
    var self = this;
    (function () {
        self.CloseButton.click(function (e) {self.Hide(); return false;});
        self.ApplyButton.click(function (e) {self.Hide(); (callback)(); return false;});
    })();

}


Dialog.prototype.Show = function(modal) {
    var self = this;
    this.Overlay.show();
    this.Dialog.fadeIn(300);

    if (modal) {
        EVENT_MANAGER.HasFocus = false;
        this.Overlay.unbind("click");
    } else {
        this.Overlay.click(function (e) { self.Hide(); });
    }
    CONTENT_EDITABLE_HAS_FOCUS = true; // blocks viewer events.
}

Dialog.prototype.Hide = function () {
    EVENT_MANAGER.HasFocus = true;
    this.Overlay.hide();
    this.Dialog.fadeOut(300);
    CONTENT_EDITABLE_HAS_FOCUS = false;
} 


