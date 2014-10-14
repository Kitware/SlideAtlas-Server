'use strict';
var module = angular.module('SlideAtlas.resources', [
    'ngResource'
]);

module.factory('User', function ($resource) {
    return $resource('/api/v2/users/:_id');
});

module.factory('Group', function ($resource) {
    return $resource('/api/v2/groups/:_id');
});
