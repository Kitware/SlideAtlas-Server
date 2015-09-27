// Histogram section alignment. 

//=================================================
// contour collection stuff.

function PermuteBounds(bds, axis, direction) {
    if (direction < 0) {
        axis = axis << 1;
        var tmp = bds[axis];
        bds[axis] = -bds[axis+1];
        bds[axis+1] = -tmp;
    }
}

// Heuristic to sort contours and remove outliers.
// Area of adjacent sections must be withing 20% of each other.
// The first section is passed in. THe second section is
// the closest viable section to the first.
// The major direction 1->2 determines the direction to search
// for subsequent sections (lines).  THe relative position of the
// first section on the second axis determines which direction to
// look for the next line on the second axis.
function SortAndFilterContours(contours, firstContour) {
    // pick the second contour as the closest 
    // to the first with similar areas.
    var firstCenter = firstContour.GetCenter();
    var closestDist2;
    var secondContour = false;
    // for picking a corner.
    var bds = [firstCenter[0],firstCenter[0], firstCenter[1],firstCenter[1]];
    for (var i = 0; i < contours.length; ++i) {
        if (contours[i] != firstContour) {
            match = contours[i].GetArea() / firstContour.GetArea();
            if (match < 1.2 && match > 0.8) {
                var c = contours[i].GetCenter();
                if (c[0] < bds[0]) { bds[0] = c[0]; }
                if (c[0] > bds[1]) { bds[1] = c[0]; }
                if (c[1] < bds[2]) { bds[2] = c[1]; }
                if (c[1] > bds[3]) { bds[3] = c[1]; }
                c[0] -= firstCenter[0];
                c[1] -= firstCenter[1];
                var dist2 = c[0]*c[0] + c[1]*c[1];
                if (! secondContour || dist2 < closestDist2) {
                    closestDist2 = dist2;
                    secondContour = contours[i];
                }
            }
        }
    }
    // Pick the primary axis and direction (order of sections).
    var v = secondContour.GetCenter();
    v[0] -= firstCenter[0];
    v[1] -= firstCenter[1];
    var axis0 = 1;
    if (Math.abs(v[0]) > Math.abs(v[1])) { axis0 = 0; }
    var direction0 = Math.sign(v[axis0]);
    // Pick the secondary axis and direction.
    var axis1 = axis0 ? 0 : 1;
    var direction1 = Math.sign(bds[2*axis1]+bds[2*axis1+1]
                               - 2*firstCenter[axis1]);

    // Sort the contours.
    // Remove the two contours we have found already
    contours.splice(contours.indexOf(firstContour),1);
    contours.splice(contours.indexOf(secondContour),1);
    var sortedContours = [firstContour, secondContour];
    var last = secondContour;
    var lastBds = last.GetBounds();
    // Handling directions is a pain.
    PermuteBounds(lastBds, axis0, direction0);
    PermuteBounds(lastBds, axis1, direction1);
    var bestBds = false;
    while (true) {
        var bestIdx = -1;
        for (var i = 0; i < contours.length; ++i) {
            var bds = contours[i].GetBounds();
            PermuteBounds(bds, axis0, direction0);
            PermuteBounds(bds, axis1, direction1);
            if ((bds[(axis1<<1)+1] > lastBds[axis1<<1]) &&
                ((bds[axis1<<1] > lastBds[(axis1<<1)+1] ||
                  bds[axis0<<1] > lastBds[(axis0<<1)+1]))) {
                // Contour is in the correct position relative to the last.
                var k = contours[i].GetArea() / last.GetArea();
                if (k > 0.9 && k < 1.1) {
                    // Area is good
                    // find the closest
                    if (bestIdx < 0) {
                        bestIdx = i;
                        bestBds = bds;
                    } else if (bds[(axis1<<1+1)] < bestBds[(axis1<<1)]) {
                        // Axis 1 <
                        bestIdx = i;
                        bestBds = bds;
                    } else if (bds[(axis1<<1)] < bestBds[(axis1<<1)+1] &&
                               bds[(axis0<<1)+1] < bestBds[(axis0<<1)]) {
                        // Axis 1 =, and Axis0 <
                        bestIdx = i;
                        bestBds = bds;
                    }
                }
            }
        }
        if (bestIdx == -1) {
            return sortedContours;
        }
        console.log(bestIdx);
        last = contours.splice(bestIdx,1)[0];
        sortedContours.push(last);
        lastBds = bestBds;
    }
}


// Use the bounds to create an ordering of sections.
// Direction or ordering is defined by axis0 and axis1 in {"+x","+y","-x","-y"}
// axis0 is less siginficat axis, axis1 is the more significant axis.
function SortContours(contours, axis0, axis1) {
    // Decode the axes strings.
    var direction0 = axis0[0] == "-" ? -1 : 1;
    var direction1 = axis1[0] == "-" ? -1 : 1;
    var axis0 = axis0[1] == "x" ? 0 : 1;
    var axis1 = axis1[1] == "x" ? 0 : 1;

    // Copy the array so we can modify the original.
    var copy = contours.slice(0);

    // Sort the contours
    function lessThanContours(c1,c2) {
        var bds1 = c1.GetBounds();
        PermuteBounds(bds1, axis0, direction0);
        PermuteBounds(bds1, axis1, direction1);
        var bds2 = c2.GetBounds();
        PermuteBounds(bds2, axis0, direction0);
        PermuteBounds(bds2, axis1, direction1);
        if ((bds2[(axis1<<1)+1] > bds1[axis1<<1]) &&
            ((bds2[axis1<<1] > bds1[(axis1<<1)+1] ||
              bds2[axis0<<1] > bds1[(axis0<<1)+1]))) {
            return true;
        }
        return false;
    }
    var idx = 0;
    while (copy.length > 0) {
        var bestContour = null;
        var bestIdx = -1;
        for (i = 0; i < copy.length; ++i) {
            if (bestIdx < 0 || lessThanContours(copy[i],bestContour)) {
                bestIdx = i;
                bestContour = copy[i];
            }
        }
        contours[idx++] = bestContour;
        copy.splice(bestIdx,1);
    }
}

//=================================================
// Time to create a contour object.
function Contour () {
    this.Points = [];
    this.World = false;
    this.Bounds = undefined;
    this.Area = undefined;
    // If the contour is in screen coordinates, this camera
    // can be used convert to world.
    this.Camera = undefined;
}

Contour.prototype.DeepCopy = function (contourIn) {
    // We cannot use slice because the items (coordinate pairs)
    // are arrays that need to be copied.
    this.Points = new Array(contourIn.Points.length);
    for (var i = 0; i < contourIn.Points.length; ++i) {
        this.Points[i] = contourIn.Points[i].slice(0);
    }
    this.World = contourIn.World;
    if (contourIn.Camera) {
        this.Camera = new Camera();
        this.Camera.DeepCopy(contourIn.Camera);
    }

    delete this.Bounds;
    delete this.Area;
}

Contour.prototype.SetPoints = function (points) {
    this.Points = points.slice(0);
    delete this.Bounds;
    delete this.Area;
}

Contour.prototype.Length = function () {
    return this.Points.length;
}

Contour.prototype.GetDistanceSquared = function (x,y) {
    /* distance to center.
    var c = this.GetCenter();
    x = x-c[0];
    y = y-c[1];
    return x*x + y*y;
    */

    // distance to closest point.
    if (this.Points.length == 0) {
        return 0.0;
    }
    var bestPt = this.Points[0];
    var dx = bestPt[0]-x, dy = bestPt[1]-y;
    var bestDist = dx*dx + dy*dy;
    for (var i = 1; i < this.Points.length; ++i) {
        var pt = this.Points[i];
        dx = pt[0]-x;
        dy = pt[1]-y;
        var dist = dx*dx + dy*dy;
        if (dist < bestDist) {
            bestDist = dist;
            bestPt = pt;
        }
    }
    return bestDist;
}

Contour.prototype.GetPoint = function (idx) {
    return this.Points[idx];
}

Contour.prototype.SetPoint = function (idx, pt) {
    this.Points[idx] = [pt[0], pt[1]];
    delete this.Bounds;
    delete this.Area;
}

Contour.prototype.GetBounds = function () {
    if (this.Length() == 0) {
        return this.Bounds;
    }
    if ( ! this.Bounds) {
        var xMin = this.Points[0][0];
        var xMax = xMin;
        var yMin = this.Points[0][1];
        var yMax = yMin;
        for (var i = 1; i < this.Points.length; ++i) {
            var pt = this.Points[i];
            if (pt[0] < xMin) xMin = pt[0];
            if (pt[0] > xMax) xMax = pt[0];
            if (pt[1] < yMin) yMin = pt[1];
            if (pt[1] > yMax) yMax = pt[1];
        }
        this.Bounds = [xMin,xMax, yMin,yMax];
    }
    return this.Bounds.slice(0);
}

Contour.prototype.GetCenter = function(contour) {
    var bds = this.GetBounds();
    return [(bds[0]+bds[1])/2, (bds[2]+bds[3])/2];
}

// returns + or - area depending on order of points.
Contour.prototype.GetArea = function() {
    if (this.Area) {
        return this.Area;
    }
    if (this.Points.length < 3) {
        this.Area = 0;
        return 0;
    }

    // compute the center of mass.
    var cx = 0;
    var cy = 0;
    for (var i = 0; i < this.Points.length; ++i) {
        cx += this.Points[i][0];
        cy += this.Points[i][1];
    }
    cx = cx / this.Points.length;
    cy = cy / this.Points.length;

    var area = 0;
    var p0 = this.Points[this.Points.length-1];
    var dx0 = p0[0] - cx;
    var dy0 = p0[1] - cy;
    for (var i = 0; i < this.Points.length; ++i) {
        var p1 = this.Points[i];
        var dx1 = p1[0] - cx;
        var dy1 = p1[1] - cy;
        area += dx0*dy1-dy0*dx1;
        dx0 = dx1;
        dy0 = dy1;
    }

    this.Area = area/2;
    return this.Area;
}


Contour.prototype. Transform = function (shift, center, roll) {
    delete this.Bounds;
    delete this.Area;
    for (var i = 0; i < this.Points.length; ++i) {
        var x = this.Points[i][0];
        var y = this.Points[i][1];
        var vx = x-center[0];
        var vy = y-center[1];
        var s = Math.sin(roll);
        var c = Math.cos(roll);
        var rx =  c*vx + s*vy;
        var ry = -s*vx + c*vy;
        this.Points[i][0] = x + (rx-vx) + shift[0];
        this.Points[i][1] = y + (ry-vy) + shift[1];
    }
}

// shift is [x,y]
Contour.prototype.Translate = function (shift) {
    delete this.Bounds;
    delete this.Area;
    for (var i = 0; i < this.Points.length; ++i) {
        this.Points[i][0] += shift[0];
        this.Points[i][1] += shift[1];
    }
}

// I could also impliment a resample to get uniform spacing.
Contour.prototype.RemoveDuplicatePoints = function (epsilon) {
    if ( epsilon == undefined) {
        epsilon = 0;
    }
    var p0 = this.Points[this.Points.length-1];
    var idx = 0;
    while (idx < this.Points.length) {
        var p1 = this.Points[idx];
        var dx = p1[0] - p0[0];
        var dy = p1[1] - p0[1];
        if (Math.sqrt(dx*dx + dy*dy) <= epsilon) {
            this.Points.splice(idx,1);
        } else {
            ++idx;
            p0 = p1;
        }
    }
}

// I could also impliment a resample to get uniform spacing.
// Assume closed loop
Contour.prototype.Resample = function (spacing) {
    var newPoints = [];
    var p0 = this.Points[this.Points.length-1];
    var idx = 1;
    var d = 0;
    while (idx < this.Points.length) {
        var p1 = this.Points[idx];
        var dx = p1[0] - p0[0];
        var dy = p1[1] - p0[1];
        var dist = Math.sqrt(dx*dx + dy*dy);
        d = d - dist;
        while (d < 0) {
            var x = p1[0] + dx*d/dist
            var y = p1[1] + dy*d/dist
            newPoints.push([x,y]);
            d = d + spacing;
        }
        idx = idx + 1;
        p0 = p1;
    }
    this.Points = newPoints;
}

// Should eventually share this with polyline.
// The real problem is aliasing.  Line is jagged with high frequency sampling artifacts.
// Pass in the spacing as a hint to get rid of aliasing.
Contour.prototype.Decimate = function (spacing) {
    // Keep looping over the line removing points until the line does not change.
    var modified = true;
    while (modified) {
        modified = false;
        var newPoints = [];
        newPoints.push(this.Points[0]);
        // Window of four points.
        var i = 3;
        while (i < this.Points.length) {
            var p0 = this.Points[i];
            var p1 = this.Points[i-1];
            var p2 = this.Points[i-2];
            var p3 = this.Points[i-3];
            // Compute the average of the center two.
            var cx = (p1[0] + p2[0]) * 0.5;
            var cy = (p1[1] + p2[1]) * 0.5;
            // Find the perendicular normal.
            var nx = (p0[1] - p3[1]);
            var ny = -(p0[0] - p3[0]);
            var mag = Math.sqrt(nx*nx + ny*ny);
            nx = nx / mag;
            ny = ny / mag;
            mag = Math.abs(nx*(cx-this.Points[i-3][0]) + ny*(cy-this.Points[i-3][1]));
            // Mag metric does not distinguish between line and a stroke that double backs on itself.
            // Make sure the two point being merged are between the outer points 0 and 3.
            var dir1 = (p0[0]-p1[0])*(p3[0]-p1[0]) + (p0[1]-p1[1])*(p3[1]-p1[1]);
            var dir2 = (p0[0]-p2[0])*(p3[0]-p2[0]) + (p0[1]-p2[1])*(p3[1]-p2[1]);
            if (mag < spacing && dir1 < 0.0 && dir2 < 0.0) {
                // Replace the two points with their average.
                newPoints.push([cx, cy]);
                modified = true;
                // Skip the next point the window will have one old merged point,
                // but that is ok because it is just used as reference and not altered.
                i += 2;
            } else {
                //  No modification.  Just move the window one.
                newPoints.push(this.Points[i-2]);
                ++i;
            }
        }
        // Copy the remaing point / 2 points
        i = i-2;
        while (i < this.Points.length) {
            newPoints.push(this.Points[i]);
            ++i;
        }
        this.Points = newPoints;
    }
}



