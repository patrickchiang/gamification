app.controller('IndexController', ['$scope', '$http', function ($scope, $http) {
    var init = function () {
        var httpProblems = $http.get("/getAllProblemProgress?id=1");

        httpProblems.success(function (data, status, headers, config) {
            console.log(data);
            $scope.html_problems = data;
        });
        httpProblems.error(function (data, status, headers, config) {
            console.log('Server error');
        });

        var cssProblems = $http.get("/getAllProblemProgress?id=2");

        cssProblems.success(function (data, status, headers, config) {
            $scope.css_problems = data;
        });
        cssProblems.error(function (data, status, headers, config) {
            console.log('Server error');
        });

        var jsProblems = $http.get("/getAllProblemProgress?id=3");

        jsProblems.success(function (data, status, headers, config) {
            $scope.js_problems = data;
        });
        jsProblems.error(function (data, status, headers, config) {
            console.log('Server error');
        });
    }
    init();
}]);