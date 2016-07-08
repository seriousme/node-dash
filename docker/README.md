To start the container directly from the Docker hub:
```
docker run  -p 8080:8080 -t seriousme/node-dash
```

Now connect your browser to your Dockerhost at port 8080 e.g.: http://dockerhost:8080/ 
which should give the message
```
Api server ready
```


To build a docker container yourself use:
```
docker build --rm -t seriousme/node-dash https://github.com/seriousme/node-dash.git
```



