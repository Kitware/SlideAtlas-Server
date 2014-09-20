



//==============================================================================
// A correlation is just a pair of matching points from two sections.
// Abstract the correlation so we have an api for getting points.
// Currently, stack has direct access to correlation ivars / points.
// The api will make forward and back transformations use the same code.


function PairCorrelation () {
    this.point0 = [0,0];
    this.point1 = [0,0];
}



PairCorrelation.prototype.Serialize = function() {
    return {"point0": [this.point0[0],this.point0[1]],
            "point1": [this.point1[0],this.point1[1]]};
}


PairCorrelation.prototype.Load = function(obj) {
    this.point0[0] = obj.point0[0];
    this.point0[1] = obj.point0[1];
    this.point1[0] = obj.point1[0];
    this.point1[1] = obj.point1[1];
}


PairCorrelation.prototype.GetPoint = function(idx) {
    if (idx == 0) {
        return this.GetPoint0();
    } else if (idx == 1) {
        return this.GetPoint1();
    } 
    alert("Bad correlation point index: " + idx);
    return [0,0];
}


PairCorrelation.prototype.GetPoint0 = function() {
    return [this.point0[0], this.point0[1]];
}

PairCorrelation.prototype.SetPoint0 = function(pt) {
    this.point0[0] = pt[0];
    this.point0[1] = pt[1];
}


PairCorrelation.prototype.GetPoint1 = function() {
    return [this.point1[0], this.point1[1]];
}

PairCorrelation.prototype.SetPoint1 = function(pt) {
    this.point1[0] = pt[0];
    this.point1[1] = pt[1];
}



//==============================================================================
// This object abstract the warp transformation between a pair of sections.

function PairTransformation () {
    this.Correlations = [];
}



PairTransformation.prototype.Serialize = function() {
    return JSON.parse(JSON.stringify(this));
}


PairTransformation.prototype.Load = function(obj) {
    for (ivar in obj) {
        this[ivar] = obj[ivar];
    }
}


PairTransformation.prototype.AddCorrelation = function(pt0, pt1) {
    index = this.Correlations.length;
    var corr = new PairCorrelation();
    corr.SetPoint0(pt0);
    corr.SetPoint1(pt1);
    this.Correlations.push(corr);
    return index;
}


PairTransformation.prototype.Load = function(obj) {
    if (obj.View0) {
        this.View0 = obj.View0;
    } //else {   // one time change database.
    //    this.View0 = VIEWS[i]._id;
    //}
    if (obj.View1) {
        this.View1 = obj.View1;
    }// else {    // one time change database.
    //    this.View1 = VIEWS[i+1]._id;
    //}
    for (var i = 0; i < obj.Correlations.length; ++i) {
        var correlation = new PairCorrelation();
        correlation.Load(obj.Correlations[i]);
        this.Correlations.push(correlation);
    }
}


// Weighted neighbor.
// Until we implement a closed form solution:
// Compute the weighted average of points as center of rotation and translation.
PairTransformation.prototype.WeightedTransform = function(idx0, idx1, fp, sigma) {
    if (this.Correlations.length == 0) {
        return fp;
    }

    if (sigma === undefined) {
        sigma = 20000;
    }

    var pt0,pt1;
    var x,y;
    var sigma2 = sigma*sigma;
    var sumGauss = 0.0;
    var sum0 = [0.0, 0.0];
    var sum1 = [0.0, 0.0];
    for ( var i = 0; i < this.Correlations.length; ++i) {
        var correlation = this.Correlations[i];
        pt0 = correlation.GetPoint(idx0);
        pt1 = correlation.GetPoint(idx1);
        // Distance from the focal point being transformed (for weight)
        x = pt0[0] - fp[0];
        y = pt0[1] - fp[1];
        var dist2 = x*x + y*y;
        // Compute the gaussian
        var gauss = Math.exp(-dist2/sigma2);
        sumGauss += gauss;
        sum0[0] += gauss * pt0[0];
        sum0[1] += gauss * pt0[1];
        sum1[0] += gauss * pt1[0];
        sum1[1] += gauss * pt1[1];
    }
    sum0[0] = sum0[0] / sumGauss;
    sum0[1] = sum0[1] / sumGauss;
    sum1[0] = sum1[0] / sumGauss;
    sum1[1] = sum1[1] / sumGauss;

    // Now compute orientation.
    this.DeltaRotation = 0;
    if (this.Correlations.length <= 1) {
        // simple translation
        fp[0] += sum1[0] - sum0[0]; 
        fp[1] = sum1[1] - sum0[1];
        return fp;
    }

    // Compute rotation
    var roll = 0;
    var sumGauss = 0.0;
    var sumTheta = 0.0;
    for ( var i = 0; i < this.Correlations.length; ++i) {
        var correlation = this.Correlations[i];
        pt0 = correlation.GetPoint(idx0);
        pt1 = correlation.GetPoint(idx1);
        // Distance from the focal point (for weight).
        x = pt0[0] - fp[0];
        y = pt0[1] - fp[1];
        var dist = x*x + y*y;
        var gauss = Math.exp(-dist/sigma2);
        // Compute the two angles using the average centers.
        // angle 0:
        x = pt0[0] - sum0[0];
        y = pt0[1] - sum0[1];
        var angle0 = Math.atan2(x,y);
        // Compute distance for small angle consideration.
        var dist0 = x*x + y*y;
        // Angle 1:
        x = pt1[0] - sum1[0];
        y = pt1[1] - sum1[1];
        var angle1 = Math.atan2(x,y);
        // Compute distance for small angle consideration.
        var dist1 = x*x + y*y;

        // Now combine weights.
        gauss = gauss * Math.sqrt(Math.min(dist0, dist1));

        // Averaging angles is tricky because of cycles.
        // Assume all angles are small.
        var dAngle = (angle1 - angle0);
        var twoPi = Math.PI * 2;
        while (dAngle > Math.PI) { dAngle -= twoPi;}
        while (dAngle < -Math.PI) { dAngle += twoPi;}

        sumTheta += dAngle * gauss;
        sumGauss += gauss;
    }
    if (sumGauss > 0) {
        roll = (sumTheta / sumGauss);
    }
    // Silly converting this to degrees, but set camera takes degrees.
    // This is the second return value.
    this.DeltaRotation = (sumTheta / sumGauss) * (180.0 / 3.14159);

    // Since focal points are not at center of rotation (sum0 and sum1).
    // We need to translate center to origin, rotate, then translate back.
    fp[0] -= sum0[0];
    fp[1] -= sum0[1];
    var c = Math.cos(roll);
    var s = Math.sin(roll);
    // Left handed pixel coordinate system messes the rotation.
    var x = c*fp[0] + s*fp[1];
    var y = c*fp[1] - s*fp[0];

    fp[0] = x + sum1[0];
    fp[1] = y + sum1[1];

    return fp;
}


