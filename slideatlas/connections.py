import mongokit

slconn = mongokit.Connection("slide-atlas.org:27017", tz_aware=False, auto_start_request = False)
admindb = slconn["admin"]
admindb.authenticate("slideatlasweb", "2%PwRaam4Kw")
