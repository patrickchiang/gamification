app.controller('IndexController', ['$scope', '$http', function ($scope, $http) {
    var init = function () {
        var httpProblems = $http.get("/getAllProblemProgress");

        httpProblems.success(function (data, status, headers, config) {
            console.log(data);
            $scope.problems = data;
        });
        httpProblems.error(function (data, status, headers, config) {
            console.log('Server error');
        });
    }
    init();
}]);