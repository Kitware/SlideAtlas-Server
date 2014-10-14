'use strict';
var module = angular.module('SlideAtlas.access', [
    'ui.bootstrap',
    'SlideAtlas.resources'
]);

module.controller('AccessModalCtrl', function ($scope, $modal, $http) {
    $scope.open = function (resourcesType, resourceId) {
        var shareModal = $modal.open({
            templateUrl: '/static/ng-app/access/access-modal.html',
            controller: 'AccessInstanceCtrl',
            resolve: {
                resourceHttp: function () {
                    return $http.get('/api/v2/' + resourcesType + '/' + resourceId);
                },
                accessHttp: function () {
                    return $http.get('/api/v2/' + resourcesType + '/' + resourceId + '/access');
                }
            },
            size: 'lg',
            backdrop: true,
            keyboard: true
        });

        shareModal.result.then(function (accessEntities) {
            $http.put('/api/v2/' + resourcesType + '/' + resourceId + '/access', accessEntities);
        });
    };
});

module.filter('unusedEntityFilter', function () {
    return function (availableEntityList, usedEntityList) {
        var usedEntityIds = {};
        usedEntityList.forEach(function (usedEntity) {
            usedEntityIds[usedEntity._id] = true;
        });

        return availableEntityList.filter(function (availableEntity) {
            return !(usedEntityIds.hasOwnProperty(availableEntity._id));
        });
    };
});

module.controller('AccessInstanceCtrl', function ($scope, $modalInstance, User, Group, resourceHttp, accessHttp) {
    $scope.resource = resourceHttp.data[Object.keys(resourceHttp.data)[0]][0];

    $scope.accessEntities = accessHttp.data;

    $scope.levels = [
        {value: 'view', name: 'Can View'},
        {value: 'edit', name: 'Can Edit'},
        {value: 'admin', name: 'Can Admin'}
    ];

    $scope.availableEntities = {
        users: User.query(),
        groups: Group.query()
    };

    $scope.add = function (entityType, entity) {
        $scope.accessEntities[entityType].push({
            _id: entity._id,
            level: 'view',
            label: entity.label
        });
    };

    $scope.remove = function (entityType, entityIndex) {
        $scope.accessEntities[entityType].splice(entityIndex, 1);
    };

    $scope.save = function () {
        $modalInstance.close(angular.copy($scope.accessEntities));
    };
    $scope.cancel = function () {
        $modalInstance.dismiss();
    };
});
