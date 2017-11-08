// Example from Brad Dayley
// https://github.com/bwdbooks/nodejs-mongodb-angularjs-web-development
// Enhanced Nov 2017 for ASU SER 421 Fall B
// David Arnold
// Lab 3 Activity 2
// Add options for current weather and 5 day forecast

var http = require('http');
var url = require('url');
var qstring = require('querystring');

function sendAltResponse(city, res){
    if (/\s/.test(city)) {
    temp=city.split(" ");
    city="";
    for(i=0;i<temp.length;i++){
      city+=temp[i];
    }
  }
    var page = '<html><head><title>External Example</title></head>' +
    '<body>' +
    '<form method="post">' +
    'City: <input name="city" value='+city+'><br><br>'+
    '<input type="submit" name="vote" value="Weather"><br><br>' +
    '<input type="submit" name="vote" value="Forecast">' +
    '</form></body></html>';
    res.end(page);
  }

function sendResponse(weatherData, res){
    var page = '<html><head><title>External Example</title></head>' +
    '<body>' +
    '<form method="post">' +
    'City: <input name="city"> <br><br>' +
    '<input type="submit" name="vote" value="Weather"><br><br>' +
    '<input type="submit" name="vote" value="Forecast">' +
    '</form>';

  if(weatherData){
    var dataObj = JSON.parse(weatherData);
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Set-Cookie': 'city=' + dataObj.name + '; expires='+
          new Date(new Date().getTime()+60*60*24*1000*30).toUTCString()
      });

    page += '<h2>Current Weather for '+dataObj.name+'</h2>'+
    "Fahrenheit: "+((1.8*(dataObj.main.temp-273.15))+32).toFixed(2)+" degrees <br>"+
    "Celcius: " +(dataObj.main.temp-273.15).toFixed(2)+" degrees <br>"+
    "Brief Description: ";

    for (i=0; i<dataObj.weather.length; i++){
      page+=dataObj.weather[i].main;
        if (i<dataObj.weather.length-1)
        page+=", ";
      }

    page+= "<br>Expanded Description: ";

    for (j=0; j<dataObj.weather.length; j++){
      page+=dataObj.weather[j].description;
        if (j<dataObj.weather.length-1)
          page+=", ";
    }
  }
  page += '</body></html>';
  res.end(page);
}

function calcMin(fcstObj,start,fin){
  for(i=start; i<fin; i++)
  minTemp=500;
  for (i=start; i<fin; i++){
   min=((1.8*(fcstObj.list[i].main.temp_min-273.15))+32);
   min2=((1.8*(fcstObj.list[i+=1].main.temp_min-273.15))+32);
   if (min<=min2)
          val=min;
        else
          val=min2;

        if (val<minTemp)
          minTemp=val;
        return minTemp;
      }
}

function calcMax(fcstObj,start,fin){
  maxTemp=-500;
  for (i=start; i<fin; i++){
  max=((1.8*(fcstObj.list[i].main.temp_max-273.15))+32);
  max2=((1.8*(fcstObj.list[i+=1].main.temp_max-273.15))+32);
   if (max>=max2)
          valMax=max;
        else
          valMax=max2;

        if (val>maxTemp)
          maxTemp=valMax;
      }
      return maxTemp;
    }

