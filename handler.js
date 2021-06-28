'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2019.11.21' });
const uuid = require('uuid/v4');

const customerTable = process.env.CUSTOMER_TABLE;
// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}
function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}
// Create a Customer
module.exports.createCustomer = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);

  if (
    !reqBody.fname ||
    reqBody.fname.trim() === '' ||
    !reqBody.lname ||
    reqBody.lname.trim() === ''
  ) {
    return callback(
      null,
      response(400, {
        error: 'Customer must have a fname  they must not be empty'
      })
    );
  }

  const customer = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    customerId: 1,
    fname: reqBody.fname,
    lname: reqBody.lname,
    age:   reqBody.age
  };

  return db
    .put({
      TableName: customerTable,
      Item: customer
    })
    .promise()
    .then(() => {
      callback(null, response(201, customer));
    })
    .catch((err) => response(null, response(err.statusCode, err)));
};
// Get all Customer
module.exports.getAllCustomer = (event, context, callback) => {
  return db
    .scan({
      TableName: customerTable
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Get number of Customer
module.exports.getCustomer = (event, context, callback) => {
  const numberOfCustomer = event.pathParameters.number;
  const params = {
    TableName: customerTable,
    Limit: numberOfCustomer
  };
  return db
    .scan(params)
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Get a single Customer
module.exports.getCustomer = (event, context, callback) => {
  const id = event.pathParameters.id;

  const params = {
    Key: {
      id: id
    },
    TableName: customerTable
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: 'Customer not found' }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Update a Customer
module.exports.updateCustomer = (event, context, callback) => {
  const id = event.pathParameters.id;
  const reqBody = JSON.parse(event.body);
  const { fname, lname,age } = reqBody;

  const params = {
    Key: {
      id: id
    },
    TableName: customerTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'SET fname = :fname, lname = :lname, age = :age',
    ExpressionAttributeValues: {
      ':fname': fname,
      ':lname': lname,
      ':age'  : age
    },
    ReturnValues: 'ALL_NEW'
  };
  console.log('Updating');

  return db
    .update(params)
    .promise()
    .then((res) => {
      console.log(res);
      callback(null, response(200, res.Attributes));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Delete a Customer
module.exports.deleteCustomer = (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      id: id
    },
    TableName: customerTable
  };
  return db
    .delete(params)
    .promise()
    .then(() =>
      callback(null, response(200, { message: 'Customer deleted successfully' }))
    )
    .catch((err) => callback(null, response(err.statusCode, err)));
};
