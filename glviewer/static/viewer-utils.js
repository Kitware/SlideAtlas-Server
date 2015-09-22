// TODO: 
// Generalize the text dialog to have components from any sa element.



//==============================================================================
// A common parent for all sa buttons (for this element).
// Handle showing and hiding buttons.  Internal helper.

function saGetButtonsDiv(element) {
    if ( ! element.saButtons) {
        // Edit buttons.
        var helper = new saButtons($(element));
        element.saButtons = helper;

    }

    return element.saButtons.ButtonsDiv;
}

function saButtons (div) {
    this.Enabled = true;
    this.Div = div;
    this.TimerId = -1;
    var pos = div.position();
    this.ButtonsDiv = $('<div>')
        .appendTo(div.parent())
        .addClass('sa-edit-gui') // So we can remove it when saving.
        .hide()
        .css({'position':'absolute',
              'left'  :(pos.left+10)+'px',
              'top'   :(pos.top-20) +'px',
              'width' :'300px', // TODO: see if we can get rid of the width.
              'z-index': '10'}); 
    // Show the buttons on hover.
    var self = this;
    this.ButtonsDiv
        .mouseenter(function () { self.ShowButtons(); })
        .mouseleave(function () { self.HideButtons(); });

    this.Div
        .mouseenter(function () { self.ShowButtons(); })
        .mouseleave(function () { self.HideButtons(); });
}

saButtons.prototype.PlaceButtons = function () {
    var pos = this.Div.position();
    this.ButtonsDiv
        .css({'left'  :(pos.left+10)+'px',
              'top'   :(pos.top-20) +'px'});
}

saButtons.prototype.ShowButtons = function () {
    if (this.TimerId >= 0) {
        clearTimeout(this.TimerId);
        this.TimerId = -1;
    }
    if (this.Enabled) {
        this.PlaceButtons();
        this.ButtonsDiv.show();
    }
}

saButtons.prototype.HideButtons = function () {
    if (this.TimerId < 0) {
        var self = this;
        this.TimerId =
            setTimeout(function () {self.ButtonsDiv.hide();}, 200);
    }
}


function saAddButton (element, src, tooltip, callback) {
    var buttonsDiv = saGetButtonsDiv(element);
    var button = $('<img>')
        .appendTo(buttonsDiv)
        .addClass('editButton')
        .attr('src',src);
    if (callback) {
        button.click(callback);
    }

    if (tooltip) {
        button.prop('title', tooltip);
    }

    return button;
}

// privatex functions.
// TODO: Make an api through jquery to do this.
function saButtonsDisable (element) {
    if ( ! element.saButtons) { return; }
    element.saButtons.Enabled = false;
    element.saButtons.ButtonsDiv.hide();
}

function saButtonsEnable (element) {
    if ( ! element.saButtons) { return; }
    element.saButtons.Enabled = true;
}

// Remove the buttons div.
function saButtonsDelete (element) {
    if ( ! element.saButtons) { return; }
    element.saButtons.ButtonsDiv.remove();
}



//==============================================================================
// Load html into a div just like .html, but setup slide atlas jquery
// extensions.  The state of these extensions is saved in attributes.
// The extension type is saved as a class.

jQuery.prototype.saHtml = function(string) {
    if (string) {
        this.html(string);
        this.find('.sa-text-editor').saTextEditor();
        this.find('.sa-scalable-font').saScalableFont();
        this.find('.sa-full-window-option').saFullWindowOption();
        // We need to load the note.
        viewDivs = this.find('.sa-presentation-view');
        viewDivs.saViewer();

        for (var i = 0; i < viewDivs.length; ++i) {
            var viewer = viewDivs[i].saViewer;
            var noteId = $(viewDivs[i]).attr('sa-note-id');
            var viewerIdx = $(viewDivs[i]).attr('sa-viewer-index') || 0;
            viewerIdx = parseInt(viewerIdx);
            if (noteId) {
                // TODO: Rethink this.
                // The viewer does not actually keep a refrence to the note.
                // We may not even care if we load a sceond copy of the
                // note. So when changes are made, the note is important.
                var note = GetNoteFromId(noteId);
                if (note) {
                    note.ViewerRecords[viewerIdx].Apply(viewer);
                    viewer.saNote = note;
                    viewer.saViewerIndex = viewerIdx;
                }
            }
        }

        if (EDIT) {
            var items = this.find('.sa-resizable');
            items.saResizable();
            items = this.find('.sa-deletable');
            items.saDeletable();
            items = this.find('.sa-draggable');
            items.saDraggable();
            items = this.find('.sa-presentation-image');
            for (var i = 0; i < items.length; ++i) {
                var item = items[i];
                saPresentationImageSetAspect($(item))
            }
            // Why did these disapear?  Put the back.
            // I do not think it wil hurt to call saResizable twice.
            items = this.find('.sa-presentation-view');
            items.saResizable();
        }

        return;
    }

    // Add an attribute to the sa-presentation-view that spcifies which
    // view id is being displayed. The view is set programatically, not
    // through jquery api. Also, the note may not have an id until we are
    // ready to save.
    // TODO: Get rid of sa-presentation-view class and just use sa-viewer
    var views = this.find('.sa-presentation-view');
    for (var i = 0; i <  views.length; ++i) {
        var viewer = views[i].saViewer;
        var note = viewer.saNote;
        if ( ! note ) {
            console.log("Warning: Note is not saved and has no id.");
        } else if (note.Id) {
            $(views[i]).attr('sa-note-id',note.Id);
        } else if (note.TempId) {
            $(views[i]).attr('sa-note-id',note.TempId);
        }
        var viewerIndex = viewer.saViewerIndex || 0;
        $(views[i]).attr('sa-viewer-index', viewerIndex);
    }

    // Get rid of the gui elements when returning the html.
    var copy = this.clone();
    copy.find('.sa-edit-gui').remove();
    copy.find('.ui-resizable-handle').remove();

    // Get rid of the children of the sa-presentation-view.
    // They will be recreated by viewer when the html is loaded.
    copy.find('.sa-presentation-view').empty();

    return copy.html();
}

function saPresentationImageSetAspect(div) {
    var img = div.find('img');
    img.load(function () {
        // compute the aspect ratio.
        var aRatio = $(this).width() / $(this).height();
        div.saResizable({
            aspectRatio: aRatio,
        });
    });
}


//==============================================================================
// Just add the feature of setting width and height as percentages.

