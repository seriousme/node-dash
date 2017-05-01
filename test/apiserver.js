process.env.NODE_ENV = 'test'
const DbUrl = process.env.DB_URL || 'http://localhost:5984'
const PouchDB = require('pouchdb-node')
const designDocs = require('../designDocs.json')

// Require the dev dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../apiserver')
let should = chai.should()
var actions

chai.use(chaiHttp)

console.log('Testing using database at', DbUrl)

function recreateDB (dbname, callback) {
  const db = new PouchDB(`${DbUrl}/${dbname}`)
  db.destroy((_) => {
    const newdb = new PouchDB(`${DbUrl}/${dbname}`)
    callback(newdb)
  })
}

describe('Actions', () => {
  beforeEach((done) => { // Before each test we empty the database
    recreateDB('actions', (newActions) => {
      actions = newActions
      // and load it op with the design doc
      actions.bulkDocs(designDocs.actions, () => {
        // and a demo action
        // actions.put({
        //   '_id': '/myactions/sum',
        //   'code': 'function main(params){ return { "sum": Number(params.a) + Number(params.b)};}'
        // }, () => {
        //   done()
        // })
        done()
      })
    })
  })
/*
  * Test the /GET route
  */
  describe('GET /dash/actions', () => {
      it('it should GET all the actions', (done) => {
        chai.request(server)
            .get('/dash/actions')
            .end((_, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.body.rows.should.be.a('array')
                res.body.rows.length.should.be.eql(0)
              done()
            })
      })
  })
  describe('GET /dash/actions/:id', () => {
      it('it should GET an action by ID', (done) => {
        const id = '/myactions/sum'
        const code = 'function main(params){ return { "sum": Number(params.a) + Number(params.b)};}'
        actions.put({
          '_id': id,
          'code': code
        }, () => {
          chai.request(server)
            .get('/dash/actions/' + encodeURIComponent(id))
            .end((_, res) => {
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.body._id.should.be.eql(id)
                res.body.code.should.be.eql(code)
              done()
            })
        })
      })
      it('it should give a 404 on a GET with an invalid ID', (done) => {
        const id = '/blabla'
        chai.request(server)
          .get('/dash/actions/' + encodeURIComponent(id))
          .end((_, res) => {
              res.should.have.status(404)
            done()
          })
      })
  })
})
