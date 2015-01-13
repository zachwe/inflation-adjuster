var request = require('request');
var ndarray = require('ndarray');
var constants = require("./constants");

var Adjuster = function(data, frequency) {
    // Let's have data be an array of arrays. [[d1, v1], [d2, v2], ...]
    // the d's should be Date objects. v's should be integers.
    this.data = data;
    if(this.data) {
        // supply the frequency or guess.
        this.frequency = frequency || (function(d) {
            var dateDict = {};
            var ret = "a";
            d.forEach(function(v, i, ar) {
                var thisYear = v[0].getUTCFullYear();
                var thisMonth = v[0].getUTCMonth();
                if(thisYear in dateDict && dateDict[thisYear] != thisMonth) {
                    ret = "m";
                } else {
                    dateDict[thisYear] = thisMonth;
                }
            });
            return ret;
        })(this.data);
    }
    var self = this;

    this.getInflationNumbers = function(opts, dataHandler) {
        // The FRED api will give you dates on the first of the month. So, we
        // don't have to do any hard work in enforcing compliance... if someone
        // gives us a date on August 18, just send it in as-is and the api will give
        // back August 1. 
        // m, q, sa, or a.
        // For monthly, quarterly, semi-annual, or annual.
        var frequency = this.frequency || "a",
        // sum, eop, avg. Only use avg realistically.
            aggmethod = opts.agg || "avg",
            target = opts.target || "9999-12-31",
            startdate = opts.startdate || (function() {
                // return minimum date in data.
                return this.data.reduce(function(prev, val, i, ar) {
                    if(prev[0].getTime() < val[0].getTime()) {
                        return prev;
                    } else {
                        return val;
                    }
                })[0];
            }).call(this),
            enddate = opts.enddate || (function() {
                // return maximum date in data.
                return this.data.reduce(function(prev, val, i, ar) {
                    if(prev[0].getTime() < val[0].getTime()) {
                        return val;
                    } else {
                        return prev;
                    }
                })[0];
            }).call(this);
        var units = "lin";
        
        // Get the value we're adjusting to. Do this by getting it all and
        // using the latest value.
        var getUnitsData = function(cb) {
            request({url: constants.FRED_REST_ENDPT, qs: unitsParams}, function(error, response, body) {
                if( !error  && response.statusCode == 200) {
                    var bodyObj = JSON.parse(body).observations;
                    var index = bodyObj.length - 1;
                    while(bodyObj[index].value == ".") {
                        index--;
                    }
                    var data = [bodyObj[index].date, bodyObj[index].value];
                    cb(data);
                } else {
                    //Exception
                    throw error;
                }
            });
        };

        var formatDate = function(date) {
            var month = date.getUTCMonth() < 9 ? "0" + (1 + date.getUTCMonth()) : date.getUTCMonth() + 1;
            var day = date.getUTCDate() < 10 ? "0" + date.getUTCDate() : date.getUTCDate();
            return date.getUTCFullYear() + "-" + month + "-" + day;
        };

        // params for getting historical data.
        var params = {observation_start: formatDate(startdate), observation_end: formatDate(enddate),
                    api_key: constants.FRED_API_KEY, series_id: constants.CPI_SERIES_ID, 
                    file_type: "json",
                    frequency: frequency, aggregation_method: aggmethod, units: units};

        // params for getting value we're adjusting to.
        var unitsParams = { api_key: constants.FRED_API_KEY, series_id: constants.CPI_SERIES_ID, 
                    file_type: "json",
                    frequency: frequency, aggregation_method: aggmethod, units: units};
        

        request({url: constants.FRED_REST_ENDPT, qs: params}, function(error, response, body) {
            if(!error && response.statusCode == 200) {
                var inflationData = JSON.parse(body).observations;
                var inflationObj = {};
                inflationData.forEach(function(v, i, ar) {
                    if(v.value == ".") return;
                    //var dateString = v.date.substring(0, v.date.length - 3);
                    // keys in inflationObj look like YYYY-MM
                    inflationObj[v.date] = v.value; 
                });
               
                // Get the value we're adjusting to and process all the data.
                getUnitsData(function(unitdata) {
                    var inflationAdjustedYear = unitdata[0],
                        adjustmentIndex = unitdata[1];
                    var ret = [];
                    if(self.data) {
                        self.data.forEach(function(v, i, ar) {
                            if(self.frequency == "a") {
                                v[0].setUTCDate(1);
                                v[0].setUTCMonth(0);
                            }
                            var thisDate = formatDate(v[0]);
                            var thisValue = v[1];
                            if(thisDate in inflationObj) {
                                var adjustedValue = Math.round(thisValue * 100.0 * adjustmentIndex / inflationObj[thisDate]);
                                adjustedValue /= 100.0;
                                ret.push([thisDate, thisValue, adjustedValue, inflationObj[thisDate], adjustmentIndex]);
                            } else {
                                //Exception
                                throw new Error("You fetched the wrong dates from FRED!");
                            }
                        });
                    } else {
                        // If we've got no user-provided data to adjust... just
                        // adjust $1.
                        Object.keys(inflationObj).sort().forEach(function(v, i, ar) {
                            var adjustedValue = 1.0 * adjustmentIndex / inflationObj[v];
                            ret.push([v, 1.0, adjustedValue, inflationObj[v], adjustmentIndex]);
                        });
                    }
                    dataHandler(ret);
                });
            } else {
                // Exception
                throw error;
            }
        });
    };
};

module.exports = Adjuster;
