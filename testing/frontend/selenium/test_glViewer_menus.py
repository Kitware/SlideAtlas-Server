from selenium import webdriver
import unittest
import re
import argparse

driver = webdriver.Firefox()

class glViewerTests(unittest.TestCase):

  @classmethod
  def setUpClass(cls):
    global driver


  @classmethod
  def tearDownClass(cls):
    global driver
    driver.close()

  def test_tabs(self):
    global driver
    # Ensure only proper amount of elements exist
    # navigation tab = 1
    # annotation tab = 2
    # edit tab = 2
    # zoom tab = 2
    # conference tab = 0?

    # Open second widget so every button is accessible
    driver.find_element_by_id("dualWidgetLeft").click()

    # Set tab IDs and expected number of found elements with ID
    tab_values = {"zoomTab": 2, "navigationTab": 1, "annotationTab": 2, "editTab": 2, "conferenceTab": 0}
    for tab_id in tab_values.keys():
      button_list = driver.find_elements_by_id(tab_id)

      # Assert that expected found equals actually found value
      self.assertTrue(len(button_list) == tab_values[tab_id])

      #Click on each button (specifically, each img within each named ID element)
      # Ensure that other sub-div now has a 'display: block' string within its style
      # Menu is then visible
      for button in button_list:
        button.find_element_by_tag_name('img').click()
        style_text = button.find_element_by_tag_name('div').get_attribute("style")
        self.assertTrue(re.match("display: block", style_text))

if __name__ == "__main__":
  # Read in passed argument which is webroot of Slide-Atlas Instance to test
  parser = argparse.ArgumentParser(description="First test suite of Slide-Atlas web front end")
  parser.add_argument("-r",dest = 'webroot' , required=True, help ="Web root of the Slide-Atlas instance to test: eg 'http://localhost:8080/'")
  result = vars(parser.parse_args())
  # Use global driver to access viewer page of Slide-Atlas
  driver.get(result['webroot'] + "webgl-viewer?edit=true&db=53f27d6b0ac87a9930fb31fb&view=53f7b89838a5881254eb5d83")
  # Run test(s)
  suite = unittest.TestLoader().loadTestsFromTestCase(glViewerTests)
  unittest.TextTestRunner(verbosity=2).run(suite)