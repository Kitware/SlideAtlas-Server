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
from selenium.webdriver.common.action_chains import ActionChains
import unittest
import time
import re
import argparse


class glViewer_nav_Tests(unittest.TestCase):

  @classmethod
  def setUpClass(cls):
    global driver
    # Open second widget so every button is accessible
    tab_widget = driver.find_element_by_id("dualWidgetLeft")
    if tab_widget.is_displayed():
      tab_widget.click()


  @classmethod
  def tearDownClass(cls):
    global driver
    driver.close()

  def test_01_rotation(self):
    global driver
    nav_widget = driver.find_element_by_xpath('//*[@id="body"]/div[4]/div[5]')
    rot_pic = nav_widget.find_element_by_tag_name("img")
    old_style = nav_widget.get_attribute("style")
    ActionChains(driver).move_to_element(rot_pic).click_and_hold(rot_pic).move_by_offset(-50, 0).release().perform()
    time.sleep(2)
    self.assertTrue(nav_widget.get_attribute("style") != old_style)

  # Figure the resizing issue, cannot click and drag to resize the
  # Navigation widget/canvas
  def _test_02_resize(self):
    global driver
    nav_widget = driver.find_element_by_xpath('//*[@id="body"]/div[4]/div[5]')
    nav_canvas = nav_widget.find_element_by_tag_name("canvas")
    old_width = nav_canvas.get_attribute("width")
    old_height = nav_canvas.get_attribute("height")
    ActionChains(driver).move_to_element(nav_widget).drag_and_drop_by_offset(nav_canvas,-500,0).perform()
    self.assertTrue(nav_canvas.get_attribute("width") > old_width)
    self.assertTrue(nav_canvas.get_attribute("height") > old_height)

if __name__ == "__main__":
  # Read in passed argument which is webroot of Slide-Atlas Instance to test
  parser = argparse.ArgumentParser(description="First test suite of Slide-Atlas web front end")
  parser.add_argument("-r",dest = 'webroot' , required=True, help ="Web root of the Slide-Atlas instance to test: eg 'http://localhost:8080/'")
  result = vars(parser.parse_args())
  # Use global driver to access viewer page of Slide-Atlas

  driver = webdriver.Firefox()
  driver.get(result['webroot'] + "webgl-viewer?db=5074589002e31023d4292d83&view=544f92d6dd98b515418f3302")
  # Run test(s)
  suite = unittest.TestLoader().loadTestsFromTestCase(glViewer_nav_Tests)
  unittest.TextTestRunner(verbosity=2).run(suite)