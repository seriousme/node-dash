var DbUrl = process.env.DB_URL || "http://localhost:5984";
const PouchDB = require("pouchdb-node");
const designDocs = require("./designDocs.json");

const maxTries = 10;
var tries = {};
const retryMs = 500;

const now = Date.now();

// demoData, make the timestamps look like they are recent
const demoData = {
  actions: [
    {
      _id: "/myactions/sum",
      code:
        'function main(params){ return { "sum": Number(params.a) + Number(params.b)};}',
    },
    {
      _id: "/myactions/mult",
      code:
        'function main(params){ return { "mult":Number(params.a) * Number(params.b)};}',
    },
  ],
  requests: [
    {
      path: "/myactions/sum",
      timestamp: new Date(now - 8000000).toISOString(),
      params: {
        a: 1,
        b: 2,
      },
      result: {
        sum: "3",
      },
      status: "success",
    },
    {
      path: "/myactions/sum",
      timestamp: new Date(now - 320000).toISOString(),
      params: {
        a: 1,
        b: 2,
      },
      status: "new",
    },
    {
      path: "/myactions/mult",
      timestamp: new Date(now - 140000).toISOString(),
      params: {
        a: 1,
        b: 2,
      },
      status: "new",
    },
  ],
};

// try to empty the DB, if the DB is not present try again after some time
function destroyDB(dbname, callback) {
  const db = new PouchDB(`${DbUrl}/${dbname}`);
  db.destroy((err, _) => {
    if (err) {
      if (typeof tries[dbname] === "undefined") {
        tries[dbname] = 0;
      }
      if (tries[dbname]++ < maxTries) {
        console.log(
          "Going to retry to connect to",
          dbname,
          "in",
          retryMs,
          "ms"
        );
        setTimeout(() => {
          destroyDB(dbname, callback);
        }, retryMs);
      } else {
        console.log("Failed to connect to database at", DbUrl);
      }
    } else {
      callback();
    }
  });
}

function doInsert(dbname, data) {
  // clean up the database we migh have created previously
  destroyDB(dbname, () => {
    const db = new PouchDB(`${DbUrl}/${dbname}`);
    db.bulkDocs(data, (err, response) => {
      if (err) {
        console.log(err, response);
      } else {
        console.log(dbname, "loaded ok");
      }
    });
  });
}

// start the show

// merge the examples with the design docs
for (let dbname in designDocs) {
  if (typeof demoData[dbname] === "undefined") {
    demoData[dbname] = [];
  }
  for (let item in designDocs[dbname]) {
    demoData[dbname].push(designDocs[dbname][item]);
  }
}

for (let dbname in demoData) {
  doInsert(dbname, demoData[dbname]);
}
