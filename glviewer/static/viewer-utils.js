//==============================================================================
// saElement: borders, shadow, drag and resize
// saRectangle: BackgroundColor / gradient.
// saText: padding, textSize, Line spacing, (in future font)
// saLightBox, click to expand.
// saLightBoxViewer, expand to a viewer. Manage turning events on and off.

// Abstracting the question.  It will not be editable text, but can be
// changed from a properties dialog. Subclass of rectangle.
// TODO:
// Question has internal resize.
// Question not handliong dialog apply (margin) properly. Loose answers.


// Link resize callbacks.
// Make sure the active border stays on during resize.
// Finish pan zoom of presentation.
// Finish text (turn off text edit buttons).
// Stack viewer / lightbox
// Question: Interactive


// Edit questions/
// Convert text to an saElement.
// Option to hide with answers.
// Interactive question.
// Shuffle questions as note Text. No shuffle when answers are off.

// Replace an image. presesntation will not save.Intertent
//   WHen you delete an image, the next image should go where the last was.
// Menu when not logged in.


//==============================================================================
// Sort of a superclass for all presentation elements.
// Start with draggable, resizable, deletable and click.
// Highlight border to indicate an active element.
// args = {click: function (dom) {...}
//         editable: true,
//         aspectRatio: false}
// args = "dialog" => open the dialog.
 
jQuery.prototype.saElement = function(args) {
    for (var i = 0; i < this.length; ++i) {
        if ( ! this[i].saElement) {
            var helper = new saElement($(this[i]));
            // Add the helper as an instance variable to the dom object.
            this[i].saElement = helper;
        }
        this[i].saElement.ProcessArguments(args);
    }
    return this;
}

// TODO: Rename Edit
function saElement(div) {
    var self = this;

    // Save resize args for editable option.
    this.ResizableArgs = {
        start : function (e, ui) {
            return false;
        },
        stop : function (e, ui) {
            self.ConvertToPercentages();
            return false;
        }
    }

    this.Editable = false;
    this.Div = div;
    this.ClickCallback = null;
    this.Div
        .css({'overflow': 'hidden'}) // for borderRadius 
        .hover(
            function (e) {
                self.SavedBorder = this.style.border;
                $(this).css({'border-color':'#6AF'});
                if (self.Editable) {
                    self.ButtonDiv.show();
                }
            },
            function (e) {
                this.style.border = self.SavedBorder;
                self.ButtonDiv.hide();
            }
        );

    // I cannot move this to EditOn because we need the mouse down event
    // to detect clicks.
    this.Div
        .on('mousedown.element',
              function (event) {
                  return self.HandleMouseDown(event);
              })
        .on('tap.element',
            function (event) {
                if (this.ClickCallback) {
                    (this.ClickCallback)(this.Div[0]);
                    return false;
                }
                return true;
            });


    // I could not get the key events working.  I had to restart the browser.
    this.ButtonDiv = $('<div>')
        .appendTo(this.Div)
        .addClass('.sa-edit-gui') // Remove before saHtml save.
        .css({'height':'16px',
              'position':'absolute',
              'top':'0px',
              'left':'0px',
              'cursor':'auto'})
        .hide()
        // Block the expand event when the delete button is pressed.
        .mousedown(function(){return false;});
    this.DeleteButton = $('<img>')
        .appendTo(this.ButtonDiv)
        .addClass('editButton')
        .css({'height':'16px'})
        .attr('src','webgl-viewer/static/remove.png')
        .prop('title', "delete")
        .click(
            function () {
                self.Div.remove();
            });
    this.MenuButton = $('<img>')
        .appendTo(this.ButtonDiv)
        .addClass('editButton')
        .css({'height':'16px'})
        .attr('src','webgl-viewer/static/Menu.jpg')
        .prop('title', "properties")
        .click(
            function () {
                self.DialogOpenCallback();
            });

    this.InitializeDialog();
}

saElement.prototype.InitializeDialog = function () {
    var self = this;
    this.Dialog = new Dialog(function () {self.DialogApplyCallback();});
    this.Dialog.Title.text('Properties');
    // Open callbacks allow default values to be set in the dialog.
    this.DialogInitializeFunctions = [];
    this.DialogApplyFunctions = [];

    // Indicate that this item should be hidden when in quize mode.
    this.Dialog.QuizPanel = this.AddAccordionTab(
        "Quiz",
        function () {
            self.Dialog.QuizCheck.prop('checked', self.Div.hasClass('sa-quiz-hide'));
        },
        function () {
            if (self.Dialog.QuizCheck.is(':checked')) {
                self.Div.addClass('sa-quiz-hide');
            } else {
                self.Div.removeClass('sa-quiz-hide');
            }
        });
    this.Dialog.QuizLabel = $('<div>')
        .appendTo(this.Dialog.QuizPanel)
        .css({'display': 'inline-block'})
        .text("Hide for quiz:");
    this.Dialog.QuizCheck = $('<input type="checkbox">')
        .appendTo(this.Dialog.QuizPanel);

    // Initialize the dialog with properties of border and shadow.
    // Border
    this.Dialog.BorderPanel = this.AddAccordionTab(
        "Border",
        function () {self.DialogInitialize();},
        function () {self.DialogApply();});

    // Border width and color.
    this.Dialog.BorderLine1 = $('<div>')
        .appendTo(this.Dialog.BorderPanel)
        .css({'width':'100%'});
    this.Dialog.BorderCheck = $('<input type="checkbox">')
        .appendTo(this.Dialog.BorderLine1)
        .change(function() {
            if($(this).is(":checked")) {
                self.Dialog.BorderWidth.prop('disabled', false);
                self.Dialog.BorderColor.spectrum('enable');
            } else {
                self.Dialog.BorderWidth.prop('disabled', true);
                self.Dialog.BorderColor.spectrum('disable');
            }
        });
    this.Dialog.BorderWidthLabel = $('<div>')
        .appendTo(this.Dialog.BorderLine1)
        .css({'display': 'inline-block',
              'padding':'0px 5px',
              'width':'4em',
              'height':'20px',
              'text-align': 'right'})
        .text("Width");
    this.Dialog.BorderWidth = $('<input type="number">')
        .appendTo(this.Dialog.BorderLine1)
        .addClass("sa-view-annotation-modal-input")
        .css({'display': 'inline-block',
              'width':'3em'})
        .prop('disabled', true)
        .val(1)
        // Consume all events except return
        .keypress(function(event) { return event.keyCode != 13; });
    this.Dialog.BorderColorDiv = $('<div>')
        .appendTo(this.Dialog.BorderLine1)
        .css({'float':'right',
              'height':'18px'});
    this.Dialog.BorderColor = $('<input type="text">')
        .appendTo(this.Dialog.BorderColorDiv)
        .spectrum({showAlpha: true});

    // Rounded corners
    this.Dialog.BorderLine2 = $('<div>')
        .appendTo(this.Dialog.BorderPanel)
        .css({'width':'100%'});
    this.Dialog.BorderRadiusCheck = $('<input type="checkbox">')
        .appendTo(this.Dialog.BorderLine2)
        .change(function() {
            if($(this).is(":checked")) {
                self.Dialog.BorderRadius.prop('disabled', false);
            } else {
                self.Dialog.BorderRadius.prop('disabled', true);
            }
        });
    this.Dialog.BorderRadiusLabel = $('<div>')
        .appendTo(this.Dialog.BorderLine2)
        .css({'display': 'inline-block',
              'padding':'0px 5px',
              'width':'4em',
              'height':'20px',
              'text-align': 'right'})
        .text("Radius");
    this.Dialog.BorderRadius = $('<input type="number">')
        .appendTo(this.Dialog.BorderLine2)
        .addClass("sa-view-annotation-modal-input")
        .prop('disabled', true)
        .css({'display': 'inline-block',
              'width':'3em'})
        .val(5)
        // Consume all events except return
        .keypress(function(event) { return event.keyCode != 13; });

    // Shadow
    this.Dialog.BorderLine3 = $('<div>')
        .appendTo(this.Dialog.BorderPanel)
        .css({'width':'100%'});
    this.Dialog.ShadowCheck = $('<input type="checkbox">')
        .appendTo(this.Dialog.BorderLine3)
        .change(function() {
            if($(this).is(":checked")) {
                self.Dialog.ShadowOffset.prop('disabled', false);
                self.Dialog.ShadowBlur.prop('disabled', false);
                self.Dialog.ShadowColor.spectrum('enable');
            } else {
                self.Dialog.ShadowOffset.prop('disabled', true);
                self.Dialog.ShadowBlur.prop('disabled', true);
                self.Dialog.ShadowColor.spectrum('disable');
            }
        });
    this.Dialog.ShadowLabel = $('<div>')
        .appendTo(this.Dialog.BorderLine3)
        .css({'display': 'inline-block',
              'padding':'0px 5px',
              'width':'4em',
              'height':'20px',
              'text-align': 'right'})
        .text("Shadow");
    this.Dialog.ShadowOffset = $('<input type="number">')
        .appendTo(this.Dialog.BorderLine3)
        .addClass("sa-view-annotation-modal-input")
        .prop('disabled', true)
        .css({'display': 'inline-block',
              'width':'3em'})
        .val(10)
        // Consume all events except return
        .keypress(function(event) { return event.keyCode != 13; });
    this.Dialog.ShadowBlurLabel = $('<div>')
        .appendTo(this.Dialog.BorderLine3)
        .css({'display': 'inline-block',
              'padding':'0px 5px',
              'width':'3em',
              'height':'20px',
              'text-align': 'right'})
        .text("Blur");
    this.Dialog.ShadowBlur = $('<input type="number">')
        .appendTo(this.Dialog.BorderLine3)
        .addClass("sa-view-annotation-modal-input")
        .prop('disabled', true)
        .css({'display': 'inline-block',
              'width':'3em'})
        .val(5)
        // Consume all events except return
        .keypress(function(event) { return event.keyCode != 13; });
    this.Dialog.ShadowColorDiv = $('<div>')
        .appendTo(this.Dialog.BorderLine3)
        .css({'float':'right',
              'height':'18px'});
    this.Dialog.ShadowColor = $('<input type="text">')
        .appendTo(this.Dialog.ShadowColorDiv)
        .val('#AAAAAA')
        .prop('disabled', true)
        .css({'float':'right',
              'height':'18px'})
        .spectrum({showAlpha: true});
}

