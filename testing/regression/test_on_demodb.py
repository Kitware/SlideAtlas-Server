import sys
import os
test_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
slideatlas_root = os.path.abspath(os.path.join(test_root, ".."))

sys.path.append(test_root)
sys.path.append(slideatlas_root)

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
import unittest, time, re
from comparetools import sameimage
from time import sleep


BASE_URL = "http://new.slide-atlas.org"

class DemoTests(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
#        self.driver = webdriver.Firefox()
        self.driver.set_window_size(1000, 1000)
#        self.driver.maximize_window()
#        self.driver.implicitly_wait(1)
        self.base_url = BASE_URL
        self.verificationErrors = []

    def test_demo_tests(self):
        print "Testing demo .."
        driver = self.driver
        driver.get(BASE_URL + "/logout")
#        self.driver.maximize_window()
        self.driver.execute_script("window.resizeTo(1100,1100);")
        sleep(2)
        driver.find_element_by_link_text("Home").click()
        self.driver.implicitly_wait(1)
        driver.find_element_by_link_text("Login").click()
        self.driver.implicitly_wait(1)
        driver.find_element_by_id("email").clear()
        self.driver.implicitly_wait(1)
        driver.find_element_by_id("email").send_keys("all_demo")
        self.driver.implicitly_wait(1)
        driver.find_element_by_id("submit").click()
        self.driver.implicitly_wait(1)
        driver.find_element_by_link_text("Sessions").click()
        self.driver.implicitly_wait(1)
        driver.find_element_by_link_text("Skin").click()
        self.driver.implicitly_wait(1)
        driver.find_element_by_link_text("4815 - 2010-10-06 16.32.21.ndpi").click()
        sleep(5)
        driver.save_screenshot('demo_glview.png')

        print "<DartMeasurementFile name=\"glview_demo\" type=\"image/png\"> demo_glview.png </DartMeasurementFile>"

        self.failUnless(sameimage("demo_glview.png", os.path.join(test_root,"imgs/demo_glview.png")), "Images not same, look at the difference score")

    def is_element_present(self, how, what):
        try: self.driver.find_element(by=how, value=what)
        except NoSuchElementException, e: return False
        return True

    def close_alert_and_get_its_text(self):
        try:
            alert = self.driver.switch_to_alert()
            if self.accept_next_alert:
                alert.accept()
            else:
                alert.dismiss()
            return alert.text
        finally: self.accept_next_alert = True

    def tearDown(self):
        self.driver.quit()
        self.assertEqual([], self.verificationErrors)

if __name__ == "__main__":
    unittest.main()