jQuery.prototype.saResizable = function(args) {
    args = args || {};
    args.start = function (e, ui) {
        if ( this.saViewer ) {
            // Translate events were being triggered in the viewer.
            this.saViewer.Focus = false;
        }
    };
    args.stop = function (e, ui) {
        if ( this.saViewer ) {
            // Translate events were being triggered in the viewer.
            this.saViewer.Focus = true;
        }
        // change the width to a percentage.
        var width = $(this).width();
        width = 100 * width / $(this).parent().width();
        this.style.width = width.toString()+'%';
        // change the height to a percentage.
        var height = $(this).height();
        height = 100 * height / $(this).parent().height();
        this.style.height = height.toString()+'%';

        // We have to change the top and left ot percentages too.
        // I might have to make my own resizable to get the exact behavior
        // I want.
        var pos  = $(this).position();
        var top  = 100 * pos.top / $(this).parent().height();
        var left = 100 * pos.left / $(this).parent().width();
        this.style.top  = top.toString()+'%';
        this.style.left = left.toString()+'%';
    };

    this.resizable(args);
    this.addClass('sa-resizable');

    return this;
}




//==============================================================================
// Attempting to make the viewer a jqueryUI widget.
// Note:  It does not make sense to call this on multiple divs at once when
//        the note/view is being set.
// args = {overview:true, 
//         zoomWidget:true,
//         viewId:"55f834dd3f24e56314a56b12", note: {...}
//         viewerIndex: 0,
//         hideCopyright: false}
// viewId (which loads a note) or a preloaded note can be specified.
// the viewId has precedence over note if both are given.
// viewerIndex of the note defaults to 0.
// Note: hideCopyright will turn off when a new note is loaded.
jQuery.prototype.saViewer = function(args) {
    // default
    args = args || {};
    // This is ignored if there is not viewId or note.
    args.viewerIndex = args.viewerIndex || 0;
    // get the note object if an id is specified.
    if (args.viewId) {
        args.note = GetNoteFromId(args.viewId);
        if (args.note == null) {
            // It has not been loaded yet.  Get if from the server.
            args.note = new Note();
            var self = this;
            args.note.LoadViewId(
                args.viewId,
                function () {
                    saViewerSetup(self, args);
                });
            return this;
        }
    }
    saViewerSetup(this, args);
    return this;
}

function saViewerSetup(self, args) {
    for (var i = 0; i < self.length; ++i) {
        if ( ! self[i].saViewer) {
            // Add the viewer as an instance variable to the dom object.
            self[i].saViewer = new Viewer($(self[i]), args);
            // TODO: Get rid of the event manager.
            EVENT_MANAGER.AddViewer(self[i].saViewer);

            // When the div resizes, we need to synch the camera and
            // canvas.
            self[i].onresize =
                function () {
                    this.saViewer.UpdateSize();
                }
            // Only the body seems to trigger onresize.  We need to trigger
            // it explicitly (from the body onresize function).
            $(self[i]).addClass('sa-resize');
        }
        var viewer = self[i].saViewer;
        // TODO:  Handle overview and zoomWidget options
        if (args.note) {
            viewer.saNote = args.note;
            viewer.saViewerIndex = args.viewerIndex;
            args.note.ViewerRecords[args.viewerIndex].Apply(viewer);
        }
        if (args.hideCopyright) {
            viewer.CopyrightWrapper.hide();
        }
    }
}

// This put changes from the viewer in to the note.
// Is there a better way to do this?
// Maybe a save method?
jQuery.prototype.saRecordViewer = function() {
    for (var i = 0; i < this.length; ++i) {
        if (this[i].saViewer.saNote && this[i].saViewer) {
            var idx = this[i].saViewer.saViewerIndex || 0;
            this[i].saViewer.saNote.ViewerRecords[idx].CopyViewer(this[i].saViewer);
        }
    }
}
    



//==============================================================================
// jQuery extension for a full window div.
// parent must be the body?  Maybe not.  Lets see if a full height is better.
// I think position should be set to fixed or absolute.

// TODO: Convert the viewer to use this.

// Args: not used
jQuery.prototype.saFullHeight = function(args) {
    this.css({'top':'0px'});
    this.addClass('sa-full-height');
    for (var i = 0; i < this.length; ++i) {
        // I want to put the resize event on "this[i]",
        // but, I am afraid it might not get trigerend always, or
        // setting the height would cause recursive calls to resize.
        this[i].saFullHeight = args;
    }

    $(window).resize(
        function() {
            var height = window.innerHeight;
            var width = window.innerWidth;
            var top = 0;
            var left = 0;
            items = $('.sa-full-height');
            for (var i = 0; i < items.length; ++i) {
                item = items[0];
                $(item).css({'top': '0px',
                             'height': height+'px'});
            }
            // Hack until I can figure out why the resize event is not
            // firing for descendants.
            // This did not work.  It also triggered resize on the window
            // causeing infinite recusion.
            //$('.sa-resize').trigger('resize');
            // call onresize manually.
            var elements = $('.sa-resize');
            for (var i = 0; i < elements.length; ++i) {
                if (elements[i].onresize) {
                    elements[i].onresize();
                }
            }
        })
        .trigger('resize');

    return this;
}


//==============================================================================
// Make this window as large as possible in parent, but keep the aspect
// ratio. This is for presentation windows.
// Note:  Position of parent has to be not static.
//        Should I make the position relative rather than absolute?
jQuery.prototype.saPresentation = function(args) {
    this.addClass('sa-presentation');
    this.addClass('sa-resize');
    for (var i = 0; i < this.length; ++i) {
        var item = this[i];
        if ( ! item.saPresentation) {
            item.onresize =
                function () {
                    var ar = this.saPresentation.aspectRatio;
                    var parent = item.parentNode;
                    var width = $(parent).innerWidth();
                    var height = $(parent).innerHeight();
                    var top = 0;
                    var left = 0;
                    if (width / height > ar) {
                        // Window is too wide.
                        var tmp = width - (height * ar);
                        width = width - tmp;
                        left = tmp / 2;
                    } else {
                        // Window is too tall.
                        var tmp = height - (width / ar);
                        height = height - tmp;
                        top = tmp / 2;
                    }
                    $(this).css({
                        'position': 'absolute',
                        'top': top+'px',
                        'height': height+'px',
                        'left': left+'px',
                        'width': width+'px'});
                };
        }
        item.saPresentation = {aspectRatio: args.aspectRatio};
        // Trouble if their is more than 1.  Maybe trigger
        // a window resize?
        setTimeout(function(){ item.onresize(item); }, 300);
    }

    return this;
}



