const express = require('express');
const path = require('path');
// const https = require('https');
const http = require('http');
const compression = require('compression');
const api = require('./api');
const fs = require('fs');
const app = express();
var PORT = 80;
// var SSLPORT = 5555;
// const options = {
//     key: fs.readFileSync('./https/private.key'),
//     cert: fs.readFileSync('./https/full_chain.pem'),
// }
var httpServer = http.createServer(app);
// var httpsServer = https.createServer(options, app);
httpServer.listen(PORT, function() {
    console.log('HTTP Server is running on ' + PORT);
});
// httpsServer.listen(SSLPORT, function() {
//     console.log('HTTPS Server is running on ' + SSLPORT);
// });
app.use(compression());
app.use('/images', express.static('images'));
app.use('/api',api);
// app.use('/', express.static('/web'));