// change coordiantes to world
Contour.prototype.TransformToWorld = function() {
    if ( this.World ) {
        return;
    }
    delete this.Bounds;
    delete this.Area;
    // Make an annotation out of the points.
    // Transform the loop points to slide coordinate system.
    for (var i = 0; i < this.Points.length; ++i) {
        var viewPt = this.Points[i];
        this.Points[i] = this.Camera.ConvertPointViewerToWorld(viewPt[0],
                                                               viewPt[1]);
    }
    this.World = true;
}

// change coordiantes to viewer
Contour.prototype.WorldToViewer = function() {
    if ( ! this.World ) {
        return;
    }
    delete this.Bounds;
    delete this.Area;

    for (var i = 0; i < this.Points.length; ++i) {
        var viewPt = this.Points[i];
        this.Points[i] = this.Camera.ConvertPointWorldToViewer(viewPt[0],
                                                               viewPt[1]);
    }
    this.World = false;
}

// Take a list of image points and make a viewer annotation out of them.
Contour.prototype.MakePolyline = function(rgb, view) {
    // Make an annotation out of the points.
    // Transform the loop points to slide coordinate system.
    var slidePoints = [];
    for (var i = 0; i < this.Points.length; ++i) {
        var viewPt = this.Points[i];
        if (  ! this.World && this.Camera) {
            slidePoints.push(
                this.Camera.ConvertPointViewerToWorld(viewPt[0], viewPt[1]));
        } else {
            slidePoints.push([viewPt[0], viewPt[1]]);
        }
    }

    // Create a polylineWidget from the loop.
    var pl = new Polyline();
    pl.OutlineColor = rgb;

    pl.Points = slidePoints;
    pl.Closed = true;
    pl.LineWidth = 0;
    pl.UpdateBuffers();
    pl.FixedSize = false;

    // We do not need to do this here.
    // This is sort of legacy
    if (view) {
        view.AddShape(pl);
    }

    return pl;
}

// Take a list of image points and make a viewer annotation out of them.
Contour.prototype.MakeStackSectionWidget = function() {
    // Make an annotation out of the points.
    // Create a widget.
    var w = new StackSectionWidget();
    w.Shapes.push(this.MakePolyline([0,1,0]));
    // Probably still in pixel coordinates.
    //w.Bounds = this.GetBounds();

    return w;
}


//=================================================
// Stuff for segmentation.
// Start with pixel classification by RGB

// TODO: 
// -: mouse drag
// -: Create a GUI panel with options.
//    Toggle mask option.
//    Widget events
// -: Connectivity



function Segmentation (viewer) {
    var viewport = viewer.GetViewport();
    var x = viewport[0];
    var y = viewport[1];
    var width = viewport[2];
    var height = viewport[3];
    var context  = viewer.MainView.Context2d;
    this.Viewer = viewer;
    this.Context = context;
    this.Data = GetImageData(viewer.MainView);
    // Lets add a center surround channel by over writing alpha.
    var tmp = GetImageData(viewer.MainView);
    // Smooth for the center.
    SmoothDataAlphaRGB(tmp,1);
    // Save the results.
    var idx = 0;
    while (idx < tmp.data.length) {
        var intensity = (tmp.data[idx++] + tmp.data[idx++] + tmp.data[idx++]) / 3;
        this.Data.data[idx++] = Math.round(intensity);
    }
    // Smooth for the larger surround.
    SmoothDataAlphaRGB(tmp,4);
    var idx = 0;
    var min = 128, max = 128;
    while (idx < tmp.data.length) {
        var intensity = (tmp.data[idx++] + tmp.data[idx++] + tmp.data[idx++]) / 3;
        intensity = 2*(this.Data.data[idx] - intensity)+128;
        min = Math.min(min, intensity);
        max = Math.max(max, intensity);
        intensity = Math.min(intensity, 255);
        intensity = Math.max(intensity, 0);
        this.Data.data[idx++] = Math.round(intensity);
    }
    console.log("center surround range " + min + ", " + max);
    // Now the alpha channel should contain center surround values
    delete tmp;

    // I am using a hidden canvas to convert imageData to an image.
    // there must be a better way of doing this.
    this.Canvas = document.createElement("canvas"); //create
    this.CanvasContext = this.Canvas.getContext("2d");
    this.Canvas.width = width;
    this.Canvas.height = height;

    this.Mask = this.CanvasContext.createImageData(width,height);
    for (var i = 0; i < this.Mask.data.length; ++i) {
        // transparent black RGBA
        this.Mask.data[i] = this.Data.data[i];
    }

    this.ImageAnnotation = new ImageAnnotation();
    this.ImageAnnotation.Image = document.createElement('img');
    this.ImageAnnotation.Image.src = this.Canvas.toDataURL('image/png');
    var cam = viewer.GetCamera();
    var width = cam.GetWidth();
    this.ImageAnnotation.Origin = [cam.FocalPoint[0]-width/2, cam.FocalPoint[1]-cam.Height/2];
    this.ImageAnnotation.Height = cam.Height;
    viewer.AddShape(this.ImageAnnotation);

    this.PositiveSpheres = [];
    // Negatives Not convinced we need negative sphers.
    this.NegativePoints = [];
    // We need to save the parameters necessary to convert
    // slide points to the mask coordinate systemse
    this.MaskViewport = viewport.slice(0);
    this.MaskMatrix = mat4.create(viewer.MainView.Camera.Matrix);
}

// We need to save the parameters necessary to convert
// slide points to the mask coordinate systemse
Segmentation.prototype.WorldPointToMask = function (pt) {
    var viewport = this.MaskViewport;
    var m = this.MaskMatrix;

    // Convert from world coordinate to view (-1->1);
    var h = (pt[0]*m[3] + pt[1]*m[7] + m[15]);
    var xNew = (pt[0]*m[0] + pt[1]*m[4] + m[12]) / h;
    var yNew = (pt[0]*m[1] + pt[1]*m[5] + m[13]) / h;
    // Convert from view to screen pixel coordinates.
    xNew = (1.0+xNew)*0.5*viewport[2];
    yNew = (1.0-yNew)*0.5*viewport[3];

    return [xNew, yNew];
}

Segmentation.prototype.Draw = function () {
    this.CanvasContext.putImageData(this.Mask, 0, 0);
    this.ImageAnnotation.Image.src = this.Canvas.toDataURL('image/png');
    eventuallyRender();
}

// TODO: Saves spheres instead of positive points.
Segmentation.prototype.AddPositive = function (ptWorld) {
    var ptMask = this.WorldPointToMask(ptWorld);
    ptMask[0] = Math.round(ptMask[0]);
    ptMask[1] = Math.round(ptMask[1]);

    if (ptMask[0] >= 0 && ptMask[0] < this.Data.width &&
        ptMask[1] >= 0 && ptMask[1] < this.Data.height) {
        var posPixel = this.GetPixel(ptMask);
        if (this.Evaluate(posPixel)) {
            // Already in the map; do nothing.
            return;
        }
        // Create a new sphere.
        var sphere = {center:posPixel, r2:4000};
        // Shrink the radius if it contains a negative.
        for (var i = 0; i < this.NegativePoints; ++i) {
            var negPixel = this.NegativePoints[i];
            var d2 = 0, d;
            for (var j = 0; j < posPixel.length; ++j) {
                d = negPixel[j] - posPixel[j];
                d2 += d*d;
                // Make the efective radius of the negative samples 1
                d2 = d2 - 2*Math.sqrt(d2) + 1;
            }
            if (d2 < sphere.r2) {
                sphere.r2 = d2;
            }
        }

        if (sphere.r2 > 1) {
            this.PositiveSpheres.push(sphere);
            // Everytime?
            //this.Update();
            //this.Draw();
        }
    }
}

Segmentation.prototype.AddNegative = function (ptWorld) {
    var ptMask = this.WorldPointToMask(ptWorld);
    ptMask[0] = Math.round(ptMask[0]);
    ptMask[1] = Math.round(ptMask[1]);

    var negPixel = this.GetPixel(ptMask);

    if (ptMask[0] >= 0 && ptMask[0] < this.Data.width &&
        ptMask[1] >= 0 && ptMask[1] < this.Data.height &&
        this.Evaluate(negPixel)) {
        // Map is wrong.  Add a negative point and shrink positive spheres.
        this.NegativePoints.push(negPixel);
        for (var i = 0; i < this.PositiveSpheres.length; ++i) {
            var posSphere = this.PositiveSpheres[i];
            var d2 = 0, d;
            for (var j = 0; j < negPixel.length; ++j) {
                d = negPixel[j] - posSphere.center[j];
                d2 += d*d;
            }
            // Make the efective radius of the negative samples 1
            d2 = d2 - 2*Math.sqrt(d2) + 1;
            if (d2 < posSphere.r2) {
                // TODO get rid of sphere with negative radius.
                posSphere.r2 = d2;
            }
        }
        // Everytime?
        //this.Update();
        //this.Draw();
    }
}

Segmentation.prototype.Evaluate = function (pixel) {
    for (var i = 0; i < this.PositiveSpheres.length; ++i) {
        var sphere = this.PositiveSpheres[i];
        var d2 = 0;
        for (var j = 0; j < pixel.length; ++j) {
            var delta = pixel[j] - sphere.center[j];
            d2 += delta*delta;
        }
        if (d2 < sphere.r2) {
            return true;
        }
    }
    return false;
}

Segmentation.prototype.GetPixel = function (coords) {
    idx = (coords[0]+(coords[1]*this.Data.width)) << 2;
    return [this.Data.data[idx++], this.Data.data[idx++], this.Data.data[idx++], this.Data.data[idx], coords[0], coords[1]];
}

Segmentation.prototype.Update = function () {
    // Now apply the new function to the mask.
    var idx = 0;
    for (var y = 0; y < this.Data.height; ++y) {
        for (var x = 0; x < this.Data.width; ++x) {
            var pixel = this.GetPixel([x,y]);
            if ( this.Evaluate(pixel) ) {
                this.Mask.data[idx] = 255;
                this.Mask.data[idx+1] = 0;
                this.Mask.data[idx+2] = 0;
                this.Mask.data[idx+3] = 255;
            } else {
                //this.Mask.data[idx] = this.Data.data[idx];
                //this.Mask.data[idx+1] = this.Data.data[idx+1];
                //this.Mask.data[idx+2] = this.Data.data[idx+2];
                this.Mask.data[idx] = 0;
                this.Mask.data[idx+1] = 255;
                this.Mask.data[idx+2] = 0;
                this.Mask.data[idx+3] = 0;
            }
            idx += 4;
        }
    }
}

var SEGMENT;
function HandleMouseUp(event) {
    if (event.which == 1) {
        var ptWorld = SEGMENT.Viewer.ConvertPointViewerToWorld(event.clientX, event.clientY);
        SEGMENT.AddPositive(ptWorld);
        SEGMENT.Update();
        SEGMENT.Draw();
        console.log("Positive");
    }
    if (event.which == 3) {
        var ptWorld = SEGMENT.Viewer.ConvertPointViewerToWorld(event.clientX, event.clientY);
        SEGMENT.AddNegative(ptWorld);
        SEGMENT.Update();
        SEGMENT.Draw();
        console.log("Negative");
    }
}

function testSegment() {
    if (SEGMENT === undefined) {
        SEGMENT = new Segmentation(VIEWERS[0]);
    }
    VIEWERS[0].MainView.Canvas.mouseup(function () {HandleMouseUp(event);});
}




//=================================================
// Histogram display.

function HistogramPlot (left, top, width, height) {
    this.Symetric = false;
    this.Axis = 0;

    this.Height = height;
    this.Width = width;

    this.Div = $('<div>')
        .appendTo('body')
        .addClass("sa-view-align-histogram-div");

    this.Canvas = $('<canvas>')
        .appendTo(this.Div)
        .addClass("sa-view-align-histogram-canvas");
    this.Context = this.Canvas[0].getContext("2d");

    this.SetSize(left,top, width, height);
}



HistogramPlot.prototype.SetSize = function (left,top,width,height) {
    this.Height = height;
    this.Width = width;

    if (typeof(left) == "number") {
        left = left.toString() + 'px';
    }
    if (typeof(top) == "number") {
        top = top.toString() + 'px';
    }


    this.Div
        .css({'width' : width.toString(),
              'height': height.toString(),
              'top'   : top,
              'left'  : left});

    this.Canvas[0].width = width;
    this.Canvas[0].height = height;
}



HistogramPlot.prototype.Clear = function () {
    this.Context.clearRect(0,0,this.Width,this.Height);
}

HistogramPlot.prototype.Draw = function (hist, color, iMin, iMax) {
    if ( ! iMin) { iMin = 0; }
    if ( ! iMax) { iMax = hist.length;}

    // Find the max value.
    var hMax = 0;
    var hMin = 0;
    for (var i = iMin; i < iMax; ++i) {
        var v = hist[i];
        if (v > hMax) { hMax = v;}
        if (v < hMin) { hMin = v;}
    }

    var ctx = this.Context;

    var hScale, iScale, hOrigin, iOrigin, ip, hp;
    if (this.Axis) {
        hScale = (this.Width-2)/(hMax-hMin);
        hOrigin = -hMin*hScale + 1;
        iScale = (this.Height-2)/(iMax-iMin);
        iOrigin = -iMin*iScale + 1;
    } else {
        hScale = -(this.Height-2)/(hMax-hMin);
        hOrigin = -hMax*hScale + 1;
        iScale = (this.Width-2)/(iMax-iMin);
        iOrigin = -iMin*iScale + 1;
    }

    // draw the axis
    ctx.beginPath();
    ctx.strokeStyle = '#EEE';
    ip = (iMin*iScale) + iOrigin;
    if (this.Axis) {
        ctx.moveTo(hOrigin, ip);
    } else {
        ctx.moveTo(ip, hOrigin);
    }
    ip = (iMax*iScale) + iOrigin;
    if (this.Axis) {
        ctx.lineTo(hOrigin, ip);
    } else {
        ctx.lineTo(ip, hOrigin);
    }
    ctx.stroke();

    // Draw the plot
    ctx.beginPath();
    ctx.strokeStyle = color;
    ip = Math.floor((iMin*iScale) + iOrigin);
    hp = Math.floor((hist[0]*hScale) + hOrigin);
    if (this.Axis) {
        ctx.moveTo(hp, ip);
    } else {
        ctx.moveTo(ip, hp);
    }
    for (var i = iMin+1; i < iMax; ++i) {
        ip = Math.floor((i*iScale) + iOrigin);
        hp = Math.floor((hist[i]*hScale) + hOrigin);
        if (this.Axis) {
            ctx.lineTo(hp,ip);
        } else {
            ctx.lineTo(ip,hp);
        }
    }
    ctx.stroke();
}




