// Histogram section alignment. 

// x > 0, y > 0
// No bounds checking
function GetGradient(data, x, y) {
    var idx = (x + y*data.width) * 4;
    var v0 = (data.data[idx] + data.data[idx+1] + data.data[idx+2]);
    if (v0 > 700) { return [0,0]; } // try to not get slide boundary
    var vx = (data.data[idx-4] + data.data[idx-3] + data.data[idx-2]);
    if (vx > 700) { return [0,0]; } // try to not get slide boundary
    var dx = v0 - vx;
    idx -= 4*data.width;
    var vy = (data.data[idx] + data.data[idx+1] + data.data[idx+2]);
    if (vy > 700) { return [0,0]; } // try to not get slide boundary
    var dy = v0 - vy;

    return [dx,dy];
}


function ComputeIntensityHistogram(data)
{
    var hist = new Array(256);
    for (var i = 0; i < 256; ++i) {
        hist[i] = 0;
    }
    // Loop through pixels.
    var pixels = data.data;
    var length = data.width * data.height * 4;
    for (var i = 0; i < length; ) {
        // Compute intensity
        var intensity = Math.floor((data.data[i++] + data.data[i++] + data.data[i++]) / 3);
        // Skip alpha
        ++i;
        ++hist[intensity];
    }
    return hist;
}

// Lets try gradient.
// This really did not work.  It might work with a low pass filter first.
// I think aliasing dominated the gradient histogram.
// FFT solution would probably work best.
function ComputeOrientationHistogram(data)
{
    var hist = new Array(256);
    for (var i = 0; i < 256; ++i) {
        hist[i] = 0;
    }
    // Loop through pixels.
    var pixels = data.data;
    for (y = 1; y < data.height; ++y) {
        for (x = 1; x < data.width; ++x) {
            var g = GetGradient(data, x, y);
            var mag = Math.sqrt(g[0]*g[0] + g[1]*g[1]);
            var theta = Math.atan2(g[1], g[0]);
            if (theta != NaN && mag > 0) {
                var idx = Math.floor(128 * (theta / Math.PI + 1));
                if (idx < 0) { idx = 0;}
                if (idx > 255) { idx = 255;}
                hist[idx] += mag;
            }
        }
    }

    return hist;
}


var HISTOGRAM_CONTEXT = undefined;
function DrawHistogram(hist, color, min, max) {
    var height = 200;
    var width = 400;

    if ( ! min) { min = 0; }
    if ( ! max) { max = hist.length;}


    // Find the max value.
    var maxValue = 0;
    for (var i = min; i < max; ++i) {
        if (hist[i] > maxValue) { maxValue = hist[i];}
    }

    
    if ( ! HISTOGRAM_CONTEXT) {
        var div = $('<div>')
            .appendTo('body')
            .attr('id', 'divHist')
            .css({
                'position': 'fixed',
                'width': width.toString(),
                'height': height.toString(),
                'top': '50%',
                'left': '50%',
                'margin-left': '-200px',
                'margin-top': '-100px',
                'background-color': '#ffffff',
                'border': '2px solid #336699',
                'padding': '0px',
                'z-index': '102'});
        
        var canvas = $('<canvas>')
            .appendTo(div)
            .attr('id', 'hist')
            .css({'width' : '100%',
                  'height': '100%'});
        canvas[0].width = width;
        canvas[0].height = height;
        
        HISTOGRAM_CONTEXT = canvas[0].getContext("2d");
    }
    
    var ctx = HISTOGRAM_CONTEXT;

    ctx.beginPath();
    ctx.strokeStyle = color;
    var x = min;
    var y = Math.floor((height)*(1-(hist[0]/maxValue)));
    ctx.moveTo(0, y);
    for (var i = min; i < max; ++i) {
        x = Math.floor((i-min)*width/(max-min));
        y = Math.floor((height)*(1-(hist[i]/maxValue)) );
        ctx.lineTo(x,y);
    }
    ctx.stroke();
    
}



// The seed is in screen coordinates.
// TODO: Reduce the resolution. Keep the data for altering the threshold.
function AlignViewers(viewer1, viewer2) {
    var ctx1 = viewer1.MainView.Context2d;
    var viewport1 = viewer1.GetViewport();
    var data1 = ctx1.getImageData(0,0,viewport1[2],viewport1[3]);

    var ctx2 = viewer1.MainView.Context2d;
    var viewport1 = viewer1.GetViewport();
    var data1 = ctx1.getImageData(0,0,viewport1[2],viewport1[3]);

    var histogram1 = ComputeIntensityHistogram(data1);

}

// Find peak of correlation. Wrapped for orientation.
function CorrelateWrappedHistograms(hist1, hist2){
    var length = hist1.length;
    var best = 0;
    var bestOffset = 0;
    for (i = 0; i < length; ++i) {
        var sum = 0;
        for (j1 = 0; j1 < length; ++j1) {
            var j2 = i + j1;
            if (j2 >= length) { j2 -= length; }
            sum += hist1[j1] * hist2[j2];
        }
        if (sum > best) {
            best = sum;
            bestOffset = i;
        }
    }

    return bestOffset;
}

function HistogramDerivative(hist) {
    var derivative = new Array(hist.length-1);
    for (var i = 1; i < hist.length; ++i) {
        derivative[i-1] = hist[i] - hist[i-1];
    }
    return derivative;
}

function HistogramIntegral(hist) {
    var integral = new Array(hist.length);
    var sum = 0;
    for (var i = 0; i < hist.length; ++i) {
        sum += hist[i];
        integral[i] = sum;
    }
    return integral;
}