saElement.prototype.AddAccordionTab = function(title, open, apply) {
    if (open) {
        this.DialogInitializeFunctions.push(open)
    }
    if (apply) {
        this.DialogApplyFunctions.push(apply)
    }

    var tabDiv = $('<div>')
        .appendTo(this.Dialog.Body)
        .attr('title',title)
        .css({'width':'100%'});
    var tab = $('<div>')
        .appendTo(tabDiv)
        .text(title)
        .addClass('sa-accordion-tab');
    var panel = $('<div>')
        .appendTo(tabDiv)
        .css({'width':'100%',
              'padding':'5px',
              'border':'1px solid #AAA',
              'box-sizing': 'border-box'})
        .hide();
    var self = this;
    tab.click(function () {
        if (self.OpenAccordionPanel) {
            self.OpenAccordionPanel.hide(200);
        }
        if (self.OpenAccordionPanel == panel) {
            // Just closing the open panel.
            self.OpenAccordionPanel = null;
            return;
        }
        // Opening a new panel.
        panel.show(200);
        self.OpenAccordionPanel = panel;
    });
    // The last tab created is visible by default.
    // This should have worked, but did not.
    //tab.trigger("click");
    if (this.OpenAccordionPanel) {
        this.OpenAccordionPanel.hide();
    }
    this.OpenAccordionPanel = panel;
    panel.show();

    return panel;
}

saElement.prototype.HideAccordionTab = function(title) {
    this.Div[0].saElement.Dialog.Body.children('[title=Quiz]').hide();
}

saElement.prototype.DialogOpenCallback = function() {
    if ( ! this.DialogInitialized) {
        // Give 'subclasses' a chance to initialize their tabs.
        for (var i = 0; i < this.DialogInitializeFunctions.length; ++i) {
            (this.DialogInitializeFunctions[i])(this.Dialog);
        }
        this.DialogInitialized = true;
    }
    this.Dialog.Show(true);
}

saElement.prototype.DialogInitialize = function() {
    // TODO: Does this work when 'border' is used?
    var str = this.Div[0].style.borderWidth;
    if (str != "") {
        this.Dialog.BorderCheck.prop('checked', true);
        this.Dialog.BorderWidth.prop('disabled', false);
        this.Dialog.BorderColor.spectrum('enable');
        this.Dialog.BorderWidth.val(parseInt(str));
        // Current border is highlighted.  Use the saved color.
        //str = this.Div[0].style.borderColor;
        str = this.SavedBorder;
        if ( ! str || str == "") {
            // Called programatically
            str = this.Div[0].style.border;
        }
        if (str != "") {
            str = str.substr(str.indexOf('rgb'));
            this.Dialog.BorderColor.spectrum('get');
        }
    }

    // Border Radius
    str = this.Div[0].style.borderRadius;
    if (str != "") {
        this.Dialog.BorderRadiusCheck.prop('checked', true);
        this.Dialog.BorderRadius.prop('disabled', false);
        this.Dialog.BorderRadius.val(parseInt(str));
    }

    // Shadow
    str = this.Div[0].style.boxShadow;
    if (str != "") {
        this.Dialog.ShadowCheck.prop('checked', true);
        var idx = str.indexOf(')')+1;
        var color = str.substr(str.indexOf('rgb'), idx);
        this.Dialog.ShadowColor.spectrum('set', color);
        this.Dialog.ShadowColor.spectrum('enable');
        str = str.substr(idx+1); // 1 more to skip the space
        var params = str.split(' ');
        this.Dialog.ShadowOffset.prop('disabled', false);
        this.Dialog.ShadowOffset.val(parseInt(params[0]));
        this.Dialog.ShadowBlur.prop('disabled', false);
        this.Dialog.ShadowBlur.val(parseInt(params[2]));
    }
}

saElement.prototype.DialogApplyCallback = function() {
    // Giv 'subclasses' a chance to apply parameters in their tabs.
    for (var i = 0; i < this.DialogApplyFunctions.length; ++i) {
        (this.DialogApplyFunctions[i])(this.Dialog);
    }
}


saElement.prototype.DialogApply = function() {
    this.SavedBorder = this.Div[0].style.border;
    if (this.Dialog.BorderCheck.is(":checked")) {
        var color = this.Dialog.BorderColor.spectrum('get');
        var width = parseFloat(this.Dialog.BorderWidth.val());
        this.Div.css({'border': width+'px solid ' + color});
    } else {
        this.Div.css('border', '');
    }

    // Border Radius
    if (this.Dialog.BorderRadiusCheck.is(":checked")) {
        var width = parseFloat(this.Dialog.BorderRadius.val());
        this.Div.css({'borderRadius': width+'px'});
    } else {
        this.Div.css('borderRadius', '');
    }

    // Shadow
    if (this.Dialog.ShadowCheck.is(":checked")) {
        var hexcolor = this.Dialog.ShadowColor.spectrum('get');
        var offset = parseInt(this.Dialog.ShadowOffset.val());
        var blur = parseInt(this.Dialog.ShadowBlur.val());
        this.Div.css({'box-shadow': offset+'px '+offset+'px '+blur+'px '+hexcolor});
    } else {
        this.Div.css('box-shadow', '');
    }

    // To delay showing the question div until after the user has entered
    // text and selected apply.
    // If close is selected, it is never appended to the parent.
    if (this.DelayedParent) {
        this.Div.appendTo(this.DelayedParent);
        delete this.DelayedParent;
        this.Div.trigger('resize');
    }
}


saElement.prototype.ProcessArguments = function(args) {
    args = args || {};
    var self = this;

    // For questions.  We want the dialog to be filled before we create
    // (append to parent) the div.  Cancel will leave nothing in the parent
    // html.
    if (args.parent) {
        this.DelayedParent = args.parent;
        this.DialogOpenCallback();
    }

    // It is important to set aspect ratio before EditOn is called.
    // AspectRatio is a boolean.
    if (args.aspectRatio !== undefined) {
        if (args.apsectRatio == "") {
            // Actively remove the aspect ratio.
            delete this.AspectRatio;
            this.Div.removeAttr('sa-aspect-ratio');
        } else {
            // Set a new aspect ratio
            this.AspectRatio = args.aspectRatio;
            this.Div.attr('sa-aspect-ratio', args.aspectRatio);
        }
    } else {
        // try and get a saved aspect ratio.
        this.AspectRatio = this.Div.attr('sa-aspect-ratio');
    }

    if (args.editable !== undefined) {
        if (args.editable) {
            this.EditableOn();
        } else {
            this.EditableOff();
        }
    }

    if (args.click !== undefined) {
        this.ClickCallback = args.click;
    }

    this.ConvertToPercentages();
}

// Not the best function name.  Editable => draggable, expandable and deletable.
saElement.prototype.EditableOn = function() {
    this.Editable = true;
    this.Clickable = true;
    // I cannot get jqueryUI draggable to work.  Use my own events.
    var self = this;
    this.Div.on(
        'mousewheel.element',
        function(event){
            // Resize from the middle.
            return self.HandleMouseWheel(event.originalEvent);
        });
    // NOTE: I could not get key events working for delete key.
    // Just had to restart chrome. Delete key is oldschool anyway.

    // Manage the cursor for drag versus resize.
    this.Div.on(
        'mousemove.elementCursor',
        function (event) {
            return self.HandleMouseMoveCursor(event);
        });
}

saElement.prototype.EditableOff = function() {
    this.Editable = false;
    this.Div.css({'cursor':'auto'});
    // TODO: Remove wheel event.
    this.Div.off('mousewheel.element');
    this.Div.off('keyup.element');
    this.Div.off('mousemove.elementCursor');

    this.ButtonDiv.hide();
}


saElement.prototype.HandleMouseDown = function(event) {
    if (event.which == 1) {
        // Hack tp allow content editable to work with text editor.
        // This event does not let content editable receive events
        // if we return false.
        if ( ! this.Clickable) {
            return true;
        }

        var self = this;
        // To detect quick click for expansion.
        this.ClickStart = Date.now();
        $('body').on(
            'mouseup.element',
            function(e) {
                return self.HandleMouseUp(e);
            });

        if (this.Editable) {
            // Setup dragging.
            this.DragLastX = event.screenX;
            this.DragLastY = event.screenY;
            // Add the event to stop dragging

            $('body').on(
                'mousemove.element',
                function (event) {
                    return self.HandleMouseMove(event);
                });
            $('body').on(
                'mouseleave.element',
                function(e) {
                    return self.HandleMouseUp(e);
                });
        }
        return false;
    }
    return true;
}

// raise to the top of the draw order.
// Note: it will not override z-index
saElement.prototype.RaiseToTop = function() {
    var parent = this.Div.parent();
    this.Div.detach();
    this.Div.appendTo(parent);
}


saElement.prototype.HandleMouseMoveCursor = function(event) {
    if (event.which == 0) {
        if (event.srcElement != this.Div[0]) {
            this.Div.css({'cursor':'move'});
            this.MoveState = 0;
            return true;
        }
        var handleSize = 5;
        var x = event.offsetX;
        var y = event.offsetY;
        var width = this.Div.outerWidth() - handleSize;
        var height = this.Div.outerHeight() - handleSize;
        if ( x < handleSize) {
            this.Div.css({'cursor':'col-resize'});
            this.MoveState = 1;
        } else if ( x > width) {
            this.Div.css({'cursor':'col-resize'});
            this.MoveState = 2;
        } else if ( y < handleSize) {
            this.Div.css({'cursor':'row-resize'});
            this.MoveState = 3;
        } else if ( y > height) {
            this.Div.css({'cursor':'row-resize'});
            this.MoveState = 4;
        } else {
            this.Div.css({'cursor':'move'});
            this.MoveState = 0;
        }
    }
    return true;
}


saElement.prototype.HandleMouseMove = function(event) {
    if (event.which == 1) {
        // Wait for the click duration to start dragging.
        if (Date.now() - this.ClickStart < 200) {
            return true;
        }

        if ( ! this.Dragging) {
            this.RaiseToTop();
            this.Dragging = true;
        }

        var dx = event.screenX - this.DragLastX;
        var dy = event.screenY - this.DragLastY;
        this.DragLastX = event.screenX;
        this.DragLastY = event.screenY;

        // Maybe we should not let the object leave the page.
        var pos  = this.Div.position();
        var width = this.Div.width();
        var height = this.Div.height();
        if (this.AspectRatio && typeof(this.AspectRatio) != 'number') {
            this.AspectRatio = width / height;
        }
        if (this.MoveState == 0) {
            var left = pos.left + dx;
            var top  = pos.top + dy;
            this.Div[0].style.top  = top.toString()+'px';
            this.Div[0].style.left = left.toString()+'px';
            return false;
        } else if (this.MoveState == 1) {
            var left = pos.left + dx;
            width = width - dx;
            this.Div[0].style.left = left.toString()+'px';
            this.Div[0].style.width = width.toString()+'px';
            if (this.AspectRatio) {
                this.Div[0].style.height = (width/this.AspectRatio)+'px';
            }
            this.Div.trigger('resize');
            return false;
        } else if (this.MoveState == 2) {
            width = width + dx;
            this.Div[0].style.width = width.toString()+'px';
            if (this.AspectRatio) {
                this.Div[0].style.height = (width/this.AspectRatio)+'px';
            }
            this.Div.trigger('resize');
            return false;
        } else if (this.MoveState == 3) {
            var top = pos.top + dy;
            height = height - dy;
            this.Div[0].style.top = top.toString()+'px';
            this.Div[0].style.height = height.toString()+'px';
            if (this.AspectRatio) {
                this.Div[0].style.width = (height*this.AspectRatio)+'px';
            }
            this.Div.trigger('resize');
            return false;
        } else if (this.MoveState == 4) {
            height = height + dy;
            this.Div[0].style.height = height.toString()+'px';
            if (this.AspectRatio) {
                this.Div[0].style.width = (height*this.AspectRatio)+'px';
            }
            this.Div.trigger('resize');
            return false;
        }
    }
    return true;
}

