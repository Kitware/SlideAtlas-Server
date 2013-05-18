from slideatlas import app
import sys
import os

# run in under twisted through wsgi
from twisted.web.wsgi import WSGIResource
from twisted.web.server import Site
from twisted.python import log
from twisted.internet import reactor

from autobahn.websocket import WebSocketServerFactory, \
                               WebSocketServerProtocol

from autobahn.resource import WebSocketResource, HTTPChannelHixie76Aware, WSGIRootResource


class EchoServerProtocol(WebSocketServerProtocol):

    def onMessage(self, msg, binary):
        #fin = open(os.path.abspath(__file__) + "/data/tiger.jpg")
        fin = open("/home/dhan/projects/slideatlas-flask/data/tiger.jpg")
        self.sendMessage(fin.read(), True)

if __name__ == '__main__':

    if len(sys.argv) > 1 and sys.argv[1] == 'debug':
       log.startLogging(sys.stdout)
       debug = True
    else:
       debug = False
    
    factory = WebSocketServerFactory("ws://localhost:8000",
                                     debug = debug,
                                     debugCodePaths = debug)
    
    factory.protocol = EchoServerProtocol
    factory.setProtocolOptions(allowHixie76 = True) # needed if Hixie76 is to be supported
    
    # Mount different resources
    
    wsRes = WebSocketResource(factory)
    
    wsgiRes = WSGIResource(reactor, reactor.getThreadPool(), app)
    
    rootRes = WSGIRootResource(wsgiRes, {'ws' : wsRes})
    
    site = Site(rootRes)
    
    reactor.listenTCP(8000, site )
    reactor.run()