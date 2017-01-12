
var httprip     = require("httprip");
var fs          = require("fs");
var request     = require("request");
var jsdom       = require("jsdom");

// Create a ripper instance.
var ripResult = [];
var ripper = httprip()
    .processor(function(error, response, body, resolve) {
        // Replace out some stuff we don't need.
        body = body.replace(/<script(.*)>(.|\n)*?<\/script>/g, "");
        body = body.replace(/<link(.|\n)*?>/g, "");
        body = body.replace(/<style(.|\n)*?>(.|\n)*?<\/style>/g, "");

        // Parse the page and inject jquery.
        jsdom.env(
            body,
            ["http://code.jquery.com/jquery.js"],
            function (err, window) {
                // Iterate over each font preview.
                window.$(".fontPreviewWrapper").each(function(idx) {
                    // Harvest the font's details.                    
                    var fontdetails = {
                        name: (window.$(this).find(".fontName").first().html()),
                        isFree: window.$(this).find(".floatRight").first().html().indexOf("free for commercial use") >= 0,
                        downloadUrl: window.$(this).find(".fontDownload").first().attr("href"),
                        previewUrl: window.$(this).find(".fontPreviewImg img").first().attr("src")
                    };

                    // If the font is free/commercially usable, yield it.
                    if(fontdetails.isFree)
                        ripper.yield(fontdetails);
                })

                resolve();
            }
        );
    })
    .data(function(output) {
        // Push all output into the ripResult array.
        ripResult.push(output);
        console.log("Yielded #" + ripResult.length + " :", output.name);        
    });


// Grab the first page, so we know how many pages thre are.
request({url: "http://www.1001fonts.com/handwritten-fonts.html?page=1&items=50"}, function(error, response, body) {
    // Parse the page, inject jQuery.
    jsdom.env(
        body,
        ["http://code.jquery.com/jquery.js"],
        function (err, window) {
            // Get page count.
            var fontCount = parseInt(window.$("h2").first().html().substring(16).replace(/,/g, ""), 10);
            var pageCount = Math.ceil(fontCount / 50);

            // For each page, inject the request into the ripper.
            console.log("Found " + pageCount + " pages.");
            for(var i = 0; i < pageCount; i++) {
                var pageUrl = "http://www.1001fonts.com/handwritten-fonts.html?page=" + (i + 1) + "&items=50";

                console.log("Queueing page:", pageUrl);
                ripper.enqueueRip({url: pageUrl});   
            }

            // After the ripper has finished, output the JSON to a file.
            ripper.lastQueued().then(function() {
                console.log("Writing output...");
                fs.writeFileSync("output.json", JSON.stringify(ripResult, null, 2));
                console.log("Done!");
            });
        }
    );
});
