// Histogram section alignment. 





//=================================================
// Extend the image data returned by the canvas.

function ImageData() {
    this.IncX = 1;
    this.IncY = 1;
}

ImageData.prototype.GetIntensity = function (x,y) {
    if (! this.data) { return 0;}
    var idx = x*this.IncX + y*this.IncY;
    return (this.data[idx] + this.data[idx+1] + this.data[idx+2]) / 3;
}

ImageData.prototype.InBounds = function (x,y) {
    if (! this.data) { return false;}
    return (x >=0 && x < this.width && y >=0 && y < this.height);
}


// Add a couple methods to the object.
function GetImageData(ctx, x,y, width, height) {
    var data = ctx.getImageData(0,0,width,height);
    data.__proto__ = new ImageData();
    data.IncX = 4;
    data.IncY = data.IncX * data.width;
    return data;
}


// Take a list of image points and make a viewer annotation out of them.
function MakeContourPolyLine(points, viewer) {
    // Make an annotation out of the points.
    // Transform the loop points to slide coordinate system.
    var slidePoints = [];
    var viewport = viewer.GetViewport();
    for (var i = 0; i < points.length; ++i) {
        var viewPt = points[i];
        slidePoints.push(viewer.ConvertPointViewerToWorld(viewPt[0] + viewport[0],
                                                          viewPt[1] + viewport[1]));
    }

    // Create a polylineWidget from the loop.
    var plWidget = new PolylineWidget(viewer,false);
    plWidget.Shape.OutlineColor[0] = Math.random();
    plWidget.Shape.OutlineColor[1] = Math.random();
    plWidget.Shape.OutlineColor[2] = Math.random();
    plWidget.Shape.Points = slidePoints;
    plWidget.Shape.Closed = false;
    plWidget.LineWidth = 0;    
    plWidget.Shape.UpdateBuffers();
    eventuallyRender();

    return plWidget;
}


// Mark edges visited so we do not create the same conotur twice.
// I cannot mark the pixel cell because two contours can go through the same cell.
// Note:  I have to keep track of both the edge and the direction the contour leaves
// the edge.  The backward direction was to being contoured because the starting
// edge was already marked.  The order of the points here matters.  Each point
// marks 4 edges.
ImageData.prototype.MarkEdge = function (x0,y0, x1,y1) {
    if ( ! this.EdgeMarks) {
        var numTemplates = (this.width)*(this.height);
        this.EdgeMarks = new Array(numTemplates);
        for (var i = 0; i < numTemplates; ++i) {
            this.EdgeMarks[i] = 0;
        }
    }

    var edge = 0;
    if (x0 != x1) {
        edge = (x0 < x1) ? 1 : 4;
    } else if (y0 != y1) {
        edge = (y0 < y1) ? 2 : 8;
    }

    var idx = x0  + y0*(this.width);
    var mask = this.EdgeMarks[idx];
    if (mask & edge) {
        return true;
    }
    this.EdgeMarks[idx] = mask | edge;
    return false;
}


