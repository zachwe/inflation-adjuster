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
    $(document.body).append($("p").addClass("content"));
    console.log("ready");
    $.get("/adjust", data, function(data, status, jqxhr) {
        console.log(data);
        $(".content").html(data);

    });
    $.get("/adjust", null, function(data, status, jqxhr) {
        console.log(data);
    });
});
