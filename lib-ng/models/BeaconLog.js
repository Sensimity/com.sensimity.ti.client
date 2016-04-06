/* jshint ignore:start */
var Alloy = require('alloy'),
    _ = require('alloy/underscore')._,
    Backbone = require('alloy/backbone');
/* jshint ignore:end */

var model, collection;

exports.definition = {
    config: {
        columns: {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
            "UUID": "TEXT",
            "major": "INTEGER",
            "minor": "INTEGER",
            "rssi": "INTEGER",
            "accuracy": "INTEGER",
            "timestamp": "INTEGER"
        },
        adapter: {
            db_name: "sensimity",
            type: "sql",
            collection_name: "BeaconLog",
            idAttribute: "id"
        }
    },
    extendModel: function(Model) {
        _.extend(Model.prototype, {});

        return Model;
    },
    extendCollection: function(Collection) {
        _.extend(Collection.prototype, {
            // Extend, override or implement Backbone.Collection
            erase: function(args) {
                var self = this;

                var sql = "DELETE FROM " + self.config.adapter.collection_name,
                    db = Ti.Database.open(self.config.adapter.db_name);
                db.execute(sql);
                db.close();

                self.fetch();
            }
        });

        return Collection;
    }
};

// Alloy compiles models automatically to this statement. In this case the models not exists in /app/models folder, so this must be fixed by set this statements manually.
model = Alloy.M("BeaconLog", exports.definition, []);
collection = Alloy.C("BeaconLog", exports.definition, model);
exports.Model = model;
exports.Collection = collection;
