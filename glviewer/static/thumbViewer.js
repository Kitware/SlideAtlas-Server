//==============================================================================
//  A small viewer just to display the state for conferencing.

// We would need to modify the View static positioning.



function ThumbViewer (width, height) {
    this.MainView1 = new View(viewport, 1);
    this.MainView1.OutlineColor = [0,0,0];
    this.MainView1.Camera.ZRange = [0,1];
    this.MainView1.Camera.ComputeMatrix();
    this.WidgetList1 = [];
}


// Copy everything from
ThumbViewer.prototype.CopyLocal = function() {



}



ThumbViewer.prototype.Draw = function() {
    // connectome
    if ( ! this.MainView1.Section) {
        return;
    }
    
    this.MainView1.DrawTiles();
    
    for(i in this.WidgetList1){
        this.WidgetList1[i].Draw(this.MainView, this.AnnotationVisibility);
    }
}

// Makes the viewer clean to setup a new slide...
ThumbViewer.prototype.Reset = function() {
    this.SetCache(null);
    this.WidgetList1 = [];
}


