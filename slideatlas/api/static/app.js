/**
 * @author dhanannjay.deo
 */
 
 var app = angular.module('adminapi',["ngResource" ]).
    config(
     function ($routeProvider) {
        $routeProvider.when("/databases", {templateUrl: "/apiv1/static/partials/dbList.html"});
        $routeProvider.when("/databases/new", {templateUrl: "/apiv1/static/partials/dbnew.html", controller:"DBNewCtrl"});
        $routeProvider.when("/databases/edit/:idx", {templateUrl: "/apiv1/static/partials/dbnew.html", controller:"DBEditCtrl"});
        $routeProvider.when("/databases/details/:idx", {templateUrl: "/apiv1/static/partials/dbnew.html", controller:"DBEditCtrl"});
        // $routeProvider.when("/databases/delete/:idx", {templateUrl: "/apiv1/static/partials/confirm.html", controller:"DBDeleteCtrl"});

        $routeProvider.when("/users", {templateUrl: "/apiv1/static/partials/userlist.html"});
        $routeProvider.when("/users/new", {templateUrl: "/apiv1/static/partials/usernew.html"});

        $routeProvider.when("/:dbid/sessions", {templateUrl: "/apiv1/static/partials/dbDetails.html"});
        $routeProvider.when("/:dbid/sessions/:sessid", {templateUrl: "/apiv1/static/partials/sessDetails.html"});
        $routeProvider.when("/:dbid/sessions/:sessid/:type/new", {templateUrl: "/apiv1/static/partials/fileUpload.html", controller:"fileUploadCtrl"});

        $routeProvider.when("/sessions", {templateUrl: "/apiv1/static/partials/sesslist.html"});
        $routeProvider.when("/sessions/new", {templateUrl: "/apiv1/static/partials/sessnew.html", controller:"SessNewCtrl"});

        $routeProvider.otherwise({ redirectTo: "/"});
    });

app.factory('Database', function($resource) {
    return $resource('databases/:dbid', {dbid:'@_id'}, 
                 {
            query: { method: 'GET', params: {}, isArray: false },
            update:{ method: 'PUT'}
              });
  });