// Start at 50% integration and work backward.
// find max of integral / hist,
function PickThreshold(hist) {
    var integral = HistogramIntegral(hist);
    var idx = integral.length-1;
    var half = integral[idx]/2;

    // Find the max value.
    var maxValue = 0;
    for (idx = 0; integral[idx]< half; ++idx) {
        if (hist[idx] > maxValue) { maxValue = hist[idx];}
    }
    var offset = maxValue * 0.01;
    var best = 0;
    var bestIdx = i;
    while (--idx > 0) {
        var goodness = integral[idx] / (hist[idx]+offset);
        if (goodness > best) {
            best = goodness;
            bestIdx = idx;
        }
    }
    return bestIdx;
}            





// For debugging.
// Create a threshold mask image annotation to see the results.
// Compute the first moment at the same time.
function ThresholdData(data, threshold) {
    var i = 0;
    var xSum = 0;
    var ySum = 0;
    var count = 0;
    for (var y = 0; y < data.height; ++y) {
        for (var x = 0; x < data.width; ++x) {
            var intensity = Math.floor((data.data[i] + data.data[i+1] + data.data[i+2]) / 3);
            if (intensity > threshold) { // Make it semi opaque black
                data.data[i] = data.data[i+1] = data.data[i+2] = 0;
                //data.data[i+3] = 0.3;
            } else {
                ++count;
                xSum += x;
                ySum += y;
            }
            i += 4;
        }
    }
    data.mid_x = xSum / count;
    data.mid_y = ySum / count;
}

// I was going to create an image annotation, but it is not easy
// to convert the data to an image.  I could use a separate canves to do this,
// but it is easier (for now) to just use putImageData.
//var IMAGE_ANNOTATION = undefined;
function DrawImageData(viewer, data) {
    /*if ( ! IMAGE_ANNOTATION) {
        IMAGE_ANNOTATION = new ImageAnnotation();
        IMAGE_ANNOTATION.Image = new Image();
        IMAGE_ANNOTATION.Image.src = "/webgl-viewer/static/nextNote.png";
        IMAGE_ANNOTATION.Origin = [80000, 40000];
        IMAGE_ANNOTATION.Height = 5000;
*/
    var context = viewer.MainView.Context2d;
    context.putImageData(data, 0, 0);
}




function orientationHistogram(viewer, color) {
    var ctx1 = viewer.MainView.Context2d;
    var viewport1 = viewer.GetViewport();
    var data1 = ctx1.getImageData(0,0,viewport1[2],viewport1[3]);
    //var histogram1 = ComputeIntensityHistogram(data1);
    var histogram1 = ComputeOrientationHistogram(data1);
    DrawHistogram(histogram1, color);
}

function intensityHistogram(viewer, color, min, max) {
    var ctx1 = viewer.MainView.Context2d;
    var viewport1 = viewer.GetViewport();
    var data1 = ctx1.getImageData(0,0,viewport1[2],viewport1[3]);
    var histogram1 = ComputeIntensityHistogram(data1);
    DrawHistogram(histogram1, color, min, max);

    var threshold = PickThreshold(histogram1);
    var ctx = HISTOGRAM_CONTEXT;
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    threshold = Math.floor((threshold-min)*400/(max-min));
    ctx.moveTo(threshold, 0);
    ctx.lineTo(threshold, 200);
    ctx.stroke();

    var d = HistogramIntegral(histogram1);

    DrawHistogram(d, "red", min, max);
}

function testAlignRotation() {
    if (HISTOGRAM_CONTEXT) {
        HISTOGRAM_CONTEXT.clearRect(0,0,400,200);
    }

    var ctx1 = VIEWER1.MainView.Context2d;
    var viewport1 = VIEWER1.GetViewport();
    var data1 = ctx1.getImageData(0,0,viewport1[2],viewport1[3]);
    var histogram1 = ComputeOrientationHistogram(data1);
    DrawHistogram(histogram1, "green");

    var ctx2 = VIEWER2.MainView.Context2d;
    var viewport2 = VIEWER2.GetViewport();
    var data2 = ctx2.getImageData(0,0,viewport2[2],viewport2[3]);
    var histogram2 = ComputeOrientationHistogram(data2);
    DrawHistogram(histogram2, "red");

    var dTheta = CorrelateWrappedHistograms(histogram1, histogram2);

    console.log("D theta = " + 360 * dTheta / 256);
}

function testAlignTranslation() {
    var ctx1 = VIEWER1.MainView.Context2d;
    var viewport1 = VIEWER1.GetViewport();
    var data1 = ctx1.getImageData(0,0,viewport1[2],viewport1[3]);
    var histogram1 = ComputeIntensityHistogram(data1);
    var threshold1 = PickThreshold(histogram1);
    ThresholdData(data1, threshold1);
    //DrawImageData(VIEWER1, data1);

    var ctx2 = VIEWER2.MainView.Context2d;
    var viewport2 = VIEWER2.GetViewport();
    var data2 = ctx2.getImageData(0,0,viewport2[2],viewport2[3]);
    var histogram2 = ComputeIntensityHistogram(data2);
    var threshold2 = PickThreshold(histogram2);
    ThresholdData(data2, threshold2);
    //DrawImageData(VIEWER2, data2);

    var dx = data2.mid_x - data1.mid_x;
    var dy = data2.mid_y - data1.mid_y;

    // Convert from pixels to slide coordinates
    var cam = VIEWER1.GetCamera();
    var viewport = VIEWER1.GetViewport();
    dx = dx * cam.Height / viewport[3];
    dy = dy * cam.Height / viewport[3];

    VIEWER1.AnimateTranslate(-dx/2, -dy/2);
    VIEWER2.AnimateTranslate(dx/2, dy/2);

    console.log("Translate = (" + dx + ", " + dy + ")" );
}




    
    