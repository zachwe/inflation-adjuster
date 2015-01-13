var async = require('async');
var express = require('express');
var fs = require('fs');
var BabyParse = require('babyparse');
var querystring = require('querystring');
var Adjuster = require('../adjust');

var router = express.Router();

router.get('/data', function(req, res) {
    res.redirect('/');
});

router.get('/', function(req, res) {
    res.redirect('/');
    //don't do this other junk.
    var adjuster;
    if(req.query.data && req.query.data.length > 0) {
        var keys = Object.keys(req.query.data[0]);
        if(keys.indexOf("date") != -1 && keys.length == 2) {
            var valueName = keys[1 - keys.indexOf("date")];
            var flatData = req.query.data.map(function(v, i, ar) {
                var date = new Date("" + v.date);
                return [date, v[valueName]];
            });
            adjuster = new Adjuster(flatData);
            adjuster.getInflationNumbers({}, function(data){
                res.send(data); 
            });
        } else {
            response.status(400).send("Your data is formatted poorly.");
        }
    } else {
        res.redirect('/');
    }
});

router.post("/data", function(req, res) {
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
            adjuster = new Adjuster(data, {adjustDate: adjustDate});
            adjuster.getInflationNumbers({}, function(d) {
                var retData = d.data.map(function(v, i, ar) {
                    return v.slice(0, 3).join("\t"); 
                });
                var columns = "date\toriginal value\tvalue in " + 
                                d.adjustDate + " dollars\n";
                var text = columns + retData.join("\n");
                var renderParams = {
                    length: d.length + 10,
                    text: text,
                    display_output: "block",
                    adjust_date: d.adjustDate
                };
                res.render('index', renderParams);
            });
        } catch (e) {
            // The data was poorly formatted or just plain not there.
            res.render('index', {
                display_output: "none",
                error: e.message
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
            adjustDate = value;
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
    if(! (parsed.data[0][0] == "date" || parsed.data[0][1] == "date")) {
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
