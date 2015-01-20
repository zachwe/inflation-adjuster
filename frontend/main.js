var $ = require("jquery-browserify");

$(document).ready(function() {
    console.log("ready");
    $(".data-form").on("change", "#data_area", function() {
        $(".data-form").submit();
    });
    $(".data-form").on("keypress", "#data_area", function(eventData) {
        if(eventData.which == 13) {
            $(".data-form").submit();
        }
    });
    $(".data-form").on("change", "#fileinput", function() {
        $(".data-form").submit();
    });
    $(".data-form").submit(function(event) {
        console.log("submitted form");
    });

});
