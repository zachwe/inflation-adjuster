var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', {display_output: "none"});
});

module.exports = router;
