window.addEventListener('load', function () {
    'use strict';
    function statsData(data, stat, label) {
	var labels = [];
	var dataset = [];
	var i;
        var classNames = {
            "scout": "Scout",
            "soldier": "Soldier",
            "demoman": "Demoman",
            "sniper": "Sniper",
            "medic": "Medic",
            "heavyweapons": "Heavy",
            "spy": "Spy",
            "pyro": "Pyro",
            "engineer": "Engineer"
        };

	if (data.length == 0) {
	    return null;
	}

	if (stat === "airshots" && !(data[0].class === "soldier" || data[0].class === "demoman")) {
	    return null;
	}

	data.sort(function(a, b) {
	    return b[stat] - a[stat]
	})

        console.log("making bar graph")
        console.log(stat);
        
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
            options: {
                title: {
                    display: true,
                    text: classNames[data[0].class],
                }
            }
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

	if (stat === "drops" && !data[0].class === "medic") {
	    return null;
	}

        console.log("making line graph")
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

    function getChartData(data) {
        var d;
        var classes = ["scout", "soldier", "demoman", "medic"];
	var stats = ["dpm", "kills", "kd", "airshots", "drops"];
	var desc = {"dpm": "Damage Per Minute", "kills": "Kills", "kd": "K/D Ratio",
		"airshots": "Airshots", "drops": "Drops"};

        
        if (data.type == "class") {
            d = statsData(data.data, stats[index], desc[stats[index]]);
        } else {
            d = statsDataLine(data.data, stats[index], desc[stats[index]]);
        }

        function nextIndex(arr, index) {
	    if (index+1 === arr.length) {
	        return 0;
	    }
	    return index + 1;
        };


        index = nextIndex(stats, index);
        return d
    }

    function drawGraph(data) {
        var c = getChartData(data);

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
