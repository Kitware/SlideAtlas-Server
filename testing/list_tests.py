import unittest
DEBUG = False

def list_tests_from(path):
    loader = unittest.TestLoader()
    suite = loader.discover(path)
    for atest in suite:
        tests = atest._tests
        if len(tests):
            for atest in tests:
                if DEBUG:
                    print atest
                for btest in atest._tests:
                    btestname = btest.__str__().split()
                    print path + "." + btestname[1][1:-1] + "." + btestname[0]

list_tests_from("unit")
list_tests_from("regression")