// Helper method.
// Trace contour one direction until it ends or circles back.
// Return a list of points.
function TraceContourRight(data, x0,y0, x1,y1, threshold) {
    var s0 = data.GetIntensity(x0, y0) - threshold;
    var s1 = data.GetIntensity(x1, y1) - threshold;
    if ((s0 > 0 && s1 > 0) || (s0 <= 0 && s1 <= 0)) {
        // No contour crosses this edge.
        return [];
    }

    // 0,1,2,3 is the current square.
    // s0,s1,s2,s3 contains the scalar values being contoured.
    var x2, y2, s2, x3, y3, s3;
    // Coordinate system basis of the current square. r=right,u=up;
    var xr, yr;
    var xu, yu;
    xr = x1-x0;
    yr = y1-y0;
    xu = -yr;
    yu = xr;

    var insideOut = ! (s0 > 0);

    // Now start tracing the contour.
    // Initialize the line with the countour end on edge 0-1. 
    var k = s0/(s0-s1);
    var polyLine = [[x0+(xr*k), y0+(yr*k)]];
    xStart = x0;  yStart = y0;
    xrStart = xr; yrStart = yr;
    while (true) {
        x2 = x0+xu;
        y2 = y0+yu;
        // Check for boundary termination.
        if (!data.InBounds(x2,y2)) { return polyLine;}
        x3 = x1+xu;
        y3 = y1+yu;
        // No need to check if the second point is in bounds.
        //if (!data.InBounds(x3,y3)) { return polyLine;}
        // Mark the edge/direction as completed.
        if (data.MarkEdge(x0,y0, x1,y1)) {
            return polyLine;
        }
        // Get the other corner values.
        s2 = data.GetIntensity(x2, y2) - threshold;
        if (insideOut != (s2 > 0)) { // xor
            s3 = data.GetIntensity(x3, y3) - threshold;
            if (insideOut != (s3 > 0)) { // xor 
                if (data.MarkEdge(x1,y1, x3,y3)) {
                    // We need to check both edge directions
                    // Note the reverse order of the points
                    return polyLine;
                }
                // The new propoagating edge is 1-3.
                k = s1/(s1-s3);
                polyLine.push([x1+(xu*k), y1+(yu*k)]);
                // point 1 does not change. p0 moves to p3.
                s0=s3;  x0=x3;  y0=y3;
                // Rotate the coordinate system.
                xr = -xu; yr = -yu;
                xu = -yr; yu = xr;
            } else { // The new propoagating edge is 2-3.
                if (data.MarkEdge(x3,y3, x2,y2)) {
                    // We need to check both edge directions
                    // Note the reverse order of the points
                    return polyLine;
                }
                k = s2/(s2-s3);
                polyLine.push([x0+xu+(xr*k), y0+yu+(yr*k)]);
                // No rotation just move "up"
                s0=s2;  x0=x2;  y0=y2;
                s1=s3;  x1=x3;  y1=y3;
            }
        } else { // The new propoagating edge is 0-2.
            if (data.MarkEdge(x2,y2, x1,y1)) {
                // We need to check both edge directions
                // Note the reverse order of the points
                return polyLine;
            }
            k = s0/(s0-s2);
            polyLine.push([x0+(xu*k), y0+(yu*k)]);
            // point 0 does not change. P1 moves to p2.
            s1=s2;  x1=x2;  y1=y2;
            // Rotate the basis.
            xr = xu; yr = yu;
            xu = -yr; yu = xr;
        }
        // With the edge marking, this check is no longer necessary :)
        // Check for loop termination.
        // x0 annd basis has returned to its original position.
        //if (x0 == xStart && y0 == yStart && 
        //    xr == xrStart && yr == yrStart) {
        //    return polyLine;
        //}
    }
    // while(true) neve exits.
}

// Helper method.
// Find the entire (both directions) that crosses an edge.
// Return a list of points.
function TraceContour(data, x0,y0, x1,y1, threshold) {
    var polyLineRight = TraceContourRight(data, x0,y0, x1,y1, threshold);
    if (polyLineRight.length == 0) { 
        // No contour through this edge.
        return polyLineRight;
    }
    var polyLineLeft = TraceContourRight(data, x1,y1, x0,y0, threshold);
    if (polyLineLeft.length < 2) {
        // Must have been a boundary edge.
        return polyLineRight;
    }
    // reverse and append the lines.
    polyLineLeft.reverse();
    polyLineLeft.pop();

    var points = polyLineLeft.concat(polyLineRight);
    return points;
}


function LongestContour(data, threshold) {
    // Loop over the cells.
    var bestContour = [];
    for (var y = 1; y < data.height; ++y) {
        for (var x = 1; x < data.width; ++x) {
            // Look for contours crossing the xMax and yMax edges.
            var xContour = TraceContour(data, x,y, x-1,y, threshold);
            if (xContour.length > bestContour.length) {
                bestContour = xContour;
            }
            var yContour = TraceContour(data, x,y, x,y-1, threshold);
            if (yContour.length > bestContour.length) {
                bestContour = yContour;
            }
        }
    }

    return bestContour;
}



