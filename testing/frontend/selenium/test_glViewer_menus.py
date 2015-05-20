#---------------------------------------------------------------------------
# Copyright 2015 Kitware Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#---------------------------------------------------------------------------
from selenium import webdriver
import unittest
import re
import time
import argparse



class glViewerTests(unittest.TestCase):

  @classmethod
  def setUpClass(cls):
    global driver
    tab_widget = driver.find_element_by_id("dualWidgetLeft")
    if tab_widget.is_displayed():
      tab_widget.click()

  @classmethod
  def tearDownClass(cls):
    global driver
    driver.close()

  def test_01_tabs(self):
    global driver
    # Ensure only proper amount of elements exist
    # navigation tab = 1
    # annotation tab = 2
    # edit tab = 2
    # zoom tab = 2
    # conference tab = 0?

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

  def test_09_annotationTab(self):
    global driver
    annot_tab = driver.find_element_by_id('annotationTab')
    annot_tab.click()
    annot_menu = annot_tab.find_element_by_xpath('//*[@id="annotationTab"]/div')
    for button in annot_menu.find_elements_by_tag_name("img"):
      old_style = button.get_attribute("style")
      button.click()
      time.sleep(2)
      self.assertTrue(button.get_attribute("style") != old_style)

  def _3_editTab(self):
    global driver
    annot_tab = driver.find_element_by_id('editTab')
    annot_menu = annot_tab.find_element_by_xpath('//*[@id="editTab"]/div')
    for button in annot_menu.find_elements_by_tag_name("button"):
      annot_tab.click()
      old_style = button.get_attribute("style")
      button.click()
      time.sleep(2)
      self.assertTrue(button.get_attribute("style") != old_style)

  def test_04_navTab(self):
    global driver
    nav_tab = driver.find_element_by_id('navigationTab')
    nav_tab.click()
    nav_menu = nav_tab.find_element_by_tag_name('div')
    old_table_num = len(driver.find_elements_by_tag_name('table'))
    for button in nav_menu.find_elements_by_tag_name("img"):
      button.click()
    new_table_num = len(driver.find_elements_by_tag_name('table'))
    self.assertTrue(old_table_num != new_table_num)


  def test_02_zoomTab(self):
    global driver
    zoom_tabs = driver.find_elements_by_id("zoomTab")
    oldText = zoom_tabs[1].text
    zoom_tabs[1].find_element_by_tag_name("img").click()
    annot_menu = zoom_tabs[1].find_element_by_tag_name('div')
    for button in annot_menu.find_elements_by_tag_name("img"):
      button.click()
    time.sleep(2)
    zoom_tabs = driver.find_elements_by_id("zoomTab")
    self.assertTrue(zoom_tabs[1].text != oldText)

  def test_03_editTab(self):
    global driver
    editTabs = driver.find_elements_by_id("editTab")
    editTabs[1].find_element_by_tag_name("img").click()
    time.sleep(10)
    edit_menu = editTabs[1].find_element_by_tag_name("div")
    #for button in edit_menu.find_elements_by_tag_name('button'):
    #  if not button.is_displayed():
    #    editTabs[1].find_element_by_tag_name("img").click()
    # button.click()


if __name__ == "__main__":
  # Read in passed argument which is webroot of Slide-Atlas Instance to test
  parser = argparse.ArgumentParser(description="First test suite of Slide-Atlas web front end")
  parser.add_argument("-r",dest = 'webroot' , required=True, help ="Web root of the Slide-Atlas instance to test: eg 'http://localhost:8080/'")
  result = vars(parser.parse_args())
  # Use global driver to access viewer page of Slide-Atlas
  driver = webdriver.Firefox()
  driver.get(result['webroot'] + "webgl-viewer?db=5074589002e31023d4292d83&view=544f92d6dd98b515418f3302")
  # Run test(s)
  suite = unittest.TestLoader().loadTestsFromTestCase(glViewerTests)
  unittest.TextTestRunner(verbosity=2).run(suite)