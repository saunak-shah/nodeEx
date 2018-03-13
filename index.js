/**
 * Lovecoy Bootstrap file.
 * @author Infyzo Websol Pvt. Ltd.
 * @copyright 2016 Infyzo Websol Pvt. Ltd.
 * @licence
 * @version 1.0.0
 */
/**
 * Chalk    Blue General information
 *          Green Positive system status
 *          Red Negative system status
 */
var cluster = require('cluster'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    compression = require('compression'),
    chalk = require('chalk'),
    appConfig = require('./app/config'),
    v1 = require('./api/v1/route'),
    v2 = require('./api/v2/route'),
    db = require('./app/db');

var options = {
    key:fs.readFileSync(appConfig.ssl.key),
    cert:fs.readFileSync(appConfig.ssl.cert)
};

if (cluster.isMaster) {
    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;
    console.log(chalk.blue('Total avalilabale cpu(s) : %d'), cpuCount);

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        console.log(chalk.green('Worker : %d is ready to serve.'), i);
        cluster.fork();
    }

    // Listen for dying workers
    cluster.on('exit', function (worker, code, signal) {
        // Replace the dead worker,
        // we're not sentimental
        console.log(chalk.red('Worker %d died'), worker.id, chalk.green('Getting new worker'));
        cluster.fork();
    });
} else {
    app.use('/uploads', express.static('uploads'));
    // use gzip compression for faster data transport
    app.use(compression());

    // support json encoded bodies
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    // api version 1 routes
    app.use('/v1', v1);

    // api version 2 routes
    app.use('/v2', v2);

    app.use(function (req, res) {
        res.json({"responseCode": 404, "responseMsg": "Wrong endpoint."});
    });

    http.createServer(app).listen(appConfig.port);
    https.createServer(options,app).listen(9900);

    // Console will print the message
    console.log(chalk.green('Server running at http://' + appConfig.host + ':' + appConfig.port + '/'));

    db.connect();
}