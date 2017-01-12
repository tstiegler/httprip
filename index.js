/**
 * HttpRip - Manages queues of requests for data processing/collection.
 */
var HttpRip = function() {
    var request     = require("request");
    var _           = require("lodash");
    var jsdom       = require("jsdom");

    var instance;
    var procFuncs = [];
    var dataFuncs = [];

    // Kick off the request chain.
    var nextPromise = new Promise(function(resolve, reject) { 
        processQueuedOpts(null, resolve);
    });

    // Public functions.

    /**
     * Queue a request for ripping.
     * 
     * @param {requestOptions} reqOpt       Request options object.
     */
    function enqueueRip(reqOpt) {     
        var tmp = nextPromise;
        nextPromise = new Promise(function(resolve, reject) {
            tmp.then(function() { processQueuedOpts(reqOpt, resolve);  });
        });
    }

    /**
     * Get the last queued promise.
     * 
     * @returns {Promise}       Last queued promise reference.
     */
    function lastQueued() {
        return nextPromise;
    }


    /**
     * Specify a processor callback.
     * 
     * @param {processorCallback} inProcFunc        Data collector callback.
     * @returns {HttpRipHelper}                     HttpRipHelper instance.
     */
    function processor(inProcFunc) {
        procFuncs.push(inProcFunc);
        return instance;
    }


    /**
     * Specify a data collector callback.
     * 
     * @param {dataCallback} inDataFunc         Data collector callback.
     * @returns {HttpRipHelper}                 HttpRipHelper instance.
     */
    function data(inDataFunc) {
        dataFuncs.push(inDataFunc);
        return instance;
    }


    /**
     * Forward a rippable entity to the given data collectors.
     * 
     * @param {any} inData      Any given rippable entity.
     */
    function yield(inData) {
        _.each(dataFuncs, function(df) { df(inData); });        
    }

    // Private functions.

    /**
     * Process a queued request, forward the result to all given processors.
     * 
     * @param {requestOptions} opts         Options object to be given to "request".
     * @param {promiseResolver} resolve     Promise resolver callback.
     */
    function processQueuedOpts(opts, resolve) {
        // If opts is null, resolve immediately.
        if(opts == null) {            
            resolve(opts);
            return;
        }
       
        // Perform the request.
        request(opts, function(error, response, body) {
            // Add a promise for every given processor to an array and run the processor methods.
            var subProcessorPromises = [];
            _.each(procFuncs, function(pf) {
                var spPromise = new Promise(function(subresolve, subreject) {
                    pf(error, response, body, subresolve);
                });
                
                subProcessorPromises.push(spPromise);
            });

            // Wait for all processors to finish before moving to the next queued entry.
            Promise.all(subProcessorPromises)
                .then(function() { resolve(); })                        
        });       
    }


    // Public interface.
    var instance = {
        enqueueRip: enqueueRip,
        lastQueued: lastQueued,
        processor: processor,
        data: data,
        yield: yield,
        request: request
    };
    return instance;
}

module.exports = HttpRip;