/**
 * Copyright (c) 2017 Chris Baker <mail.chris.baker@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

'use strict';

var AWS = require('aws-sdk');

var SnapshotStore = module.exports = function (options) {
  this.tableName = options.tableName;
  this.database = new AWS.DynamoDB(options);
  this.now = options.now || Date.now;
};

SnapshotStore.AWS = AWS;

SnapshotStore.prototype.createTable = function () {
  var params = {
    TableName: this.tableName,
    AttributeDefinitions: [
      {
        AttributeName: 'snapshotId',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'snapshotId',
        KeyType: 'HASH'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 15,
      WriteCapacityUnits: 15
    }
  };

  return this.database.createTable(params).promise();
};

SnapshotStore.prototype.deleteTable = function () {
  var params = {
    TableName: this.tableName
  };

  return this.database.deleteTable(params).promise();
};

SnapshotStore.prototype.store = function (snapshot) {
  var createdAt = this.now();

  var params = {
    TableName: this.tableName,
    Item: {
      snapshotId: { S: snapshot.snapshotId },
      createdAt: { N: createdAt.toString() },
      state: { S: JSON.stringify(snapshot.state) }
    },
    ReturnValues: 'NONE'
  };

  return this.database.putItem(params).promise();
};

SnapshotStore.prototype.fetch = function (options) {
  var params = {
    TableName: this.tableName,
    ConsistentRead: true,
    Key: {
      snapshotId: { S: options.snapshotId }
    }
  };

  return this.database.getItem(params).promise()
    .then(function (response) {
      if (response.Item) {
        return {
          snapshotId: response.Item.snapshotId.S,
          createdAt: parseInt(response.Item.createdAt.N, 10),
          state: JSON.parse(response.Item.state.S)
        };
      }
    });
};
