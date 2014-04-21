/**
 * @author dhanannjay.deo
 */

var sessapp = angular.module('tryng',['ui.bootstrap'])
    .controller("SessCtrl", ["$scope", function($scope) {
        $scope.name = "World";
    }]);

sessapp.directive('helloWorld', function () {
        return {
            restrict : "ECMA",
            template: 'some <div> <p>Hello World</p> </div>',
            // replace: true,
            // link: function (scope, iElement, iAttrs) {
            //     console.log(iAttrs.type);
            //     console.log("Getting called !!");
            // }
        };
})

sessapp.directive('fundooRating', function () {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
        console.log("Recognized the fundoo-rating directive usage");
      }
    }});


