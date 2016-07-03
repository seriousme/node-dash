
var express = require('express')
   , nano    = require('nano')('http://localhost:5984')
   , actions = nano.use("actions")
   , requests = nano.use("requests")
   , app     = express()
   ;
   
// async request, return the requestID so user can use /requests/:requestid to pickup the result
function handleAsync(res){
	return function(error, body) {
		if (error) {
			res.status(error.statusCode);
			return res.send(error.message);
		}
		res.status(201); // request created
		res.send(body);
	}
}

function returnResult(res,id){
	requests.get(id, function(err,result){
		if (result.status == "processing"){
			res.status(504); // timeout
			return res.send("request timed out");
		}
		res.status(200);
		res.send(result);
	});
}

// TODO: for synchronous requests we need to return the result of the action, for now we cheat by waiting 500ms ;-)
// better solution is to watch changes on the DB
function handleSync(res){
	return function(error, body) {
		if (error) {
			res.status(error.statusCode);
			return res.send(error.message);
		}
		setTimeout( function(){
			returnResult(res,body.id);
		},500);
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
		
		var handler = handleAsync(res);
		
		if (typeof(req.query.sync) !== 'undefined'){
			handler = handleSync(res);
		}
		
		requests.insert(record,handler);
	});	
});

app.listen(3000, function () {
  console.log('Api server listening on port 3000!');
});