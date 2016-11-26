// app.js

var baseUrl="/dash/";

Vue.filter('since', function(timestamp) {
    return (dateSince(Date.parse(timestamp)) + " ago");
});

Vue.filter('encodeURI', function(data) {
    return (encodeURIComponent(data));
});

var appData = {
    action: {},
    request: {},
    actions: [],
    requests: [],
    page: "",
    hash: ""
};
var app = new Vue({

    // We want to target the div with an id of 'events'
    el: '#dash',

    // Here we can register any values or collections that hold data
    // for the application
    data: appData,

    // Methods we want to use in our application are registered here
    methods: {

        // We dedicate a method to retrieving and setting some data
        newAction: function() {
            appData.action = {
                _id: "",
                code: ""
            };
            appData.page = 'showAction';
        },
        newRequest: function() {
            this.fetchActions(this.newRequestStage2);
        },
        newRequestStage2: function(actions) {
            appData.request = {
                'path': actions[0]._id,
                'params': "",
                'response': ""
            };
            appData.page = 'newRequest';
        },
        showAction: function(ctx) {
            var actionid = ctx.params[0];
            this.$http.get(baseUrl + "actions/" + encodeURIComponent(actionid)).then((response) => {
                // success callback
                appData.action = response.body;
                appData.page = 'showAction';
            }, (response) => {
                doNotify("danger", "Failed to load request");
            });

        },
        showRequest: function(ctx) {
          var requestid = ctx.params.requestid;
            this.$http.get(baseUrl + "requests/" + encodeURIComponent(requestid)).then((response) => {
                // success callback
                appData.request =  response.body;
                appData.page = 'showRequest';
            }, (response) => {
                doNotify("danger", "Failed to load request");
            });

        },
        listActions: function() {
            this.fetchActions();
            appData.hash = 'actions';
            appData.page = 'listActions';
        },
        listRequests: function() {
            this.fetchRequests();
            appData.hash = 'requests';
            appData.page = 'listRequests';
        },
        fetchActions: function(callback) {
            this.$http.get(baseUrl + "actions").then((response) => {
                // success callback
                var actions = [];
                response.body.rows.forEach(function(row) {
                    actions.push(row.value);
                });
                appData.actions = actions;
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
                response.body.rows.forEach(function(row) {
                    requests.push(row.value);
                });
                appData.requests = requests;


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
                        doNotify('info', 'Succesfully updated action: ' + response.body.id);
                        page.show('/actions');
                    }, (response) => {
                        // error callback
                        doNotify("danger", "Failed to update action");
                    });

                } else {
                    this.$http.put(baseUrl + "actions/" + encodeURIComponent(action._id), body).then((response) => {
                        // success callback
                        doNotify('info', 'Succesfully updated action: ' + response.body.id);
                        page.show('/actions');
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
                doNotify('info', 'Succesfully created request with ID: ' + response.body.id);
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
                    doNotify('info', 'Succesfully deleted action with ID: ' + response.body.id);
                }, (response) => {
                    // error callback
                    doNotify("danger", "Failed to create new request");
                });
                var index = this.actions.indexOf(action);
                this.actions.splice(index, 1);
                page.show('/actions');
            }
        },
        exists: function(v) {
            return (typeof(v) != "undefined");
        },
        setPage: function(path,v){
          if (typeof(v) == 'string'){
             path = path + encodeURIComponent(v);
          }
          console.log("setPage",path);
          page.show(path);
        }
    }
});




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

page.base(baseUrl+'ui');
page('/requests', app.listRequests);
page('/requests/new', app.newRequest);
page('/requests/:requestid', app.showRequest);
page('/actions', app.listActions);
page('/actions/new', app.newAction);
page('/actions/*', app.showAction);
page('/','/requests');
page.start();
