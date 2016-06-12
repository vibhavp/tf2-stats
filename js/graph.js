window.addEventListener('load', function () {
    'use strict';

    var desc = {"dpm": "Damage Per Minute", "kills": "Kills", "kd": "K/D Ratio",
		"airshots": "Airshots", "drops": "Drops"};
    var allStats = ["dpm", "kills", "kd", "airshots", "drops"];
    var validStats = {
	"scout": ["dpm", "kills", "kd"],
	"soldier": ["dpm", "kills", "kd", "airshots"],
	"demoman": ["dpm", "kills", "kd", "airshots"],
	"medic": ["drops"],
	"sniper": ["headshots", "kills"],
	"spy": ["kills", "kd"],
	"pyro": ["kills", "kd"],
	"engineer": ["kills"],
	"heavyweapons": ["dpm", "kills", "kd"]
    }

    function isValidStat(stat, className){
	return validStats[className].find(function(s) {return s === stat});
    }

    
    function statsData(data, stat, label) {
	var labels = [];
	var dataset = [];
	var i;
	var zero;

	data.sort(function(a, b) {
	    return b[stat] - a[stat]
	})

	for (i in data) {
	    if (Math.floor(data[i][stat]) != 0) {
		labels.push(data[i].player.name);
		dataset.push(data[i][stat]);
	    } else {
		zero = true;
	    }
	}
	if (zero) {
	    labels.push("");
	    dataset.push(0.0);
	}

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

	console.log(data);

	for (i in data) {
	    labels.push(i.toString());
	    dataset.push(data[i][stat])
	}

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

    Chart.defaults.global.legend.position = 'bottom'
    Chart.defaults.bar = Chart.defaults.horizontalBar
    Chart.defaults.global.maintainAspectRatio = false
    Chart.defaults.global.responsive = false
    Chart.defaults.global.defaultFontColor = 'rgba(255, 255, 255, 1)'
    Chart.defaults.global.defaultFontStyle = 'bold'

    var ctx = document.getElementById("myChart");
    var param = "?class=" + getParam("class");

    if (getParam("class") == null) {
	param = "?playerid=" + getParam("playerid");
    }

    var index = 0;

    function getGraphData(data) {
	function nextIndex(arr, index) {
	    if (index+1 === arr.length) {
	        return 0;
	    }
	    return index + 1;
        };

	var d;

	if (data.type === "class") {
	    var name = validStats[data.data[0].class][index];
	    d = statsData(data.data, name, desc[name]);
	    index = nextIndex(validStats[data.data[0].class], index);
	} else { // "player"
	    d = statsDataLine(data.data, allStats[index], desc[allStats[index]])
	    index = nextIndex(allStats, index);
	}

	return d;
    }

    $.getJSON("/getstats" + param, function(data) {
	if (data.data.length === 0) {
	    return;
	}

	var chart = new Chart(ctx, getGraphData(data))
	chart.resize();

	function nextGraph() {
	    //chart.destroy()
	    var c1 = getGraphData(data);
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
