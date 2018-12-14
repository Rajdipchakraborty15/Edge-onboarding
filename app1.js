
var express = require('express');
var bodyParser = require('body-parser');
var fs=require('fs');
var app = express();
var request = require('request');
var os=require("os");
app.use("/public", express.static(__dirname + '/'));

app.use(bodyParser.urlencoded({ extended: true })); 

app.get('/', function(req, res){
   
    res.sendFile(__dirname+'/form1.html');
    //res.sendFile('/usr/src/resource/sensor_onboard/form1.html');
});

app.post('/dhubOnBoard', function(req, res) {

	var jsondata   = {};
	var connstr    = req.body.connstr;
	var dboardlink = req.body.dboardlink;
	var dhubmac    = req.body.dhubmac.toUpperCase();

	jsondata["datahubmac"]       = dhubmac;
	jsondata["connectionstring"] = connstr;
	jsondata["dashboardlink"]    = dboardlink;
	jsondata["type"]             = "Admin";
	

	var options = {
		  uri: 'https://ratmanepcdemo.azurewebsites.net/api/ratmanOnboarding?code=bbKDCcV89u6DfPAats7C1Otfv8FwuKlLgoigYSfr/GmaGLTD3VlTUQ==',
		  method: 'POST',
		  json: jsondata
		};
		
	request(options, 
		(error, resp, body) => {
		if (error) 
		    throw error;
		    
		if(resp.statusCode == 200 && body != "")
			if(body.includes("anymore") || body.includes("done"))
			{
			    res.send("Successfully uploaded admin details of Datahub: " + dhubmac);
			    console.log(body);
			}
    			
    		else
    			res.send("Failed to write to database.");
    	else
    		res.send("Failed to send data.");			
	});

});



app.listen(3001)
console.log("Listening at 3001...")
