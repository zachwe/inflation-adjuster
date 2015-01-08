var $ = require("jquery-browserify");

// Sample data to send to server.
var data = { data: [
    { date: 1980, value: 1 },
    { date: 1985, value: 2 },
    { date: 1990, value: 4 },
    { date: 1995, value: 8 },
    { date: 2000, value: 16 },
    { date: 2005, value: 32 },
    { date: 2010, value: 64}
]};
$(document).ready(function() {
    console.log("ready");
    $(".data-form").submit(function(event) {
        //event.preventDefault();
        var formData = new FormData(this);
        /*
        $.ajax({
            url: "/adjust/data",
            type: "POST",
            success: function(data) {
                console.log(data);
            },
            data: formData,
            contentTpe: false,
            processData: false
        });*/
        console.log("submitted form");
    });
    /*
    $.get("/adjust", data, function(data, status, jqxhr) {
        console.log(data);
        //$(".content").append("<p>" + data.toString() + "</p>");

    });
    $.get("/adjust", function(data, status, jqxhr) {
        console.log(data);
    });
    */
});
