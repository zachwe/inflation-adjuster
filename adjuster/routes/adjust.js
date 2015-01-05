var express = require('express');
var adjuster = require('../adjust');
var router = express.Router();

router.get('/', function(req, res) {
    adjuster.getInflationNumbers("2010-01-01", "2014-11-17", "m");
    res.send("adjust");
});

module.exports = router;
