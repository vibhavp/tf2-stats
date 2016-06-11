'use strict';

var bundleDir = './bundles/tf2-2-stats/';
var express = require('express'),
    app = express();
var request = require('request');
var endpoint = 'http://localhost:8080/'

module.exports = function (nodecg) {
	var graph = nodecg.Replicant('graph');
	var stats = nodecg.Replicant('stats');

	nodecg.Replicant('endpoint').on('change', function(newv, oldv) {
		if (newv == undefined || newv == '') {
			return;
		}

		console.log("endpoint changed to "+newv)
		endpoint = newv;
	})

	var classR = nodecg.Replicant('class');
	classR.on('change', function(className, _) {
		if (className == undefined || className == '') {
			return;
		}
		console.log("displaying class stats for"+className);

		request(endpoint+'/getstats?class='+className, function(err, resp, data) {
			if(err) {
				return console.log('Error:', err)
			}
			stats.value = {
				"type": "class",
				"data": JSON.parse(data)
			};
		});
	});

	var playerID = nodecg.Replicant('playerID');
	playerID.on('change', function(playerID, _) {
		if (playerID == undefined || playerID == '') {
			return;
		}
		console.log("displaying player stats for "+playerID);

		request(endpoint+'/getstats?playerid='+playerID, function(err, resp, data) {
			if(err) {
				return console.log('Error:', err)
			}
			stats.value = {
				"type": "player",
				"data": JSON.parse(data)
			};
		});
	})

	stats = nodecg.Replicant('stats');
	stats.on('change', function(data, _) {
		if (data == undefined) {
			return;
		}
	})
	nodecg.mount(app);
};
