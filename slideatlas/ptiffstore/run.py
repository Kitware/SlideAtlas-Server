__author__ = 'dhanannjay.deo'

import argparse
from app import app


def make_argument_parser():
    """
    Creates command line arguments parser
    """
    parser = argparse.ArgumentParser(description='Simple prototype of TileServer')

    parser.add_argument("-r", "--rootpath", help='Root path of the folder hosting ptif (Phillips pyramidal tiff) files', required=True)
    parser.add_argument("-v", "--verbose", help='Verbose output', default=False)

    return parser

# Parse the command line
if __name__ == '__main__':
    """
    Main entry point for tile server

        ..code-block:: shell-session

        (slideatlas) $python slideatlas/ptiffstore/tileserver.py -r ~/data/phillips

    """

    parser = make_argument_parser()
    args = parser.parse_args()

    if args.verbose is None:
        verbose = 0
    else:
        verbose = args.verbose

    if verbose > 1:
        print "Arguments : "
        for akey in vars(args).keys():
            print "   ", akey, ": ", vars(args)[akey]

    app.config["FILES_ROOT"] = args.rootpath
    app.run(host="0.0.0.0", port=8081, debug=True)
