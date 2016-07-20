
const DbUrl= process.env.DB_URL || 'http://localhost:5984';

const nano    = require('nano')(DbUrl),
      actions = nano.use("actions"),
      requests = nano.use("requests");


function processAction(action,request){
	 console.log("processing",request._id);
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
			request.status = "failed";
      request.statusDetail ="invalid action definition";
		 }
		 else{
			request.status = "failed";
      request.statusDetail ="action execution failed";
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
	 };
 }

 // process the request
 function processRequest(err,request){
	if (! err){
		request.status = "processing";
		// update the request status to ensure we are the only one processing this request
		requests.insert(request, (err2,body)=>{
			if (! err2){
				// update the request rev so we can update the request later on
				request._rev = body.rev;
				console.log("starting", request._id);
				actions.get(request.path, getActionHandler(request));
			}
		});
	}
 }


// fetch a request from queue
function processQueue(){
	 requests.view('requests','new',{ limit:1 }, (err,body)=>{
		 if (! err){
			 if (body.total_rows > 0){
				 console.log("trying to start", body.rows[0].id);
				 requests.get(body.rows[0].id, processRequest);
			 }
		 }
	 });
 }

 function startProcessing(){
	  const timer=setInterval(processQueue,500);
    return timer;
 }

 startProcessing();