//==============================================================================
// Font is set as a percentage of the parent height.
// args.size: string i.e. "12%" More work would be needed to make this
// units in pixels.
jQuery.prototype.saScalableFont = function(args) {
    this.addClass('sa-scalable-font');
    this.addClass('sa-resize');

    for (var i = 0; i < this.length; ++i) {
        var text = this[i];
        if ( ! text.saScalableFont) {
            text.onresize =
                function () {
                    scale = this.saScalableFont.scale;
                    // Scale it relative to the window.
                    var height = $(this).parent().innerHeight();
                    fontSize = Math.round(scale * height) + 'px';
                    this.style.fontSize = fontSize;
                    // Getting and setting the html creates text chidlren
                    // with their own font size.
                    $(this).children('font').css({'font-size':fontSize});
                };
            text.saScalableFont = {};
            text.saScalableFont.scale = 0.1;
        }
        var scale = text.saScalableFont.scale;
        // html() saves this attribute.
        // this will restore the scale.
        var scaleStr = text.getAttribute('sa-font-scale');
        if (scaleStr) {
            scale = parseFloat(scaleStr);
        }
        // This overrides the previous two.
        if (args && args.scale) {
            // convert to a decimal.
            scale = args.scale;
            if (typeof(scale) == "string") {
                if (scale.substring(-1) == "%") {
                    scale = parseFloat(scale.substr(0,str.length-1))/100;
                } else {
                    scale = parseFloat(scale);
                }
            }
        }
        // I can either keep this up to date or set it when the
        // saHtml is called. Keeping it set is more local.
        text.setAttribute('sa-font-scale', scale.toString());
        text.saScalableFont.scale = scale;
        text.onresize();
    }

    return this;
}



//==============================================================================
// draggable with a handle
// TODO: This uses percentages now.  Exxtend with the option to position
// with pixel units.

jQuery.prototype.saDraggable = function() {
    this.addClass('sa-draggable');
    for (var i = 0; i < this.length; ++i) {
        if ( ! this[i].saDraggable) {
            var helper = new saDraggable($(this[i]));
            // Add the helper as an instance variable to the dom object.
            this[i].saDraggable = helper;
        }
    }

    return this;
}

function saDraggable(div) {
    this.Percentage = true;
    this.Div = div;
    var self = this;
    var d = saAddButton(div[0], 'webgl-viewer/static/fullscreen.png', 'drag');
    d.mousedown(
        function (e) {
            self.OldX = e.pageX;
            self.OldY = e.pageY;
            $('body').on('mousemove.saDrag',
                      function (e) {
                          self.Drag(e.pageX-self.OldX, e.pageY-self.OldY);
                          self.OldX = e.pageX;
                          self.OldY = e.pageY;
                          return false;
                      });
            $('body').on('mouseup.saDrag',
                      function (e) {
                          $('body').off('mousemove.saDrag');
                          $('body').off('mouseup.saDrag');
                          return false;
                      });
            return false;
        });
}

saDraggable.prototype.Drag = function(dx, dy) {
    var pos = this.Div.position();

    var x = pos.left + dx;
    var y = pos.top + dy;
    if (this.Percentage) {
        x = 100 * x / this.Div.parent().width();
        y = 100 * y / this.Div.parent().height();
        this.Div[0].style.left = x.toString()+'%';
        this.Div[0].style.top = y.toString()+'%';
    } else {
        this.Div[0].style.left = x+'px';
        this.Div[0].style.top = y+'px';
    }

    this.Div[0].saButtons.PlaceButtons();
}



//==============================================================================
// Option to go full window.  This is intended for viewers, but might be
// made general.

// TODO: We need callbacks when it goes full and back.
jQuery.prototype.saFullWindowOption = function(args) {
    this.addClass('sa-full-window-option');
    for (var i = 0; i < this.length; ++i) {
        if ( ! this[i].saFullWindowOption) {
            var helper = new saFullWindowOption($(this[i]));
            // Add the helper as an instance variable to the dom object.
            this[i].saFullWindowOption = helper;
        }
    }

    return this;
}

function saFullWindowOption(div) {
    var self = this;
    this.FullWindowOptionButton = $('<img>')
        .appendTo(div)
        .attr('src',"webgl-viewer/static/fullscreenOn.png")
        .prop('title', "full window")
        .css({'position':'absolute',
              'width':'12px',
              'left':'-5px',
              'top':'-5px',
              'opacity':'0.5',
              'z-index':'-1'})
        .hover(function(){$(this).css({'opacity':'1.0'});},
               function(){$(this).css({'opacity':'0.5'});})
        .click(function () {
            self.SetFullWindow(div, true);
        });

    this.FullWindowOptionOffButton = $('<img>')
        .appendTo(div)
        .hide()
        .attr('src',"webgl-viewer/static/fullscreenOff.png")
        .prop('title', "full window off")
        .css({'position':'absolute',
              'background':'#FFF',
              'width':'16px',
              'left':'1px',
              'top':'1px',
              'opacity':'0.5',
              'z-index':'1'})
        .hover(function(){$(this).css({'opacity':'1.0'});},
               function(){$(this).css({'opacity':'0.5'});})
        .click(function () {
            self.SetFullWindow(div, false);
        });
}

// TODO: Turn off other editing options: drag, delete, resize.
saFullWindowOption.prototype.SetFullWindow = function(div, flag) {
    if (flag) {
        // TODO: Put this in a call back.
        //PRESENTATION.EditOff();
        //this.BottomDiv.hide();
        //this.ViewPanel.css({'height':'100%'});
        saButtonsDisable(div[0]);
        this.FullWindowOptionOffButton.show();
        this.FullWindowOptionButton.hide();
        // Save the css values to undo.
        this.Left = div[0].style.left;
        this.Width = div[0].style.width;
        this.Top = div[0].style.top;
        this.Height = div[0].style.height;
        this.ZIndex = div[0].style.zIndex;
        div.css({'left'   : '0px',
                 'width'  : '100%',
                 'top'    : '0px',
                 'height' : '100%',
                 'z-index': '10'});
    } else {
        saButtonsEnable(div[0]);
        this.FullWindowOptionOffButton.hide();
        this.FullWindowOptionButton.show();
        div.css({'left'   : this.Left,
                 'width'  : this.Width,
                 'top'    : this.Top,
                 'height' : this.Height,
                 'z-index': this.ZIndex});
    }
    // The viewers need a resize event to change their cameras.
    $(window).trigger('resize');
}


