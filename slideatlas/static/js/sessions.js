
function createNewSession(collectionId, onSuccess) {
    bootbox.prompt({
        title: "Please enter the label for new session:",
        callback: function(value) {
            if(value !== null) {
                console.log("Collection id: " + collectionId)
                console.log("Label enetered: " + value);
                $.ajax({
                    url: "/api/v2/collections/" + collectionId,
                    type: "POST",
                    dataType: "json",
                    contentType: 'application/json;charset=UTF-8',
                    data: JSON.stringify({ "session" : { "label" : value }, "debug" : 1}, null, "\t"),
                    success: onSuccess,
                    error: function () {
                        console.log("Something went wrong");
                    }
                });
            }
            else {
                console.log("Cancelled ");
            }
        }
    });
}

