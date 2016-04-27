'use strict';
var http = require('http');
var url = require('url');

function start(route, handle) {
    http.createServer((req, res) => {
        var postData = '';
        var pathname = url.parse(req.url).pathname;
        if (pathname !== '/favicon.ico') {
            console.log('Request for ' + pathname + ' received.');
            req.setEncoding('utf8');
            req.addListener('data', (postDataChunk) => {
                postData += postDataChunk;
                console.log('Received POST data chunk "' + postDataChunk + '".');
            });
            req.addListener('end', () => {
                route(handle, pathname, res, postData);
            });
        }
    }).listen(3000);
    console.log('Server started.');
}

exports.start = start;
