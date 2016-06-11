window.addEventListener('load', function () {
    'use strict';
    function statsData(data, stat, label) {
	var labels = [];
	var dataset = [];
	var i;

	if (data.length == 0) {
	    return null;
	}

	if (stat === "airshots" && !(data[0].class === "soldier" || data[0].class === "demoman")) {
	    return null;
	}

	if (stat === "drops" && !data[0].class === "medic") {
	    return null;
	}

	data.sort(function(a, b) {
	    return b[stat] - a[stat]
	})

	for (i in data) {
	    labels.push(data[i].player.name);
	    dataset.push(data[i][stat]);
	};

	return {
	    type: 'horizontalBar',
	    data: {
		labels: labels,
		datasets: [{
		    label: label,
		    data: dataset,
		    backgroundColor: 'rgba(0, 91, 168, 1)',
		}]
	    },
	};
    };

    function statsDataLine(data, stat, label) {
	var labels = [];
	var dataset = [];
	var i;

	if (data.length == 0) {
	    return null;
	}

	if (stat === "airshots" && !(data[0].class === "soldier" || data[0].class === "demoman")) {
	    return null;
	}

	for (i in data) {
	    labels.push(i.toString());
	    dataset.push(data[i][stat])
	}
	console.log(data[0])
	
	return {
	    type: "line",
	    data: {
		labels: labels,
		datasets: [{
		    label: label,
		    data: dataset,
		    fill: false,
		    lineTension: 0.1,
		    backgroundColor: "rgba(0, 91, 168, 1)",
		    borderCapStyle: 'butt',
		    borderDash: [],
		    borderDashOffset: 0.0,
		    borderJoinStyle: 'miter',
		    pointBorderColor: "rgba(75,192,192,1)",
		    pointBackgroundColor: "#fff",
		    pointBorderWidth: 1,
		    pointHoverRadius: 5,
		    pointHoverBackgroundColor: "rgba(75,192,192,1)",
		    pointHoverBorderColor: "rgba(220,220,220,1)",
		    pointHoverBorderWidth: 2,
		    pointRadius: 1,
		    pointHitRadius: 10,
		}]
	    },
	    options: {
		title: {
		    display: true,
		    text: data[0].player.name,
		},
	    }
	}
    };
    
    function nextIndex(arr, index) {
	if (index+1 === arr.length) {
	    return 0;
	}
	return index + 1;
    };

    // http://stackoverflow.com/a/901144
    function getParam(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    var classes = ["scout", "soldier", "demoman", "medic"];
    var stats = ["dpm", "kills", "kd", "airshots", "drops"];
    var desc = {"dpm": "Damage Per Minute", "kills": "Kills", "kd": "K/D Ratio",
		"airshots": "Airshots", "drops": "Drops"};

    Chart.defaults.global.legend.position = 'bottom'
    Chart.defaults.bar = Chart.defaults.horizontalBar
    Chart.defaults.global.maintainAspectRatio = false
    Chart.defaults.global.responsive = false
    Chart.defaults.global.defaultFontColor = 'rgba(255, 255, 255, 1)'
    Chart.defaults.global.defaultFontStyle = 'bold'

    var ctx = document.getElementById("myChart");
    var linechart = false
    var param = "?class=" + getParam("class");

    if (getParam("class") == null) {
	linechart = true;
	param = "?playerid=" + getParam("playerid");
    }


    $.getJSON("/getstats" + param, function(data) {
	var index = 0;
	var chart;
	if (!linechart){
	    chart = new Chart(ctx, statsData(data, stats[index], desc[stats[index]]));
	} else {
	    chart = new Chart(ctx, statsDataLine(data, stats[index], desc[stats[index]]))
	}
	index = nextIndex(stats, index);
	chart.resize();
	
	function nextGraph() {
	    //chart.destroy()
	    var c1;
	    if (!linechart) {
		c1 = statsData(data, stats[index], desc[stats[index]]);
	    } else {
		c1 = statsDataLine(data, stats[index], desc[stats[index]])
		console.log(c1)
	    }
	    
	    index = nextIndex(stats, index);
	    if (c1 === null) {
		nextGraph();
		return;
	    }
	    
	    chart.data.labels = c1.data.labels;
	    chart.data.datasets = c1.data.datasets;

	    
	    chart.update(1000, false);
	}
	$(ctx).click(function() {
	    nextGraph();
	    clearInterval(interval)
	});
	var interval = setInterval(nextGraph, 10*1000);
    })
});