saElement.prototype.HandleMouseUp = function(event) {
    // mouse up is not conditional on edit because it
    // is also used tio trigger click callback.
    $('body').off('mouseup.element');

    if (this.Editable) {
        if (this.Dragging) {
            this.Dragging = false;
            this.ConvertToPercentages();
        }
        $('body').off('mousemove.element');
        $('body').off('mouseleave.element');
    }

    // Quick click...
    var clickDuration = Date.now() - this.ClickStart;
    if (clickDuration < 200 && this.ClickCallback) {
        (this.ClickCallback)(this.Div[0]);
    }

    return false;
}

saElement.prototype.HandleMouseWheel = function(event) {
    var width = this.Div.width();
    var height = this.Div.height();
    var dWidth = 0;
    var dHeight = 0;

    var tmp = 0;
    if (event.deltaY) {
        tmp = event.deltaY;
    } else if (event.wheelDelta) {
        tmp = event.wheelDelta;
    }
    // Wheel event seems to be in increments of 3.
    // depreciated mousewheel had increments of 120....
    // Initial delta cause another bug.
    // Lets restrict to one zoom step per event.
    if (tmp > 0) {
        dWidth = 0.1 * width;
        dHeight = 0.1 * height;
    } else if (tmp < 0) {
        dWidth = width * (-0.091);
        dHeight = height * (-0.091);
    }

    width += dWidth;
    this.Div[0].style.width = width.toString()+'px';
    height += dHeight;
    this.Div[0].style.height = height.toString()+'px';

    // We have to change the top and left ot percentages too.
    // I might have to make my own resizable to get the exact behavior
    // I want.
    var pos  = this.Div.position();
    var left = pos.left - (dWidth / 2);
    var top  = pos.top - (dHeight / 2);
    this.Div[0].style.top  = top.toString()+'px';
    this.Div[0].style.left = left.toString()+'px';

    this.ConvertToPercentages();
    return false;
}


// Change left, top, widht and height to percentages.
saElement.prototype.ConvertToPercentages = function() {
    // I had issues with previous slide shows that had images with no width
    // set. Of course it won't scale right but they will still show up.
    var width = this.Div.width();
    if (width > 0) { // TODO: Remove this check after a while.
        // These always return pixel units.
        width = 100 * width / this.Div.parent().width();
        this.Div[0].style.width = width.toString()+'%';

        var height = this.Div.height();
        height = 100 * height / this.Div.parent().height();
        this.Div[0].style.height = height.toString()+'%';
    }

    var pos  = this.Div.position();
    var left = pos.left;
    var top  = pos.top;

    top  = 100 * top / this.Div.parent().height();
    left = 100 * left / this.Div.parent().width();
    this.Div[0].style.top  = top.toString()+'%';
    this.Div[0].style.left = left.toString()+'%';
}

//==============================================================================
// Just editing options to a rectangle.  I could make the text editor a 
// "subclass" of this rectangle object.

jQuery.prototype.saRectangle = function(args) {
    this.addClass('sa-presentation-rectangle');
    for (var i = 0; i < this.length; ++i) {
        dom = this[i];
        if ( ! dom.saRectangle) {
            dom.saRectangle = new saRectangle($(dom));
        }
        dom.saRectangle.ProcessArguments(args);
    }

    return this;
}

function saRectangle(div) {
    var self = this;
    this.Div = div;
    // Setup the superclass saElement.
    div.saElement();
    var element = div[0].saElement;
    this.BackgroundPanel = element.AddAccordionTab(
        "Background",
        function () {self.DialogInitialize();},
        function () {self.DialogApply();});

    // Background with gradient option.
    this.BackgroundLine1 = $('<div>')
        .appendTo(this.BackgroundPanel)
        .css({'width':'100%'});
    this.BackgroundCheck = $('<input type="checkbox">')
        .appendTo(this.BackgroundLine1)
        .change(function() {
            if($(this).is(":checked")) {
                self.BackgroundColor.spectrum('enable');
            } else {
                self.BackgroundColor.spectrum('disable');
            }
        });
    this.BackgroundColorLabel = $('<div>')
        .appendTo(this.BackgroundLine1)
        .css({'display': 'inline-block',
              'padding':'0px 5px',
              'width':'4em',
              'height':'20px',
              'text-align': 'right'})
        .text("Color");
    this.BackgroundColorDiv = $('<div>')
        .appendTo(this.BackgroundLine1)
        .css({'display':'inline-block',
              'height':'18px',
              'margin-left':'1em'});
    this.BackgroundColor = $('<input type="text">')
        .appendTo(this.BackgroundLine1)
        .val('#005077')
        .spectrum({showAlpha: true});
    this.BackgroundColor.spectrum('disable');

    // Gradient
    this.BackgroundLine2 = $('<div>')
        .appendTo(this.BackgroundPanel)
        .css({'width':'100%'});
    this.GradientCheck = $('<input type="checkbox">')
        .appendTo(this.BackgroundLine2)
        .change(function() {
            if($(this).is(":checked")) {
                self.GradientColor.spectrum('enable');
                self.GradientColor.spectrum('show');
            } else {
                self.GradientColor.spectrum('disable');
                self.GradientColor.spectrum('hide');
            }
        });
    this.GradientLabel = $('<div>')
        .appendTo(this.BackgroundLine2)
        .css({'display': 'inline-block',
              'padding':'0px 5px',
              'width':'4em',
              'height':'20px',
              'text-align': 'right'})
        .text("Gradient");
    this.GradientColorDiv = $('<div>')
        .appendTo(this.BackgroundLine2)
        .css({'display':'inline-block',
              'height':'18px',
              'margin-left':'1em'});
    this.GradientColor = $('<input type="text">')
        .appendTo(this.GradientColorDiv)
        .val('#005077')
        .spectrum({showAlpha: true});
}

saRectangle.prototype.ProcessArguments = function(args) {
    this.Div[0].saElement.ProcessArguments(args);
}

saRectangle.prototype.DialogInitialize = function () {
    var color = this.Div[0].style.background;
    if (color == '') {
        color = this.Div[0].style.backgroundColor;
    }
    if (color == '') {
        this.BackgroundCheck.prop('checked', false);
        this.BackgroundColor.spectrum('disable');
        this.GradientCheck.prop('checked', false);
        this.GradientColor.spectrum('disable');
        this.GradientColor.spectrum('hide');
        return;
    }
    if (color.substring(0,3) == 'rgb') {
        // Single color in background (no 'linear-gradient')
        this.BackgroundCheck.prop('checked', true);
        this.BackgroundColor.spectrum('set',color);
        this.BackgroundColor.spectrum('enable');
        this.GradientCheck.prop('checked', false);
        this.GradientColor.spectrum('disable');
        this.GradientColor.spectrum('hide');
        return;
    }
    // parsing the gradient is a bit harder.
    if (color.substring(0,15) == 'linear-gradient') {
        var idx0 = color.indexOf('rgb');
        var idx1 = color.indexOf(')') + 1;
        this.BackgroundCheck.prop('checked', true);
        this.BackgroundColor.spectrum('enable');
        this.BackgroundColor.spectrum('set',color.substring(idx0,idx1));
        idx0 = color.indexOf('rgb', idx1);
        idx1 = color.indexOf(')', idx1) + 1;
        this.GradientCheck.prop('checked', true);
        this.GradientColor.spectrum('enable');
        this.GradientColor.spectrum('show');
        this.GradientColor.spectrum('set',color.substring(idx0,idx1));
        return;
    }
    saDebug("parse error: " + color);
}

saRectangle.prototype.DialogApply = function () {
    if ( ! this.BackgroundCheck.is(":checked")) {
        this.Div.css('background', '');
        return;
    }
    var color = this.BackgroundColor.spectrum('get');
    if ( ! this.GradientCheck.is(":checked")) {
        this.Div.css({'background': color});
        return;
    }
    var color2 = this.GradientColor.spectrum('get');
    this.Div.css({'background': 'linear-gradient('+color+','+color2+')'});
}

//==============================================================================
// Text: dialog to set margin, text size, spacing, (font in the future)

jQuery.prototype.saText = function(args) {
    this.addClass('sa-text');
    for (var i = 0; i < this.length; ++i) {
        dom = this[i];
        if ( ! dom.saText) {
            dom.saText = new saText($(dom));
        }
        dom.saText.ProcessArguments(args);
    }

    return this;
}

function saText(div) {
    var self = this;
    this.Div = div;
    // Setup the superclass saElement.
    // It may not be necessary to have official super classes.
    // We could follow the interface pattern.
    div.saRectangle();
    var element = div[0].saElement;
    this.PaddingPanel = element.AddAccordionTab(
        "Margins",
        function () {self.DialogPaddingInitialize();},
        function () {self.DialogPaddingApply();});
    // Padding (text margins)
    // Left
    this.PaddingLeftLine = $('<div>')
        .appendTo(this.PaddingPanel)
        .css({'width':'100%'});
    this.PaddingLeftLabel = $('<div>')
        .appendTo(this.PaddingLeftLine)
        .css({'display': 'inline-block',
              'padding':'0px 5px',
              'width':'4em',
              'height':'20px',
              'text-align': 'right'})
        .text("Left:");
        this.PaddingLeft =
            $('<input type="number">')
            .appendTo(this.PaddingLeftLine)
            .keypress(function(event) { return event.keyCode != 13; });
    // Top
    this.PaddingTopLine = $('<div>')
        .appendTo(this.PaddingPanel)
        .css({'width':'100%'});
    this.PaddingTopLabel = $('<div>')
        .appendTo(this.PaddingTopLine)
        .css({'display': 'inline-block',
              'padding':'0px 5px',
              'width':'4em',
              'height':'20px',
              'text-align': 'right'})
        .text("Top:");
        this.PaddingTop =
            $('<input type="number">')
            .appendTo(this.PaddingTopLine)
            .keypress(function(event) { return event.keyCode != 13; });
    // Right
    this.PaddingRightLine = $('<div>')
        .appendTo(this.PaddingPanel)
        .css({'width':'100%'});
    this.PaddingRightLabel = $('<div>')
        .appendTo(this.PaddingRightLine)
        .css({'display': 'inline-block',
              'padding':'0px 5px',
              'width':'4em',
              'height':'20px',
              'text-align': 'right'})
        .text("Right:");
        this.PaddingRight =
            $('<input type="number">')
            .appendTo(this.PaddingRightLine)
            .keypress(function(event) { return event.keyCode != 13; });
    // Bottom
    this.PaddingBottomLine = $('<div>')
        .appendTo(this.PaddingPanel)
        .css({'width':'100%'});
    this.PaddingBottomLabel = $('<div>')
        .appendTo(this.PaddingBottomLine)
        .css({'display': 'inline-block',
              'padding':'0px 5px',
              'width':'4em',
              'height':'20px',
              'text-align': 'right'})
        .text("Bottom:");
        this.PaddingBottom =
            $('<input type="number">')
            .appendTo(this.PaddingBottomLine)
            .keypress(function(event) { return event.keyCode != 13; });

}

