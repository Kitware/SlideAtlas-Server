# CTEST_SITE: name of this site (test location), reported to CDash
set(CTEST_SITE "mongol")

# SERVER_INSTANCES: list of databases to test; format: "hostname[:port] databasename"
set(SERVER_INSTANCES
    "mongol:8080"
   )

# MODEL: set to "Nightly" as default and to overwrite previous results; set to "Experimental" to add seperate new results
set(MODEL Nightly)

# CTEST_TEST_TIMEOUT: timeout in seconds for each individual test
set(CTEST_TEST_TIMEOUT 600)

# To set custom directory locations, add new set(..) commands in the site configuration file
# but don't directly edit these set(..) commands

# TEST_DIRECTORY: contains CTestTestfile.cmake, and python test scripts
set(TEST_DIRECTORY      "${CMAKE_CURRENT_LIST_DIR}")

# CONFIG_DIRECTORY: contains CTestConfig.cmake
set(CONFIG_DIRECTORY    "${CMAKE_CURRENT_LIST_DIR}")

# OUTPUT_DIRECTORY: "Testing/" directory with results will be written here
set(OUTPUT_DIRECTORY    "${CMAKE_CURRENT_LIST_DIR}")


# Edit this include(..) to point to the site configuration file for this site

set_property(GLOBAL PROPERTY SubProject slideatlas)
set_property(GLOBAL PROPERTY Label slideatlas)

##############################################################################
## DO NOT EDIT BELOW THIS LINE

set(CTEST_SOURCE_DIRECTORY  "${CONFIG_DIRECTORY}")
set(CTEST_BINARY_DIRECTORY  "${OUTPUT_DIRECTORY}")

set(CTEST_BUILD_COMMAND "true") # dummy command for ctest_build()
set(CTEST_BUILD_TARGET “slideatlas”)
   
foreach(SERVER_INSTANCE ${SERVER_INSTANCES})
    # Commented as not interested in option parsing right now 
    # Should be removed later
    #separate_arguments(DB_INSTANCE_ WINDOWS_COMMAND ${DB_INSTANCE})
    #list(GET DB_INSTANCE_ 0 DB_HOST)
    #set(ENV{DB_HOST} ${DB_HOST})
    #list(GET DB_INSTANCE_ 1 DB_NAME)
    #set(ENV{DB_NAME} ${DB_NAME})
    
    # Store the server instance in the environment so can be passed on to CTEST 
    set(ENV{SERVER_INSTANCE} ${SERVER_INSTANCE})

    set(CTEST_BUILD_NAME "$ENV{SERVER_INSTANCE}")

    ctest_start(${MODEL} TRACK ${MODEL})
    
    ctest_build() # triggers overwrite of previous results
    ctest_test(BUILD "${TEST_DIRECTORY}")
    ctest_submit(PARTS Build Test)
endforeach(SERVER_INSTANCE)

