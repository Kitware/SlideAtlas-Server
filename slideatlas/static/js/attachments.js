
function confirmAttachmentDelete(attachmentUrl, attachmentName, onSuccess) {
    bootbox.dialog({
        message: "Delete attachment \"" + attachmentName + "\"?",
        title: "Confirm Deletion",
        closeButton: true,
        buttons: {
            cancel: {
                label: "Cancel"
            },
            confirm: {
                label: "Delete",
                className: "btn-danger",
                callback: function() {
                    $.ajax({
                        url: attachmentUrl,
                        type: "DELETE",
                        success: onSuccess
                    });
                }
            }
        }
    });
}

function attachmentUpload(attachmentPostUrl) {
        bootbox.dialog({
            message: "<input class=\"sa-attachment-post-file\" type=\"file\" name=\"file\">",
            title: "Upload Attachment",
            closeButton: true,
            buttons: {
                cancel: {
                    label: "Cancel"
                },
                confirm: {
                    label: "Submit",
                    className: "btn-primary sa-attachment-post-submit disabled",
                    callback: function() {
                        // don't close immediately
                        return false;
                    }
                }
            }
        });
        $(".sa-attachment-post-file").fileupload({
            url: attachmentPostUrl,
            dataType: "json",
            maxChunkSize: 1048576, // 10 MB
            // "replaceFileInput" helps with aborted uploads, but prevents the
            //   selected file name from being displayed in the file widget
            replaceFileInput: false,
            add: function (event, data) {
                $(".sa-attachment-post-submit").removeClass("disabled");
                $(".sa-attachment-post-submit").click(function() {
                    data.submit();
                });
                $(this).parent().append(
                        $("<div id=\"progress\" class=\"progress progress-striped\">").append(
                                $("<div class=\"bar\" style=\"width: 0%;\">")
                        )
                );
            },
            progressall: function (event, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $("#progress .bar").css("width", progress + "%");
            },
            send: function(event, options) {
                this.uploadRedirect = null;
            },
            chunksend: function (event, options) {
                if (this.uploadRedirect) {
                    // subsequent request of a chunked series
                    options.url = this.uploadRedirect;
                    options.type = "PUT"
                }
            },
            chunkdone: function (event, options) {
                if (!this.uploadRedirect) {
                    // first request of a chunked series
                    // RFC 2616 14.30 requires that Location headers be absolute
                    this.uploadRedirect = options.jqXHR.getResponseHeader("Location");
                }
            },
            fail: function(event, data) {
                alert("Upload failed!");
                // TODO: Display error message details. However, "data.response().jqXHR.responseJSON" is not available until jQuery 2.0
            },
            always: function (event, options) {
                // clear after all chunks have been sent
                this.uploadRedirect = null;
                location.reload();
            },
        });
    }

function getPermalink(viewName, viewId, viewUrl) {
    $.ajax({
        url: "/api/v2/permalinks",
        type: "POST",
        data: {
            view: viewId,
            destination: viewUrl
        },
        success: function (data, textStatus, jqXHR) {
            bootbox.dialog({
                message: "<div>" + viewName + "</div><br><input type=\"text\" value=\"" + data.permalinks.url + "\" size=\"30\" readonly>",
                title: "Permanent Link",
                closeButton: true,
                buttons: {
                    close: {
                        label: "Close"
                    }
                }
            });
        }
    });
}
