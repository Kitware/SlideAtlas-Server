# coding=utf-8

import datetime
from itertools import ifilter
import math
import mimetypes

from bson import Binary
import flask
from flask import current_app, request, url_for
from flask.helpers import wrap_file
import gridfs
from werkzeug.http import parse_content_range_header

from slideatlas import models, security
from ..base import ListAPIResource, ItemAPIResource
from ..blueprint import api
from ..common import abort

import bson


################################################################################
__all__ = ('SessionAttachmentListAPI', 'SessionAttachmentItemAPI')


################################################################################
class SessionAttachmentListAPI(ListAPIResource):
    @staticmethod
    def _get(session, restype="attachments"):
        # look up image stores once in bulk for efficiency
        unique_image_store_ids = set(ifilter(None, (attachment_ref.db for attachment_ref in (session.attachments + session.imagefiles))))
        image_stores_by_id = models.ImageStore.objects.in_bulk(list(unique_image_store_ids))

        if restype == "attachments":
            reslist = session.attachments
        elif restype == "imagefiles":
            reslist = session.imagefiles

        result = []

        for attachment_ref in reslist:

            image_store = image_stores_by_id[attachment_ref.db]
            try:
                attachments_fs = gridfs.GridFS(image_store.to_pymongo(raw_object=True), restype)
                attachment_obj = attachments_fs.get(attachment_ref.ref)
            except Exception as e:
                result.append({
                    'id': attachment_ref.ref,
                    'name': e.message,
                    'length': 0
                })
                continue

            result.append({
                'id': attachment_obj._id,
                'name': attachment_obj.name,
                'length': attachment_obj.length
            })

        return result

    @security.ViewSessionRequirement.protected
    def get(self, session, restype="attachments"):
        attachments = self._get(session, restype)
        return {restype: attachments}


    @security.AdminSessionRequirement.protected
    def post(self, session, restype="attachments"):
        if restype == "attachments":

            if len(request.files.items(multi=True)) != 1:
                abort(400, details='Exactly one file must be provided.')
            uploaded_file = request.files.itervalues().next()

            gridfs_args = dict()

            # file name
            if not uploaded_file.filename:
                abort(400, details='The file must contain a filename.')
            # TODO: filter the filename to remove special characters and ensure length < 255
            gridfs_args['filename'] = uploaded_file.filename

            # chunked uploads
            content_range = parse_content_range_header(request.headers.get('Content-Range'))
            if content_range and (content_range.stop != content_range.length):
                if content_range.start != 0:
                    abort(400, details='A POST with partial content must not contain a fragment past the start of the entity.')
                if content_range.units != 'bytes':
                    abort(400, details='Only a range-unit of "bytes" may be used in a Content-Range header.')
                content_chunk_size = content_range.stop - content_range.start
                gridfs_args['chunkSize'] = content_chunk_size

            # content type
            # TODO: get the content type via libmagic, so a client can't falsify it
            #   via headers or filename extension
            # TODO: reject dangerous file types, like .exe or .html
            # first, try the client's headers for content type
            if uploaded_file.mimetype and uploaded_file.mimetype != 'application/octet-stream':
                # "mimetype" doesn't include charset options
                gridfs_args['contentType'] = uploaded_file.mimetype
            else:
                # if the headers are non-specific, try the filename extension
                extension_content_type = mimetypes.guess_type(uploaded_file.filename, strict=False)[0]
                if extension_content_type:
                    gridfs_args['contentType'] = extension_content_type
            # if getting the content type failed, leave "gridfs_args['contentType']" unset

            # save into GridFS
            image_store = session.collection.image_store
            attachments_fs = gridfs.GridFS(image_store.to_pymongo(raw_object=True), 'attachments')
            attachment = attachments_fs.new_file(**gridfs_args)
            try:
                # this will stream the IO, instead of loading it all into memory
                uploaded_file.save(attachment)
            finally:
                attachment.close()
                uploaded_file.close()

            # add to session
            attachments_ref = models.RefItem(ref=attachment._id, db=image_store.id)
            session.attachments.append(attachments_ref)
            session.save()

            # return response
            new_location = url_for('.session_attachment_item', session=session,
                                   restype=restype, attachment_id=attachment._id)
            return (None,  # TODO: return body with metadata?
                    201,  # Created
                    {'Location': new_location})

        elif restype == "imagefiles":
            # Need to create a location in sessions with current image store as the default image store
            # add to session
            ref_id = bson.ObjectId()
            return {"id": str(ref_id), "restype": "images"}, 201

        else:
            # Should never reach here
            return {"Error": "Unknown restype: " + restype}, 404


