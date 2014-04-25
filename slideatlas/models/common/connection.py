# coding=utf-8

from mongoengine import register_connection
from mongoengine.connection import get_connection, _connection_settings, \
    _connections

from slideatlas.third_party.MongoDBProxy import MongoProxy

################################################################################
__all__ = ('register_database',)


################################################################################
def register_database(alias, host, dbname, replica_set=None, username=None, password=None, auth_db=None):
    if alias in _connection_settings:
        # already registered
        return

    kwargs = dict()
    if replica_set:
        # the very presence of a replicaSet argument to 'register_connection' triggers the behavior
        kwargs['replicaSet'] = replica_set
        # MongoEngine converts 'host' to 'hosts_or_uri' for replica sets
        kwargs['host'] = host
    else:
        hostname, _, port = host.partition(':')
        kwargs['host'] = hostname
        if port:
            kwargs['port'] = int(port)
    register_connection(
        alias=alias,
        name=dbname,
        username=username,
        password=password,
        **kwargs)
    # TODO: handle auth_db

    # 'get_connection' has the side effect of creating and caching the
    #   connection on the first time that it's called
    connection = get_connection(alias)

    # TODO: set up logger
    # automatically retry any queries that get disconnected. using exponential
    #   backoff for up to 60 seconds
    connection = MongoProxy(connection, logger=None, wait_time=60)

    # subsequent calls to 'get_connection' will return from the cache, so update
    #   the cached connection
    _connections[alias] = connection
