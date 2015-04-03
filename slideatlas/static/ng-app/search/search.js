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
    $scope.loading = false;
    $scope.query = "";
    $scope.roles = [];
    $scope.results = [];

    $scope.viewType = "list";

    // Make the query and refresh the contents
    $scope.updateSearch = function(term) {
        if(term) {
            $scope.query=term;
        }
        $scope.loading = true;
        $http.get("/query", {"params": {"terms" : $scope.query}})
            .success(function(data, status) {
                var dictlist = [];
                for(var id in data.selected_and_accessible_views) {
                    dictlist.push(data.selected_and_accessible_views[id])
                }
                $scope.results = dictlist;
                $scope.resultTree = data.selected_and_accessible_views_in_collections;
                $scope.resultViews = data.selected_and_accessible_views;
                $scope.resultSessions = data.selected_and_accessible_sessions;
                $scope.loading = false;
            })
            .error(function(data, status) {
                alert("Search query failed")
            });
    };

    $scope.empty = function(prop){
        return function(item){
          return item[prop].length == 0;
        }
    };


    $scope.makeDataUri = function(aview){
        // Makes a data-uri for macro thumbs if supplied, or else refers
        // to url endpoint
        if(aview.thumbs && aview.thumbs.macro && aview.thumbs.macro.length > 0) {
            return "data:image/jpeg;base64," + aview.thumbs.macro;
        } else {
            return "/viewthumb?viewid=" +aview._id + "&binary=1";
        }
    };

    // $scope.query = 'marmoset';
    $scope.updateSearch($scope.query);

    $scope.visit = function(where, e) {
        window.location = where;
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
    };

    $scope.commands = {
        'show me *term': function(term) {
          console.log('Show me: ' + term);
          $scope.$apply($scope.updateSearch('"' + term + '"'));
        },
        'hey': function() {
          console.log('hey!')
        }
    };

    annyang.debug();
    annyang.init($scope.commands);
    annyang.start();
});
