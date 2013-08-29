
// Make this a singlton (effectively) for now.
// Two levels of caching and pruning.
// Image without an associated texture map.
// Texture maps (scarcer resource).



var TIME_STAMP = 0;
var NUMBER_OF_TILES = 0;
var NUMBER_OF_TEXTURES = 0;
var MAXIMUM_NUMBER_OF_TILES = 50000;
var MAXIMUM_NUMBER_OF_TEXTURES = 5000;
var PRUNE_TIME_TILES = 0;
var PRUNE_TIME_TEXTURES = 0;
var CACHES = [];

// Keep a queue of tiles to load so we can sort them as
// new requests come in.
var LOAD_QUEUE = [];
var LOADING_COUNT = 0;
var LOADING_MAXIMUM = 4;
var LOAD_TIMEOUT_ID = 0;

var LOAD_PROGRESS_MAX = 0;
var PROGRESS_BAR = null;

function InitProgressBar () {
  if (PROGRESS_BAR) { return;}
  PROGRESS_BAR = $("<div>")
   .appendTo('body')
   .css({"position":"absolute",
         "z-index" : "2",
         "bottom"     : "0px",
         "left"    : "0px",
         "height"  : "3px",
         "width"   : "50%",
         "background-color" : "#404060"});
}



function AdvanceTimeStamp() {
  ++TIME_STAMP;
}

function GetCurrentTime() {
  return TIME_STAMP;
}

// Prunning could be rethought to avoid so much depdency on the cache.
function Prune() {
  var prune = false;
  if (NUMBER_OF_TILES >= MAXIMUM_NUMBER_OF_TILES) {
    // Overflow may be possible after running for a while.
    if (PRUNE_TIME_TILES > TIME_STAMP) {
      PRUNE_TIME_TILES = 0;
    } 
    // Advance the prune threshold.
    PRUNE_TIME_TILES += 0.05 * (TIME_STAMP - PRUNE_TIME_TILES);
    prune = true;
  }
  
  if (NUMBER_OF_TEXTURES >= MAXIMUM_NUMBER_OF_TEXTURES) {
    // Overflow may be possible after running for a while.
    if (PRUNE_TIME_TEXTURES > TIME_STAMP) {
      PRUNE_TIME_TEXTURES = 0;
    } 
    // Advance the prune threshold.
    PRUNE_TIME_TEXTURES += 0.05 * (TIME_STAMP - PRUNE_TIME_TEXTURES);
    prune = true;
  }
  
  if (prune) {  
    for (i in CACHES) {
      cache = CACHES[i];
      cache.PruneTiles();
    }
  }
}


// We could chop off the lowest priority tiles if the queue gets too long.
function LoadQueueAdd(tile) {
  // Record that the tile is used (for prioritizing loading and pruning).
  // Mark all lower res tiles so they will be loaded inthe correct order.
  var tmp = tile;
  while (tmp && tmp.TimeStamp != TIME_STAMP) {
    tmp.TimeStamp = TIME_STAMP;
    tmp = tmp.Parent;
  }

  if (tile.LoadState != 0) { // == 2
    // This tiles is already in the load queue or loaded.
    return;
  }
  
  // Now I want progressive loading so I will not add tiles to the queue if their parents are not completely loaded.
  // I could add all parent and children to the que at the same time, but I have seen children rendered before parents
  // (levels are skipped in progresive updata).  So, lets try this.
  // Now that I am prioritizing the queue on the tiles time stamp and level,  the previous issues should be resolved.
  if (tile.Parent) {
    if (tile.Parent.LoadState == 0) {
      // Not loaded and not in the queue.
      return LoadQueueAdd(tile.Parent);
    }
    if (tile.Parent.LoadState == 1) {
      // Not loaded but in the queue
      return;
    }
  }
  
  // The tile's parent is loaded.  Add the tile to the load queue.
  
  tile.LoadState = 1;
  // Add the tile at the front of the queue.
  LOAD_QUEUE.push(tile);
  
  LoadQueueUpdate();
}

// Push the best tile to the end of the queue.
function PushBestToLast() {
  // Do a sort pass (pushing high priority items to the end.
  var t0 = LOAD_QUEUE[0];
  for (var i = 1; i < LOAD_QUEUE.length; ++i) {
    var t1 = LOAD_QUEUE[i];
    var swap = false;
    if (t1 != null) {
      if (t0 == null) { 
        swap = true; 
      } else if (t0.TimeStamp > t1.TimeStamp) { 
        swap = true; 
      } else if (t0.TimeStamp == t1.TimeStamp && t0.Level < t1.Level) { 
        swap = true;
      }
    }
    if (swap) {
      // Swap the pair.
      LOAD_QUEUE[i] = t0;
      LOAD_QUEUE[i-1] = t1;
    } else {
      t0 = t1;
    }
  }
}



// I need a way to remove tiles from the queue when they are deleted.
// I know this is inefficient.
function LoadQueueRemove(tile) {
  var length = LOAD_QUEUE.length;
  for (var i = 0; i < length; ++i) {
    if (LOAD_QUEUE[i] == tile) {
      tile.LoadState = 0; 
      LOAD_QUEUE[i] = null;
      return;
    }
  }
}

// We will have some number of tiles loading at one time.
// Take the first N tiles from the queue and start loading them.
// Too many and we cannot abort loading.
// Too few and we will serialize loading.
function LoadQueueUpdate() {

  while (LOADING_COUNT < LOADING_MAXIMUM && 
         LOAD_QUEUE.length > 0) {
    PushBestToLast();     
    var tile = LOAD_QUEUE.pop();
    // For debugging
    //this.PendingTiles.push(tile);
    if (tile != null) {
      tile.StartLoad(tile.Cache);
      tile.LoadState = 2; // Loading.
      ++LOADING_COUNT;
    }
  }

  // Observed bug: If 4 tile requests never return, loading stops.
  // Do a time out to clear this hang.
  if (LOAD_TIMEOUT_ID) {
    clearTimeout(LOAD_TIMEOUT_ID);
    LOAD_TIMEOUT_ID = 0;
  }
  if (LOADING_COUNT) {
    LOAD_TIMEOUT_ID = setTimeout(function(){LoadTimeout();}, 1000);
  }

  if (PROGRESS_BAR) {
    if (LOAD_PROGRESS_MAX < LOAD_QUEUE.length) {
      LOAD_PROGRESS_MAX = LOAD_QUEUE.length;
    }
    var width = (100 * LOAD_QUEUE.length / LOAD_PROGRESS_MAX).toFixed();
    width = width + "%";
    PROGRESS_BAR.css({"width" : width});
    // Reset maximum
    if (LOAD_QUEUE.length == 0) {
      LOAD_PROGRESS_MAX = 0;
    }
  }
}

// Issue: Tiles call this method when their image gets loaded.
// How does the tile know which cache it belongs too.
// Marks a tile as loaded so another can start.
function LoadQueueLoaded(tile) {
    --LOADING_COUNT;
    tile.LoadState = 3; // Loaded
    LoadQueueUpdate();
}

// This is called if their was a 404 image not found error.
function LoadQueueError(tile) {
  --LOADING_COUNT;
  LoadQueueUpdate();
}

