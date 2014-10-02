# coding=utf-8

import datetime
from itertools import ifilter
import math
import mimetypes

from bson import Binary
from flask import current_app, request, url_for
from flask.helpers import wrap_file
import gridfs
from werkzeug.http import parse_content_range_header

from slideatlas import models, security
from ..base import ListAPIResource, ItemAPIResource
from ..blueprint import api
from ..common import abort

################################################################################
__all__ = ('SessionAttachmentListAPI', 'SessionAttachmentItemAPI')


################################################################################
class SessionAttachmentListAPI(ListAPIResource):
    @staticmethod
    def _get(session):
        # look up image stores once in bulk for efficiency
        unique_image_store_ids = set(ifilter(None, (attachment_ref.db for attachment_ref in session.attachments)))
        image_stores_by_id = models.ImageStore.objects.in_bulk(list(unique_image_store_ids))

        attachments = list()
        for attachment_ref in session.attachments:
            image_store = image_stores_by_id[attachment_ref.db]
            attachments_fs = gridfs.GridFS(image_store.to_pymongo(raw_object=True), 'attachments')

            attachment_obj = attachments_fs.get(attachment_ref.ref)
            attachments.append({
                'id': attachment_obj._id,
                'name': attachment_obj.name,
                'length': attachment_obj.length
            })

        return attachments


    @security.ViewSessionRequirement.protected
    def get(self, session):
        attachments = self._get(session)
        return dict(attachments=attachments)


    @security.AdminSessionRequirement.protected
    def post(self, session):
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
                               attachment_id=attachment._id)
        return (None,  # TODO: return body with metadata?
                201,  # Created
                {'Location': new_location})


################################################################################
class SessionAttachmentItemAPI(ItemAPIResource):
    @staticmethod
    def _fetch_attachment(session, attachment_id):
        # find the requested attachment in the session
        for attachment_ref in session.attachments:
            if attachment_ref.ref == attachment_id:
                break
        else:
            abort(404, details='The requested attachment was not found in the requested session.')

        # use 'get' instead of 'with_id', so an exception will be thrown if not found
        image_store = models.ImageStore.objects.get(id=attachment_ref.db)

        attachments_fs = gridfs.GridFS(image_store.to_pymongo(raw_object=True), 'attachments')
        try:
            attachment = attachments_fs.get(attachment_id)
        except gridfs.NoFile:
            abort(404, details='The requested attachment was not found in the requested session\'s image store.')

        return image_store, attachments_fs, attachment


    @security.ViewSessionRequirement.protected
    def get(self, session, attachment_id):
        attachment = self._fetch_attachment(session, attachment_id)[2]

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
    def put(self, session, attachment_id):
        image_store, _, attachment = self._fetch_attachment(session, attachment_id)

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
    def delete(self, session, attachment_id):
        # this also ensures that the attachment actually exists
        attachments_fs = self._fetch_attachment(session, attachment_id)[1]

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
                 '/sessions/<Session:session>/attachments',
                 endpoint='session_attachment_list',
                 methods=('GET', 'POST'))

api.add_resource(SessionAttachmentItemAPI,
                 '/sessions/<Session:session>/attachments/<ObjectId:attachment_id>',
                 endpoint='session_attachment_item',
                 methods=('GET', 'PUT', 'DELETE'))  # PATCH not allowed
