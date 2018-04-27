cd $HOME/app/db
$(npm bin)/pouchdb-server --host 0.0.0.0 --dir pouchdb &
node ../createDB.js
wait
