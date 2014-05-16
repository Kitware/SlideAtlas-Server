/**
 * @author dhanannjay.deo
 */

 var app = angular.module('adminapi',["ngResource", "ngRoute", 'ui.bootstrap']).
    config(
     function ($routeProvider) {
        $routeProvider.when("/tilestores/new", {templateUrl: "/apiv1/static/partials/tilestoresNew.html", controller:"DBNewCtrl"});

        $routeProvider.when("/databases", {templateUrl: "/apiv1/static/partials/dbList.html"});
        $routeProvider.when("/databases/new", {templateUrl: "/apiv1/static/partials/dbNew.html", controller:"DBNewCtrl"});
        $routeProvider.when("/databases/edit/:idx", {templateUrl: "/apiv1/static/partials/dbNew.html", controller:"DBEditCtrl"});
        $routeProvider.when("/databases/details/:idx", {templateUrl: "/apiv1/static/partials/dbNew.html", controller:"DBEditCtrl"});
        // $routeProvider.when("/databases/delete/:idx", {templateUrl: "/apiv1/static/partials/confirm.html", controller:"DBDeleteCtrl"});

        $routeProvider.when("/users", {templateUrl: "/apiv1/static/partials/userList.html"});
        $routeProvider.when("/users/new", {templateUrl: "/apiv1/static/partials/userNew.html"});

        $routeProvider.when("/roles", {templateUrl: "/apiv1/static/partials/roleList.html"});
        $routeProvider.when("/roles/edit/:idx", {templateUrl: "/apiv1/static/partials/roleEdit.html", controller:"RoleEditCtrl"});

        $routeProvider.when("/:dbid/sessions", {templateUrl: "/apiv1/static/partials/dbDetails.html"});
        $routeProvider.when("/:dbid/sessions/new", {templateUrl: "/apiv1/static/partials/sessNew.html", controller:"SessNewCtrl"});
        $routeProvider.when("/:dbid/sessions/:sessid", {templateUrl: "/apiv1/static/partials/sessDetails.html"});
        $routeProvider.when("/:dbid/sessions/:sessid/:type/new", {templateUrl: "/apiv1/static/partials/fileUpload.html", controller:"fileUploadCtrl"});

        $routeProvider.when("/mysessions", {templateUrl: "/apiv1/static/partials/allSessList.html", controller:"SessAllListCtrl"});

        $routeProvider.otherwise({ redirectTo: "/databases"});
    });

app.filter('lastclass', function() {
    return function(text) {
        text = text || '';
        var words = text.split('.');
        return words[words.length -1];
    };
});

app.factory('Database', function($resource) {
    return $resource('databases/:dbid', {dbid:'@_id'},
                 {
            query: { method: 'GET', params: {}, isArray: false },
            save :{ method: 'PUT', params: {"charge" : true} }
              });
  });

app.factory('User', function($resource) {
    return $resource('users/:id', {id:'@_id'},
                 {
            query: { method: 'GET', params: {}, isArray: false },
            update:{ method: 'PUT'}
              });
  });


app.factory('Session', function($resource) {
    return $resource('/apiv1/:dbid/sessions/:sessid', {dbid:'@dbid', sessid:'@sessid'},
                 {
            query: { method: 'GET', params: {}, isArray: true },
            update: { method: 'PUT'}
              });
  });

app.factory('SessionItem', function($resource) {
    return $resource('/apiv1/:dbid/sessions/:sessid/:restype/:resid', {dbid:'@dbid', sessid:'@sessid', restype:'@restype', resid:'@resid'});
  });

app.factory('Data', function() {
    var methods = {};

    methods.databases ={};

    methods.getItem = function (idx) {
        return this.databases[idx];
    };

    methods.getList = function () {
        return this.databases;
    };

    methods.setList = function (alist) {
        this.databases = alist;
    };
    methods.removeItem = function(idx){
            this.databases.splice(idx,1)
    };

    return methods;

    });

