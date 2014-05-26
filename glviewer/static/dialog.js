/*
NOTICE - This file uses JavaScript and jQuery to replace HTML elements used
for the dialog in view.html and such. As of now, it requires that the body tags
in the html file using it be designated with id='body', so that appending works.
*/


// Constructor
function Dialog () {

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
  this.Dialog.appendChild(this.TextDiv);
  $('#text-properties-dialog').attr('title','Text Annotation Editor');

  this.TextForm = document.createElement('form');
  this.TextDiv.appendChild(this.TextForm);

  this.TextInput = document.createElement('textarea');
  this.TextInput.id = 'textwidgetcontent';
  this.TextForm.appendChild(this.TextInput);
  $('#textwidgetcontent').attr('style','width:100%;height:100%;');

  this.TextBreak1 = document.createElement('br');
  this.TextForm.appendChild(this.TextBreak1);

  this.Text1 = document.createTextNode('Color:');
  this.TextForm.appendChild(this.Text1);
  this.TextColor = document.createElement('input');
  this.TextColor.id = 'textcolor';
  this.TextColor.type = 'color';
  this.TextForm.appendChild(this.TextColor);
  $('#textcolor').attr('value','#0000ff');

  this.TextBreak2 = document.createElement('br');
  this.TextForm.appendChild(this.TextBreak2);

  this.TextMarker = document.createElement('input');
  this.TextMarker.id = 'TextMarker';
  this.TextMarker.type = 'checkbox';
  this.TextForm.appendChild(this.TextMarker);
  $('#TextMarker').attr('checked',true);
  this.Text2 = document.createTextNode('Marker');
  this.TextMarker.appendChild(this.Text2);

  //The circle annotation editor
  this.CircleDiv = document.createElement('div');
  this.CircleDiv.id = 'circle-properties-dialog';
  this.Dialog.appendChild(this.CircleDiv);
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
  $('#circleColor').attr('value','#30ff00');

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
  this.Dialog.appendChild(this.PolylineDiv);
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
  this.Dialog.appendChild(this.ArrowDiv);
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
}

Dialog.prototype.Show = function(modal){
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