// Nearest neighbor.
PairTransformation.prototype.ForwardTransform = function(pt0, sigma) {
    this.DeltaRotation = 0;
    if (this.Correlations.length == 0) {
        return pt0;
    }

    return this.WeightedTransform(0, 1, pt0, sigma);



    // Find the two nearest correlations.
    // Nearest for translation, second nearest for rotation.
    var correlation1;
    var dist1;
    var correlation2; // second best
    var dist2;
    for ( var i = 0; i < this.Correlations.length; ++i) {
        var correlation = this.Correlations[i];
        x = pt0[0] - correlation.point0[0];
        y = pt0[1] - correlation.point0[1];
        var dist = x*x + y*y;
        if ( dist1 == undefined || dist < dist1) {
            // Save the one we are replacing as second best.
            if (dist1) {
                dist2 = dist1;
                correlation2 = correlation1;
            }
            // Save the new best.
            dist1 = dist;
            correlation1 = correlation;
        } else {
            // We also have to compare the second best.
            if ( dist2 == undefined || dist < dist2) {
                // Save the new second best.
                dist2 = dist;
                correlation2 = correlation;
            }
        }
    }

    if (this.Correlations.length > 1) {
        // Compute the delta rotation.
        var angle0 = Math.atan2(correlation2.point0[0] - correlation1.point0[0],
                                correlation2.point0[1] - correlation1.point0[1]);
        var angle1 = Math.atan2(correlation2.point1[0] - correlation1.point1[0],
                                correlation2.point1[1] - correlation1.point1[1]);
        this.DeltaRotation = (angle1 - angle0);
    }


    var x = pt0[0] - correlation1.point0[0];
    var y = pt0[1] - correlation1.point0[1];
    var c = Math.cos(this.DeltaRotation);
    var s = Math.sin(this.DeltaRotation)
    var rx =  c*x+s*y;
    var ry = -s*x+c*y;

    rx = correlation1.point1[0] + rx;
    ry = correlation1.point1[1] + ry;

    this.DeltaRotation = this.DeltaRotation * 180.0 / 3.14159;

    return [rx,ry];
}

// Nearest neighbor.
PairTransformation.prototype.ReverseTransform = function(pt1, sigma) {
    this.DeltaRotation = 0;
    if (this.Correlations.length == 0) {
        return pt1;
    }

    return this.WeightedTransform(1, 0, pt1, sigma);


    // Find the two nearest correlations.
    // Nearest for translation, second nearest for rotation.
    var correlation1;
    var dist1;
    var correlation2; // second best
    var dist2;
    for ( var i = 0; i < this.Correlations.length; ++i) {
        var correlation = this.Correlations[i];
        x = pt1[0] - correlation.point1[0];
        y = pt1[1] - correlation.point1[1];
        var dist = x*x + y*y;
        if ( dist1 == undefined || dist < dist1) {
            // Save the one we are replacing as second best.
            if (dist1) {
                dist2 = dist1;
                correlation2 = correlation1;
            }
            // Save the new best.
            dist1 = dist;
            correlation1 = correlation;
        } else {
            // We also have to compare the second best.
            if ( dist2 == undefined || dist < dist2) {
                // Save the new second best.
                dist2 = dist;
                correlation2 = correlation;
            }
        }
    }


    if (this.Correlations.length > 1) {
      // Compute the delta rotation.
      var angle1 = Math.atan2(correlation2.point1[0] - correlation1.point1[0],
                              correlation2.point1[1] - correlation1.point1[1]);
      var angle0 = Math.atan2(correlation2.point0[0] - correlation1.point0[0],
                              correlation2.point0[1] - correlation1.point0[1]);
      this.DeltaRotation = (angle0 - angle1);
    }

    var x = pt1[0] - correlation1.point1[0] + correlation1.point0[0];
    var y = pt1[1] - correlation1.point1[1] + correlation1.point0[1];


    var x = pt1[0] - correlation1.point1[0];
    var y = pt1[1] - correlation1.point1[1];
    var c = Math.cos(this.DeltaRotation);
    var s = Math.sin(this.DeltaRotation)
    var rx =  c*x+s*y;
    var ry = -s*x+c*y;

    rx = correlation1.point0[0] + rx;
    ry = correlation1.point0[1] + ry;

    this.DeltaRotation = this.DeltaRotation * 180.0 / 3.14159;

    return [rx,ry];

}

