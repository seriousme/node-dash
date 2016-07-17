// app.js


var startPage = "#requests";
var baseUrl = "/dash/";

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
        //this.fetchData();
    },

    // Methods we want to use in our application are registered here
    methods: {

        // We dedicate a method to retrieving and setting some data
        newAction: function(action) {
            this.$set('action', {
                _id: "",
                code: ""
            });
            this.$set('page', 'showAction');
        },
        newRequest: function(action) {
            this.fetchActions(this.newRequestStage2);
        },
        newRequestStage2: function(actions) {
            this.$set('request', {
                'path': actions[0]._id,
                'params': "",
                'response': ""
            });
            this.$set('page', 'newRequest');
        },
        showAction: function(action) {
            this.$http.get(baseUrl + "actions/" + encodeURIComponent(action._id)).then((response) => {
                // success callback
                this.$set('action', response.json());
                this.$set('page', 'showAction');
            }, (response) => {
                doNotify("danger", "Failed to load request");
            });

        },
        showRequest: function(request) {
            this.$http.get(baseUrl + "requests/" + encodeURIComponent(request.id)).then((response) => {
                // success callback
                console.log(response);
                this.$set('request', response.json());
                this.$set('page', 'showRequest');
            }, (response) => {
                doNotify("danger", "Failed to load request");
            });

        },
        listActions: function() {
            this.fetchActions();
            this.$set('hash', 'actions');
            this.$set('page', 'listActions');
        },
        listRequests: function() {
            this.fetchRequests();
            this.$set('hash', 'requests');
            this.$set('page', 'listRequests');
        },
        fetchActions: function(callback) {
            this.$http.get(baseUrl + "actions").then((response) => {
                // success callback
                var actions = [];
                response.json().rows.forEach(function(row) {
                    actions.push(row.value);
                });
                this.$set('actions', actions);
                if (callback) {
                    callback(actions);
                }
            }, (response) => {
                // error callback
                doNotify("danger", "Failed to load actions");
            });
        },
        fetchRequests: function() {
            this.$http.get(baseUrl + "requests").then((response) => {
                // success callback
                var requests = [];
                response.json().rows.forEach(function(row) {
                    requests.push(row.value);
                });
                this.$set('requests', requests);


            }, (response) => {
                // error callback
                doNotify("danger", "Failed to load requests");
            });
        },
        saveAction: function(action) {
            //console.log(this.action);

            if ((action._id) && (action.code)) {
                var body = {
                    "_id": action._id,
                    "code": action.code
                };
                if (action._rev) {
                    body._rev = action._rev;
                    this.$http.put(baseUrl + "actions/" + encodeURIComponent(action._id), body).then((response) => {
                        // success callback
                        doNotify('info', 'Succesfully updated action: ' + response.json().id);
                        this.listActions();
                    }, (response) => {
                        // error callback
                        doNotify("danger", "Failed to update action");
                    });

                } else {
                    this.$http.put(baseUrl + "actions/" + encodeURIComponent(action._id), body).then((response) => {
                        // success callback
                        doNotify('info', 'Succesfully updated action: ' + response.json().id);
                        this.listActions();
                    }, (response) => {
                        var errTxt = "";
                        if (response.status == 409) {
                            errTxt = ": action with this path already exists";
                        }
                        // error callback
                        doNotify("danger", "Failed to create action" + errTxt);
                    });
                }

            } else {
                doNotify("danger", "Path and Code need to be entered");
            }
        },
        saveRequest: function(request) {
            this.$http.get(request.path, {
                'params': JSON.parse(request.params)
            }).then((response) => {
                doNotify('info', 'Succesfully created request with ID: ' + response.json().id);
            }, (response) => {
                // error callback
                doNotify("danger", "Failed to create new request");
            });
        },

        deleteAction: function(action) {
            if (confirm("Are you sure you want to delete action " + action._id + " ?")) {
                this.$http.delete(baseUrl + "actions/" + encodeURIComponent(action._id),{
                  '_rev': action._rev
                }).then((response) => {
                    doNotify('info', 'Succesfully deleted action with ID: ' + response.json().id);
                }, (response) => {
                    // error callback
                    doNotify("danger", "Failed to create new request");
                });
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

var pages = {
    "#requests": app.listRequests,
    "#actions": app.listActions
};


function dateSince(date) {
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


//
function setPage(hash) {
    if (typeof pages[hash] == 'undefined') {
        hash = startPage;
    }
    pages[hash]();

}

function doNotify(type, txt) {
    $.notify({
        // options
        message: txt
    }, {
        // settings
        element: 'body',
        type: type,
        mouse_over: "pause",
        delay: 3000,
        placement: {
            from: "top",
            align: "center"
        }
    });
}

window.onhashchange = function() {
    setPage(location.hash);
};

setPage(location.hash);