//=================================================
// Triangle Mesh
// Edge {vert0:id0, vert1:id1,   tri0:id0, tri1:id1, length:len}
// It is easier to keep a reference to the edge object rather than its id.
// Triangle {vert0:id0, vert1;id1; vert2:i2d,    edge0:e0, edge1:e1, edge2:e2}


// I need full face, edge and point connectivity for mesh conditioning.
function TriangleMesh() {
    // To save memory make a single array [x,y, x,y, ...]
    this.PointCoordinates = [];
    // Point indexes all in a single array [p0,p1,p2, p0,p1,p2 ...]
    this.TrianglePointIds = [];

    // Primative objects.
    this.Points = [];
    this.Edges = [];
    this.Triangles = [];
}



// Just enough to render the points.
TriangleMesh.prototype.DeepCopy = function (mesh) {
    this.PointCoordiantes = new Array(mesh.PointCoordinates.length);
    for (var i = 0; i < mesh.PointCoordinates.length; ++i) {
        this.PointCoordinates[i] = mesh.PointCoordinates[i];
    }

    this.TrianglePointIds = new Array(mesh.TrianglePointIds.length);
    for (var i = 0; i < mesh.TrianglePointIds.length; ++i) {
        this.TrianglePointIds[i] = mesh.TrianglePointIds[i];
    }
}




// I am doing this so much I decided to make a method out of it.
TriangleMesh.prototype.GetPointCoordinates = function (ptIdx) {
    var idx = ptIdx << 1;
    return [this.PointCoordinates[idx++],this.PointCoordinates[idx]];
}


// Methods for Shape ---------------------------------------------
TriangleMesh.prototype.ConvertPointsToWorld = function (viewer) {
    var viewport = viewer.GetViewport();
    var idx = 0;
    while (idx < this.PointCoordinates.length) {
        var pt = viewer.ConvertPointViewerToWorld(this.PointCoordinates[idx],
                                                  this.PointCoordinates[idx+1]);
        this.PointCoordinates[idx++] = pt[0];
        this.PointCoordinates[idx++] = pt[1];
    }
}

TriangleMesh.prototype.Draw = function (view) {
    var context = view.Context2d;
    context.save();
    // Identity (screen coordinates).
    context.setTransform(1,0,0,1,0,0);
    // Change canvas coordinates to View (-1->1, -1->1).
    context.transform(0.5*view.Viewport[2], 0.0,
                      0.0, -0.5*view.Viewport[3],
                      0.5*view.Viewport[2],
                      0.5*view.Viewport[3]);

    // Change canvas coordinates to slide (world). (camera: slide to view).
    var h = 1.0 / view.Camera.Matrix[15];
    context.transform(view.Camera.Matrix[0]*h, view.Camera.Matrix[1]*h,
                      view.Camera.Matrix[4]*h, view.Camera.Matrix[5]*h,
                      view.Camera.Matrix[12]*h, view.Camera.Matrix[13]*h);
    context.strokeStyle = '#000';
    context.lineWidth = 10;

    var x, y;
    var ptIdx;
    var triIdx = 0;
    while ( triIdx < this.TrianglePointIds.length) {
        context.beginPath();
        ptIdx = this.TrianglePointIds[triIdx++] << 1;
        x = this.PointCoordinates[ptIdx++];
        y = this.PointCoordinates[ptIdx];
        context.moveTo(x,y);
        ptIdx = this.TrianglePointIds[triIdx++] << 1;
        context.lineTo(this.PointCoordinates[ptIdx++],this.PointCoordinates[ptIdx]);
        ptIdx = this.TrianglePointIds[triIdx++] << 1;
        context.lineTo(this.PointCoordinates[ptIdx++],this.PointCoordinates[ptIdx]);
        context.lineTo(x,y);

        context.stroke();
    }

    context.restore();
}

// End of methods for Shape ---------------------------------------






// private
// Returns the other two edges (in order) of the triangle.
TriangleMesh.prototype.OtherTriangleEdges = function (tri, edge) {
      if (tri.edge0 === edge) {
            return [tri.edge1, tri.edge2];
      } else if (tri.edge1 === edge) {
            return [tri.edge2, tri.edge0];
      } else if (tri.edge2 === edge) {
            return [tri.edge0, tri.edge1];
      }
      saDebug("Triangle does not contain the edge");
}


// private
// Returns the point id shared by two edges.
TriangleMesh.prototype.PointIdSharedByEdges = function (edge0, edge1) {
    if (edge0.vert0 == edge1.vert0) { return edge0.vert0; }
    if (edge0.vert0 == edge1.vert1) { return edge0.vert0; }
    if (edge0.vert1 == edge1.vert0) { return edge0.vert1; }
    if (edge0.vert1 == edge1.vert1) { return edge0.vert1; }
    saDebug("Edges do not share a point");
}


// private
TriangleMesh.prototype.SwapEdgeTriangle = function(edge, oldId, newId) {
    if (edge.tri0 == oldId) {
        edge.tri0 = newId;
    }
    if (edge.tri1 != undefined && edge.tri1 == oldId) {
        edge.tri1 = newId;
    }
}

TriangleMesh.prototype.ConditionEdgeRotate = function () {
    var modified = false;

    // Loop over the edges and rotate edges when it makes it shorter.
    for (var edgeId = 0; edgeId < this.Edges.length; ++edgeId) {
        // find four edges/points of the quadrilateral containing the edge.
        var edge = this.Edges[edgeId];
        if (edge === undefined || edge.tri1 == undefined) {
            // boundary edge
            continue;
        }
        var tri0 = this.Triangles[edge.tri0];
        var tri1 = this.Triangles[edge.tri1];
        // It is a pain to find the other edges.
        var quadEdges = [];
        quadEdges = quadEdges.concat(this.OtherTriangleEdges(tri0, edge));
        quadEdges = quadEdges.concat(this.OtherTriangleEdges(tri1, edge));
        // Get the four points (consistent with quad edges).
        var quadPointIds = new Array(4);
        quadPointIds[0] = this.PointIdSharedByEdges(quadEdges[3], quadEdges[0]);
        quadPointIds[1] = this.PointIdSharedByEdges(quadEdges[0], quadEdges[1]);
        quadPointIds[2] = this.PointIdSharedByEdges(quadEdges[1], quadEdges[2]);
        quadPointIds[3] = this.PointIdSharedByEdges(quadEdges[2], quadEdges[3]);
        // Now that we have the four edge and point ids,
        // Evaluate whether it is beneficial to rotate the edge.
        var idx1 = quadPointIds[1] << 1;
        var idx3 = quadPointIds[3] << 1;
        var dx = this.PointCoordinates[idx3] - this.PointCoordinates[idx1];
        var dy = this.PointCoordinates[idx3+1] - this.PointCoordinates[idx1+1];
        var dist13 = Math.sqrt((dx*dx)+(dy*dy));
        if (dist13 < edge.length) {
            // Make sure we are not inverting a triangle.
            // New triangle at p2
            var idx1 = quadPointIds[1] << 1;
            var idx2 = quadPointIds[2] << 1;
            var idx3 = quadPointIds[3] << 1;
            var dx1 = this.PointCoordinates[idx1] - this.PointCoordinates[idx2];
            var dy1 = this.PointCoordinates[idx1+1] - this.PointCoordinates[idx2+1];
            var dx3 = this.PointCoordinates[idx3] - this.PointCoordinates[idx2];
            var dy3 = this.PointCoordinates[idx3+1] - this.PointCoordinates[idx2+1];
            var c2 = dx3*dy1 - dy3*dx1;
            // New triangle at p0
            var idx0 = quadPointIds[0] << 1;
            dx1 = this.PointCoordinates[idx1] - this.PointCoordinates[idx0];
            dy1 = this.PointCoordinates[idx1+1] - this.PointCoordinates[idx0+1];
            dx3 = this.PointCoordinates[idx3] - this.PointCoordinates[idx0];
            dy3 = this.PointCoordinates[idx3+1] - this.PointCoordinates[idx0+1];
            var c0 = dx1*dy3 - dy1*dx3;
            // Handedness of quad should no longer be random.  
            // However checking for both condition should not hurt.
            if ((c0 < 0 && c2 < 0) || (c0 > 0 && c2 > 0)) {
                modified = true;
                // Rotate the edge.
                edge.vert0 = quadPointIds[1];
                edge.vert1 = quadPointIds[3];
                edge.length = dist13;

                tri0.vert0 = quadPointIds[1];
                tri0.vert1 = quadPointIds[2];
                tri0.vert2 = quadPointIds[3];
                tri0.edge0 = quadEdges[1]
                tri0.edge1 = quadEdges[2]
                tri0.edge2 = edge;

                tri1.vert0 = quadPointIds[1];
                tri1.vert1 = quadPointIds[3];
                tri1.vert2 = quadPointIds[0];
                tri1.edge0 = edge;
                tri1.edge1 = quadEdges[3];
                tri1.edge2 = quadEdges[0];

                // Boundary edges point to swapped triangle
                this.SwapEdgeTriangle(quadEdges[0], edge.tri0, edge.tri1);
                this.SwapEdgeTriangle(quadEdges[2], edge.tri1, edge.tri0);
            }
        }
    }
    return modified;
}



TriangleMesh.prototype.AddEdge = function (ptId0, ptId1, triIdx) {
    if (ptId0 > ptId1) {
        var tmp = ptId0;
        ptId0 = ptId1;
        ptId1 = tmp;
    }
    var edge = undefined;
    // Look for the edge in the hash table (created by another triangle).
    for (var i = 0; i < this.EdgeHash[ptId0].length && !edge; ++i) {
        var e2 = this.EdgeHash[ptId0][i];
        if (e2.vert1 == ptId1) {
            edge = e2;
            edge.tri1 = triIdx;
        }
    }
    if ( edge == undefined) {
        // Make a new edge.
        edge = {vert0: ptId0, vert1: ptId1, tri0: triIdx};
        // Add it into the hash.
        this.EdgeHash[ptId0].push(edge);
        // Compute its length.
        var idx0 = ptId0 << 1;
        var idx1 = ptId1 << 1;
        var dx = this.PointCoordinates[idx1] - this.PointCoordinates[idx0];
        var dy = this.PointCoordinates[idx1+1] - this.PointCoordinates[idx0+1];
        edge.length = Math.sqrt((dx*dx)+(dy*dy));
    }
    return edge;
}


// Convert from simple point cooridnate and triangle corner id arrays 
// to full mesh.
TriangleMesh.prototype.CreateFullMesh = function () {
    var numPts = this.PointCoordinates.length / 2;
    var numTri = this.TrianglePointIds.length / 3;
    this.Triangles = new Array(numTri);
    this.EdgeHash = new Array(numPts);
    for (var i = 0; i < this.EdgeHash.length; ++i) {
        this.EdgeHash[i] = [];
    }

    var idx = 0;
    var triIdx = 0;
    while (idx < this.TrianglePointIds.length) {
        var ptId0 = this.TrianglePointIds[idx++];
        var ptId1 = this.TrianglePointIds[idx++];
        var ptId2 = this.TrianglePointIds[idx++];
        var triangle = {vert0:ptId0, vert1:ptId1, vert2:ptId2};
        triangle.edge0 = this.AddEdge(ptId0, ptId1, triIdx);
        triangle.edge1 = this.AddEdge(ptId1, ptId2, triIdx);
        triangle.edge2 = this.AddEdge(ptId2, ptId0, triIdx);
        this.Triangles[triIdx] = triangle;
        ++triIdx;
    }
    // Move the edges from the hash to a list of edges.
    var numEdges = numPts + numTri - 1;
    this.Edges = new Array(numEdges);
    var edgeIdx = 0;
    for (var i = 0; i < this.EdgeHash.length; ++i) {
        for (var j = 0; j < this.EdgeHash[i].length; ++j) {
            this.Edges[edgeIdx++] = this.EdgeHash[i][j];
        }
    }
    delete this.EdgeHash;
}

// Create the triangle point id array from the mesh triangles.
// I do not know if I will keep the dual mesh representations...
TriangleMesh.prototype.Update = function () {
    var idx = 0;
    var triIdx = 0;
    for (triIdx = 0; triIdx < this.Triangles.length; ++triIdx) {
        var tri = this.Triangles[triIdx];
        this.TrianglePointIds[idx++] = tri.vert0;
        this.TrianglePointIds[idx++] = tri.vert1;
        this.TrianglePointIds[idx++] = tri.vert2;
    }
}


// For debugging
TriangleMesh.prototype.DrawInCanvas = function (ctx) {
    var triIdx = 0;
    var ptIdx;
    while (triIdx < this.TrianglePointIds.length) {
        ptIdx = this.TrianglePointIds[triIdx++] << 1;
        ctx.beginPath(this.PointCoordinates[ptIdx++], this.PointCoordinates[ptIdx]);
        ptIdx = this.TrianglePointIds[triIdx++] << 1;
        ctx.lineTo(this.PointCoordinates[ptIdx++], this.PointCoordinates[ptIdx]);
        ptIdx = this.TrianglePointIds[triIdx++] << 1;
        ctx.lineTo(this.PointCoordinates[ptIdx++], this.PointCoordinates[ptIdx]);
        ctx.stroke();
    }
}

