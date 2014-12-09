__author__ = 'dhan'

import logging
logger = logging.getLogger('slideatlas')

from tiff_reader import TileReader

def make_reader(params):
    reader = TileReader()
    reader.set_input_params(params)
    return reader

class MemoizeMutable:
    def __init__(self, fn):
        self.fn = fn
        self.memo = {}
    def __call__(self, *args, **kwds):
        import cPickle
        str = cPickle.dumps(args, 1)+cPickle.dumps(kwds, 1)
        if not self.memo.has_key(str):
            logger.debug('miss')
            self.memo[str] = self.fn(*args, **kwds)
            logger.debug('Length: %d', len(self.memo))
        else:
            logger.debug('hit')
            logger.debug('Length: %d', len(self.memo))
        return self.memo[str]

    def status(self):
        logger.debug('Length: %d', len(self.memo))

make_reader = MemoizeMutable(make_reader)
