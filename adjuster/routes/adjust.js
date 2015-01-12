var async = require('async');
var express = require('express');
var fs = require('fs');
var BabyParse = require('babyparse');
var querystring = require('querystring');
var Adjuster = require('../adjust');

var router = express.Router();
var adjuster = new Adjuster();

router.get('/data', function(req, res) {
    res.redirect('/');
});

router.get('/', function(req, res) {
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
    var fstream;
    req.pipe(req.busboy);
    var fileData = "";
    var waitForFile = true;
    var fileExists = false;
    var adjustAndRespond = function(value) {
        var data = formatParsedData(value);
        if(! data) {
            res.redirect('/');
        }
        adjuster = new Adjuster(data);
        adjuster.getInflationNumbers({}, function(d) {
            var retData = d.map(function(v, i, ar) {
                return v.slice(0, 3).join("\t\t\t\t"); 
            });
            var columns = "year\t\t\t\tunadjusted value\t\t\t\tadjusted value\n";
            var text = columns + retData.join("\n");
            var renderParams = {
                length: d.length + 10,
                text: text,
                display_output: "block"
            };
            res.render('index', renderParams);
        });

    };
    req.busboy.on('file', function (fieldname, file, filename) {
        waitForFile = false;
        if(filename) {
            file.on('data', function(d) {
                fileExists = true;
                fileData += d.toString('utf8');
            });
            file.on('end', function() {
                fileExists = true;
                console.log("Upload Finished of " + filename); 
                process.nextTick(function() {
                    adjustAndRespond(fileData);
                });
            });
        } 
    });
    req.busboy.on('field', function(fieldname, value) {
        var handleNoFile = function(d) {
            if(! waitForFile) {
                if(fileExists) {
                    // Do nothing, let the busboy file handler do stuff.
                    return;
                } else {
                    process.nextTick(function() {
                        adjustAndRespond(value);
                    });
                }
            } else {
                process.nextTick(function() {
                    handleNoFile(d);
                });
            }
        };
        if(fieldname == "data_area") {
            handleNoFile(value);
        }
    });
});

var formatParsedData = function(data, response) {
    var parsed = BabyParse.parse(data);
    if(! (parsed.data[0][0] == "date" || parsed.data[0][1] == "date"))
        throw new Error("badly formatted data");

    var dateIndex = (parsed.data[0][1] == "date") + 0;
    var preppedData = parsed.data.filter(function(v, i, ar) {
        return v.length == "2" && i > 0;
    }).map(function(v, i, ar) {
        return [new Date(v[dateIndex]), v[1 - dateIndex]];
    });
    return preppedData;
};

module.exports = router;