// Clears the mesh the adds the triangulation.
// The triangulation may not be optimal.
TriangleMesh.prototype.TriangulateContour = function(contour) {
    var s,c,a;
    var num = contour.Length();
    this.PointCoordinates = new Array(num*2);
    this.TrianglePointIds = new Array();
    // Make an array that marks unused points (and keeps their angles).
    var vAngles = new Array(num);

    var x0 = contour.GetPoint(num-1)[0], y0 = contour.GetPoint(num-1)[1];
    var x1 = contour.GetPoint(0)[0], y1 = contour.GetPoint(0)[1];
    var dx0 = x1-x0, dy0 = y1-y0;
    var dist0 = Math.sqrt(dx0*dx0 + dy0*dy0);
    var x2, y2, dx1, dy1, dist1;
    for (var i = 0; i < num; ++i) {
        this.PointCoordinates[i<<1] = x1;
        this.PointCoordinates[(i<<1) + 1] = y1;
        x2 = contour.GetPoint((i+1)%num)[0];
        y2 = contour.GetPoint((i+1)%num)[1];
        // Compute length
        dx1 = x2-x1;  dy1 = y2-y1;
        dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);

        // Although this is correct, atan works without it,
        // And we might have divide by zero.
        //s = (dx1*dy0-dx0*dy1) / (dist0*dist1);
        //c = (dx0*dx1+dy0*dy1) / (dist0*dist1);
        s = (dx1*dy0-dx0*dy1);
        c = (dx0*dx1+dy0*dy1);
        a = Math.atan2(s,c);
        vAngles[i] = a;

        // Move forward one vertex.
        x0 = x1;   y0 = y1;
        x1 = x2;   y1 = y2;
        dx0=dx1;   dy0=dy1;
        dist0 = dist1;
    }

    var triIdx = 0;
    var numPointsLeft = num;
    while (numPointsLeft > 2) {
        // Find the vertex with the smallest angle.
        var smallestAngle = 10.0;
        var v1 = v0-1;
        for (var i = 0; i < num; ++i) {
            if (vAngles[i] < smallestAngle) {
                smallestAngle = vAngles[i];
                v1 = i;
            }
        }

        if (smallestAngle > 0) { return;}

        // Mark the vertex as used.
        vAngles[v1] = 100.0; // Special value.
        --numPointsLeft;
        // Find the adjacent unused points.
        var v0 = v1;
        do {
            --v0;
            if (v0 < 0) {v0 = num-1;}
        } while (vAngles[v0] > 10);
        var v2 = v1;
        do {
            ++v2;
            if (v2 >= num) {v2 = 0;}
        } while (vAngles[v2] > 10);

        // Add the triangle
        this.TrianglePointIds[triIdx++] = v0;
        this.TrianglePointIds[triIdx++] = v1;
        this.TrianglePointIds[triIdx++] = v2;
        // The new edge is (v0,v2)
        v1 = v0;
        // Get the points on either side of the new edge.
        v0 = v1;
        do {
            --v0;
            if (v0 < 0) {v0 = num-1;}
        } while (vAngles[v0] > 10);
        var  v3 = v2
        do {
            ++v3;
            if (v3 >= num) {v3 = 0;}
        } while (vAngles[v3] > 10);
        // Compute new angles.
        var p0 = contour.GetPoint(v0);
        var p1 = contour.GetPoint(v1);
        var p2 = contour.GetPoint(v2);
        var p3 = contour.GetPoint(v3);
        var dx0 = p1[0]-p0[0], dy0 = p1[1]-p0[1];
        var dx1 = p2[0]-p1[0], dy1 = p2[1]-p1[1];
        var dx2 = p3[0]-p2[0], dy2 = p3[1]-p2[1];

        var dist0 = Math.sqrt(dx0*dx0 + dy0*dy0);
        var dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
        var dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);

        //var s = (dx1*dy0-dx0*dy1) / (dist0*dist1);
        //var c = (dx0*dx1+dy0*dy1) / (dist0*dist1);
        var s = (dx1*dy0-dx0*dy1);
        var c = (dx0*dx1+dy0*dy1);
        vAngles[v1] = Math.atan2(s,c);
        s = (dx2*dy1-dx1*dy2) / (dist1*dist2);
        c = (dx1*dx2+dy1*dy2) / (dist1*dist2);
        vAngles[v2] = Math.atan2(s,c);
    }
}



// Edge {vert0:id0, vert1:id1,   tri0:id0, tri1:id1}
// Triangle {vert0:id0, vert1;id1; vert2:i2d,    edge0:id0, edge1:id1, edge2:id2}



//=================================================
// Circular array for fifo methods
function MapQueue(length) {
    // Points to the first full spot.
    this.StartIdx = 0;
    // Points to the next empty spot.
    this.EndIdx = 0;
    this.Allocate(length);
}

MapQueue.prototype.Push = function (item) {
    var nextEndIdx = this.EndIdx + 1;
    // If the circular buffer is full, reallocate.
    if (nextEndIdx >= this.Array.length) {
        nextEndIdx == 0;
    }
    if (this.Array[nextEndIdx] != null) {
        this.Allocate(this.Array.length * 2);
        nextEndIdx = this.EndIdx+1;
    }
    // Add the index into the buffer.
    this.Array[this.EndIdx] = item;
    this.EndIdx = nextEndIdx;
}

MapQueue.prototype.Shift = function () {
    var item = this.Array[this.StartIdx];
    if (item == null) {
        return item;
    }
    this.Array[this.StartIdx] = null;
    this.StartIdx += 1;
    if (this.StartIdx >= this.Array.length) {
        this.StartIdx == 0;
    }
    return item;
}

// Reallocate
MapQueue.prototype.Allocate = function (length) {
    if (this.Array && this.Array.length > length) { return; }
    var newArray = new Array(length);
    var i = 0;
    if (this.Array) {
        for (var j = this.StartIdx; j != this.EndIdx; ++j) {
            if (j >= this.Array.length) { j = 0; }
            newArray[i++] = this.Array[j];
        }
        this.StartIdx = 0;
        this.EndIdx = i;
        delete this.Array;
    }
    while (i++ < length) {
        newArray[i] = null;
    }
    this.Array = newArray;
}





//=================================================
// Distance map: city block distance


function DistanceMap(bounds, spacing) {
    this.Bounds = bounds; // Warning shallow copy.
    this.Spacing = spacing;
    this.Dimensions = [Math.ceil((bounds[1]-bounds[0])/spacing),
                       Math.ceil((bounds[3]-bounds[2])/spacing)];
    var size = this.Dimensions[0]*this.Dimensions[1];
    if (size > 1000000) {
        saDebug("Warning: Distance map memory requirement is large.");
    }
    this.Map = new Array(size);
    for (var i = 0; i < size; ++i) {
        this.Map[i] = size; // a convenient large distance
    }

    this.Queue = null;
}

// For debugging
DistanceMap.prototype.Draw = function (viewer) {
    var ctx = viewer.MainView.Context2d;
    var data = ctx.createImageData(this.Dimensions[0], this.Dimensions[1]);
    // find maximum
    var max = 0;
    var numPixels = this.Dimensions[0] * this.Dimensions[1];
    for (var i = 0; i < numPixels; ++i) {
        if (max < this.Map[i]) { max = this.Map[i];}
    }
    // Draw the pixels.
    var ii = 0;
    for (var i = 0; i < numPixels; ++i) {
        data.data[ii] = data.data[ii+1] = data.data[ii+2] = Math.floor(255 * this.Map[i]/max);
        data.data[ii+3] = 255;
        ii += 4;
    }

    ctx.putImageData(data,10,10);
}

// Only rasterize contour points for now.  Assume they are close together.
DistanceMap.prototype.AddContour = function (contour) {
    for (var i = 0; i < contour.Length(); ++i) {
        var x = Math.round((contour.GetPoint(i)[0]-this.Bounds[0])/this.Spacing);
        var y = Math.round((contour.GetPoint(i)[1]-this.Bounds[2])/this.Spacing);
        if (x >=0 && x < this.Dimensions[0] &&
            y >=0 && y < this.Dimensions[1]) {
            this.Map[x + (y*this.Dimensions[0])] = 0;
        }
    }
}

// Rasterize the polyline into the distance map.
// Fill it if it is closed
DistanceMap.prototype.AddPolyline = function (pline) {
    var m0, m1, m2;
    var points = pline.Points;
    if (points.length == 0) { return; }
    m0 = [(points[0][0]-this.Bounds[0]) / this.Spacing,
          (points[0][1]-this.Bounds[2]) / this.Spacing];
    m1 = m0;
    for (var i = 1; i < points.length; ++i) {
        m2 = [(points[i][0]-this.Bounds[0]) / this.Spacing,
              (points[i][1]-this.Bounds[2]) / this.Spacing];
        this.AddEdge(m1,m2);
        m1 = m2;
    }

    if (pline.Closed && points.length > 2) {
        this.AddEdge(m2,m0);
    }

    // There is a chance this could fail if there are no pixels between two
    // edges.  Maybe get the mask from the thresholded image. 
    if (pline.Closed && points.length > 2 && false) {
        // Fill leaked out on one section.  Make it more robust, or
        // use the thresholded image.

        this.AddEdge(m2,m0);

        if ( ! this.Queue) {
            this.Queue = new MapQueue(this.Dimensions[0] +
                                      this.Dimensions[1]);
        }
        // Pick a seed.
        // Average perpendiculars to the first two edges
        var vy = (points[2][0] - points[0][0]);
        var vx = (points[0][1] - points[2][1]);
        // normalize
        var k = 1 / Math.sqrt(vx*vx + vy*vy);
        vx *= k;
        vy *= k;
        var x = (points[1][0]-this.Bounds[0]) / this.Spacing;
        var y = (points[1][1]-this.Bounds[2]) / this.Spacing;
        var ix, iy;
        do {
            x += vx;
            y += vy;
            ix = Math.round(x);
            iy = Math.round(y);
            if (ix < 0 || ix >= this.Dimensions[0] ||
                iy < 0 || iy >= this.Dimensions[1]) {
                // Failed to find seed.
                return;
            }
        } while (this.Map[ix + (iy*this.Dimensions[0])] == 0);
        this.Queue.Push([ix,iy]);
        var seed, idx;
        while ( (seed = this.Queue.Shift()) != null) {
            this.AddSeedToQueue(seed[0]-1, seed[1]);
            this.AddSeedToQueue(seed[0]+1, seed[1]);
            this.AddSeedToQueue(seed[0], seed[1]-1);
            this.AddSeedToQueue(seed[0], seed[1]+1);
        }
    }
}


DistanceMap.prototype.Fill = function (ix,iy) {
    if ( ! this.Queue) {
        this.Queue = new MapQueue(this.Dimensions[0] +
                                  this.Dimensions[1]);
    }
    this.Queue.Push([ix,iy]);
    var xMax = this.Dimensions[0]-1;
    var yMax = this.Dimensions[1]-1;
    var seed, idx;
    while ( (seed = this.Queue.Shift()) != null) {
        if (seed[0] > 0) { this.AddSeedToQueue(seed[0]-1, seed[1])};
        if (seed[0] < xMax) { this.AddSeedToQueue(seed[0]+1, seed[1])};
        if (seed[1] > 0) { this.AddSeedToQueue(seed[0], seed[1]-1)};
        if (seed[1] < yMax) { this.AddSeedToQueue(seed[0], seed[1]+1)};
    }
}

DistanceMap.prototype.AddSeedToQueue = function (ix,iy) {
    var idx = ix + (iy*this.Dimensions[0]);
    if (ix >= 0 && ix < this.Dimensions[0] &&
        iy >= 0 && iy < this.Dimensions[1] &&
        this.Map[idx] != 0) {
        this.Map[idx] = 0;
        this.Queue.Push([ix,iy]);
    }
}

// m0, and m1 should already be in map coordinates.
DistanceMap.prototype.AddEdge = function (m0, m1) {
    var divisions = Math.max(Math.abs(m0[0]-m1[0]), Math.abs(m0[1]-m1[1]));
    divisions = Math.ceil(divisions);
    for (var i = 0; i <= divisions; ++i) {
        var x = Math.round((m0[0]*(divisions-i)+m1[0]*i)/divisions);
        var y = Math.round((m0[1]*(divisions-i)+m1[1]*i)/divisions);
        this.Map[x + (y*this.Dimensions[0])] = 0;
    }    
}

// Rasterize points with alpha = 255
DistanceMap.prototype.AddImageData = function (data) {
    var idx = 0;
    for (var y = 0; y < data.height; ++y) {
        for (var x = 0; x < data.width; ++x) {
            if (x >=0 && x < this.Dimensions[0] &&
                y >=0 && y < this.Dimensions[1] &&
                data.data[i+3] == 255) {
                this.Map[x + (y*this.Dimensions[0])] = 0;
            }
            i += 4;
        }
    }
}

// Fill in all distance values from existing values.
DistanceMap.prototype.Update = function () {
    // I wonder if I can compute the number of passes that will be needed?
    count = 0;
    while (this.UpdatePass()) {++count;}
    //console.log("passes: " + count);
}

// Returns true if something changed.
DistanceMap.prototype.UpdatePass = function () {
    var changed = false;
    var idx;
    // Forward and backward pass over all the rows.
    for (var y = 0; y < this.Dimensions[1]; ++y) {
        idx = y*this.Dimensions[0];
        var min = this.Map[idx];
        for (var x = 1; x < this.Dimensions[0]; ++x) {
            ++idx;
            ++min;
            if (min < this.Map[idx]) {
                this.Map[idx] = min;
                changed = true;
            } else {
                min = this.Map[idx];
            }
        }
        for (var x = this.Dimensions[0]-2; x >= 0; --x) {
            --idx;
            ++min;
            if (min < this.Map[idx]) {
                this.Map[idx] = min;
                changed = true;
            } else {
                min = this.Map[idx];
            }
        }
    }

    // Forward and backward pass over all the columns.
    for (var x = 0; x < this.Dimensions[0]; ++x) {
        idx = x;
        var min = this.Map[idx];
        for (var y = 1; y < this.Dimensions[1]; ++y) {
            idx += this.Dimensions[0];
            ++min;
            if (min < this.Map[idx]) {
                this.Map[idx] = min;
                changed = true;
            } else {
                min = this.Map[idx];
            }
        }
        for (var y = this.Dimensions[1]-2; y >= 0; --y) {
            idx -= this.Dimensions[0];
            ++min;
            if (min < this.Map[idx]) {
                this.Map[idx] = min;
                changed = true;
            } else {
                min = this.Map[idx];
            }
        }
    }
    return changed;
}

