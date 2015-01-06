/*var Constants = function(){
    this.FRED_REST_ENDPT = "http://api.stlouisfed.org/fred/series/observations";
    this.CPI_SERIES_ID = "CPIAUCSL";
    this.FRED_API_KEY = process.env.FRED_API_KEY;
};*/
var constants = {
    FRED_REST_ENDPT: "http://api.stlouisfed.org/fred/series/observations",
    CPI_SERIES_ID: "CPIAUCSL",
    FRED_API_KEY:  process.env.FRED_API_KEY
    
};

//module.exports = new Constants();
module.exports = constants;