//==============================================================================
// Add a delete button to the jquery objects.

jQuery.prototype.saDeletable = function(args) {
    this.addClass('sa-deletable');
    for (var i = 0; i < this.length; ++i) {
        var item = this[i];
        if ( ! item.saDeletable) {
            // for closure (save element)
            item.saDeletable = new saDeletable(item);
        }
    }
    return this;
}

function saDeletable(item) {
    this.Button = saAddButton(
        item, 'webgl-viewer/static/remove.png', 'delete',
        function () {
            // if we want to get rid of the viewer records,
            if (item.saViewer) { saPruneViewerRecord(item.saViewer);}
            saButtonsDelete(item);
            $(item).remove();
        });
}

function saPruneViewerRecord(viewer) {
    // In order to prune, we will need to find the other viewers associated
    // with records in the notes.
    // This is sort of hackish.
    var viewerIdx = viewer.saViewerIndex;
    var note = viewer.saNote;
    var items = $('.sa-presentation-view');
    // Shift all the larger indexes down one.
    for (var i = 0; i < items.length; ++i) {
        if (items[i].saViewer &&
            items[i].saViewer.saNote == note &&
            items[i].saViewer.saViewerIndex > viewerIdx) {
            --items[i].saViewer.saViewerIndex;
        }
    }
    // Remove the viewer record for this viewer.
    note.ViewerRecords.splice(viewerIdx,1);
}


//==============================================================================
// Make any div into a text editor.
// Will be used for the presentation html editor.
// Note,  scalabe font should be set before text editor if you want scale buttons.
// TODO: 
// - The editor is position 'absolute' and is placed with percentages.
//   Make pixel positioning an option
// - use saDeletable and saDraggable and remove internal code.

// args: {dialog: true}
jQuery.prototype.saTextEditor = function(args) {
    this.addClass('sa-text-editor');
    for (var i = 0; i < this.length; ++i) {
        if ( ! this[i].saTextEditor) {
            var textEditor = new saTextEditor($(this[i]), args);
            // Add the viewer as an instance variable to the dom object.
            this[i].saTextEditor = textEditor;
        }
    }

    return this;
}

// I hate to use this hack, but I need to stop other events from triggering.
var CONTENT_EDITABLE_HAS_FOCUS = false;

