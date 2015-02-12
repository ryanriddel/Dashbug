var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	var _date=Date();
  res.render('../views/home.jade', { title: 'Express' , date: Date()});
});

router.get('/dbquery', function(req, res, next)
{
	console.log("dbquery made");
	db.collection('stationlist').find().toArray(function (err, items) {
    	console.log(err);
        res.json(items);
    });
});

router.get('/test', function(req, res, next)
{
	console.log("HOLY SHIT");
	console.log(req.body);
});

router.post('/p', function(req, res)
{ 
    console.log(req.body.message);
    res.writeHead(200, {'Content-Type':'text/plaintext'});
    res.end();
});

module.exports = router;
