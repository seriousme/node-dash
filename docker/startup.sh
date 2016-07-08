cd /usr/src/app
/bin/sh docker/startdb.sh &
/usr/bin/node actionrunner.js & 
/usr/bin/node apiserver.js &
wait



