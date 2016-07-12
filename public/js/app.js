// app.js

const pages = {
  "#requests" : { "page": "requests","hash":"requests" },
  "#actions"  : { "page": "actions","hash":"actions" }
};

var app = new Vue({

    // We want to target the div with an id of 'events'
    el: '#dash',

    // Here we can register any values or collections that hold data
    // for the application
    data: {
        action: {},
        request: {},
        actions: [],
        requests: [],
        page: "",
        hash: ""
    },

    // Anything within the ready function will run when the application loads
    ready: function() {
        // When the application loads, we want to call the method that initializes
        // some data
        this.fetchData();
    },

    // Methods we want to use in our application are registered here
    methods: {

        // We dedicate a method to retrieving and setting some data
        fetchData: function() {
            console.log("Fetching events");
            var actions = [{
                "_id": "/myactions/sum",
                "code": "function main(params){ return { \"sum\": Number(params.a) + Number(params.b)};}",
		"_rev": "20aab0e9-fedb-4a60-92a2-972646576acd"
            }, {
                "_id": "/myactions/mult",
                "code": "function main(params){ return { \"mult\":Number(params.a) * Number(params.b)};}",
                "_rev": "00aab0e9-fedb-4a60-92a2-972646576ada"
            }];
            var requests = [{
                    "path": "/myactions/sum",
                    "params": {
                        "a": 1,
                        "b": 2
                    },
                    "result": {
                        "sum": "3"
                    },
                    "status": "success",
                    "_id": "00aab0e9-fedb-4a60-92a2-972646576ada"
                }, {
                    "path": "/myactions/sum",
                    "params": {
                        "a": 1,
                        "b": 2
                    },
                    "status": "new",
                    "_id": "15e0dcbc-a518-4c46-8716-1c39dde93df4"
                }, {
                    "path": "/myactions/mult",
                    "params": {
                        "a": 1,
                        "b": 2
                    },
                    "status": "new",
                    "_id": "a6b76660-0e57-4ee2-a200-8df1b1dce5f3"
                }

            ];



            this.$set('actions', actions);
            this.$set('requests', requests);
        },

	newAction: function(action) {
          this.$set('action',{_id:"",code:""} );
          this.$set('page', 'action');
        },
        showAction: function(action) {
          this.$set('action',action );
          this.$set('page', 'action');
        },
        showRequest: function(request) {
          this.$set('request',request );
          this.$set('page', 'request');
        },
        listActions: function() {
          this.$set('page', 'actions');
        },
        listRequests: function() {
          this.$set('page', 'requests');
        },
        toJson:function(obj){
          return JSON.stringify(obj,null,2);
        },
        // Adds an action to the existing actions array
        addAction: function() {
            console.log("Add action");
            if (this.action.path) {
                this.actions.push(this.action);
                this.action = {
                    path: '',
                    code: ''
                };
            }
        },
        deleteAction: function(action) {
            console.log("delete action");
            if (confirm("Are you sure you want to delete this action?")) {
                // $remove is a Vue convenience method similar to splice
                this.actions.$remove(action);
            }
        },
       exists: function(v){
         return (typeof(v)!= "undefined");
       }
    }
});


//
function setPage(url){
    app.page = pages[url].page;
    app.hash = pages[url].hash;
}

window.onhashchange = function(){
  setPage(location.hash);
};


var startPage = "#requests";
// did the user jump directly to a specific page ?
if (typeof pages[location.hash] != 'undefined'){
  startPage = location.hash;
}

setPage(startPage);

