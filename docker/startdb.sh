cd /usr/src/app
node_modules/.bin/pouchdb-server --host 0.0.0.0 --dir pouchdb &
/usr/bin/node createDB.js
wait