var express = require('express');
var Adjuster = require('../adjust');
var router = express.Router();

router.get('/', function(req, res) {
    var adjuster;
    console.log(req.query);
    if(req.query.data && req.query.data.length > 0) {
        var keys = Object.keys(req.query.data[0]);
        if(keys.includes("date") && keys.length == 2) {
            var valueName = keys[1 - keys.indexOf("date")];
            var flatData = req.query.data.map(function(v, i, ar) {
                return [v.date, v[valueName]];
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

module.exports = router;
