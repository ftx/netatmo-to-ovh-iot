var cron = require('node-cron');
var netatmo = require('netatmo');
var request = require("request");

//ENV Vars
var login_ovh_iot 	= process.env.TOKEN_ID; 
var password_ovh_iot 	= process.env.TOKEN_KEY;
var time_to_while	= process.env.QUERY_TIME;

var auth = {
  "client_id": process.env.NETATMO_CLIENT_ID,
  "client_secret": process.env.NETATMO_CLIENT_SECRET,
  "username": process.env.NETATMO_USERNAME,
  "password": process.env.NETATMO_PASSWORD,
};

//Query Netatmo 
var api = new netatmo(auth);

//IOT OVH Function
//
//
function ovhiot(login, password, json_data, name){
request({
               uri: "https://opentsdb-gra1.tsaas.ovh.com/api/put",
               auth: {
                       user: login,
                       pass: password,
                       sendImmediately: true
               },
               method: "POST",
               json: json_data
               }, function (error, response, body) {


if (error) {
          console.log(error);
       } else if (response.statusCode >= 400) {
          console.log(body);
          console.log(response.statusMessage);
       } else {
          console.log("Success to IOT -> "+ name);
              }
});

}


function netdata(){ 
  // Get Stations Data 
  api.getStationsData(function(err, devices) {

  //Debug JSON
  console.log(util.inspect(devices[0], false, null))
  console.log("-------------------------------")
  
  ////////// Modules

  //VARS
  var type      = devices[0]['data_type'];
  var module    = devices[0]['module_name'];
  var city      = devices[0]['place']['city'];
  var wifi      = devices[0]['wifi_status'];
 
  var modules	= devices[0]['modules'];    
  var nbr_modules = Object.keys(modules).length;
  var m=0;

  console.log("NOMBRE DE MODULES : "+ nbr_modules);
  console.log("-------------------------------");

  do {
        m++;
	var n = m - 1;
	var module_module	= devices[0]['modules'][n]['module_name']
	var module_datas	= devices[0]['modules'][n]['data_type']
	var module_battery	= devices[0]['modules'][n]['battery_percent']
	var module_signal	= devices[0]['modules'][n]['rf_status']
	// WHILE
	module_datas.forEach(function(x){

		if (x == "Wind"){ 
			var module_measurement = "WindStrength";
		}
		else {
			var module_measurement   = x;
		}

      		var module_value         = devices[0]['modules'][n]['dashboard_data'][module_measurement];
		
		//DEBUG
		console.log(module_module + " / " + x + " -> " + devices[0]['modules'][n]['dashboard_data'][module_measurement]);

		var data = [{
                        metric:module_measurement,
                        value:module_value,
                        tags:{
                                source:module_module,
                                region:city
                        }
                }];


		ovhiot(login_ovh_iot, password_ovh_iot, data, module_measurement);

	})	

	// Other Modules Datas
	// Battery
	var data = [{
                        metric:"battery_status",
                        value:module_battery,
                        tags:{
                                source:module_module,
                                region:city
                        }
        }];
	ovhiot(login_ovh_iot, password_ovh_iot, data, "Battery");
	console.log(module_module + " / Battery " + " -> " + module_battery);
	//Signal
	var data = [{
                        metric:"rf_signal",
                        value:module_signal,
                        tags:{
                                source:module_module,
                                region:city
                        }
        }];
        ovhiot(login_ovh_iot, password_ovh_iot, data, "RF_Signal");
	console.log(module_module + " / RF_Signal " + " -> " + module_signal);
  }
   while (m!=nbr_modules);



  //////// Principal Station

  // WHILE
  type.forEach(function(t){

      var measurement 	= t; 
      var value         = devices[0]['dashboard_data'][t];
      
      //DEBUG CONSOLE
      console.log(module + " / " + t + " -> " + devices[0]['dashboard_data'][t]);
      
      var data = [{
                        metric:measurement,
                        value:value,
                        tags:{
                                source:module,
                                region:city
                        }
                }];
      
      
     ovhiot(login_ovh_iot, password_ovh_iot, data, measurement); 

  })
  
  var data = [{
                        metric:"wifi_status",
                        value:wifi,
                        tags:{
                                source:module,
                                region:city
                        }
      }];
  ovhiot(login_ovh_iot, password_ovh_iot, data, "Wifi_status");
  console.log(module + " / " + "Wifi_status" + " -> " + wifi);


});
}

netdata();
cron.schedule('*/'+ time_to_while +' * * * *', function(){
  console.log('NetAtmo Data Pull');
  netdata();
});
