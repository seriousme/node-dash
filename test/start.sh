npm run startdb > pouchdb.log &
node ../createDB.js
node ../actionrunner.js > actionrunner.log &
node ../apiserver.js > apiserver.log &


