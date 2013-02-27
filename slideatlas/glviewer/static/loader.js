
// Make this a singlton (effectively) for now.

var NUMBER_OF_TILES = 0;
var MAXIMUM_NUMBER_OF_TILES = 5000;
var PRUNE_TIME = 0;
var CACHES = [];

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
  if (tile.LoadState != 0) { // == 2
    // Loading
    return;
  }
  if (tile.LoadState == 1) { // Resort the queue.
    // If the tile is in the queue, remove it.
    for (var i = 0; i < LOAD_QUEUE.length; ++i) {
      if (LOAD_QUEUE[i] == tile) {
        LOAD_QUEUE[i] = null;
        break;
      }
    }
  }
  tile.LoadState = 1;
  // Add the tile at the front of the queue.
  LOAD_QUEUE.push(tile);
  LoadQueueUpdate();
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




