var Adjuster = require("../adjust");
var constants = require("../constants");
var nock = require('nock');

describe("Adjusts a set of data for inflation", function () {
    beforeAll(function() {
        var fred = nock(constants.FRED_REST_ENDPT)
                    .get("/")
                    .reply(200, "got FRED");
    });

    it("initializes a new adjuster without user data", function() {
        var adjusterNoData = new Adjuster();
        expect(adjusterNoData.data).toBe(undefined);
        expect(adjusterNoData.frequency).toBe(undefined);
    });
});
