# Extract the test by running python code 

execute_process(COMMAND "python" "list_tests.py" OUTPUT_VARIABLE STR_TESTS
                  OUTPUT_STRIP_TRAILING_WHITESPACE
                  ERROR_STRIP_TRAILING_WHITESPACE)

separate_arguments(TEST_LIST UNIX_COMMAND ${STR_TESTS})

foreach(ATEST ${TEST_LIST})
    message(" +")
    message(${ATEST})
    # "./run_digitalpath_test.py" must be in the same directory as this file, CTestTestfile.cmake
    add_test(${ATEST} "python" "-m" "unittest" "-v" ${ATEST})
endforeach(ATEST)

# Select the tests to be run with some logic


# if($ENV{DB_NAME} STREQUAL LOGIN_DB_NAME)
#    set(TEST_LIST ${LOGIN_TEST_LIST})
# else($ENV{DB_NAME} STREQUAL LOGIN_DB_NAME)
#    set(TEST_LIST ${DATA_TEST_LIST})
# endif($ENV{DB_NAME} STREQUAL LOGIN_DB_NAME)

# foreach(TEST_NAME ${TEST_LIST})
# "./run_digitalpath_test.py" must be in the same directory as this file, CTestTestfile.cmake
# add_test(${TEST_NAME} "python" "run_digitalpath_test.py" ${TEST_NAME} $ENV{DB_HOST} $ENV{DB_NAME})
# set_property(TEST ${TEST_NAME} PROPERTY LABELS database)
# endforeach(TEST_NAME)

    
