var http = require('http');

http.createServer(function (req, res){

    console.log("ddd");
    console.log("-----new ------");
    console.log("aaaa");
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('Hello World!');
}).listen(8080);