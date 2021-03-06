var async = require('async');
var express = require('express');
var fs = require('fs');
var BabyParse = require('babyparse');
var querystring = require('querystring');
var Adjuster = require('../adjust');
var util = require('../util');

var router = express.Router();

router.get('/', function(req, res) {
    res.redirect('/');
});

router.post("/", function(req, res) {
    req.pipe(req.busboy);
    var fileData = "",
        fieldData,
        adjustDate,
        data;
    var fileExists = false;
    var adjustAndRespond = function(value) {
        try {
            data = formatParsedData(value);
            if(! data) {
                res.redirect('/');
            }
            adjuster = new Adjuster(data, {adjustDate: adjustDate, frequency: "a"});
            adjuster.getInflationNumbers({}, function(d) {
                var retData = d.data.map(function(v, i, ar) {
                    return v.slice(0, 3).join("\t"); 
                });
                var displayDate = d.adjustDate.split("-");
                var displayMonth = d.adjustDateFrequency == "m" ? util.getMonthString(displayDate[1] - 1) + ", " : "";
                var displayYear = displayDate[0];
                var columns = "date\toriginal value\tvalue in " + 
                                displayMonth + displayYear + " dollars\n";
                var text = columns + retData.join("\n");
                var renderParams = {
                    length: d.length + 10,
                    output_text: text,
                    data_area_text: value,
                    display_output: "inline",
                    adjust_date: d.adjustDate
                };
                res.render('index', renderParams);
            },
            function(err) {
                var renderParams = {
                    display_output: "none",
                    error: err.message,
                    data_area_text: value
                };
                res.render('index', renderParams);
            });
        } catch (e) {
            // The data was poorly formatted or just plain not there.
            res.render('index', {
                display_output: "none",
                error: e.message,
                data_area_text: value
            });
            return;
        }
    };
    req.busboy.on('file', function (fieldname, file, filename) {
        file.on('data', function(d) {
            fileData += d.toString('utf8');
        });
        file.on('end', function() {
            console.log("Upload Finished of " + filename); 
        });
    });
    req.busboy.on('field', function(fieldname, value) {
        if(fieldname == "data_area") {
            fieldData = value;
        } else if(fieldname == "adjust_date") {
            adjustDate = new Date(value);
        }
    });
    req.busboy.on('finish',function() {
        if(fileData) {
            process.nextTick(function() {
                adjustAndRespond(fileData);
            });
        } else {
            process.nextTick(function() {
                adjustAndRespond(fieldData);
            });
        }
    });
});

var formatParsedData = function(data, response) {
    var parsed = BabyParse.parse(data);
    if(! (parsed.data[0][0].toLowerCase() == "date" || parsed.data[0][1] == "date")) {
        throw new Error("We couldn't deal with your data. Make sure that it's in a valid csv or tsv format");
    }

    var dateIndex = (parsed.data[0][1] == "date") + 0;
    var preppedData = parsed.data.filter(function(v, i, ar) {
        return v.length == "2" && i > 0;
    }).map(function(v, i, ar) {
        return [new Date(v[dateIndex]), v[1 - dateIndex]];
    });
    return preppedData;
};

module.exports = router;
