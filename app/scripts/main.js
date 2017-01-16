var app = app || {};

var goal = app.queryUrl.goal || 3900;
var goal2 = app.queryUrl.goal2 || 3000;

var DATE = new Date();
var date = {
	today: DATE.getDate(),
	currentMonth: DATE.getMonth()+1,
	currentYear: DATE.getFullYear()
};

date.month = app.queryUrl.month || date.currentMonth;
date.year = app.queryUrl.year || date.currentYear;
date.lastDay = new Date(2016, date.month, 0).getDate();

if(date.month.toString().length < 2){
	date.month = '0'+date.month;
}

if(date.currentMonth > date.month) {
	$('.js-global-today').parent().hide();
	$('.js-global-trend').parent().hide();
}

document.getElementById('auth-button').addEventListener('click', authorize);
document.getElementById('logout-button').addEventListener('click', unauthorize);

// set form values
$('.js-month-select').val(date.month);
$('.js-year-select').val(date.year);
$('.js-goal-select').val(goal);
$('.js-goal2-select').val(goal2);

function queryMonth(profileId, startDate) {
  gapi.client.analytics.data.ga.get({
    'ids': 'ga:' + profileId,
    'start-date': date.year+'-'+date.month+'-01',
    'end-date': date.year+'-'+date.month+'-'+date.lastDay,
    'dimensions': 'ga:day',
    'metrics': 'ga:sessions'
  })
  .then(function(response) {

  	var sessions = response.result.totalsForAllResults['ga:sessions'];
  	drawData(sessions, response.result.rows[date.today-1], goal, $('.js-global-data'));

	//accumulated chart
	var formatedData = formatDailyData(sessions, goal, response.result.rows, true);
	drawChart('myChart', formatedData);

	var formatedAccumulatedData = formatDailyData(sessions, goal, response.result.rows, false);
	drawChart('myChart2', formatedAccumulatedData);
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

  	var sessions = response.result.totalsForAllResults['ga:sessions'];
  	drawData(sessions, response.result.rows[date.today-1], goal2, $('.js-north-europe-data'));
	//accumulated chart
	var formatedData = formatDailyData(sessions, goal2, response.result.rows, true);
	drawChart('myChart3', formatedData);

	var formatedAccumulatedData = formatDailyData(sessions, goal2, response.result.rows, false);
	drawChart('myChart4', formatedAccumulatedData);
  })
  .then(null, function(err) {
  });
}


function formatDailyData(sessions, goal, rawArray, isAccumulated) {
 	var dailyLabels = [];
 	var dailyData = [];
 	for(var i=0; i<rawArray.length; i++) {
    	dailyLabels.push(rawArray[i][0]);
	    if(i < date.today || date.currentMonth > date.month || date.currentYear > date.year){
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

	if(date.currentMonth == date.month && date.currentYear == date.year && isAccumulated) {
		formattedData.trend =  getTrend(sessions, rawArray.length);
	}

	return formattedData;
}


function getDailyGoal(monthlyGoal, length, isAccumulated){
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
    	label: 'Sessions',
    	backgroundColor: 'rgba(33,150,243,0.4)',
        borderColor: 'rgba(33,150,243,1)',
        pointBorderColor: 'rgba(33,150,243,1)',
        pointHoverBackgroundColor: 'rgba(33,150,243,1)',
        pointHoverBorderColor: 'rgba(220,220,220,1)',
    	data: chartData.dailyData
    });
    data.datasets.push(dailyData);

    var dailyGoal = app.extend(datasetModel, {
    	label: 'Goal',
    	backgroundColor: 'rgba(175,175,175,0.1)',
        borderColor: 'rgba(175,175,175,0.2)',
        pointBorderColor: 'rgba(175,175,175,0.2)',
        pointHoverBackgroundColor: 'rgba(175,175,175,0.3)',
        pointHoverBorderColor: 'rgba(220,220,220,0.3)',
    	data: chartData.dailyGoal
    });
    data.datasets.push(dailyGoal);

    if(chartData.trend) {
    	var trend = app.extend(datasetModel, {
    		fill: false,
    		label: 'Trend',
	    	backgroundColor: 'rgba(33,150,243,0.1)',
	        borderColor: 'rgba(33,150,243,0.2)',
	        pointBorderColor: 'rgba(33,150,243,0.2)',
	        pointHoverBackgroundColor: 'rgba(33,150,243,0.2)',
	        pointHoverBorderColor: 'rgba(220,220,220,0.2)',
    		data: chartData.trend
    	});
    	data.datasets.push(trend);
    }

  	var myChart = new Chart(ctx, {
	    type: 'line',
	    data: data,
	    options: {
	    	legend: {
	    		position: 'bottom',
	    		fullWidth: false,
	    		labels: {
	    			boxWidth: 15
	    		}
	    	}
	    }
	});
}

function drawData(total, today, goal, $parentEl){
	var totalFormatted = Number(total).toLocaleString();
	var today = Number(today[1]).toLocaleString();
	var formattedGoal = Number(goal).toLocaleString();
	var achieved = (total*100/goal).toFixed(1);
	var trend = Number(Math.round(date.lastDay*total/date.today)).toLocaleString();
	var dom = (date.today*100/date.lastDay).toFixed(1);

	$parentEl.find('.js-global-total').html(totalFormatted);
	$parentEl.find('.js-global-today').html(today);
	$parentEl.find('.js-global-goal').html(formattedGoal);
	$parentEl.find('.js-global-achieved').html(achieved+'%');
	$parentEl.find('.js-global-dom').html(dom+'% of month');
	$parentEl.find('.js-global-trend').html(trend);
}
