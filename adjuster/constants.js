var constants = {
    FRED_REST_ENDPT: "http://api.stlouisfed.org/fred/series/observations",
    CPI_SERIES_ID: "CPIAUCSL",
    FRED_API_KEY:  process.env.FRED_API_KEY,
    LATEST: "2013",
    MAX_DATE: "9999-12-31"
    
};

module.exports = constants;
