var express = require('express');
var fs = require('fs');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', {display_output: "none"});
});

router.get('/cpi', function(req, res){
    fs.readFile("./public/files/cpi.csv", function(err, data) {
        res.write(data);
        res.end();
    });
});

module.exports = router;
