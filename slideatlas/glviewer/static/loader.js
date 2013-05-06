
// Make this a singlton (effectively) for now.

var TIME_STAMP = 0;
var NUMBER_OF_TILES = 0;
var MAXIMUM_NUMBER_OF_TILES = 5000;
var PRUNE_TIME = 0;
var CACHES = [];



function AdvanceTimeStamp() {
  ++TIME_STAMP;
}

function GetCurrentTime() {
  return TIME_STAMP;
}

// Prunning could be rethought to avoid so much depdency on the cache.
function Prune() {
  if (NUMBER_OF_TILES <= MAXIMUM_NUMBER_OF_TILES) {
    return;
  }
  // Overflow may be possible after running for a while.
  if (PRUNE_TIME > TIME_STAMP) {
    PRUNE_TIME = 0;
  } 
  
  // Advance the prune threshold.
  PRUNE_TIME += 0.05 * (TIME_STAMP - PRUNE_TIME);
  for (i in CACHES) {
    cache = CACHES[i];
    cache.PruneTiles();
  }
}


// Keep a queue of tiles to load so we can sort them as
// new requests come in.
var LOAD_QUEUE = [];
var LOADING_COUNT = 0;
var LOADING_MAXIMUM = 4;

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
    // Thie tiles is already in the load queue or loaded.
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
      if (t0 == null) { swap = true; }
      if (t0.TimeStamp > t1.TimeStamp) { swap = true; } 
      if (t0.TimeStamp == t1.TimeStamp && t0.Level < t1.Level) { swap = true;}
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




