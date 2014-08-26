
function createNewSession(collectionid) {
    bootbox.prompt({
        title: "Please enter the label for new session:",
        callback: function(value) {
            if(value !== null) {
                console.log("Collection id: " + collectionid)
                console.log("Label enetered: " + value);
                // $.ajax({
                //     url: attachmentUrl,
                //     type: "DELETE",
                //     success: onSuccess
                // });
            }
            else {
                console.log("Cancelled ");
            }
        }
    });
}

