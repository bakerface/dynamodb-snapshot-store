# dynamodb-snapshot-store
[![build](https://img.shields.io/travis/bakerface/dynamodb-snapshot-store.svg?flat-square)](https://travis-ci.org/bakerface/dynamodb-snapshot-store)
[![npm](https://img.shields.io/npm/v/dynamodb-snapshot-store.svg?flat-square)](https://npmjs.com/package/dynamodb-snapshot-store)
[![downloads](https://img.shields.io/npm/dm/dynamodb-snapshot-store.svg?flat-square)](https://npmjs.com/package/dynamodb-snapshot-store)
[![climate](https://img.shields.io/codeclimate/github/bakerface/dynamodb-snapshot-store.svg?flat-square)](https://codeclimate.com/github/bakerface/dynamodb-snapshot-store)
[![coverage](https://img.shields.io/codeclimate/coverage/github/bakerface/dynamodb-snapshot-store.svg?flat-square)](https://codeclimate.com/github/bakerface/dynamodb-snapshot-store)

This package provides a simple snapshot store implementation on top of Amazon
DynamoDB. This is meant to be a general purpose package, and makes no
assumptions about the structure or type of your states. The states are
serialized to JSON when stored, and deserialized automatically when fetching.
For a few examples, view the samples below:

``` javascript
var SnapshotStore = require('dynamodb-snapshot-store');

var snapshotStore = new SnapshotStore({
  region: 'us-east-1',
  accessKeyId: 'access-key-id',
  secretAccessKey: 'secret-access-key',
  tableName: 'snapshots'
});
```

### snapshotStore.store(snapshot)
An atomic write of a snapshot to the store.

``` javascript
var snapshot = {
  aggregateId: '00000000-0000-0000-0000-000000000000',
  state: {
    foo: 'bar'  
  }
};

snapshotStore.store(snapshot)
  .then(function () {
    // the snapshot was stored
  })
  .catch(function (err) {
    // something went wrong
  });
});
```


### snapshotStore.fetch(options)
Fetches the aggregate state from the snapshot store.

``` javascript
var options = {
  aggregateId: '00000000-0000-0000-0000-000000000000'
};

snapshotStore.fetch(options)
  .then(function (snapshot) {
    // =>
    {
      aggregateId: '00000000-0000-0000-0000-000000000000',
      createdAt: 946684800000,
      state: {
        foo: 'bar'
      }
    }
  })
  .catch(function (err) {
    // something went wrong
  });
```
