var express = require('express');
var adjuster = require('../adjust');
var router = express.Router();

router.get('/', function(req, res) {
    var opts = {startdate: "2010-01-01", enddate: "2014-11-17" };
    adjuster.getInflationNumbers(opts, function(data){
       res.send(data); 
    });
});

module.exports = router;
