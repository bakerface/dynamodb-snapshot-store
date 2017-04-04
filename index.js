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
        AttributeName: 'aggregateId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'revision',
        AttributeType: 'N'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'aggregateId',
        KeyType: 'HASH'
      },
      {
        AttributeName: 'revision',
        KeyType: 'RANGE'
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

SnapshotStore.prototype.store = function (aggregateId, revision, version, state) {
  var createdAt = this.now();

  var params = {
    TableName: this.tableName,
    Item: {
      aggregateId: { S: aggregateId },
      revision: { N: revision.toString() },
      version: { N: version.toString() },
      createdAt: { N: createdAt.toString() },
      state: { S: JSON.stringify(state) },
    },
    ReturnValues: 'NONE'
  };

  return this.database.putItem(params).promise();
};

SnapshotStore.prototype.fetch = function (aggregateId, revision) {
  var params = {
    TableName: this.tableName,
    ConsistentRead: true,
    Key: {
      aggregateId: { S: aggregateId },
      revision: { N: revision.toString() },
    }
  };

  return this.database.getItem(params).promise()
    .then(function (response) {
      if (response.Item) {
        return {
          aggregateId: response.Item.aggregateId.S,
          revision: parseInt(response.Item.revision.N, 10),
          version: parseInt(response.Item.version.N, 10),
          createdAt: parseInt(response.Item.createdAt.N, 10),
          state: JSON.parse(response.Item.state.S)
        };
      }
    });
};
