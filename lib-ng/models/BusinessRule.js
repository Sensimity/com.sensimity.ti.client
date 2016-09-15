import Alloy from 'alloy';

let model;
let collection;

exports.definition = {
  config: {
    columns: {
      id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
      business_rule_id: 'INTEGER',
      beacon_id: 'INTEGER',
      type: 'TEXT',
      interaction_id: 'INTEGER',
      interaction_type: 'TEXT',
      content: 'TEXT',
    },
    adapter: {
      db_name: 'sensimity',
      type: 'sql',
      collection_name: 'BusinessRule',
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
model = Alloy.M('BusinessRule', exports.definition, []); // eslint-disable-line
collection = Alloy.C('BusinessRule', exports.definition, model); // eslint-disable-line
exports.Model = model;
exports.Collection = collection;
