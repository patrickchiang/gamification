var app = angular.module('house', ['ngSanitize', 'angular.filter']);

app.controller('ScoreController', ['$scope', '$http', function ($scope, $http) {
    var init = function () {
        var scores_data = $http.get("/getScoreboard");

        scores_data.success(function (data, status, headers, config) {
            console.log(data);
            $scope.scores = data;
        });
        scores_data.error(function (data, status, headers, config) {
            console.log('Server error');
        });
    }
    init();
}]);