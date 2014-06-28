/*
NOTICE - This file uses JavaScript and jQuery to create dialogs of HTML elements for widgets.
It can replace code in templates such as view.html.

This file currently requires the body tags to be given the ID 'body,' various other attempts at appending didn't work.
*/


// Constructor
function Dialog () {
    $(document).ready(function(){
      this.theCanvas = document.createElement('canvas');
      this.theCanvas.id = 'gltest';
      document.getElementById('body').appendChild(this.theCanvas);
      $('#gltest').attr('style','display:none');
      
      this.Dialog = document.createElement('div');
      this.Dialog.id = 'dialog';
      document.getElementById('body').appendChild(this.Dialog);
      $('#dialog').attr('class','ui-widget')
	  .attr('style','visibility:hidden');
      
      //The text annotation editor
      this.TextDiv = document.createElement('div');
      this.TextDiv.id = 'text-properties-dialog';
      document.getElementById('dialog').appendChild(this.TextDiv);
      $('#text-properties-dialog').attr('title','Text Annotation Editor');
      
      this.TextForm = document.createElement('form');
      this.TextDiv.appendChild(this.TextForm);
      
      this.TextInput = document.createElement('textarea');
      this.TextInput.id = 'textwidgetcontent';
      this.TextForm.appendChild(this.TextInput);
      $('#textwidgetcontent').attr('style','width:100%;height:100%;');
      
      this.TextBreak1 = document.createElement('br');
      this.TextForm.appendChild(this.TextBreak1);
      
      this.Text0 = document.createTextNode('Font (px):');
      this.TextForm.appendChild(this.Text0);
      this.TextFont = document.createElement('input');
      this.TextFont.id = 'textfont';
      this.TextFont.type = 'number';
      this.TextForm.appendChild(this.TextFont);
      $('#textfont').attr('value', 12);
      
      this.TextBreak2 = document.createElement('br');
      this.TextForm.appendChild(this.TextBreak2);
      
      this.Text1 = document.createTextNode('Color:');
      this.TextForm.appendChild(this.Text1);
      this.TextColor = document.createElement('input');
      this.TextColor.id = 'textcolor';
      this.TextColor.type = 'color';
      this.TextForm.appendChild(this.TextColor);
      $('#textcolor').attr('value','#0000ff');
      
      this.TextBreak3 = document.createElement('br');
      this.TextForm.appendChild(this.TextBreak3);
      
      this.TextMarker = document.createElement('input');
      this.TextMarker.id = 'TextMarker';
      this.TextMarker.type = 'checkbox';
      this.TextForm.appendChild(this.TextMarker);
      $('#TextMarker').attr('checked',true);
      this.Text2 = document.createTextNode('Marker');
      this.TextForm.appendChild(this.Text2);
      
      this.TextBreak4 = document.createElement('br');
      this.TextForm.appendChild(this.TextBreak4);
      
      this.TextBackground = document.createElement('input');
      this.TextBackground.id = 'TextBackground';
      this.TextBackground.type = 'checkbox';
      this.TextForm.appendChild(this.TextBackground);
      $('#TextBackground').attr('checked', true);
      this.Text3 = document.createTextNode('Background');
      this.TextForm.appendChild(this.Text3);
      
      
      
      //The circle annotation editor
      this.CircleDiv = document.createElement('div');
      this.CircleDiv.id = 'circle-properties-dialog';
      document.getElementById('dialog').appendChild(this.CircleDiv);
      $('#circle-properties-dialog').attr('title','Circle Annotation Editor');
      
      this.CircleForm = document.createElement('form');
      this.CircleDiv.appendChild(this.CircleForm);
      
      this.CircleFieldSet = document.createElement('fieldset');
      this.CircleForm.appendChild(this.CircleFieldSet);
      
      this.Text3 = document.createTextNode('Color:');
      this.CircleFieldSet.appendChild(this.Text3);
      this.CircleColor = document.createElement('input');
      this.CircleColor.id = 'circlecolor';
      this.CircleColor.type = 'color';
      this.CircleFieldSet.appendChild(this.CircleColor);
      $('#circlecolor').attr('value','#30ff00');
      
      this.CircleBreak1 = document.createElement('br');
      this.CircleFieldSet.appendChild(this.CircleBreak1);

      this.Text4 = document.createTextNode('Line Width:');
      this.CircleFieldSet.appendChild(this.Text4);
      this.CircleLineWidth = document.createElement('input');
      this.CircleLineWidth.id = 'circlelinewidth';
      this.CircleFieldSet.appendChild(this.CircleLineWidth);
      
      this.CircleBreak2 = document.createElement('br');
      this.CircleFieldSet.appendChild(this.CircleBreak2);
      
      this.CircleArea = document.createElement('p');
      this.CircleArea.id = 'circlearea';
      this.CircleFieldSet.appendChild(this.CircleArea);
      
      //The polyline annotation editor
      this.PolylineDiv = document.createElement('div');
      this.PolylineDiv.id = 'polyline-properties-dialog';
      document.getElementById('dialog').appendChild(this.PolylineDiv);
      $('#polyline-properties-dialog').attr('title','Polyline Annotation Editor');
      
      this.PolylineForm = document.createElement('form');
      this.PolylineDiv.appendChild(this.PolylineForm);
      
      this.PolylineFieldSet = document.createElement('fieldset');
      this.PolylineForm.appendChild(this.PolylineFieldSet);
      
      this.Text6 = document.createTextNode('Color:');
      this.PolylineFieldSet.appendChild(this.Text6);
      this.PolylineColor = document.createElement('input');
      this.PolylineColor.id = 'polylinecolor';
      this.PolylineColor.type = 'color';
      this.PolylineFieldSet.appendChild(this.PolylineColor);
      $('#polylinecolor').attr('value','#30ff00');
      
      this.PolylineBreak1 = document.createElement('br');
      this.PolylineFieldSet.appendChild(this.PolylineBreak1);
      
      this.Text7 = document.createTextNode('Line Width:');
      this.PolylineFieldSet.appendChild(this.Text7);
      this.PolylineWidth = document.createElement('input');
      this.PolylineWidth.id = 'polylinewidth';
      this.PolylineFieldSet.appendChild(this.PolylineWidth);
      
      //The arrow annotation editor
      this.ArrowDiv = document.createElement('div');
      this.ArrowDiv.id = 'arrow-properties-dialog';
      document.getElementById('dialog').appendChild(this.ArrowDiv);
      $('#arrow-properties-dialog').attr('title','Arrow Annotation Editor');
      
      this.ArrowForm = document.createElement('form');
      this.ArrowDiv.appendChild(this.ArrowForm);
      
      this.ArrowFieldSet = document.createElement('fieldset');
      this.ArrowForm.appendChild(this.ArrowFieldSet);
      
      this.Text8 = document.createTextNode('Color:');
      this.ArrowFieldSet.appendChild(this.Text8);
      this.ArrowColor = document.createElement('input');
      this.ArrowColor.id = 'arrowcolor';
      this.ArrowColor.type = 'color';
      this.ArrowFieldSet.appendChild(this.ArrowColor);
      $('#arrowcolor').attr('value','#30ff00');
      
      this.ArrowBreak1 = document.createElement('br');
      this.ArrowFieldSet.appendChild(this.ArrowBreak1);
      
      this.ArrowFixedSize = document.createElement('input');
      this.ArrowFixedSize.id = 'ArrowFixedSize';
      this.ArrowFixedSize.type = 'checkbox';
      this.ArrowFieldSet.appendChild(this.ArrowFixedSize);
      $('#ArrowFixedSize').attr('checked',true);
      this.Text9 = document.createTextNode('Fixed Size');
      this.ArrowFixedSize.appendChild(this.Text9);
      
      this.ArrowBreak2 = document.createElement('br');
      this.ArrowFieldSet.appendChild(this.ArrowBreak2);
      
      this.ArrowLength = document.createElement('p');
      this.ArrowLength.id = 'ArrowLength';
      this.ArrowFieldSet.appendChild(this.ArrowLength);

      //The pencil annotation editor
      this.PencilDiv = document.createElement('div');
      this.PencilDiv.id = 'pencil-properties-dialog';
      document.getElementById('dialog').appendChild(this.PencilDiv);
      $('#pencil-properties-dialog').attr('title','Pencil Annotation Editor');

      this.PencilForm = document.createElement('form');
      this.PencilDiv.appendChild(this.PencilForm);
      
      this.PencilFieldSet = document.createElement('fieldset');
      this.PencilForm.appendChild(this.PencilFieldSet);

      this.Text10 = document.createTextNode('Color:');
      this.PencilFieldSet.appendChild(this.Text10);
      this.PencilColor = document.createElement('input');
      this.PencilColor.id = 'pencilcolor';
      this.PencilColor.type = 'color';
      this.PencilFieldSet.appendChild(this.PencilColor);
      $('#pencilcolor').attr('value','#30ff00');
      
      this.PencilBreak1 = document.createElement('br');
      this.PencilFieldSet.appendChild(this.PencilBreak1);

      this.Text11 = document.createTextNode('Line Width:');
      this.PencilFieldSet.appendChild(this.Text11);
      this.PencilWidth = document.createElement('input');
      this.PencilWidth.id = 'pencilwidth';
      this.PencilFieldSet.appendChild(this.PencilWidth);

      //The lasso annotation editor	
      this.LassoDiv = document.createElement('div');
      this.LassoDiv.id = 'lasso-properties-dialog';
      document.getElementById('dialog').appendChild(this.LassoDiv);
      $('#lasso-properties-dialog').attr('title','Lasso Annotation Editor');

      this.LassoForm = document.createElement('form');
      this.LassoDiv.appendChild(this.LassoForm);
      
      this.LassoFieldSet = document.createElement('fieldset');
      this.LassoForm.appendChild(this.LassoFieldSet);

      this.LassoBreak2 = document.createElement('br');
      this.LassoFieldSet.appendChild(this.LassoBreak2);
      
      this.LassoArea = document.createElement('p');
      this.LassoArea.id = 'lassoarea';
      this.LassoFieldSet.appendChild(this.LassoArea);


      this.Text12 = document.createTextNode('Color:');
      this.LassoFieldSet.appendChild(this.Text12);
      this.LassoColor = document.createElement('input');
      this.LassoColor.id = 'lassocolor';
      this.LassoColor.type = 'color';
      this.LassoFieldSet.appendChild(this.LassoColor);
      $('#lassocolor').attr('value','#30ff00');
      
      this.LassoBreak1 = document.createElement('br');
      this.LassoFieldSet.appendChild(this.LassoBreak1);

      this.Text13 = document.createTextNode('Line Width:');
      this.LassoFieldSet.appendChild(this.Text13);
      this.LassoWidth = document.createElement('input');
      this.LassoWidth.id = 'lassowidth';
      this.LassoFieldSet.appendChild(this.LassoWidth);

      //Dialog windows created with jQuery
      $("#text-properties-dialog").dialog({
          autoOpen:false,
          height:250,
          width:350,
          position: ['center', 'top'],
          modal:true,
          buttons:{
              Delete: function() {
                  TextPropertyDialogDelete();
                  $(this).dialog("close");
              },
              Apply: function() {
                  TextPropertyDialogApply();
              }
          },
          close: function(event,ui) {
              if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
                  TextPropertyDialogCancel();
                  $(this).dialog("close");
              }
              $("#textwidgetcontent").val( "" ).removeClass( "ui-state-error" );
          }
      });

      $("#arrow-properties-dialog").dialog({
          autoOpen:false,
          height:280,
          width:350,
          modal:true,
          buttons:{
              Delete: function() {
                  ArrowPropertyDialogDelete();
                  $(this).dialog("close");
              },
              Apply: function() {
                  ArrowPropertyDialogApply();
                  $(this).dialog("close");
              }
          },
          close: function(event,ui) {
              if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
                  ArrowPropertyDialogCancel();
                  $(this).dialog("close");
              }
          }
      });

      $("#circle-properties-dialog").dialog({
	  autoOpen:false,
	  height:300,
	  width:350,
	  modal:true,
	  buttons:{
              Delete: function() {
		  CirclePropertyDialogDelete();
		  $(this).dialog("close");
              },
              Apply: function() {
		  CirclePropertyDialogApply();
		  $(this).dialog("close");
              }
	  },
	  close: function(event,ui) {
              if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
		  CirclePropertyDialogCancel();
		  $(this).dialog("close");
              }
	  }
      });

      $("#polyline-properties-dialog").dialog({
	  autoOpen:false,
	  height:250,
	  width:350,
	  modal:true,
	  buttons:{
              Delete: function() {
		  PolylinePropertyDialogDelete();
		  $(this).dialog("close");
              },
              Apply: function() {
		  PolylinePropertyDialogApply();
		  $(this).dialog("close");
              }
	  },
	  close: function(event,ui) {
              if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
		  PolylinePropertyDialogCancel();
		  $(this).dialog("close");
              }
	  }
      });

      $("#pencil-properties-dialog").dialog({
          autoOpen:false,
          height:250,
          width:350,
          position: ['center', 'top'],
          modal:true,
          buttons:{
              Delete: function() {
                  PencilPropertyDialogDelete();
                  $(this).dialog("close");
              },
              Apply: function() {
                  PencilPropertyDialogApply();
              }
          },
          close: function(event,ui) {
              if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
                  PencilPropertyDialogCancel();
                  $(this).dialog("close");
              }
          }
      });

      $("#lasso-properties-dialog").dialog({
          autoOpen:false,
          height:250,
          width:350,
          position: ['center', 'top'],
          modal:true,
          buttons:{
              Delete: function() {
                  LassoPropertyDialogDelete();
                  $(this).dialog("close");
              },
              Apply: function() {
                  LassoPropertyDialogApply();
              }
          },
          close: function(event,ui) {
              if ( event.originalEvent && $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length ) {
                  LassoPropertyDialogCancel();
                  $(this).dialog("close");
              }
          }
      });
});
}		 
/*Dialog.prototype.Show = function(modal){
    $('#gltest').show();
    $('#dialog').fadeIn(300);
    
    if (modal)
    {
        $('#gltest').unbind("click");
    }
    else
    {
        $('#gltest').click(function (e){
	    Hide();
	});
    }
}

Dialog.prototype.Hide = function(){
    $('#canvas').hide();
    $('#dialog').fadeOut(300);
}

--I started working on these two methods at one point, but I think they would be extraneous?
*/
