var express = require('express');
var router = express.Router();
var server_tools = require('../node_modules/server_tools/server_tools.js');

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
//this is an update from a groundstation
router.post('/p', function(req, res)
{ 
	//we should probably pass this to server_tools
    console.log(req.body.groundstation_name + ":" + req.body.groundstation_id + ":" + req.body.message);

    /*
    res.writeHead(200, {'Content-Type':'text/plaintext'});
    res.end();
*/
    var payload={message:req.body.message, groundstation_name: req.body.groundstation_name, groundstation_id: req.body.groundstation_id, number_of_swaps:req.body.swaps};
    server_tools.parsePost(payload);
});

module.exports = router;
