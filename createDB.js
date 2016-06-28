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
		"_id" : "/myactions/action1",
		"code" : "function main(){ return { \"payload\":\"action1\"};}"
	}, {
		"_id" : "/myactions/action2",
		"code" : "function main(){ return { \"payload\":\"action2\"};}"
	}
]);

bulkInsert("requests",[
	{
		"path" : "/myactions/action2",
		"params" : {
			"a" : 1,
			"b" : 2
		},
		"result" : {
			"payload" : "action2"
		},
		"status" : "success",
		"_id" : "00aab0e9-fedb-4a60-92a2-972646576ada"
	},
	{
		"path" : "/myactions/action1",
		"params" : {
			"a" : 1,
			"b" : 2
		},
		"status" : "new",
		"_id" : "15e0dcbc-a518-4c46-8716-1c39dde93df4"
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