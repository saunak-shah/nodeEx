var http = require('http');

http.createServer(function (req, res) {
    console.log("11111111111");
    console.log('vvvvvvv');
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('Hello World!');
}).listen(8080);