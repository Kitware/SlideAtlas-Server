/**
 * @author dhanannjay.deo
 */
 
 var app = angular.module('adminapi',["ngResource" ]).
    config(
     function ($routeProvider) {
        $routeProvider.when("/databases", {templateUrl: "/apiv1/static/partials/dblist.html"});
        $routeProvider.when("/databases/new", {templateUrl: "/apiv1/static/partials/dbnew.html", controller:"DBNewCtrl"});
        $routeProvider.when("/databases/edit/:idx", {templateUrl: "/apiv1/static/partials/dbnew.html", controller:"DBEditCtrl"});
        $routeProvider.when("/databases/delete/:idx", {templateUrl: "/apiv1/static/partials/confirm.html", controller:"DBDeleteCtrl"});

        $routeProvider.when("/users", {templateUrl: "/apiv1/static/partials/userlist.html"});
        $routeProvider.when("/users/new", {templateUrl: "/apiv1/static/partials/usernew.html"});

        $routeProvider.when("/sessions", {templateUrl: "/apiv1/static/partials/sesslist.html"});
        $routeProvider.when("/sessions/new", {templateUrl: "/apiv1/static/partials/dbnew.html", controller:"DBNewCtrl"});

        $routeProvider.otherwise({ redirectTo: "/"});
    });

app.factory('Database', function($resource) {
    return $resource('databases/:dbid', {dbid:'@_id'}, 
                 {
            query: { method: 'GET', params: {}, isArray: false },
            update:{ method: 'PUT'}
              });
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
    }
    
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
            $location.path("#/databases") ;
            return;
            }

        console.log(db)

        $scope.database = Database.get({dbid:db._id})
        
        $scope.save = function () {
            $scope.database.$update({dbid:$scope.database._id}, function(data){
                $location.path("#/databases");
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
                $location.path("#/databases")
            });
            }
    });


app.controller("DBListCtrl", function ($scope, Database, $location, Data)
    {
    // console.log("Refreshing DBListCtrl")
        
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
            Database.delete({dbid:db._id}, function() {
                $location.path("#/databases");
                });
            }
        }
    });
    
