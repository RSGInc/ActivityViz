//encapsulate all code within a IIFE (Immediately-invoked-function-expression) to avoid polluting global namespace
//global object sunburst will contain functions and variables that must be accessible from elsewhere
var abmviz_utilities = (function() {
  function assert(condition, message) {
    if (!condition) {
      message = message || "Assertion failed";
      if (typeof Error !== "undefined") {
        throw new Error(message);
      }
      throw message; // Fallback
    }
  }
  //ABM often uses half hour periods 0 to 47 to represent time from 3 am to 2:30 am the following day
  function halfHourTimePeriodToTimeString(timePeriod) {
    var halfHoursPast3Am = timePeriod - 1;
    //period is from 1 to 48 and is in half hours starting at 3 am
    var hours = (Math.floor(halfHoursPast3Am / 2) + 3) % 24;
    var minutes = (halfHoursPast3Am % 2) * 30; //if period is odd then add half hour
    //var timeOfDay = twoDigitIntegerFormat(hours) + ':' + twoDigitIntegerFormat(minutes);
    var timeOfDayAmPm = hours % 12;
    if (timeOfDayAmPm == 0) {
      timeOfDayAmPm = 12;
    }
    if (halfHoursPast3Am % 2 == 1) {
      timeOfDayAmPm += ":30";
    }
    timeOfDayAmPm += " " + (hours < 12 ? "am" : "pm");
    return timeOfDayAmPm;
  }

  function GetURLParameter(sParam) {
    "use strict";
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split("&");
    for (var i = 0; i < sURLVariables.length; i++) {
      var sParameterName = sURLVariables[i].split("=");
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
        errback(new Error("timed out for " + fn + ": " + arguments));
      }
    })();
  }

  // https://davidwalsh.name/javascript-debounce-function
  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this,
        args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  function flatByOne(array) {
    var output = [];
    for (let subArray of array) {
      for (let element of subArray) {
        output.push(element);
      }
    }
    return output;
  }

  //return only the parts that need to be global
  return {
    assert: assert,
    GetURLParameter: GetURLParameter,
    poll: poll,
    insertArrayAt: insertArrayAt,
    halfHourTimePeriodToTimeString: halfHourTimePeriodToTimeString,
    debounce: debounce,
    flatByOne: flatByOne
  };
})(); //end encapsulating IIFE
