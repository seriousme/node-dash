# node-dash
An experiment to build a serverless setup using node.js.

![Node-dash design](https://rawgit.com/seriousme/node-dash/master/Node-dash.svg)

The repository and queue are implemented using [Pouchdb](https://pouchdb.com/), but Couchdb (http://couchdb.apache.org/) will work as well.

## Installation
There are 3 options to get this running:
- `git clone` this repository and run `npm install` followed by `npm start`
- `docker run -d -p 8080:8080 seriousme/node-dash`
- use the `docker-compose` file in the docker folder

Once it runs you can send your browser to http://\<your host\>:8080/ which will show you a web interface.
Alternatively you can use any REST client (e.g. CURL/Postman/etc) to talk to the API server

## REST endpoints
The following endpoints are supported:

### List of requests:
```
curl -X GET "http://localhost:8080/dash/requests"
```
### Details of a request
```
curl -X GET "http://localhost:8080/dash/requests/:requestid"
```
### Create a new asynchronous request
An example:
```
curl -X GET "http://localhost:8080/myactions/sum?a=1&b=2"
```
### Create a new synchronous request
An example:
```
curl -X GET "http://localhost:8080/myactions/sum?a=1&b=2&sync"
```
### List of actions
```
curl -X GET "http://localhost:8080/dash/actions"
```
### Details of an action
```
curl -X GET "http://localhost:8080/dash/actions/:actionid"
```
### Create a new action
An example:
```
curl -X PUT -H "Content-Type: application/json" -d '{
  "_id": "/myactions/min",
  "code": "function main(params){ return { \"min\": Number(params.a) - Number(params.b)};}"
}' "http://localhost:8080/dash/actions/%2fmyactions%2fmin"
```

### Update an action
An example:
```
curl -X PUT -H "Content-Type: application/json" -d '{
  "_id": "/myactions/min",
  "code": "function main(params){ return { \"min\": Number(params.a) - Number(params.b)};}",
  "_rev": "1-dadb9a995a83675dea6954a1515e08bb"
}' "http://localhost:8080/dash/actions/%2fmyactions%2fmin"
```
