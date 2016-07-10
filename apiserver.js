
const DbUrl= process.env.DB_URL || 'http://localhost:5984';
const ApiPort= process.env.API_PORT || 8080;

const eventEmitter = require('events'),
   evt = new eventEmitter(),
   express = require('express'),
   nano    = require('nano')(DbUrl),
   actions = nano.use("actions"),
   requests = nano.use("requests"),
   app     = express()
   ;

const maxTime = 2000; // time in ms before timing out sync requests
const changeInterval = 200; // interval in ms to look for changes
var lastSeq = 0;

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use('/dash/ui', express.static('public'));


function handleResult(res,status){
	var statusCode = status || 200;
	return function(err, body) {
		if (err) {
			res.status(err.statusCode);
			return res.send(err.message);
		}
		res.status(statusCode);
		res.send(body);
	};
}

// async request, return the requestID so user can use /requests/:requestid to pickup the result
function handleAsync(res){
	return handleResult(res,201); // request created
}


function returnSyncResult(res,id,type){
	if (type == "timeout"){
		res.status(504); // timeout
		return res.send("request timed out");
	}
  // return result
	requests.get(id, handleResult(res));
}

// for synchronous requests we need to return the result of the action
function handleSync(res){
	return function(error, body) {
		if (error) {
			res.status(error.statusCode);
			return res.send(error.message);
		}
		// wait for an event to pickup the result from the queue and return it to the requester
		evt.once(body.id, (type) => {
			returnSyncResult(res,body.id,type);
		});
		// if it takes longer than maxTime, return a timeout
		setTimeout(()=>{
  			evt.emit(body.id,"timeout");
  			},
		    maxTime);
	};
}

// pouchDB seems to have a problem with streaming changes and with filtering changes, so we poll on a regular basis and filter here
function handleRequestsChanges(){
	requests.changes( { since:lastSeq, include_docs:true },
		(err,body)=>{
			if (err){
				return;
			}
			if ( lastSeq != body.last_seq){
				body.results.forEach((item)=>{
					const status = item.doc.status;
					if (( status != "new" ) && (status != "processing")){
						evt.emit(item.id);
					}
				});
			}
			lastSeq = body.last_seq;
		}
	);
}




// the actions

// list actions
app.get('/dash/actions',  (req, res) => {
  actions.list({include_docs:true}, handleResult(res));
});

// get info on an action
app.get('/dash/actions/:id', (req, res) => {
  actions.get(req.params.id, handleResult(res));
});

// create a new action or update an existing action
app.put('/dash/actions/:id', (req, res) => {
  actions.insert(req.body, req.params.id, handleResult(res));
});

// remove an action
app.delete('/dash/actions/:id', function (req, res) {
  actions.destroy(req.params.id,req.params.rev, handleResult(res));
});

// the requests

// list all requests
app.get('/dash/requests', function (req, res) {
  requests.view('requests','all', handleResult(res));
});

// get a specific request
app.get('/dash/requests/:requestid', function (req, res) {
  requests.get(req.params.requestid, handleResult(res));
});

// root path
app.get('/', function (req, res) {
  res.redirect('/dash/ui');
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

app.listen(ApiPort, function () {
  console.log('Api server listening on port', ApiPort);
});
