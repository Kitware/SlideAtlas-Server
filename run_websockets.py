from slideatlas import app

# run in under twisted through wsgi
from twisted.web.wsgi import WSGIResource
from twisted.web.server import Site
from twisted.python import log
from twisted.internet import reactor

resource = WSGIResource(reactor, reactor.getThreadPool(), app)
site = Site(resource)

reactor.listenTCP(8000, site )
reactor.run()