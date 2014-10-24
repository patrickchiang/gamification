var problem_type;

app.controller('ProblemController', ['$scope', '$sce', '$http', function ($scope, $sce, $http) {
    var number = location.search.replace('?problem=', '');
    if (number == '') {
        window.location.replace('/');
    }

    var problem_range = function () {
        console.log("Problem type: " + problem_type);
        var responsePromise = $http.get("/getProblemNumberRange?id=" + number + "&type=" + problem_type);

        responsePromise.success(function (data, status, headers, config) {
            $scope.range = data;
            console.log(data);
        });
    }

    var new_solution = function () {
        var responsePromise = $http.post("/putSolution?id=" + number, {solution: $scope.coded, solution_state: $scope.solution_state});

        responsePromise.success(function (data, status, headers, config) {
            console.log('Saved solution');
            location.reload();
        });
        responsePromise.error(function (data, status, headers, config) {
            console.log('Cannot save solution to DB');
        });
    };

    var new_problem = function () {
        var responsePromise = $http.post("/putProblem?id=" + number);

        responsePromise.success(function (data, status, headers, config) {
            console.log('Saved problem');
            init();
        });
        responsePromise.error(function (data, status, headers, config) {
            console.log('Cannot save problem to DB');
        });
    };

    var init = function () {
        var responsePromise = $http.get("/getProblemById?id=" + number);

        responsePromise.success(function (data, status, headers, config) {
            if (data.solution_state == null) {
                new_problem();
            }

            $scope.problem_header = data.problem_name;
            $scope.problem_prompt = $sce.trustAsHtml(data.problem_prompt);
            $scope.problem_expected = $sce.trustAsHtml(data.problem_expected);
            $scope.problem_default_before = $sce.trustAsHtml(data.problem_default_before);
            $scope.problem_default_after = $sce.trustAsHtml(data.problem_default_after);
            $scope.points = data.problem_points;
            problem_type  = data.problem_type;

            $scope.coded = data.solution;
            $scope.solution_state = data.solution_state;
            $scope.coded2 = $sce.trustAsHtml($scope.coded);

            if (data.solution_state != "Complete") {
                $('.points').addClass('label-danger');
                $scope.debug = 'debug-danger';
                $scope.debug_text = getDebugText(false);
            } else {
                $('.points').addClass('label-success');
                $scope.debug = 'debug-success';
                $scope.debug_text = getDebugText(true);

            }

            $scope.changeText = function () {
                $scope.coded2 = $sce.trustAsHtml($scope.coded);
            }
            $scope.runTest = function () {
                checker_code = data.problem_check;
                if (eval(checker_code)) {
                    $scope.solution_state = "Complete";
                    $('.points').removeClass('label-danger').addClass('label-success');
                    $scope.debug = 'debug-success';
                    $scope.debug_text = getDebugText(true);
                } else {
                    $scope.solution_state = "In Progress";
                    $('.points').removeClass('label-success').addClass('label-danger');
                    $scope.debug = 'debug-danger';
                    $scope.debug_text = getDebugText(false);
                }

                new_solution();
            }

            problem_range();
        });
        responsePromise.error(function (data, status, headers, config) {
            console.log('Problem does not exist!');
            window.location.replace('/');
        });
    }
    init();
}]);

function getDebugText(good) {
    if (good) {
        return 'Congrats you did it right!';
    } else {
        return 'You can do it!';
    }
}

String.prototype.replaceAll = function (search, replace) {
    if (replace === undefined) {
        return this.toString();
    }
    return this.split(search).join(replace);
}