// TODO:
// Change this so that it gives distance in units of world, not map.
DistanceMap.prototype.GetDistance = function (x, y) {
    var ix = Math.round((x-this.Bounds[0])/this.Spacing);
    var iy = Math.round((y-this.Bounds[2])/this.Spacing);
    if (ix >=0 && ix < this.Dimensions[0] &&
        iy >=0 && iy < this.Dimensions[1]) {
        return this.Map[ix + (iy*this.Dimensions[0])];
    } else {
        // Ramp the distance map down outside the bounds.
        var dist = 0;
        if ( ix < 0) {
            dist += -0.1*ix;
            ix = 0;
        }
        if ( ix >= this.Dimensions[0]) {
            dist += 0.1*(ix-this.Dimensions[0]+1);
            ix = this.Dimensions[0]-1;;
        }
        if ( iy < 0) {
            dist += -0.1*iy;
            iy = 0;
        }
        if ( iy >= this.Dimensions[1]) {
            dist += 0.1*(iy-this.Dimensions[1]+1);
            iy = this.Dimensions[1]-1;;
        }
        return dist + this.Map[ix + (iy*this.Dimensions[0])];
    }
}

// Central difference.
DistanceMap.prototype.GetGradient = function(x, y) {
    var ix = Math.round((x-this.Bounds[0])/this.Spacing);
    var iy = Math.round((y-this.Bounds[2])/this.Spacing);
    var dx = 0, dy=0;
    if (ix < 0 || ix >= this.Dimensions[0] ||
        iy < 0 || iy >= this.Dimensions[1]) {
        // Slow gradient toward middle.
        ix = ix - (this.Dimensions[0]*0.5);
        iy = iy - (this.Dimensions[1]*0.5);
        var dist = Math.sqrt(ix*ix + iy*iy);
        return [ix/(10*dist), iy/(10*dist)];
    }
    var idx = ix + (iy*this.Dimensions[0]);
    // x
    if (ix == 0) {
        dx = this.Map[idx+1] - this.Map[idx];
    } else if (ix == this.Dimensions[0]-1) {
        dx = this.Map[idx] - this.Map[idx-1];
    } else {
        dx = this.Map[idx+1] - this.Map[idx-1];
    }
    // y
    var incy = this.Dimensions[0];
    if (iy == 0) {
        dy = this.Map[idx+incy] - this.Map[idx];
    } else if (iy == this.Dimensions[1]-1) {
        dy = this.Map[idx] - this.Map[idx-incy];
    } else {
        dy = this.Map[idx+incy] - this.Map[idx-incy];
    }

    // Scale by spacing (Keeps gradient decent stable).
    dx = dx * this.Spacing;
    dy = dy * this.Spacing;

    return [dx, dy];
}


//=================================================
// Extend the image data returned by the canvas.

function ImageData() {
    this.IncX = 1;
    this.IncY = 1;
}

ImageData.prototype.GetIntensity = function (x,y) {
    if (! this.data) { return 0;}
    x = Math.round(x);
    y = Math.round(y);
    var idx = x*this.IncX + y*this.IncY;
    return (this.data[idx] + this.data[idx+1] + this.data[idx+2]) / 3;
}

ImageData.prototype.InBounds = function (x,y) {
    if (! this.data) { return false;}
    return (x >=0 && x < this.width && y >=0 && y < this.height);
}


// Add a couple methods to the object.
// change this to take a view instead of a viewer.
function GetImageData(view) {
    // interesting: When does it need to be set?
    //ctx.imageSmoothingEnabled = true; 
    // useful for debugging
    //ctx.putImageData(imagedata, dx, dy);
    var cam = view.Camera;
    var width = Math.floor(cam.ViewportWidth);
    var height = Math.floor(cam.ViewportHeight);
    var ctx  = view.Context2d;
    var data = ctx.getImageData(0,0,width,height);
    data.Camera = new Camera();
    data.Camera.DeepCopy(view.Camera);
    data.__proto__ = new ImageData();
    data.IncX = 4;
    data.width = width;
    data.height = height;
    data.IncY = data.IncX * data.width;
    return data;
}