saText.prototype.ProcessArguments = function(args) {
    this.Div[0].saRectangle.ProcessArguments(args);
}

saText.prototype.DialogPaddingInitialize = function () {
    var txt;

    txt = this.Div[0].style.paddingLeft;
    // Convert to something like pixels.
    this.PaddingLeft.val(8*parseFloat(txt)); // window 800 pixels high

    txt = this.Div[0].style.paddingTop;
    // Convert to something like pixels.
    this.PaddingTop.val(8*parseFloat(txt)); // window 800 pixels high

    txt = this.Div[0].style.paddingRight;
    // Convert to something like pixels.
    this.PaddingRight.val(8*parseFloat(txt)); // window 800 pixels high

    txt = this.Div[0].style.paddingBottom;
    // Convert to something like pixels.
    this.PaddingBottom.val(8*parseFloat(txt)); // window 800 pixels high
}

saText.prototype.DialogPaddingApply = function () { 
    this.Div[0].style.paddingLeft = (this.PaddingLeft.val()/8)+'%';
    this.Div[0].style.paddingTop = (this.PaddingTop.val()/8)+'%';
    this.Div[0].style.paddingRight = (this.PaddingRight.val()/8)+'%';
    this.Div[0].style.paddingBottom = (this.PaddingBottom.val()/8)+'%';
}

//==============================================================================
// Questions
jQuery.prototype.saQuestion = function(args) {
    for (var i = 0; i < this.length; ++i) {
        if ( ! this[i].saQuestion) {
            // Add the helper as an instance variable to the dom object.
            this[i].saQuestion = new saQuestion($(this[i]));;
            this[i].saElement.HideAccordionTab('Quiz');
        }
        this[i].saQuestion.ProcessArguments(args);
    }

    return this;
}

function saQuestion(div) {
    var self = this;
    this.Div = div;
    this.Div.addClass('sa-question');

    // Setup the superclass saRectangle.
    div.saText();
    var element = div[0].saElement;
    element.Dialog.Dialog.css({'width':'500px'});

    this.QuestionPanel = element.AddAccordionTab(
        "Question",
        function () { self.DialogInitialize(); },
        function () { self.DialogApply(); });

    this.DialogInitialize();
}

saQuestion.prototype.AddAnswer = function(parent, answerList, text, checked) {
    var self = this;

    // Make a new answer box;
    var answerDiv = $('<div>')
        .appendTo(parent)
        .css({'width':'100%',
              'position':'relative'});
    var check = $('<input type="checkbox">')
        .appendTo(answerDiv);
    var answer = $('<div>')
        .appendTo(answerDiv)
        .css({'border':'1px solid #AAA',
              'position':'absolute',
              'left':'30px',
              'right':'2px',
              'top':'2px'})
        .attr('contenteditable', 'true');
    check.change(
        function() {
            if($(this).is(":checked")) {
                answer.css({'font-weight':'bold'});
            } else {
                answer.css({'font-weight':'normal'});
            }
        });

    if (text) {
        answer.text(text);
        if (checked) {
            check.attr('checked','true');
            answer.css({'font-weight':'bold'});
        }
    }

    // Answers are complicated enough that I ma going to have to break down
    // and create differt gui object.
    var answerObj = {Div   : answerDiv,
                     Check : check,
                     Input : answer};
    answerList.push(answerObj);
    return answerObj;
}

saQuestion.prototype.ProcessArguments = function(args) {
    this.Div[0].saText.ProcessArguments(args);
}

saQuestion.prototype.DialogInitialize = function () {
    var self = this;
    // Create/recreate the question dialog panel.
    var panel = this.QuestionPanel;
    panel.empty();

    this.QuestionTypeSelect = $('<select>')
        .appendTo(panel);
    this.QuestionTypeMultipleChoice = $('<option>')
        .appendTo(this.QuestionTypeSelect)
        .text("Multiple Choice");
    this.QuestionTypeSortAnswer = $('<option>')
        .appendTo(this.QuestionTypeSelect)
        .text("Short Answer");
    this.QuestionTypeTrueFalse = $('<option>')
        .appendTo(this.QuestionTypeSelect)
        .text("True or False");
    this.QuestionTypeSelect.change(
        function (){
            if ($(this).val() == "Multiple Choice") {
                self.MultipleChoiceDiv.show();
                self.TrueFalseDiv.hide();
                self.ShortAnswerDiv.hide();
            }
            if ($(this).val() == "True or False") {
                self.MultipleChoiceDiv.hide();
                self.TrueFalseDiv.show();
                self.ShortAnswerDiv.hide();
            }
            if ($(this).val() == "Short Answer") {
                self.MultipleChoiceDiv.hide();
                self.TrueFalseDiv.hide();
                self.ShortAnswerDiv.show();
            }
        });

    this.QuestionLabel = $('<div>')
        .appendTo(panel)
        .text("Question:");
    this.Question = $('<div>')
        .appendTo(panel)
        .css({'border':'1px solid #AAA',
              'margin':'2px'})
        .attr('contenteditable', 'true');

    // The div itself is the answer input.
    this.ShortAnswerDiv = $('<div>')
        .appendTo(panel)
        .css({'border':'1px solid #AAA',
              'width':'100%',
              'height':'3em',
              'margin':'1px'})
        .attr('contenteditable', 'true')
        .hide();

    this.TrueFalseDiv = $('<div>')
        .appendTo(panel)
        .hide();
    this.TrueFalseAnswers = [];
    this.AddAnswer(this.TrueFalseDiv, this.TrueFalseAnswers, "True");
    this.AddAnswer(this.TrueFalseDiv, this.TrueFalseAnswers, "False");

    this.MultipleChoiceDiv = $('<div>')
        .appendTo(panel);
    this.MultipleChoiceAnswerLabel = $('<div>')
        .appendTo(this.MultipleChoiceDiv)
        .addClass('sa-mutliple-choice-answer')
        .text("Answers:");
    this.MultipleChoiceAnswers = [];

    // Initialize the question panel values from a question div (saQuestion).

    // Get the question information from the html.
    var questionDiv = this.Div.find('.sa-q');
    if (questionDiv.length > 0) {
        this.Question.text(questionDiv.text());
        var type = this.Div.attr('type');
        if (type == 'multiple-choice') {
            this.QuestionTypeSelect.val("Multiple Choice");
            var options = this.Div.find('.sa-answer');
            for (var i = 0; i < options.length; ++i) {
                var item = $(options[i]);
                var checked = item.css('font-weight') == 'bold';
                this.AddAnswer(this.MultipleChoiceDiv,
                               this.MultipleChoiceAnswers,
                               item.text(), checked);
            }
        }
    }

    // Empty answer that adds another when it is filled.
    this.AddMultipleChoiceAnswer();
}

saQuestion.prototype.AddMultipleChoiceAnswer = function () {
    var self = this;
    var answerObj = this.AddAnswer(this.MultipleChoiceDiv,
                                   this.MultipleChoiceAnswers);
    answerObj.Input.on('focus.answer',
                       function() {
                           self.AddMultipleChoiceAnswer();
                       });
}

saQuestion.prototype.DialogApply = function () {
    this.Div.find('.sa-q').remove();
    this.Div.find('ol').remove();

    var tmp = $('<div>')
        .appendTo(this.Div)
        .addClass('sa-q')
        .text(this.Question.text());

    if (this.QuestionTypeSelect.val() == "Multiple Choice") {
        this.Div.attr('type','multiple-choice');
        tmp = $('<ol>')
            .appendTo(this.Div)
            .css({'margin':'0px 0px 0px 0.5em'});
        for (var i = 0; i < this.MultipleChoiceAnswers.length; ++i) {
            var answer = this.MultipleChoiceAnswers[i];
            if (answer.Input.text() != "") {
                var a = $('<li>')
                    .appendTo(tmp)
                    .addClass('sa-multiple-choice-answer')
                    .text(answer.Input.text());
                if (answer.Check.is(':checked')) {
                    a.css({'font-weight':'bold'});
                    a.attr('checked','true');
                } else {
                    a.attr('checked','false');
                }
            }
        }
    }
    if (this.QuestionTypeSelect.val == "True or False") {
        this.Div.attr('type','true-false');
        // TODO: Share code with multiple choice
        // TODO: Make true false be mutually exclusive (radio button).
        tmp = $('<ol>')
            .appendTo(this.Div)
            .css({'margin':'0px 0px 0px 0.5em'});
        for (var i = 0; i < this.TrueFalseAnswers.length; ++i) {
            var answer = this.TrueFalseAnswers[i];
            if (answer.Input.text() != "") {
                var a = $('<li>')
                    .appendTo(tmp)
                    .addClass('sa-true-false-answer')
                    .text(answer.Input.text());
                if (answer.Check.is(':checked')) {
                    a.css({'font-weight':'bold'});
                    a.attr('checked','true');
                } else {
                    a.attr('checked','false');
                }
            }
        }
    }
    if (this.QuestionTypeSelect.val == "Short Answer") {
        this.Div.attr('type','short-answer');
        var tmp = $('<div>')
            .appendTo(this.Div)
            .addClass('sa-short-answer')
            .text(this.ShortAnswerDiv.text());
    }
}


//==============================================================================
// Make any div into a text editor.
// Will be used for the presentation html editor.
// Note,  scalable font should be set before text editor if you want scale buttons.
// TODO: 
// - The editor is position 'absolute' and is placed with percentages.
//   Make pixel positioning an option

// args: {dialog: true}
jQuery.prototype.saTextEditor = function(args) {
    for (var i = 0; i < this.length; ++i) {
        if ( ! this[i].saTextEditor) {
            var textEditor = new saTextEditor($(this[i]), args);
            // Add the viewer as an instance variable to the dom object.
            this[i].saTextEditor = textEditor;
            // TODO: Hide any dialog tabs?
        }
        this[i].saTextEditor.ProcessArguments(args);
    }

    return this;
}

// TODO: Get rid of this.  KeyHandler can return false, even if we have not
// gotten rid of the event manager.
// I hate to use this hack, but I need to stop other events from triggering.
var CONTENT_EDITABLE_HAS_FOCUS = false;

