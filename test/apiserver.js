process.env.NODE_ENV = "test";
const DbUrl = process.env.DB_URL || "http://localhost:5984";
const PouchDB = require("pouchdb-node");
const designDocs = require("../designDocs.json");

// Require the dev dependencies
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../apiserver");
const should = chai.should();
const testAction = {
  _id: "/myactions/sum",
  code:
    'function main(params){ return { "sum": Number(params.a) + Number(params.b)};}'
};
const brokenAction = {
  _id: "/myactions/brokenAction",
  code:
    'unction main(params){ return { "sum": Number(params.a) + Number(params.b)};}'
};
const testRequest = {
  _id: "41de62f1-ab4d-44a4-9a30-b25091e320fb",
  path: "/myactions/sum",
  timestamp: "2017-05-01T11:49:54.866Z",
  params: {
    a: 1,
    b: 2
  },
  result: {
    sum: "3"
  },
  status: "success"
};

var actions;
var requests;

chai.use(chaiHttp);

console.log("Testing using database at", DbUrl);

// Before each test we recreate the database(s)
function recreateDB(dbname, callback) {
  const db = new PouchDB(`${DbUrl}/${dbname}`);
  db.destroy(_ => {
    const newdb = new PouchDB(`${DbUrl}/${dbname}`);
    if (designDocs[dbname]) {
      newdb.bulkDocs(designDocs[dbname], () => {
        callback(newdb);
      });
    } else {
      callback(newdb);
    }
  });
}

// after all the tests have run close the server to ensure mocha exits
after(() => server.close());

describe("APIserver", () => {
  describe("UI", () => {
    it("it should get a redirect to the UI when asking for root", done => {
      chai
        .request(server)
        .get("/")
        .redirects(0)
        .end((_, res) => {
          res.should.redirect;
          done();
        });
    });
    it("it should get a static file", done => {
      chai
        .request(server)
        .get("/dash/ui/index.htm")
        .end((_, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
  describe("Actions", () => {
    beforeEach(done => {
      recreateDB("actions", newActions => {
        actions = newActions;
        done();
      });
    });
    /*
    * Test the /GET routes
    */
    describe("GET /dash/actions", () => {
      it("it should GET all the actions", done => {
        chai
          .request(server)
          .get("/dash/actions")
          .end((_, res) => {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.rows.should.be.a("array");
            res.body.rows.length.should.be.eql(0);
            done();
          });
      });
    });
    describe("GET /dash/actions/:id", () => {
      it("it should GET an action by ID", done => {
        actions.put(testAction, () => {
          chai
            .request(server)
            .get("/dash/actions/" + encodeURIComponent(testAction._id))
            .end((_, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              res.body.should.contain(testAction);
              res.body.should.have.property("_rev");
              done();
            });
        });
      });
      it("it should give a 404 on a GET with an invalid ID", done => {
        const id = "/blabla";
        chai
          .request(server)
          .get("/dash/actions/" + encodeURIComponent(id))
          .end((_, res) => {
            res.should.have.status(404);
            done();
          });
      });
    });
    describe("PUT /dash/actions/:id", () => {
      it("it should create an action", done => {
        chai
          .request(server)
          .put("/dash/actions/" + encodeURIComponent(testAction._id))
          .send(testAction)
          .end((_, res) => {
            res.should.have.status(200);
            done();
          });
      });
    });
    describe("DELETE /dash/actions/:id", () => {
      it("it should delete an action", done => {
        actions.put(testAction, () => {
          actions.get(testAction._id, (_, myAction) => {
            chai
              .request(server)
              .delete(
                "/dash/actions/" +
                  encodeURIComponent(myAction._id) +
                  "?rev=" +
                  myAction._rev
              )
              .end((_, res) => {
                res.should.have.status(200);
                done();
              });
          });
        });
      });
    });
  });
  describe("Requests", () => {
    beforeEach(done => {
      recreateDB("actions", newActions => {
        actions = newActions;
        recreateDB("requests", newRequests => {
          requests = newRequests;
          done();
        });
      });
    });
    describe("GET /dash/requests/", () => {
      it("it should GET all requests", done => {
        chai
          .request(server)
          .get("/dash/requests/")
          .end((_, res) => {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.rows.should.be.a("array");
            res.body.rows.length.should.eql(0);
            done();
          });
      });
    });
    describe("GET /dash/requests/:id", () => {
      it("it should GET a requests by ID", done => {
        requests.put(testRequest, () => {
          chai
            .request(server)
            .get("/dash/requests/" + testRequest._id)
            .end((_, res) => {
              res.should.have.status(200);
              res.body.should.be.a("object");
              // this will only work using chai 4.x
              // res.body.should.deep.include(testRequest)
              // for now we specify properties individually
              res.body._id.should.eql(testRequest._id);
              res.body.path.should.eql(testRequest.path);
              res.body.timestamp.should.eql(testRequest.timestamp);
              res.body.params.should.eql(testRequest.params);
              res.body.result.should.eql(testRequest.result);
              res.body.status.should.eql(testRequest.status);
              res.body.should.have.property("_rev");
              done();
            });
        });
      });
      it("it should give a 404 on a GET with an invalid ID", done => {
        chai
          .request(server)
          .get("/dash/requests/blabla")
          .end((_, res) => {
            res.should.have.status(404);
            done();
          });
      });
    });
    describe("GET <action>", () => {
      it("it should give a 404 on a GET with an non-existent action", done => {
        chai
          .request(server)
          .get("/myactions/blabla")
          .end((_, res) => {
            res.should.have.status(404);
            done();
          });
      });
      it("it should create a async request", done => {
        actions.put(testAction, () => {
          chai
            .request(server)
            .get(testAction._id)
            .end((_, res) => {
              res.should.have.status(201);
              done();
            });
        });
      });
      it("it should timeout on a sync request when no actionrunner is active", done => {
        actions.put(testAction, () => {
          chai
            .request(server)
            .get(testAction._id + "?sync=true")
            .end((_, res) => {
              res.should.have.status(504);
              done();
            });
        });
      });
    });
  });
});
