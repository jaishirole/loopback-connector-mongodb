// Copyright IBM Corp. 2013,2020. All Rights Reserved.
// Node module: loopback-connector-mongodb
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

require('./init.js');

let Book, Chapter;
const ds = global.getDataSource();
const objectIDLikeString = '7cd2ad46ffc580ba45d3cb1f';
const objectIDLikeString2 = '7cd2ad46ffc580ba45d3cb1e';
const promisify = require('bluebird').promisify;


describe.only('New ObjectID', function() {

  const Book = ds.createModel(
    'Book',
    {
      d: {id: true, type: String, mongodb: {dataType: 'objectID'}},
      oId: {type: String, mongodb: {dataType: 'objectID'}},
      oIds: {type: [String], mongodb: {dataType: 'objectID'}},
      title: String,
      strId: String,
      strIds: [String],
      authorId: {type: [String], mongodb: {dataType: 'objectID'}}
    }
  );

  const Author = ds.createModel(
    'Author',
    {
      id: {id: true, type: String, mongodb: {dataType: 'objectID'}},
      name: String
    }
  );

  const Deep = ds.createModel(
    'Deep',
    {
      id: {id: true, type: String, mongodb: {dataType: 'objectID'}},
      innerObj: {
        innerObj: {
          innerObj: {
            innerObj: {
              sid: String,
              oid: {type: String, mongodb: {dataType: 'objectID'}}
            }
          }
        }
      },
      innerArray: [
        {
          sid: String,
          oid: {type: String, mongodb: {dataType: 'objectID'}},
          objInsideAnArray: {
            sid: String,
            oid: {type: String, mongodb: {dataType: 'objectID'}}
          },
          nested: [
            {
              sid: String,
              oid: {type: String, mongodb: {dataType: 'objectID'}}
            }
          ]
        }
      ]
    }
  );

  beforeEach(async () => {
    await Book.deleteAll();
    await Author.deleteAll();
    await Deep.deleteAll();

    Author.hasMany('books');
    Book.belongsTo('author');
  });


  // SPIKE: in these tests there is no way of knowing if objectID-like strings are actually stored
  // SPIKE: as real strings in the db. Manual verification is the easiest way to confirm.
  // TODO: add tests to verify they are actually stored as real strings in implementation.
  it('should identify ObjectID declaration', async () => {
    const created = await Book.create({
      oId: objectIDLikeString,
      oIds: [objectIDLikeString, objectIDLikeString2],
      title: 'abc',
      sId: objectIDLikeString,
      sIds: [objectIDLikeString, objectIDLikeString2]
    });
    created.id.should.be.instanceOf(String);
    created.oId.should.be.instanceOf(String);
    created.oIds.forEach(oId => {
      oId.should.be.instanceOf(String);
    });
    created.sId.should.be.instanceOf(String);
    created.sIds.forEach(sId => {
      created.sId.should.be.instanceOf(String);
    });
  });

  it('should identify ObjectID in relations', async () => {
    const author = await Author.create({name: 'Bob'});
    author.id.should.be.instanceOf(String);
    const book = await Book.create({authorId: author.id, title: 'The Jungle'});
    book.id.should.be.instanceOf(String);
    book.authorId.should.be.instanceOf(String);
    const foundBook = await Book.findById(book.id);
    foundBook.id.should.be.instanceOf(String);
    const foundBooksByAuthor = await Book.all({authorId: author.id});
    foundBooksByAuthor[0].id.should.be.instanceOf(String);
    foundBooksByAuthor[0].authorId.should.be.instanceOf(String);
    const replaced = await Book.replaceById(book.id, {title: 'The Book'});
    replaced.id.should.be.instanceOf(String);
  });

  // TODO: write tests for all other methods too?
  it('find should work for models defined without id property', async () => {
    const Pet = ds.createModel('Pet', {name: String});
    const pet = await Pet.create({name: 'Neo'});
    const found = await Pet.findById(pet.id);
    found.id.should.equal(pet.id);
  });

  it.only('should create/update instance for deeply nested ObjectID props', async () => {
    const createData = {
      innerObj: {
        innerObj: {
          innerObj: {
            innerObj: {
              oid: objectIDLikeString,
              sid: objectIDLikeString
            }
          }
        }
      },
      innerArray: [
        {
          oid: objectIDLikeString,
          sid: objectIDLikeString,
          objInsideAnArray: {
            oid: objectIDLikeString,
            sid: objectIDLikeString
          },
          nested: [
            {
              oid: objectIDLikeString,
              sid: objectIDLikeString
            }
          ]
        }
      ]
    };

    const updateData = {
      innerObj: {
        innerObj: {
          innerObj: {
            innerObj: {
              oid: objectIDLikeString2,
              sid: objectIDLikeString2
            }
          }
        }
      },
      innerArray: [
        {
          oid: objectIDLikeString2,
          sid: objectIDLikeString2,
          objInsideAnArray: {
            oid: objectIDLikeString2,
            sid: objectIDLikeString2
          },
          nested: [
            {
              oid: objectIDLikeString2,
              sid: objectIDLikeString2
            }
          ]
        }
      ]
    };

    let instanceId;
    return Deep.create(createData).then(inst => {
      instanceId = inst.id;
      inst.id.should.be.instanceOf(String);
      inst.innerObj.innerObj.innerObj.innerObj.oid.should.be.instanceOf(String);
      inst.innerArray[0].oid.should.be.instanceOf(String);
      return Deep.findById(inst.id);
    }).then(found => {
      found.id.should.be.instanceOf(String);
      found.innerObj.innerObj.innerObj.innerObj.oid.should.be.instanceOf(String);
      found.innerArray[0].oid.should.be.instanceOf(String);
      return Deep.updateAll({id: found.id}, updateData);
    }).then(() => {
      return Deep.findById(instanceId);    
    }).then(updated => {
      updated.id.should.be.instanceOf(String);
      updated.innerObj.innerObj.innerObj.innerObj.oid.should.be.instanceOf(String);
      updated.innerArray[0].oid.should.be.instanceOf(String);
    });

  });

});
