'use strict';
var module = angular.module('SlideAtlas.search', [
    'ui.bootstrap',
    'SlideAtlas.resources'
]);

module.controller('SearchCtrl', function ($scope, $location, $http) {
    $scope.data = {loaded : false};

    $http({method: "get", url: "/sessions?json=1"}).
    success(function(data, status) {
        $scope.roles = data.sessions;
        $scope.data.loaded = true;
    }).
    error(function(data, status) {
        console.log("Some error occured while loading sessions")
    });
});
