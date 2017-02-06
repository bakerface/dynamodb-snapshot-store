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

var assert = require('assert');
var dynalite = require('dynalite');
var SnapshotStore = require('..');

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

describe('when the tables are created', function () {
  beforeEach(function (done) {
    this.server = dynalite({
      createTableMs: 1,
      deleteTableMs: 1,
      updateTableMs: 1
    });

    var snapshotStore = this.snapshotStore = new SnapshotStore({
      endpoint: 'http://localhost:4567',
      region: 'us-east-1',
      accessKeyId: 'access',
      secretAccessKey: 'secret',
      tableName: 'snapshots'
    });

    this.server.listen(4567, function () {
      snapshotStore.createTable()
        .then(function () {
          return sleep(10);
        })
        .then(done.bind(null, null), done);
    });
  });

  afterEach(function (done) {
    var server = this.server;
    var snapshotStore = this.snapshotStore;

    snapshotStore.deleteTable()
      .then(function () {
        return sleep(10);
      })
      .then(function () {
        server.close(done);
      });
  });

  describe('when states are stored', function () {
    beforeEach(function () {
      var now = 0;

      var snapshotStore = new SnapshotStore({
        endpoint: 'http://localhost:4567',
        region: 'us-east-1',
        accessKeyId: 'access',
        secretAccessKey: 'secret',
        tableName: 'snapshots',
        now: function () {
          return now++;
        }
      });

      var a = {
        snapshotId: '00000000-0000-0000-0000-000000000000',
        state: 'one'
      };

      var b = {
        snapshotId: '11111111-1111-1111-1111-111111111111',
        state: 'two'
      };

      return Promise.resolve()
        .then(function () {
          return snapshotStore.store(a);
        })
        .then(function () {
          return snapshotStore.store(b);
        });
    });

    it('can fetch a snapshot that has not been stored', function () {
      var options = {
        snapshotId: '22222222-2222-2222-2222-222222222222'
      };

      return this.snapshotStore.fetch(options)
        .then(function (snapshot) {
          assert.deepEqual(snapshot);
        });
    });

    it('can fetch the state for a single snapshot', function () {
      var options = {
        snapshotId: '00000000-0000-0000-0000-000000000000'
      };

      return this.snapshotStore.fetch(options)
        .then(function (snapshot) {
          assert.deepEqual(snapshot, {
            snapshotId: '00000000-0000-0000-0000-000000000000',
            createdAt: 0,
            state: 'one'
          });
        });
    });

    it('can update a snapshot', function () {
      var snapshot = {
        snapshotId: '00000000-0000-0000-0000-000000000000',
        state: 'three'
      };

      var options = {
        snapshotId: '00000000-0000-0000-0000-000000000000'
      };

      var snapshotStore = new SnapshotStore({
        endpoint: 'http://localhost:4567',
        region: 'us-east-1',
        accessKeyId: 'access',
        secretAccessKey: 'secret',
        tableName: 'snapshots',
        now: function () {
          return 2;
        }
      });

      return snapshotStore.store(snapshot)
        .then(function () {
          return snapshotStore.fetch(options);
        })
        .then(function (snapshot) {
          assert.deepEqual(snapshot, {
            snapshotId: '00000000-0000-0000-0000-000000000000',
            createdAt: 2,
            state: 'three'
          });
        });
    });
  });
});
