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
from time import sleep

class Performance(object):
    def __init__(self, url):
        self.driver = webdriver.Chrome()
        self.mouse = webdriver.ActionChains(self.driver)
#        self.driver = webdriver.Firefox()
        self.driver.set_window_size(1000, 1000)
#        self.driver.maximize_window()
#        self.driver.implicitly_wait(1)
        self.base_url = url
        self.verificationErrors = []

        driver = self.driver
        driver.get(url)
        sleep(3)

    def get_tile_time(self):
        """
        Following snippet is useful in deciding the test_navigation
            document.onmousemove = function(e){
            var x = e.pageX;
            var y = e.pageY;
            e.target.title = "X is "+x+" and Y is "+y;
            };
        """
        driver = self.driver

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
        driver.close()

        return stats

   

BASE_URLS = ["http://new.slide-atlas.org/webgl-viewer?db=53468ebc0a3ee10dd6b81ca5&view=53d7c891dd98b50a482482e8"]
BASE_URLS.append("http://slide-atlas.org/webgl-viewer?db=53468ebc0a3ee10dd6b81ca5&view=53d7c891dd98b50a482482e8")

if __name__ == "__main__":
    times = {}

    for url in BASE_URLS:
        times[url] = 0 

    for i in range(2):
        for url in BASE_URLS:
            perf = Performance(url)
            times[url] += perf.get_tile_time()
    print times 