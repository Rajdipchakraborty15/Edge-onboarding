
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
			    res.sendFile(__dirname+'/form2.html');
			    //res.sendFile('/usr/src/resource/sensor_onboard/form2.html');
			    console.log(body);
			}
    			
    		else
    			res.send("Failed to write to database.");
    	else
    		res.send("Failed to send data.");			
	});

});

app.post('/onBoard', function(req, res) {
   
	var count            = req.body.count;
	var jsondata         = {};		
	var sensorsonboarded = {};
	
	
	var machine = req.body.machine;
	var zone    = req.body.zone;
	var loc     = req.body.loc;
	var san     = req.body.san;
	var dhubmac = req.body.dhubmac.toUpperCase();
	var macstr  = "";
	
	var header = "{\"machine\":\""+machine+"\",\"zone\":\""+zone+"\",\"location\":\""+loc+"\"}";
	

	for (var i = 1; i <= count; i++)
	{
		dmac  = "mac" + i;
		dtype = "opt" + i;
		sensorsonboarded[req.body[dmac].toUpperCase()] = req.body[dtype];
		
		macstr = macstr + req.body[dmac].toUpperCase() + ',' + req.body[dtype] + '\n';
	}

	sensorsonboarded             = JSON.stringify(sensorsonboarded).replace(/["]/g, "\"");
	jsondata["header"]           = header;
	jsondata["devicetype"]       = san;
	jsondata["sensorsonboarded"] = sensorsonboarded; 
	jsondata["datahubmac"]       = dhubmac;
	jsondata["type"]             = "Datahub";

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
			if(body.includes("updated"))
			{
				console.log(body);
			    fs.writeFile('sensor.config',macstr,'utf8', function (err) {
				//fs.writeFile('/usr/src/conf/sensor.config','utf8', function (err) {
		        
					if (err) throw err;
					console.log('Successfully uploaded file: onboarding.json and saved file: sensor.config!');
					fs.writeFile('onboarding.json',JSON.stringify(jsondata), (err) => {
					//fs.writeFile('/usr/src/conf/'onboarding.json',JSON.stringify(jsondata), (err) => {
						if (err) throw err;
						console.log('Successfully written file: onboarding.json to datahub!');
						res.send("Successfully uploaded file: onboarding.json and saved file: sensor.config!");
					});	
					
				});
			}
    		else
    			res.send("Device : " + dhubmac + " has not been onboarded, please ask admin to onboard device.");
    	else
    		res.send("Failed to send data.");			

  /*fs.writeFile('onboarding.json',JSON.stringify(jsondata), function (err) {
  //fs.writeFile('/usr/src/conf/onboarding.json',JSON.stringify(jsondata), function (err) {
        
	//	if (err) throw err;
		fs.writeFile('sensor.config',macstr,'utf8', function (err) {
		//fs.writeFile('/usr/src/conf/sensor.config','utf8', function (err) {
        
			if (err) throw err;
			console.log('\n\n Successfully saved to file: onboarding.json and sensor.config!');
		});
        */
    });  
});

app.post('/replace', function(req, res) {
    var mac     = req.body.offmac.toUpperCase();
	var newmac1 = req.body.newmac.toUpperCase();
	var found   = 0;
	fs.readFile('sensor.config', 'utf8', function (err, data) {
	//fs.readFile('/usr/src/conf/sensor.config', 'utf8', function (err, data) {
		if (err) throw err;
		var newstr = ""
		var arr    = data.split('\n');
		for (var i in arr)
		{
			
			if(mac != arr[i].slice(0, 17) && arr[i] != "")
				
				newstr = newstr+arr[i]+"\n";		
			
			else
				if(arr[i] != "")
				{
					
					newstr = newstr+newmac1+arr[i].slice(17)+"\n";		
					found  = 1;
				}
		}
		
		
		if(found == 1)
		{
			
			fs.readFile('onboarding.json', 'utf8', function (err, data) {
			//fs.readFile('/usr/src/conf/sensor.config', 'utf8', function (err, data) {
				if (err) throw err;
				
				var jsondata                 = JSON.parse(data);
				var sensorsonboarded         = jsondata['sensorsonboarded'];
				sensorsonboarded             = sensorsonboarded.replace(/[\"]/g, '"');
				sensorsonboarded             = JSON.parse(sensorsonboarded);
				sensorsonboarded[newmac1]    = sensorsonboarded[mac];
				delete sensorsonboarded[mac];
				jsondata["sensorsonboarded"] = JSON.stringify(sensorsonboarded).replace(/["]/g, "\"");

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
						if(body.includes("updated"))
						{
							fs.writeFile('sensor.config',newstr, (err) => {
							//fs.writeFile('/usr/src/conf/sensor.config',newstr, (err) => {
								if (err) throw err;
							
						    	console.log(mac + " has been replaced by" + newmac1 + " in azure and sensor.config!");
								fs.writeFile('onboarding.json',JSON.stringify(jsondata), (err) => {
								//fs.writeFile('/usr/src/conf/'onboarding.json',JSON.stringify(jsondata), (err) => {
									if (err) throw err;
									console.log(mac + " has been replaced by" + newmac1 + " in datahub!");
									res.send(mac + " has been replaced by" + newmac1 + "!");
								});					
							});
						}
			    		else
			    			res.send("Device : " + dhubmac + " has not been onboarded, please ask admin to onboard device.");
			    	else
			    		res.send("Failed to send data.");														
				});
			});
		
		}
		else
			res.send(mac + " is not found.");
		
      });
	
		
  });  
  /*
  app.post('/homeSave', function(req, res) {
    

	var json = {};
	

	fs.appendFile('onboarding.json',JSON.stringify(json)+os.EOL, 'utf8', function (err) {
    //fs.appendFile('/usr/src/conf/onboarding.txt',save+os.EOL,'utf8', function (err) {
        if (err) throw err;
        console.log('\n\n Successfully saved to file: onboarding.txt!');
      });
	res.send("File saved!");  
  });*/
  
//app.use(express.static('public'))
app.post('/offboard', function(req, res) {
    
	fs.writeFile('sensor.config',"", (err) => {
	//fs.writeFile('/usr/src/conf/sensor.config',"", (err) => {
		if (err) throw err;
		fs.writeFile('onboarding.json',"", (err) => {
		//fs.writeFile('/usr/src/conf/'onboarding.json',JSON.stringify(jsondata), (err) => {
			if (err) throw err;
			
			console.log("File has been offBoarded");	
			res.send("Files have been offBoarded");
	});

		
  });  
});  


app.listen(3001)
console.log("Listening at 3001...")
