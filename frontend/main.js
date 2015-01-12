var $ = require("jquery-browserify");

$(document).ready(function() {
    console.log("ready");
    $(".data-form").submit(function(event) {
        //event.preventDefault();
        /*
        var formData = new FormData(this);
        $.ajax({
            url: "/adjust/data",
            type: "POST",
            success: function(data) {
                console.log("success!");
                console.log(data);
            },
            data: formData,
            contentTpe: false,
            processData: false
        });
        */
        console.log("submitted form");
    });

});
