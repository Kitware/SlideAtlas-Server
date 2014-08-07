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
        self.mouse = webdriver.ActionChains(self.driver)
#        self.driver = webdriver.Firefox()
        self.driver.set_window_size(1000, 1000)
#        self.driver.maximize_window()
#        self.driver.implicitly_wait(1)
        self.base_url = BASE_URL
        self.verificationErrors = []

    def open_melanoma(self):
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
        sleep(3)


    def test_navigation(self):
        """
        Following snippet is useful in deciding the test_navigation
            document.onmousemove = function(e){
            var x = e.pageX;
            var y = e.pageY;
            e.target.title = "X is "+x+" and Y is "+y;
            };
        """
        driver = self.driver
        self.open_melanoma()

        canvas = self.driver.find_element_by_tag_name("canvas")

        # Define zoomin and zoomout
        pan = webdriver.ActionChains(driver)
        pan.move_to_element_with_offset(canvas, 500,500)
        pan.click_and_hold()
        pan.move_to_element_with_offset(canvas, 600,500)
        pan.release()

        zoomin = webdriver.ActionChains(driver)
        zoomin.click()
        zoomin.click()

        zoomout = webdriver.ActionChains(driver)
        zoomout.context_click()
        zoomout.context_click()

        zoomout.perform()
        sleep(1)
        
        zoomout.perform()
        sleep(1)

        pan.perform()
        sleep(1)

        zoomin.perform()
        sleep(1)

        zoomin.perform()
        sleep(1)

        zoomin.perform()
        sleep(1)

        averagefunc = "return (function () { var total = 0; for(var i = 0; i < TILESTATS.tiles.length; i ++) { total = total + TILESTATS.tiles[i].loadtime; } return total / TILESTATS.tiles.length;})();"

        stats = driver.execute_script(averagefunc)
        print "Average tile load time: ", stats

    def test_glviewer_in_demo(self):
        driver = self.driver
        self.open_melanoma()
        sleep(2)
        driver.save_screenshot('demo_glview.png')
        # print "<DartMeasurementFile name=\"glview_demo\" type=\"image/png\"> demo_glview.png </DartMeasurementFile>"
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
