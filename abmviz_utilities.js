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


	//return only the parts that need to be global
	return {
		assert : assert
		,GetURLParameter : GetURLParameter
	};
}()); //end encapsulating IIFE