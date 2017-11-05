const DbUrl = process.env.DB_URL || "http://localhost:5984";
const ApiPort = process.env.API_PORT || 8080;
const staticDir = "public";

const EventEmitter = require("events");
const evt = new EventEmitter();
const express = require("express");
const join = require("path").join;
const bodyParser = require("body-parser");
const PouchDB = require("pouchdb-node");
const actions = new PouchDB(`${DbUrl}/actions`);
const requests = new PouchDB(`${DbUrl}/requests`);
const app = express();

const maxTime = 2000; // time in ms before timing out sync requests
const retryMs = 500; // time in ms to wait before trying to resubscribe to the change feed

function handleResult(res, statusCode = 200) {
  return (err, body) => {
    if (err) {
      res.status(err.status);
      return res.send(err.message);
    }
    res.status(statusCode);
    res.send(body);
  };
}

// async request, return the requestID so user can use /requests/:requestid to pickup the result
function handleAsync(res) {
  return handleResult(res, 201); // request created
}

function returnSyncResult(res, id, type) {
  if (type === "timeout") {
    res.status(504); // timeout
    return res.send(`request ${id} timed out`);
  }
  // return result
  requests.get(id, handleResult(res));
}

// for synchronous requests we need to return the result of the action
function handleSync(res) {
  return (error, body) => {
    if (error) {
      res.status(error.statusCode);
      return res.send(error.message);
    }
    // wait for an event to pickup the result from the queue and return it to the requester
    evt.once(body.id, type => {
      returnSyncResult(res, body.id, type);
    });
    // if it takes longer than maxTime, return a timeout
    setTimeout(() => {
      evt.emit(body.id, "timeout");
    }, maxTime);
  };
}

// for parsing application/json
app.use(bodyParser.json());

// the UI

app.use("/dash/ui", express.static(staticDir));

app.get("/dash/ui/*", (req, res, next) => {
  res.sendFile(join(__dirname, staticDir, "/index.html"));
});

// the actions

// list actions
app.get("/dash/actions", (req, res) => {
  actions.query("actions/all", handleResult(res));
});

// get info on an action
app.get("/dash/actions/:id", (req, res) => {
  actions.get(req.params.id, handleResult(res));
});

// create a new action or update an existing action
app.put("/dash/actions/:id", (req, res) => {
  actions.put(req.body, req.params.id, handleResult(res));
});

// remove an action
app.delete("/dash/actions/:id", (req, res) => {
  actions.remove(req.params.id, req.params.rev, handleResult(res));
});

// the requests

// list all requests
app.get("/dash/requests", (req, res) => {
  requests.query("requests/all", handleResult(res));
});

// get a specific request
app.get("/dash/requests/:requestid", (req, res) => {
  requests.get(req.params.requestid, handleResult(res));
});

// root path
app.get("/", (req, res) => {
  res.redirect("/dash/ui");
});

// handle requests for execution of an action
app.get("/*", (req, res) => {
  // check if the action exists in the DB
  actions.get(req.path, (error, doc) => {
    if (error) {
      res.status(404);
      return res.send("No such action");
    }
    // store request in the database
    var record = {
      timestamp: new Date().toISOString(),
      path: req.path,
      status: "new",
      params: req.query
    };

    var handler = handleAsync(res);

    if (typeof req.query.sync !== "undefined") {
      handler = handleSync(res);
    }

    requests.post(record, handler);
  });
});

// setup handling of changes to the requests database to facilitate sync requests
function waitForChanges() {
  requests
    .changes({
      filter: "requests/iscompleted",
      live: true
    })
    .on("change", change => {
      evt.emit(change.id);
    })
    .on("error", () => {
      if (process.env.NODE_ENV !== "test") {
        console.log(
          "lost connection to database at",
          DbUrl,
          "trying to reconnect in",
          retryMs,
          "ms"
        );
      }
      setTimeout(() => {
        waitForChanges();
      }, retryMs);
    });
}

// start the show
waitForChanges();

const server = app.listen(ApiPort, () => {
  console.log("Api server listening on port", ApiPort);
});

// to facilitate testing
module.exports = server;
