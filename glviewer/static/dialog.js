

function Dialog(widget) {
  self = this;
  this.Overlay = 
    $('<div>')
      .appendTo('body')
      .css({
        'position': 'fixed',
        'top': '0',
        'right': '0',
        'bottom': '0',
        'left': '0',
        'height': '100%',
        'width': '100%',
        'margin': '0',
        'padding': '0',
        'background': '#000000',
        'opacity': '.25',
        'z-index': '101'})
      .hide();

  this.Dialog = 
    $('<div>')
      .appendTo('body')
      .css({
        'display': 'none',
        'position': 'fixed',
        'width': '380px',
        'top': '50%',
        'left': '50%',
        'margin-left': '-190px',
        'margin-top': '-100px',
        'background-color': '#ffffff',
        'border': '2px solid #336699',
        'padding': '0px',
        'z-index': '102',
        'font-family': 'Verdana',
        'font-size': '10pt'});

  this.Table = 
    $('<table>')
      .appendTo(this.Dialog)
        .css({
            'width': '100%',
            'border-spacing': '0px',
            'cellpadding': '3',
            'cellspacing': '0'});

  this.Row1 = $('<tr>').appendTo(this.Table);
  this.Title = 
    $('<td>')
      .appendTo(this.Row1)
      .css({
        'border-bottom': 'solid 2px #336699',
        'background-color': '#336699',
        'padding': '4px',
        'color': 'White',
        'font-weight':'bold'})
      .text("Title");
  this.CloseButton = 
    $('<td>')
      .appendTo(this.Row1)
      .css({
        'border-bottom': 'solid 2px #336699',
        'background-color': '#336699',
        'padding': '4px',
        'font-weight': 'bold',
        'color': 'White',
        'text-align': 'right',
        'text-decoration': 'none'})
      .text("Close")
      .click(function (e) {widget.Dialog.Hide(); e.preventDefault();});

  this.Row2 = $('<tr>').appendTo(this.Table);
  this.Space2a = $('<td>').appendTo(this.Row2).html("&nbsp");
  this.Space2b = $('<td>').appendTo(this.Row2).html("&nbsp");

  this.Row3 = $("<tr>").appendTo(this.Table);
  this.Body = 
    $("<td colspan='2'>")
      .appendTo(this.Row3)
      .css({'padding-left': '15px',
            'display': 'block'});

  this.Row4 = $('<tr>').appendTo(this.Table);
  this.Space4a = $('<td>').appendTo(this.Row4).html("&nbsp");
  this.Space4b = $('<td>').appendTo(this.Row4).html("&nbsp");

  this.Row5 = $("<tr>").appendTo(this.Table);
  this.ApplyDiv = 
    $("<td colspan='2'>")
      .appendTo(this.Row5)
      .css({'text-align': 'center'});
  this.ApplyButton =
    $('<button>')
      .appendTo(this.ApplyDiv)
      .text("Apply")
      .css({'margin-bottom': '6px'})
      .click(function (e) {
               widget.DialogApplyCallback();
               // This "self" trick does not work :( with multiple dialogs.
               // however "widget" does work.  Let widget handle hiding the dialog.
               //self.Hide();
               widget.Dialog.Hide();
               e.preventDefault(); });

}


Dialog.prototype.Show = function(modal) {
  var self = this;
  this.Overlay.show();
  this.Dialog.fadeIn(300);

  if (modal) {
    this.Overlay.unbind("click");
  } else {
    this.Overlay.click(function (e) { self.Hide(); });
  }
}

Dialog.prototype.Hide = function () {
  this.Overlay.hide();
  this.Dialog.fadeOut(300);
} 


