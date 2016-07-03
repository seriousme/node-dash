var nano    = require('nano')('http://localhost:5984')
   , actions = nano.use("actions")
   , requests = nano.use("requests");
   
 
 function processAction(action,request){
	 var actionOk = false;
	 try {
		 // instantiate the action
		 eval(action.code);
		 actionOk = true;
		 // execute the action
		 request.result = eval(main(request.params));
		 request.status = "success"; 
	 }
	 catch(err){
		 if (! actionOk){
			request.status = "invalid action definition";
		 }
		 else{
			request.status = "failed";
		 }
		 request.error = err;
	 }
	 // and update the repository
	 requests.insert(request);
 }
 
 // return a handler which will process action and request
 function getActionHandler(request){
	 return function(err,action){
		 processAction(action,request);
	 }
 }
 
 // process the request
 function processRequest(err,body){
	if (! err){
		actions.get(body.path, getActionHandler(body));
	}
 }
 
 // get a request from the queue
 function getRequest(err,body){
	 if (! err){
		if (body.total_rows > 0){
			requests.get(body.rows[0].id, processRequest);		
		}
	 }
 }
 
 
 
 // main loop
 //while(true){
	 // fetch a request from queue
	 requests.view('requests','new',{ limit:1 }, getRequest);
 //}

 
   