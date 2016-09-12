const Alloy = require('alloy');

let model;
let collection;

exports.definition = {
  config: {
    columns: {
      id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
      UUID: 'TEXT',
      major: 'INTEGER',
      minor: 'INTEGER',
      notifiedDate: 'REAL', // datetime not supported by backbonemodels in titanium, so use juliandate (REAL)
    },
    adapter: {
      db_name: 'sensimity',
      type: 'sql',
      collection_name: 'BeaconNotified',
      idAttribute: 'id',
    },
  },
  extendModel: Model => (Model),
  extendCollection: function extendCollection(Collection) {
    _.extend(Collection.prototype, {
    // Extend, override or implement Backbone.Collection
      erase: function erase() {
        const self = this;
        const sql = `DELETE FROM ${self.config.adapter.collection_name}`;
        const db = Ti.Database.open(self.config.adapter.db_name);
        db.execute(sql);
        db.close();

        self.fetch();
      },
    });
    return Collection;
  },
};

// Alloy compiles models automatically to this statement. In this case the models not exists in /app/models folder, so this must be fixed by set this statements manually.
model = Alloy.M('BeaconNotified', exports.definition, []); // eslint-disable-line
collection = Alloy.C('BeaconNotified', exports.definition, model); // eslint-disable-line
exports.Model = model;
exports.Collection = collection;