function saTextEditor(div, args) {
    args = args || {dialog : true};
    var self = this;
    this.Div = div;
    // Position the div with percentages instead of pixels.
    this.Percentage = true;
    div.saResizable();

    var pos = div.position();
    // I think the drag handle needs to be in the parent.
    // Then synchronize the div's position with the handle.
    // Parent must then be realtive positioning or equivalent.
    this.DragHandle = $('<img>')
        // this is specific for the presentation.  I do not want gui showing up
        // in html.
        .appendTo(div.parent())
        // so we can remove this gui from saHtml string.
        .addClass('sa-edit-gui')
        .hide()
        .prop('title', 'drag text')
        .attr('src','webgl-viewer/static/fullscreen.png') // temp icon
        // this is not really a button, but I want it to be formated like
        // the others.
        .addClass('editButton')
        .css({'background':'white',
              'position':'absolute',
              'left'  :(pos.left-2)+'px',
              'top'   :(pos.top-20) +'px'})
        .draggable({
            drag: function( event, ui ) {
                this.saTextEditor.SetPositionPixel(ui.position.left+2,
                                                   ui.position.top+20);}
        });
    // This is needed for the drag event to synchronize position of div.
    this.DragHandle[0].saTextEditor = this;

    // Edit buttons.
    this.ButtonDiv = $('<div>')
        .appendTo(div.parent())
        .addClass('sa-edit-gui') // So we can remove it when saving.
        .hide()
        .css({'position':'absolute',
              'left'  :(pos.left+20)+'px',
              'top'   :(pos.top-20) +'px',
              'width' :'350px'});

    this.AddEditButton("webgl-viewer/static/remove.png", "delete",
                       function() {self.Delete();});
    this.AddEditButton("webgl-viewer/static/link.png", "link URL",
                       function() {self.InsertUrlLink();});
    this.AddEditButton("webgl-viewer/static/font_bold.png", "bold",
                       function() {
                           console.log("bold");
                           document.execCommand('bold',false,null);});
    this.AddEditButton("webgl-viewer/static/text_italic.png", "italic",
                       function() {document.execCommand('italic',false,null);});
    this.AddEditButton("webgl-viewer/static/edit_underline.png", "underline",
                       function() {document.execCommand('underline',false,null);});
    this.AddEditButton("webgl-viewer/static/list_bullets.png", "unorded list",
                       function() {document.execCommand('InsertUnorderedList',false,null);});
    this.AddEditButton("webgl-viewer/static/list_numbers.png", "ordered list",
                       function() {document.execCommand('InsertOrderedList',false,null);});
    this.AddEditButton("webgl-viewer/static/indent_increase.png", "indent",
                       function() {document.execCommand('indent',false,null);});
    this.AddEditButton("webgl-viewer/static/indent_decrease.png", "outdent",
                       function() {document.execCommand('outdent',false,null);});
    this.AddEditButton("webgl-viewer/static/alignment_left.png", "align left",
                       function() {document.execCommand('justifyLeft',false,null);});
    this.AddEditButton("webgl-viewer/static/alignment_center.png", "align center",
                       function() {document.execCommand('justifyCenter',false,null);});
    this.AddEditButton("webgl-viewer/static/edit_superscript.png", "superscript",
                       function() {document.execCommand('superscript',false,null);});
    this.AddEditButton("webgl-viewer/static/edit_subscript.png", "subscript",
                       function() {document.execCommand('subscript',false,null);});
    if (div.hasClass('sa-scalable-font')) {
        /*
        this.AddEditButton("webgl-viewer/static/font_increase.png", "large font",
                           function(){
                               text = self.Div[0];
                               text.saScalableFont.scale += 1;
                               console.log("scale = " + text.saScalableFont.scale);
                               // We need to put this in an attribute so it
                               // gets saved in the html.
                               text.setAttribute('sa-font-scale',
                                                 text.saScalableFont.scale.toString());
                               // Call the resize method to draw the text at
                               // the new size.
                               text.onresize();
                               $(text).focus();
                           });
        this.AddEditButton("webgl-viewer/static/font_decrease.png", "small font",
                           function() {
                               text = self.Div[0];
                               text.saScalableFont.scale -= 1;
                               console.log("scale = " + text.saScalableFont.scale);
                               // We need to put this in an attribute so it
                               // gets saved in the html.
                               text.setAttribute('sa-font-scale',
                                                 text.saScalableFont.scale.toString());
                               // Call the resize method to draw the text at
                               // the new size.
                               text.onresize();
                               $(text).focus();
                           });
                           */
    }
    if (args.dialog) {
        var self = this;
        this.Dialog = new Dialog(function () {self.DialogApplyCallback();});
        // Customize dialog for a circle.
        this.Dialog.Title.text('Text Box Properties');

        // Font Size
        this.Dialog.FontSizeDiv =
        $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'height':'32px'})
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.FontSizeLabel =
            $('<div>')
            .appendTo(this.Dialog.FontSizeDiv)
            .text("Font Size:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.FontSize =
            $('<input type="number">')
            .appendTo(this.Dialog.FontSizeDiv)
            .addClass("sa-view-annotation-modal-input")
            .keypress(function(event) { return event.keyCode != 13; });

        // Font Color
        this.Dialog.FontColorDiv =
        $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'height':'32px'})
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.FontColorLabel =
            $('<div>')
            .appendTo(this.Dialog.FontColorDiv)
            .text("Color:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.FontColor =
            $('<input type="color">')
            .appendTo(this.Dialog.FontColorDiv)
            .val('#050505')
            .addClass("sa-view-annotation-modal-input");

        // Line Height
        this.Dialog.LineHeightDiv =
        $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'height':'32px'})
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.LineHeightLabel =
            $('<div>')
            .appendTo(this.Dialog.LineHeightDiv)
            .text("Line Height %:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.LineHeight =
            $('<input type="number">')
            .appendTo(this.Dialog.LineHeightDiv)
            .addClass("sa-view-annotation-modal-input")
            .keypress(function(event) { return event.keyCode != 13; });       

        // Background
        this.Dialog.BackgroundDiv =
        $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'height':'32px'})
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.BackgroundLabel =
            $('<div>')
            .appendTo(this.Dialog.BackgroundDiv)
            .text("Background Color:")
            .addClass("sa-view-annotation-modal-input-label");
        // background color,   name="vehicle" value="Bike">
        this.Dialog.BackgroundCheck = $('<input type="checkbox">')
            .appendTo(this.Dialog.BackgroundDiv)
            .change(function() {
                if($(this).is(":checked")) {
                    self.Dialog.BackgroundColor.show();
                } else {
                    self.Dialog.BackgroundColor.hide();
                }
            });
        this.Dialog.BackgroundColor =
            $('<input type="color">')
            .appendTo(this.Dialog.BackgroundDiv)
            .val('#ffffff')
            .hide()
            .addClass("sa-view-annotation-modal-input");

        // Border
        this.Dialog.BorderDiv =
            $('<div>')
            .appendTo(this.Dialog.Body)
            .css({'height':'32px',
                  'width':'400px'})
            .addClass("sa-view-annotation-modal-div");
        this.Dialog.BorderLabel =
            $('<div>')
            .appendTo(this.Dialog.BorderDiv)
            .text("Border:")
            .addClass("sa-view-annotation-modal-input-label");
        this.Dialog.BorderCheck = $('<input type="checkbox">')
            .appendTo(this.Dialog.BorderDiv)
            .change(function() {
                if($(this).is(":checked")) {
                    self.Dialog.BorderWidth.show();
                    self.Dialog.BorderColor.show();
                } else {
                    self.Dialog.BorderWidth.hide();
                    self.Dialog.BorderColor.hide();
                }
            });
        this.Dialog.BorderColor =
            $('<input type="color">')
            .appendTo(this.Dialog.BorderDiv)
            .val('#005077')
            .hide()
            .addClass("sa-view-annotation-modal-input");
        this.Dialog.BorderWidth =
            $('<input type="number">')
            .appendTo(this.Dialog.BorderDiv)
            .addClass("sa-view-annotation-modal-input")
            .hide()
            .keypress(function(event) { return event.keyCode != 13; });

        this.AddEditButton("webgl-viewer/static/Menu.jpg", "properties",
                           function() { self.ShowDialog(); });
    }

    div.attr('contenteditable', "true")
        .focusin(function() {
            CONTENT_EDITABLE_HAS_FOCUS = true;
            // Position the handle in the proper spot.
            // Resizing with percentages changes it.
            var pos = self.Div.position();
            self.DragHandle
                .css({'left'  :(pos.left-2)+'px',
                      'top'   :(pos.top-20) +'px'})
                .show();
            self.ButtonDiv
                .css({'left'  :(pos.left+20)+'px',
                      'top'   :(pos.top-20) +'px'})
                .show();

        })
        .focusout(function() {
            CONTENT_EDITABLE_HAS_FOCUS = false;
            self.DragHandle.hide();
            // hiding the button div here keeps the buttons from working.
            setTimeout(
                function () {
                    if ( ! self.Div.is(":focus")) {
                        self.ButtonDiv.hide();
                    }},
                250);
        });
}

saTextEditor.prototype.ShowDialog = function() {
    var str;

    // iniitalize the values.
    if (this.Div[0].saScalableFont) {
        var scale = this.Div[0].saScalableFont.scale;
        var fontSize = Math.round(scale * 800);
        this.Dialog.FontSize.val(fontSize);
    }

    var color = '#000000';
    str = this.Div[0].style.color;
    if (str != "") {
        color = ConvertColorToHex(str);
    }
    this.Dialog.FontColor.val(color);

    var lineHeight = 120; // default value?
    var str = this.Div[0].style.lineHeight;
    if (str != "") {
        if (str.substring(str.length-1) == "%") {
            lineHeight = parseFloat(str.substr(0,str.length-1));
        }
    }
    this.Dialog.LineHeight.val(lineHeight);

    str = this.Div[0].style.backgroundColor;
    if (str != "") {
        this.Dialog.BackgroundCheck.prop('checked', true);
        this.Dialog.BackgroundColor.show();
        this.Dialog.BackgroundColor.val(ConvertColorToHex(str));
    }

    str = this.Div[0].style.borderWidth;
    if (str != "") {
        this.Dialog.BorderCheck.prop('checked', true);
        this.Dialog.BorderWidth.show();
        this.Dialog.BorderWidth.val(parseInt(str));
        this.Dialog.BorderColor.show();
        str = this.Div[0].style.borderColor;
        if (str != "") {
            this.Dialog.BorderColor.val(ConvertColorToHex(str));
        }
    }

    this.Dialog.Show(true);
}