app.controller("DBEditCtrl", function ($scope, $location, $routeParams, $http){
        // console.log("Refreshing edit")
        // Locate the object
        $http({method: "get", url: "/apiv1/databases/" + $routeParams.idx}).
            success(function(data, status) {
                $scope.database = data;
            }).
            error(function(data, status) {
                alert("Item not found for editing");
                $location.path("/databases") ;
                return;
            });

        $scope.save = function () {
            console.log("Saving .. ");

            $http.put("/apiv1/databases/" + $routeParams.idx, $scope.database).
                success(function(data, status) {
                    // $scope.database = data;
                    $location.path("/databases") ;
                }).
                error(function(data, status) {
                    alert("Save not successful");
                    return;
                });
            }

        $scope.sync = function (re) {
            re = re | false;
            console.log("Synchronizing .. ");

            $http.post("/apiv1/databases/" + $routeParams.idx, { "sync" : $scope.database._id , "re" : re}).
                success(function(data, status) {
                    // $scope.database = data;
                    $scope.database = data.database;
                }).
                error(function(data, status) {
                    alert("Sync failed");
                    return;
                });
        };
    });

app.directive('helloWorld', function () {
    return {
        restrict : "ECMA",
        template: '<div> <p>Hello World</p> </div>',
        replace : true,
    };
 });


app.directive('sessionList', function () {
    return {
        restrict : "ECMA",
        templateUrl: '/apiv1/static/partials/directiveSessList.html',
        // template: '<div> Hello World </div>',
        replace : true,
        // scope : true,
        scope : { sessions : '=sessions'},
        link: function(scope, element, attr, ngModel){
                console.log("For sessionList");
                console.log("Scope");
                console.log(scope.sessions);
        //         console.log("attr");
        //         console.log(scope.sessions)
        //        }
    }
    };
 });

app.directive('sessionView', function () {
    return {
        restrict : "ECMA",
        template: '<li> {{session.label}} </li>',
        replace : true,
        scope : {session : "=session" },
        link: function(scope, element, attr, ngModel){
                console.log("For view");
                console.log(scope.session.label);
                }
    };
 });



app.controller("SessAllListCtrl", function ($scope, $location, $http) {
    $scope.data = {loaded : false};

    $http({method: "get", url: "/sessions?json=1"}).
    success(function(data, status) {
        $scope.roles = data.sessions;
        $scope.data.loaded = true;
    }).
    error(function(data, status) {
        $scope.roles = [];
    });
}); 



app.controller("DBNewCtrl", function ($scope, $location, Database, Data)
    {
        // Start with a blank database
        $scope.database = {"host" : "127.0.0.1"}

        $scope.save = function () {
            Database.save({'insert' : $scope.database}, function() {
                $location.path("/databases");
            });
            }
    });

app.controller("dbDetailsCtrl", function ($scope, $location, $routeParams, Database, Data, Session)
    {
        // Locate the object
        console.log("Refreshing dbDetailsCtrl" + $routeParams.dbid)
        $scope.dbid = $routeParams.dbid;
        Session.get({dbid: $routeParams.dbid, sessid: $routeParams.sessid}, function(data)
        {
        $scope.sessions = data.sessions
        });


        //Session.get({dbid: $routeParams.dbid}, function(data) {
        //    Data.setList(data.sessions);
        //    $scope.sessions = Data.getList();
        //    }
        //);

        $scope.deletesession = function(idx)
        {
        // Locate the object
        var sess = $scope.sessions[idx]
        if (confirm("Remove attachment " + sess.label + '?'))
            {
            Session.delete({dbid:$scope.dbid, sessid: sess._id},
                function(data) {
                    console.log("success in deletion");
                    Session.get({dbid: $routeParams.dbid, sessid: $routeParams.sessid}, function(data)
                        {
                        $scope.sessions = data.sessions
                        });
                });
            }
        }
    });

