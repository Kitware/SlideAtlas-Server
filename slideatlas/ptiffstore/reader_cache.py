import logging

from tiff_reader import TileReader
import collections

import flask

logger = logging.getLogger('slideatlas')


class LRUCache(object):
    """
    Least Recently Used (LRU) Cache of limited capacity
    """
    def __init__(self, capacity=0):

        if capacity == 0:
            # If capacity is supplied, use it,
            # else
            try:
                capacity_config = int(flask.current_app.config["READER_CACHE_LENGTH"])
                capacity = capacity_config
            except:
                capacity = 5

        self.capacity = capacity
        self.cache = collections.OrderedDict()

    def get(self, key):
        try:
            value = self.cache.pop(key)
            self.cache[key] = value
            return value
        except KeyError:
            return None

    def set(self, key, value):
        try:
            self.cache.pop(key)
        except KeyError:
            if len(self.cache) >= self.capacity:
                _, val = self.cache.popitem(last=False)
                val.close()

        self.cache[key] = value

cache = None


def make_reader(params):
    """
    returns a reader, updates the cache
    """
    global cache

    if cache is None:
        cache = LRUCache()

    key = str(params["dir"]) + "_" + params["fname"][-10:]
    reader = cache.get(key)
    if not reader:
        reader = TileReader()
        reader.set_input_params(params)
        cache.set(key, reader)
        logger.info("Cache size is now: %d of %d" % (len(cache.cache), cache.capacity))
    elif reader.dir != params["dir"]:
        logger.info("Useless reader")
        reader = TileReader()
        reader.set_input_params(params)
        cache.set(key, reader)
        logger.info("Cache size is now: %d of %d" % (len(cache.cache), cache.capacity))

    return reader

if __name__ == "__main__":
    cache2 = LRUCache(3)
    for i in range(5):
        cache2.set(str(i), i)

    print len(cache2.cache.keys())
    print cache2.get("1")
    print cache2.get("4")
