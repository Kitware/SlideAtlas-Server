/**
 * @author dhanannjay.deo
 */
 
 angular.module('adminapi',[]).config(
     function ($routeProvider) {
        $routeProvider.when("/", {templateUrl: "/apiv1/static/partials/dblist.html"})
        $routeProvider.when("/new", {templateUrl: "/apiv1/static/partials/dbedit.html"})
    })
 
function DBListCtrl($scope)
    {
    $scope. databases = [ 
        {
            "_id" : "5074589002e31023d4292d83",
            "copyright" : "Copyright &copy; 2011-12, Charles Palmer, Beverly Faulkner-Jones and Su-jean Seo. All rights reserved.",
            "dbname" : "bev1",
            "host" : "slide-atlas.org",
            "label" : "Harvard Combined Dermatology Residency Training Program",
            "users" : [
                    {
                            "username" : "DX0",
                            "created_at" :  "2012-10-16T21:40:58.158Z",
                            "db" : "bev1",
                            "created_by" :  "507db8bf8af4a5e2a18d7081",
                            "host" : "slide-atlas.org",
                            "version" : 11,
                            "password" : "6QUF7T"
                    }
            ]
    },
    {
            "_id" : "507f34a902e31010bcdb1366",
            "copyright" : "Copyright &copy 2011-2012, BIDMC Pathology. All rights reserved",
            "dbname" : "bidmc1",
            "host" : "slide-atlas.org",
            "label" : "BIDMC Pathology",
            "users" : [
                    {
                            "username" : "6KI",
                            "created_at" :  "2012-10-17T22:49:35.450Z",
                            "db" : "bidmc1",
                            "created_by" :  "507db8bf8af4a5e2a18d7081",
                            "host" : "slide-atlas.org",
                            "version" : 11,
                            "password" : "1ITNJU"
                    }
            ]
    }, 
    {
            "_id" : "507f34a902e31010bcdb1367",
            "copyright" : "Copyright &copy 2012, Risa Kawai. All rights reserved.",
            "dbname" : "kawai1",
            "host" : "slide-atlas.org",
            "label" : "Risa Kawai",
            "users" : [
                    {
                            "username" : "O7T",
                            "created_at" :  "2012-10-17T22:49:56.882Z",
                            "db" : "kawai1",
                            "created_by" :  "507db8bf8af4a5e2a18d7081",
                            "host" : "slide-atlas.org",
                            "version" : 11,
                            "password" : "OOE3YZ"
                    }
            ]
    }
    ];
}