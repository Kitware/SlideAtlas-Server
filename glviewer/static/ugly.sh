rm css/sa.css
rm sa.min.js
rm sam.min.js

echo "// auto generated: slide atlas" > css/sa.css

~/bin/uglifyjs -nc ../../slideatlas/static/thirdparty/glmatrix/0.9.5-r1/glMatrix-min.js >> sam.min.js
~/bin/uglifyjs -nc annotationLayer.js >> sam.min.js 
~/bin/uglifyjs -nc shape.js >> sam.min.js 
~/bin/uglifyjs -nc shapeGroup.js >> sam.min.js 
~/bin/uglifyjs -nc stackSectionWidget.js >> sam.min.js 
~/bin/uglifyjs -nc sectionsWidget.js >> sam.min.js 
~/bin/uglifyjs -nc cutoutWidget.js >> sam.min.js 
~/bin/uglifyjs -nc text.js >> sam.min.js 
~/bin/uglifyjs -nc textWidget.js >> sam.min.js 
~/bin/uglifyjs -nc polyline.js >> sam.min.js
~/bin/uglifyjs -nc polylineWidget.js >> sam.min.js
~/bin/uglifyjs -nc pencilWidget.js >> sam.min.js 
~/bin/uglifyjs -nc fillWidget.js >> sam.min.js 
~/bin/uglifyjs -nc lassoWidget.js >> sam.min.js 
~/bin/uglifyjs -nc widgetPopup.js >> sam.min.js 
~/bin/uglifyjs -nc crossHairs.js >> sam.min.js 
~/bin/uglifyjs -nc arrow.js >> sam.min.js 
~/bin/uglifyjs -nc arrowWidget.js >> sam.min.js 
~/bin/uglifyjs -nc circle.js >> sam.min.js 
~/bin/uglifyjs -nc circleWidget.js >> sam.min.js 
~/bin/uglifyjs -nc rectWidget.js >> sam.min.js 
~/bin/uglifyjs -nc gridWidget.js >> sam.min.js 
~/bin/uglifyjs -nc scaleWidget.js >> sam.min.js 
~/bin/uglifyjs -nc cutoutWidget.js >> sam.min.js 
~/bin/uglifyjs -nc imageAnnotation.js >> sam.min.js 
~/bin/uglifyjs -nc dialog.js >> sam.min.js 
~/bin/uglifyjs -nc girderWidget.js >> sam.min.js 
~/bin/uglifyjs -nc view.js >> sam.min.js 



cat css/main.css >> css/sa.css
cat css/saViewer.css >> css/sa.css
cat ../../slideatlas/static/thirdparty/jquery-ui/1.8.22/jquery-ui.css >> css/sa.css
cat ../../slideatlas/static/thirdparty/spectrum/spectrum.css >> css/sa.css
~/bin/uglifyjs -nc ../../slideatlas/static/thirdparty/jquery-ui/1.8.22/jquery-ui.min.js >> sa.min.js
~/bin/uglifyjs -nc ../../slideatlas/static/thirdparty/spectrum/spectrum.js >> sa.min.js
~/bin/uglifyjs -nc ../../slideatlas/static/thirdparty/webgl-utils/webgl-utils.js >> sa.min.js
~/bin/uglifyjs -nc ../../slideatlas/static/thirdparty/blob/g7246d68/Blob.js >> sa.min.js
~/bin/uglifyjs -nc ../../slideatlas/static/thirdparty/canvas-toblob/g911df56/canvas-toBlob.js >> sa.min.js
~/bin/uglifyjs -nc ../../slideatlas/static/thirdparty/filesaver/g4d049e9/FileSaver.js >> sa.min.js
~/bin/uglifyjs -nc ../../slideatlas/static/thirdparty/bson/0.2.9/bson.js >> sa.min.js
~/bin/uglifyjs -nc cookies.js >> sa.min.js 
~/bin/uglifyjs -nc objectId.js >> sa.min.js 
~/bin/uglifyjs -nc init.js >> sa.min.js 
~/bin/uglifyjs -nc viewEditMenu.js >> sa.min.js 
~/bin/uglifyjs -nc viewBrowser.js >> sa.min.js 
~/bin/uglifyjs -nc dualViewWidget.js >> sa.min.js 
~/bin/uglifyjs -nc tabbedDiv.js >> sa.min.js 
~/bin/uglifyjs -nc note.js >> sa.min.js 
~/bin/uglifyjs -nc notesWidget.js >> sa.min.js 
~/bin/uglifyjs -nc tab.js >> sa.min.js 
~/bin/uglifyjs -nc annotationWidget.js >> sa.min.js 
~/bin/uglifyjs -nc recorderWidget.js >> sa.min.js 
~/bin/uglifyjs -nc navigationWidget.js >> sa.min.js 
~/bin/uglifyjs -nc favoritesWidget.js >> sa.min.js 
~/bin/uglifyjs -nc favoritesBar.js >> sa.min.js 
~/bin/uglifyjs -nc mobileAnnotationWidget.js >> sa.min.js 
~/bin/uglifyjs -nc viewer-utils.js >> sa.min.js 
~/bin/uglifyjs -nc presentation.js >> sa.min.js 
~/bin/uglifyjs -nc loader.js >> sa.min.js 
~/bin/uglifyjs -nc camera.js >> sa.min.js 
~/bin/uglifyjs -nc cutout.js >> sa.min.js 
~/bin/uglifyjs -nc seedContour.js >> sa.min.js 
~/bin/uglifyjs -nc align.js >> sa.min.js 
~/bin/uglifyjs -nc tile.js >> sa.min.js 
~/bin/uglifyjs -nc cache.js >> sa.min.js 
~/bin/uglifyjs -nc section.js >> sa.min.js 
~/bin/uglifyjs -nc tileView.js >> sa.min.js 
~/bin/uglifyjs -nc viewer.js >> sa.min.js 
~/bin/uglifyjs -nc pairTransformation.js >> sa.min.js 


