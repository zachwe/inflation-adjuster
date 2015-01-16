module.exports = {
    /**
     * Returns a hyphen-formatted date.
     * Args:
     *  date: Date object
     * Returns: 
     *  String formatted like 'YYYY-MM-DD'
     */
    formatDate: function(date) {
        var month = date.getUTCMonth() < 9 ? "0" + (1 + date.getUTCMonth()) : date.getUTCMonth() + 1;
        var day = date.getUTCDate() < 10 ? "0" + date.getUTCDate() : date.getUTCDate();
        return date.getUTCFullYear() + "-" + month + "-" + day;
    },
    /**
     * Returns the earliest date from an array of Dates.
     * Args:
     *  ar: the Dates array.
     * Returns
     *  earliest Date.
     */
    getMinDate: function(ar) {
        var mindate = ar.reduce(function(d1, d2) {
            return d1 < d2 ? d1 : d2;   
        });
        return mindate;
    },
    /**
     * Returns the latest date from an array of Dates.
     * Args:
     *  ar: the Dates array.
     * Returns
     *  latest Date.
     */
    getMaxDate: function(ar) {
        var maxdate = ar.reduce(function(d1, d2) {
            return d1 > d2 ? d1 : d2;
        });
        return maxdate;
    },
    months: ["January", "February", "March", "April", "May", "June", "July", "August",
             "September", "October", "November", "December"],
    getMonthString: function(n) {
        return this.months[n];
    }

};
