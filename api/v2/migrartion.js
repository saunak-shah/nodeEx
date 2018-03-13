
/* ------------Map Reduce Search changes Section---------*/

// Set all exisiting privacy setting ids into excluded id as actioned id
db.privacySettings.find({}).forEach(function(doc){db.user.update({_id: doc.from},{ $push: {'excludedIds.actionedIds' : doc.to}});});

// Set default key as blank for current ids in user collections for pagination search
db.user.update({}, {$set: {'excludedIds.currentIds' :[]}},{ multi: true });

/* ------------Map Reduce Search changes Section---------*/

/* ------------Exclusive with Section---------*/

// Add a key exclusiveWith as blank to all the users
db.user.update({}, {$set: {"exclusiveWith":""}},{ multi: true });

// Add Exclusive with key into default object for new users
db.options.update({'key':'defaultObjects'},{$set:{'exclusiveWith':''}})

/* ------------Exclusive with Section---------*/

/* ------------Default Height, Weight, dob, age Section---------*/

// Set default value for all exisiting dummy data's height and weight to 0 instead 140 and 40
db.user.update({}, {$set: {"preference.appearance.height":0,"preference.appearance.weight":0}},{ multi: true });

// Set default value for height and weight to 0 in default option collection
db.options.update({'key':'defaultObjects'},{$set:{'preference.appearance.height':0,'preference.appearance.weight':0}})

// Set default value for dob to blank in default option collection
db.options.update({'key':'defaultObjects'}, {$set: {"dob":""}});

// Set default value for age to 0 in default option collections well
db.options.update({'key':'defaultObjects'}, {$set: {"age":0}});

/* ------------Default Height, Weight, dob, age Section---------*/