function saTextEditor(div) {
    var self = this;
    this.Div = div;
    this.Div.addClass('sa-text-editor');

    div.saText({click: function() {
        self.EditingOn();
    }});

    // Dialog tab
    var element = div[0].saElement;
    this.TextPanel = element.AddAccordionTab(
        "Text",
        function () {self.DialogInitialize();},
        function () {self.DialogApply();});
    
    // Font Size
    this.FontSizeDiv = $('<div>')
        .appendTo(this.TextPanel)
        .css({'height':'32px'})
        .addClass("sa-view-annotation-modal-div");
    this.FontSizeLabel = $('<div>')
        .appendTo(this.FontSizeDiv)
        .text("Font Size:")
        .addClass("sa-view-annotation-modal-input-label");
    this.FontSize = $('<input type="number">')
        .appendTo(this.FontSizeDiv)
        .addClass("sa-view-annotation-modal-input")
        .keypress(function(event) { return event.keyCode != 13; });

    // Font Color
    this.FontColorDiv = $('<div>')
        .appendTo(this.TextPanel)
        .css({'height':'32px'})
        .addClass("sa-view-annotation-modal-div");
    this.FontColorLabel = $('<div>')
        .appendTo(this.FontColorDiv)
        .text("Color:")
        .addClass("sa-view-annotation-modal-input-label");
    this.FontColor =
        $('<input type="text">')
        .appendTo(this.FontColorDiv)
        .val('#050505')
        .spectrum({showAlpha: true});

    // Line Height
    this.LineHeightDiv = $('<div>')
        .appendTo(this.TextPanel)
        .css({'height':'32px'})
        .addClass("sa-view-annotation-modal-div");
    this.LineHeightLabel = $('<div>')
        .appendTo(this.LineHeightDiv)
        .text("Line Height %:")
        .addClass("sa-view-annotation-modal-input-label");
    this.LineHeight = $('<input type="number">')
        .appendTo(this.LineHeightDiv)
        .addClass("sa-view-annotation-modal-input")
        .val(1)
        .keypress(function(event) { return event.keyCode != 13; });


    // Create a div for the editor options.
    // These will only become visible when you click / select
    this.Div.css({'overflow':'visible'}); // so the buttons are not cut off
    this.EditButtonDiv = $('<div>')
        .appendTo(this.Div)
        .addClass('.sa-edit-gui') // Remove before saHtml save.
        .css({'height':'20px',
              'position':'absolute',
              'top':'-20px',
              'left':'0px',
              'width':'275px',
              'cursor':'auto'})
        .hide()
        // Block the saElement click event.
        .mousedown(function(){return false;});

    this.AddButton("webgl-viewer/static/link.png", "link URL",
                   function() {self.InsertUrlLink();});
    this.AddButton("webgl-viewer/static/font_bold.png", "bold",
                   function() {
                       document.execCommand('bold',false,null);});
    this.AddButton("webgl-viewer/static/text_italic.png", "italic",
                   function() {document.execCommand('italic',false,null);});
    this.AddButton("webgl-viewer/static/edit_underline.png", "underline",
                   function() {document.execCommand('underline',false,null);});
    this.AddButton("webgl-viewer/static/list_bullets.png", "unorded list",
                   function() {document.execCommand('InsertUnorderedList',false,null);});
    this.AddButton("webgl-viewer/static/list_numbers.png", "ordered list",
                   function() {document.execCommand('InsertOrderedList',false,null);});
    this.AddButton("webgl-viewer/static/indent_increase.png", "indent",
                   function() {document.execCommand('indent',false,null);});
    this.AddButton("webgl-viewer/static/indent_decrease.png", "outdent",
                   function() {document.execCommand('outdent',false,null);});
    this.AddButton("webgl-viewer/static/alignment_left.png", "align left",
                   function() {document.execCommand('justifyLeft',false,null);});
    this.AddButton("webgl-viewer/static/alignment_center.png", "align center",
                   function() {document.execCommand('justifyCenter',false,null);});
    this.AddButton("webgl-viewer/static/alignment_full.png", "align full",
                   function() {document.execCommand('justifyFull',false,null);});
    this.AddButton("webgl-viewer/static/edit_superscript.png", "superscript",
                   function() {document.execCommand('superscript',false,null);});
    this.AddButton("webgl-viewer/static/edit_subscript.png", "subscript",
                   function() {document.execCommand('subscript',false,null);});
}

saTextEditor.prototype.EditingOn = function() {
    this.EditButtonDiv.show();

    // TODO: Get rid of this hack.
    // Keyup should return false.
    CONTENT_EDITABLE_HAS_FOCUS = true;

    // Bad name. Actually movable.
    // TODO: Change this name.
    this.SavedMovable = this.Div[0].saElement.Editable;
    this.Div[0].saElement.EditableOff();
    this.Div[0].saElement.Clickable = false;

    var self = this;
    this.Div
        .attr('contenteditable', 'true')
        .css({'cursor':'text'})
        .on('mouseleave.textEditor',
            function () {
                self.EditingOff();
            });
}

saTextEditor.prototype.EditingOff = function() {
    this.EditButtonDiv.hide();

    if (this.SavedMovable) {
        this.Div[0].saElement.EditableOn();
    }
    this.Div[0].saElement.Clickable = true;
    this.Div
        .attr('contenteditable', 'false')
        .off('mouseleave.textEditor');
}

saTextEditor.prototype.AddButton = function(src, tooltip, callback, prepend) {
    var buttonsDiv = this.EditButtonDiv;

    var button = $('<img>')
        .addClass('editButton')
        .css({'height':'16px'})
        .attr('src',src);
    if (callback) {
        button.click(callback);
    }

    if (tooltip) {
        button.prop('title', tooltip);
    }

    if ( prepend) {
        button.prependTo(buttonsDiv);
    } else {
        button.appendTo(buttonsDiv);
    }

    return button;
}

saTextEditor.prototype.ProcessArguments = function(args) {
    args = args || {dialog : true};
    this.Div[0].saText.ProcessArguments(args);
}

saTextEditor.prototype.DialogInitialize = function() {
    var str;

    // iniitalize the values.
    if (this.Div[0].saScalableFont) {
        var scale = this.Div[0].saScalableFont.scale;
        var fontSize = Math.round(scale * 800);
        this.FontSize.val(fontSize);
    }

    var color = '#000000';
    str = this.Div[0].style.color;
    if (str != "") {
        color = ConvertColorToHex(str);
    }
    this.FontColor.spectrum('set',color);

    var lineHeight = 120; // default value?
    var str = this.Div[0].style.lineHeight;
    if (str != "") {
        if (str.substring(str.length-1) == "%") {
            lineHeight = parseFloat(str.substr(0,str.length-1));
        }
    }
    this.LineHeight.val(lineHeight);
}

saTextEditor.prototype.DialogApply = function() {
    //this.Div.css({'padding'      : '1%',
    //              'border-radius': '3px'});

    if (this.FontSize) {
        var scale = parseFloat(this.FontSize.val()) / 800;
        var jSel = this.Div;
        // It is contained in a parent scalable font, so just set the attribute.
        //jSel.setAttribute('sa-font-scale', scale.toString());
        jSel.saScalableFont({scale:scale});
    }

    if (this.LineHeight) {
        var lineHeight = parseFloat(this.LineHeight.val());
        this.Div[0].style.lineHeight = lineHeight + "%";
    }

    if (this.FontColor) {
        var color = this.FontColor.spectrum('get');
        this.Div[0].style.color = color;
    }
    
    var color = '#000000';
    str = this.Div[0].style.color;
    if (str != "") {
        color = str;
    }
    this.FontColor.spectrum('set',color);
}

