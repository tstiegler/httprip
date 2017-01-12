var assert = require('assert');
var httprip = require('../index.js');

describe('httprip', function() {

    // Mock up a fake request object.
    var fakeRequest = function(options, callback) {
        callback(null, {}, "");
    }

    it('Should call processor when given queued request', function(done) {
        // Setup the ripper.
        var processorCalled = false;
        var ripper = httprip()
            .processor(function(error, res, body, resolve) {
                // Check if it was called.
                assert.equal(true, true); 
                done();
            });        

        ripper.setRequester(fakeRequest);

        // Attempt a request queue.
        ripper.enqueueRip({url: "http://thiswillnevergethit.com"});        
    });

    it('Should call data collector when given queued request', function(done) {
        // Setup the ripper.
        var processorCalled = false;
        var ripper = httprip()
            .processor(function(error, res, body, resolve) {
                // Check if it was called.
                ripper.yield("OK");
            })
            .data(function(output) {
                assert.equal(true, true); 
                done();
            });

        ripper.setRequester(fakeRequest);

        // Attempt a request queue.
        ripper.enqueueRip({url: "http://thiswillnevergethit.com"});        
    });
});
