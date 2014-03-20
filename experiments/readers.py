__author__ = 'dhan'

from extract_tile import TileReader
import logging

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
            logging.log(logging.ERROR,"miss")  # DEBUG INFO
            self.memo[str] = self.fn(*args, **kwds)
            logging.log(logging.ERROR,"Length: %d"%(len(self.memo)))  # DEBUG INFO
        else:
            logging.log(logging.ERROR,"hit")  # DEBUG INFO
        return self.memo[str]

    def status(self):
        logging.log(logging.ERROR,"Length: %d"%(len(self.memo)))  # DEBUG INFO

make_reader = MemoizeMutable(make_reader)

a = make_reader({"fname" : "/home/dhan/data/phillips/20140313T165829-545675.ptif"})
b = make_reader({"fname" : "/home/dhan/data/phillips/20140313T123120-174321.ptif"})
c = make_reader({"fname" : "/home/dhan/data/phillips/20140313T165829-545675.ptif"})
print a is b
print b is c
print a is c


