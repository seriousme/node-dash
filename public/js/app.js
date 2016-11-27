// app.js

var baseUrl = "/dash/";

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
          var uri = baseUrl + "actions";
          this.fetchItems('actions', uri, (items) => {
            appData.actions = items;
            appData.request = {
                'path': items[0]._id,
                'params': { "a":5, "b":2 },
                'response': ""
            };
            appData.page = 'newRequest';
          });
        },
        showItem: function(name, uri, callback) {
            this.$http.get(uri).then((response) => {
                // success callback
                if (callback) {
                    callback(response.body);
                }
            }, (response) => {
                doNotify("danger", "Failed to load " + name);
            });
        },
        showAction: function(ctx) {
            var uri = baseUrl + "actions/" + encodeURIComponent(ctx.params[0]);
            this.showItem('action', uri, (item) => {
                appData.action = item;
                appData.page = 'showAction';
            });
        },
        showRequest: function(ctx) {
            var uri = baseUrl + "requests/" + encodeURIComponent(ctx.params.requestid);
            this.showItem('request', uri, (item) => {
                appData.request = item;
                appData.page = 'showRequest';
            });
        },
        fetchItems(name, uri, callback) {
            this.$http.get(uri).then((response) => {
                // success callback
                var items = [];
                response.body.rows.forEach(function(row) {
                    items.push(row.value);
                });
                if (callback) {
                    callback(items);
                }
            }, (response) => {
                // error callback
                doNotify("danger", "Failed to load " + name);
            });
        },
        listActions: function() {
            var uri = baseUrl + "actions";
            this.fetchItems('actions', uri, (items) => {
                appData.actions = items;
                appData.hash = 'actions';
                appData.page = 'listActions';
            });
        },
        listRequests: function() {
            var uri = baseUrl + "requests";
            this.fetchItems('requests', uri, (items) => {
                appData.requests = items;
                appData.hash = 'requests';
                appData.page = 'listRequests';
            });
        },
        saveAction: function(action) {
            //console.log(this.action);

            if ((action._id) && (action.code)) {
                var body = {
                    "_id": action._id,
                    "code": action.code
                };
                var txt = "created";
                if (action._rev) {
                    body._rev = action._rev;
                    txt = "updated";
                }
                this.$http.put(baseUrl + "actions/" + encodeURIComponent(action._id), body).then((response) => {
                    // success callback
                    doNotify('info', 'Succesfully '+ txt +' action: ' + response.body.id);
                    page.show('/actions');
                }, (response) => {
                    // error callback
                    var errTxt = "";
                    if (response.status == 409) {
                        errTxt = ": action with this path already exists";
                    }
                    doNotify("danger", "Failed to save action" + errTxt);
                });
            } else {
                doNotify("danger", "Path and Code need to be entered");
            }
        },
        saveRequest: function(request) {
            this.$http.get(request.path, {
                'params': request.params
            }).then((response) => {
                doNotify('info', 'Succesfully created request with ID: ' + response.body.id);
            }, (response) => {
                // error callback
                doNotify("danger", "Failed to create new request");
            });
        },

        deleteAction: function(action) {
            if (confirm("Are you sure you want to delete action " + action._id + " ?")) {
                this.$http.delete(baseUrl + "actions/" + encodeURIComponent(action._id), {
                    '_rev': action._rev
                }).then((response) => {
                    doNotify('info', 'Succesfully deleted action with ID: ' + response.body.id);
                    this.fetchActions();
                }, (response) => {
                    // error callback
                    doNotify("danger", "Failed to create new request");
                });
                page.show('/actions');
            }
        },
        exists: function(v) {
            return (typeof(v) != "undefined");
        },
        setPage: function(path, v) {
            if (typeof(v) == 'string') {
                path = path + encodeURIComponent(v);
            }
            console.log("setPage", path);
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

page.base(baseUrl + 'ui');
page('/requests', app.listRequests);
page('/requests/new', app.newRequest);
page('/requests/:requestid', app.showRequest);
page('/actions', app.listActions);
page('/actions/new', app.newAction);
page('/actions/*', app.showAction);
page('/', '/requests');
page.start();
