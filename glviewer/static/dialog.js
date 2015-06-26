

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

  this.Table =
    $('<table>')
      .appendTo(this.Dialog)
        .addClass("sa-view-dialog-table");

  this.Row1 = $('<tr>').appendTo(this.Table);
  this.Title =
    $('<td>')
      .appendTo(this.Row1)
      .addClass("sa-view-dialog-title")
      .text("Title");
  this.CloseButton =
    $('<td>')
      .appendTo(this.Row1)
      .addClass("sa-view-dialog-close")
        .text("Close");

    // Closure to pass a stupid parameter to the callback
    var self = this;
    (function () {
        self.CloseButton.click(function (e) {self.Hide(); e.preventDefault();});
    })();

  this.Row2 = $('<tr>').appendTo(this.Table);
  this.Space2a = $('<td>').appendTo(this.Row2).html("&nbsp");
  this.Space2b = $('<td>').appendTo(this.Row2).html("&nbsp");

  this.Row3 = $("<tr>").appendTo(this.Table);
  this.Body =
    $("<td colspan='2'>")
      .appendTo(this.Row3)
      .addClass("sa-view-dialog-body");

  this.Row4 = $('<tr>').appendTo(this.Table);
  this.Space4a = $('<td>').appendTo(this.Row4).html("&nbsp");
  this.Space4b = $('<td>').appendTo(this.Row4).html("&nbsp");

  this.Row5 = $("<tr>").appendTo(this.Table);
  this.ApplyDiv =
    $("<td colspan='2'>")
      .appendTo(this.Row5)
      .addClass("sa-view-dialog-apply-div")
  this.ApplyButton =
    $('<button>')
        .appendTo(this.ApplyDiv)
        .text("Apply")
        .addClass("sa-view-dialog-apply-button")
        .click(function (e) {
            (callback)();
            self.Hide();
            e.preventDefault();
        });
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
}

Dialog.prototype.Hide = function () {
  EVENT_MANAGER.HasFocus = true;
  this.Overlay.hide();
  this.Dialog.fadeOut(300);
} 