saTextEditor.prototype.DialogApplyCallback = function() {
    this.Div.css({'padding'      : '2%',
                  'border-radius': '3px'});
    if (this.Dialog.FontSize) {
        var scale = parseFloat(this.Dialog.FontSize.val()) / 800;
        this.Div.saScalableFont({scale:scale});
    }

    if (this.Dialog.LineHeight) {
        var lineHeight = parseFloat(this.Dialog.LineHeight.val());
        this.Div[0].style.lineHeight = lineHeight + "%";
    }

    if (this.Dialog.FontColor) {
        var color = this.Dialog.FontColor.val();
        this.Div[0].style.color = color;
    }
    
    var color = '#000000';
    str = this.Div[0].style.color;
    if (str != "") {
        color = str;
    }
    this.Dialog.FontColor.val(color);


    if (this.Dialog.BackgroundCheck.is(":checked")) {
        var hexcolor = this.Dialog.BackgroundColor.val();
        this.Div.css({'background-color':hexcolor});
    } else {
        this.Div.css('background-color', '');
    }

    if (this.Dialog.BorderCheck.is(":checked")) {
        var hexcolor = this.Dialog.BorderColor.val();
        var width = parseFloat(this.Dialog.BorderWidth.val());
        this.Div.css({'border': width+'px solid ' + hexcolor});
    } else {
        this.Div.css('border', '');
    }
}

saTextEditor.prototype.Delete = function() {
    this.DragHandle.remove();
    this.ButtonDiv.remove();
    this.Div.remove();
}

saTextEditor.prototype.InsertUrlLink = function() {
    var self = this;
    var sel = window.getSelection();
    // This call will clear the selected text if it is not in this editor.
    var range = this.GetSelectionRange();
    var selectedText = sel.toString();

    if ( ! this.UrlDialog) {
        var self = this;
        var dialog = new Dialog(function() {
            self.InsertUrlLinkAccept();
        });
        this.UrlDialog = dialog;
        dialog.Dialog.css({'width':'40em'});
        dialog.Title.text("Paste URL link");
        dialog.TextDiv =
            $('<div>')
            .appendTo(dialog.Body)
            .css({'display':'table-row',
                  'width':'100%'});
        dialog.TextLabel =
            $('<div>')
            .appendTo(dialog.TextDiv)
            .text("Text to display:")
            .css({'display':'table-cell',
                  'height':'2em',
                  'text-align': 'left'});
        dialog.TextInput =
            $('<input>')
            .appendTo(dialog.TextDiv)
            .val('#30ff00')
            .css({'display':'table-cell',
                  'width':'25em'});

        dialog.UrlDiv =
            $('<div>')
            .appendTo(dialog.Body)
            .css({'display':'table-row'});
        dialog.UrlLabel =
            $('<div>')
            .appendTo(dialog.UrlDiv)
            .text("URL link:")
            .css({'display':'table-cell',
                  'text-align': 'left'});
        dialog.UrlInput =
            $('<input>')
            .appendTo(dialog.UrlDiv)
            .val('#30ff00')
            .css({'display':'table-cell',
                  'width':'25em'})
            .bind('input', function () {
                var url = self.UrlDialog.UrlInput.val();
                if (self.UrlDialog.LastUrl == self.UrlDialog.TextInput.val()) {
                    // The text is same as the URL. Keep them synchronized.
                    self.UrlDialog.TextInput.val(url);
                }
                self.UrlDialog.LastUrl = url;
                // Deactivate the apply button if the url is blank.
                if (url == "") {
                    self.UrlDialog.ApplyButton.attr("disabled", true);
                } else {
                    self.UrlDialog.ApplyButton.attr("disabled", false);
                }
            });

    }

    // We have to save the range/selection because user interaction with
    // the dialog clears the text entry selection.
    this.UrlDialog.SelectionRange = range;
    this.UrlDialog.TextInput.val(selectedText);
    this.UrlDialog.UrlInput.val("");
    this.UrlDialog.LastUrl = "";
    this.UrlDialog.ApplyButton.attr("disabled", true);
    this.UrlDialog.Show(true);
}

saTextEditor.prototype.InsertUrlLinkAccept = function() {
    var sel = window.getSelection();
    var range = this.UrlDialog.SelectionRange;

    // Simply put a span tag around the text with the id of the view.
    // It will be formated by the note hyperlink code.
    var link = document.createElement("a");
    link.href = this.UrlDialog.UrlInput.val();
    link.target = "_blank";

    // It might be nice to have an id to get the href for modification.
    //span.id = note.Id;

    // Replace or insert the text.
    if ( ! range.collapsed) {
        // Remove the seelcted text.
        range.extractContents(); // deleteContents(); // cloneContents
        range.collapse(true);
    }
    var linkText = this.UrlDialog.TextInput.val();
    if (linkText == "") {
        linkText = this.UrlDialog.UrlInput.val();
    }
    link.appendChild( document.createTextNode(linkText) );

    range.insertNode(link);
    if (range.noCursor) {
        // Leave the selection the same as we found it.
        // Ready for the next link.
        sel.removeAllRanges();
    }
}

// Get the selection in this editor.  Returns a range.
// If not, the range is collapsed at the 
// end of the text and a new line is added.
saTextEditor.prototype.GetSelectionRange = function() {
    var sel = window.getSelection();
    var range;
    var parent = null;

    // Two conditions when we have to create a selection:
    // nothing selected, and something selected in wrong parent.
    // use parent as a flag.
    if (sel.rangeCount > 0) {
        // Something is selected
        range = sel.getRangeAt(0);
        range.noCursor = false;
        // Make sure the selection / cursor is in this editor.
        parent = range.commonAncestorContainer;
        // I could use jquery .parents(), but I bet this is more efficient.
        while (parent && parent != this.Div[0]) {
            //if ( ! parent) {
                // I believe this happens when outside text is selected.
                // We should we treat this case like nothing is selected.
                //console.log("Wrong parent");
                //return;
            //}
            if (parent) {
                parent = parent.parentNode;
            }
        }
    }
    if ( ! parent) {
        // Select everything in the editor.
        range = document.createRange();
        range.noCursor = true;
        range.selectNodeContents(this.Div[0]);
        sel.removeAllRanges();
        sel.addRange(range);
        // Collapse the range/cursor to the end (true == start).
        range.collapse(false);
        // Add a new line at the end of the editor content.
        var br = document.createElement('br');
        range.insertNode(br); // selectNode?
        range.collapse(false);
        // The collapse has no effect without this.
        sel.removeAllRanges();
        sel.addRange(range);
        //console.log(sel.toString());
    }

    return range;
}

