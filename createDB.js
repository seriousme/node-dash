var nano    = require('nano')('http://localhost:5984');


function bulkInsert(dbname,data){
	// clean up the database we created previously
	nano.db.destroy(dbname, function() {
	  // create the new database
	  nano.db.create(dbname, function() {
		// specify the database we are going to use
		var db = nano.use(dbname);
		// and insert a document in it
		db.bulk({"docs": data },function(err,body){
			if (err){
					console.log(err,body);
			}
			else{
				console.log(dbname,"loaded ok");
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
	}
]);

bulkInsert("requests",[
	{
		"path" : "/myactions/sum",
		"params" : {
			"a" : 1,
			"b" : 2
		},
		"result" : {
			"sum" : "3"
		},
		"status" : "success",
		"_id" : "00aab0e9-fedb-4a60-92a2-972646576ada"
	},
	{
		"path" : "/myactions/sum",
		"params" : {
			"a" : 1,
			"b" : 2
		},
		"status" : "new",
		"_id" : "15e0dcbc-a518-4c46-8716-1c39dde93df4"
	}, 
	{
		"path" : "/myactions/mult",
		"params" : {
			"a" : 1,
			"b" : 2
		},
		"status" : "new",
		"_id" : "a6b76660-0e57-4ee2-a200-8df1b1dce5f3"
	}, 
	{
		"views" : {
			"all" : {
				"map" : "function (doc) {\n  emit(doc._id, 1);\n}"
			},
			"new" : {
				"map" : "function (doc) {\n if (doc.status == \"new\"){\n  emit(doc._id, 1);\n }\n}"
			}
		},
		"_id" : "_design/requests"
	}
]);
