var app = app || {};

console.log('hello');
var goal = app.queryUrl.goal || 3900; 
var goal2 = app.queryUrl.goal2 || 3900; 

var DATE = new Date();
var date = {
	today: DATE.getDate(),
	currentMonth: DATE.getMonth()+1,
	month: app.queryUrl.month || date.currentMonth
}

date.lastDay = new Date(2016, date.month, 0).getDate();

if(date.month.length < 2){
	date.month = "0"+date.month;
}

console.log(date);


document.getElementById('auth-button').addEventListener('click', authorize);
document.getElementById('logout-button').addEventListener('click', unauthorize);

function queryMonth(profileId, startDate) {
  gapi.client.analytics.data.ga.get({
    'ids': 'ga:' + profileId,
    'start-date': '2016-'+date.month+'-01',
    'end-date': '2016-'+date.month+'-'+date.lastDay,
    'dimensions': 'ga:day',
    'metrics': 'ga:sessions'
  })
  .then(function(response) {
  	console.log(response)

  	var sessions = response.result.totalsForAllResults['ga:sessions'];
  	drawData(sessions, response.result.rows[date.today-1], goal, $('.js-global-data'));
	//accumulated chart
	var formatedData = formatDailyData(sessions, goal, response.result.rows, true);
	drawChart('myChart', formatedData);

	var formatedData = formatDailyData(sessions, goal, response.result.rows, false);
	drawChart('myChart2', formatedData);
  })
  .then(null, function(err) {
  });


  gapi.client.analytics.data.ga.get({
    'ids': 'ga:' + profileId,
    'start-date': '2016-'+date.month+'-01',
    'end-date': '2016-'+date.month+'-'+date.lastDay,
    'filters': 'ga:continent==Europe,ga:subContinentCode==021',
    'dimensions': 'ga:day',
    'metrics': 'ga:sessions'
  })
  .then(function(response) {
  	console.log(response)

  	var sessions = response.result.totalsForAllResults['ga:sessions'];
  	drawData(sessions, response.result.rows[date.today-1], goal, $('.js-north-europe-data'));
	//accumulated chart
	var formatedData = formatDailyData(sessions, goal, response.result.rows, true);
	drawChart('myChart3', formatedData);

	var formatedData = formatDailyData(sessions, goal, response.result.rows, false);
	drawChart('myChart4', formatedData);
  })
  .then(null, function(err) {
  });
}


function formatDailyData(sessions, goal, rawArray, isAccumulated) {
 	var dailyLabels = [];
 	var dailyData = [];
 	for(var i=0; i<rawArray.length; i++) {
    	dailyLabels.push(rawArray[i][0]);
	    if(i < date.today || date.currentMonth > date.month){ 
			if(isAccumulated){
				var value = parseInt(rawArray[i][1]);
				if(i>0){
				  	value = parseInt(value) + parseInt(dailyData[i-1]);
				}
				dailyData.push(value);  
			}
			else {
				dailyData.push(rawArray[i][1]);
			}
	    }
	}

	var formattedData = {
	'dailyLabels': dailyLabels,
	'dailyData': dailyData,
	'dailyGoal': getDailyGoal(goal, rawArray.length, isAccumulated)
	};

	if(date.currentMonth == date.month && isAccumulated) {
		formattedData.trend =  getTrend(sessions, rawArray.length);
	}

	return formattedData;
}


function getDailyGoal(monthlyGoal, length, isAccumulated){
  console.log(monthlyGoal);
  var dailyGoal = monthlyGoal/length;
  var dailyTotalGoal = [];


  for (var i = 1; i <= length; i++) {
    if(isAccumulated) {
      dailyTotalGoal.push(parseInt(dailyGoal*i));
    }
    else {
      dailyTotalGoal.push(parseInt(dailyGoal));
    }
  };
  return dailyTotalGoal;
}


function getTrend(currentSessions, length){
  var trendSessions = length*currentSessions/date.today;

  var dailyGoal = trendSessions/length;
  var dailyTotalGoal = [];


  for (var i = 1; i <= length; i++) {
      dailyTotalGoal.push(parseInt(dailyGoal*i));
  };
  return dailyTotalGoal;
}


function drawChart(canvas, chartData){
	console.log(canvas, chartData)
	var ctx = document.getElementById(canvas);
	var data = {
    	labels: chartData.dailyLabels,
    	datasets: []
  	};

	var datasetModel = {
        fill: true,
        lineTension: 0.1,
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        borderWidth: 2
    };

    var dailyData = app.extend(datasetModel, {
    	label: "Sessions",
    	backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
        pointBorderColor: "rgba(75,192,192,1)",
        pointHoverBackgroundColor: "rgba(75,192,192,1)",
        pointHoverBorderColor: "rgba(220,220,220,1)",
    	data: chartData.dailyData
    });
    data.datasets.push(dailyData);

    var dailyGoal = app.extend(datasetModel, {
    	label: "Goal",
    	backgroundColor: "rgba(75,192,192,0.2)",
        borderColor: "#ECEFF1",
        pointBorderColor: "rgba(75,192,192,0.3)",
        pointHoverBackgroundColor: "rgba(75,192,192,0.3)",
        pointHoverBorderColor: "rgba(220,220,220,0.3)",
    	data: chartData.dailyGoal
    });
    data.datasets.push(dailyGoal);

    if(chartData.trend) {
    	var trend = app.extend(datasetModel, {
    		label: "Trend",
	    	backgroundColor: "rgba(75,192,192,0.2)",
	        borderColor: "rgba(75,192,192,0.3)",
	        pointBorderColor: "rgba(75,192,192,0.3)",
	        pointHoverBackgroundColor: "rgba(75,192,192,0.3)",
	        pointHoverBorderColor: "rgba(220,220,220,0.3)",
    		data: chartData.trend
    	});
    	data.datasets.push(trend);
    }
	
  	var myChart = new Chart(ctx, {
	    type: 'line',
	    data: data,
	    options: {
	    }
	});
}

function drawData(total, today, goal, $parentEl){
	var total = total;
	var today = today[1];
	var goal = goal;
	var achieved = total*100/goal;
	var trend = date.lastDay*total/date.today;

	$parentEl.find('.js-global-total').html(total);
	$parentEl.find('.js-global-today').html(today);
	$parentEl.find('.js-global-goal').html(goal);
	$parentEl.find('.js-global-achieved').html(achieved+"%");
	$parentEl.find('.js-global-trend').html(trend);
}