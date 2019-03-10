/**
 * Created by infyzo2 on 25/2/16.
 */

var chalk = require('chalk'),
    config = require('./config'),
    mongo = require('mongodb').MongoClient;

module.exports = (function () {
    var _db = false;

    return {

        getDBo: function () {
            if (!_db) {
                this.connect(function () {
                    return _db;
                });
            } else {
                return _db;
            }
        },

        // Connect to DB instance
        connect: function (clb) {
            var option = {
                db: {
                    numberOfRetries: 5
                },
                server: {
                    auto_reconnect: true,
                    poolSize: 40,
                    socketOptions: {
                        connectTimeoutMS: 500
                    }
                },
                replSet: {},
                mongos: {}
            };

            dburl = 'mongodb://' + config.db.user + ':' + config.db.pass + '@' + config.db.host + ':' + config.db.port + '/' + config.db.name;

            mongo.connect(dburl, option, function (err, dbo) {
                if (err) throw err;
                _db = dbo;

                if (typeof clb === 'function') clb(dbo);

                console.log(chalk.green('Mongodb connected.'));
            });
        },

        // Get the single entry limit 1 from the table with matching criteria
        get: function (table, where, clb) {
            _db.collection(table).findOne(where, function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) {
                        clb(false)
                    }

                    clb(doc);
                }
            });
        },

        // Get the single entry limit 1 from the table with matching criteria
        getSelected: function (table, where, select, clb) {
            _db.collection(table).find(where, select).limit(1).next(function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) {
                        clb(false)
                    }

                    clb(doc);
                }
            });
        },

        getAll: function (table, where, select, clb) {
            _db.collection(table).find(where, select).toArray(function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) {
                        clb(false)
                    }

                    clb(doc);
                }
            });
        },

        // Function will fetch records who's _id in given objectIds In array
        getIn: function (table, In, page, limit, clb) {
            _db.collection(table).find({_id: {$in: In}}).skip((page - 1) * limit).limit(limit).toArray(function (err, docs) {
                if (typeof clb === 'function') {
                    if (err) clb(false);
                    else clb(docs);
                }
            });
        },

        // Insert one object(document) to the collection
        insertOne: function (table, data, clb) {
            _db.collection(table).insertOne(data, function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) {
                        clb(false);
                    }

                    clb(doc);
                }
            });
        },

        // Update or insert data to table and according to matching criteria.
        updateUser: function (table, where, data, clb) {
            _db.collection(table).update(where, {$set: data}, {upsert: true}, function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) clb(false);
                    else clb(doc.result);
                }
            });
        },

        // Common Update data
        updateData: function (table, where, data, clb) {
            _db.collection(table).update(where, data, {upsert: true}, function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) clb(false);
                    else clb(doc.result);
                }
            });
        },

        // Update multiple documents bases on match criteria data
        updateMultiData: function (table, where, data, clb) {
            _db.collection(table).updateMany(where, { $set: data }, {multi: true}, function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) clb(false);
                    else clb(doc.result);
                }
            });
        },

        saveUser: function (table, where, update, clb) {

            _db.collection(table).findOneAndUpdate(where, update, {
                upsert: true,
                returnOriginal: false
            }, function (err, doc) {
                if (typeof clb === 'function') {
                    if (err) clb(false);
                    else clb(doc.value);
                }
            });
        },

        getChatList: function (id, userIds, clb){
            _db.collection('chatMessages').aggregate(
                [
                    {
                        $match: {
                            $and: [
                                {to: id},
                                {readFlag: {$lt: 2}},
                                {msgType:"connected"},
                                {"from.from": {$in: userIds}},
                            ]
                        }
                    },
                    {
                        $group: {
                            _id: "$from.from",
                            total: {$sum: 1}
                        }
                    },
                ]
                ,function(err, doc){
                    clb(doc)
                }
            );
        },

        getChatByCat: function (id, cat, clb){
            _db.collection('chatMessages').aggregate(
                [
                    {
                        $match: {
                            $and: [
                                {to: id},
                                {category: cat},
                                {readFlag: {$lt: 2}}
                            ]
                        }
                    },
                    {
                        $group: {
                            _id: "$from.from",
                            total: {$sum: 1}
                        }
                    },
                ]
                ,function(err, doc){
                    clb(doc)
                }
            );
        }
    }
})();
