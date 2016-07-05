
var eventEmitter = require('events'),
    evt = new eventEmitter,
	express = require('express')
   , nano    = require('nano')('http://localhost:5984')
   , actions = nano.use("actions")
   , requests = nano.use("requests")
   , app     = express()
   ;

var maxTime = 2000; // time in ms before timing out sync requests
var changeInterval = 200; // interval in ms to look for changes
var lastSeq = 0;
   

function handleResult(res,status){
	var statusCode = status || 200;
	return function(error, body) {
		if (error) {
			res.status(error.statusCode);
			return res.send(error.message);
		}
		res.status(status); // request created
		res.send(body);
	}
}

// async request, return the requestID so user can use /requests/:requestid to pickup the result
function handleAsync(res){
	return handleResult(res,201);
}


function returnSyncResult(res,id,type){
	if (type == "timeout"){
		res.status(504); // timeout
		return res.send("request timed out");
	}
	requests.get(id, function(err,result){
		// return the result
		res.status(200);
		res.send(result);
	});
}

// for synchronous requests we need to return the result of the action
function handleSync(res){
	return function(error, body) {
		var timer;
		if (error) {
			res.status(error.statusCode);
			return res.send(error.message);
		}
		// wait for an event to pickup the result from the queue and return it to the requester
		evt.once(body.id, function(type){
			returnSyncResult(res,body.id,type);
		});
		// if it takes longer than maxTime, return a timeout
		setTimeout(function(){ 
			evt.emit(body.id,"timeout");
			},
		maxTime
		);
	}
}

// pouchDB seems to have a problem with streaming changes and with filtering changes, so we poll on a regular basis and filter here
function handleRequestsChanges(){
	requests.changes( { since:lastSeq, include_docs:true },
		function (err,body){
			if ( lastSeq != body.last_seq){
				body.results.forEach(function (item){
					var status = item.doc.status;
					if (( status != "new" ) && (status != "processing")){
						evt.emit(item.id);
					}
				});
			}
			lastSeq = body.last_seq;
		}
	);
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

setInterval(handleRequestsChanges,changeInterval);

app.listen(3000, function () {
  console.log('Api server listening on port 3000!');
});
