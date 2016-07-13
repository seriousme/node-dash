// app.js

var pages = {
    "#requests": {
        "page": "listRequests",
        "hash": "requests"
    },
    "#actions": {
        "page": "listActions",
        "hash": "actions"
    }
};

var startPage = "#requests";

Vue.filter('since', function(timestamp) {
    return (dateSince(Number(timestamp)) + " ago");
});


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
            var now = Date.now();
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
                    "timestamp": (now - 8000000),
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
                    "timestamp": (now - 320000),
                    "params": {
                        "a": 1,
                        "b": 2
                    },
                    "status": "new",
                    "_id": "15e0dcbc-a518-4c46-8716-1c39dde93df4"
                }, {
                    "path": "/myactions/mult",
                    "timestamp": (now - 140000),
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
            this.$set('action', {
                _id: "",
                code: ""
            });
            this.$set('page', 'showAction');
        },
        newRequest: function(action) {
            this.$set('request.path', this.actions[0]._id);
            this.$set('page', 'newRequest');
        },
        showAction: function(action) {
            this.$set('action', action);
            this.$set('page', 'showAction');
        },
        showRequest: function(request) {
            this.$set('request', request);
            this.$set('page', 'showRequest');
        },
        listActions: function() {
            this.$set('page', 'listActions');
        },
        listRequests: function() {
            this.$set('page', 'listRequests');
        },
        // Adds an action to the existing actions array
        saveAction: function(action) {
            if ((action._id) && (action.code)) {
                if (action._rev) {
                    action._rev = makeUUID();
                    this.$set('action', action);
                } else {
                    action._rev = makeUUID();
                    this.actions.push(action);
                    this.action = {
                        path: '',
                        code: ''
                    };
                }
                this.listActions();
            }
        },
        saveRequest: function(request) {
            request._id = makeUUID();
            request.status = "new";
            request.timestamp = Date.now();
            this.requests.push(request);
            this.listRequests();
        },

        deleteAction: function(action) {
            console.log("delete action");
            if (confirm("Are you sure you want to delete action " + action._id + " ?")) {
                // $remove is a Vue convenience method similar to splice
                this.actions.$remove(action);
                this.listActions();
            }
        },
        exists: function(v) {
            return (typeof(v) != "undefined");
        }
    }
});

function dateSince(date) {
    console.log("date", typeof(date), date);

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

function makeUUID() {
    // 4-2-2-2-6
    function rh(bytes) {
        var str = "";
        for (var i = 0; i < bytes; i++) {
            str += Math.round((Math.random() * (256 - 0))).toString(16);
        }
        return str;
    }
    return rh(4) + "-" + rh(2) + "-" + rh(2) + "-" + rh(2) + "-" + rh(6);
}

//
function setPage(hash) {
    if (typeof pages[location.hash] == 'undefined') {
        hash = startPage;
    }
    app.page = pages[hash].page;
    app.hash = pages[hash].hash;
}

window.onhashchange = function() {
    setPage(location.hash);
};

setPage(location.hash);