saTextEditor.prototype.Delete = function() {
    //this.DragHandle.remove();
    //this.ButtonDiv.remove();
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
        var dialog = new Dialog(
            function() {
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
            .on('input', function () {
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

// This does not work yet.!!!!!!!!!!!!!!!
// Returns the jquery object selected.  If a partial object is selected,
// the dom is split up into fragments.
saTextEditor.prototype.GetSelection = function() {
    var sel = window.getSelection();
    var range;
    var parent = null;

    // Two conditions when we just return the top level div:
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
        return this.Div;
    }

    // Insert the fragments without a container.
    var children = range.extractContents().children;
    for (var i = 0; i < children.length; ++i) {
        range.insertNode(children[i]);
    }
    return $(children);
    
    // Create a new span around the fragment.
    //var newNode = document.createElement('span');    
    //newNode.appendChild(range.extractContents()); 
    //range.insertNode(newNode)
    //return $(newNode);
}

// Get the selection in this editor.  Returns a range.
// If not, the range is collapsed at the 
// end of the text and a new line is added.
// Returns the range of the selection.
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

// Set in position in pixels
saTextEditor.prototype.SetPositionPixel = function(x, y) {
    /*this.ButtonDiv
        .css({'left'  :(x+20)+'px',
              'top'   :(y-20) +'px'})*/
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
// a "subclass" of saElement.
// Click expands the element.
// TODO:
// Do not expand images larger than their native resolution (double maybe?)
// Change answer to question in the properties menu.
// Camera gets restored on shrink (even in edit mode) 
//   Maybe push pin or camera icon to capture changes


jQuery.prototype.saLightBox = function(args) {
    this.addClass('sa-light-box');
    for (var i = 0; i < this.length; ++i) {
        if ( ! this[i].saLightBox) {
            var helper = new saLightBox($(this[i]));
            // Add the helper as an instance variable to the dom object.
            this[i].saLightBox = helper;
        }
        this[i].saLightBox.ProcessArguments(args);
    }

    return this;
}

function saLightBox(div) {
    var self = this;
    div.saElement({click: function() {self.Expand(true);}});

    this.Div = div;
    this.Expanded = false;
    this.ExpandCallback = null;
    this.AspectRatio = false;

    // Mask is to gray out background and consume events.
    // All lightbox items in this parent will share a mask.
    var parent = div.parent();
    this.Mask = parent.find('.sa-light-box-mask');
    if ( this.Mask.length == 0) {
        this.Mask = $('<div>')
            .appendTo(parent)
            .addClass('.sa-light-box-mask') // So it can be retrieved.
            .addClass('.sa-edit-gui') // Remove before saHtml save.
            .hide()
            .css({'position':'absolute',
                  'left':'0px',
                  'top':'0px',
                  'width':'100%',
                  'height':'100%',
                  'z-index':'99',
                  'opacity':'0.5',
                  'background-color':'#000'});
    }
}

saLightBox.prototype.ProcessArguments = function(args) {
    this.Div.saElement(args);

    if (args.aspectRatio !== undefined) {
        this.AspectRatio = args.aspectRatio;
    }

    // lightbox and element editable flags are not always the same.
    // When expanded, The element editable is turned off.
    if (args.editable !== undefined) {
        this.Editable = args.editable;
    }

    // External control of expanding or shrinking.
    if (args.expand !== undefined) {
        this.Expand(args.expand, args.animate);
    }

    // Callback when expanded state changes.
    // Viewer interaction is only enabled when the element expands.
    if (args.onExpand) {
        this.ExpandCallback = args.onExpand;
    }
}

// I cannot put this directly as a callback because it 
// overwrites the viewer resize method.
saLightBox.prototype.UpdateSize = function() {
    if ( ! this.Expanded) { return; }

    var self = this;
    var left = '5%';
    var top = '5%';
    var width = '90%';
    var height = '90%';
    if (this.AspectRatio) {
        // Hack to get expanded images to resize.
        if ( ! this.Div[0].onresize) {
            this.Div[0].onresize =
                function() {
                    self.UpdateSize();
                }
            this.Div.addClass('sa-resize');
        }

        // Compute the new size.
        var ratio = this.Div.width() / this.Div.height();
        var pWidth = this.Div.parent().width();
        var pHeight = this.Div.parent().height();
        width = Math.floor(pWidth * 0.9);
        height = Math.floor(pHeight * 0.9);
        if (width / height > ratio) {
            width = Math.floor(height * ratio);
        } else {
            height = Math.floor(width / ratio);
        }
        left = Math.floor(0.5*(pWidth-width)) + 'px';
        top = Math.floor(0.5*(pHeight-height)) + 'px';
        width = width + 'px';
        height = height + 'px';
    }

    // Make the image big
    // Not resize handles have z-index 1000 !
    // I am close to just implementing my own resize feature.
    this.Div.css({'z-index':'1001'});
    this.Div.css({'left'  : left,
                  'top'   : top,
                  'width' : width,
                  'height': height});
}

saLightBox.prototype.Expand = function(flag, animate) {
    if (flag == this.Expanded) { return; }
    var self = this;
    if (flag) {
        this.Div.saElement({editable:false});
        // We have to disable teh expand behavior too.
        this.Expanded = true;
        
        // Save the current position and size.
        this.SavedTop = this.Div[0].style.top;
        this.SavedLeft = this.Div[0].style.left;
        this.SavedWidth = this.Div[0].style.width;
        this.SavedHeight = this.Div[0].style.height;
        this.SavedZIndex = this.Div[0].style.zIndex;

        // Make the image big
        // Not resize handles have z-index 1000 !
        // I am close to just implementing my own resize feature.
        this.Div.css({'z-index':'1001'});
        this.UpdateSize();
        this.Div.trigger('resize');

        // Show the mask.
        this.Mask.show();
        // Clicking outside the div will cause the div to shrink back to
        // its original size.
        this.Mask.on(
            'mousedown.lightbox',
            function () {
                self.Expand(false, true);
            });
    } else {
        // Reverse the expansion.
        // hide the mask
        this.Mask.hide();
        // remove event to shrink div.
        this.Mask.off('mousedown.lightbox');
        if (animate) {
            this.Div.animate({'top':self.SavedTop,
                              'left':self.SavedLeft,
                              'width':self.SavedWidth,
                              'height':self.SavedHeight,
                              'z-index':self.SavedZIndex},
                             {step: function () {self.Div.trigger('resize');}});

        } else {
            this.Div.css({'top':self.SavedTop,
                          'left':self.SavedLeft,
                          'width':self.SavedWidth,
                          'height':self.SavedHeight,
                          'z-index':self.SavedZIndex});
        }
        this.Expanded = false;
        if (this.Editable) {
            this.Div.saElement({editable:true});
        }
    }

    // External changes with editability (viewer interaction).
    if (this.ExpandCallback) {
        (this.ExpandCallback)(flag);
    }
    this.Div.trigger('resize');
}


//==============================================================================
// Combination of lightbox and viewer.
// This simply manages the switch betweenlight box interaction and viewer
// interaction.

jQuery.prototype.saLightBoxViewer = function(args) {
    if ( ! args.hideCopyright) {
        args.hideCopyright = true;
    }
    // Small viewer does not have overview
    args.overview = false;
    var editable = args.editable;
        
    this.saViewer(args)
        .saAnnotationWidget("hide")
        .saLightBox(
            {editable:editable,
             onExpand : function(expanded) {
                 this.Div.saViewer({interaction:expanded});
                 if (expanded) {
                     this.Div.saAnnotationWidget("show");
                     this.Div.saViewer({overview : true,
                                        menu     : true});
                 } else {
                     this.Div.saAnnotationWidget("hide");
                     this.Div.saViewer({overview : false,
                                        menu     : false});
                     // TODO: Formalize this hack. Viewer formally needs a note.
                     // If not editable, restore the note.
                     var viewer = this.Div[0].saViewer;
                     var note = viewer.saNote;
                     var index = viewer.saViewerIndex || 0;
                     if ( ! this.Div[0].saLightBox.Editable && note) {
                         note.ViewerRecords[index].Apply(viewer);
                     }
                 }
             }
            });

    return this;
}



//==============================================================================
// A common dialog class for all sa objects.
// Abstraction of text dialog for rectangles.
// Internal helper.
function saGetDialog(domElement, showCallback, applyCallback) {
    if ( ! domElement.saDialog) {
        var helper = new Dialog(function () {saDialogApplyCallback(domElement);});
        if ( ! helper.ShowCallbacks) { helper.ShowCallbacks = []; }
        if ( ! helper.ApplyCallbacks) { helper.ApplyCallbacks = []; }
        saAddButton(domElement, "webgl-viewer/static/Menu.jpg", "properties",
                    function() { saDialogShowCallback(domElement); });
        domElement.saDialog = helper;
    }
    // I assume that the users will add variables to the dialog.
    if (showCallback) {domElement.saDialog.ShowCallbacks.push(showCallback);}
    if (applyCallback) {domElement.saDialog.ApplyCallbacks.push(applyCallback);}
    return domElement.saDialog;
}

// Remove the dialog.
// Incomplete. I need to remove the dialog button.
var saDialogDelete = function(element) {
    if ( ! element.saDialog) { return; }
    element.saDialog.Dialog.Body.empty;
    delete element.saDialog;
    //element.saDelete.ButtonsDiv.remove();
}

var saDialogShowCallback = function(element) {
    var callbacks = element.saDialog.ShowCallbacks;
    for (var i = 0; i < callbacks.length; ++i) {
        (callbacks[i])(element);
    }
    element.saDialog.Show(true);
}


var saDialogApplyCallback = function(element) {
    var callbacks = element.saDialog.ApplyCallbacks;
    for (var i = 0; i < callbacks.length; ++i) {
        (callbacks[i])(element);
    }
}




//==============================================================================
// A common parent for all sa buttons (for this element).
// Handle showing and hiding buttons.  Internal helper.

// Just for enabling and disabling the edit buttons
// cmd: "enable" or "disable"

// Only one set of buttons are visible at a time.
var SA_BUTTONS_VISIBLE = null;

jQuery.prototype.saButtons = function(cmd) {
    if (cmd == 'enable') {
        for (var i = 0; i < this.length; ++i) {
            saButtonsEnable(this[i]);
        }
    }
    if (cmd == 'disable') {
        for (var i = 0; i < this.length; ++i) {
            saButtonsDisable(this[i]);
        }
    }
}


function saGetButtonsDiv(domElement) {
    if ( ! domElement.saButtons) {
        // Edit buttons.
        var helper = new saButtons($(domElement));
        domElement.saButtons = helper;
    }
    return domElement.saButtons.ButtonsDiv;
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
              'width' :'360px', // TODO: see if we can get rid of the width.
              'z-index': '10'});
    // Make it easy to enable and disable these edit buttons.
    this.ButtonsDiv[0].saButtons = this;
    // Show the buttons on hover.
    var self = this;
    this.ButtonsDiv
        .mouseenter(function () { self.ShowButtons(2); })
        .mouseleave(function () { self.HideButtons(); });

    this.Div
        .mouseenter(function () { self.ShowButtons(1); })
        .mouseleave(function () { self.HideButtons(); });
}

saButtons.prototype.PlaceButtons = function () {
    var pos = this.Div.position();
    this.ButtonsDiv
        .css({'left'  :(pos.left+10)+'px',
              'top'   :(pos.top-20) +'px'});
}

saButtons.prototype.ShowButtons = function (level) {
    if (this.TimerId >= 0) {
        clearTimeout(this.TimerId);
        this.TimerId = -1;
    }
    if (this.Enabled) {
        if (SA_BUTTONS_VISIBLE && SA_BUTTONS_VISIBLE != this.ButtonsDiv) {
            SA_BUTTONS_VISIBLE.fadeOut(200);
            SA_BUTTONS_VISIBLE = this.ButtonsDiv;
        }
        this.PlaceButtons();
        if (level == 1) {
            this.ButtonsDiv
                .fadeIn(400);
            this.ButtonsDiv.children()
                .css({'opacity':'0.4'});
        } else {
            this.ButtonsDiv
                .show();
            this.ButtonsDiv.children()
                .css({'opacity':'1.0'});
        }
    }
}

saButtons.prototype.HideButtons = function () {
    if (this.TimerId < 0) {
        var self = this;
        this.TimerId =
            setTimeout(function () {
                if (SA_BUTTONS_VISIBLE == self.ButtonsDiv) {
                    SA_BUTTONS_VISIBLE = null;
                }
                self.ButtonsDiv.fadeOut(200);
            }, 200);
    }
}


function saAddButton (domElement, src, tooltip, callback, prepend) {
    var buttonsDiv = saGetButtonsDiv(domElement);

    var button = $('<img>')
        .addClass('editButton')
        .css({'height':'16px'})
        .attr('src',src);
    if (callback) {
        button.click(callback);
    }

    if (tooltip) {
        button.prop('title', tooltip);
    }

    if ( prepend) {
        button.prependTo(buttonsDiv);
    } else {
        button.appendTo(buttonsDiv);
    }

    return button;
}

// private functions.
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
        this.find('.sa-scalable-font').saScalableFont();
        //this.find('.sa-full-window-option').saFullWindowOption();
        // TODO: Move this out of this file.
        this.find('.sa-presentation-rectangle').saRectangle();
        // Change legacy sa-presentation-view into sa-lightbox-viewer
        this.find('.sa-presentation-view')
            .addClass('sa-lightbox-viewer')
            .removeClass('sa-presentation-view');
        // Get rid of the extra handles we no longer use.
        // the ui-resiable was flakey.  It was eaiser just to code the
        // behavior myself.
        this.find('.ui-resizable-handle').remove();
        this.find('.ui-resizable').removeClass('ui-resizable');

        // We need to load the note.
        viewDivs = this.find('.sa-lightbox-viewer');
        viewDivs.saViewer({'hideCopyright': true,
                           'interaction':   false});

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
            // temporary to make previous editors draggable.
            items = this.find('.sa-text-editor');
            items.saTextEditor({editable:true});

            items = this.find('.sa-presentation-rectangle');
            items.saRectangle({editable:true});

            items = this.find('.sa-question');
            items.saQuestion({editable:true});

            items = this.find('.sa-presentation-image');
            items.saLightBox({aspectRatio: true,
                              editable   : true});

            items = this.find('.sa-lightbox-viewer');
            items.saAnnotationWidget('hide');
        }

        return;
    }

    // Shrink any light box elements that are expanded.
    // We do not have an s-light-box class yet.
    $('.sa-light-box').saLightBox({'expand':false, 'animate':false});

    // Get rid of the gui elements when returning the html.
    var copy = this.clone();
    copy.find('.sa-edit-gui').remove();
    copy.find('.ui-resizable').resizable('destroy');
    //copy.find('.ui-resizable-handle').remove();

    // Get rid of the children of the sa-presentation-view.
    // They will be recreated by viewer when the html is loaded.
    copy.find('.sa-lightbox-viewer').empty();

    return copy.html();
}