// TODO: Button s have to be clicked in exact center......
saTextEditor.prototype.AddEditButton = function(src, tooltip, callback) {
    var self = this;
    var button = $('<img>');
    if (tooltip) {
        button.prop('title', tooltip);
    }
    button
        .appendTo(this.ButtonDiv)
        .css({'height':'16'})
        .addClass('editButton')
        .attr('src',src)
        .click(callback);
}

// Set in position in pixels
saTextEditor.prototype.SetPositionPixel = function(x, y) {
    this.ButtonDiv
        .css({'left'  :(x+20)+'px',
              'top'   :(y-20) +'px'})
    if (this.Percentage) {
        x = 100 * x / this.Div.parent().width();
        y = 100 * y / this.Div.parent().height();
        this.Div[0].style.left = x.toString()+'%';
        this.Div[0].style.top = y.toString()+'%';
    } else {
        this.Div[0].style.left = x+'px';
        this.Div[0].style.top = y+'px';
    }
}



//==============================================================================
// I am having such troubles setting the right panel width to fill.
// Solution is to have this element control too divs (panel and main).
// If the panel overlaps the main, we do not need to manage the main panel.
// It would have to be implemented on the panel div, not the parent div.

// TODO: Verify this works in a stand alone page.
// args
// option to specify the handle.
// option to place panel: left, right, top, bottom.
// Use it for the Notes panel.
// Use it for the presentation edit panel
// use it for dual view.

function ResizePanel(parent) {
    var self = this;

    // For animating the display of the notes window (DIV).
    this.Width = 300;

    this.PanelDiv = $('<div>').appendTo(parent)
        .css({
            'background-color': 'white',
            'position': 'absolute',
            'top' : '0px',
            'bottom':'0px',
            'left' : '0px',
            'width': this.width+'px'})
        .attr('draggable','false')
        .on("dragstart", function() {return false;});
    this.MainDiv = $('<div>').appendTo(parent)
        .css({
            'position': 'absolute',
            'top' : '0px',
            'bottom':'0px',
            'left' : this.Width+'px',
            'right':'0px',
            'border':'1px solid #AAA'})
        .attr('draggable','false')
        .on("dragstart", function() {return false;});

    this.OpenNoteWindowButton = $('<img>')
        .appendTo(this.MainDiv)
        .css({'position': 'absolute',
              'height': '20px',
              'width': '20px',
              'top' : '0px',
              'left' : '3px',
              'opacity': '0.6',
              '-moz-user-select': 'none',
              '-webkit-user-select': 'none',
              'z-index': '6'})
        .attr('src',"webgl-viewer/static/dualArrowRight2.png")
        .click(function(){self.ToggleNotesWindow();})
        .attr('draggable','false')
        .hide()
        .on("dragstart", function() {
            return false;});

    // I have no idea why the position right does not work.
    this.CloseNoteWindowButton = $('<img>')
        .appendTo(this.MainDiv)
        .css({'position': 'absolute',
              'height': '20px',
              'top' : '0px',
              'left' : '-20px',
              'opacity': '0.6',
              '-moz-user-select': 'none',
              '-webkit-user-select': 'none',
              'z-index': '6'})
        //.hide()
        .attr('src',"webgl-viewer/static/dualArrowLeft2.png")
        .click(function(){self.ToggleNotesWindow();})
        .attr('draggable','false')
        .on("dragstart", function() {
            return false;});


    this.Visibility = false;
    this.Dragging = false;

    // TODO: Get rid of the reference to the global VIEW_PANEL.
    this.ResizeNoteWindowEdge = $('<div>')
        .appendTo(VIEW_PANEL)
        .css({'position': 'absolute',
              'height': '100%',
              'width': '3px',
              'top' : '0px',
              'left' : '0px',
              'background': '#BDF',
              'z-index': '10',
              'cursor': 'col-resize'})
        .hover(function () {$(this).css({'background':'#9BF'});},
               function () {$(this).css({'background':'#BDF'});})
        .mousedown(function () {
            self.StartDrag();
        });
}

// TODO: Remove reference to body directly
// Maybe use parent.
ResizePanel.prototype.StartDrag = function () {
    this.Dragging = true;
    $('body').bind('mousemove',this.ResizeDrag);
    $('body').bind('mouseup', this.ResizeStopDrag);
    $('body').css({'cursor': 'col-resize'});
}

ResizePanel.ResizeDrag = function (e) {
    this.SetWidth(e.pageX - 1);
    if (this.Width < 200) {
        this.ResizeStopDrag();
        this.ToggleNotesWindow();
    }

    return false;
}
ResizePanel.ResizeStopDrag = function () {
    $('body').unbind('mousemove',this.ResizeDrag);
    $('body').unbind('mouseup', this.ResizeStopDrag);
    $('body').css({'cursor': 'auto'});
}




// TODO: Notes widget should just follow the parent.
// Get rid of this.
ResizePanel.prototype.SetWidth = function(width) {
    this.Width = width;
    this.Window.width(width);
    // TODO: Get rid of this hack.
    $(window).trigger('resize');
}

ResizePanel.prototype.AnimateNotesWindow = function() {
    var timeStep = new Date().getTime() - this.AnimationLastTime;
    if (timeStep > this.AnimationDuration) {
        // end the animation.
        this.SetWidth(this.AnimationTarget);
        // Hack to recompute viewports
        // TODO: Get rid of this hack.
        $(window).trigger('resize');

        if (this.Visibility) {
            this.CloseNoteWindowButton.show();
            this.OpenNoteWindowButton.hide();
            this.Window.fadeIn();
        } else {
            this.CloseNoteWindowButton.hide();
            this.OpenNoteWindowButton.show();
        }
        draw();
        return;
    }

    var k = timeStep / this.AnimationDuration;

    // update
    this.AnimationDuration *= (1.0-k);
    this.SetWidth(this.Width + (this.AnimationTarget-this.Width) * k);

    draw();
    var self = this;
    requestAnimFrame(function () {self.AnimateNotesWindow();});
}

