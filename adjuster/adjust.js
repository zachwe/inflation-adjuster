var request = require('request');
var ndarray = require('ndarray');

var Adjuster = function(data, frequency) {
    // Let's have data be an array of arrays. [[d1, v1], [d2, v2], ...]
    this.data = data;
    this.FRED_API_KEY = process.env.FRED_API_KEY,
        this.FRED_REST_ENDPT = "http://api.stlouisfed.org/fred/series/observations",
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

    this.getInflationNumbers = function(opts, cb) {
        // The FRED api will give you dates on the first of the month. So, we
        // don't have to do any hard work in enforcing compliance... if someone
        // gives us a date on August 18, just send it in as-is and the api will give
        // back August 1. 
        // m, q, sa, or a.
        // For monthly, quarterly, semi-annual, or annual.
        var frequency = opts.freq || "a", 
        // sum, eop, avg. Only use avg realistically.
            aggmethod = opts.agg || "avg";
        var units = "lin";
        var params = {observation_start: opts.startdate, observation_end: opts.enddate,
                    api_key: this.FRED_API_KEY, series_id: this.CPI_SERIES_ID, 
                    file_type: "json",
                    frequency: frequency, aggregation_method: aggmethod, units: units};

        request({url: this.FRED_REST_ENDPT, qs: params}, function(error, response, body) {
            if(!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                cb(data);
            }
        });
    };
};

module.exports = new Adjuster();