app.factory('Session', function($resource) {
    return $resource('/apiv1/:dbid/sessions/:sessid', {dbid:'@dbid', sessid:'@sessid'}, 
                 {
            query: { method: 'GET', params: {}, isArray: true },
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

app.controller("DBEditCtrl", function ($scope, $location, $routeParams, Database, Data)
    {
        // console.log("Refreshing edit")
        // Locate the object
        var dbs = Data.getList()
        
        // for(adb in dbs)
        // { console.log(dbs[adb]);}
        
        var db = Data.getItem($routeParams.idx);
        if(typeof db === 'undefined')
            {
            alert("Item not found for editing");
            $location.path("/databases") ;
            return;
            }

        console.log(db)

        $scope.database = Database.get({dbid:db._id})
        
        $scope.save = function () {
            $scope.database.$update({dbid:$scope.database._id}, function(data){
                $location.path("/databases");
                }
                ); 
        }
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
        Session.get({dbid: $routeParams.dbid}, function(data) {
            Data.setList(data.sessions);
            $scope.sessions = Data.getList();
            }
        );
        
        $scope.deletesession = function(idx) 
        {
        // Locate the object
        var sess = $scope.sessions[idx]
        if (confirm("Remove attachment " + sess.label + '?')) 
            {
            //SessionItem.delete({dbid:$scope.dbid, sessid: $scope.sessid, restype:"attachments", resid: attach.ref}, 
            //    function(data) {
            //        Session.get({dbid: $routeParams.dbid, sessid: $routeParams.sessid}, function(data) 
            //            {
            //            $scope.session = data
            //            });
            //    });
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
            var urlstr = "/apiv1/" + $routeParams.dbid + "/sessions/"  + $routeParams.sessid + "/attachments";
            var _id = ""
            get_id = function (){
                return _id;
            };
            console.log("Getting executed");
            console.log("Refreshing fileUploadCtrl with dbid=" + $routeParams.dbid + " and ssid=" + $routeParams.sessid + " and type=" + $routeParams.type )
                $('#fileupload').fileupload({
                    type:'PUT',
                    url: urlstr + get_id(),
                    dataType: 'json',
                    maxChunkSize: 1048576, // 10 MB
                    add: function (e, data) {
                        $('#status').text('Uploading...');
                        data.submit();
                    },
                    submit: function(e,data) {
                        var $this = $(this);
                        $.post(urlstr, {"insert" : 1 },
                            function (result) 
                                {
                                data.formData = result; // e.g. {id: 123}
                                _id = result._id
                                //var that = $(this).data('fileupload');
                                $this.fileupload('option','url', urlstr + "/"+ _id);
                                $this.fileupload('send', data);
                            });
                        return false;
                    },       
                    fail: function (e, data) {
                        $('#status').text('Upload failed ...');
                        var progress = 0;
                        $('#progress .bar').css(
                            'width',
                            progress + '%'
                        );
                    },
            
                    done: function (e, data) {
                        $("status").text('Upload finished.');
                    },
                    progressall: function (e, data) {
                        var progress = parseInt(data.loaded / data.total * 100, 10);
                        $('#status').text("Progress = " + progress / 2.0+ '%');
                        $('#progress .bar').css(
                            'width',
                            progress + '%'
                        );
                    }
                });
        });
        
        //Session.get({dbid: $routeParams.dbid}, function(data) {
        //    Data.setList(data.sessions);
        //    $scope.sessions = Data.getList();
        //    }
        //);
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

app.controller("sessDetailsCtrl", function ($scope, $location, $routeParams, Database, Data, Session, SessionItem)
    {   
        // For modifying session as a whole  
        // Locate the object
        console.log("Refreshing sessDetailsCtrl with dbid=" + $routeParams.dbid + " and sessid =" + $routeParams.sessid)
        $scope.dbid = $routeParams.dbid
        $scope.sessid = $routeParams.sessid
        
        Session.get({dbid: $routeParams.dbid, sessid: $routeParams.sessid}, function(data) {
           $scope.session = data
           }
        );
        
        $scope.deletefile = function(idx) 
        {
        // Locate the object
        var attach = $scope.session.attachments[idx]
        console.log(attach)
        if (confirm("Remove attachment " + attach.details.name + '?')) 
            {
            SessionItem.delete({dbid:$scope.dbid, sessid: $scope.sessid, restype:"attachments", resid: attach.ref}, 
                function(data) {
                    Session.get({dbid: $routeParams.dbid, sessid: $routeParams.sessid}, function(data) 
                        {
                        $scope.session = data
                        });
                });
            }
        }
    });


app.controller("dbListCtrl", function ($scope, Database, $location, Data)
    {
    console.log("Refreshing DBListCtrl")

    Database.get({}, function(data) {
        Data.setList(data.databases);
        $scope.databases = Data.getList();
        }
    );
    
    $scope.delete = function(idx) 
        {
        // Locate the object
        var db = Data.getItem(idx) 
        console.log(db)
        if (confirm("Remove database " + db.dbname + '?')) 
            {
            Database.delete({dbid:db._id}, function(data) {
                Data.removeItem(idx);
                $location.path("/databases");
                });
            }
        }
    });

app.controller("SessListCtrl", function ($scope, Session, $location, Data)
    {
    console.log("Refreshing SessListCtrl")

    Session.get({dbid: '507619bb0a3ee10434ae0827'}, function(data) {
        Data.setList(data.sessions);
        $scope.sessions = Data.getList();
        }
    );
    
    // $scope.delete = function(idx) 
    //     {
    //     // Locate the object
    //     var db = Data.getItem(idx) 
    //     console.log(db)
    //     if (confirm("Remove database " + db.dbname + '?')) 
    //         {
    //         Database.delete({dbid:db._id}, function(data) {
    //             Data.removeItem(idx);
    //             $location.path("/databases");
    //             });
    //         }
    //     };
    });
    

