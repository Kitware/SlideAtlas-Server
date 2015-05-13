// For automatic segmentation.  I need the tissue volume for crystal percentage.
// It is too dificult to segment manually.
// This class will grab data from the canvas and perform seeded marching sqaures.
// My plan: Start from a seed point. Move right until I find the contour (cross the threshold).
//    Start propagating marching squares until the loop closes.




function GetDataValue(d, x, y, threshold, insideOut) {
    if (x < 0 || x >= d.width ||
        y < 0 || y >= d.height) {
        return 0;
    }
    var idx = 4*(x + y*d.width);
    if (insideOut) {
        return threshold - (d.data[idx]+d.data[idx+1]+d.data[idx+2]);
    }
    return (d.data[idx]+d.data[idx+1]+d.data[idx+2]) - threshold;
}



// (x0,y0) is the seed value inside the object being contoured.
// Returns an array of coordinate pairs in the data coordinate system
function GenerateContourFromData(d, threshold, xSeed, ySeed) {
    var x1 = xSeed;
    var y1 = ySeed;
    if (x1 < 0 || x1 >= d.width ||
        y1 < 0 || y1 >= d.height) {
        alert("Seed outside viewport");
        return;
    }


    // 0,1,2,3 is the current square.
    // s0,s1,s2,s3 contains the scalar values being contoured.
    var s0, s1, s2, s3;
    // 0 point index.
    var x0, y0;
    // Coordinate system basis of the current square. r=right,u=up;
    var xr, yr;
    var xu, yu;
    xr = 1;
    yr = 0;
    xu = -yr;
    yu = xr;

    // Setup the scalar function so inside is positive,
    var insideOut = false;
    s1 = GetDataValue(d, x1, y1, threshold, insideOut);
    if (s1 == 0) {
        alert("Seed point on threshold.");
        return;
    }
    if (s1 < 0) {
        insideOut = true;
        s1 = -s1;
    }

    // Starting from the seed point, move the edge 0-1 to the
    // right until it crosses the contour. One iteration is guaranteed.
    while (s1 > 0) {
        x0 = x1;
        y0 = y1;
        s0 = s1;
        x1 = x0+xr;
        y1 = y0+yr;
        // GetValue handles boundaries so a contour is always found.
        s1 = GetDataValue(d, x1, y1, threshold, insideOut);
    }

    // Now start tracing the contour.
    // Initialize the loop with the countour end on edge 0-1. 
    var k = s0/(s0-s1);
    var loop = [[x0+(xr*k), y0+(yr*k)]];
    xSeed = x0;  ySeed = y0;
    while (true) {
        // Get the other corner values.
        s2 = GetDataValue(d, x0+xu, y0+yu, threshold, insideOut);
        if (s2 > 0) {
            s3 = GetDataValue(d, x1+xu, y1+yu, threshold, insideOut);
            if (s3 > 0) { // The new propoagating edge is 1-3.
                k = s1/(s1-s3);
                loop.push([x1+(xu*k), y1+(yu*k)]);
                // point 1 does not change. p0 moves to p3.
                s0 = s3;  x0 = x1+xu;  y0 = y1+yu;
                // Rotate the coordinate system.
                xr = -xu; yr = -yu;
                xu = -yr; yu = xr;
            } else { // The new propoagating edge is 2-3.
                k = s2/(s2-s3);
                loop.push([x0+xu+(xr*k), y0+yu+(yr*k)]);
                // No rotation just move "up"
                s0 = s2;  x0 += xu;  y0 += yu;
                s1 = s3;  x1 += xu;  y1 += yu;
            }
        } else { // The new propoagating edge is 0-2.
            k = s0/(s0-s2);
            loop.push([x0+(xu*k), y0+(yu*k)]);
            // point 0 does not change. P1 moves to p2.
            s1 = s2;  x1 = x0 + xu;  y1 = y0 + yu;
            // Rotate the basis.
            xr = xu; yr = yu;
            xu = -yr; yu = xr;
        }
        // Check for termination.
        // x0 annd basis has returned to its original position.
        if (x0 == xSeed && y0 == ySeed && xr == 1) {
            return loop;
        }
    }
    // Loop never exits.
}



// Lets try to find a contour that circles the seed.
function GenerateContourContainingSeed(d, threshold, xSeed, ySeed) {
    if (xSeed < 0 || xSeed >= d.width ||
        ySeed < 0 || ySeed >= d.height) {
        alert("Seed outside viewport");
        return;
    }

    // Setup the scalar function so inside is positive,
    var insideOut = false;
    var s1 = GetDataValue(d, xSeed, ySeed, threshold, insideOut);
    console.log("seed value : " + (s1+threshold));
    if (s1 == 0) {
        alert("Seed point on threshold.");
        return;
    }
    if (s1 < 0) {
        insideOut = true;
        s1 = -s1;
    }

    var x0, s0;
    var x1 = xSeed;
    // Start walking to the right until we find a contour
    // that encircles the seed point.
    while (true) {
        x0 = x1;
        x1 = x0+1;
        s0 = s1;
        // GetValue handles boundaries so a contour is always found.
        s1 = GetDataValue(d, x1, ySeed, threshold, insideOut);
        if (s0 > 0 && s1 <= 0) {
            var loop = GenerateContourFromData(d, threshold, x0, ySeed);
            // Lets just use bounds as an estimate for containment.
            var x = loop[0][0];
            var y = loop[0][1];
            var bounds = [x, x, y, y];
            for (var i = 1; i < loop.length; ++i) {
                var x = loop[i][0];
                var y = loop[i][1];
                if (bounds[0] > x) {bounds[0] = x;}
                if (bounds[1] < x) {bounds[1] = x;}
                if (bounds[2] > y) {bounds[2] = y;}
                if (bounds[3] < y) {bounds[3] = y;}
            }
            if (bounds[0] < xSeed && xSeed < bounds[1] &&
                bounds[2] < ySeed && ySeed < bounds[3]) {
                return loop;
            }
        }
    }
}



// The seed is in screen coordinates.
// TODO: Reduce the resolution. Keep the data for altering the threshold.
function GenerateContourFromViewer(viewer, threshold) {
    var xSeed = EVENT_MANAGER.LastMouseX;
    var ySeed = EVENT_MANAGER.LastMouseY;

    var ctx = viewer.MainView.Context2d;
    var viewport = viewer.GetViewport();
    var data = ctx.getImageData(0,0,viewport[2],viewport[3]);
    // threshold * 3 because we sum R+G+B.
    //var loop = GenerateContourFromData(data, threshold*3, xSeed, ySeed);
    var loop = GenerateContourContainingSeed(data, threshold*3, xSeed, ySeed);
    // Transform the loop points to slide coordinate system.
    var slideLoop = [];
    for (var i = 0; i < loop.length; ++i) {
        var viewPt = loop[i];
        slideLoop.push(viewer.ConvertPointViewerToWorld(viewPt[0], viewPt[1]));
    }

    // Create a polylineWidget from the loop.
    var plWidget = new PolylineWidget(viewer,false);
    plWidget.Shape.Points = slideLoop;
    plWidget.Shape.Closed = true;
    plWidget.LineWidth = 0;    
    plWidget.Shape.UpdateBuffers();
    eventuallyRender();
}








    
    
