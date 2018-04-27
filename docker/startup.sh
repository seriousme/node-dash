cd $HOME/app
/bin/sh docker/startdb.sh &
node actionrunner.js &
node apiserver.js &
wait
