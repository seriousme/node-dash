
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

app.get('/*', function (req, res) {
	var record = {
		"path": req.path,
		"status": "new",
		"params": req.query
	};
  requests.insert(record,handleResult(res))
});


app.listen(3000, function () {
  console.log('Api server listening on port 3000!');
});