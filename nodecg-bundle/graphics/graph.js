window.addEventListener('load', function () {
    'use strict';

    var desc = {"dpm": "Damage Per Minute", "kills": "Kills", "kd": "K/D Ratio",
		"airshots": "Airshots", "drops": "Drops",
		"damage_per_heal": "Damage dealt per heal"};
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
	"heavyweapons": ["dpm", "kills", "kd"],
	"allclass": ["damage_per_heal"],
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

	console.log(labels);
	console.log(dataset);
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

    Chart.defaults.global.legend.position = 'bottom'
    Chart.defaults.bar = Chart.defaults.horizontalBar
    Chart.defaults.global.maintainAspectRatio = false
    Chart.defaults.global.responsive = false
    Chart.defaults.global.defaultFontColor = 'rgba(255, 255, 255, 1)'
    Chart.defaults.global.defaultFontStyle = 'bold'

    var interval;
    var index = 0;
    var chart;
    var first = true;
    var ctx = document.getElementById("chart");
    var prevtype;

    function getGraphData(data) {
	function nextIndex(arr, index) {
	    if (index+1 === arr.length) {
	        return 0;
	    }
	    return index + 1;
        };

	var d;

	switch (data.type) {
	case "class":
	    var name = validStats[data.data[0].class][index];
	    d = statsData(data.data, name, desc[name]);
	    index = nextIndex(validStats[data.data[0].class], index);
	    break;
	case "player":
	    d = statsDataLine(data.data, allStats[index], desc[allStats[index]])
	    index = nextIndex(allStats, index);
	    break;
	case "allclass":
	    var name = validStats["allclass"][index];
	    d = statsData(data.data, name, desc[name]);
	    index = nextIndex(validStats["allclass"], index);
	}

	return d;
    }

    function drawGraph(data) {
        var c = getGraphData(data);

        if (c == null) {
            drawGraph(data);
        } else if (first) {
            console.log("first")
            first = false;
            chart = new Chart(ctx, c);
            chart.resize();
            prevtype = data.type;
            interval = setInterval(function() {
                drawGraph(data);
            }, 10*1000)
            return;
        }
        if (prevtype == data.type) {
            console.log("updating old graph")
            chart.data.labels = c.data.labels;
            chart.data.datasets = c.data.datasets;
            chart.update(3000, false);
        } else {
            chart.destroy();
            ctx = document.getElementById("chart");
            chart = new Chart(ctx, c);
        }
        prevtype = data.type
    }

    var stats = nodecg.Replicant('stats');
    stats.on('change', function(data, _) {
        if (data == undefined) {
            return;
        }
        clearInterval(interval);
        drawGraph(JSON.parse(JSON.stringify(data)));
    })
});
