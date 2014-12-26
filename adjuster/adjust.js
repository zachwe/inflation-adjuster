var request = require('request');
var ndarray = require('ndarray');

var Adjuster = function(data) {
    this.data = data;
    this.FRED_API_KEY = "ced316f0b3196133c55f5febd1003f88",
        this.FRED_REST_ENDPT = "http://api.stlouisfed.org/fred/series/observations";
        this.CPI_SERIES_ID = "CPIAUCSL";


    this.getInflationNumbers = function(startdate, enddate, freq, agg) {
        var frequency = freq || "a", 
            aggmethod = agg || "avg";
        var units = "lin";
        var params = {observation_start: startdate, observation_end: enddate,
                    api_key: this.FRED_API_KEY, series_id: this.CPI_SERIES_ID, 
                    file_type: "json",
                    frequency: frequency, aggregation_method: aggmethod, units: units};

        request({url: this.FRED_REST_ENDPT, qs: params}, function(error, response, body) {
            if(!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                console.log(data);
            }
        });
    };
};

module.exports = new Adjuster();