app.controller("fileUploadCtrl", function ($scope, $location, $routeParams, Database, Data, Session)
    {
        // Locate the object
        console.log("Refreshing fileUploadCtrl with dbid=" + $routeParams.dbid + " and ssid=" + $routeParams.sessid + " and type=" + $routeParams.type )
        $scope.dbid = $routeParams.dbid;
        $scope.sessid = $routeParams.sessid;
        $scope.type = $routeParams.type;
        $scope.$evalAsync( function () {
            var attachmentPostUrl = "/apiv2/" + $routeParams.dbid + "/sessions/"  + $routeParams.sessid + "/attachments";
            console.log("Getting executed");
            console.log("Refreshing fileUploadCtrl with dbid=" + $routeParams.dbid + " and ssid=" + $routeParams.sessid + " and type=" + $routeParams.type )
                $('#fileupload').fileupload({
                    url: attachmentPostUrl,
                    dataType: 'json',
                    maxChunkSize: 1048576, // 10 MB
                    add: function (e, data) {
                        $('#status').text('Uploading...');
                        data.submit();
                    },
                    fail: function (e, data) {
                        $('#status').text('Upload failed ...');
                        var progress = 0;
                        $('#progress .bar').css(
                            'width',
                            progress + '%'
                        );
                    },
                    progressall: function (e, data) {
                        console.log([e,data])
                        var progress = parseInt(data.loaded / data.total * 100, 10);
                        $('#status').text("Progress = " + progress / 2.0+ '%');
                        $('#progress .bar').css(
                            'width',
                            progress + '%'
                        );
                    },
                    done: function (e, data) {
                        console.log(["Done: ", data]);
                        $("#status").text('Upload finished.');
                        console.log("/" + $routeParams.dbid + "/sessions/" + $routeParams.sessid);
                    },

                    send: function(event, options) {
                        this.uploadRedirect = null;
                    },
                    chunksend: function (event, options) {
                        if (this.uploadRedirect) {
                            // subsequent request of a chunked series
                            options.url = this.uploadRedirect;
                            options.type = "PUT"
                        }
                    },
                    chunkdone: function (event, options) {
                        if (!this.uploadRedirect) {
                            // first request of a chunked series
                            // RFC 2616 14.30 requires that Location headers be absolute
                            this.uploadRedirect = options.jqXHR.getResponseHeader("Location");
                        }
                    },
                    always: function (event, options) {
                        // clear after all chunks have been sent
                        this.uploadRedirect = null;
                    }
                });
        });

        $scope.back = function() {
            $location.path("/" + $routeParams.dbid + "/sessions/" + $routeParams.sessid);
        }

        //Session.get({dbid: $routeParams.dbid}, function(data) {
        //    Data.setList(data.sessions);
        //    $scope.sessions = Data.getList();
        //    }https://www.google.com/search?client=ubuntu&channel=fs&q=yout&ie=utf-8&oe=utf-8
        //);
    });

app.controller("SessNewCtrl", function ($scope, $location, Session, $routeParams, Data)
    {
        // Start with a blank database
        $scope.label = "B Session";

        console.log($scope.label);

        $scope.save = function () {
            Session.save({dbid: $routeParams.dbid, insert : { "label" : $scope.label }}, function(data) {
                console.log(data);
                $location.path("/" + $routeParams.dbid + "/sessions");
            });
            }
    });


app.controller("sessEditCtrl", function ($scope, $location, $routeParams, Database, Data, Session)
    {
        // For modifying session as a whole
        // Locate the object
        console.log("Refreshing sessEditCtrl" + $routeParams.dbid)

        Session.get({dbid: $routeParams.dbid}, function(data) {
            Data.setList(data.sessions);
            $scope.sessions = Data.getList();
            }
        );
    });