// Mark edges visited so we do not create the same contour twice.
// I cannot mark the pixel cell because two contours can go through the same cell.
// Note:  I have to keep track of both the edge and the direction the contour leaves
// the edge.  The backward direction was to being contoured because the starting
// edge was already marked.  The order of the points here matters.  Each point
// marks 4 edges.
ImageData.prototype.MarkEdge = function (x0,y0, x1,y1) {
    if ( ! this.EdgeMarks) {
        var numTemplates = Math.round((this.width)*(this.height));
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



//--------------------------------
// iso contouring from canvas data

// Helper method.
// Trace contour one direction until it ends or circles back.
// Return a list of points.
// There is some extra complexity to trace both directions...
// (both in and out marking of edges).
function TraceIsoContourDirection(data, x0,y0, x1,y1, threshold, direction) {
    var s0 = (data.GetIntensity(x0, y0) - threshold) * direction;
    var s1 = (data.GetIntensity(x1, y1) - threshold) * direction;
    if ((s0 > 0 && s1 > 0) || (s0 <= 0 && s1 <= 0)) {
        // No contour crosses this edge.
        return false;
    }

    // I am looking to distinguish light versus dark objects.
    // Always trace contours right handed.
    if ( s0 > 0 ) {
        // swap 0 and 1
        var tmp = x1;
        x1 = x0;
        x0 = tmp;
        tmp = y1;
        y1 = y0;
        y0 = tmp;
        tmp = s1;
        s1 = s0;
        s0 = tmp;
    }

    // Leaving the edge (-,+)
    if (data.MarkEdge(x0,y0, x1,y1)) {
        return false;
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

    // Now start tracing the contour.
    // Initialize the line with the countour end on edge 0-1.
    var k = s0/(s0-s1);
    // Polyline was about half a pixel off.
    var polyLine = [[x0+(xr*k)+0.5, y0+(yr*k)+0.5]];
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
        // Get the other corner values.
        s2 = (data.GetIntensity(x2, y2) - threshold) * direction;
        if (! (s2 > 0)) { 
            s3 = (data.GetIntensity(x3, y3) - threshold) * direction;
            if ( ! (s3 > 0)) {
                // Entering the edge (+,-)
                if (data.MarkEdge(x1,y1, x3,y3)) {
                    // We need to check both edge directions (in and out)
                    // Note the reverse order of the points
                    return polyLine;
                }
                // The new propoagating edge is 1-3.
                k = s1/(s1-s3);
                // Polyline was about half a pixel off.
                polyLine.push([x1+(xu*k)+0.5, y1+(yu*k)+0.5]);
                // point 1 does not change. p0 moves to p3.
                s0=s3;  x0=x3;  y0=y3;
                // Rotate the coordinate system.
                xr = -xu; yr = -yu;
                xu = -yr; yu = xr;
            } else { // The new propoagating edge is 2-3.
                // Entering the edge (+,-)
                if (data.MarkEdge(x3,y3, x2,y2)) {
                    // We need to check both edge directions
                    // Note the reverse order of the points
                    return polyLine;
                }
                k = s2/(s2-s3);
                // Polyline was about half a pixel off.
                polyLine.push([x0+xu+(xr*k)+0.5, y0+yu+(yr*k)+0.5]);
                // No rotation just move "up"
                s0=s2;  x0=x2;  y0=y2;
                s1=s3;  x1=x3;  y1=y3;
            }
        } else { // The new propoagating edge is 0-2.
            // Entering the edge (+,-)
            if (data.MarkEdge(x2,y2, x0,y0)) {
                // We need to check both edge directions
                // Note the reverse order of the points
                return polyLine;
            }
            k = s0/(s0-s2);
            // Polyline was about half a pixel off.
            polyLine.push([x0+(xu*k)+0.5, y0+(yu*k)+0.5]);
            // point 0 does not change. P1 moves to p2.
            s1=s2;  x1=x2;  y1=y2;
            // Rotate the basis.
            xr = xu; yr = yu;
            xu = -yr; yu = xr;
        }
        // Leaving the edge (-,+)
        if (data.MarkEdge(x0,y0, x1,y1)) {
            return polyLine;
        }
        // Edge marking detects the end of the loop.
    }
    // while(true) neve exits.
}


// Find the entire (both directions) that crosses an edge.
function SeedIsoContour(data, x0,y0, x1,y1, threshold) {
    this.Bounds = [0,-1,0,-1];
    var polyLineRight = TraceIsoContourDirection(data, x0,y0, x1,y1, threshold,1);
    if ( ! polyLineRight) {
        // No contour through this edge.
        return false;
    }
    var polyLineLeft = TraceIsoContourDirection(data, x1,y1, x0,y0, threshold,-1);
    if ( ! polyLineLeft || polyLineLeft.length < 2) {
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
    var contour;
    var area;
    var bestContour;
    var bestArea = 0;
    for (var y = 1; y < data.height; ++y) {
        for (var x = 1; x < data.width; ++x) {
            // Look for contours crossing the xMax and yMax edges.
            var xContour = SeedIsoContour(data, x,y, x-1,y, threshold);
            if (xContour) {
                contour = new Contour();
                contour.Camera = data.Camera;
                contour.SetPoints(xContour);
                area = contour.GetArea();
                if (area > bestArea) {
                    bestArea = area;
                    bestContour = contour;
                }
            }
            var yContour = SeedIsoContour(data, x,y, x,y-1, threshold);
            if (yContour) {
                contour = new Contour();
                contour.Camera = data.Camera;
                contour.SetPoints(yContour);
                area = contour.GetArea();
                if (area > bestArea) {
                    bestArea = area;
                    bestContour = contour;
                }
            }
        }
    }

    return bestContour;
}


// Inplace (not considering tmp data).
// Radius = 0 => single point / no smoothing,  1 => kernel dim 3 ...
function SmoothDataAlphaRGB(inData, radius) {
    if (radius < 1) {return;}
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




function ComputeIntensityHistogram(data, ignoreWhite) {
    if (ignoreWhite === undefined) {
        ignoreWhite = false;
    }

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
        if ( ! ignoreWhite || intensity < 254 ) {
            if (intensity > 5) { // black background on some slides.
                ++hist[intensity];
            }
        }
        ++i;
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

var YPLOT = undefined;
//  Lets compute and correlate X and y histograms of curvature.
// CURVATURE is too noisey to use for a reliable feature.
// FAILED (Worse than pixel mean).
function ComputeContourShiftCurvatureHistagram(contour1, contour2) {
    // Get the bounds of both contours.
    var bds1 = ComputeContourBounds(contour1);
    var bds2 = ComputeContourBounds(contour2);
    bds1[0] = Math.min(bds1[0], bds2[0]);
    bds1[1] = Math.max(bds1[1], bds2[1]);
    bds1[2] = Math.min(bds1[2], bds2[2]);
    bds1[3] = Math.max(bds1[3], bds2[3]);


    if ( ! YPLOT) {
        YPLOT = new HistogramPlot(20, bds1[2], 100, bds1[3]-bds1[2]);
        YPLOT.Axis = 1;
        YPLOT.Symmetrc = true;
    } else {
        YPLOT.Clear();
        YPLOT.SetSize(20, bds1[2], 100, bds1[3]-bds1[2]);
    }

    MakeContourPolyline(contour1, VIEWERS[0]);
    MakeContourPolyline(contour2, VIEWERS[1]);

    var hist1 = ComputeContourSpatialCurvatureHistogram(contour1, bds1[0], bds1[1], 0);
    var hist2 = ComputeContourSpatialCurvatureHistogram(contour2, bds1[0], bds1[1], 0);
    var dx = CorrelateHistograms(hist1, hist2) * (bds1[1]-bds1[0]) / 256;

    hist1 = ComputeContourSpatialCurvatureHistogram(contour1, bds1[2], bds1[3], 1);
    hist2 = ComputeContourSpatialCurvatureHistogram(contour2, bds1[2], bds1[3], 1);

    YPLOT.Draw(hist1, "green");
    YPLOT.Draw(hist2, "red");

    var dy = CorrelateHistograms(hist1, hist2) * (bds1[3]-bds1[2]) / 256;

    return [dx, dy];
}



// Does not modify either of the contours.
// Minimize distance between contours.
// Returns shift and rotation.
function AlignContours(contour1, contour2) {
    // Get the bounds of both contours.
    var bds1 = ComputeContourBounds(contour1);
    var bds2 = ComputeContourBounds(contour2);
    // Combine them (union).
    bds1[0] = Math.min(bds1[0], bds2[0]);
    bds1[1] = Math.max(bds1[1], bds2[1]);
    bds1[2] = Math.min(bds1[2], bds2[2]);
    bds1[3] = Math.max(bds1[3], bds2[3]);
    // Exapnd the contour by 10%
    var xMid = (bds1[0] + bds1[1])*0.5;
    var yMid = (bds1[2] + bds1[3])*0.5;
    bds1[0] = xMid + 1.1*(bds1[0]-xMid);
    bds1[1] = xMid + 1.1*(bds1[1]-xMid);
    bds1[2] = yMid + 1.1*(bds1[2]-yMid);
    bds1[3] = yMid + 1.1*(bds1[3]-yMid);

    var distMap = new DistanceMap(bds1, 2);
    distMap.AddContour(contour1);
    distMap.Update();

    // No rotation yet.
    var dx = 0, dy = 0;
    for (var i = 0; i < 100; ++i) {
        var sumx = 0, sumy = 0, sumd = 0;
        for (var j = 0; j < contour2.length; ++j) {
            var x = contour2[j][0] - dx;
            var y = contour2[j][1] - dy;
            var grad = distMap.GetGradient(x,y);
            sumx += grad[0];
            sumy += grad[1];
            sumd += distMap.GetDistance(x,y);
        }
        sumd = sumd / contour2.length;
        if (sumd < 1.0) { sumd = 1.0;}
        var mag = Math.abs(sumx) + Math.abs(sumy);
        if (mag > sumd) {
            sumx = sumx * sumd / mag;
            sumy = sumy * sumd / mag;
        }
        dx += sumx;
        dy += sumy;
    }

    var trans = {delta :[dx,dy]};
    return trans;
}

// This first transforms contour2 to match contour1 with a rigid transformation.
// It then creates a mesh and allows it to deform for a better match.
// contour2 is modified to match contour1.
function DeformableAlignContours(contour1, contour2, rigid) {
    // First translate the contour2 to have the same center as
    // contour1. This will make the map smaller and more useful!
    var center1 = contour1.GetCenter();
    var center2 = contour2.GetCenter();
    contour2.Translate([center1[0]-center2[0], center1[1]-center2[1]]);

    // Get the bounds of both contours.
    var bds1 = contour1.GetBounds();
    var bds2 = contour2.GetBounds();
    // Combine them (union).
    bds1[0] = Math.min(bds1[0], bds2[0]);
    bds1[1] = Math.max(bds1[1], bds2[1]);
    bds1[2] = Math.min(bds1[2], bds2[2]);
    bds1[3] = Math.max(bds1[3], bds2[3]);
    // Exapnd the contour by 10%
    var xMid = (bds1[0] + bds1[1])*0.5;
    var yMid = (bds1[2] + bds1[3])*0.5;
    bds1[0] = xMid + 1.1*(bds1[0]-xMid);
    bds1[1] = xMid + 1.1*(bds1[1]-xMid);
    bds1[2] = yMid + 1.1*(bds1[2]-yMid);
    bds1[3] = yMid + 1.1*(bds1[3]-yMid);

    // Compute a spacing so we can use contours in world coordiantes.
    // (used to be 2)
    var spacing = Math.sqrt((bds1[1]-bds1[0])*(bds1[3]-bds1[2])/100000.0);
    var distMap = new DistanceMap(bds1, spacing);
    distMap.AddContour(contour1);
    distMap.Update();

    // Offset ?? Debug this later.
    //contour2 = DecimateContour(contour2, 1);
    RigidAlignContourWithMap(contour2, distMap);
    if ( ! rigid) {
        DeformableAlignContourWithMap(contour2, distMap);
    }
}


// This shifts and rotates the contour to match the distance map.
// It returns the shift and roll, but the contour is also transformed.
function RigidAlignContourWithMap(contour, distMap) {
    // Compute center of rotation
    var c2 = contour.GetCenter();
    var xCenter = c2[0], yCenter = c2[1];

    var xSave = xCenter;
    var ySave = yCenter;
    var roll = 0;

    for (var i = 0; i < 200; ++i) {
        var sumx = 0, sumy = 0, totald = 0;
        var sumr = 0, totalr = 0;
        for (var j = 0; j < contour.Length(); ++j) {
            var x = contour.GetPoint(j)[0];
            var y = contour.GetPoint(j)[1];
            var grad = distMap.GetGradient(x,y);
            sumx += grad[0];
            sumy += grad[1];
            totald += distMap.GetDistance(x,y);
            // For rotation
            var dx = (x-xCenter);
            var dy = (y-yCenter);
            var cross = dx*grad[1]-dy*grad[0];
            sumr += cross;
            totalr += Math.sqrt(dx*dx + dy*dy);
        }
        totald = totald / contour.Length();
        if (totald < 1.0) { totald = 1.0;}
        var mag = Math.abs(sumx) + Math.abs(sumy);
        if (mag > totald) {
            sumx = sumx * totald / mag;
            sumy = sumy * totald / mag;
        }
        sumr /= (totalr * 100);
        contour.Transform([-sumx,-sumy], [xCenter,yCenter], sumr);
        xCenter -= sumx;
        yCenter -= sumy;
        roll += sumr;
    }

    var c1 = contour.GetCenter();
    console.log("2: "+(c2[0]-c1[0])+", "+(c2[1]-c1[1]));


    return {delta: [xCenter-xSave, yCenter-ySave], roll: roll, c0: [xSave,ySave], c1: [xCenter, yCenter]}; // Return rotation?
}

var ITERATIONS = 5000;
var EDGE_FACTOR = 0.2;
var GRADIENT_FACTOR = 0.03;
// Convert the contour into a mesh for internal use, but modify contour2
// to match contour1.
function DeformableAlignContourWithMap(contour, distMap) {
    var mesh = new TriangleMesh();

    if (contour.GetArea() < 0) {
        contour.Points.reverse();
    }

    mesh.TriangulateContour(contour);
    mesh.CreateFullMesh();
    while (mesh.ConditionEdgeRotate()) {}
    mesh.Update();
    DEBUG_MESH2 = new TriangleMesh();
    DEBUG_MESH2.DeepCopy(mesh);

    // Create an array to hold the sumation of forces on the points.
    var numPoints = (mesh.PointCoordinates.length / 2);
    var dPoints = new Array(numPoints);

    for (var i = 0; i < ITERATIONS; ++i) {
        // First move points down gradient.
        var idx = 0;
        for (var j = 0; j < numPoints; ++j) {
            var pt = mesh.GetPointCoordinates(j);
            var grad = distMap.GetGradient(pt[0], pt[1]);

            // Better to apply the gradient and edge forces separately
            //dPoints[idx++] = -grad[0] * GRADIENT_FACTOR;
            //dPoints[idx++] = -grad[1] * GRADIENT_FACTOR;
            mesh.PointCoordinates[idx]   -= grad[0] * GRADIENT_FACTOR;
            mesh.PointCoordinates[idx+1] -= grad[1] * GRADIENT_FACTOR;
            dPoints[idx] = 0;
            dPoints[idx+1] = 0;
            idx += 2;
        }

        // Apply forces due to edge displacement.
        for (var j = 0; j < mesh.Edges.length; ++j) {
            var edge = mesh.Edges[j];
            if ( edge === undefined) {
                continue;
            }
            var p0 = mesh.GetPointCoordinates(edge.vert0);
            var p1 = mesh.GetPointCoordinates(edge.vert1);
            var dx = p1[0]-p0[0], dy = p1[1]-p0[1];
            var length = Math.sqrt(dx*dx+dy*dy);
            var k = EDGE_FACTOR*(length - edge.length)/(2*length);
            idx = edge.vert0 << 1;
            dPoints[idx++] += dx*k;
            dPoints[idx] += dy*k;
            idx = edge.vert1 << 1;
            dPoints[idx++] -= dx*k;
            dPoints[idx] -= dy*k;
        }
        // Apply the delta sums to the points/
        var idx = 0;
        for (var j = 0; j < numPoints; ++j) {
            mesh.PointCoordinates[idx] += dPoints[idx++];
            mesh.PointCoordinates[idx] += dPoints[idx++];
        }
    }
    var idx = 0;
    for (var ptIdx = 0; ptIdx < contour.Length(); ++ptIdx) {
        contour.SetPoint(ptIdx, [mesh.PointCoordinates[idx++],
                                 mesh.PointCoordinates[idx++]]);
    }

    mesh.Update();
    DEBUG_MESH1 = mesh;
}



// Choose a threshold: 
//    (This step can be a problem.  It latches onto white vs slide when zoomed out)
// Find the largest contour 
//    (We might want to find multiple tissue sections).
// Create a distance map from contour in viewer1.  
//    (We may want to make inside 0 distance).
//    We may want to use euclidian instead of cityblock.
// Rigid align contour2 to contour1
// Deformable align contour2 to contour1.
var DEBUG_CONTOUR1;
var DEBUG_CONTOUR2a;
var DEBUG_CONTOUR2b;
var DEBUG_MESH1;
var DEBUG_MESH2;
var DEBUG_TRANS;
function testDebug() {
    //MakeContourPolyline(DEBUG_CONTOUR1, VIEWERS[0]);
    //MakeContourPolyline(DEBUG_CONTOUR2a, VIEWERS[1]);
    //MakeContourPolyline(DEBUG_CONTOUR2b, VIEWERS[0]);

    DEBUG_MESH1.ConvertPointsToWorld(VIEWERS[0]);
    VIEWERS[0].AddShape(DEBUG_MESH1);

    DEBUG_MESH2.ConvertPointsToWorld(VIEWERS[1]);
    VIEWERS[1].AddShape(DEBUG_MESH2);
}


var WAITING;

function DeformableAlignViewers() {
    var note = NOTES_WIDGET.GetCurrentNote();
    var trans = note.ViewerRecords[note.StartIndex + 1].Transform;
    if ( ! trans) {
        return;
    }

    var viewport = VIEWERS[1].GetViewport();
    var left = viewport[0] + (viewport[2]/2) - 40;
    var top = viewport[1] + (viewport[3]/2) - 40;
    if (WAITING === undefined) {
        WAITING = $('<img>')
            .appendTo('body')
            .attr("src", "/webgl-viewer/static/circular.gif")
            .attr("alt", "waiting...")
            .hide()
            .addClass("sa-view-align-waiting");
    }

    WAITING
        .show()
        .css({'left': left+'px',
              'top': top+'px'});

    // Trying to get the waiting icon to appear....
    window.setTimeout(
        function () {
            // Resample contour for a smaller mesh.
            var spacing = 3;

            var viewer = VIEWERS[0];
            var data1 = GetImageData(viewer.MainView);
            SmoothDataAlphaRGB(data1, 2);
            var histogram1 = ComputeIntensityHistogram(data1, true);
            var threshold1 = PickThreshold(histogram1);
            var contour1 = LongestContour(data1, threshold1);

            viewer = VIEWERS[1];
            var data2 = GetImageData(viewer.MainView);
            SmoothDataAlphaRGB(data2, 2);
            var histogram2 = ComputeIntensityHistogram(data2, true);
            var threshold2 = PickThreshold(histogram2);
            var contour2 = LongestContour(data2, threshold2);
            contour2.RemoveDuplicatePoints(spacing);

            // Save a copy of the contour before it is transformed.
            // We need before and after to make correlation points.
            var originalContour2 = new Contour();
            originalContour2.DeepCopy(contour2);
            DeformableAlignContours(contour1, contour2);

            DEBUG_CONTOUR1 = contour1;
            DEBUG_CONTOUR2a = originalContour2;
            DEBUG_CONTOUR2b = contour2

            // Now clear all correlation points in the stack sections.

            // Remove all correlations.
            //trans.Correlations = [];
            // Remove all correlations visible in the window.
            var cam = VIEWERS[0].GetCamera();
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
            DEBUG_TRANS = trans;

            // Now make new correlations from the transformed contour.
            var targetNumCorrelations = 40;
            var skip = Math.ceil(contour2.Length() / targetNumCorrelations);
            for (var i = 2; i < originalContour2.Length(); i += skip) {
                var viewport = VIEWERS[0].GetViewport();
                var pt1 = VIEWERS[0].ConvertPointViewerToWorld(contour2.GetPoint(i)[0],
                                                            contour2.GetPoint(i)[1]);
                var viewport = VIEWERS[1].GetViewport();
                var pt2 = VIEWERS[1].ConvertPointViewerToWorld(originalContour2.GetPoint(i)[0],
                                                            originalContour2.GetPoint(i)[1]);
                var cor = new PairCorrelation();
                cor.SetPoint0(pt1);
                cor.SetPoint1(pt2);
                trans.Correlations.push(cor);
            }

            console.log("Finished alignment");
            // Syncronize views
            NOTES_WIDGET.SynchronizeViews(0, note);

            WAITING.hide();

            eventuallyRender();
        }, 10);
}

// An idea.  Use an existing polyline instead of a new iso contour.
// Select polylines by color.
// Something is not work.  
// I expect two things: Coordinate system (no) or spacing (no).
// !!!!!!!!!!!!!

function AlignPolylines() {
    var viewer1 = VIEWERS[0];
    var viewer2 = VIEWERS[1];
    for (var i1 = 0; i1 < viewer1.WidgetList.length; ++i1) {
        var pLine1 = viewer1.WidgetList[i1];
        if (pLine1 instanceof PolylineWidget) {
            var c1 = pLine1.Shape.OutlineColor;
            //
            for (var i2 = 0; i2 < viewer2.WidgetList.length; ++i2) {
                var pLine2 = viewer2.WidgetList[i2];
                if (pLine2 instanceof PolylineWidget) {
                    var c2 = pLine2.Shape.OutlineColor;
                    if (Math.abs(c1[0]-c2[0]) < 0.01 &&
                        Math.abs(c1[1]-c2[1]) < 0.01 &&
                        Math.abs(c1[2]-c2[2]) < 0.01) {
                        AlignPolylines2(pLine1, pLine2);
                    }
                }
            }
        }
    }
}


function AlignPolylinesByColor(rgb) {
    // Get the polyline from viewer1
    var viewer1 = VIEWERS[0];
    var pLine1 = null;
    for (var i1 = 0; i1 < viewer1.WidgetList.length; ++i1) {
        var w1 = viewer1.WidgetList[i1];
        if (w1 instanceof PolylineWidget && w1.Shape.Points.length > 0) {
            var c1 = w1.Shape.OutlineColor;
            if (Math.abs(c1[0]-rgb[0]) < 0.05 &&
                Math.abs(c1[1]-rgb[1]) < 0.05 &&
                Math.abs(c1[2]-rgb[2]) < 0.05) {
                pLine1 = w1;
            }
        }
    }
    if (! pLine1) { return;}

    // Get the polyline from viewer2
    var viewer2 = VIEWERS[1];
    var pLine2 = null;
    for (var i2 = 0; i2 < viewer2.WidgetList.length; ++i2) {
        var w2 = viewer2.WidgetList[i2];
        if (w2 instanceof PolylineWidget && w1.Shape.Points.length > 0) {) {
            var c2 = w2.Shape.OutlineColor;
            if (Math.abs(c2[0]-rgb[0]) < 0.05 &&
                Math.abs(c2[1]-rgb[1]) < 0.05 &&
                Math.abs(c2[2]-rgb[2]) < 0.05) {
                pLine2 = w2;
            }
        }
    }
    if (! pLine2) { return;}

    AlignPolylines2(pLine1, pLine2);
}


function AlignPolylines2(pLine1, pLine2) {
    var note = NOTES_WIDGET.GetCurrentNote();
    var trans = note.ViewerRecords[note.StartIndex + 1].Transform;
    if ( ! trans) {
        return;
    }

    var contour1 = new Contour();
    contour1.World = true;
    contour1.SetPoints(pLine1.Shape.Points);
    //contour1.Camera = VIEWER1.GetCamera();
    //contour1.WorldToViewer();
    //contour1.Resample(1);
    contour1.Resample(10);

    var contour2 = new Contour();
    contour2.World = true;
    contour2.SetPoints(pLine2.Shape.Points);
    //contour2.Camera = VIEWER2.GetCamera();
    //contour2.WorldToViewer();
    //contour2.Resample(1);
    contour2.Resample(10);

    // A resample is probably better here.
    contour2.RemoveDuplicatePoints(1.0);

    // Save a copy of the contour before it is transformed.
    // We need before and after to make correlation points.
    var originalContour2 = new Contour();
    originalContour2.DeepCopy(contour2);
    // Lets try rigid.
    DeformableAlignContours(contour1, contour2, true);

            DEBUG_CONTOUR1 = contour1;
            DEBUG_CONTOUR2a = originalContour2;
            DEBUG_CONTOUR2b = contour2


    // Remove all correlations visible in the window.
    /*
    var cam = VIEWERS[0].GetCamera();
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
    */

            DEBUG_TRANS = trans;

    // Now make new correlations from the transformed contour.
    var targetNumCorrelations = 20;
    var skip = Math.ceil(contour2.Length() / targetNumCorrelations);
    for (var i = 2; i < originalContour2.Length(); i += skip) {
        // TODO: delete this
        //var viewport = VIEWERS[0].GetViewport(); // does this do anything!!!!
        //var pt1 = VIEWERS[0].ConvertPointViewerToWorld(contour2.GetPoint(i)[0],
        //                                               contour2.GetPoint(i)[1]);
        var pt1 = contour2.GetPoint(i);

        //var viewport = VIEWERS[1].GetViewport();
        //var pt2 = VIEWERS[1].ConvertPointViewerToWorld(originalContour2.GetPoint(i)[0],
        //                                               originalContour2.GetPoint(i)[1]);
        var pt2 = originalContour2.GetPoint(i);
        var cor = new PairCorrelation();
        cor.SetPoint0(pt1);
        cor.SetPoint1(pt2);
        trans.Correlations.push(cor);
    }

    console.log("Finished alignment");
    // Syncronize views
    NOTES_WIDGET.SynchronizeViews(0, note);

    eventuallyRender();
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


// I cannot make any good assumptions about percentages because
// a bounding box could be tight around the tissue.
// Just look for the minimum histogram value in the correct
// intensity range.
function PickThreshold(hist) {
    return PickThresholdContaining(hist,10);
}            

// Threshold has to be above val.
function PickThresholdContaining(hist, val) {
    var best = -1;
    var bestIdx = -1;

    var integral = HistogramIntegral(hist);
    var max = integral[integral.length - 1];
    for (idx = val; idx < hist.length-10; ++idx) {
        // Compute a metric for a good threshold.
        var goodness = 0;
        // > 10%, < 90%
        var tmp = integral[idx]/max;
        if (tmp > 0.1 && tmp < 0.9) {
            // Pick a gap (low point) in the histogram.
            goodness = 1.0 / (hist[idx]+1);
            // Pick a high value over a low value
            goodness *= Math.exp(idx / 8);  // tried 4-8, all very similar.
        }
        if (goodness > best) {
            best = goodness;
            bestIdx = idx;
        }
    }

    return bestIdx;
}            

// Threshold is choosen from the range, but not equal to the min or max.
function PickThresholdFromRange(hist, min, max) {
    var best = -1;
    var bestIdx = -1;

    var integral = HistogramIntegral(hist);
    var max = integral[integral.length - 1];
    for (idx = val; idx < hist.length-10; ++idx) {
        // Compute a metric for a good threshold.
        var goodness = 0;
        // > 10%, < 90%
        var tmp = integral[idx]/max;
        if (tmp > 0.1 && tmp < 0.9) {
            // Pick a gap (low point) in the histogram.
            goodness = 1.0 / (hist[idx]+1);
            // Pick a high value over a low value
            goodness *= Math.exp(idx / 8);  // tried 4-8, all very similar.
        }
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
function ThresholdData(data, threshold, high) {
    if (high == undefined) { high = true; }
    var xSum = 0;
    var ySum = 0;
    var count = 0;
    var i = 0;
    for (var y = 0; y < data.height; ++y) {
        for (var x = 0; x < data.width; ++x) {
            var intensity = Math.floor((data.data[i] + data.data[i+1] + data.data[i+2]) / 3);
            if ((intensity > threshold) == high) { // Make it semi opaque black
                data.data[i] = data.data[i+1] = data.data[i+2] = 0;
                data.data[i+3] = 255;
            } else {
                ++count;
                xSum += x;
                ySum += y;
                data.data[i+3] = 0;
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



    
    
// Shared histogram, So we can execute tests multiple times.
var PLOT = undefined;



function intensityHistogram(viewer, color, min, max) {
    if ( ! PLOT) {
        PLOT= new HistogramPlot('50%','50%', 400, 200);
    }
    PLOT.Clear();

    var data1 = GetImageData(viewer.MainView);
    var histogram1 = ComputeIntensityHistogram(data1);
    PLOT.Draw(histogram1, color, min, max);
    var d = HistogramIntegral(histogram1);
    PLOT.Draw(d, "red", min, max);
}

// Takes around a second for r = 3;
function testSmooth(radius) {
    var data1 = GetImageData(VIEWERS[0].MainView);
    SmoothDataAlphaRGB(data1,radius);
    DrawImageData(VIEWERS[0], data1);
    delete data1;
}


// Peal away background
// then run pc again.
// Results: Interesting, but not useful.  
// Some tissue has the same value as background. I would need a fill to segment background better.
// Deep red tissue keeps blue red component from dominating.
function testPrincipleComponentEncoding() {
    var data1 = GetImageData(VIEWERS[0].MainView);
    SmoothDataAlphaRGB(data1,2);
    //EncodePrincipleComponent(data1);
    var histogram1 = ComputeIntensityHistogram(data1);
    var threshold1 = PickThreshold(histogram1);
    // This masks background by making it tranparent.
    ThresholdData(data1, threshold1);
    // This ignores transparent pixels.
    EncodePrincipleComponent(data1);


    DrawImageData(VIEWERS[1], data1);
    delete data1;
}


// Worked sometimes, but not always.
function testAlignTranslationPixelMean() {
    var data1 = GetImageData(VIEWERS[0].MainView);
    var histogram1 = ComputeIntensityHistogram(data1);
    var threshold1 = PickThreshold(histogram1);
    ThresholdData(data1, threshold1);
    //DrawImageData(VIEWERS[0], data1);

    var data2 = GetImageData(VIEWERS[1].MainView);
    var histogram2 = ComputeIntensityHistogram(data2);
    var threshold2 = PickThreshold(histogram2);
    ThresholdData(data2, threshold2);
    //DrawImageData(VIEWERS[1], data2);

    var dx = data2.mid_x - data1.mid_x;
    var dy = data2.mid_y - data1.mid_y;

    // Convert from pixels to slide coordinates
    var cam = VIEWERS[0].GetCamera();
    var viewport = VIEWERS[0].GetViewport();
    dx = dx * cam.Height / viewport[3];
    dy = dy * cam.Height / viewport[3];

    VIEWERS[0].AnimateTranslate(-dx/2, -dy/2);
    VIEWERS[1].AnimateTranslate(dx/2, dy/2);

    console.log("Translate = (" + dx + ", " + dy + ")" );
}




// Allign mean of thresholded pixels worked ok but not for zoomed in.
// Try aligning the contour.
// Mean of the contour points did not work.
// Histogram of contour curvature did not work.
// Minimize distance between two contours. (Distance map to keep distance computation fast).
function testAlignTranslation(debug) {
    var viewer1 = VIEWERS[0];
    var data1 = GetImageData(viewer1.MainView);
    SmoothDataAlphaRGB(data1, 2);
    var histogram1 = ComputeIntensityHistogram(data1, true);
    var threshold1 = PickThreshold(histogram1);
    var contour1 = LongestContour(data1, threshold1);

    var viewer2 = VIEWERS[1];
    var viewport2 = viewer2.GetViewport();
    var data2 = GetImageData(viewer2.MainView);
    SmoothDataAlphaRGB(data2, 2);
    var histogram2 = ComputeIntensityHistogram(data2, true);
    var threshold2 = PickThreshold(histogram2);
    var contour2 = LongestContour(data2, threshold2);

    var trans = AlignContours(contour1, contour2);

    if (debug) {
        contour1 = DecimateContour(contour1,1);
        TranslateContour(contour2,[-trans.delta[0],-trans.delta[1]]);
        contour2 = DecimateContour(contour2,1);
        MakeContourPolyline(contour1, VIEWERS[0]);
        MakeContourPolyline(contour2, VIEWERS[0]);
    }


    // Convert from pixels to slide coordinates
    var cam = VIEWERS[0].GetCamera();
    var viewport = VIEWERS[0].GetViewport();
    var dx = trans.delta[0] * cam.Height / viewport[3];
    var dy = trans.delta[1] * cam.Height / viewport[3];

    VIEWERS[0].AnimateTranslate(-dx/2, -dy/2);
    VIEWERS[1].AnimateTranslate(dx/2, dy/2);


    // Ignore rotation for now.

    console.log("Translate = (" + dx + ", " + dy + ")" );
}

function testAlignTranslation2(debug) {
    var viewer1 = VIEWERS[0];
    var data1 = GetImageData(viewer1.MainView);
    SmoothDataAlphaRGB(data1, 2);
    var histogram1 = ComputeIntensityHistogram(data1, true);
    var threshold1 = PickThreshold(histogram1);
    var contour1 = LongestContour(data1, threshold1);

    var viewer2 = VIEWERS[1];
    var data2 = GetImageData(viewer2.MainView);
    SmoothDataAlphaRGB(data2, 2);
    var histogram2 = ComputeIntensityHistogram(data2, true);
    var threshold2 = PickThreshold(histogram2);
    var contour2 = LongestContour(data2, threshold2);

    var trans = AlignContours(contour1, contour2);

    if (debug) {
        contour1 = DecimateContour(contour1,1);
        TranslateContour(contour2,[-trans.delta[0],-trans.delta[1]]);
        contour2 = DecimateContour(contour2,1);
        MakeContourPolyline(contour1, VIEWERS[0]);
        MakeContourPolyline(contour2, VIEWERS[0]);
    }


    // Convert from pixels to slide coordinates
    var cam = VIEWERS[0].GetCamera();
    var viewport = VIEWERS[0].GetViewport();
    var dx = trans.delta[0] * cam.Height / viewport[3];
    var dy = trans.delta[1] * cam.Height / viewport[3];

    VIEWERS[0].AnimateTranslate(-dx/2, -dy/2);
    VIEWERS[1].AnimateTranslate(dx/2, dy/2);


    // Ignore rotation for now.

    console.log("Translate = (" + dx + ", " + dy + ")" );
}



// Moving toward deformation of contour
function testAlignTranslation() {
    var viewer1 = VIEWERS[0];
    var data1 = GetImageData(viewer1.MainView);
    SmoothDataAlphaRGB(data1, 5);
    var histogram1 = ComputeIntensityHistogram(data1, true);
    var threshold1 = PickThreshold(histogram1);
    var contour1 = LongestContour(data1, threshold1);

    //MakeContourPolyline(contour1, VIEWERS[0]);

    var viewer2 = VIEWERS[1];
    var data2 = GetImageData(viewer2.MainView);
    SmoothDataAlphaRGB(data2, 5);
    var histogram2 = ComputeIntensityHistogram(data2, true);
    var threshold2 = PickThreshold(histogram2);
    var contour2 = LongestContour(data2, threshold2);

    //MakeContourPolyline(contour2, VIEWERS[1]);

    // Make a copy of contour2.
    //var contour2copy = new Array(contour2.length);
    //for (var i = 0; i < contour2copy; ++i) {
    //    contour2copy[i] = [contour2[i][0], contour2[i][1]];
    //}

    var trans = RigidAlignContours(contour1, contour2);

    // Move center to 0 (keep track of focal point
    var dx = (viewport2[2]*0.5) - trans.c0[0];
    var dy = (viewport2[3]*0.5) - trans.c0[1];
    // Rotate
    var c = Math.cos(trans.roll);
    var s = Math.sin(trans.roll);

    var tx = c*dx + s*dy;
    var ty = -s*dx + c*dy;
    // Move origin to c1
    tx += trans.c1[0];
    ty += trans.c1[1];

    // Compute focal point delta.
    tx = tx - (viewport2[2]*0.5);
    ty = ty - (viewport2[3]*0.5);

    // Convert from pixels to slide coordinates
    var cam = VIEWERS[0].GetCamera();
    var tx = tx * cam.Height / viewport2[3];
    var ty = ty * cam.Height / viewport2[3];

    VIEWERS[1].AnimateTransform(-tx, -ty, -trans.roll);
}



function testDistanceMapContour() {
    var viewer1 = VIEWERS[0];
    var data1 = GetImageData(viewer1.MainView);
    SmoothDataAlphaRGB(data1, 5);
    var histogram1 = ComputeIntensityHistogram(data1);
    var threshold1 = PickThreshold(histogram1);
    var contour1 = LongestContour(data1, threshold1);
    MakeContourPolyline(contour1, VIEWERS[0]);

    var bds1 = ComputeContourBounds(contour1);
    var distMap = new DistanceMap(bds1, 1);
    distMap.AddContour(contour1);
    distMap.Update();
    distMap.Draw(VIEWERS[1]);
}

function testDistanceMapThreshold() {
    var viewer1 = VIEWERS[0];
    var ctx1 = viewer1.MainView.Context2d;
    var data1 = GetImageData(viewer1.MainView);
    SmoothDataAlphaRGB(data1, 2);
    var histogram1 = ComputeIntensityHistogram(data1);
    var threshold1 = PickThreshold(histogram1);
    ThresholdData(data1, threshold1, false);
    ctx1.putImageData(data1,0,0);

    var bds1 = [0, data1.width, 0, data1.height];
    var distMap = new DistanceMap(bds1, 1);
    distMap.AddImageData(data1);
    distMap.Update();
    distMap.Draw(VIEWERS[1]);
}

// Lets try the contour trick.
// Smooth, contour, find the longest contour
// I could perform connectivity before or after contouring.
// lets do it after.  Scan for edge. Trace the edge. Mark pixels that have already been contoured.
function testContour(threshold) {
    var viewer = VIEWERS[0];
    var data1 = GetImageData(viewer.MainView);
    SmoothDataAlphaRGB(data1, 2);
    var points = LongestContour(data1, threshold);
    ContourRemoveDuplicatePoints(points, 1);
    if (points.length > 1) {
        var plWidget = MakeContourPolyline(points, VIEWERS[0]);
    }
}


// Make a triangle mesh from a contour
// This works great.
// Rigid alignment should work the same (hold off on using distance map from threshold).
// The to implement deformable registration.
function testContourMesh(deci) {
    if (deci == undefined) {
        deci = 3;
    }
    var viewer = VIEWERS[1];
    var data1 = GetImageData(viewer.MainView);
    SmoothDataAlphaRGB(data1, 2);
    var histogram1 = ComputeIntensityHistogram(data1, true);
    var threshold1 = PickThreshold(histogram1);
    var points = LongestContour(data1, threshold1);
    ContourRemoveDuplicatePoints(points, 3);
    //points = DecimateContour(points, deci); // just for testing.

    CONTOUR = points;

    var mesh = new TriangleMesh();
    mesh.TriangulateContour(points);
    mesh.CreateFullMesh();
    while (mesh.ConditionEdgeRotate()) {}
    mesh.Update();


    mesh.ConvertPointsToWorld(viewer);
    viewer.AddShape(mesh);
    eventuallyRender();
}


// !!! This works on needle core biopsies !!!
// A couple of issues: Many iterations are required.  Better to have smaller steps and more iterations.
// It should really be executed on the server for performance.
// We may want to add internal points to the mesh for contour stability.


// Get two contours and deform second to match the first.
// Next step, get alignment points from contour.
function testDeformableAlign(spacing) {
    if (spacing == undefined) {
        spacing = 3;
    }
    var viewer = VIEWERS[0];
    var data1 = GetImageData(viewer.MainView);
    SmoothDataAlphaRGB(data1, 2);
    var histogram1 = ComputeIntensityHistogram(data1, true);
    var threshold1 = PickThreshold(histogram1);
    var contour1 = LongestContour(data1, threshold1);
    MakeContourPolyline(contour1, VIEWERS[0]);

    viewer = VIEWERS[1];
    var data2 = GetImageData(viewer.MainView);
    SmoothDataAlphaRGB(data2, 2);
    var histogram2 = ComputeIntensityHistogram(data2, true);
    var threshold2 = PickThreshold(histogram2);
    var contour2 = LongestContour(data2, threshold2);
    ContourRemoveDuplicatePoints(contour2, spacing);

    DeformableAlignContours(contour1, contour2);
    MakeContourPolyline(contour2, VIEWERS[0]);
    eventuallyRender();
}

//==============================================================================
// Find all the sections on a slide (for a stack).
// hagfish
// I either have to keep the camera with the contour, or translate the
// contour into world coordinate points.  The second sounds easier.



// Find the best contour given an estimate of center and area..
function FindSectionContour (data, center, area) {
    var smooth = 2; // is this really necesary?  It is expensive.
    SmoothDataAlphaRGB(data, smooth);

    // I could estimate area from the histogram, but there maybe multiple pieces.
    var histogram = ComputeIntensityHistogram(data, true);
    var threshold = PickThreshold(histogram);

    var contours = GetHagFishContours(data, threshold, min, max);

    return contours;
}




// We might constrain sequential contours to be similar areas.
// This could eliminate the need for manual verification.
function FindSectionContours(data, val) {
    var smooth = 2; // is this really necesary?  It is expensive.
    var min = 0.00002;
    var max = 0.5;
    if ( ! val) { val = 10; }

    SmoothDataAlphaRGB(data, smooth);
    var histogram = ComputeIntensityHistogram(data, true);
    var threshold = PickThresholdContaining(histogram, val);
    var contours = GetHagFishContours(data, threshold, min, max);

    return contours;
}



// The area threshold is important so we skip the internal structures.
// Returns all contours that circle areas greater than the areaFraction of the image.
function GetHagFishContours(data, threshold, areaMin, areaMax) {
    var imageArea = data.width * data.height;
    var areaMin = areaMin * imageArea;
    var areaMax = areaMax * imageArea;

    // Loop over the cells.
    // Start at the bottom left: y up then x right.
    // (The order of sections on the hagfish slides.)
    var longContours = [];
    for (var x = 1; x < data.width; ++x) {
        for (var y = data.height-1; y > 0; --y) {
            // Look for contours crossing the xMax and yMax edges.
            var xContour = SeedIsoContour(data, x,y, x-1,y, threshold);
            if (xContour) {
                var c = new Contour();
                c.Camera = data.Camera;
                c.Threshold = threshold;
                c.SetPoints(xContour);
                c.RemoveDuplicatePoints(2);
                var area = c.GetArea();
                if (area > areaMin && area < areaMax) {
                    console.log(area/ imageArea);
                    longContours.push(c);
                }
            }

            var yContour = SeedIsoContour(data, x,y, x,y-1, threshold);
            if (yContour) {
                c = new Contour();
                c.Camera = data.Camera;
                c.Threshold = threshold;
                c.SetPoints(yContour);
                c.RemoveDuplicatePoints(2);
                area = c.GetArea();
                if (area > areaMin && area < areaMax) {
                    console.log(area / imageArea);
                    longContours.push(c);
                }
            }
        }
    }
    return longContours;
}


var HAGFISH_CONTOURS;
var VERIFIED_HAGFISH_CONTOURS = [];
var HAGFISH_STACK;
var LAST_HAGFISH_CONTOUR;
var HAGFISH_THRESHOLD;

function initHagfish() {
    HAGFISH_STACK = new Note();
    HAGFISH_STACK.Id = "5523dad0dd98b56d82d6d062";
    HAGFISH_STACK.Title = "AutoStack";
    HAGFISH_STACK.CoordinateSystem = "Pixel";
    HAGFISH_STACK.HiddenTitle = "AutoStack";
    HAGFISH_STACK.HideAnnotations = false;
    HAGFISH_STACK.Type = "Stack";
    HAGFISH_STACK.ViewerRecords = [];

    LAST_HAGFISH_CONTOUR = undefined;
    VIEWERS[0].WidgetList = [];
    eventuallyRender();
}


function acceptHagfishContours() {
    console.log("Accept");
    VERIFIED_HAGFISH_CONTOURS = HAGFISH_CONTOURS;
    HAGFISH_CONTOURS = [];

    VIEWERS[0].WidgetList = [];
    eventuallyRender();
    addVerifiedHagFishContours();
    console.log("Finished: adding contours.");
}


// We might constrain sequential contours to be similar areas.
// This could eliminate the need for manual verification.
function findHagFishSections(smooth, min, max) {
    VIEWERS[0].WidgetList = [];
    eventuallyRender();

    VERIFIED_HAGFISH_CONTOURS = [];

    var viewer1 = VIEWERS[0];
    var data1 = GetImageData(viewer1.MainView);
    SmoothDataAlphaRGB(data1, smooth);
    var histogram1 = ComputeIntensityHistogram(data1, true);
    var threshold1 = PickThreshold(histogram1);
    var contours = GetHagFishContours(data1, threshold1, min, max);

    // Sort the contours.
    HAGFISH_CONTOURS = [];
    while (contours.length) {
        var bds = contours[0].GetBounds();
        var bestIdx = 0;
        for (var i = 1; i < contours.length; ++i) {
            var bds2 = contours[i].GetBounds();
            if (bds2[2] > bds[3] && bds2[0] < bds[1]) {
                bds = bds2;
                bestIdx = i;
            }
        }
        HAGFISH_CONTOURS.push(contours.splice(bestIdx,1)[0]);
    }

    // render the first contour red
    for (var i = 0; i < HAGFISH_CONTOURS.length; ++i) {
        var red = i / HAGFISH_CONTOURS.length;
        HAGFISH_CONTOURS[i].MakePolyline([red,0,1.0-red], VIEWERS[0].MainView);
    }
    eventuallyRender();
}


function alignHagFishSections(record, contour1, contour2) {
    var trans = new PairTransformation();
    record.Transform = trans;

    var alignedContour2 = new Contour();
    alignedContour2.DeepCopy(contour2);

    // Contour2 returns the result.  It is transformed into contour1's
    // coordinate sytem, Save a copy of contour2.
    //DeformableAlignContours(contour1, alignedContour2);
    RigidAlignContours(contour1, alignedContour2);

    var c1 = contour1.GetCenter();
    var ac2 = alignedContour2.GetCenter();
    console.log("shift: "+(ac2[0]-c1[0])+", "+(ac2[1]-c1[1]));

    // I want to see the alignment for debugging.
    alignedContour2.MakePolyline([1,0,1], VIEWERS[0].MainView);

    // Now make new correlations from the transformed contour.
    var targetNumCorrelations = 40;
    var skip = Math.ceil(contour2.Length() / targetNumCorrelations);
    for (var i = 2; i < contour2.Length(); i += skip) {
        var pt1 = alignedContour2.GetPoint(i);
        if (contour1.Camera) { // aligned contour2 is in contour1
            // coordinate system.
            pt1 = contour1.Camera.ConvertPointViewerToWorld(pt1[0],pt1[1]);
        }
        var pt2 = contour2.GetPoint(i);
        if (contour2.Camera) {
            pt2 = contour2.Camera.ConvertPointViewerToWorld(pt2[0],pt2[1]);
        }

        var cor = new PairCorrelation();
        cor.SetPoint0(pt1);
        cor.SetPoint1(pt2);
        trans.Correlations.push(cor);
    }
}


function addVerifiedHagFishContours() {
    for (var i = 0; i < VERIFIED_HAGFISH_CONTOURS.length; ++i) {
        var imgData = VIEWERS[0].GetCache().Image;
        var contour = VERIFIED_HAGFISH_CONTOURS[i];
        var bds = contour.GetBounds();
        var record = new ViewerRecord();
        record.Camera = {};
        var fp = [(bds[0]+bds[1])/2, (bds[2]+bds[3])/2];
        record.Camera.Height = bds[3]-bds[2];
        record.Camera.Width = bds[2]-bds[0];
        record.Camera.Roll = 0.0;
        if (contour.Camera) {
            fp = contour.Camera.ConvertPointViewerToWorld(fp[0],fp[1]);
            var c =contour.Camera.ConvertPointViewerToWorld(bds[0],bds[2]);
            record.Camera.Width = Math.abs((fp[0]-c[0])*2);
            record.Camera.Height = Math.abs((fp[1]-c[1])*2);
            record.Camera.Roll = contour.Camera.Roll;
        }
        record.Camera.SetFocalPoint(fp);
        record.Image = imgData;
        record.Database = imgData.db;
        if (LAST_HAGFISH_CONTOUR) {
            alignHagFishSections(record,
                                 LAST_HAGFISH_CONTOUR,
                                 VERIFIED_HAGFISH_CONTOURS[i]);
        }
        LAST_HAGFISH_CONTOUR = VERIFIED_HAGFISH_CONTOURS[i];

        HAGFISH_STACK.ViewerRecords.push(record);
    }
}

// debugging
var HAGFISH_DATA;
var HAGFISH_DATA_STACK;


function saveHagFishStack() {
    var d = new Date();
    // Save this users notes in the user specific collection.
    var noteObj = JSON.stringify(HAGFISH_STACK.Serialize(true));
    $.ajax({
        type: "post",
        url: "/webgl-viewer/saveviewnotes",
        data: {"note" : noteObj,
               "date" : d.getTime()},
        success: function(data,status) {
            HAGFISH_DATA = data;
            HAGFISH_DATA_STACK = new Note();
            HAGFISH_DATA_STACK.Load(data);
            saDebug("Auto Stack Saved");
        },
        error: function() { saDebug( "AJAX - error() : saveviewnotes" ); },
    });
}



// !!!!!!!!!!!!!!!!!!!! I had to skip the auto highres step.
// I lost the viewer that created the image.  I sould probably 
// have the camera translate points rather than the viewer. (done)
// Change the low res contours into a high res contour.
var NEW_HAGFISH_CONTOURS = [];
function getHighResHagFishContours() {
    if (HAGFISH_CONTOURS.length == 0) {
        HAGFISH_CONTOURS = NEW_HAGFISH_CONTOURS;
        NEW_HAGFISH_CONTOURS = [];
        return;
    }
    var bds = HAGFISH_CONTOURS[0].GetBounds();
    var scale = (bds[1]-bds[0])/500;
    var roll = VIEWERS[0].GetCamera().Roll;
    VIEWERS[0].GetImage(bds, roll, scale, getHighResHagFishContours2);
}

// We need two methods because we have to wait for tiles to stop loading.
function getHighResHagFishContours2(data) {
    var threshold = HAGFISH_CONTOURS[0].Threshold;
    NEW_HAGFISH_CONTOURS.push(LongestContour(data, threshold));
    HAGFISH_CONTOURS.slice(1);
    // Do the next section.
    getHighResHagFishContours();
}


// Tasks.
// Finish the contour widget.  
//   - should we store the contour object?
//   - should we save it in screen or world coordinates?
// Convert viewer record stacks into note slides and back.
// Generate contours for those sections that do not have them.
// Add a mode state to the stack creator
//   - Single centered.
//   - Left to Right
//   - Right to left
//   - Up / down
//   - allopecia





// Toggle: Each section / viewer record has a contour widget.
// Slide view, looks through the entire stack and finds all sections
//   with the same slide.  Make a new note with multiple children notes.
// Fowarding through the stack slides?
// if a section does not have a contour, generate one.



// Process:
// 1: User selects detect.
// 2: Contours are detected and the viewer is put in a proofreading mode.
// 3: User deletes, merges and adds contours.
// 4: user changes the order.
// 5: user hits accept.
// 6: Critera for future filtering of contours is updated.

// For auto stack, maybe show each section in stack and edit individually.
// I would still need the contourWidget.
// Inserting missed sections would be difficult.
// I really need to toggle between individual display and slide display.




// TODO: 
// - Number contours to show the order (Special contour widget?)
// - Rectangle widget to create a new contour, or merge multiple contours, or
//     cut a contour.
// - Delete a contour.