//==============================================================================
// Just add the feature of setting width and height as percentages.

jQuery.prototype.saResizable = function(args) {
    args = args || {};
    args.start = function (e, ui) {
        if ( this.saViewer) {
            // Translate events were being triggered in the viewer.
            this.saViewer.DisableInteraction();
        }
    };
    args.stop = function (e, ui) {
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
// args = {interaction:true,
//         overview:true,
//         menu:true, 
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
        // TODO:  Handle zoomWidget options
        if (args.overview !== undefined) {
            viewer.SetOverViewVisibility(args.overview);
        }
        // The way I handle the viewer edit menu is messy.
        // TODO: Find a more elegant way to add tabs.
        // Maybe the way we handle the anntation tab shouodl be our pattern.
        if (args.menu !== undefined) {
            if ( ! viewer.Menu) {
                viewer.Menu = new ViewEditMenu(viewer, null);
            }
            viewer.Menu.SetVisibility(args.menu);
        }
        
        if (args.note) {
            viewer.saNote = args.note;
            viewer.saViewerIndex = args.viewerIndex || 0;
            args.note.ViewerRecords[args.viewerIndex].Apply(viewer);
            $(self[i]).attr('sa-note-id', args.note.Id || args.note.TempId);
            $(self[i]).attr('sa-viewer-index', viewer.saViewerIndex);
        }
        if (args.hideCopyright) {
            viewer.CopyrightWrapper.hide();
        }
        if (args.interaction !== undefined) {
            viewer.SetInteractionEnabled(args.interaction);
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
                item = items[i];
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
            item.saPresentation = new saPresentation($(item),args);
            item.onresize =
                function () {
                    this.saPresentation.Resize();
                };
        }
        // Trouble if their is more than 1.  Maybe trigger
        // a window resize?
        setTimeout(function(){ item.saPresentation.Resize(); }, 300);
    }

    return this;
}

function saPresentation(div, args) {
    this.Div = div;
    this.AspectRatio = args.aspectRatio;
    this.Zoom = 1.0;
    this.ShiftX = 0;
    this.ShiftY = 0;

    // Setup events to pan and zoom the presentation window.
    var self = this;
    /*this.Div.on(
        'mousedown.presentation',
        function (e) {
            return self.HandleMouseDown(e);
        });
    */
    /* Text is not scaling properly
    this.Div.on(
        'mousewheel.presentation',
        function(event){
            // Resize from the middle.
            return self.HandleMouseWheel(event.originalEvent);
        });
    */
}

saPresentation.prototype.Resize = function () {
    var ar = this.AspectRatio;
    var parent = this.Div.parent();
    var pWidth = parent.innerWidth();
    var pHeight = parent.innerHeight();
    var width = pWidth;
    var height = pHeight
    if (width / height > ar) {
        // Window is too wide.
        width = height * ar;
    } else {
        // Window is too tall.
        height = width / ar;
    }
    width = width * this.Zoom;
    height = height * this.Zoom;
    var left = (pWidth - width)*0.5 + this.ShiftX;
    var top = (pHeight - height)*0.5 + this.ShiftY;

    this.Div.css({
        'position': 'absolute',
        'top': top+'px',
        'height': height+'px',
        'left': left+'px',
        'width': width+'px'});
}

saPresentation.prototype.HandleMouseDown = function (event) {
    var self = this;
    // For tap/click rather than drag.
    this.ClickStart = Date.now();

    if (event.which == 1 || event.which == 3) {
        $('body').on(
            'mouseup.presentation',
            function (e) {
                return self.HandleMouseUp(e);
            });
    }

    if (event.which == 1) {
        $('body').on(
            'mousemove.presentation',
            function (e) {
                return self.HandleMouseMove(e);
            });
        $('body').on(
            'mouseleave.presentation',
            function(e) {
                return self.HandleMouseUp(e);
            });
        this.DragLastX = event.screenX;
        this.DragLastY = event.screenY;

        return false;
    }
}

// TODO: rethink offset/zoom.  Scale from the middle. Offset should
// be in percentages maybe
saPresentation.prototype.HandleMouseWheel = function(event) {
    var tmp = 0;
    if (event.deltaY) {
        tmp = event.deltaY;
    } else if (event.wheelDelta) {
        tmp = event.wheelDelta;
    }
    // Wheel event seems to be in increments of 3.
    // depreciated mousewheel had increments of 120....
    // Initial delta cause another bug.
    // Lets restrict to one zoom step per event.
    if (tmp > 0) {
        this.Zoom *= 1.01;
        this.Resize();
    } else if (tmp < 0) {
        this.Zoom *= .99;
        this.Resize();
    }

    return false;
}

saPresentation.prototype.HandleMouseMove = function (event) {
    // Wait for the click duration to start dragging.
    if (Date.now() - this.ClickStart < 200) {
        return true;
    }

    if (event.which == 1) {
        var dx = event.screenX - this.DragLastX;
        var dy = event.screenY - this.DragLastY;
        this.DragLastX = event.screenX;
        this.DragLastY = event.screenY;

        this.ShiftX += dx;
        this.ShiftY += dy;
        this.Resize();
        return false;
    }
    return true;
}

saPresentation.prototype.HandleMouseUp = function (event) {
    $('body').off('mouseup.presentation');
    if (event.which == 1) {
        $('body').off('mousemove.presentation');
        $('body').off('mouseleave.presentation');
    }

    // Quick click...
    /* to sensitive.  maybe double click
    var clickDuration = Date.now() - this.ClickStart;
    if (clickDuration < 200) {
        if (event.which == 1) {
            this.Zoom *= 1.5;
            this.Resize();
        }
        if (event.which == 3) {
            this.Zoom /= 1.5;
            this.Resize();
        }
    }
*/

    return true;
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
// args = {grid: [xDivisions, yDivisions]}
jQuery.prototype.saDraggable = function(args) {
    args = args || {grid:[30,39]};
    this.addClass('sa-draggable');
    for (var i = 0; i < this.length; ++i) {
        if ( ! this[i].saDraggable) {
            var helper = new saDraggable($(this[i]));
            // Add the helper as an instance variable to the dom object.
            this[i].saDraggable = helper;
        }
        this[i].saDraggable.ProcessArguments(args);
    }

    return this;
}

function saDraggable(div) {
    this.XStops = null;
    this.YStops = null;
    this.Percentage = true;
    this.Div = div;

    var self = this;
    var d = saAddButton(div[0], 'webgl-viewer/static/fullscreen.png',
                        'drag', null, true);
    d.mousedown(
        function (e) {
            // raise to the top of the layers.
            // this did not work for text boxes on top of views.
            // it did work for mutiple views.
            var parent = self.Div.parent();
            self.Div.detach();
            self.Div.appendTo(parent);


            self.Div.css({'z-index':'5'});


            self.OldX = e.pageX;
            self.OldY = e.pageY;

            var pos = self.Div.position();
            var x = pos.left;
            var y = pos.top;
            var width = self.Div.parent().width();
            var height = self.Div.parent().height();
            if (self.XStops) { self.XStops.Start(x,width);}
            if (self.YStops) { self.YStops.Start(y,height);}
            $('body').on('mousemove.saDrag',
                      function (e) {
                          self.Drag(e.pageX-self.OldX, e.pageY-self.OldY);
                          self.OldX = e.pageX;
                          self.OldY = e.pageY;
                          return false;
                      });
            $('body').on('mouseup.saDrag',
                      function (e) {
                          self.Div.css('z-index', '');
                          $('body').off('mousemove.saDrag');
                          $('body').off('mouseup.saDrag');
                          return false;
                      });
            return false;
        });
}

saDraggable.prototype.ProcessArguments = function(args) {
    if (args.grid) {
        // The grid is not shared.
        this.XStops = new saStops(args.grid[0]);
        this.YStops = new saStops(args.grid[1]);
    }
}

// (dx, dy) drag vector in pixels.
saDraggable.prototype.Drag = function(dx, dy) {
    var pos = this.Div.position();
    var x = pos.left;
    var y = pos.top;

    var width = this.Div.parent().width();
    var height = this.Div.parent().height();
    var nx = x + dx;
    var ny = y + dy;
    if (this.XStops) {
        nx = this.XStops.Drag(dx);
    }
    if (this.YStops) {
        ny = this.YStops.Drag(dy);
    }

    if (this.Percentage) {
        nx  = nx / width;
        ny  = ny / height;
        nx = nx*100;
        ny = ny*100;
        this.Div[0].style.left = nx+'%';
        this.Div[0].style.top  = ny+'%';
    } else {
        this.Div[0].style.left = nx+'px';
        this.Div[0].style.top  = ny+'px';
    }

    this.Div[0].saButtons.PlaceButtons();
}


function saStops(divisions) {
    // How far do we hve to pass a stop before the item snaps to the mouse.
    this.Threshold = 25;
    // Current Stop
    this.Stopped = false;
    this.Stop = 0;  // TODO: This is not necessary.  Just use last.
    // The amount of drag saved up so far to get out of a stop.
    this.Delta = 0;

    // For speed up factor to account for stopped regions.
    this.Target = 0;
    this.Gap = 100.0;

    // Even positioning of the division.
    this.Divisions = divisions;
    // The current position of the item.
    this.Last = 0;
}


saStops.prototype.Start = function(last, size) {
    this.Stopped = false;
    this.Delta = 0;
    this.Last = last;
    this.Size = size;

    this.Target = last;
    this.Gap = size / this.Divisions;
}


// last and size could have changed since the last time this was called,
// so pass them in again.
// return:
//   the new position of the item (same units as args).
// arguments (all in the same units):
//   size: width of window
//   last: The current position of the item.
//   delta: The distance the mouse has moved.
saStops.prototype.Drag = function(delta) {
    // Put a compensation factor so item follows mouse.
    this.Target += delta;
    delta = delta + 3*(this.Target - this.Last) / this.Gap;

    // Where we should be without the stop.
    var next = this.Last + delta;

    if (this.Stopped) {
        // Acculilate the movement.
        this.Delta = this.Delta + delta;
        // Have we passed the threshold to exit?
        if (Math.abs(this.Delta) > this.Threshold) {
            // yes
            this.Stopped = false;
            this.Delta = 0;
            this.Last = next;
            return next;
        }
        // no
        return this.Stop;
    }

    // We are note stopped yet.
    // Have we passed a stop?  Get the nearest stop value.
    var stop = this.GetStop(this.Last, next);

    if (stop < this.Last && stop < next) {
        // We did not pass a stop.
        this.Delta = 0;
        this.Last = next;
        return next;
    }
    if (stop > this.Last && stop > next) {
        // We did not pass a stop.
        this.Delta = 0;
        this.Last = next;
        return next;
    }

    // Stop is in middle.  Start the Stopped behavior.
    this.Delta = next - stop;
    this.Last = stop;
    this.Stop = stop;
    this.Stopped = true;

    return stop;
}


saStops.prototype.GetStop = function(last, next) {
    // Put the stops at integer values.
    var last2 = last * this.Divisions / this.Size;
    var next2 = next * this.Divisions / this.Size;
    // transform motion to be positive;
    if (next2 < last2) {
        var tmp = last2;
        last2 = next2;
        next2 = tmp;
    }
    // Find the last stop passed.
    var stop = Math.floor(next2);
    stop = stop * this.Size / this.Divisions;

    return stop;
}




//==============================================================================
// Option to go full window.  This is intended for viewers, but might be
// made general.

// TODO: We need callbacks when it goes full and back.

// args: "off"  turns full window off.
jQuery.prototype.saFullWindowOption = function(args) {
    this.addClass('sa-full-window-option');
    for (var i = 0; i < this.length; ++i) {
        if ( ! this[i].saFullWindowOption) {
            var helper = new saFullWindowOption($(this[i]));
            // Add the helper as an instance variable to the dom object.
            this[i].saFullWindowOption = helper;
        }
        if (args == 'off') {
            this[i].saFullWindowOption.SetFullWindow($(this[i]), false);
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
        var domItem = this[i];
        if ( ! domItem.saDeletable) {
            // for closure (save element)
            domItem.saDeletable = new saDeletable(domItem);
        }
    }
    return this;
}

// check dom
function saDeletable(domItem) {
    this.Button = saAddButton(
        domItem, 'webgl-viewer/static/remove.png', 'delete',
        function () {
            // if we want to get rid of the viewer records,
            if (item.saViewer) { saPruneViewerRecord(item.saViewer);}
            saButtonsDelete(domItem);
            $(domItem).remove();},
        true);
}

function saPruneViewerRecord(viewer) {
    // In order to prune, we will need to find the other viewers associated
    // with records in the notes.
    // This is sort of hackish.
    var viewerIdx = viewer.saViewerIndex;
    var note = viewer.saNote;
    var items = $('.sa-lightbox-viewer');
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
    this.Width = 353;

    this.PanelDiv = $('<div>').appendTo(parent)
        .css({
            'background-color': 'white',
            'position': 'absolute',
            'top' : '0px',
            'bottom':'0px',
            'left' : '0px',
            'width': this.Width+'px'})
        .attr('draggable','false')
        .on("dragstart", function() {return false;});
    this.MainDiv = $('<div>').appendTo(parent)
        .css({
            'position': 'absolute',
            'top' : '0px',
            'bottom':'0px',
            'left' : this.Width+'px',
            'right':'0px',
            'border-left':'1px solid #AAA'})
        .attr('draggable','false')
        .on("dragstart", function() {return false;});

    this.OpenNoteWindowButton = $('<img>')
        .appendTo(this.MainDiv)
        .css({'position': 'absolute',
              'height': '20px',
              'width': '20px',
              'top' : '0px',
              'left' : '1px',
              'opacity': '0.6',
              '-moz-user-select': 'none',
              '-webkit-user-select': 'none',
              'z-index': '6'})
        .attr('src',"webgl-viewer/static/dualArrowRight2.png")
        .click(function(){self.SetVisibility(true);})
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
              'left' : '-22px',
              'opacity': '0.6',
              '-moz-user-select': 'none',
              '-webkit-user-select': 'none',
              'z-index': '6'})
        //.hide()
        .attr('src',"webgl-viewer/static/dualArrowLeft2.png")
        .click(function(){self.SetVisibility(false);})
        .attr('draggable','false')
        .on("dragstart", function() {
            return false;});


    this.Visibility = true;
    this.Dragging = false;

    this.ResizeNoteWindowEdge = $('<div>')
        .appendTo(parent)
        .css({'position': 'absolute',
              'height': '100%',
              'width': '3px',
              'top' : '0px',
              'left' : this.Width+'px',
              'background': '#BDF',
              'z-index': '10',
              'cursor': 'col-resize'})
        .hover(function () {$(this).css({'background':'#9BF'});},
               function () {$(this).css({'background':'#BDF'});})
        .mousedown(function () {
            self.StartDrag();
            return false;
        });
}