app.controller("sessDetailsCtrl", function ($scope, $location, $routeParams, $http)
    {
        // For modifying session as a whole
        // Locate the object
        console.log("Refreshing sessDetailsCtrl with dbid=" + $routeParams.dbid + " and sessid =" + $routeParams.sessid)
        $scope.dbid = $routeParams.dbid
        $scope.sessid = $routeParams.sessid

        $scope.currentPage = 1; //current page
        $scope.maxSize = 10; //pagination max size
        $scope.entryLimit = 5; //max rows for data table
        // http://new.slide-atlas.org/apiv1/5074589302e31023d4292d91/sessions/4ecbbc6d0e6f7d7a56000000 
        $http({method: "get", url: "/apiv1/" + $scope.dbid + "/sessions/" + $scope.sessid}).
            success(function(data, status) {
                    $scope.session = data;
            }).
            error(function(data, status) {
                $scope.session = [];
            });

        $scope.deletefile = function(idx)
        {
        alert("Asked to delete attachment " + JSON.stringify($scope.session.attachments[idx]));
        // Locate the object
        // var attach = $scope.session.attachments[idx]
        // console.log(attach)
        // if (confirm("Remove attachment " + attach.details.name + '?'))
        //     {
        //     SessionItem.delete({dbid:$scope.dbid, sessid: $scope.sessid, restype:"attachments", resid: attach.ref},
        //         function(data) {
        //             Session.get({dbid: $routeParams.dbid, sessid: $routeParams.sessid}, function(data)
        //                 {
        //                 $scope.session = data
        //                 });
        //         });
        //     }
        }


    // /* init pagination with $scope.list */
    // $scope.noOfPages = Math.ceil($scope.list.length/$scope.entryLimit);
    
    // $scope.$watch('search', function(term) {
    //     // Create $scope.filtered and then calculat $scope.noOfPages, no racing!
    //     $scope.filtered = filterFilter($scope.list, term);
    //     $scope.noOfPages = Math.ceil($scope.filtered.length/$scope.entryLimit);
    // });

    });

/******************************************************************************/
app.controller("dbListCtrl", function ($scope, $http) {
    console.log("Refreshing DBListCtrl")

    $http({method: "get", url: "/apiv1/databases"}).
        success(function(data, status) {
                $scope.databases = data.databases;
        }).
        error(function(data, status) {
            $scope.databases = [];
        });

    $scope.delete = function(idx) {
        var db_to_delete = $scope.databases[idx];
        if (confirm("Remove database (" + db_to_delete.dbname + ") " + db_to_delete.label +'?')) {
            // Locate the object
            $http({method: "delete", url: "/apiv1/databases/" + db_to_delete._id}).
                success(function(data, status) {
                    $scope.databases.splice(idx, 1);
                }).
                error(function(data, status) {
                    alert("Error deleting ..");
                });
        }
    }
});

// app.controller("SessListCtrl", function ($scope, Session, $location, Data) {

//     console.log("Refreshing SessListCtrl")

//     Session.get({dbid: '507619bb0a3ee10434ae0827'}, function(data) {
//         Data.setList(data.sessions);
//         $scope.sessions = Data.getList();
//         }
//     );

//     // $scope.delete = function(idx)
//     //     {
//     //     // Locate the object
//     //     var db = Data.getItem(idx)
//     //     console.log(db)
//     //     if (confirm("Remove database " + db.dbname + '?'))
//     //         {
//     //         Database.delete({dbid:db._id}, function(data) {
//     //             Data.removeItem(idx);
//     //             $location.path("/databases");
//     //             });
//     //         }
//     //     };
// });


app.controller("UserListCtrl", function ($scope, User, $location, Data, $filter) {
        console.log("Refreshing UserListCtrl");

        $scope.areAllSelected = false;
        $scope.users = [];

        User.get({dbid: '507619bb0a3ee10434ae0827'}, function(data) {
                Data.setList(data.users);
                $scope.users = Data.getList();
                $scope.filtered_users = $scope.users;
                //$scope.onAllSelected()
           });

        $scope.onAllSelected = function() {
            for( var i =0;i < $scope.filtered_users.length;i++){
                $scope.filtered_users[i].isSelected = $scope.areAllSelected;
                }
        };

        $scope.$watch('query',function(val){
            console.log($scope.query)
            $scope.filtered_users = $filter('filter')($scope.users, $scope.query);
            console.log($scope.filtered_users.length)
        });

    });