// Inplace (not considering tmp data).
// Radius = 0 => single point / no smoothing,  1 => kernel dim 3 ...
function SmoothDataAlphaRGB(inData, radius) {
    // create a kernel
    var kernelDim = 2*radius+1;
    var kernel = new Array(kernelDim);
    // One extra for ease of inner loop
    var ksum = new Array(kernelDim + 1);
    ksum[0] = 0;
    for (var i = -radius, j=0; i <= radius; ++i, ++j) {
        if (radius == 0) { // for testing
            kernel[j] = 1.0;
        } else {
            kernel[j] = Math.exp(-i*i/(radius*radius));
        }
        ksum[j+1] = ksum[j] + kernel[j];
    }
    // Normalize
    var sum = ksum[kernel.length];
    for (var i = 0; i < kernel.length; ++i) {
        kernel[i] /= sum;
        ksum[i+1] /= sum;
    }

    var tmpData = new Array(inData.data.length);

    // Smooth x
    var iOut = 0;
    for (var y = 0; y < inData.height; ++y) {
        var rowx = (y*inData.width*4);
        for (var x = 0; x < inData.width; ++x) {
            var startk = Math.max(radius-x, 0);
            var endk = Math.min(radius-x+inData.width, kernelDim);
            var startx = rowx + (x - radius + startk)*4;
            var sumr = 0;
            var sumg = 0;
            var sumb = 0;
            var suma = 0;
            for (var ix = startx, ik = startk; ik < endk; ++ik) {
                sumr += kernel[ik] * inData.data[ix++]; 
                sumg += kernel[ik] * inData.data[ix++]; 
                sumb += kernel[ik] * inData.data[ix++]; 
                suma += kernel[ik] * inData.data[ix++]; 
            }
            if (x < radius || inData.width - x <= radius) {
                sumr = sumr / (ksum[endk] - ksum[startk]);
                sumg = sumg / (ksum[endk] - ksum[startk]);
                sumb = sumb / (ksum[endk] - ksum[startk]);
                suma = suma / (ksum[endk] - ksum[startk]);
            }
            tmpData[iOut++]   = sumr;
            tmpData[iOut++]   = sumg;
            tmpData[iOut++]   = sumb;
            tmpData[iOut++]   = suma;
        }
    }

    for (var i = 0; i < tmpData.length; ++i) {
        inData.data[i] = tmpData[i];
    }

    // Smooth y
    iOut = 0;
    for (var y = 0; y < inData.height; ++y) {
        var rowx = y * inData.width * 4;
        var startk = Math.max(radius-y, 0);
        var endk = Math.min(radius-y+inData.height, kernelDim);
        var starty = rowx - ((radius-startk)*inData.width*4);
        var clipped = (y < radius || inData.height - y <= radius);
        for (var x = 0; x < inData.width; ++x, starty+=4) {
            var sumr = 0;
            var sumg = 0;
            var sumb = 0;
            var suma = 0;
            for (var iy = starty, ik = startk; ik < endk; ++ik) {
                sumr += kernel[ik] * tmpData[iy];
                sumg += kernel[ik] * tmpData[iy+1];
                sumb += kernel[ik] * tmpData[iy+2];
                suma += kernel[ik] * tmpData[iy+3];
                iy += inData.width*4;
            }
            if (clipped) {
                sumr = sumr / (ksum[endk] - ksum[startk]);
                sumg = sumg / (ksum[endk] - ksum[startk]);
                sumb = sumb / (ksum[endk] - ksum[startk]);
                suma = suma / (ksum[endk] - ksum[startk]);
            }
            inData.data[iOut++]   = sumr;
            inData.data[iOut++]   = sumg;
            inData.data[iOut++]   = sumb;
            inData.data[iOut++]   = suma;
        }
    }
    delete tmpData;
}