function sendForecast(weatherData, res){
  var page = '<html><head><title>External Example</title></head>' +
    '<body>' +
    '<form method="post">' +
    'City: <input name="city"><br><br>' +
    '<input type="submit" name="vote" value="Weather"><br><br>' +
    '<input type="submit" name="vote" value="Forecast">' +
    '</form>';

  if(weatherData){
    var fcstObj = JSON.parse(weatherData);
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Set-Cookie': 'city=' + fcstObj.city.name + '; expires='+
          new Date(new Date().getTime()+60*60*24*1000*30).toUTCString()
      });

      page += '<h2>5 Day Weather Forecast for '+fcstObj.city.name+'</h2>'+
      "<table><tr>"+
      "<th width='175'>Day</th>"+
      "<th width='150'>Min. Daily Temp degrees F</th>"+
      "<th width='120'>Max. Daily Temp degrees F</th>";

    cycle=1;
    day=0;
    start=0;
    fin=7;

    do{
      var date=fcstObj.list[day].dt_txt.split(" ");
      page+="<table><tr><th width='175'>"+date[0] + "</th>";
      minTemp=calcMin(fcstObj,start,fin);
      maxTemp=calcMax(fcstObj,start,fin);
      page+="<th width='150'>"+minTemp.toFixed(2) + "</th>"+
        "<th width='120'>"+maxTemp.toFixed(2) + "</th><tr><table>";
      day+=8;
      cycle++;
      start+=7;
      fin+=7;
      }while(cycle<=5);

    page += '<h2>3 Hour Block Weather Description</h2>'
    page += "<table><tr>"+
      "<th width='175'>Date/Time</th>"+
      "<th width='120'>Brief Description</th>"+
      "<th width='200'>Expanded Description</th></tr></table>";
    
    for (i=0; i<fcstObj.list.length; i++){
      page+="<table><tr><td width='210'>"+fcstObj.list[i].dt_txt + "</td>"+
      "<td width='140'>"+fcstObj.list[i].weather[0].main+"</td>"+
      "<td width='200'>"+fcstObj.list[i].weather[0].description+"</td>"+
      "</tr></table>";
    }
  }
  page += '</body></html>';
  res.end(page);
}

function badMethod(req,res){
  res.writeHead(405, {
      'Content-Type': 'text/html',
      });
  var page2 = '<html><head><title>Method Not Allowed</title></head>'+
    "<body>"+
    "<h2> Method Not Allowed. Error code: 405 </h2><br>" +
    "<p> Click below to return to city-search page."+
    "<form method='post'>"+
    "<input type='submit' value='Return'>"+
    "</form></body></html>";
    res.end(page2);
  }

function parseWeather(weatherResponse, res) {
  var weatherData = '';
  weatherResponse.on('data', function (chunk) {
    weatherData += chunk;
  });
  
  weatherResponse.on('end', function () {
    sendResponse(weatherData, res);
  });
}

function parseForecast(weatherResponse, res) {
  var weatherData = '';
  weatherResponse.on('data', function (chunk) {
    weatherData += chunk;
  });

  weatherResponse.on('end', function () {
    sendForecast(weatherData, res);
  });
}

//parseCookies credit given to Corey Hart
//posted at:
//stackoverflow.com/questions/3393854/get-and-set-a-single-cookie-with-node-js-http-server/3409200#3409200
function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
}

function getWeather(city, res){
  if (/\s/.test(city)) {
    temp=city.split(" ");
    city="";
    for(i=0;i<temp.length;i++){
      city+=temp[i];
    }
  }

  var options = {
    host: 'api.openweathermap.org',
    path: '/data/2.5/weather?q=' + city + "&APPID=4659a714d7becb2ff4bebc3cc10ae36d" // my API key Nov1
  };

  http.request(options, function(weatherResponse){
    parseWeather(weatherResponse, res);
  }).end();
}

function getForecast(city, res){
    if (/\s/.test(city)) {
    temp=city.split(" ");
    city="";
    for(i=0;i<temp.length;i++){
      city+=temp[i];
    }
  }

  var options = {
    host: 'api.openweathermap.org',
    path: '/data/2.5/forecast?q=' + city + "&APPID=4659a714d7becb2ff4bebc3cc10ae36d" // my API key Nov1
  };

  http.request(options, function(weatherResponse){
    parseForecast(weatherResponse, res);
  }).end();
}

http.createServer(function (req, res) {
  var cookies = parseCookies(req);
  
  if (req.method == "POST" || req.method=="GET"){
    var reqData = '';
    req.on('data', function (chunk) {
      reqData += chunk;
    });

    req.on('end', function() {
      var postParams = qstring.parse(reqData);

    if (postParams.vote=="Weather"){        
      getWeather(postParams.city, res);
    }
    else if(postParams.vote=="Forecast"){
      getForecast(postParams.city, res);
    }
    else{
          sendAltResponse(cookies.city, res);
        }
    });
  } 
  else {
     badMethod(null,res);
   }
 }).listen(8080);
