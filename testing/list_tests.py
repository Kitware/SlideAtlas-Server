import unittest

loader = unittest.TestLoader()
suite = loader.discover("unit")

loader = unittest.TestLoader()
suite.addTests(loader.discover("regression"))

for atest in suite:
    tests = atest._tests
    if len(tests):
        for atest in tests:
            for btest in atest._tests:
                btestname = btest.__str__().split()
                print btestname[1][1:-1]
