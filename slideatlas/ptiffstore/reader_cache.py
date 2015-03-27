__author__ = 'dhan'

import logging
logger = logging.getLogger('slideatlas')

from tiff_reader import TileReader
import collections
import cPickle

import flask

class LRUCache(object):
    """
    Least Recently Used (LRU) Cache of limited capacity
    """
    def __init__(self, capacity=5):
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
                self.cache.popitem(last=False)
        self.cache[key] = value


try:
    capacity=int(flask.current_app.config["READER_CACHE_LENGTH"])
except:
    capacity=100

cache = LRUCache(capacity=capacity)

def make_reader(params):
    """
    returns a reader, updates the cache
    """
    key = cPickle.dumps(params)
    reader = cache.get(key)
    if not reader:
        reader = TileReader()
        reader.set_input_params(params)
        cache.set(key, reader)
        logger.info("Cache size is now: %d" % len(cache.cache))

    return reader

if __name__ == "__main__":
    cache2 = LRUCache(3)
    for i in range(5):
        cache2.set(str(i), i)

    print len(cache2.cache.keys())
    print cache2.get("1")
    print cache2.get("4")