function ComputePrincipleCompnent(data) {
    // first compute the average RGB
    var aver = 0.0;
    var aveg = 0.0;
    var aveb = 0.0;
    var suma = 0.0
    for (var i = 0; i < data.data.length; ) {
        var r = data.data[i++];
        var g = data.data[i++];
        var b = data.data[i++];
        var a = data.data[i++];
        suma += a;
        aver += r*a;
        aveg += g*a;
        aveb += b*a;

    }
    aver /= suma;
    aveg /= suma;
    aveb /= suma;

    // Now compute the covarient matrix.
    var rr = 0, bb = 0, gg = 0;
    var rb = 0, rg = 0, gb = 0;
    for (var i = 0; i < data.data.length; ) {
        var r = data.data[i++] - aver;
        var g = data.data[i++] - aveg;
        var b = data.data[i++] - aveb;
        var a = data.data[i++];
        rr += r*r*a;
        bb += b*b*a;
        gg += g*g*a;
        rb += r*b*a;
        rg += r*g*a;
        gb += g*b*a;
    }
    rr /= suma; 
    bb /= suma; 
    gg /= suma; 
    rg /= suma; 
    rb /= suma; 
    gb /= suma; 
    // I am not sure exactly how to  compute the eigen vector.  Just estimate the vector.
    var v = [1,1,1];
    var mag1 = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    var eVal = 0;
    for (var i = 0; i < 10; ++i) {
        var r = v[0]*rr + v[1]*rg + v[2]*rb;
        var g = v[0]*rg + v[1]*gg + v[2]*gb;
        var b = v[0]*rb + v[1]*gb + v[2]*bb;
        var mag2 = Math.sqrt(r*r + g*g + b*b);
        eVal = mag2 / mag1;
        mag1 = 1.0;
        v = [r/mag2,g/mag2,b/mag2];
    }

    console.log("val = " + Math.sqrt(eVal) + ", v=(" + v[0] + ", " + v[1] + ", " + v[2] + "), ave=(" + aver + ", " + aveg + ", " + aveb + ")");

    return {val: eVal, v: v, ave: [aver, aveg, aveb]};
}



// Results: Interesting, but not useful.  
// Some tissue has the same value as background. I would need a fill to segment background better.
// Deep red tissue keeps blue red component from dominating.
function EncodePrincipleComponent(data) {
    pc = ComputePrincipleComponent(data);
    pc.val = Math.sqrt(pc.val);
    // first compute the average RGB
    var aver = 0.0;
    var aveg = 0.0;
    var aveb = 0.0;
    for (var i = 0; i < data.data.length; i += 4 ) {
        var r = data.data[i];
        var g = data.data[i+1];
        var b = data.data[i+2];
        r = r - pc.ave[0];
        g = g - pc.ave[1];
        b = b - pc.ave[2];
        // Dot product with eigenvector.
        var dot = r*pc.v[0] + g*pc.v[1] + b*pc.v[2];
        r = Math.round(pc.ave[0] + dot*pc.v[0]);
        g = Math.round(pc.ave[1] + dot*pc.v[1]);
        b = Math.round(pc.ave[2] + dot*pc.v[2]);
        r = Math.min(r,255);
        g = Math.min(g,255);
        b = Math.min(b,255);
        r = Math.max(r,0);
        g = Math.max(g,0);
        b = Math.max(b,0);
        data.data[i] = r;
        data.data[i+1] = g;
        data.data[i+2] = b;
    }
}




