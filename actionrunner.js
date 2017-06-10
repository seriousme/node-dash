const DbUrl = process.env.DB_URL || "http://localhost:5984";
const { VM } = require("vm2");

const PouchDB = require("pouchdb-node");
const actions = new PouchDB(`${DbUrl}/actions`);
const requests = new PouchDB(`${DbUrl}/requests`);

const retryMs = 500; // time in ms to wait before trying to resubscribe to the change feed
const vmTimeOutMs = 1000; // maximum runtime of a VM in ms

function processAction(action, request) {
  console.log("processing", request._id);
  const vm = new VM({
    timeout: vmTimeOutMs,
    sandbox: {}
  });
  try {
    // execute the action
    const params = JSON.stringify(request.params);
    const script = `
       const params= ${params}
       ${action.code}
       main(params)
     `;
    console.log(script);
    request.result = vm.run(script);

    request.status = "success";
  } catch (err) {
    request.status = "failed";
    request.error = err.message;
  }
  // and update the repository
  requests.put(request);
}

// process the request
function processRequest(request) {
  request.status = "processing";
  // update the request status to ensure we are the only one processing this request
  requests.put(request, (err, body) => {
    if (!err) {
      // update the request rev so we can update the request later on
      request._rev = body.rev;
      console.log("starting", request._id);
      actions.get(request.path, (err2, action) => {
        if (!err2) {
          processAction(action, request);
        }
      });
    }
  });
}

// watch the queue for new records and process them
function waitForChanges() {
  console.log("started waiting for changes");
  requests
    .changes({
      filter: "requests/isnew",
      live: true
    })
    .on("change", change => {
      console.log("trying to start", change.id);
      requests.get(change.id, (err, request) => {
        if (!err) {
          processRequest(request);
        }
      });
    })
    .on("error", () => {
      console.log(
        "lost connection to database at",
        DbUrl,
        "trying to reconnect in",
        retryMs,
        "ms"
      );
      setTimeout(() => {
        waitForChanges();
      }, retryMs);
    });
}

// start the show
waitForChanges();