// TODO: Remove reference to body directly
// Maybe use parent.
ResizePanel.prototype.StartDrag = function () {
    this.Dragging = true;
    var self = this;
    this.TmpDrag = function (e) {return self.ResizeDrag(e);}
    this.TmpStop = function (e) {return self.ResizeStopDrag(e);}
    $('body').on('mousemove', this.TmpDrag);
    $('body').on('mouseup', this.TmpStop);
    $('body').css({'cursor': 'col-resize'});
}

ResizePanel.prototype.ResizeDrag = function (e) {
    this.SetWidth(e.pageX - 1);
    if (this.Width < 200) {
        this.ResizeStopDrag();
        this.SetVisibility(false);
    }

    return false;
}

ResizePanel.prototype.ResizeStopDrag = function () {
    $('body').off('mousemove', this.TmpDrag);
    $('body').off('mouseup', this.TmpDrag);
    $('body').css({'cursor': 'auto'});
    return false;
}

// TODO: Notes widget should just follow the parent.
// Get rid of this.
ResizePanel.prototype.SetWidth = function(width) {
    this.Width = width;
    this.PanelDiv.css({'width': this.Width+'px'});
    this.MainDiv.css({'left' : this.Width+'px'});
    this.ResizeNoteWindowEdge.css({'left' : (this.Width-2)+'px'});

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
            this.PanelDiv.fadeIn();
        } else {
            this.CloseNoteWindowButton.hide();
            this.OpenNoteWindowButton.show();
        }
        return;
    }

    var k = timeStep / this.AnimationDuration;

    // update
    this.AnimationDuration *= (1.0-k);
    this.SetWidth(this.Width + (this.AnimationTarget-this.Width) * k);

    var self = this;
    requestAnimFrame(function () {self.AnimateNotesWindow();});
}

// Open and close the panel
ResizePanel.prototype.SetVisibility = function(visibility) {
    if (this.Visibility == visibility) { return; }
    this.Visibility = visibility;

    if (this.Visibility) {
        this.AnimationCurrent = this.Width;
        this.AnimationTarget = 353;
    } else {
        this.PanelDiv.hide();
        this.AnimationCurrent = this.Width;
        this.AnimationTarget = 0;
    }
    this.AnimationLastTime = new Date().getTime();
    this.AnimationDuration = 1000.0;
    this.AnimateNotesWindow();
}

// Show / hide the panel and handles.
// I keep the "visibility" state and restore it.
ResizePanel.prototype.Show = function() {
    this.Visibility = true;
    this.ResizeNoteWindowEdge.show();
    if (this.Visibility) {
        this.Visibility = false; // hack
        this.SetVisibility(true);
    } else {
        this.OpenNoteWindowButton.show();
    }
}

ResizePanel.prototype.Hide = function() {
    this.Visibility = false;
    // Do not use "SetVisibility" because we need to instantly close the panel.
    this.PanelDiv.hide();
    this.SetWidth(0);
    this.OpenNoteWindowButton.hide();
    this.CloseNoteWindowButton.hide();
    this.ResizeNoteWindowEdge.hide();

    //Hack to recompute viewports
    // TODO: Get rid of this hack.
    $(window).trigger('resize');
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
// Although this is only an option for saViewers,  Make it separate to keep
// it clean. NOTE: .saViewer has to be setup before this call.



//args: 
jQuery.prototype.saAnnotationWidget = function(args) {
    for (var i = 0; i < this.length; ++i) {
        var item = this[i];
        if ( ! item.saViewer) {
            console.log("Setup the viewer before the annotation widget.");
            return this;
        } else if ( ! item.saAnnotationWidget) {
            $(item).addClass("sa-annotation-widget")
            item.saAnnotationWidget = new AnnotationWidget(item.saViewer);
            item.saAnnotationWidget.SetVisibility(2);
        }
        // This hides and shows the button/tools but does not change the
        // visibility of the annotations in the viewer.
        if (args == "hide") {
            item.saAnnotationWidget.hide();
        } else if (args == "show") {
            item.saAnnotationWidget.show();
        }       
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
        color = ConvertColorNameToHex(color);
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


var ConvertColorNameToHex = function(color) {
    // Deal with color names.
    if ( typeof(color)=='string' && color[0] != '#') {
        var colors = {
            "aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff",
            "aquamarine":"#7fffd4","azure":"#f0ffff","beige":"#f5f5dc",
            "bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd",
            "blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a",
            "burlywood":"#deb887","cadetblue":"#5f9ea0","chartreuse":"#7fff00",
            "chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed",
            "cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
            "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b",
            "darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b",
            "darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
            "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000",
            "darksalmon":"#e9967a","darkseagreen":"#8fbc8f",
            "darkslateblue":"#483d8b","darkslategray":"#2f4f4f",
            "darkturquoise":"#00ced1","darkviolet":"#9400d3",
            "deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969",
            "dodgerblue":"#1e90ff","firebrick":"#b22222","floralwhite":"#fffaf0",
            "forestgreen":"#228b22","fuchsia":"#ff00ff","gainsboro":"#dcdcdc",
            "ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520",
            "gray":"#808080","green":"#008000","greenyellow":"#adff2f",
            "honeydew":"#f0fff0","hotpink":"#ff69b4","indianred":"#cd5c5c",
            "indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
            "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00",
            "lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080",
            "lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
            "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1",
            "lightsalmon":"#ffa07a","lightseagreen":"#20b2aa",
            "lightskyblue":"#87cefa","lightslategray":"#778899",
            "lightsteelblue":"#b0c4de","lightyellow":"#ffffe0","lime":"#00ff00",
            "limegreen":"#32cd32","linen":"#faf0e6","magenta":"#ff00ff",
            "maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd",
            "mediumorchid":"#ba55d3","mediumpurple":"#9370d8",
            "mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
            "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc",
            "mediumvioletred":"#c71585","midnightblue":"#191970",
            "mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
            "navajowhite":"#ffdead","navy":"#000080","oldlace":"#fdf5e6",
            "olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500",
            "orangered":"#ff4500","orchid":"#da70d6","palegoldenrod":"#eee8aa",
            "palegreen":"#98fb98","paleturquoise":"#afeeee",
            "palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9",
            "peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd",
            "powderblue":"#b0e0e6","purple":"#800080","red":"#ff0000",
            "rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513",
            "salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57",
            "seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0",
            "skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090",
            "snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
            "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347",
            "turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3",
            "white":"#ffffff","whitesmoke":"#f5f5f5",
            "yellow":"#ffff00","yellowgreen":"#9acd32"};
        color = color.toLowerCase();
        if (typeof colors[color] != 'undefined') {
            color = colors[color];
        }
    }
    return color;
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




