//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object sunburst will contain functions and variables that must be accessible from elsewhere
var abmviz_utilities = (function () {
	function assert(condition, message) {
		if (!condition) {
			message = message || "Assertion failed";
			if (typeof Error !== "undefined") {
				throw new Error(message);
			}
			throw message; // Fallback
		}
	}

	function GetURLParameter(sParam) {
		"use strict";
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split('&');
		for (var i = 0; i < sURLVariables.length; i++) {
			var sParameterName = sURLVariables[i].split('=');
			if (sParameterName[0] == sParam) {
				return sParameterName[1];
			}
		}
	}

//from http://stackoverflow.com/a/12190006/283973
	function insertArrayAt(array, index, arrayToInsert) {
    Array.prototype.splice.apply(array, [index, 0].concat(arrayToInsert));
}
	//from https://davidwalsh.name/javascript-polling
	function poll(fn, callback, errback, timeout, interval) {
		var endTime = Number(new Date()) + (timeout || 2000);
		interval = interval || 100;
		(function pollInternal() {
			// If the condition is met, we're done!
			if (fn()) {
				callback();
			}
			// If the condition isn't met but the timeout hasn't elapsed, go again
			else if (Number(new Date()) < endTime) {
				setTimeout(pollInternal, interval);
			}
			// Didn't match and too much time, reject!
			else {
				errback(new Error('timed out for ' + fn + ': ' + arguments));
			}
		})();
	}
	//return only the parts that need to be global
	return {
		assert: assert
		, GetURLParameter: GetURLParameter
		, poll: poll
		,insertArrayAt : insertArrayAt
	};
}()); //end encapsulating IIFE