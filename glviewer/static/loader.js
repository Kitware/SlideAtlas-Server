
// Make this a singlton (effectively) for now.
// Two levels of caching and pruning.
// Image without an associated texture map.
// Texture maps (scarcer resource).




function InitProgressBar () {
  if (SA.ProgressBar) { return;}
  SA.ProgressBar = $("<div>")
   .appendTo('body')
   .addClass("sa-view-progress-bar");
}



function AdvanceTimeStamp() {
  ++SA.TimeStamp;
}

function GetCurrentTime() {
  return SA.TimeStamp;
}

// Prunning could be rethought to avoid so much depdency on the cache.
function Prune() {
  var prune = false;
  if (SA.NumberOfTiles >= SA.MaximumNumberOfTiles) {
    // Overflow may be possible after running for a while.
    if (SA.PruneTimeTiles > SA.TimeStamp) {
      SA.PruneTimeTiles = 0;
    }
    // Advance the prune threshold.
    SA.PruneTimeTiles += 0.05 * (SA.TimeStamp - SA.PruneTimeTiles);
    prune = true;
  }

  if (SA.NumberOfTextures >= SA.MaximumNumberOfTextures) {
    // Overflow may be possible after running for a while.
    if (SA.PruneTimeTextures > SA.TimeStamp) {
      SA.PruneTimeTextures = 0;
    }
    // Advance the prune threshold.
    SA.PruneTimeTextures += 0.05 * (SA.TimeStamp - SA.PruneTimeTextures);
    prune = true;
  }

  if (prune) {
    for (i in SA.Caches) {
      cache = SA.Caches[i];
      cache.PruneTiles();
    }
  }
}

function ClearQueue() {
    for (var i = 0; i < SA.LoadQueue.length; ++i) {
        var tile = SA.LoadQueue[i];
        if (tile) {
            tile.LoadState = 0;
        }
    }
    SA.LoadQueue = [];
    LoadQueueUpdate();
}

// You have to call LoadQueueUpdate after adding tiles.
// We could chop off the lowest priority tiles if the queue gets too long.
// Simply add the tile to the queue.
function LoadQueueAddTile(tile) {
    if (tile.Level == 0) {
        console.log("LoadQueueAddTile " + tile.Name);
    }
    if (tile.LoadState == 0 || tile.LoadState == 4) {
        // New tile or error
        tile.LoadState = 1;
        // Add the tile at the front of the queue.
        SA.LoadQueue.push(tile);
    }
}

// Push the best tile to the end of the queue.
function PushBestToLast() {
  // Do a sort pass (pushing high priority items to the end.
  var t0 = SA.LoadQueue[0];
  for (var i = 1; i < SA.LoadQueue.length; ++i) {
    var t1 = SA.LoadQueue[i];
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
      SA.LoadQueue[i] = t0;
      SA.LoadQueue[i-1] = t1;
    } else {
      t0 = t1;
    }
  }
}



// I need a way to remove tiles from the queue when they are deleted.
// I know this is inefficient.
function LoadQueueRemove(tile) {
  var length = SA.LoadQueue.length;
  for (var i = 0; i < length; ++i) {
    if (SA.LoadQueue[i] == tile) {
      tile.LoadState = 0;
      SA.LoadQueue[i] = null;
      return;
    }
  }
}


function LoadTimeout() {
  // 4 images requests are too slow.  Reset
  // I do not know which requests failed so I cannot mak another request.
  // TODO: Remember loading tiles (even if only for debugging).
  SA.LoadingCount = 0;
  LoadQueueUpdate();
}

// We will have some number of tiles loading at one time.
// Take the first N tiles from the queue and start loading them.
// Too many and we cannot abort loading.
// Too few and we will serialize loading.
function LoadQueueUpdate() {
    if (SA.LoadingCount < 0) {
        // Tiles must have arrived after timeout.
        SA.LoadingCount = 0;
    }
    while (SA.LoadingCount < SA.LoadingMaximum &&
           SA.LoadQueue.length > 0) {
        PushBestToLast();
        var tile = SA.LoadQueue.pop();
        // For debugging
        //this.PendingTiles.push(tile);
        if (tile != null && tile.LoadState == 1) {
            tile.StartLoad(tile.Cache);
            tile.LoadState = 2; // Loading.
            ++SA.LoadingCount;
        }
    }

    // Observed bug: If 4 tile requests never return, loading stops.
    // Do a time out to clear this hang.
    if (SA.LoadTimeoutId) {
        clearTimeout(SA.LoadTimeoutId);
        SA.LoadTimeoutId = 0;
    }
    if (SA.LoadingCount) {
        SA.LoadTimeoutId = setTimeout(function(){LoadTimeout();}, 1000);
    }

    if (SA.ProgressBar) {
        if (SA.LoadProgressMax < SA.LoadQueue.length) {
            SA.LoadProgressMax = SA.LoadQueue.length;
        }
        var width = (100 * SA.LoadQueue.length / SA.LoadProgressMax).toFixed();
        width = width + "%";
        SA.ProgressBar.css({"width" : width});
        // Reset maximum
        if (SA.LoadQueue.length == 0) {
            SA.LoadProgressMax = 0;
        }
    }

    if (SA.FinishedLoadingCallbacks.length > 0 &&
        SA.LoadQueue.length == 0 && SA.LoadingCount == 0) {
        var tmp = SA.FinishedLoadingCallbacks.slice(0); // copy
        SA.FinishedLoadingCallbacks = [];
        for (var i = 0; i < tmp.length; ++i) {
            (tmp[i])();
        }
    }
}

function AddFinishedLoadingCallback(callback) {
    SA.FinishedLoadingCallbacks.push(callback);
}

function ClearFinishedLoadingCallbacks() {
    SA.FinishedLoadingCallbacks = [];
}



// Issue: Tiles call this method when their image gets loaded.
// How does the tile know which cache it belongs too.
// Marks a tile as loaded so another can start.
function LoadQueueLoaded(tile) {
    --SA.LoadingCount;
    tile.LoadState = 3; // Loaded
    LoadQueueUpdate();
}

// This is called if their was a 404 image not found error.
function LoadQueueError(tile) {
  tile.LoadState = 4; // Error Loading
  --SA.LoadingCount;
  LoadQueueUpdate();
}