ResizePanel.prototype.ToggleNotesWindow = function() {
    this.Visibility = ! this.Visibility;
    RecordState();

    if (this.Visibility) {
        this.AnimationCurrent = this.Width;
        this.AnimationTarget = 325;
    } else {
        this.Window.hide();
        this.AnimationCurrent = this.Width;
        this.AnimationTarget = 0;
    }
    this.AnimationLastTime = new Date().getTime();
    this.AnimationDuration = 1000.0;
    this.AnimateNotesWindow();
}


//==============================================================================

//args: { label: function, ...}
jQuery.prototype.saMenuButton = function(args) {
    if (this.length == 0) { return this;}
    var item = this[0];

    if ( ! item.saMenuButton) {
        item.saMenuButton = new saMenuButton(args, this);
    }

    return this;
}

function saMenuButton(args, menuButton) {
    this.InsertMenuTimer = 0;
    this.InsertMenu = $('<ul>')
        .appendTo( menuButton )
        // How do I customize the menu location?
        .css({'position': 'absolute',
              'left'    : '-110px',
              'top'     : '25px',
              'width'   : '150px',
              'font-size':'18px',
              'box-shadow': '10px 10px 5px #AAA',
              'z-index' : '5'})
        .hide();

    for (label in args) {
        this.AddMenuItem(label, args[label]);
    }
    // Jquery UI formatting
    this.InsertMenu.menu();

    // Make it easy to select the first item
    var self = this;
    label = Object.keys(args)[0];
    menuButton.click(function() {
        (args[label])();
        self.InsertMenu.hide();
    });

    var self = this;
    menuButton.mouseover(
        function () { self.ShowInsertMenu(); });
    this.InsertMenu.mouseover(
        function () { self.ShowInsertMenu(); });

    menuButton.mouseleave(
        function () { self.EventuallyHideInsertMenu(); });
    this.InsertMenu.mouseleave(
        function () { self.EventuallyHideInsertMenu(); });
}

saMenuButton.prototype.AddMenuItem = function(label, callback) {
    var self = this;

    this[label] = $('<li>')
        .appendTo(this.InsertMenu)
        .text(label)
        .addClass('saButton') // for hover effect
        .click(function() {
            (callback)();
            self.InsertMenu.hide();
            return false;
        });
}

saMenuButton.prototype.ShowInsertMenu = function() {
    if (this.InsertMenuTimer) {
        clearTimeout(this.InsertMenuTimer);
        this.InsertMenuTimer = 0;
    }
    this.InsertMenu.show();
}

saMenuButton.prototype.EventuallyHideInsertMenu = function() {
    if (this.InsertMenuTimer) {
        clearTimeout(this.InsertMenuTimer);
        this.InsertMenuTimer = 0;
    }
    var self = this;
    this.InsertMenuTimer = setTimeout(
        function () {
            self.InsertMenuTimer = 0;
            self.InsertMenu.fadeOut();
            this.InsertMenuTimer = 0;
        }, 500);
}







//==============================================================================




//==============================================================================


// RGB [Float, Float, Float] to #RRGGBB string
var ConvertColorToHex = function(color) {
  if (typeof(color) == 'string') { 
      if (color.substring(0,1) == '#') {
          return color;
          } else if (color.substring(0,3) == 'rgb') {
              tmp = color.substring(4,color.length - 1).split(',');
              color = [parseInt(tmp[0])/255,
                       parseInt(tmp[1])/255,
                       parseInt(tmp[2])/255];
          }
  }
  var hexDigits = "0123456789abcdef";
  var str = "#";
  for (var i = 0; i < 3; ++i) {
	  var tmp = color[i];
	  for (var j = 0; j < 2; ++j) {
	    tmp *= 16.0;
	    var digit = Math.floor(tmp);
	    if (digit < 0) { digit = 0; }
	    if (digit > 15){ digit = 15;}
	    tmp = tmp - digit;
	    str += hexDigits.charAt(digit);
    }
  }
  return str;
}


// 0-f hex digit to int
var HexDigitToInt = function(hex) {
  if (hex == '1') {
    return 1.0;
  } else if (hex == '2') {
    return 2.0;
  } else if (hex == '3') {
    return 3.0;
  } else if (hex == '4') {
    return 4.0;
  } else if (hex == '5') {
    return 5.0;
  } else if (hex == '6') {
    return 6.0;
  } else if (hex == '7') {
    return 7.0;
  } else if (hex == '8') {
    return 8.0;
  } else if (hex == '9') {
    return 9.0;
  } else if (hex == 'a' || hex == 'A') {
    return 10.0;
  } else if (hex == 'b' || hex == 'B') {
    return 11.0;
  } else if (hex == 'c' || hex == 'C') {
    return 12.0;
  } else if (hex == 'd' || hex == 'D') {
    return 13.0;
  } else if (hex == 'e' || hex == 'E') {
    return 14.0;
  } else if (hex == 'f' || hex == 'F') {
    return 15.0;
  }
  return 0.0;
}


// Not used at the moment.
// Make sure the color is an array of values 0->1
var ConvertColor = function(color) {
  // Deal with color names.
  if ( typeof(color)=='string' && color[0] != '#') {
    var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
      "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
      "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
      "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
      "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
      "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
      "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
      "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
      "honeydew":"#f0fff0","hotpink":"#ff69b4",
      "indianred ":"#cd5c5c","indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
      "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
      "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
      "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
      "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
      "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
      "navajowhite":"#ffdead","navy":"#000080",
      "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
      "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
      "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
      "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
      "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
      "violet":"#ee82ee",
      "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
      "yellow":"#ffff00","yellowgreen":"#9acd32"};
    if (typeof colors[color.toLowerCase()] != 'undefined') {
        color = colors[color.toLowerCase()];
    } else {
        alert("Unknown color " + color);
    }
  }

  // Deal with color in hex format i.e. #0000ff
  if ( typeof(color)=='string' && color.length == 7 && color[0] == '#') {
    var floatColor = [];
    var idx = 1;
    for (var i = 0; i < 3; ++i) {
      var val = ((16.0 * HexDigitToInt(color[idx++])) + HexDigitToInt(color[idx++])) / 255.0;
      floatColor.push(val);
    }
    return floatColor;
  }
  // No other formats for now.
  return color;
}