// central differences
// No bounds checking
function GetGradient(data, x, y) {
    var idx = (x + y*data.width) * 4;
    var v0 = (data.data[idx] + data.data[idx+1] + data.data[idx+2]);
    if (v0 > 700) { return [0,0]; } // try to not get slide boundary


    var x0 = (data.data[idx-4] + data.data[idx-3] + data.data[idx-2]);
    if (x0 > 700) { return [0,0]; } // try to not get slide boundary
    var x1 = (data.data[idx+4] + data.data[idx+5] + data.data[idx+6]);
    if (x0 > 700) { return [0,0]; } // try to not get slide boundary
    var dx = x1 - x0;

    var incy = 4*data.width;
    var y0 = (data.data[idx-incy] + data.data[idx-incy+1] + data.data[idx-incy+2]);
    if (y0 > 700) { return [0,0]; } // try to not get slide boundary
    var y1 = (data.data[idx+incy] + data.data[idx+incy+1] + data.data[idx+incy+2]);
    if (y1 > 700) { return [0,0]; } // try to not get slide boundary
    var dy = y1 - y0;

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

// Generate an orientation histogram from a contour.
function ComputeContourOrientationHistogram(contour)
{
    var hist = new Array(256);
    for (var i = 0; i < 256; ++i) {
        hist[i] = 0;
    }
    // Loop through the edges.
    for (i = 1; i < contour.length; ++i) {
        var dx = contour[i][0] - contour[i-1][0];
        var dy = contour[i][1] - contour[i-1][1];

        var mag = Math.sqrt(dx*dx + dy*dy);
        var theta = Math.atan2(dy, dx);
        if (theta != NaN && mag > 0) {
            var idx = Math.floor(128 * (theta / Math.PI + 1));
            if (idx < 0) { idx = 0;}
            if (idx > 255) { idx = 255;}
            hist[idx] += mag;
        }
    }

    return hist;
}



function ComputeContourBounds(contour) {
    var bds = [contour[0][0], contour[0][0], contour[0][1], contour[0][1]];
    for (var i = 0; i < contour.length; ++i) {
        if (contour[i][0] < bds[0]) { bds[0] = contour[i][0]; }
        if (contour[i][0] > bds[1]) { bds[1] = contour[i][0]; }
        if (contour[i][1] < bds[2]) { bds[2] = contour[i][1]; }
        if (contour[i][1] > bds[3]) { bds[3] = contour[i][1]; }
    }
    return bds;
}

function ComputeContourSpatialCurvatureHistogram(contour, min, max, axis) {
    var hist = new Array(256);
    for (var i = 0; i < 256; ++i) {
        hist[i] = 0;
    }
    for (var i = 1; i < contour.length-1; ++i) {
        var v0 = [contour[i-1][0]-contour[i][0], contour[i-1][1]-contour[i][1]];
        var v1 = [contour[i+1][0]-contour[i][0], contour[i+1][1]-contour[i][1]];
        // Lets just use the cross product,  
        // smoothing should make the angles near 180 anyway.
        var mag0 = Math.sqrt(v0[0]*v0[0] + v0[1]*v0[1]); 
        var mag1 = Math.sqrt(v1[0]*v1[0] + v1[1]*v1[1]);
        if (mag0 > 0 && mag1 > 0) {
            var cross = (v0[0]*v1[1] - v0[1]*v1[0]) / (mag0*mag1);
            var idx = Math.floor((contour[i][axis] - min) * 256 / (max-min));
            if (idx >= 0 && idx < 256) {
                hist[idx] += cross;
            }
        }
    }
    return hist;
}

// Find peak of correlation. Wrapped for orientation.
function CorrelateHistograms(hist1, hist2){
    var best = 0;
    var bestOffset = 0;
    for (var i = -200; i <= 200; ++i) {
        var sum = 0;
        var start = Math.max(0, -i);
        var end = Math.min(256, 256-i);
        for (var j = start; j < end; ++j) {
            sum += hist1[j] * hist2[j+i];
        }
        if (sum > best) {
            best = sum;
            bestOffset = i;
        }
    }
    return bestOffset;
}

//  Lets compute and correlate X and y histograms of curvature.
function ComputeContourShift(contour1, contour2) {
    // Get the bounds of both contours.
    var bds1 = ComputeContourBounds(contour1);
    var bds2 = ComputeContourBounds(contour2);
    bds1[0] = Math.min(bds1[0], bds2[0]);
    bds1[1] = Math.max(bds1[1], bds2[1]);
    bds1[2] = Math.min(bds1[2], bds2[2]);
    bds1[3] = Math.max(bds1[3], bds2[3]);

    var hist1 = ComputeContourSpatialCurvatureHistogram(contour1, bds1[0], bds1[1], 0); 
    var hist2 = ComputeContourSpatialCurvatureHistogram(contour2, bds1[0], bds1[1], 0); 
    var dx = CorrelateHistograms(hist1, hist2) * (bds1[1]-bds1[0]) / 256;

    hist1 = ComputeContourSpatialCurvatureHistogram(contour1, bds1[2], bds1[3], 1); 
    hist2 = ComputeContourSpatialCurvatureHistogram(contour2, bds1[2], bds1[3], 1); 
    var dy = CorrelateHistograms(hist1, hist2) * (bds1[3]-bds1[2]) / 256;

    return [dx, dy];
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
    for (y = 2; y < data.height; ++y) {
        for (x = 2; x < data.width; ++x) {
            var g = GetGradient(data, x-1, y-1);
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

// Even after smoothing, I still get spikes at 0, 45, 90, 180 degrees... 
// Contours are better, but still have occasional spikes at 90 degree points.
function SupressOrientationArtifacts(hist) {
    hist[192] = (hist[191]+hist[193]) / 2;
    hist[128] = (hist[127]+hist[129]) / 2;
    hist[64] = (hist[63]+hist[65]) / 2;

    hist[0] = hist[1];
    hist[255] = hist[254];
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
    var data1 = GetImageData(ctx,0,0,viewport1[2],viewport1[3]);

    var ctx2 = viewer1.MainView.Context2d;
    var viewport1 = viewer1.GetViewport();
    var data1 = GetImageData(ctx,0,0,viewport1[2],viewport1[3]);

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
                data.data[i+3] = 1;
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
    var data1 = GetImageData(ctx1, 0,0,viewport1[2],viewport1[3]);
    //var histogram1 = ComputeIntensityHistogram(data1);
    var histogram1 = ComputeOrientationHistogram(data1);
    DrawHistogram(histogram1, color);
}

function intensityHistogram(viewer, color, min, max) {
    var ctx1 = viewer.MainView.Context2d;
    var viewport1 = viewer.GetViewport();
    var data1 = GetImageData(ctx1, 0,0,viewport1[2],viewport1[3]);
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

// Takes around a second for r = 3;
function testSmooth(radius) {
    var ctx1 = VIEWER1.MainView.Context2d;
    var viewport1 = VIEWER1.GetViewport();
    var data1 = GetImageData(ctx1, 0,0,viewport1[2],viewport1[3]);
    SmoothDataAlphaRGB(data1,radius);
    DrawImageData(VIEWER1, data1);
    delete data1;
}


// Peal away background
// then run pc again.
// Results: Interesting, but not useful.  
// Some tissue has the same value as background. I would need a fill to segment background better.
// Deep red tissue keeps blue red component from dominating.
function testPrincipleComponentEncoding() {
    var ctx1 = VIEWER1.MainView.Context2d;
    var viewport1 = VIEWER1.GetViewport();
    var data1 = GetImageData(ctx1, 0,0,viewport1[2],viewport1[3]);
    SmoothDataAlphaRGB(data1,2);
    //EncodePrincipleComponent(data1);
    var histogram1 = ComputeIntensityHistogram(data1);
    var threshold1 = PickThreshold(histogram1);
    // This masks background by making it tranparent.
    ThresholdData(data1, threshold1);
    // This ignores transparent pixels.
    EncodePrincipleComponent(data1);


    DrawImageData(VIEWER2, data1);
    delete data1;
}


// Lets try the contour trick.
// Smooth, contour, find the longest contour
// I could perform connectivity before or after contouring.
// lets do it after.  Scan for edge. Trace the edge. Mark pixels that have already been contoured.
function testContour(threshold) {
    var viewer = VIEWER1;
    var ctx1 = viewer.MainView.Context2d;
    var viewport1 = viewer.GetViewport();
    var data1 = GetImageData(ctx1, 0,0,viewport1[2],viewport1[3]);
    var points = LongestContour(data1, threshold);
    if (points.length > 1) {
        var plWidget = MakeContourPolyLine(points, VIEWER1);
    }    
}




// Not accurate enough!!!!!!!!!!!!!
// Lets look at the orientation histogram after smoothing
// Even after smoothing and supressing artifacts, it locks
// onto specific values.
function testAlignRotation() {
    if (HISTOGRAM_CONTEXT) {
        HISTOGRAM_CONTEXT.clearRect(0,0,400,200);
    }

    var ctx1 = VIEWER1.MainView.Context2d;
    var viewport1 = VIEWER1.GetViewport();
    var data1 = GetImageData(ctx1, 0,0,viewport1[2],viewport1[3]);
    SmoothDataAlphaRGB(data1,4);
    var histogram1 = ComputeOrientationHistogram(data1);
    SupressOrientationArtifacts(histogram1);
    DrawImageData(VIEWER1, data1);
    DrawHistogram(histogram1, "green");

    var ctx2 = VIEWER2.MainView.Context2d;
    var viewport2 = VIEWER2.GetViewport();
    var data2 = GetImageData(ctx2, 0,0,viewport2[2],viewport2[3]);
    SmoothDataAlphaRGB(data2,4);
    var histogram2 = ComputeOrientationHistogram(data2);
    SupressOrientationArtifacts(histogram2);
    DrawImageData(VIEWER2, data2);
    DrawHistogram(histogram2, "red");

    var dTheta = CorrelateWrappedHistograms(histogram1, histogram2);

    console.log("D theta = " + 360 * dTheta / 256);
}

function testAlignRotationContour() {
    if (HISTOGRAM_CONTEXT) {
        HISTOGRAM_CONTEXT.clearRect(0,0,400,200);
    }

    var viewer1 = VIEWER1;
    var ctx1 = viewer1.MainView.Context2d;
    var viewport1 = viewer1.GetViewport();
    var data1 = GetImageData(ctx1, 0,0,viewport1[2],viewport1[3]);
    SmoothDataAlphaRGB(data1, 3);
    var histogram1 = ComputeIntensityHistogram(data1);
    var threshold1 = PickThreshold(histogram1);
    var contour1 = LongestContour(data1, threshold1);
    var histogram1b = ComputeContourOrientationHistogram(contour1);
    SupressOrientationArtifacts(histogram1b);
    DrawHistogram(histogram1b, "green");
    MakeContourPolyLine(contour1, VIEWER1);

    var viewer2 = VIEWER2;
    var ctx2 = viewer2.MainView.Context2d;
    var viewport2 = viewer2.GetViewport();
    var data2 = GetImageData(ctx2, 0,0,viewport2[2],viewport2[3]);
    SmoothDataAlphaRGB(data2, 3);
    var histogram2 = ComputeIntensityHistogram(data2);
    var threshold2 = PickThreshold(histogram2);
    var contour2 = LongestContour(data2, threshold2);
    var histogram2b = ComputeContourOrientationHistogram(contour2);
    SupressOrientationArtifacts(histogram2b);
    DrawHistogram(histogram2b, "red");
    MakeContourPolyLine(contour2, VIEWER2);

    var dTheta = CorrelateWrappedHistograms(histogram1b, histogram2b);
    dTheta = 360 * dTheta / 256;
    console.log("D theta = " + dTheta);

    return dTheta;
}







// Worked sometimes, but not always.
function testAlignTranslationPixelMean() {
    var ctx1 = VIEWER1.MainView.Context2d;
    var viewport1 = VIEWER1.GetViewport();
    var data1 = GetImageData(ctx1, 0,0,viewport1[2],viewport1[3]);
    var histogram1 = ComputeIntensityHistogram(data1);
    var threshold1 = PickThreshold(histogram1);
    ThresholdData(data1, threshold1);
    //DrawImageData(VIEWER1, data1);

    var ctx2 = VIEWER2.MainView.Context2d;
    var viewport2 = VIEWER2.GetViewport();
    var data2 = GetImageData(ctx2, 0,0,viewport2[2],viewport2[3]);
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

// Try aligning the contour.
// Means of the contour did not work.
// Lets try Correlating X Y histograms of curvature.
function testAlignTranslation() {
    var viewer1 = VIEWER1;
    var ctx1 = viewer1.MainView.Context2d;
    var viewport1 = viewer1.GetViewport();
    var data1 = GetImageData(ctx1, 0,0,viewport1[2],viewport1[3]);
    SmoothDataAlphaRGB(data1, 3);
    var histogram1 = ComputeIntensityHistogram(data1);
    var threshold1 = PickThreshold(histogram1);
    var contour1 = LongestContour(data1, threshold1);
    
    var viewer2 = VIEWER2;
    var ctx2 = viewer2.MainView.Context2d;
    var viewport2 = viewer2.GetViewport();
    var data2 = GetImageData(ctx2, 0,0,viewport2[2],viewport2[3]);
    SmoothDataAlphaRGB(data2, 3);
    var histogram2 = ComputeIntensityHistogram(data2);
    var threshold2 = PickThreshold(histogram2);
    var contour2 = LongestContour(data2, threshold2);

    var delta = ComputeContourShift(contour1, contour2);

    // Convert from pixels to slide coordinates
    var cam = VIEWER1.GetCamera();
    var viewport = VIEWER1.GetViewport();
    var dx = delta[0] * cam.Height / viewport[3];
    var dy = delta[1] * cam.Height / viewport[3];

    VIEWER1.AnimateTranslate(-dx/2, -dy/2);
    VIEWER2.AnimateTranslate(dx/2, dy/2);

    // Ignore rotation for now.

    console.log("Translate = (" + dx + ", " + dy + ")" );
}