app.factory('Role', function($resource) {
    return $resource('rules/:id', {id:'@_id'},
                 {
            query: { method: 'GET', params: {}, isArray: false },
            update:{ method: 'PUT'}
              });
  });


app.controller("RoleListCtrl", function ($scope, Role, $location, Data, $filter) {
        console.log("Refreshing RoleListCtrl + " +  $scope.dbid);

        Role.get({}, function(data) {
                Data.setList(data.rules);
                roles = []

                for(var i=0; i < data.rules.length; i ++) {
                    if(data.rules[i].db == $scope.dbid) {
                        roles.push(data.rules[i])
                    }
                }

                $scope.roles = roles;
           });

        $scope.$watch('query',function(val){
            //$scope.filtered_users = $filter('filter')($scope.users, $scope.query);
        });

    });

app.controller("RoleEditCtrl", function ($scope, Role, $routeParams, $location, Data, $filter, $http, $modal) {

        var items = Data.getList();
        var role = Data.getItem($routeParams.idx);

        $http({method: "get", url: "/apiv1/users"}).
            success(function(data, status) {
                    $scope.users = data.users;
            }).
            error(function(data, status) {
                $scope.users = [];
            });

        if(typeof role === 'undefined')
            {
//            alert("Item not found for editing");
            $location.path("/roles") ;
            return;
            }

        $scope.role = Role.get({id:role._id}, function() {
            if(!$scope.role.hasOwnProperty("can_admin")) {
                $scope.role.can_admin = [];
            }
            if(!$scope.role.hasOwnProperty("can_admin_all")) {
                $scope.role.can_admin_all = false;
            }
            if(!$scope.role.hasOwnProperty("users")) {
                $scope.role.users = [];
            }

            $http({method: "get", url: "/apiv1/rules/" + role._id + "/users"}).
            success(function(data, status) {
                    $scope.role.users = data.users;
            }).
            error(function(data, status) {
                $scope.role.users = [];
            });

        });

        $scope.grant = function () {

            var modalInstance = $modal.open({
              templateUrl: 'userSelectModal.html',
              controller: "ModalInstanceCtrl",
              resolve: {
                items: function () {
                  return $scope.users;
                },
                selected : function () {

                    return _.pluck($scope.role.users,"_id");
                }
              }
            });

            modalInstance.result.then(function (selectedItem) {
              alert("Selected: " + selectedItem);
              $scope.selected = selectedItem;
            }, function () {
              console.log('Modal dismissed at: ' + new Date());
            });
        };

        $scope.save = function () {
            $scope.role.$update({id:$scope.role._id}, function(data){
                $location.path("/roles");
            });
        }
    });

app.controller("ModalInstanceCtrl", function ($scope, $modalInstance, items, selected) {

  $scope.items = items;
  $scope.selected = selected;

  $scope.toggle = function(id) {

      if (_.contains($scope.selected,id )){
        // Revoke
        console.log("Revoking:" + id);
        $http({method: "post", url: "/apiv1/rules/" + $scope.role._id + "/users"}, payload={"revoke" : id}).
            success(function(data, status) {
                    console.log("Succsess in revoked");
                    $scope.selected = _.without($scope.selected, id);
            }).
            error(function(data, status) {
                console.log("Error in revoke");
            });


      }
      else {
        // Grant
        console.log("Granting:" + id);
        $scope.selected.push(id);
      }
  };

  $scope.classof = function(item) {
      if(_.contains($scope.selected, item._id)) {
          return "success";
      }
      return "";
  };

  $scope.ok = function () {
    $modalInstance.close($scope.selected);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});

