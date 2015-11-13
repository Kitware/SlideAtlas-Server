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
    this.AddEditButton("webgl-viewer/static/camera.png", "link view",
                       function() {self.InsertCameraLink();});
    this.AddEditButton("webgl-viewer/static/link.png", "link URL",
                       function() {self.InsertUrlLink();});
    this.AddEditButton("webgl-viewer/static/font_bold.png", "bold",
                       function() {document.execCommand('bold',false,null);});
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
    this.AddEditButton("webgl-viewer/static/font_increase.png", "large font", 
                       function(){
                           document.execCommand('fontSize',false,'5');
                           self.ChangeBulletSize('1.5em');
                       });
    this.AddEditButton("webgl-viewer/static/font_decrease.png", "small font", 
                       function() {
                           document.execCommand('fontSize',false,'2');
                           self.ChangeBulletSize('0.9em');
                       });

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
            SA.EventManager.FocusOut();
        })
        .focusout(function() {
            SA.EventManager.FocusIn();
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
            SA.EventManager.FocusOut();
        })
        .focusout(function() {
            SA.EventManager.FocusIn();
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

// Get the selection in this editor.  Returns a range.
// If not, the range is collapsed at the 
// end of the text and a new line is added.
TextEditor.prototype.GetSelectionRange = function() {
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
        while (parent && parent != this.TextEntry[0]) {
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
        range.selectNodeContents(this.TextEntry[0]);
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

// execCommand fontSize does change bullet size.
// This is a work around.
TextEditor.prototype.ChangeBulletSize = function(sizeString) {
    var self = this;
    var sel = window.getSelection();
    // This call will clear the selected text if it is not in this editor.
    var range = this.GetSelectionRange();
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
    var range = this.GetSelectionRange();
    var selectedText = sel.toString();

    if ( ! this.UrlDialog) {
        var self = this;
        var dialog = new Dialog(function() {
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
    this.UpdateNote();
}

// This global variable is an attempt to enumerate generated
// names for links.  The flaw is it always starts over when page is
// loaded. It does not detect links from previous edits.
var LINKS_WITH_NO_NAME = 0;
TextEditor.prototype.InsertCameraLink = function() {
    var self = this;
    var sel = window.getSelection();
    var range = this.GetSelectionRange();

    // Check if an existing link is selected.
    var dm = range.cloneContents();
    if (dm.firstChild &&
        dm.firstChild.getAttribute &&
        (id = dm.firstChild.getAttribute("id"))) {
        // A link is selected,  Just save a new camera for the link.
        note = GetNoteFromId(id);
        if (note) {
            note.RecordView(this.Display);
            // Do not save empty usernotes.
            if (note != "UserNote" || 
                note.Text != "" || 
                this.Note.Children.length > 0) {
                note.Save();
            }
            return;
        }
    }

    // Create a new note.  Save it to get its id. Then insert the html.

    // Case: cursor is in editor, but nothing selected.
    // Use the selected text as a name for the note.
    var text = sel.toString();
    if (text == "") {
        // create a new name. Should I number the notes?
        ++LINKS_WITH_NO_NAME;
        text = "link"+LINKS_WITH_NO_NAME;
    }

    // Create a child note.
    var parentNote = this.Note;
    if ( ! parentNote) {
        parentNote = SA.NotesWidget.RootNote;
    }
    // Put the new note at the end of the list.
    var childIdx = parentNote.Children.length;
    //var childIdx = 0; // begining
    var childNote = parentNote.NewChild(childIdx, text);
    // Setup and save
    childNote.RecordView(this.Display);
    // We need to save the note to get its Id (for the link div).
    childNote.Save();
    parentNote.UpdateChildrenGUI();

    // We need to save the note to get its Id.
    childNote.Save(
        function (note) {
            // Simply put a span tag around the text with the id of the view.
            // It will be formated by the note hyperlink code.
            var span = document.createElement("span");
            // This id identifies the span as a hyperlink to this note.
            // The note will format the link and add callbacks later.
            span.id = note.Id;
            if ( ! range.collapsed) {
                // Remove the selected text.
                range.extractContents(); // deleteContents(); // cloneContents
                range.collapse(true);
                span.appendChild( document.createTextNode(text) );
            } else {
                // no text selected.  What should we insert to represent a
                // link? An image would be nice.
                span.appendChild( document.createTextNode(" (link"+LINKS_WITH_NO_NAME+") ") );
            }
            range.insertNode(span);
            // Let the note format it.
            note.FormatHyperlink();
            self.UpdateNote();
            // Do not automatically select new hyperlinks.
            // The user may want to insert one after another.
            //SA.NotesWidget.SelectNote(note);
            if (range.noCursor) {
                // Leave the selection the same as we found it.
                // Ready for the next link.
                sel.removeAllRanges();
            }
        });
}

TextEditor.prototype.Resize = function(width, height) {
    var pos;
    pos = this.TextEntry.offset();
    this.TextEntry.height(height - pos.top - 5);
}

TextEditor.prototype.SetHtml = function(html) {
    if (this.UpdateTimer) {
        clearTimeout(this.UpdateTimer());
        this.Update();
    }
    this.Note = null; //??? Editing without a note
    this.EditOn();
    this.TextEntry.html(html);
}

TextEditor.prototype.GetHtml = function() {
    return this.TextEntry.html();
}

// TODO: Editor should not become active until it has a note.
// This probably belongs in a subclass.
// Or in the note.
TextEditor.prototype.LoadNote = function(note) {
    if (this.UpdateTimer) {
        clearTimeout(this.UpdateTimer());
        this.Update();
    }
    this.Note = note;
    this.TextEntry.html(note.Text);
    for (var i = 0; i < note.Children.length; ++i) {
        note.Children[i].FormatHyperlink();
    }
    
    this.MakeLinksClickable();
    if (EDIT) {
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
    if (EDIT) {
        // This is only necesary when div is editable.
        // Links work the same in both situations with this.
        links = $("a");
        for (var i = 0; i < links.length; ++i) {
            var link = links[i];
            $(link)
                .click(function() {
                    window.open(this.href,'_blank');
                })
        }
    }
}

//==============================================================================


function NotesWidget(parent, display) {
    this.ModifiedCallback = null;
    this.LinkDiv;
    // This is a hack.  I do not know when to save the camera.
    // The save button will save the camera for the last note displayed.
    // This may be different that the selected note because of camera links
    // in text that do not change the text.
    this.DisplayedNote = null;

    // Popup div to display permalink.
    LINK_DIV =
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
        .mouseleave(function() { LINK_DIV.fadeOut(); });

    // There is not option to show the link when EDIT is not on,
    // so this really does nothing.  Editable is probably necessary
    // for selection to copy.
    if (EDIT) {
        LINK_DIV.attr('contenteditable', "true");
    }

    var self = this;
    this.Display = display;

    this.Modified = false;
    this.Window = $('<div>').appendTo('body')
        .css({
            'background-color': 'white',
            'position': 'absolute',
            'top' : '0%',
            'left' : '0%',
            'height' : '100%',
            'z-index': '2'})
        .hide()
        .attr('draggable','false')
        .on("dragstart", function() {return false;})
        .attr('id', 'NoteWindow');

    //--------------------------------------------------------------------------

    // TODO: Move the resize animation outside of this widget.
    // It would be more elegant if this widget was size passive.

    // It would be nice to animate the transition
    // It would be nice to integrate all animation in a flexible utility.
    this.AnimationLastTime;
    this.AnimationDuration;
    this.AnimationTarget;
    // For animating the display of the notes window (DIV).
    this.Width = 0;
    this.Visibility = false;
    this.Dragging = false;

    if ( ! MOBILE_DEVICE) {
        this.ResizeNoteWindowEdge = $('<div>')
            .appendTo(parent)
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

        this.OpenNoteWindowButton = $('<img>')
            .appendTo(parent)
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
            .on("dragstart", function() {
                return false;});


        this.CloseNoteWindowButton = $('<img>')
            .appendTo(this.Window)
            .css({'position': 'absolute',
                  'height': '20px',
                  'width': '20x',
                  'top' : '0px',
                  'right' : '0px',
                  'opacity': '0.6',
                  '-moz-user-select': 'none',
                  '-webkit-user-select': 'none',
                  'z-index': '6'})
            .hide()
            .attr('src',"webgl-viewer/static/dualArrowLeft2.png")
            .click(function(){self.ToggleNotesWindow();})
            .attr('draggable','false')
            .on("dragstart", function() {
                return false;});

    }

    //--------------------------------------------------------------------------

    // Root of the note tree.
    this.RootNote;
    // Keeps track of the current note.
    this.NavigationWidget;

    // For clearing selected GUI setting.
    this.SelectedNote;

    // GUI elements
    this.TabbedWindow = new TabbedDiv(this.Window);
    this.LinksDiv = this.TabbedWindow.NewTabDiv("Views");
    this.LinksRoot = $('<ul>')
        .addClass('sa-ul')
        .css({'padding-left':'0px'})
        .appendTo(this.LinksDiv);
    this.TextDiv = this.TabbedWindow.NewTabDiv("Text");
    this.UserTextDiv = this.TabbedWindow.NewTabDiv("Notes", "private notes");

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
    if (EDIT) {
        this.AddViewButton = $('<button>')
            .appendTo(this.LinksDiv)
            .css({'border-radius': '4px',
                  'margin': '1em'})
            .text("+ New View")
    }

    // Now for the text tab:
    this.TextEditor = new TextEditor(this.TextDiv, this.Display);
    if ( ! EDIT) {
        this.TextEditor.EditableOff();
    } else {
        this.TextEditor.Change(
            function () {
                self.MarkAsModified();
            });
    }
    // Private notes.
    this.UserTextEditor = new TextEditor(this.UserTextDiv, this.Display);
    this.UserTextEditor.Change(
        function () {
            self.UserTextEditor.Note.Save();
        });
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
        note.DisplayView(this.Display);
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
    if (LINK_DIV.is(':visible')) { LINK_DIV.fadeOut();}

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
    //$('#'+SA.NotesWidget.SelectedNote.Id).css({'background':'#CCC'});
    // Select the current hyper link
    note.SelectHyperlink();

    if (SA.DualDisplay && 
        SA.DualDisplay.NavigationWidget) {
        SA.DualDisplay.NavigationWidget.Update();
    }

    if (this.Display.GetNumberOfViewers() > 1) {
        this.Display.GetViewer(1).Reset();
        // TODO:
        // It would be nice to store the viewer configuration
        // as a separate state variable.  We might want a stack
        // that defaults to a single viewer.
        this.Display.SetNumberOfViewers(note.ViewerRecords.length);
    }

    // Clear the sync callback.
    var self = this;
    for (var i = 0; i < this.Display.GetNumberOfViewers(); ++i) {
        this.Display.GetViewer(i).OnInteraction();
        if (EDIT) {
            // These record changes in the viewers to the notes.
            this.Display.GetViewer(i).OnInteraction(function () {self.RecordView();});
        }
    }

    if (note.Type == "Stack") {
        // Select only gets called when the stack is first loaded.
        this.Display.GetViewer(0).OnInteraction(function () {
            self.SynchronizeViews(0, note);});
        this.Display.GetViewer(1).OnInteraction(function () {
            self.SynchronizeViews(1, note);});
        note.DisplayStack(this.Display);
        // First view is set by viewer record camera.
        // Second is set relative to the first.
        this.SynchronizeViews(0, note);
    } else {
        note.DisplayView(this.Display);
    }
}

// refViewerIdx is the viewer that changed and other viewers need 
// to be updated to match that reference viewer.
NotesWidget.prototype.SynchronizeViews = function (refViewerIdx, note) {
    // We allow the viewer to go one past the end.
    if (refViewerIdx + note.StartIndex >= note.ViewerRecords.length) {
        return;
    }

    // Special case for when the shift key is pressed.
    // Translate only one camera and modify the tranform to match.
    if (EDIT && SA.EventManager.CursorFlag) {
        var trans = note.ViewerRecords[note.StartIndex + 1].Transform;
        if ( ! note.ActiveCorrelation) {
            if ( ! trans) {
                alert("Missing transform");
                return;
            }
            // Remove all correlations visible in the window.
            var cam = this.Display.GetViewer(0).GetCamera();
            var bds = cam.GetBounds();
            var idx = 0;
            while (idx < trans.Correlations.length) {
                var cor = trans.Correlations[idx];
                if (cor.point0[0] > bds[0] && cor.point0[0] < bds[1] && 
                    cor.point0[1] > bds[2] && cor.point0[1] < bds[3]) {
                    trans.Correlations.splice(idx,1);
                } else {
                    ++idx;
                }
            }

            // Now make a new replacement correlation.
            note.ActiveCorrelation = new PairCorrelation();
            trans.Correlations.push(note.ActiveCorrelation);
        }
        var cam0 = this.Display.GetViewer(0).GetCamera();
        var cam1 = this.Display.GetViewer(1).GetCamera();
        note.ActiveCorrelation.SetPoint0(cam0.GetFocalPoint());
        note.ActiveCorrelation.SetPoint1(cam1.GetFocalPoint());
        // I really do not want to set the roll unless the user specifically changed it.
        // It would be hard to correct if the wrong value got set early in the aligment.
        var deltaRoll = cam1.Roll - cam0.Roll;
        if (trans.Correlations.length > 1) {
            deltaRoll = 0;
            // Let roll be set by multiple correlation points.
        }
        note.ActiveCorrelation.SetRoll(deltaRoll);
        note.ActiveCorrelation.SetHeight(0.5*(cam1.Height + cam0.Height));
        return; 
    } else {
        // A round about way to set and unset the active correlation.
        // Note is OK, because if there is no interaction without the shift key
        // the active correlation will not change anyway.
        note.ActiveCorrelation = undefined;
    }

    // No shift modifier:
    // Synchronize all the cameras.
    // Hard coded for two viewers (recored 0 and 1 too).
    // First place all the cameras into an array for code simplicity.
    // Cameras used for preloading.
    if (! note.PreCamera) { note.PreCamera = new Camera();}
    if (! note.PostCamera) { note.PostCamera = new Camera();}
    var cameras = [note.PreCamera, 
                   this.Display.GetViewer(0).GetCamera(), 
                   this.Display.GetViewer(1).GetCamera(), 
                   note.PostCamera];
    var refCamIdx = refViewerIdx+1; // An extra to account for PreCamera.
    // Start with the reference section and move forward.
    // With two sections, the second has the transform.
    for (var i = refCamIdx+1; i < cameras.length; ++i) {
        var transIdx = i - 1 + note.StartIndex;
        if (transIdx < note.ViewerRecords.length) {
            note.ViewerRecords[transIdx].Transform
                .ForwardTransformCamera(cameras[i-1],cameras[i]);
        } else {
            cameras[i] = undefined;
        }
    }

    // Start with the reference section and move backward.
    // With two sections, the second has the transform.
    for (var i = refCamIdx; i > 0; --i) {
        var transIdx = i + note.StartIndex-1;
        if (transIdx > 0) { // First section does not have a transform
            note.ViewerRecords[transIdx].Transform
                .ReverseTransformCamera(cameras[i],cameras[i-1]);
        } else {
            cameras[i-1] = undefined;
        }
    }

    // Preload the adjacent sections.
    if (cameras[0]) {
        var cache = FindCache(note.ViewerRecords[note.StartIndex-1].Image);
        cameras[0].SetViewport(this.Display.GetViewer(0).GetViewport());
        var tiles = cache.ChooseTiles(cameras[0], 0, []);
        for (var i = 0; i < tiles.length; ++i) {
            tiles[i].LoadQueueAdd();
        }
        LoadQueueUpdate();
    }
    if (cameras[3]) {
        var cache = FindCache(note.ViewerRecords[note.StartIndex+2].Image);
        cameras[3].SetViewport(this.Display.GetViewer(0).GetViewport());
        var tiles = cache.ChooseTiles(cameras[3], 0, []);
        for (var i = 0; i < tiles.length; ++i) {
            tiles[i].LoadQueueAdd();
        }
        LoadQueueUpdate();
    }

    // OverView cameras need to be updated.
    if (refViewerIdx == 0) {
        this.Display.GetViewer(1).UpdateCamera();
        this.Display.GetViewer(1).EventuallyRender(false);
    } else {
        this.Display.GetViewer(0).UpdateCamera();
        this.Display.GetViewer(0).EventuallyRender(false);
    }

    // Synchronize annitation visibility.
    var refViewer = this.Display.GetViewer(refViewerIdx);
    for (var i = 0; i < 2; ++i) {
        if (i != refViewerIdx) {
            var viewer = this.Display.GetViewer(i);
            if (viewer.AnnotationWidget && refViewer.AnnotationWidget) {
                viewer.AnnotationWidget.SetVisibility(
                    refViewer.AnnotationWidget.GetVisibility());
            }
        }
    }
}

NotesWidget.prototype.RecordView = function() {
    if ( ! EDIT) { return; }

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
    note.RecordAnnotations(this.Display);
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
    this.RootNote = rootNote;
    this.DisplayRootNote();

    // Only show user notes for the first image of the root note.
    // I can rethink this later.
    if (rootNote.ViewerRecords.length > 0) {
        this.RequestUserNote(rootNote.ViewerRecords[0].Image._id);
    }
}


// TODO:
// Hmmmm.  I do not think this is used yet.
// SAVE_BUTTON setup should not be here though.
NotesWidget.prototype.EditOn = function() {
    SAVE_BUTTON
        .prop('title', "save to database")
        .attr('src',"webgl-viewer/static/save22.png")
        .click(function(){self.SaveCallback();});
    this.AddViewButton.show();
    this.TextEditor.EditOn();
}

NotesWidget.prototype.EditOff = function() {
    SAVE_BUTTON
        .prop('title', "edit view")
        .attr('src',"webgl-viewer/static/text_edit.png")
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
    // Lets try saving the camera for the current note.
    // This is a good comprise.  Do not record the camera
    // every time it moves, but do record it when the samve button
    // is pressed.
    // Camer links in text can display a note without selecting the note. (current).
    var note = this.DisplayedNote;
    if (note) {
        note.RecordView(this.Display);
    }
    note = this.GetCurrentNote();
    // Lets save the state of the notes widget.
    note.NotesPanelOpen = this.Visibility;

    this.RootNote;
    if (this.RootNote.Type == "Stack") {
        // Copy viewer annotation to the viewer record.
        this.RootNote.RecordAnnotations(this.Display);
    }

    var self = this;
    this.RootNote.Save(function () {
        self.Modified = false;
        if (finishedCallback) {
            finishedCallback();
        }
    });
}

//------------------------------------------------------------------------------
NotesWidget.prototype.StartDrag = function () {
    this.Dragging = true;
    $('body').bind('mousemove',NotesWidgetResizeDrag);
    $('body').bind('mouseup', NotesWidgetResizeStopDrag);
    $('body').css({'cursor': 'col-resize'});
}
NotesWidgetResizeDrag = function (e) {
    SA.NotesWidget.SetWidth(e.pageX - 1);
    if (SA.NotesWidget.Width < 200) {
        NotesWidgetResizeStopDrag();
        SA.NotesWidget.ToggleNotesWindow();
    }

    return false;
}
NotesWidgetResizeStopDrag = function () {
    $('body').unbind('mousemove',NotesWidgetResizeDrag);
    $('body').unbind('mouseup', NotesWidgetResizeStopDrag);
    $('body').css({'cursor': 'auto'});
}
//------------------------------------------------------------------------------



NotesWidget.prototype.SetWidth = function(width) {
    this.Width = width;
    this.Window.width(width);
    // TODO: Get rid of this hack.
    $(window).trigger('resize');
}

// Necessary to set the height.
NotesWidget.prototype.Resize = function(width, height) {
    this.TextEditor.Resize(width,height);
    if (this.UserTextEditor) {
        this.UserTextEditor.Resize(width,height);
    }
    var pos = this.LinksDiv.offset();
    this.LinksDiv.height(height - pos.top);
}


NotesWidget.prototype.GetCurrentNote = function() {
    return this.NavigationWidget.GetNote();
}


// TODO: ??? Check if this is legacy
NotesWidget.prototype.SaveUserNote = function() {
    // Create a new note.
    var childNote = new Note();
    var d = new Date();
    this.Date = d.getTime(); // Also reset later.

    childNote.ViewerRecords = [];
    for (var i = 0; i < this.Display.GetNumberOfViewers(); ++i) {
        var viewer = this.Display.GetViewer(i);
        var viewerRecord = new ViewerRecord();
        viewerRecord.CopyViewer(viewer);
        childNote.ViewerRecords.push(viewerRecord);
    }

    // Now add the note as the last child to the current note.
    parentNote = this.GetCurrentNote();
    parentNote.Children.push(childNote);
    // ParentId is how we retrieve notes from the database.
    // It is the only tree structure saved.
    childNote.SetParent(parentNote);
    // Expand the parent so that the new note is visible.
    parentNote.ChildrenVisible = true;

    // Save the note in the database for this specific user.
    // TODO: If author privileges, save note in the actual session / view.
    var bug = JSON.stringify( childNote );
    $.ajax({
        type: "post",
        url: "/webgl-viewer/saveusernote",
        data: {"note": JSON.stringify(childNote.Serialize(false)),
               "col" : "notes",
               "date": d.getTime(),
               "type": "UserNote"},
        success: function(data,status) { childNote.Id = data;},
        error: function() {
            saDebug( "AJAX - error() : saveusernote 1" );
        },
    });

    // Redraw the GUI. should we make the parent or the new child active?
    this.NavigationWidget.NextNote();
}

NotesWidget.prototype.SaveBrownNote = function() {
    // Create a new note.
    var note = new Note();
    note.RecordView(this.Display);

    // This is not used and will probably be taken out of the scheme,
    note.SetParent(this.GetCurrentNote());

    // Make a thumbnail image to represent the favorite.
    // Bug: canvas.getDataUrl() not supported in Safari on iPad.
    // Fix: If on mobile, use the thumbnail for the entire slide.
    var src;
    if(MOBILE_DEVICE){
        var image = this.Display.GetViewer(0).GetCache().Image;
        src = "/thumb?db=" + image.database + "&img=" + image._id + "";
    } else {
        var thumb = CreateThumbnailImage(110);
        src = thumb.src;
    }

    // Save the favorite (note) in the admin database for this specific user.
    $.ajax({
        type: "post",
        url: "/webgl-viewer/saveusernote",
        data: {"note": JSON.stringify(note.Serialize(false)),
               "thumb": src,
               "col" : "views",
               "type": "Favorite"},//"favorites"
        success: function(data,status) {
            note.Id = data;
            LoadFavorites();
        },
        error: function() {
            saDebug( "AJAX - error() : saveusernote 2" );
        },
    });
}


NotesWidget.prototype.ToggleNotesWindow = function() {
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


// Randomize the order of the children
NotesWidget.prototype.RandomCallback = function() {
  var note = this.GetCurrentNote();
  note.Children.sort(function(a,b){return Math.random() - 0.5;});
  note.UpdateChildrenGUI();
}


NotesWidget.prototype.AnimateNotesWindow = function() {
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

// Called when a new slide/view is loaded.
NotesWidget.prototype.DisplayRootNote = function() {
    this.TextEditor.LoadNote(this.RootNote);
    this.LinksRoot.empty();
    this.RootNote.DisplayGUI(this.LinksRoot);
    this.SelectNote(this.RootNote);

    // Add an obvious way to add a link / view to the root note.
    if (EDIT) {
        var self = this;
        this.AddViewButton
            .appendTo(this.LinksDiv)
            .click(function () {
                var parentNote = SA.NotesWidget.RootNote;
                var childIdx = parentNote.Children.length;
                var childNote = parentNote.NewChild(childIdx, "New View");
                // Setup and save
                childNote.RecordView(self.Display);
                // We need to save the note to get its Id (for the link div).
                childNote.Save();
                parentNote.UpdateChildrenGUI();

                self.SelectNote(childNote);
            });
    }

    // Default to old style when no text exists (for backward compatability).
    if (this.RootNote.Text == "") {
        this.TabbedWindow.ShowTabDiv(this.LinksDiv);
    } else {
        this.TabbedWindow.ShowTabDiv(this.TextDiv);
        // Hack to open the notes window if we have text.
        if ( ! this.Visibility && ! MOBILE_DEVICE) {
            this.ToggleNotesWindow();
        }
    }
}


NotesWidget.prototype.LoadViewId = function(viewId) {
    VIEW_ID = viewId;
    var note = new Note();
    if (typeof(viewId) != "undefined" && viewId != "") {
        note.LoadViewId(
            viewId,
            function () {
                SA.NotesWidget.SetRootNote(note);
                SA.NotesWidget.DisplayRootNote();
            }
        );
    }
    // Since loading the view is asynchronous,
    // the this.RootNote is not complete at this point.
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
    this.SelectNote(childNote);
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
        error: function() { saDebug( "AJAX - error() : getusernotes" ); },
    });
}




// What should i do if the user starts editing before the note loads?
// Note will not be active until it has a note.
// Edit to a previous note are saved before it is replaced.
NotesWidget.prototype.LoadUserNote = function(data, imageId) {
    if (this.UserNote) {
        // Save the previous note incase the user is in mid edit????
        if (this.UserNote.Text != "" || this.UserNote.Children.length > 0) {
            this.UserNote.Save();
        }
    }
    this.UserNote = new Note();

    if (data.Notes.length > 0) {
        if (data.Notes.length > 1) {
            saDebug("Warning: Only showing the first user note.");
        }
        var noteData = data.Notes[0];
        this.UserNote.Load(noteData);
    } else {
        // start with a copy of the current note.
        // The server searches viewer records for the image.
        // Only copoy the first viewer records.  More could be problematic.
        var note = this.GetCurrentNote();
        if (note && note.ViewerRecords.length > 0) {
            var record = new ViewerRecord();
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
    if (USER != "") {
        this.UserTextEditor.EditOn();
    }
}

