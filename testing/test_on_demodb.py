from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
import unittest, time, re
from imagecompare import imagecompare

class DemoTests(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome('c:\eclipse\chromedriver.exe')
        self.driver.maximize_window()
        self.driver.implicitly_wait(10)
        self.base_url = "http://127.0.0.1:8080/"
        self.verificationErrors = []

    def test_demo_tests(self):
        driver = self.driver
        driver.get(self.base_url + "/webgl-viewer?db=507619bb0a3ee10434ae0827&img=4ecb20134834a302ac000001")
        driver.find_element_by_link_text("Home").click()
        driver.find_element_by_link_text("logout").click()
        driver.find_element_by_link_text("login").click()
        driver.find_element_by_id("username").clear()
        driver.find_element_by_id("username").send_keys("all_deo")
        driver.find_element_by_id("username").clear()
        driver.find_element_by_id("username").send_keys("all_demo")
        driver.find_element_by_css_selector("button[type=\"submit\"]").click()
        driver.find_element_by_link_text("sessions").click()
        driver.find_element_by_link_text("Skin").click()
        driver.find_element_by_link_text("4815 - 2010-10-06 16.32.21.ndpi").click()

        driver.save_screenshot('demo_glview.png')
        print "<DartMeasurementFile name=\"glview_demo\" type=\"image/png\"> demo_glview.png </DartMeasurementFile>"

        self.failUnless(imagecompare("demo_glview.png", "imgs/demo_glview.png") < 10.0)

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
