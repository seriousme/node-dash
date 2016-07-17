var DbUrl= process.env.DB_URL || 'http://localhost:5984';
var nano    = require('nano')(DbUrl);
var http    = require('http');

const maxTries = 10;
const tries={};
const retryMs = 500;

const now = Date.now();
// Handling socket errors in Nano is not trivial,
// cheating here by doing a http request first,
//if that works we'll start the show

function bulkInsert(dbname,data){
	if (typeof(tries[dbname])=="undefined"){
		tries[dbname]=0;
	}
	console.log("Attempt", tries[dbname],"of",maxTries,"to connect to ",dbname,"at", DbUrl);
	http.get(DbUrl, (res) => {
	  console.log("Database",dbname,"is up !");
	  // consume response body
	  res.resume();
		doInsert(dbname,data);
	}).on('error', (e) => {
	  //console.log(`Got error: ${e.message}`);
		if ( tries[dbname]++ < maxTries){
			console.log("Going to retry in",retryMs,"ms");
			setTimeout(()=>{ bulkInsert(dbname,data);}, retryMs);
		}
		else {
			console.log("Failed to connect to",dbname,"at",DbUrl);
		}
	});
}

function doInsert(dbname,data){
	// clean up the database we created previously
	nano.db.destroy(dbname, function(err,body) {
			// create the new database
			nano.db.create(dbname, function() {
					// specify the database we are going to use
					var db = nano.use(dbname);
					// and insert a document in it
					db.bulk({
							"docs": data
					}, function(err, body) {
							if (err) {
									console.log(err, body);
							} else {
									console.log(dbname, "loaded ok");
							}
					});
			});
	});
}

bulkInsert("actions",[{
		"_id" : "/myactions/sum",
		"code" : "function main(params){ return { \"sum\": Number(params.a) + Number(params.b)};}"
	}, {
		"_id" : "/myactions/mult",
		"code" : "function main(params){ return { \"mult\":Number(params.a) * Number(params.b)};}"
	},
	{
	    "views": {
	        "all": {
	            "map": "function (doc) {\n    emit(null,{'_id':doc._id,'_rev':doc._rev});\n}\n"
	        }
	    },
			"_id" : "_design/actions"
	}
]);

bulkInsert("requests",[
	{
		"path" : "/myactions/sum",
		"timestamp":  (now - 8000000),
		"params" : {
			"a" : 1,
			"b" : 2
		},
		"result" : {
			"sum" : "3"
		},
		"status" : "success",
	},
	{
		"path" : "/myactions/sum",
		"timestamp": (now - 320000),
		"params" : {
			"a" : 1,
			"b" : 2
		},
		"status" : "new",
	},
	{
		"path" : "/myactions/mult",
		"timestamp": (now - 140000),
		"params" : {
			"a" : 1,
			"b" : 2
		},
		"status" : "new",
	},
	{
		"views" : {
			"all" : {
				 "map": "function (doc) {\n  emit(doc.timestamp,{'id':doc._id, 'path':doc.path, 'status':doc.status,'timestamp':doc.timestamp});\n}"
			},
			"new" : {
				 "map" : "function (doc) {\n if (doc.status == \"new\"){\n  emit(doc._id, 1);\n }\n}"
			}
		},
		"_id" : "_design/requests"
	}
]);
