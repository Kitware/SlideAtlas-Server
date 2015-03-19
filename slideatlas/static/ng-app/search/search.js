'use strict';
var module = angular.module('SlideAtlas.search', [
    'ui.bootstrap',
    'SlideAtlas.resources'
]);

module.filter('highlight', function($sce) {
    return function(str, termsToHighlight) {
        if(!str) return '';

        var terms = [];
        termsToHighlight.forEach(function(term) {
            terms.push(term.toLowerCase());
        });

        var colors = ["pink", "lightgreen", "lightblue", "khaki"];

        // Regex to simultaneously replace terms
        var regex = new RegExp('(' + termsToHighlight.join('|').toLowerCase() + ')', 'gi');
        return $sce.trustAsHtml(str.replace(regex, function (x){
             return '<span style="background-color:' + colors[terms.indexOf(x.toLowerCase())] + ';">' + x + '</span>'
        }));
    }
});

module.controller('SearchCtrl', function ($scope, $location, $http, filterFilter) {
    $scope.data = {loaded : false};
    $scope.query = "";
    $scope.roles = [];

    $scope.$watch('query', function ( val ) {
        for(var i=0; i < $scope.roles.length ; i++) {
            $scope.roles[i].filtered = filterFilter($scope.roles[i].sessions, $scope.query);
            $scope.roles[i].isOpen = $scope.roles[i].filtered.length > 0;
        }
    });

    $http({method: "get", url: "/sessions?json=1"})
        .success(function(data, status) {
            $scope.roles = data.sessions;
            $scope.data.loaded = true;
        })
        .error(function(data, status) {
            console.log("Some error occured while loading sessions")
        });

    // Make the query and refresh the contents
    $scope.updateSearch = function(term) {
        if(term) {
            $scope.query=term;
        }
        $http.get("/query", {"params": {"terms" : $scope.query}})
            .success(function(data, status) {
                var dictlist = [];
                for(var id in data.selected_and_accessible_views) {
                    dictlist.push(data.selected_and_accessible_views[id])
                }
                $scope.results = dictlist;
                $scope.resultTree = data.selected_and_accessible_views_in_collections;
                $scope.resultViews = data.selected_and_accessible_views;
            })
            .error(function(data, status) {
                alert("Search query failed")
            });


    };

    $scope.commands = {
        'show me *term': function(term) {
          console.log('Show me: ' + term);
          $scope.$apply($scope.updateSearch(term));
        },
        'hey': function() {
          console.log('hey!')
        }
    };

    annyang.debug();
    annyang.init($scope.commands);
    annyang.start();
});
