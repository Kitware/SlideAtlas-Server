rm css/sa.css
rm sa.max.js
rm sam.max.js

echo "// slide atlas" > css/sa.css
cat css/main.css >> css/sa.css
cat css/saViewer.css >> css/sa.css
cat ../../slideatlas/static/thirdparty/jquery-ui/1.8.22/jquery-ui.css >> css/sa.css
cat ../../slideatlas/static/thirdparty/spectrum/spectrum.css >> css/sa.css
cat ../../slideatlas/static/thirdparty/jquery-ui/1.8.22/jquery-ui.min.js >> sa.max.js
cat ../../slideatlas/static/thirdparty/spectrum/spectrum.js >> sa.max.js
cat ../../slideatlas/static/thirdparty/glmatrix/0.9.5-r1/glMatrix-min.js >> sa.max.js
cat ../../slideatlas/static/thirdparty/webgl-utils/webgl-utils.js >> sa.max.js
cat ../../slideatlas/static/thirdparty/blob/g7246d68/Blob.js >> sa.max.js
cat ../../slideatlas/static/thirdparty/canvas-toblob/g911df56/canvas-toBlob.js >> sa.max.js
cat ../../slideatlas/static/thirdparty/filesaver/g4d049e9/FileSaver.js >> sa.max.js
cat ../../slideatlas/static/thirdparty/bson/0.2.9/bson.js >> sa.max.js


cat annotationLayer.js >> sam.max.js 
cat shape.js >> sam.max.js 
cat shapeGroup.js >> sam.max.js 
cat stackSectionWidget.js >> sam.max.js 
cat sectionsWidget.js >> sam.max.js 
cat cutoutWidget.js >> sam.max.js 
cat text.js >> sam.max.js 
cat textWidget.js >> sam.max.js 
cat polyline.js >> sam.max.js
cat polylineWidget.js >> sam.max.js
cat pencilWidget.js >> sam.max.js 
cat fillWidget.js >> sam.max.js 
cat lassoWidget.js >> sam.max.js 
cat widgetPopup.js >> sam.max.js 
cat crossHairs.js >> sam.max.js 
cat arrow.js >> sam.max.js 
cat arrowWidget.js >> sam.max.js 
cat circle.js >> sam.max.js 
cat circleWidget.js >> sam.max.js 
cat rectWidget.js >> sam.max.js 
cat gridWidget.js >> sam.max.js 
cat scaleWidget.js >> sam.max.js 
cat cutoutWidget.js >> sam.max.js 
cat imageAnnotation.js >> sam.max.js 
cat dialog.js >> sam.max.js 
cat view.js >> sam.max.js 
cat girderWidget.js >> sam.max.js 


cat cookies.js >> sa.max.js 
cat objectId.js >> sa.max.js 

cat init.js >> sa.max.js 
cat viewEditMenu.js >> sa.max.js 
cat viewBrowser.js >> sa.max.js 
cat dualViewWidget.js >> sa.max.js 
cat tabbedDiv.js >> sa.max.js 
cat note.js >> sa.max.js 
cat notesWidget.js >> sa.max.js 
cat tab.js >> sa.max.js 
cat annotationWidget.js >> sa.max.js 
cat recorderWidget.js >> sa.max.js 
cat navigationWidget.js >> sa.max.js 
cat favoritesWidget.js >> sa.max.js 
cat favoritesBar.js >> sa.max.js 
cat mobileAnnotationWidget.js >> sa.max.js 
cat viewer-utils.js >> sa.max.js 
cat presentation.js >> sa.max.js 
cat loader.js >> sa.max.js 
cat camera.js >> sa.max.js 
cat cutout.js >> sa.max.js 
cat seedContour.js >> sa.max.js 
cat align.js >> sa.max.js 
cat tile.js >> sa.max.js 
cat cache.js >> sa.max.js 
cat section.js >> sa.max.js 
cat viewer.js >> sa.max.js 
cat pairTransformation.js >> sa.max.js 


