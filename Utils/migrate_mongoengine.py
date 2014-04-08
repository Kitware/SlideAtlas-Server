import pymongo


conn = pymongo.mongo_client.MongoClient(host='mongodb://localhost:27017')

admin_db = conn['slideatlasv2']

# users collection
admin_db['users'].drop_indexes()

admin_db['users'].update( {}, {'$unset': {'_types': ''}}, multi=True)

admin_db['users'].update( {'type': 'passwd'}, {'$set': {'_cls': 'User.PasswordUser'}}, multi=True)
admin_db['users'].update( {'type': 'google'}, {'$set': {'_cls': 'User.GoogleUser'}}, multi=True)
admin_db['users'].update( {'type': 'facebook'}, {'$set': {'_cls': 'User.FacebookUser'}}, multi=True)
admin_db['users'].update( {'type': 'shibboleth'}, {'$set': {'_cls': 'User.ShibbolethUser'}}, multi=True)
admin_db['users'].update( {}, {'$unset': {'type': ''}}, multi=True) # TODO: this

admin_db['users'].update( {'_cls': {'$ne': 'User.ShibbolethUser'}}, {'$rename': {'name': 'email'}}, multi=True)
admin_db['users'].update( {'_cls': 'User.ShibbolethUser'}, {'$rename': {'name': 'eppn'}}, multi=True)


# databases collection
admin_db['databases'].update( {}, {'$unset': {'_types': '', '_cls': ''}}, multi=True)
