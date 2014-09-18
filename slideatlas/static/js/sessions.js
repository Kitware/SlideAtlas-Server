
function createNewSession(collectionId, onSuccess) {
    bootbox.prompt({
        title: "Please enter the label for new session:",
        callback: function(value) {
            if(value !== null) {
                console.log("Collection id: " + collectionId)
                console.log("Label entered: " + value);
                $.ajax({
                    url: "/api/v2/sessions",
                    type: "POST",
                    dataType: "json",
                    contentType: 'application/json;charset=UTF-8',
                    data: JSON.stringify(
                        {
                            "collection": collectionId,
                            "label" : value,
                        },
                        null, "\t"),
                    success: onSuccess,
                    error: function () {
                        console.log("Something went wrong");
                    }
                });
            }
            else {
                console.log("Cancelled");
            }
        }
    });
}

