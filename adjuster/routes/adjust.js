var express = require('express');
var fs = require('fs');
var Adjuster = require('../adjust');
var router = express.Router();

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
        adjuster = new Adjuster();
        var opts = {startdate: "2010-01-01", enddate: "2014-11-17" };

        adjuster.getInflationNumbers({}, function(data){
            res.send(data); 
        });
    }
    if(req.data) {
        var data = req.data;
    }
});

router.post("/data", function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    var fileData = "";
    req.busboy.on('file', function (fieldname, file, filename) {
        if(filename) {
            console.log("Uploading: " + filename);
            file.on('data', function(d) {
                fileData += d.toString('utf8');
            });
            file.on('end', function() {
                console.log(fileData.length);
                console.log("Upload Finished of " + filename); 
            });
            /*
            fstream = fs.createWriteStream(__dirname + '/../uploads/' + filename);
            file.pipe(fstream);
            fstream.on('close', function () {    
                res.redirect('/');           //where to go next
            });
            */
        } else {
            //res.redirect('/');
        }
    });
    req.busboy.on('field', function(fieldname, value) {
        //console.log("filedname: " + fieldname);
        console.log(" value: " + value);
    });
});

module.exports = router;
