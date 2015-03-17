'use strict';
var module = angular.module('SlideAtlas.search', [
    'ui.bootstrap',
    'SlideAtlas.resources'
]);

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

    $scope.updateSearch = function(term) {
        console.log("Searching :" + term);
        $scope.query = term;
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
