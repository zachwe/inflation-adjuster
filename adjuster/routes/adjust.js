var express = require('express');
var adjuster = require('../adjust');
var router = express.Router();

router.get('/', function(req, res) {
    adjuster.getInflationNumbers("2010-01-01", "2014-01-01");
    res.send("adjust");
});

module.exports = router;
