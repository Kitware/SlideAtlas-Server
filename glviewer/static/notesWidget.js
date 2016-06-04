// that possibly share a superclass.

// Notes can be nested (tree structure) to allow for student questions, comments or discussion.
// Sessions could be notes.
// Notes within the same level are ordered.
// Question answers can be sub notes.

// Students can save comments that are not seen by other students.
// Student notes are stored as "favorites".
// Notes keep an ID of their parent in the database.
// The recording API is used to save the state of viewers (ViewerRecord)
// Notes just add a tree structure on top of these states (with GUI).

// Right now we are loading the view and bookmarks as notes.
// Bookmarks have two notes: Question and a child answer.
// I need to change this to be more like the origin open layers presentation.

// TODO:
// Highlight icon on hover.
// Drag notes to change the order.
// Show the user "favorite" notes.
// Allow user to delete the favorite note (even if edit is not on).

// HTML:
// Students like the HTML Text and would like to see hyperlinks to
// annotation and cameras.  The Scheme is not setup for this because
// children have their own text.  I am going to change the behavior so
// that children that do not have their own text, show the text of their
// parent.  I will probably hide children without text in the top display.
// TODO:
// Bug: Tabs do not look right (bottom should be white / z_index?)
// Bug: only the last child added can be selected by the title.
//      only the last child added shows the delete and camera buttons.
//      This only happens when editing.  Loading a saved view/note works
//      fine.
// Bug: Note title not being saved.
// Bug: Type "test" reload (not saved).


// Deleting a note should delete the usernote.
// Deleting a hyper link should delete its note. (test)

// Maybe have a "Add" at the bottom of the link list.
// Move deleted links to trash instead of deleting. (Undo delete)
// A way to get permalink to notes. (for Brown) (LinkCallback)
// Indicate the current note in the text.
// Save notes panel state (opened, closed, width) in mongo.
// ??? Link notes better in html ??? Saving edited html is the problem here.
// Make browser back arrow undo link (will this cause tiles to reload (note
//     panel to disapear?)

// NOTE:
// - !!!!!!!!!!!!!!!!!!!!!! Copy note needs to change ids in html !!!!!!!!!!!!!!!
// -I Could not highlight hyperlink when note is selected.
//     Text cannot be selected when hidden.  I would have to select the
//     text when Text tabe is clicked.....
// -Hyperlink selection background color (and color) should not be saved in
//     the note / database.

//==============================================================================

