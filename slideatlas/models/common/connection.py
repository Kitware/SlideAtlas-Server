# coding=utf-8

from mongoengine import register_connection

################################################################################
__all__ = ('register_admin_db',)


################################################################################
def register_admin_db(host, dbname, replica_set=None, username=None, password=None, auth_db=None):
    hostname, _, port = host.partition(':')
    kwargs = dict()
    if replica_set:
        # the very presence of a replicaSet argument to 'register_connection' triggers the behavior
        kwargs['replicaSet'] = replica_set
    register_connection(
        alias='admin_db',
        host=hostname,
        port=int(port) if port else None,
        name=dbname,
        username=username,
        password=password,
        **kwargs)
    # TODO: handle auth_db
