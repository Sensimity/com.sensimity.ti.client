var model, collection;

exports.definition = {
    config: {
        columns: {
            "id": "INTEGER",
            "beacon_id": "INTEGER",
            "network_id": "INTEGER",
            "title": "TEXT",
            "description": "TEXT",
            "UUID": "TEXT",
            "major": "INTEGER",
            "minor": "INTEGER"
        },
        adapter: {
            db_name: "sensimity",
            type: "sql",
            collection_name: "KnownBeacon",
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
model = Alloy.M("KnownBeacon", exports.definition, []);
collection = Alloy.C("KnownBeacon", exports.definition, model);
exports.Model = model;
exports.Collection = collection;
