//==============================================================================
// This object abstract the warp transformation between a pair of sections.

function PairTransformation () {
    this.Correlations = [];
}

PairTransformation.prototype.AddCorrelation = function(pt0, pt1) {
    index = this.Correlations.length;
    this.Correlations.push({"point0": [pt0[0],pt0[1]],
                            "point1": [pt1[0],pt1[1]]});
    return index;
}

// Nearest neighbor.
PairTransformation.prototype.ForwardTransform = function(pt0) {
    this.DeltaRotation = 0;
    if (this.Correlations.length == 0) {
        return pt0;
    }

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
        if ( ! dist1 || dist < dist1) {
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
            if (! dist2 || dist < dist2) {
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
PairTransformation.prototype.ReverseTransform = function(pt1) {
    this.DeltaRotation = 0;
    if (this.Correlations.length == 0) {
        return pt1;
    }
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
        if ( ! dist1 || dist < dist1) {
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
            if ( ! dist2 || dist < dist2) {
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

