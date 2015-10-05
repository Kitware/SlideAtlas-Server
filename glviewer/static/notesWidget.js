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
            EVENT_MANAGER.FocusOut();
        })
        .focusout(function() {
            EVENT_MANAGER.FocusIn();
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
        })
        .focusin(function() {
            EVENT_MANAGER.FocusOut();
        })
        .focusout(function() {
            EVENT_MANAGER.FocusIn();
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
        parentNote = NOTES_WIDGET.RootNote;
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
            //NOTES_WIDGET.SelectNote(note);
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
    this.EditOn();
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


function NotesWidget(display) {
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

        this.OpenNoteWindowButton = $('<img>')
            .appendTo(VIEW_PANEL)
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

    // Iterator is used to implement the next and previous note buttons.
    this.Iterator;
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
    // For when user selects a note from a list.
    // Find the note and set a new iterator
    // This is so the next and previous buttons will behave.
    if (this.Iterator.GetNote() != note) {
        var iter = this.RootNote.NewIterator();
        while (iter.GetNote() != note) {
            if ( iter.IsEnd()) {
                // I am supporting hyperlinks in UserNote.
                // They are not in the links tree yet.
                // Hack, Just display the view.
                note.DisplayView(this.Display);
                // Hilight the text.
                note.SelectHyperlink();
                return;
            }
            iter.Next();
        }
        this.Iterator = iter;
    }

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
    //$('#'+NOTES_WIDGET.SelectedNote.Id).css({'background':'#CCC'});
    // Select the current hyper link
    note.SelectHyperlink();

    if (NAVIGATION_WIDGET) {NAVIGATION_WIDGET.Update(); }

    if (this.Display.GetNumberOfViewers() > 1) {
        this.Display.GetViewer(1).Reset();
        // TODO:
        // It would be nice to store the viewer configuration
        // as a separate state variable.  We might want a stack
        // that defaults to a single viewer.
        display.SetNumberOfViewers(note.ViewerRecords.length);
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
        if (VIEW_MENU) VIEW_MENU.StackDetectButton.show();
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
        if (VIEW_MENU) VIEW_MENU.StackDetectButton.hide();
        note.DisplayView(this.Display);
    }
}

// refViewerIdx is the viewer that changed and other viewers need 
// to be updated to match that reference viewer.
NotesWidget.prototype.SynchronizeViews = function (refViewerIdx, note) {
    if (refViewerIdx + note.StartIdx >= note.ViewerRecords.length) {
        return;
    }

    // Special case for when the shift key is pressed.
    // Translate only one camera and modify the tranform to match.
    if (EDIT && EVENT_MANAGER.CursorFlag) {
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
    this.Iterator = this.RootNote.NewIterator();
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
    NOTES_WIDGET.SetWidth(e.pageX - 1);
    if (NOTES_WIDGET.Width < 200) {
        NotesWidgetResizeStopDrag();
        NOTES_WIDGET.ToggleNotesWindow();
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

//------------------------------------------------------------------------------
// Iterator to perform depth first search through note tree.
// Collapsed branches (children not visible) are not traversed.
// This iterator is a bit over engineered.  I made it so we can subclasses
// that iterate over internal states.  However, internal states require
// notes so I made an array of answers (which are hidden).
function NoteIterator(note) {
  this.Note = note;
  this.ChildIterator = null;
}

// Because of sorting, the child array gets reset on us.
// I need a dynamic way to get the Children array based on the state.
NoteIterator.prototype.GetChildArray = function() {
  if ( ! this.Note) {
    return [];
  }
  return this.Note.Children;
}

// Because of sorting, I have to make the index dynamic
// and it cannot be stored as an ivar.
NoteIterator.prototype.GetChildIndex = function() {
  if (this.ChildIterator == null) {
    return -1;
  }
  return this.GetChildArray().indexOf( this.ChildIterator.Note );
}



NoteIterator.prototype.GetNote = function() {
  if (this.ChildIterator != null) {
    return this.ChildIterator.GetNote();
  }
  return this.Note;
}

// Get the parent note of the current note.
// Notes do not keep a pointer to parents.
// The iterator has this information for active notes.
NoteIterator.prototype.GetParentNote = function() {
  if (this.ChildIterator == null) {
    // We are at the current note.  Let the caller supply the parent.
    return null;
  }

  var parent = this.ChildIterator.GetParentNote();
  if (parent == null) {
    // This level contains the parent.
    parent = this.Note;
  }

  return parent;
}


// We use this to see (peek) if next or previous should be disabled.
NoteIterator.prototype.IsStart = function() {
  if (this.ChildIterator == null) {
    return true;
  }
  return false;
}


NoteIterator.prototype.IsEnd = function() {
  // Case note is active.
  if (this.ChildIterator == null) {
    if (this.Note.Children.length > 0 && this.Note.ChildrenVisibility) {
      return false;
    }
    return true;
  }

  // sub answer is active.
  var childIndex = this.GetChildIndex();

  // sub child is active
  if (childIndex == this.GetChildArray().length - 1) {
    return this.ChildIterator.IsEnd();
  }
  return false;
}


// Parent note is traversed before children.
// Move forward one step.  Return the new note. At end the last note returned again.
// IsEnd method used to detect terminal case.
NoteIterator.prototype.Next = function() {
  // Case 1:  Iterator is on its own node.
  if (this.ChildIterator == null) {
    // Next check for children notes
    if (this.Note.Children.length > 0 && this.Note.ChildrenVisibility) {
      // Move to the first child.
      this.ChildIterator = this.GetChildArray()[0].NewIterator();
      return this.ChildIterator.GetNote();
    }
    // No answers or children: we are at the end.
    return this.Note;
  }

  // Try to advance the child iterator.
  if ( ! this.ChildIterator.IsEnd()) {
    return this.ChildIterator.Next();
  }

  // Child iterator is finished.
  // Try to create a new iterator with the next child in the array.
  var childIndex = this.GetChildIndex();
  if (childIndex < this.GetChildArray().length-1) {
    this.ChildIterator = this.GetChildArray()[childIndex+1].NewIterator();
    return this.ChildIterator.GetNote();
  }

  // We are at the end of the children array.
  return this.ChildIterator.GetNote();
}


// Move backward one step.  See "Next" method comments for description of tree traversal.
NoteIterator.prototype.Previous = function() {
  if (this.ChildIterator == null) {
    // At start.
    return this.Note;
  }
  if ( ! this.ChildIterator.IsStart()) {
    return this.ChildIterator.Previous();
  }

  // Move to the previous child.
  var childIndex = this.GetChildIndex() - 1;
  if (childIndex >= 0) {
    this.ChildIterator = this.GetChildArray()[childIndex].NewIterator();
    this.ChildIterator.ToEnd();
    return this.ChildIterator.GetNote();
  }

  // No more sub notes left.  Move to the root.
  this.ChildIterator = null;
  return this.Note;
}


// Move the iterator to the end. Used in Previous method.
NoteIterator.prototype.ToEnd = function() {
  if (this.Note.Children.length > 0 && this.Note.ChildrenVisibility) {
    this.ChildArray = this.Note.Children;
    var childIndex = this.ChildArray.length - 1;
    this.ChildIterator = this.ChildArray[childIndex].NewIterator();
    return this.ChildIterator.ToEnd();
  }
  // leaf note
  this.ChildArray = null;
  this.ChildIterator = null;
  return this.Note;
}



//------------------------------------------------------------------------------
// Note object (maybe will be used for views and sessions too).

// data is the object retrieved from mongo (with string ids)
// Right now we expect bookmarks, but it will be generalized later.
var NOTES = [];

function Note () {

    // A global list of notes so we can find a note by its id.
    this.TempId = 'tmp'+NOTES.length; // hack for html views.
    NOTES.push(this);

    var self = this;

    this.User = GetUser(); // Reset by flask.
    var d = new Date();
    this.Date = d.getTime(); // Also reset later.
    this.Type = "Note";
    this.Mode = "";

    this.Title = "";
    this.Text = "";
    //this.UserText = "";
    this.Modified = false;

    // Upto two for dual view.
    this.ViewerRecords = [];

    // ParentNote (it would be nice to make the session a note too).
    this.Parent = null;

    // Sub notes
    this.Children = [];
    this.ChildrenVisibility = true;

    // GUI elements.
    this.Div = $('<li>')
        .attr({'class':'note'});

    this.TitleDiv = $('<div>')
        .css({'position':'relative'})
        .appendTo(this.Div);

    this.SortHandle = $('<span>')
        .appendTo(this.TitleDiv)
        .css({'position':'absolute',
              'left':'0px',
              'top':'0px',
              'opacity':'0.5'})
        .addClass('ui-icon ui-icon-bullet');


    this.ButtonsDiv = $('<div>')
        .appendTo(this.TitleDiv)
        .css({'float':'right'})
        .hide();
    this.TitleEntry = $('<div>')
        .css({'margin-left':'20px'})
        .appendTo(this.TitleDiv)
        .text(this.Title)
        .addClass('sa-title');

    if (EDIT) {
        this.AddButton = $('<img>')
            .appendTo(this.ButtonsDiv)
            .attr('src',"webgl-viewer/static/page_add.png")
            .addClass('editButton')
            .prop('title', "add view")
            .css({
                'width':'12px',
                'height':'12px',
                'opacity':'0.5'});
        this.LinkButton = $('<img>')
            .appendTo(this.ButtonsDiv)
            .attr('src',"webgl-viewer/static/link.png")
            .prop('title', "show url")
            .addClass('editButton')
            .css({
                'width':'12px',
                'height':'12px',
                'opacity':'1.0'});
        this.RemoveButton = $('<img>')
            .appendTo(this.ButtonsDiv)
            .hide()
            .attr('src',"webgl-viewer/static/remove.png")
            .prop('title', "delete")
            .addClass('editButton')
            .css({
                'width':'12px',
                'height':'12px',
                'opacity':'0.5'});
    }

    if (this.HideAnnotations && this.HiddenTitle) {
        this.TitleEntry.text(this.HiddenTitle);
    }


    if (EDIT) {
        this.Modified = false;
        this.TitleEntry
            .attr('contenteditable', "true");
    }


    // The div should attached even if nothing is in it.
    // A child may appear and UpdateChildrenGui called.
    // If we could tell is was removed, UpdateChildGUI could append it.
    this.ChildrenDiv = $('<ul>')
        .addClass('sa-ul')
        .appendTo(this.Div);

    if (EDIT) {
        this.ChildrenDiv
            .sortable({update: function(event,ui){self.SortCallback();},
                       handle: ".ui-icon"});
    } else {
        this.ChildrenDiv
            .disableSelection();
    }

    // This is for stack notes (which could be a subclass).
    // It looks like the stack will start on this index when it first
    // is loaded.  This changes when navigating the stack.
    this.StartIndex = 0;
    this.ActiveCorrelation = undefined;
    this.StackDivs = [];
}

// For copy slide in presentations
Note.prototype.DeepCopy = function(note) {
    // I tried serialize / load, but the image changed to a string id.
    this.Image = Note.Image; // not really deep.
    this.Children = [];
    for (var i = 0; i < note.Children.length; ++i) {
        var child = new Note();
        child.DeepCopy(note.Children[i]);
        this.Children.push(child);
    }
    this.Parent = note.Parent;
    this.StartIndex = note.StartIndex;
    // Replace old note id with new in HTML.
    var oldId = note.Id || note.TempId;
    var newId = this.Id || this.TempId;
    this.Text = note.Text.replace(oldId, newId);
    this.Title = note.Title;
    this.Type = note.Type;
    this.User = note.User;
    //this.UserText = note.UserText;
    this.ViewerRecords = [];
    for (var i = 0; i < note.ViewerRecords.length; ++i) {
        var record = new ViewerRecord();
        record.DeepCopy(note.ViewerRecords[i]);
        this.ViewerRecords.push(record);
    }
}

// So this is a real pain.  I need to get the order of the notes from
// the childrenDiv jquery element.
Note.prototype.SortCallback = function() {
    var newChildren = [];
    var children = this.ChildrenDiv.children();
    for (var newIndex = 0; newIndex < children.length; ++newIndex) {
        var oldIndex = $(children[newIndex]).data('index');
        var note = this.Children[oldIndex];
        note.Div.data("index", newIndex);
        newChildren.push(note);
    }

    this.Children = newChildren;
    this.UpdateChildrenGUI();
    NOTES_WIDGET.MarkAsModified();
}


function GetNoteFromId(id) {
    if (id.substr(0,3) == 'tmp') {
        var idx = parseInt(id.substr(3));
        return NOTES[idx];
    }
    for (var i = 0; i < NOTES.length; ++i) {
        var note = NOTES[i];
        if (note.Id && note.Id == id) {
            return note;
        }
    }
    return null;
}


// Every time the "Text" is loaded, they hyper links have to be setup.
Note.prototype.FormatHyperlink = function() {
    var self = this;
    if (this.Id) {
        span = document.getElementById(this.Id);
        if (span) {
            $(span)
                //  I do not want the text to change. 
                .click(function() { self.DisplayView(NOTES_WIDGET.Display);})
                //.click(function() { NOTES_WIDGET.SelectNote(self);})
                .css({'color': '#29C'})
                .hover(function(){ $(this).css("color", "blue");},
                       function(){ $(this).css("color", "#29C");});
            // Let the selection indicate the current note.
            // this highlighting suggests the camera button will
            // will operate on this link rather than inserting a new one.
            //if (this == NOTES_WIDGET.SelectedNote) {
            //    $(span).css({'background':'#CCC'});
            //} else {
                $(span).css({'background':'white'});
            //}
        }
    }
}

// When the note is deleted, this clear associated text links.
// However, it does not remove the span id.
Note.prototype.ClearHyperlink = function() {
    var self = this;
    if (this.Id) {
        // I think is will be best to seelct the element and then replace
        // it with text.
        this.SelectHyperlink();
        var sel = window.getSelection();
        document.execCommand('insertText', sel.toString());
    }
}

// Programatically select the hyper link (when the note is selected).
Note.prototype.SelectHyperlink = function () {
    if (this.Id) {
        var el = document.getElementById(this.Id);
        if (el) {
            var range = document.createRange();
            //range.selectNodeContents(el);
            range.selectNode(el);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}

// Programatically select the hyper link (when the note is selected).
Note.prototype.UnselectHyperlink = function () {
    if (this.Id) {
        var el = document.getElementById(this.Id);
        if (el) {
            var range = document.createRange();
            range.collapse(true);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}

Note.prototype.SetParent = function(parent) {
    var self = this;
    this.Parent = parent;
    if (parent && EDIT) {
        this.RemoveButton.show();
    }
}

Note.prototype.TitleFocusInCallback = function() {
  // Keep the viewer from processing arrow keys.
  EVENT_MANAGER.FocusOut();
  NOTES_WIDGET.SelectNote(this);
}


Note.prototype.TitleFocusOutCallback = function() {
    if (this.Modified) {
        // Move the Title from the GUI to the note.
        this.Modified = false;
        this.Title = this.TitleEntry.text();
        NOTES_WIDGET.MarkAsModified();
    }
    // Allow the viewer to process arrow keys.
    EVENT_MANAGER.FocusIn();
    if ( ! this.Modified) { return; }
    this.Modified = false;
    var text = this.TitleEntry.text();
    if (this.Title != text && ! this.HideAnnotations) {
        this.Title = text;
        this.Save();
    }
    if (this.HiddenTitle != text && this.HideAnnotations) {
        this.HiddenTitle = text;
        this.Save();
    }
}

Note.prototype.LinkCallback = function() {
    var text = "slide-atlas.org/webgl-viewer?view="+this.Id;
    LINK_DIV.html(text);
    LINK_DIV.show();
    // Select the text so it is easy to copy.
    var range = document.createRange();
    range.selectNodeContents(LINK_DIV[0]);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    // Try to copy to the clipboard.
    document.execCommand('copy',false,null);
}

Note.prototype.DeleteCallback = function() {
    if (this.Type == "UserNote") {
        // User notes have a parent, but are also roots.
        return;
    }
    var parent = this.Parent;
    if (parent == null) {
        return;
    }

    if ( ! window.confirm("Are you sure you want to delete this view?")) {
        return;
    }

    this.ClearHyperlink();

    if (NOTES_WIDGET.Iterator.GetNote() == this) {
        // Move the current note off this note.
        // There is always a previous.
        NAVIGATION_WIDGET.PreviousNote();
    }

    // Get rid of the note.
    var index = parent.Children.indexOf(this);
    parent.Children.splice(index, 1);
    this.Parent = null;

    // Redraw the GUI.
    parent.UpdateChildrenGUI();
    NOTES_WIDGET.MarkAsModified();
}

Note.prototype.SetUserNote = function(userNote) {
    var parentNote = this;
    parentNote.UserNote = userNote;
    userNote.Parent = parentNote;
    userNote.Type = "UserNote";
}

Note.prototype.UserCanEdit = function() {
    return EDIT;
}

Note.prototype.RecordView = function(display) {
    // TODO: Get rid of VIEWER globals.
    if (display.GetNumberOfViewers() == 0) { return; }

    if (this.Type == "Stack") {
        // All we want to do is record the default
        // camera of the first section (if we at
        // the start of the stack).
        if (this.StartIndex == 0) {
            this.ViewerRecords[0].CopyViewer(display.GetViewer(0));
        }
        return;
    }
    this.ViewerRecords = [];
    for (var i = 0; i < display.GetNumberOfViewers(); ++i) {
        var viewerRecord = new ViewerRecord();
        viewerRecord.CopyViewer(display.GetViewer(i));
        this.ViewerRecords.push(viewerRecord);
    }
}

Note.prototype.AddChild = function(childNote, first) {
  // Needed to get the order after a sort.
  childNote.Div.data("index", this.Children.length);

  if (first) {
    this.Children.splice(0, 0, childNote);
  } else {
    this.Children.push(childNote);
  }

  this.UpdateChildrenGUI();
}

Note.prototype.UpdateChildrenGUI = function() {
    // Callback trick
    var self = this;
    
    // Clear
    this.ChildrenDiv.empty();

    // Stacks
    if (this.Type == "Stack") {
        // I want viewer records to look like children for stacks.
        this.StackDivs = [];
        for (var i = 0; i < this.ViewerRecords.length; ++i) {
            var sectionDiv = $('<div>')
                .addClass('note')
                .appendTo(this.ChildrenDiv);
            if (this.HideAnnotations) {
                sectionDiv.text(i.toString())
            } else {
                sectionDiv.text(this.ViewerRecords[i].Image.label)
            }
            this.StackDivs.push(sectionDiv);
            if (i == this.StartIndex) {
                sectionDiv.css({'background-color':'#BBB'});
            }
        }
        return;
    }

    // Notes
    if (this.Children.length == 0) {
        return;
    }

    for (var i = 0; i < this.Children.length; ++i) {
        this.Children[i].DisplayGUI(this.ChildrenDiv);
        // Indexes used for sorting.
        this.Children[i].Div.data("index", i);
        if (this.Children.length > 1) {
            this.Children[i].SortHandle.addClass('sa-sort-handle');
        } else {
            this.Children[i].SortHandle.removeClass('sa-sort-handle');
        }
    }
}

Note.prototype.NewIterator = function() {
  return new NoteIterator(this);
}

Note.prototype.Contains = function(decendent) {
  for (var i = 0; i < this.Children.length; ++i) {
    var child = this.Children[i];
    if (child == decendent) {
      return true;
    }
    if (child.Contains(decendent)) {
      return true;
    }
  }
  return false;
}

// Create a new note,  add it to the parent notes children at index "childIdx".
// The new note is not automatically selected.
Note.prototype.NewChild = function(childIdx, title) {
    // Create a new note.
    var childNote = new Note();
    childNote.Title = title;
    var d = new Date();
    childNote.Date = d.getTime(); // Temporary. Set for real by server.

    // Now insert the child after the current note.
    this.Children.splice(childIdx,0,childNote);
    childNote.SetParent(parentNote);

    return childNote;
}

Note.prototype.LoadIds = function(data) {
    if ( ! this.Id) {
        this.Id = data._id;
    }
    for (var i = 0; i < this.Children.length && i < data.Children.length; ++i) {
        this.Children[i].LoadIds(data.Children[i]);
    }
    
}


// Save the note in the database and set the note's id if it is new.
// callback function can be set to execute an action with the new id.
Note.prototype.Save = function(callback) {
    console.log("Save note " + this.Title);

    var self = this;
    // Save this users notes in the user specific collection.
    var noteObj = JSON.stringify(this.Serialize(true));
    var d = new Date();
    $('body').css({'cursor':'progress'});
    $.ajax({
        type: "post",
        url: "/webgl-viewer/saveviewnotes",
        data: {"note" : noteObj,
               "date" : d.getTime()},
        success: function(data,status) {
            $('body').css({'cursor':'default'});
            // get the children ids too.
            // Assumes the order of children did not change.
            self.LoadIds(data);
            if (self.UserNote && self.UserNote.Text != "") {
                // This might be the first time the parent is saved.
                // We cannot save user notes until the parent has a real id.
                self.UserNote.Parent = self;
                self.UserNote.Save();
            }
            if (callback) {
                (callback)(self);
            }
            this.TempId = "";
        },
        error: function() {
            $('body').css({'cursor':'default'});
            saDebug("AJAX - error() : saveviewnotes" );
        },
    });
}

Note.prototype.RecordAnnotations = function(display) {
    for (var i = 0; i < display.GetNumberOfViewers(); ++i) {
        if (this.ViewerRecords.length > this.StartIndex+i) {
            this.ViewerRecords[this.StartIndex+i].CopyAnnotations(
                display.GetViewer(i));
        }
    }
}

// No clearing.  Just draw this notes GUI in a div.
Note.prototype.DisplayGUI = function(div) {
    var self = this;
    this.Div.appendTo(div);

    this.TitleEntry
        .click(function() {
            NOTES_WIDGET.SelectNote(self);
            self.ButtonsDiv.show();
        })
        .bind('input', function () {
            self.Modified = true;
        })
        .focusin(function() { self.TitleFocusInCallback(); })
        .focusout(function() { self.TitleFocusOutCallback(); })
        .mouseleave(function() {
            if (self.Modified) {
                self.Modified = false;
                self.Title = self.TitleEntry.text();
                NOTES_WIDGET.MarkAsModified();
            }
        });

    this.TitleDiv
        .hover(
            function() {
                self.TitleEntry.css({'color':'#33D'});
                if (NOTES_WIDGET.SelectedNote == self) {
                    self.ButtonsDiv.show();
                }
            },
            function() {
                self.TitleEntry.css({'color':'#3AF'});
                self.ButtonsDiv.hide();
            });

    if (this.HideAnnotations && this.HiddenTitle) {
        this.TitleEntry.text(this.HiddenTitle);
    } else {
        this.TitleEntry.text(this.Title);
    }

    // Changing a div "parent/appendTo" removes all event bindings like click.
    // I would like to find a better solution to redraw.
    if (EDIT) {
        // Removing and adding removes the callbacks.
        this.AddButton
            .click(function () {
                NOTES_WIDGET.NewCallback();
            });
        this.LinkButton
            .click(function () {
                self.LinkCallback();
            });
        this.RemoveButton
            .click(function () {
                self.DeleteCallback();
        });
    }

    this.UpdateChildrenGUI();
}


Note.prototype.Serialize = function(includeChildren) {
    var obj = {};
    obj.SessionId = localStorage.sessionId;
    obj.Type = this.Type;
    obj.Mode = this.Mode;
    obj.User = this.User;
    obj.Date = this.Date;

    if (this.NotesPanelOpen) {
        obj.NotesPanelOpen = true;
    }

    if (this.Id) {
        obj._id = this.Id;
        delete this._id;
    }
    // I would like to put the session as parent, but this would be an inclomplete reference.
    // A space is not a valid id. Niether is 'false'. Lets leave it blank. 
    if (this.Parent) {
        obj.ParentId = this.Parent.Id;
        delete this.ParentId
    }
    obj.Title = this.Title;
    obj.HiddenTitle = this.HiddenTitle;

    obj.Text = this.Text;
    // The server handles copying views and the code is a pain.
    // I would rather have the client copy notes since is can now
    // save them one by one and get ids for new notes.
    // However,  until I make this change, I need a simple way of copying
    // a note and not messing up the references in the text.
    // Code the links in the html as indexes.
    //for (var i = 0; i < this.Children.length; ++i) {
    //    var Child
    //}

    // We should probably serialize the ViewerRecords too.
    obj.ViewerRecords = [];

    // The database wants an image id, not an embedded iamge object.
    //  The server should really take care of this since if
    for (var i = 0; i < this.ViewerRecords.length; ++i) {
        if(!this.ViewerRecords[i].Image) continue;
        var record = this.ViewerRecords[i].Serialize();
        obj.ViewerRecords.push(record);
    }

    // upper left pixel
    obj.CoordinateSystem = "Pixel";

    if (includeChildren) {
        obj.Children = [];
        for (var i = 0; i < this.Children.length; ++i) {
            obj.Children.push(this.Children[i].Serialize(includeChildren));
        }
    }

    return obj;
}

// This method of loading is causing a pain.
// Children ...
Note.prototype.Load = function(obj){
    var self = this;

    for (ivar in obj) {
        this[ivar] = obj[ivar];
    }
    // I am not sure blindly copying all of the variables is a good idea.
    if (this._id) {
        this.Id = this._id;
        delete this._id;
        // Some TempIds made their way into the database.
        this.TempId = "";
    }

    if (this.ParentId) {
        this.Parent = GetNoteFromId(this.ParentId);
        delete this.ParentId
    }

    if (this.HideAnnotations && this.HiddenTitle) {
        this.TitleEntry.text(this.HiddenTitle);
    } else {
        this.TitleEntry.text(this.Title);
    }

    for (var i = 0; i < this.Children.length; ++i) {
        var childObj = this.Children[i];
        var childNote = new Note();
        childNote.SetParent(this);
        childNote.Load(childObj);
        this.Children[i] = childNote;
        childNote.Div.data("index", i);
    }

    // I believe the server embeds the correct user note.
    if (this.UserNote) {
        // Make the user not into a real object.
        var obj = this.UserNote;
        this.UserNote = new Note();
        this.UserNote.Load(obj);
    }

    for (var i = 0; i < this.ViewerRecords.length; ++i) {
        if (this.ViewerRecords[i]) {
            obj = this.ViewerRecords[i];
            // It would be nice to have a constructor that took an object.
            this.ViewerRecords[i] = new ViewerRecord();
            this.ViewerRecords[i].Load(obj);
        }
    }
}


Note.prototype.LoadViewId = function(viewId, callback) {
  var self = this;
  $.ajax({
    type: "get",
    url: "/webgl-viewer/getview",
    data: {"sessid": localStorage.sessionId,
           "viewid": viewId},
    success: function(data,status) {
        self.Load(data);
        if (callback) {
            (callback)();
        }
    },
    error: function() { saDebug( "AJAX - error() : getview" ); },
    });
}

Note.prototype.Collapse = function() {
    this.ChildrenVisibility = false;
    if (this.Contains(NOTES_WIDGET.SelectedNote)) {
        // Selected note should not be in collapsed branch.
        // Make the visible ancestor active.
        NOTES_WIDGET.SelectNoteg(this);
    }
    this.UpdateChildrenGUI();
    NAVIGATION_WIDGET.Update();
}

Note.prototype.Expand = function() {
    this.ChildrenVisibility = true;
    this.UpdateChildrenGUI();
    NAVIGATION_WIDGET.Update();
}

// Extra stuff for stack.
Note.prototype.DisplayStack = function(display) {
    this.DisplayView(display);
    // For editing correlations
    if (EDIT && this.StartIndex+1 < this.ViewerRecords.length) {
        var trans = this.ViewerRecords[this.StartIndex + 1].Transform;
        if (trans) {
            display.GetViewer(0).StackCorrelations = trans.Correlations;
            display.GetViewer(1).StackCorrelations = trans.Correlations;
        }
    }
    // Indicate which section is being displayed in viewer 1
    for (var i = 0; i < this.StackDivs.length; ++i) {
        if (i == this.StartIndex) {
            this.StackDivs[i].css({'background-color':'#BBB'});
        } else {
            this.StackDivs[i].css({'background-color':'#FFF'});
        }
    }
}

// Set the state of the WebGL viewer from this notes ViewerRecords.
Note.prototype.DisplayView = function(display) {
    // To determine which notes camera to save.
    // For when the user creates a camera link.
    NOTES_WIDGET.DisplayedNote = this;

    if (display.GetNumberOfViewers() == 0) { return; }

    // Remove Annotations from the previous note.
    for (var i = 0; i < display.GetNumberOfViewers(); ++i) {
        display.GetViewer(i).Reset();
    }

    // Set the state of the notes widget.
    // Should we ever turn it off?
    if (this.NotesPanelOpen && ! NOTES_WIDGET.Visibility) {
        NOTES_WIDGET.ToggleNotesWindow();
    }

    // We could have more than two in the future.
    display.SetNumberOfViewers(this.ViewerRecords.length);
    var idx = this.StartIndex;
    for (var i = 0; i < display.GetNumberOfViewers(); ++i) {
        var viewer = display.GetViewer(i);

        if (i + idx < this.ViewerRecords.length) {
            this.ViewerRecords[idx + i].Apply(viewer);
            // This is for synchroninzing changes in the viewer back to the note.
            viewer.RecordIndex = i;
        }

        //viewer.Reset(); // I do not think I should do this here.
    }
}



// Creates default transforms for Viewer Records 1-n
// (if they do not exist already).  Uses cameras focal point.
Note.prototype.InitializeStackTransforms = function () {
    for (var i = 1; i < this.ViewerRecords.length; ++i) {
        if ( ! this.ViewerRecords[i].Transform) {
            var cam0 = this.ViewerRecords[i-1].Camera;
            var cam1 = this.ViewerRecords[i].Camera;
            var dRoll = cam1.Roll - cam0.Roll;
            if (dRoll < 0.0) { dRoll += 2*Math.PI; }
            var trans = new PairTransformation();
            trans.AddCorrelation(cam0.FocalPoint, cam1.FocalPoint, dRoll, 
                                 0.5*(cam0.Height+cam1.Height));
            this.ViewerRecords[i].Transform = trans;
        }
    }
}

NotesWidget.prototype.GetCurrentNote = function() {
    return this.Iterator.GetNote();
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
    parentNote = this.Iterator.GetNote();
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
    // If we choose the child, then we need to update the iterator,
    // which will also update the gui and viewers.
    NAVIGATION_WIDGET.NextNote();
}

NotesWidget.prototype.SaveBrownNote = function() {
    // Create a new note.
    var note = new Note();
    note.RecordView(this.Display);

    // This is not used and will probably be taken out of the scheme,
    note.SetParent(this.Iterator.GetNote());

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
  var note = this.Iterator.GetNote();
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
                var parentNote = NOTES_WIDGET.RootNote;
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
                NOTES_WIDGET.SetRootNote(note);
                NOTES_WIDGET.DisplayRootNote();
            }
        );
    }
    // Since loading the view is asynchronous,
    // the this.RootNote is not complete at this point.
}


// Add a user note to the currently selected notes children.
NotesWidget.prototype.NewCallback = function() {
    var note = this.Iterator.GetNote();
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
    // This is new, Parent was always a note before this.
    this.UserNote.Parent = imageId; // Should we save the note looking at when created?
    this.UserNote.Type = "UserNote";

    if (data.Notes.length > 0) {
        if (data.Notes.length > 1) {
            saDebug("Warning: Only showing the first user note.");
        }
        var noteData = data.Notes[0];
        this.UserNote.Load(noteData);
    }
    // Must display the text.
    this.UserTextEditor.LoadNote(this.UserNote);
}

