var request = require('request');
var ndarray = require('ndarray');
var constants = require("./constants");
var util = require('./util');

/*
 * Adjuster for inflation adjustment object.
 * Args:
 *  data: an array of Dates and numbers that looks like: [[d1, v1], [d2, v2], ...]

 */
var Adjuster = function(data, opts) {
    this.data = data;
    if(this.data) {
        // supply the frequency or guess.
        this.frequency = opts.frequency || (function(d) {
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
        this.adjustDate = opts.adjustDate || new Date(constants.LATEST);
    }
    this.inflationObj = {maxDate: new Date(0)};
};

Adjuster.prototype.setAdjustDateFrequency = function(frequency) {
    this.adjustDateFrequency = frequency; 
};

/*
 * The date 9999-12-31 is the upper limit and means we should use the latest
 * available data.
 */
Adjuster.prototype.adjust = function(errorHandler) {
    var self = this;
    var retData = [];
    var adjustDate;
    if (self.adjustDate.getTime() == new Date(constants.MAX_DATE).getTime()) {
        adjustDate = self.inflationObj.maxDate; 
    } else {
        adjustDate = self.adjustDate;
    }
    var adjustmentIndex = self.inflationObj[util.formatDate(adjustDate)];
    var retObj = {data: retData, adjustDate: util.formatDate(adjustDate), 
                  adjustDateFrequency: self.adjustDateFrequency };
    if(self.data) {
        self.data.forEach(function(v, i, ar) {
            // Key to get the corresponding datum for each date.
            var keyDate = new Date(v[0].getTime());
            keyDate.setUTCDate(1);
            var key = util.formatDate(keyDate);
            var thisDate = util.formatDate(v[0]);
            var thisValue = v[1];
            var adjustedValue;

            if(key in self.inflationObj) {
                adjustedValue = Math.round(thisValue * 100.0 * adjustmentIndex / self.inflationObj[key]);
                adjustedValue /= 100.0;
                retData.push([thisDate, thisValue, adjustedValue, self.inflationObj[key], adjustmentIndex]);
            } else {
                keyDate.setUTCMonth(0);
                key = util.formatDate(keyDate);
                if(key in self.inflationObj) {
                    adjustedValue = Math.round(thisValue * 100.0 * adjustmentIndex / self.inflationObj[key]);
                    adjustedValue /= 100.0;
                    retData.push([thisDate, thisValue, adjustedValue, self.inflationObj[key], adjustmentIndex]);
                } else if(keyDate.getTime() <= Date.now()) {
                    if(keyDate.getTime() > self.inflationObj.maxDate) {
                        key = util.formatDate(self.inflationObj.maxDate);
                        adjustedValue = Math.round(thisValue * 100.0 * adjustmentIndex / self.inflationObj[key]);
                        adjustedValue /= 100.0;
                        retData.push([thisDate, thisValue, adjustedValue, self.inflationObj[key], adjustmentIndex]);
                    } else {
                        errorHandler(new Error("We couldn't find those dates. Maybe make sure they're in the proper date range and try again?"));
                    }
                } else {
                    errorHandler(new Error("You have dates that are in the future!"));
                }
            }
        });
    } else {
        // If we've got no user-provided data to adjust... just
        // adjust $1.
        Object.keys(self.inflationObj).sort().forEach(function(v, i, ar) {
            var adjustedValue = 1.0 * adjustmentIndex / self.inflationObj[v];
            retData.push([v, 1.0, adjustedValue, self.inflationObj[v], adjustmentIndex]);
        });
    }
    return retObj;
};

/*
 * Adjust this adjuster's data for inflation.
 * Args:
 *  opts: some adjusment options.
 *  dataHandler: callback to call if the operation succeeds.
 *  errorHandler: callback if the operation fails.
 *   
 * The FRED api will give you dates on the first of the month. So, we
 * don't have to do any hard work in enforcing compliance... if someone
 * gives us a date on August 18, just send it in as-is and the api will give
 * back August 1. 
 * m, q, sa, or a.
 * For monthly, quarterly, semi-annual, or annual.
 */
Adjuster.prototype.getInflationNumbers = function(opts, dataHandler, errorHandler) {
    var self = this;
    var frequency = self.frequency || "a",
    // sum, eop, avg. Only use avg realistically.
        aggmethod = opts.agg || "avg",
        units = "lin",
        target = opts.target || "9999-12-31",
        startdate = opts.startdate || (function() {
            // return minimum date in data.
            return self.data.reduce(function(prev, val, i, ar) {
                if(prev[0].getTime() < val[0].getTime()) {
                    return prev;
                } else {
                    return val;
                }
            })[0];
        })(),
        enddate = opts.enddate || (function() {
            // return maximum date in data.
            return self.data.reduce(function(prev, val, i, ar) {
                if(prev[0].getTime() < val[0].getTime()) {
                    return val;
                } else {
                    return prev;
                }
            })[0];
        })();
    var maxdate = util.getMaxDate([self.adjustDate, enddate]);
    var mindate = util.getMinDate([self.adjustDate, startdate]);
    
    // annual granularity. This will be good for most dates.
    var aParams = {observation_start: util.formatDate(mindate), observation_end: util.formatDate(maxdate),
                api_key: constants.FRED_API_KEY, series_id: constants.CPI_SERIES_ID, 
                file_type: "json",
                frequency: "a", aggregation_method: aggmethod, units: units};

    var getMonthlyData = function(dates, cb) {
        if(dates.length || self.adjustDateFrequency == "m") {
            var mParams = { api_key: constants.FRED_API_KEY, series_id: constants.CPI_SERIES_ID,
                            file_type: "json", observation_start: self.inflationObj.maxdate,
                            frequency: "m", aggregation_method: aggmethod, units: units };
            request({url: constants.FRED_REST_ENDPT, qs: mParams}, function(error, response, body) {
                if( !error  && response.statusCode == 200) {
                    var inflationData = JSON.parse(body).observations;
                    inflationData.forEach(function(v, i, ar) {
                        if(v.value == ".") {
                            return;
                        }
                        // keys in inflationObj look like YYYY-MM-DD
                        self.inflationObj[v.date] = v.value; 
                        if(new Date(v.date) > self.inflationObj.maxDate) {
                            self.inflationObj.maxDate = new Date(v.date);
                        }
                    });
                    cb();
                } else {
                    // Request to FRED failed.
                    errorHandler(new Error("We couldn't get the data we needed. Try again later."));
                }
            });
        } else {
            cb();
        }
    };

    // Get annual granularity
    request({url: constants.FRED_REST_ENDPT, qs: aParams}, function(error, response, body) {
        if(!error && response.statusCode == 200) {
            var inflationData = JSON.parse(body).observations;
            var leftovers = [];
            inflationData.forEach(function(v, i, ar) {
                if(v.value == ".") {
                    leftovers.push(new Date(v.date));
                    return;
                }
                // keys in inflationObj look like YYYY-MM-DD
                self.inflationObj[v.date] = v.value; 
                if(new Date(v.date) > self.inflationObj.maxDate) {
                    self.inflationObj.maxDate = new Date(v.date);
                }
            });
            self.setAdjustDateFrequency(util.formatDate(self.adjustDate) in self.inflationObj ? "a" : "m");
        
            // Get the value we're adjusting to and process all the data.
            getMonthlyData(leftovers, function() {
                var retObj = self.adjust(errorHandler);
                dataHandler(retObj, error);
            });
        } else {
            // Request to FRED failed.
            errorHandler(new Error("We couldn't get the data we needed. Try again later."));
        }
    });
};

module.exports = Adjuster;
