var request = require('request');
var ndarray = require('ndarray');

var Adjuster = function(data, frequency) {
    // Let's have data be an array of arrays. [[d1, v1], [d2, v2], ...]
    // the d's should be Date objects. v's should be integers.
    this.data = data;
    this.FRED_API_KEY = process.env.FRED_API_KEY;
    this.FRED_REST_ENDPT = "http://api.stlouisfed.org/fred/series/observations";
    this.CPI_SERIES_ID = "CPIAUCSL";
    if(this.data) {
        this.dateRange = (function(d) {
            var max = 0,
                min = Number.MAX_SAFE_INTEGER;
            d.forEach(function(v, i, ar) {
                var time = v[0].getTime();
                if(time > max) {
                    max = v[0];
                }
                if(time < min) {
                    min = v[0];
                }
            });
            return [min, max];
        })(this.data);
        // supply the frequency or guess.
        this.frequency = frequency || (function(d) {
            var dateDict = {};
            d.forEach(function(v, i, ar) {
                var thisYear = v[0].getFullYear();
                var thisMonth = v[0].getMonth();
                if(thisYear in dateDict && dateDict[thisYear] != thisMonth) {
                    dateDict[v[0].getFullYear()] = thisMonth;
                } else {
                    return "m";
                }
            });
            return "a";
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
        var frequency = opts.freq || "a", 
        // sum, eop, avg. Only use avg realistically.
            aggmethod = opts.agg || "avg",
            target = opts.target || "9999-12-31";
        var units = "lin";
        // params for getting historical data.
        var params = {observation_start: opts.startdate, observation_end: opts.enddate,
                    api_key: this.FRED_API_KEY, series_id: self.CPI_SERIES_ID, 
                    file_type: "json",
                    frequency: frequency, aggregation_method: aggmethod, units: units};

        // params for getting value we're adjusting to.
        var unitsParams = { api_key: self.FRED_API_KEY, series_id: self.CPI_SERIES_ID, 
                    file_type: "json",
                    frequency: frequency, aggregation_method: aggmethod, units: units};
        
        // Get the value we're adjusting to. Do this by getting it all and
        // using the latest value.
        var getUnitsData = (function(cb) {
            request({url: self.FRED_REST_ENDPT, qs: unitsParams}, function(error, response, body) {
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
        });

        request({url: this.FRED_REST_ENDPT, qs: params}, function(error, response, body) {
            if(!error && response.statusCode == 200) {
                var inflationData = JSON.parse(body).observations;
                var inflationObj = {};
                inflationData.forEach(function(v, i, ar) {
                    if(v.value == ".") return;
                    var dateString = v.date.substring(0, v.date.length - 3);
                    // keys in inflationObj look like YYYY-MM
                    inflationObj[dateString] = v.value; 
                });
               
                // Get the value we're adjusting to and process all the data.
                getUnitsData(function(unitdata) {
                    var inflationAdjustedYear = unitdata[0],
                        adjustmentIndex = unitdata[1];
                    var ret = [];
                    if(self.data) {
                        self.data.forEach(function(v, i, ar) {
                            var thisDate = v[0].getFullYear() + "-" + v[0].getMonth();        
                            var thisValue = v[1];
                            if(thisDate in inflationObj) {
                                var adjustedValue = thisValue * 1.0 * adjustmentIndex / inflationObj[thisDate];
                                ret.push([thisDate, thisValue, adjustedValue, inflationObj[thisDate], adjustmentIndex]);
                            } else {
                                //Exception
                                throw "You screwed up and didn't get the right dates from FRED.";
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

module.exports = new Adjuster();
