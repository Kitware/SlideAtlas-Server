from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import NoSuchElementException
import unittest, time, re

BASE_URL = "http://127.0.0.1:8080/"

class ExternalTests(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome('c:\eclipse\chromedriver.exe')
        self.driver.maximize_window()
        self.driver.implicitly_wait(30)
        self.base_url = BASE_URL
        self.verificationErrors = []

    def test_login_and_glview(self):
        driver = self.driver
        driver.get(self.base_url + "/logout")
        # Login
        driver.find_element_by_link_text("login").click()
        driver.find_element_by_id("username").clear()
        driver.find_element_by_id("username").send_keys("all_bev1_admin")
        driver.find_element_by_id("passwd").clear()
        driver.find_element_by_id("passwd").send_keys("MAmanage")
        driver.find_element_by_css_selector("button[type=\"submit\"]").click()
        # Select the image 
        driver.find_element_by_link_text("sessions").click()
        driver.find_element_by_link_text("Fungi, Protozoa and Parasites").click()
        driver.find_element_by_link_text("3394 - 2010-10-06 14.12.18.ndpi").click()

        # Select the image 

        driver.save_screenshot('glview.png')
        # Compare the image


    def is_element_present(self, how, what):
        try: self.driver.find_element(by=how, value=what)
        except NoSuchElementException, e: return False
        return True

    def tearDown(self):
        self.driver.quit()
        self.assertEqual([], self.verificationErrors)

if __name__ == "__main__":
    unittest.main()
