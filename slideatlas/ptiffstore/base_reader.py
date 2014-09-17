

class Reader(object):
    """
    Generic reader for uploader
    """
    def __init__(self, params=None):
        if params:
            self.set_input_params(params)
        self.spacing = [1.0, 1.0, 1.0]
        self.origin = [0., 0., 0.]
        self.components = 3

    def set_input_params(self, params):
        self.params = params
        if not params["bindir"].endswith("/"):
            params["bindir"] = params["bindir"] + "/"

    def get_tile(self, x, y, tilesize=256):
        """
        helper function to get a particular tile.
        The tile containing absolute pixels specified by x and y
        is returned
        """
        return self.read_region((x, y), (tilesize, tilesize))

    def read_region(self, location, size, level=0):
        """
        """
        raise NotImplementedError