################################################################################
class SessionAttachmentItemAPI(ItemAPIResource):

    @security.ViewSessionRequirement.protected
    def get(self, session, restype, attachment_id):
        attachment = self._fetch_attachment(session, restype, attachment_id)[2]

        # Note: Returning the attachment with 'flask.send_file' would typically
        #   be adequate. However, 'attachment' is an instance of 'GridOut',
        #   which implements a read-only 'file' property (properties cannot be
        #   overridden in instances, not even by directly setting '__dict__').
        #   Because the 'attachment' has a 'file' attribute, 'flask.send_file'
        #   erroneously will treat it like an actual file with a location on the
        #   local filesystem. Rather than wrap the entire 'GridOut' instance to
        #   get rid of a single property, just create the response explicitly,
        #   which gives more control anyway.

        response = current_app.response_class(
            response=wrap_file(request.environ, attachment),
            direct_passthrough=True,  # allows HEAD method to work without reading the attachment's data
            content_type=(attachment.content_type or 'application/octet-stream'))
        response.content_length = attachment.length
        response.content_md5 = attachment.md5.decode('hex').encode('base64').rstrip()
        # TODO: can an 'inline' download of an HTML-ish file be exploited for XSS?
        #   an 'attachment' download can be used for XSS with a client-local context
        #   http://www.gnucitizen.org/blog/content-disposition-hacking/
        content_disposition = dict()
        if attachment.filename:
            content_disposition['filename'] = attachment.filename
        # TODO: make 'attachment' if file is a very large image
        response.headers.set('Content-Disposition', 'inline', **content_disposition)  # RFC 6266

        response.last_modified = attachment.upload_date
        response.set_etag(attachment.md5)
        response.cache_control.public = True
        # ETag is always sufficient to validate, so don't set max-age or Expires

        # TODO: call '.make_conditional(request)' as a post-request processor
        return response.make_conditional(request)


    @security.AdminSessionRequirement.protected
    def put(self, session, restype, attachment_id):
        image_store, _, attachment = self._fetch_attachment(session, restype, attachment_id)

        # only accept a single file from a form
        if len(request.files.items(multi=True)) != 1:
            abort(400, details='Exactly one file must be provided.')
        uploaded_file = request.files.itervalues().next()

        content_range = parse_content_range_header(request.headers.get('Content-Range'))
        if not content_range:
            abort(400, details='A PUT request to modify an attachment must include a Content-Range header.')
        if content_range.units != 'bytes':
            abort(400, details='Only a range-unit of "bytes" may be used in a Content-Range header.')
        if content_range.start is None:
            abort(400, details='The content\'s start and end positions must be specified in the Content-Range header.')
        # 'parse_content_range_header' guarantees that 'content_range.stop' must
        #   also be specified if 'start' is
        if content_range.length is None:
            # TODO: getting rid of this restriction would be nice, but we'd need
            #   a way to know when the final chunk was uploaded
            abort(400, details='The content\'s total length must be specified in the Content-Range header.')

        if content_range.start % attachment.chunkSize != 0:
            abort(400, details='The content\'s start location must be a multiple of the content\'s chunk size.')

        content_chunk_size = content_range.stop - content_range.start
        if (content_chunk_size != attachment.chunkSize) and (content_range.stop != content_range.length):
            # only the end chunk can be shorter
            abort(400, details='Upload content chunk size does not match existing GridFS chunk size.')

        image_store_pymongo = image_store.to_pymongo()

        chunk_num = (content_range.start / attachment.chunkSize)
        image_store_pymongo['attachments.chunks'].insert({
            'files_id': attachment._id,
            'n': chunk_num,
            'data': Binary(uploaded_file.read()),
        })

        # chunks may be sent out of order, so the only way to determine if all
        #   chunks were received is to count
        expected_chunks = int(math.ceil(float(content_range.length) / float(attachment.chunkSize)))
        received_chunks = image_store_pymongo['attachments.chunks'].find({'files_id': attachment._id}).count()
        if expected_chunks == received_chunks:
            # update the attachment metadata
            md5 = image_store_pymongo.command('filemd5', attachment._id, root='attachments')['md5']
            image_store_pymongo['attachments.files'].update(
                {'_id': attachment._id},
                {'$set': {
                    'length': content_range.length,
                    'md5': md5,
                    'uploadDate': datetime.datetime.utcnow()
                    }}
            )

        return None, 204  # No Content
    @security.AdminSessionRequirement.protected
    def post(self, session, restype, attachment_id):
        """
        Currently adding imagefiles only
        backend for flow.js

        """
        if not restype in ["imagefiles"]:
            abort(400, details='Only chunks of image files can be posted here')

        result = {}
        result["id"] = flask.request.form["flowIdentifier"]
        result["success"] = "POST request successful"
        result["current_chunk"] = int(flask.request.form["flowChunkNumber"])
        result["total_chunks"] = int(flask.request.form["flowTotalChunks"])
        result["filename"] = flask.request.form["flowFilename"]
        f = flask.request.files["file"]

        first = False

        if result["current_chunk"] == 1:
            first = True
            result["first"] = 1
            # Create a file
            attachments_ref = models.RefItem(ref=bson.ObjectId(result["id"]), db=session.collection.image_store.id)
            session.imagefiles.append(attachments_ref)
            session.save()

            datadb = session._get_datadb(restype, attachment_id)

            gf = gridfs.GridFS(datadb, restype)
            afile = gf.new_file(chunk_size=1024*1024, filename=result["filename"], _id=bson.ObjectId(result["id"]))
            afile.write(f.read())
            afile.close()

        if not first:
            datadb = session._get_datadb(restype, attachment_id)
            obj = {}
            obj["n"] = result["current_chunk"] - 1
            obj["files_id"] = bson.ObjectId(result["id"])
            obj["data"] = bson.Binary(f.read())

            datadb[restype + ".chunks"].insert(obj)
            fileobj = datadb[restype + ".files"].find_one({"_id": obj["files_id"]})
            datadb[restype + ".files"].update({"_id": obj["files_id"]}, {"$set": {"length": fileobj["length"] + len(obj["data"])}})

        if result["current_chunk"] == result["total_chunks"]:
            last = True
            result["last"] = last

            # Prepare arguments
            args = {}
            args["input"] = result["id"]
            args["session"] = str(session.id)
            args["collection"] = str(session.collection.id)

            # Defaults
            args["mongo_collection"] = None
            args["verbose"] = None
            args["dry_run"] = False
            args["tilesize"] = 256
            args["base_only"] = False
            args["overwrite"] = True

            # Submit the job
            import slideatlas.tasks.dicer as dicer
            job = dicer.process_file.delay(args)

            # Update the file metadata
            task_id = job.task_id
            datadb[restype + ".files"].update({"_id": bson.ObjectId(result["id"])}, {"$set": {"metadata": {"task": task_id}}})

        return result, 200  # No Content

    @security.AdminSessionRequirement.protected
    def delete(self, session, restype, attachment_id):
        # this also ensures that the attachment actually exists
        attachments_fs = session._fetch_attachment(restype, attachment_id)[1]

        # delete from session
        for (pos, attachment_ref) in enumerate(session.attachments):
            if attachment_ref.ref == attachment_id:
                session.attachments.pop(pos)
                break
        session.save()

        # delete from attachments collection
        attachments_fs.delete(attachment_id)

        return None, 204  # No Content


################################################################################
api.add_resource(SessionAttachmentListAPI,
                 '/sessions/<Session:session>/<regex("(attachments|imagefiles)"):restype>',
                 endpoint='session_attachment_list',
                 methods=('GET', 'POST'))

api.add_resource(SessionAttachmentItemAPI,
                 '/sessions/<Session:session>/<regex("(attachments|imagefiles)"):restype>/<ObjectId:attachment_id>',
                 endpoint='session_attachment_item',
                 methods=('GET', 'PUT', 'POST', 'DELETE'))  # PATCH not allowed
