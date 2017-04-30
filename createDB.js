var DbUrl = process.env.DB_URL || 'http://localhost:5984'
const PouchDB = require('pouchdb-node')

var http = require('http')

const maxTries = 10
const tries = {}
const retryMs = 500

const now = Date.now()

// Handling socket errors in Nano is not trivial,
// cheating here by doing a http request first,
// if that works we'll start the show

function bulkInsert (dbname, data) {
  if (typeof (tries[dbname]) === 'undefined') {
    tries[dbname] = 0
  }
  console.log('Attempt', tries[dbname], 'of', maxTries, 'to connect to ', dbname, 'at', DbUrl)
  http.get(DbUrl, (res) => {
    console.log('Database server at', DbUrl, 'is up !')
    // consume response body
    res.resume()
    doInsert(dbname, data)
  }).on('error', (e) => {
    // console.log(`Got error: ${e.message}`)
    if (tries[dbname]++ < maxTries) {
      console.log('Going to retry in', retryMs, 'ms')
      setTimeout(() => { bulkInsert(dbname, data) }, retryMs)
    } else {
      console.log('Failed to connect to', dbname, 'at', DbUrl)
    }
  })
}

function destroyDB (dbname, callback) {
  const db = new PouchDB(`${DbUrl}/${dbname}`)
  db.destroy(function (err, _) {
    if (err) {
      return console.log('destroying database', dbname, 'failed:', err)
    }
    callback()
  })
}

function doInsert (dbname, data) {
  // clean up the database we migh have created previously
  destroyDB(dbname, function () {
    const db = new PouchDB(`${DbUrl}/${dbname}`)
    db.bulkDocs(data, function (err, response) {
      if (err) {
        console.log(err, response)
      } else {
        console.log(dbname, 'loaded ok')
      }
    })
  })
}

bulkInsert('actions', [{
  '_id': '/myactions/sum',
  'code': 'function main(params){ return { "sum": Number(params.a) + Number(params.b)};}'
}, {
  '_id': '/myactions/mult',
  'code': 'function main(params){ return { "mult":Number(params.a) * Number(params.b)};}'
},
{
  'views': {
    'all': {
      'map': "function (doc) {\n    emit(null,{'_id':doc._id,'_rev':doc._rev});\n}\n"
    }
  },
  '_id': '_design/actions'
}
])

bulkInsert('requests', [
  {
    'path': '/myactions/sum',
    'timestamp': (new Date((now - 8000000))).toISOString(),
    'params': {
      'a': 1,
      'b': 2
    },
    'result': {
      'sum': '3'
    },
    'status': 'success'
  },
  {
    'path': '/myactions/sum',
    'timestamp': (new Date((now - 320000))).toISOString(),
    'params': {
      'a': 1,
      'b': 2
    },
    'status': 'new'
  },
  {
    'path': '/myactions/mult',
    'timestamp': (new Date((now - 140000))).toISOString(),
    'params': {
      'a': 1,
      'b': 2
    },
    'status': 'new'
  },
  {
    'views': {
      'all': {
        'map': "function (doc) {\n  emit(doc.timestamp,{'id':doc._id, 'path':doc.path, 'status':doc.status,'timestamp':doc.timestamp});\n}"
      },
      'new': {
        'map': 'function (doc) {\n if (doc.status == "new"){\n  emit(doc._id, 1);\n }\n}'
      }
    },
    'filters': {
      'iscompleted': 'function (doc) {\n return ((doc.status === "success") || (doc.status === "failed"));}',
      'isnew': 'function (doc) {\n return (doc.status === "new");}'
    },
    '_id': '_design/requests'
  }
])