(function () {
    "use strict";

    // TODO: Merge this with the text editor in viewer-utils.
    // Gray out buttons when no text is selected.
    // Remove options to insert link if no text is selected.


    function TextEditor(parent, display) {
        var self = this;
        this.Display = display;
        this.Parent = parent;
        // I do not want the text editable until the note is set.
        this.Editable = true;
        this.Edit = true;
        // The user can set this to save the note automatically.
        this.ChangeCallback = null;

        this.EditButtons = [];
        this.AddEditButton(SA.ImagePathUrl+"camera.png", "link view",
                           function() {self.InsertCameraLink();});
        this.AddEditButton(SA.ImagePathUrl+"link.png", "link URL",
                           function() {self.InsertUrlLink();});
        this.AddEditButton(SA.ImagePathUrl+"font_bold.png", "bold",
                           function() {document.execCommand('bold',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"text_italic.png", "italic",
                           function() {document.execCommand('italic',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"edit_underline.png", "underline",
                           function() {document.execCommand('underline',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"list_bullets.png", "unorded list",
                           function() {document.execCommand('InsertUnorderedList',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"list_numbers.png", "ordered list",
                           function() {document.execCommand('InsertOrderedList',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"indent_increase.png", "indent",
                           function() {document.execCommand('indent',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"indent_decrease.png", "outdent",
                           function() {document.execCommand('outdent',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"alignment_left.png", "align left",
                           function() {document.execCommand('justifyLeft',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"alignment_center.png", "align center",
                           function() {document.execCommand('justifyCenter',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"edit_superscript.png", "superscript",
                           function() {document.execCommand('superscript',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"edit_subscript.png", "subscript",
                           function() {document.execCommand('subscript',false,null);});
        this.AddEditButton(SA.ImagePathUrl+"font_increase.png", "large font",
                           function(){
                               document.execCommand('fontSize',false,'5');
                               self.ChangeBulletSize('1.5em');
                           });
        this.AddEditButton(SA.ImagePathUrl+"font_decrease.png", "small font",
                           function() {
                               document.execCommand('fontSize',false,'2');
                               self.ChangeBulletSize('0.9em');
                           });
        // TODO: Get selected text to see if we can convert it into a question.
        this.AddEditButton(SA.ImagePathUrl+"question.png", "add question",
                           function() {
                               self.AddQuestion();
                           });

        this.InitializeHomeButton(parent);

        this.TextEntry = $('<div>')
            .appendTo(parent)
            .attr('contenteditable', "true")
            .removeAttr('readonly')
            .css({'box-sizing': 'border-box',
                  'width': '100%',
                  'height':'100%',
                  'border-style': 'solid',
                  'overflow': 'auto',
                  'resize': 'none',
                  'border-style': 'inset',
                  'background': '#f5f8ff'})
            .bind('input', function () {
                // Leave events are not triggering.
                self.EventuallyUpdate();
            })
            .focusin(function() {
                SA.ContentEditableHasFocus = true;
            })
            .focusout(function() {
                SA.ContentEditableHasFocus = false;
                self.Update();
            })
        // Mouse leave events are not triggering.
            .mouseleave(function() { // back button does not cause loss of focus.
                self.Update();
            });

        this.UpdateTimer = null;
        this.RecordViewTimer = null;

        // Do not enable editing until the Note is set.
        this.EditOff();
        this.Note = null;
    }

    TextEditor.prototype.HomeCallback = function() {
        if ( ! this.Note) {
            return;
        }
        this.Note.DisplayView(this.Display);
    }

    // Home button is a link.  The link menu is used for other links too.
    TextEditor.prototype.InitializeHomeButton = function(parent) {
        var self = this;
        this.HomeButton = $('<div>')
            .appendTo(parent)
            .text("Home")
            .css({'text-align':'center',
                  'border':'1px solid #666666',
                  'border-radius': '10px',
                  'color': '#29C',
                  'background':'white'})
            .hover(function(){ $(this).css("color", "blue");},
                   function(){ $(this).css("color", "#29C");});
        this.HomeButton.contextmenu( function() { return false; });
        this.HomeButton.mousedown(function(e){
            if( e.button == 0 ) {
                self.HomeCallback();
                return false;
            }
            if( e.button == 2 ) {
                self.LinkMenuObject = {Link : self.HomeButton,
                                       Note : self.Note};
                // Position and show the properties menu.
                var pos = $(this).position();
                // Cannot delete the root note.
                self.DeleteLinkButton.hide();
                self.LinkMenu
                    .css({'left':(25 + pos.left)+'px',
                          'top' :(pos.top)+'px'})
                    .show();
                return false;
            }
            return true;
        });

        // When a link is right clicked, the object {Link: ..., Note: ...} is set and the
        // menu is made visible.
        this.LinkMenuObject = undefined;
        this.LinkMenu = $('<div>')
            .appendTo(parent)
            .hide()
            .mouseleave(function(){$(this).hide();})
            .css({'position'  :'absolute',
                  'background-color': '#FFFFFF',
                  'border'    :'1px solid #666666',
                  'box-sizing': 'border-box',
                  'left'      : '-78px',
                  'width'     : '100px',
                  'padding'   : '0px 2px'})
        $('<button>')
            .appendTo(this.LinkMenu)
            .text("Save View")
            .css({'margin': '2px 0px',
                  'width' : '100%'})
            .prop('title', "Replace Annotation")
            .click(
                function(){
                    self.SaveLink(self.LinkMenuObject.Link,
                                  self.LinkMenuObject.Note);
                    self.LinkMenu.hide();
                });
        this.DeleteLinkButton = $('<button>')
            .appendTo(this.LinkMenu)
            .text("Delete")
            .css({'margin': '2px 0px',
                  'width' : '100%'})
            .click(
                function(){
                    self.DeleteLink(self.LinkMenuObject.Link,
                                    self.LinkMenuObject.Note);
                    self.LinkMenu.hide();
                });
    }

    // Every time the "Text" is loaded, they hyper links have to be setup.
    // TODO: Do we need to turn off editable?
    TextEditor.prototype.FormatLink = function(linkNote) {
        var self = this;
        var link = document.getElementById(linkNote.Id);
        if (link) {
            $(link)
                .css({'color': '#29C',
                      'background':'white'})
                .hover(function(){ $(this).css("color", "blue");},
                       function(){ $(this).css("color", "#29C");})
                .attr('contenteditable', "false");

            $(link).contextmenu( function() { return false; });
            $(link).mousedown(function(e){
                if( e.button == 0 ) {
                    linkNote.DisplayView(self.Display);
                    return false;
                }
                if( e.button == 2 ) {
                    self.LinkMenuObject = {Link : $(link),
                                           Note : linkNote};
                    // Position and show the properties menu.
                    var pos = $(this).position();
                    self.DeleteLinkButton.show();
                    self.LinkMenu
                        .css({'left':(25 + pos.left)+'px',
                              'top' :(pos.top)+'px'})
                        .show();
                    return false;
                }
                return true;
            });
        }
    }

    TextEditor.prototype.SaveLink = function(link, note) {
        note.RecordView(this.Display);
        note.Save();
    }

    TextEditor.prototype.DeleteLink = function(link, note) {
        // TODO: Keep the old text.
        var text = link.text();
        $(document.createTextNode(text)).insertAfter(link);
        link.remove();
        note.DeleteCallback();
        this.UpdateNote();
        this.Note.Save();
    }

    TextEditor.prototype.Change = function(callback) {
        this.ChangeCallback = callback;
    }

    TextEditor.prototype.EventuallyUpdate = function() {
        if (this.UpdateTimer) {
            clearTimeout(this.UpdateTimer);
            this.UpdateTimer = null;
        }
        var self = this;
        this.UpdateTimer = setTimeout(function () { self.UpdateNote() }, 5000);
    }

    TextEditor.prototype.Update = function() {
        if (this.UpdateTimer) {
            clearTimeout(this.UpdateTimer);
            this.UpdateTimer = null;
        } else {
            // I am using the timer as a modified flag.
            // Call update note to force an update.
            return;
        }
        this.UpdateNote();
    }

    TextEditor.prototype.EditOff = function() {
        if ( ! this.Edit) { return;}
        this.Edit = false;

        for (var i = 0; i < this.EditButtons.length; ++i) {
            this.EditButtons[i].hide();
        }

        this.TextEntry
            .attr('contenteditable', 'false')
            .attr('spellcheck', 'false')
            .css({'border-style': 'outset',
                  'background': '#ffffff'})
            .unbind('input')
            .unbind('focusin')
            .unbind('focusout')
            .unbind('mouseleave')
            .blur();
    }

    TextEditor.prototype.EditableOff = function() {
        this.EditOff();
        this.Editable = false;
    }


    TextEditor.prototype.EditOn = function() {
        var self = this;
        if ( ! this.Editable) { return; }
        if (this.Edit) { return;}
        this.Edit = true;

        for (var i = 0; i < this.EditButtons.length; ++i) {
            this.EditButtons[i].show();
        }

        this.TextEntry
            .attr('contenteditable', "true")
            .removeAttr('readonly')
            .css({'border-style': 'inset',
                  'background': '#f5f8ff'})
            .bind('input', function () {
                self.Modified = true;
                self.EventuallyUpdate();
            })
            .focusin(function() {
                SA.ContentEditableHasFocus = true;
            })
            .focusout(function() {
                SA.ContentEditableHasFocus = false;
                self.Update();
            })
            .mouseleave(function() { // back button does not cause loss of focus.
                self.Update();
            });
    }

    TextEditor.prototype.AddEditButton = function(src, tooltip, callback) {
        var self = this;
        var button = $('<img>');
        if (tooltip) {
            //button = $('<img title="'+tooltip+'">')
            button.prop('title', tooltip);
        }
        button
            .appendTo(this.Parent)
            .addClass('editButton')
            .attr('src',src)
            .click(callback);
        this.EditButtons.push(button);
    }

    TextEditor.prototype.AddQuestion = function() {
        var bar = $('<div>')
            .css({'position':'relative',
                  'margin':'3%',
                  'width':'90%',
                  'background':'#FFF',
                  'border':'1px solid #AAA',
                  'padding':'1% 1% 1% 1%'}) // top right bottom left
            .attr('contenteditable', 'false')
            .saQuestion({editable: SA.Edit,
                         position : 'static'});

        // Need to get the range here because the dialog changes it.
        var self = this;
        var range = SA.GetSelectionRange(this.TextEntry);
        // Try to initialize the dialog with the contents of the range.
        if ( ! range.collapsed) {
            var clone = range.cloneContents();
            bar.saQuestion('SetQuestionText', clone.firstChild.textContent);
            if (clone.childElementCount > 1) {
                //var answers = clone.querySelectorAll('li');
                var answers = [];
                var li = clone.querySelector('li');
                if (li) {
                    answers = li.parentElement;
                } else {
                    answers = clone.children[1];
                }
                for (var i = 0; i < answers.childElementCount; ++i) {
                    var answer = answers.children[i];
                    var bold = (answer.style.fontWeight == "bold") ||
                        ($(answer).find('b').length > 0);
                    bar.saQuestion('AddAnswerText',
                                   answer.textContent,
                                   bold);
                }
            }
        }

        bar.saQuestion('OpenDialog',
                       function () {
                           if (range) {
                               range.deleteContents();
                               range.insertNode(document.createElement('br'));
                           } else {
                               range = SA.MakeSelectionRange(self.TextEntry);
                           }
                           range.insertNode(bar[0]);
                           // Some gymnasitcs to keep the cursor after the question.
                           range.collapse(false);
                           var sel = window.getSelection();
                           sel.removeAllRanges();
                           sel.addRange(range);
                           self.TextEntry[0].focus();
                           self.UpdateNote();
                       });
    }

    // execCommand fontSize does change bullet size.
    // This is a work around.
    TextEditor.prototype.ChangeBulletSize = function(sizeString) {
        var self = this;
        var sel = window.getSelection();
        // This call will clear the selected text if it is not in this editor.
        var range = SA.GetSelectionRange(this.TextEntry);
        range = range || SA.MakeSelectionRange(this.TextEntry);
        var listItems = $('li');
        for (var i = 0; i < listItems.length; ++i) {
            var item = listItems[i];
            if (range.isPointInRange(item,0) ||
                range.isPointInRange(item,1)) {
                $(item).css({'font-size':sizeString});
            }
        }
    }


    TextEditor.prototype.InsertUrlLink = function() {
        var self = this;
        var sel = window.getSelection();
        // This call will clear the selected text if it is not in this editor.
        var range = SA.GetSelectionRange(this.TextEntry);
        var selectedText = sel.toString();

        if ( ! this.UrlDialog) {
            var self = this;
            var dialog = new SAM.Dialog(function() {
                self.InsertUrlLinkAccept();
            });
            dialog.Body.css({'margin':'1em 2em'});
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

    TextEditor.prototype.InsertUrlLinkAccept = function() {
        var sel = window.getSelection();
        var range = this.UrlDialog.SelectionRange;
        range = range || SA.MakeSelectionRange(this.TextEntry);

        // Simply put a span tag around the text with the id of the view.
        // It will be formated by the note hyperlink code.
        var link = document.createElement("a");
        link.href = this.UrlDialog.UrlInput.val();
        link.target = "_blank";

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
        this.UpdateNote();
    }

    // This global variable is an attempt to enumerate generated
    // names for links.  The flaw is it always starts over when page is
    // loaded. It does not detect links from previous edits.
    var LINKS_WITH_NO_NAME = 0;

    // TODO: Untangle view links from the note.
    TextEditor.prototype.InsertCameraLink = function() {
        // Create a child note.
        var parentNote = this.Note;
        if ( ! parentNote) {
            parentNote = SA.dualDisplay.GetRootNote();
        }

        // Create a new note to hold the view.
        // Put the new note at the end of the list.
        var childIdx = parentNote.Children.length;
        //var childIdx = 0; // begining
        var childNote = parentNote.NewChild(childIdx, text);
        // Setup and save
        childNote.RecordView(this.Display);
        // Block subnotes and separate text.
        childNote.Type = 'View';

        // We need to save the note to get its Id.
        var text = "(view)";
        var range = SA.GetSelectionRange(this.TextEntry);
        if ( ! range) {
            range = SA.MakeSelectionRange(this.TextEntry);
        } else if ( ! range.collapsed) {
            text = range.toString();
        }
        childNote.Title = text;
        range.deleteContents();

        // Simply put a span tag around the text with the id of the view.
        // It will be formated by the note hyperlink code.
        var span = document.createElement("span");
        // This id identifies the span as a hyperlink to this note.
        // The note will format the link and add callbacks later.
        span.id = childNote.Id;
        $(span).attr('contenteditable', 'false');
        span.appendChild( document.createTextNode(text) );
        range.insertNode(span);
        // Let the note format it.
        this.FormatLink(childNote);

        // Some gymnasitcs to keep the cursor after the question.
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        this.TextEntry[0].focus();
        // NOTE: This may not be necesary no that text note "views" are
        // issolated from notes in views tab.
        this.UpdateNote();

        this.Note.Save();
    }

    TextEditor.prototype.Resize = function(width, height) {
        var pos;
        pos = this.TextEntry.offset();
        this.TextEntry.height(height - pos.top - 5);
    }

    TextEditor.prototype.SetHtml = function(html) {
        if (this.UpdateTimer) {
            clearTimeout(this.UpdateTimer);
            this.Update();
        }
        this.Note = null; //??? Editing without a note
        this.EditOn();
        this.TextEntry.html(html);

        if (SA.Edit) {
            var items = this.TextEntry.find('.sa-question');
            items.saQuestion({editable:true,
                              position : 'static'});
        }

        // Note needed here long term.
        // this looks for keywords in text and makes tags.
        SA.AddHtmlTags(this.TextEntry);
    }

    TextEditor.prototype.GetHtml = function() {
        return this.TextEntry.html();
    }

    // TODO: Editor should not become active until it has a note.
    // This probably belongs in a subclass.
    // Or in the note.
    TextEditor.prototype.LoadNote = function(note) {
        if (this.UpdateTimer) {
            clearTimeout(this.UpdateTimer);
            this.Update();
        }
        this.Note = note;
        this.TextEntry.html(note.Text);

        // TODO: Hide this.  Maybe use saHtml.
        if (SA.Edit) {
            var items = this.TextEntry.find('.sa-question');
            items.saQuestion({editable:true,
                              position : 'static'});
        }

        // TODO: Make the hyper link the same pattern as questions.
        for (var i = 0; i < note.Children.length; ++i) {
            // In the future we can only call this on type "View"
            this.FormatLink(note.Children[i]);
        }

        this.MakeLinksClickable();
        if (SA.Edit) {
            this.EditOn();
        }
    }

    // Copy the text entry text back into the note
    // (when the textEntry changes).
    // It saves the note too.
    TextEditor.prototype.UpdateNote = function() {
        this.UpdateTimer = null;
        if ( ! this.Note) {
            return;
        }
        this.Note.Text = this.TextEntry.html();
        if (this.ChangeCallback) {
            (this.ChangeCallback)();
        }

        this.MakeLinksClickable();
    }

    // Link are not active in content editable divs.
    // Work around this.
    TextEditor.prototype.MakeLinksClickable = function() {
        if (SA.Edit) {
            // This is only necesary when div is editable.
            // Links work the same in both situations with this.
            var links = $("a");
            for (var i = 0; i < links.length; ++i) {
                var link = links[i];
                $(link)
                    .click(function() {
                        window.open(this.href,'_blank');
                    })
            }
        }
    }

    SA.TextEditor = TextEditor;

})();

    //==============================================================================





(function () {
    "use strict";


function NotesWidget(parent, display) {
    this.ModifiedCallback = null;
    this.LinkDiv;
    // This is a hack.  I do not know when to save the camera.
    // The save button will save the camera for the last note displayed.
    // This may be different that the selected note because of camera links
    // in text that do not change the text.
    this.DisplayedNote = null;

    // Popup div to display permalink.
    SA.LinkDiv =
        $("<div>")
        .appendTo('body')
        .css({'top':'30px',
              'left': '10%',
              'position': 'absolute',
              'width':'80%',
              'height': '50px',
              'z-index':'3',
              'background-color':'#FFF',
              'border':'1px solid #777',
              'border-radius': '8px',
              'text-align': 'center',
              'padding-top': '26px'})
        .hide()
        .mouseleave(function() { SA.LinkDiv.fadeOut(); });

    // There is not option to show the link when SA.Edit is not on,
    // so this really does nothing.  Editable is probably necessary
    // for selection to copy.
    if (SA.Edit) {
        SA.LinkDiv.attr('contenteditable', "true");
    }

    var self = this;
    this.Display = display;

    this.Modified = false;
    this.Window = $('<div>')
        .appendTo(parent)
        .css({
            'background-color': 'white',
            'position': 'absolute',
            'top'    : '0%',
            'left'   : '0%',
            'height' : '100%',
            'width'  : '100%',
            'z-index': '2'})
        .attr('draggable','false')
        .on("dragstart", function() {return false;})
        .attr('id', 'NoteWindow');

    //--------------------------------------------------------------------------

    // Keeps track of the current note.
    this.NavigationWidget;

    // For clearing selected GUI setting.
    this.SelectedNote;

    // GUI elements
    this.TabbedWindow = new SA.TabbedDiv(this.Window);

    this.TextDiv = this.TabbedWindow.NewTabDiv("Text");
    this.UserTextDiv = this.TabbedWindow.NewTabDiv("Notes", "private notes");
    this.LinksDiv = this.TabbedWindow.NewTabDiv("Views");
    this.LinksRoot = $('<ul>')
        .addClass('sa-ul')
        .css({'padding-left':'0px'})
        .appendTo(this.LinksDiv);



    for (var i = 0; i < this.Display.GetNumberOfViewers(); ++i) {
        this.Display.GetViewer(i).OnInteraction(function (){self.RecordView();});
    }


    this.LinksDiv
        .css({'overflow': 'auto',
              'text-align': 'left',
              'color': '#303030',
              'font-size': '18px'})
        .attr('id', 'NoteTree');

    // no longer needed, but interesting: 'box-sizing': 'border-box'

    // This is the button for the links tab div.
    if (SA.Edit) {
        this.AddViewButton = $('<button>')
            .appendTo(this.LinksDiv)
            .css({'border-radius': '4px',
                  'margin': '1em'})
            .text("+ New View")
    }

    // Show hidden content to non administrator.
    // Do not show this unless not is interactive.
    this.QuizButton = $('<div>')
        .appendTo(this.TextDiv)
        .addClass('editButton')
        .css({'float':'right',
              'font-size':'small',
              'margin-top':'4px',
              'padding-left':'2px',
              'padding-right':'2px',
              'border':'1px solid #AAA',
              'border-radius':'2px'})
        .text("show")
        .hide();

    // Now for the text tab:
    if (SA.Edit) {
        // TODO: Encapsulate this menu (used more than once)
        this.QuizDiv = $('<div>')
            .appendTo(this.TextDiv)
        this.QuizMenu = $('<select name="quiz" id="quiz">')
            .appendTo(this.QuizDiv)
            .css({'float':'right',
                  'margin':'3px'})
            .change(function () {
                if ( ! self.RootNote) { return; }
                if (this.value == "review") {
                    self.RootNote.Mode = "answer-show";
                } else if (this.value == "hidden") {
                    self.RootNote.Mode = "answer-hide";
                } else if (this.value == "interactive") {
                    self.RootNote.Mode = "answer-interactive";
                }
                self.UpdateQuestionMode();
            });
        this.QuizLabel = $('<div>')
            .appendTo(this.TextDiv)
            .css({'float':'right',
                  'font-size':'small',
                  'margin-top':'4px'})
            .text("quiz");
        $('<option>')
            .appendTo(this.QuizMenu)
            .text('review');
        $('<option>')
            .appendTo(this.QuizMenu)
            .text('hidden');
        $('<option>')
            .appendTo(this.QuizMenu)
            .text('interactive');
        // Set the question mode
        this.QuizMenu.val("review");
    }

    this.TextEditor = new SA.TextEditor(this.TextDiv, this.Display);
    if ( ! SA.Edit) {
        this.TextEditor.EditableOff();
    } else {
        this.TextEditor.Change(
            function () {
                self.MarkAsModified();
            });
    }
    // Private notes.
    this.UserTextEditor = new SA.TextEditor(this.UserTextDiv, this.Display);
    this.UserTextEditor.Change(
        function () {
            self.UserTextEditor.Note.Save();
        });
}

NotesWidget.prototype.UpdateQuestionMode = function() {
    // Set the question mode
    if ( ! this.RootNote) {
        return;
    }

    if ( ! this.RootNote.Mode) {
        this.RootNote.Mode = 'answer-show';
    }

    if (this.QuizMenu) {
        if (this.RootNote.Mode == 'answer-hide') {
            this.QuizMenu.val("hidden");
        } else if (this.RootNote.Mode == 'answer-interactive') {
            this.QuizMenu.val("interactive");
        } else {
            //this.RootNote.Mode = 'answer-show';
            this.QuizMenu.val("review");
        }
    }
    if (this.RootNote.Mode == 'answer-interactive') {
        var self = this;
        this.QuizButton
            .show()
            .css('background-color','')
            .click(function () {
                self.SetAnswerVisibility('answer-show');
                self.QuizButton.css({'background-color':'#AAAAAA'});
            })
    } else {
        this.QuizButton.hide();
    }

    this.SetAnswerVisibility(this.RootNote.Mode);
}


NotesWidget.prototype.SetAnswerVisibility = function(mode) {
    // make sure tags have been decoded.
    SA.AddHtmlTags(this.TextEditor.TextEntry);

    if (mode == 'answer-show') {
        $('.sa-note').show();
        $('.sa-notes').show();
        $('.sa-diagnosis').show();
        $('.sa-differential-diagnosis').show();
        $('.sa-teaching-points').show();
        $('.sa-compare').show();
    } else {
        $('.sa-note').hide();
        $('.sa-notes').hide();
        $('.sa-diagnosis').hide();
        $('.sa-differential-diagnosis').hide();
        $('.sa-teaching-points').hide();
        $('.sa-compare').hide();
    }
    $('.sa-question').saQuestion('SetMode', mode);
}


NotesWidget.prototype.SetNavigationWidget = function(nav) {
    this.NavigationWidget = nav;
}

NotesWidget.prototype.SetModifiedCallback = function(callback) {
    this.ModifiedCallback = callback;
}

NotesWidget.prototype.SetModifiedClearCallback = function(callback) {
    this.ModifiedClearCallback = callback;
}

// Two types of select.  This one is from the views tab.
// It sets the text from the note.
// There has to be another from text links.  That does not set the
// text.
NotesWidget.prototype.SelectNote = function(note) {
    if (note == this.SelectedNote) {
        // Just reset the camera.
        //note.DisplayView(this.Display);
        return;
    }
    // Flush the timers before moving to another view.
    // GUI cannot call this object.
    if (this.RecordViewTimer) {
        clearTimeout(this.RecordViewTimer);
        this.RecordViewTimer = null;
        this.RecordView2();
    }

    // This should method should be split between Note and NotesWidget
    if (SA.LinkDiv.is(':visible')) { SA.LinkDiv.fadeOut();}

    this.TextEditor.LoadNote(note);

    // Handle the note that is being unselected.
    // Clear the selected background of the deselected note.
    if (this.SelectedNote) {
        this.SelectedNote.TitleEntry.css({'background':'white'});
        // Make the old hyper link normal color.
        $('#'+this.SelectedNote.Id).css({'background':'white'});
    }

    this.SelectedNote = note;

    // Indicate which note is selected.
    note.TitleEntry.css({'background':'#f0f0f0'});
    // This highlighting can be confused with the selection highlighting.
    // Indicate hyperlink current note.
    //$('#'+SA.notesWidget.SelectedNote.Id).css({'background':'#CCC'});
    // Select the current hyper link
    note.SelectHyperlink();

    //if (SA.dualDisplay &&
    //    SA.dualDisplay.NavigationWidget) {
    //    SA.dualDisplay.NavigationWidget.Update();
    //}

    //if (this.Display.GetNumberOfViewers() > 1) {
    //    this.Display.GetViewer(1).Reset();
    //    // TODO:
    //    // It would be nice to store the viewer configuration
    //    // as a separate state variable.  We might want a stack
    //    // that defaults to a single viewer.
    //    this.Display.SetNumberOfViewers(note.ViewerRecords.length);
    //}

    // Clear the sync callback.
    //var self = this;
    //for (var i = 0; i < this.Display.GetNumberOfViewers(); ++i) {
    //    this.Display.GetViewer(i).OnInteraction();
    //    if (SA.Edit) {
    //        // These record changes in the viewers to the notes.
    //        this.Display.GetViewer(i).OnInteraction(function () {self.RecordView();});
    //    }
    //}
}

NotesWidget.prototype.RecordView = function() {
    if ( ! SA.Edit) { return; }

    if (this.RecordViewTimer) {
        clearTimeout(this.RecordViewTimer);
    }
    var self = this;
    this.RecordViewTimer = setTimeout(
        function () { self.RecordView2() },
        1000);
}

NotesWidget.prototype.RecordView2 = function() {
    this.RecordViewTimer = null;
    var note = this.GetCurrentNote();
    //note.RecordView(this.Display);
    // Hack to keep root from getting view annotations.
    // TODO: CLean up the two parallel paths Notes ad views.
    if (this.DisplayedNote && note == this.DisplayedNote) {
        note.RecordAnnotations(this.Display);
    }
}


NotesWidget.prototype.MarkAsModified = function() {
    if (this.ModifiedCallback) {
        this.ModifiedCallback();
    }
    this.Modified = true;
}


NotesWidget.prototype.MarkAsNotModified = function() {
    if (this.ModifiedClearCallback) {
        this.ModifiedClearCallback();
    }
    this.Modified = false;
}

NotesWidget.prototype.SetRootNote = function(rootNote) {
    if (this.UpdateTimer) {
        clearTimeout(this.UpdateTimer);
        this.Update();
    }
    //this.Display.SetNote();

    this.RootNote = rootNote;
    this.DisplayRootNote();

    // Only show user notes for the first image of the root note.
    // I can rethink this later.
    if (rootNote.ViewerRecords.length > 0) {
        this.RequestUserNote(rootNote.ViewerRecords[0].Image._id);
    }

    // Set the state of the notes widget.
    // Should we ever turn it off?
    if (SA.resizePanel) {
        SA.resizePanel.SetVisibility(rootNote.NotesPanelOpen, 0.0);
    }

    this.UpdateQuestionMode();
}


// TODO:
// Hmmmm.  I do not think this is used yet.
// SA.SaveButton setup should not be here though.
NotesWidget.prototype.EditOn = function() {
    SA.SaveButton
        .prop('title', "save to database")
        .attr('src',SA.ImagePathUrl+"save22.png")
        .click(function(){self.SaveCallback();});
    this.AddViewButton.show();
    this.TextEditor.EditOn();
}

NotesWidget.prototype.EditOff = function() {
    SA.SaveButton
        .prop('title', "edit view")
        .attr('src',SA.ImagePathUrl+"text_edit.png")
        .click(function(){self.EditOn();});
    this.AddViewButton.hide();
    this.TextEditor.EditOff();

    /*
    .. note camera buttons....
        .. note title entry (content editable.) ....
        .. note remove button ...
        .. link and delete button ...
        .. Stack stuff ...
    */

}

NotesWidget.prototype.SaveCallback = function(finishedCallback) {
    // Process containers for diagnosis ....
    SA.AddHtmlTags(this.TextEditor.TextEntry);


    // Removed: This led to the unexpected behavior.  A link was changed
    // when there was no good way to know it would be.  It is not
    // highlighted ....
    // Lets try saving the camera for the current note.
    // This is a good comprise.  Do not record the camera
    // every time it moves, but do record it when the samve button
    // is pressed.
    // Camer links in text can display a note without selecting the note. (current).
    //var note = this.DisplayedNote;
    //if (note) {
    //    note.RecordView(this.Display);
    //}
    var note = this.GetCurrentNote();
    // Lets save the state of the notes widget.
    note.NotesPanelOpen = (SA.resizePanel && SA.resizePanel.Visibility);

    var rootNote = this.Display.GetRootNote();
    if (rootNote.Type == "Stack") {
        // Copy viewer annotation to the viewer record.
        rootNote.RecordAnnotations(this.Display);
    }

    var self = this;
    rootNote.Save(function () {
        self.Modified = false;
        if (finishedCallback) {
            finishedCallback();
        }
    });
}

//------------------------------------------------------------------------------

NotesWidget.prototype.GetCurrentNote = function() {
    return this.Display.GetNote();
}


NotesWidget.prototype.SaveBrownNote = function() {
    // Create a new note.
    var note = new SA.Note();
    note.RecordView(this.Display);

    // This is not used and will probably be taken out of the scheme,
    note.SetParent(this.GetCurrentNote());

    // Make a thumbnail image to represent the favorite.
    // Bug: canvas.getDataUrl() not supported in Safari on iPad.
    // Fix: If on mobile, use the thumbnail for the entire slide.
    var src;
    if(SAM.detectMobile()){
        var image = this.Display.GetViewer(0).GetCache().Image;
        src = "/thumb?db=" + image.database + "&img=" + image._id + "";
    } else {
        var thumb = SA.dualDisplay.CreateThumbnailImage(110);
        src = thumb.src;
    }

    // Save the favorite (note) in the admin database for this specific user.
    $.ajax({
        type: "post",
        url: "/webgl-viewer/saveusernote",
        data: {"note": JSON.stringify(note.Serialize(true)),
               "thumb": src,
               "col" : "views",
               "type": "Favorite"},//"favorites"
        success: function(data,status) {
            FAVORITES_WIDGET.FavoritesBar.LoadFavorites();
        },
        error: function() {
            SA.Debug( "AJAX - error() : saveusernote 2" );
        },
    });
}

// Randomize the order of the children
NotesWidget.prototype.RandomCallback = function() {
  var note = this.GetCurrentNote();
  note.Children.sort(function(a,b){return Math.random() - 0.5;});
  note.UpdateChildrenGUI();
}

// Called when a new slide/view is loaded.
NotesWidget.prototype.DisplayRootNote = function() {
    this.TextEditor.LoadNote(this.RootNote);
    this.LinksRoot.empty();
    this.RootNote.DisplayGUI(this.LinksRoot);
    this.SelectNote(this.RootNote);

    // Add an obvious way to add a link / view to the root note.
    if (SA.Edit) {
        var self = this;
        this.AddViewButton
            .appendTo(this.LinksDiv)
            .click(function () {
                var parentNote = SA.notesWidget.RootNote;
                var childIdx = parentNote.Children.length;
                var childNote = parentNote.NewChild(childIdx, "New View");
                // Setup and save
                childNote.RecordView(self.Display);
                // We need to save the note to get its Id (for the link div).
                childNote.Save();
                parentNote.UpdateChildrenGUI();
                this.Display.SetNote(childNote);
                //self.SelectNote(childNote);
            });
    }
    // Default to old style when no text exists (for backward compatability).
    if (this.RootNote.Text == "") {
        this.TabbedWindow.ShowTabDiv(this.LinksDiv);
    } else {
        this.TabbedWindow.ShowTabDiv(this.TextDiv);
    }
}

// Add a user note to the currently selected notes children.
NotesWidget.prototype.NewCallback = function() {
    var note = this.GetCurrentNote();
    var childIdx = 0;
    if (note.Parent) {
        var idx = note.Children.indexOf(note);
        if (idx >= 0) {
            childIdx = idx+1;
            note = note.Parent;
        }
    }
    // Create a new note.
    var childNote = note.NewChild(childIdx, "New View");
    // Setup and save
    childNote.RecordView(this.Display);
    //childNote.Save();
    note.UpdateChildrenGUI();

    note.Save();
    //this.SelectNote(childNote);
    this.Display.SetNote(childNote);
}

// UserNotes used to be attached to a parent note.  Now I am indexing them
// from the image id.  They will not get lost, but this causes a could
// issues.  I do not support multiple user notes per image.  I have to be
// careful about infinte recursion when loading. I am only going to display
// the note for the first image in the root note. (I can rethink this last
// decision later.)
// Maybe we should store the image id directly in the user not instead of
// the viewerRecord.
NotesWidget.prototype.RequestUserNote = function(imageId) {
    var self = this;
    $.ajax({
        type: "get",
        url: "/webgl-viewer/getusernotes",
        data: {"imageid": imageId},
        success: function(data,status) { self.LoadUserNote(data, imageId);},
        error: function() { SA.Debug( "AJAX - error() : getusernotes" ); },
    });
}


// Note will not be active until it has a note.
// Edit to a previous note are saved before it is replaced.
NotesWidget.prototype.LoadUserNote = function(data, imageId) {
    if (this.UserNote) {
        // Save the previous note incase the user is in mid edit????
        if (this.UserNote.Text != "" || this.UserNote.Children.length > 0) {
            this.UserNote.Save();
        }
    }
    this.UserNote = new SA.Note();

    if (data.Notes.length > 0) {
        if (data.Notes.length > 1) {
            SA.Debug("Warning: Only showing the first user note.");
        }
        var noteData = data.Notes[0];
        this.UserNote.Load(noteData);
    } else {
        // start with a copy of the current note.
        // The server searches viewer records for the image.
        // Only copoy the first viewer records.  More could be problematic.
        var note = this.GetCurrentNote();
        if (note && note.ViewerRecords.length > 0) {
            var record = new SA.ViewerRecord();
            record.DeepCopy(note.ViewerRecords[0]);
            this.UserNote.ViewerRecords.push(record);
        }
    }

    // This is new, Parent was always a note before this.
    // Although this is more robust (user notes are constent when notes are
    // copied...), the GUI looks like user notes are associated with notes
    // not viewerRecords/images.
    this.UserNote.Parent = imageId;
    this.UserNote.Type = "UserNote";

    // Must display the text.
    this.UserTextEditor.LoadNote(this.UserNote);
    // User notes are always editable. Unless it tis the demo account.
    if (SA.User != "") {
        this.UserTextEditor.EditOn();
    }
}




    SA.NotesWidget = NotesWidget;

})();
