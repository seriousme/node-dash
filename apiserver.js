
var express = require('express')
   , nano    = require('nano')('http://localhost:5984')
   , actions = nano.use("actions")
   , requests = nano.use("requests")
   , app     = express()
   ;
   

function handleResult(res){
	return function(error, body, headers) {
		if (error) {
			res.status(error.statusCode);
			return res.send(error.message);
		}
		res.status(200);
		res.send(body);
	}
}


app.get('/actions', function (req, res) {
  actions.list({include_docs:true}, handleResult(res));
});

app.get('/requests', function (req, res) {
  requests.view('requests','all', handleResult(res));
});

app.get('/requests/:requestid', function (req, res) {
  requests.get(req.params.requestid, handleResult(res));
});

app.get('/', function (req, res) {
  res.send('Api server ready');
});

// handle requests for execution of an action
app.get('/*', function (req, res) {
	// check if the action exists in the DB
	actions.head(req.path,function (error,body,headers){
		if (error){
			res.status(404);
			return res.send("No such action");
		}
		// store request in the database
		var record = {
			"path": req.path,
			"status": "new",
			"params": req.query
		};
		// async request, return the requestID so user can use /requests/:requestid to pickup the result
		requests.insert(record,handleResult(res));
		// TODO: for synchronous requests we need to return the result of the action
	});	
});


app.listen(3000, function () {
  console.log('Api server listening on port 3000!');
});