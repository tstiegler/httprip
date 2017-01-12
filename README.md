httprip - Manages queues of requests for data processing and collection.
========================================================================

[![Build Status](https://travis-ci.org/tstiegler/httprip.svg?branch=master)](https://travis-ci.org/tstiegler/httprip)

## Usage

```
npm install httprip
```

```javascript
var httprip = require("httprip");

var ripper = httprip()
    .processor(function(error, res, body, resolve) {
        // Perform parsing on body here.

        // Yield each item parse from body.
        ripper.yield("item" + Math.floor(Math.random() * 999));
        ripper.yield("item" + Math.floor(Math.random() * 999));

        // Resolve after we've finished processing.
        resolve();
    })
    .data(function(output) {
        console.log("Retrieved item:", output);
    });


// Queue requests.
ripper.enqueueRip({url: "http://google.com"});
ripper.enqueueRip({url: "http://yahoo.com"});
ripper.enqueueRip({url: "http://bing.com"});

// Wait for finish.
ripper.lastQueued().then(function() {
    console.log("done");
})
```

## Explanation

This project provides a shorthand API for processing multiple web requests that may have a common format with the end goal of extracting data. For example, My oroginal goal for this project was to extract a JSON object with all fonts on 1001fonts.com. The code for doing that is contained in `example.js`

Processing behavior is done declaratively by the `processor` and `data` methods. 

Functions supplied to `processor` are called with the usual `request` paramaters (`error`, `response` and `body`) as well as an additional `resolve`. `resolve` is a Promise resolver method and must be called at the end of processing, as processing may be asynchronous and `httprip` needs to know when the processing has been comleted. During the course of processing, you must run `yield` on the ripper object to submit a single element of data you are intending to collect.

Whilst the action you might take in the course of yielding an item _could_ be done in the processor method, the `yield` and `processor` methods allow you to submit multiple methods that will all be run for processing and yielding.

To send a request off to the ripper, the `enqueueRip` method is used. This method accepts a single `options` parameter, which is the same type of object you would give to the `request` module, giving you the power to custom craft your requests in any way you want.

Waiting for the last queued request to finish can be done by using the `lastQueued` method, which gives you the Promise for the last request in the queue.

## Methods

Method Name | Description
--- | ---
`enqueueRip` | Submits a request to the queue. <ul><li>`options` - Request Options</li></ul>
`lastQueued` | Gets the promise (which fires on completion) for the last request in the queue.
`processor` | Adds a processor function to the ripper processor chain, calling this function for each queued request.
`data` | Adds a data collector function to the ripper data collector chain. This method will be called for each yield.
`yield` | Yields a single element to all data collector functions. <ul><li>`item` - Item for forwarding to data collectors</li></ul>
`setRequester` | Sets the internal request instance. Useful for injecting a pre-made request object with defaults. <ul><li>`requester` - New request instance</li></ul>
