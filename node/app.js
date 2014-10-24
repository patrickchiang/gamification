var express = require('express');
var mysql = require('mysql');
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var bodyParser = require('body-parser');

var app = express();
var mysql_config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'node',
    multipleStatements: true
};

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(session({
    secret: 'patrick is the best as always',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use('local-user', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'pass'
    },
    function (username, password, done) {
        var sql = "SELECT * FROM users WHERE email = ?;";
        var insert = [username];
        sql = mysql.format(sql, insert);

        var connection = mysql.createConnection(mysql_config);
        connection.connect();
        connection.query(sql, function (err, results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
                if (results == null || results[0] == null)
                    return done(null, false);
                if (bcrypt.compareSync(password, results[0].password)) {
                    var user = results[0];
                    return done(null, {
                        user_id: user.user_id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email
                    });
                }
                return done(null, false);
            }
            return done(null, false);
        });
        connection.end();
    }
));

passport.use('local-admin', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'pass'
    },
    function (username, password, done) {
        var sql = "SELECT * FROM users WHERE email = ?;";
        var insert = [username];
        sql = mysql.format(sql, insert);

        var connection = mysql.createConnection(mysql_config);
        connection.connect();
        connection.query(sql, function (err, results) {
            if (err) {
                console.log(err);
            } else {
                console.log(results);
                if (results == null || results[0] == null)
                    return done(null, false);
                if (results[0].user_type == 'admin' && bcrypt.compareSync(password, results[0].password)) {
                    var user = results[0];
                    return done(null, {
                        user_id: user.user_id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        user_type: 'admin'
                    });
                }
                return done(null, false);
            }
            return done(null, false);
        });
        connection.end();
    }
));

app.get('/', function (req, res, next) {
    if (!req.user) {
        res.redirect('/login.html');
    } else {
        res.redirect('/index.html');
    }
});

app.get('/index.html', ensureAuthenticated, function (req, res) {
    res.sendFile(__dirname + '/site/index.html');
});

app.get('/problem.html', ensureAuthenticated, function (req, res) {
    res.sendFile(__dirname + '/site/problem.html');
});

app.post('/login', passport.authenticate('local-user'), function (req, res) {
    res.json(req.user);
});

app.get('/admin', function (req, res) {
    res.sendFile(__dirname + '/site/admin.html');
});

app.post('/login-admin', passport.authenticate('local-admin'), function (req, res) {
    res.json(req.user);
});

app.post('/register', function (req, res) {
    var sql = "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?);";
    var insert = [req.body.first, req.body.last, req.body.email, bcrypt.hashSync(req.body.pass)];
    sql = mysql.format(sql, insert);

    var connection = mysql.createConnection(mysql_config);
    connection.connect();
    connection.query(sql, function (err, results) {
        if (err) {
            res.json(err);
        }
        else {
            passport.authenticate('local-user')(req, res, function () {
                res.redirect('/');
            }); //TODO: async npm
        }
    });
    connection.end();
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login.html');
});

app.get('/getScoreboard', ensureAuthenticated, function (req, res) {
    var sql = "SELECT count(*) AS complete FROM users_problems WHERE user_id = ? AND solution_state = 'Complete'; "
        + "SELECT count(*) AS inprogress FROM users_problems WHERE user_id = ? AND solution_state = 'In Progress'; "
        + "SELECT SUM(p.problem_points) AS points, u.user_id FROM users_problems u JOIN problems p "
        + "ON u.problem_id = p.problem_id WHERE solution_state = 'Complete' GROUP BY u.user_id DESC;"
        + "SELECT COUNT(*) AS total FROM users;";
    var insert = [req.user.user_id, req.user.user_id];
    sql = mysql.format(sql, insert);

    var connection = mysql.createConnection(mysql_config);
    connection.connect();
    connection.query(sql, function (err, results) {
        var sortedRanks = results[2].sort(rank);
        res.json({
            completed: results[0][0].complete || 0,
            progress: results[1][0].inprogress || 0,
            points: getPoints(sortedRanks, req.user.user_id),
            rank: getRank(sortedRanks, req.user.user_id, results[3][0].total),
            totalRank: results[3][0].total,
            name: req.user.first_name + ' ' + req.user.last_name
        });
    });
    connection.end();

});

function getPoints(arr, user_id) {
    for (var i = 0; i < arr.length; i++) {
        if (user_id == arr[i].user_id) {
            return arr[i].points;
        }
    }
    return 0;
}

function getRank(arr, user_id, alt) {
    for (var i = 0; i < arr.length; i++) {
        if (user_id == arr[i].user_id) {
            return i + 1;
        }
    }
    return alt;
}

function rank(a, b) {
    if (a.points < b.points)
        return -1;
    if (a.points > b.points)
        return 1;
    return 0;
}


app.get('/getAllProblemProgress', ensureAuthenticated, function (req, res) {

    var sql = "select p.problem_id, p.problem_name, u.solution_state FROM problems p JOIN users_problems u "
        + "ON p.problem_id = u.problem_id WHERE u.user_id = ?; "
        + "select p.problem_id, p.problem_name, p.problem_points, p.problem_type from problems p;";
    var insert = [req.user.user_id];
    sql = mysql.format(sql, insert);

    var connection = mysql.createConnection(mysql_config);
    connection.connect();
    connection.query(sql, function (err, results) {
        var started = results[0];
        var all = results[1];
        var aggregate = [];

        for (var i = 0; i < all.length; i++) {
            for (var j = 0; j < started.length; j++) {
                if (all[i].problem_id == started[j].problem_id) {
                    aggregate.push(merge_options(all[i], started[j]));
                    break;
                }
            }
            if (aggregate.length != i + 1) {
                aggregate.push(all[i]);
            }
        }

        res.json(aggregate);
    });
    connection.end();
});

function merge_options(obj1, obj2) {
    var obj3 = {};
    for (var attrname in obj1) {
        obj3[attrname] = obj1[attrname];
    }
    for (var attrname in obj2) {
        obj3[attrname] = obj2[attrname];
    }
    return obj3;
}

app.get('/getProblemByID', ensureAuthenticated, function (req, res) {
    var sql = "select * FROM problems p JOIN users_problems u ON p.problem_id = u.problem_id WHERE p.problem_id = ? AND u.user_id = ?;";
    var insert = [req.query.id, req.user.user_id];
    sql = mysql.format(sql, insert);

    var connection = mysql.createConnection(mysql_config);
    connection.connect();
    connection.query(sql, function (err, results) {
        if (results[0] != null)
            res.json(results[0]);
        else
            res.json({});
    });
    connection.end();
});

app.get('/getProblemNumberRange', ensureAuthenticated, function (req, res) {
    var sql = "SELECT problem_id FROM problems WHERE problem_id > ? AND problem_type = ? ORDER BY problem_id ASC LIMIT 1; "
        + "SELECT problem_id FROM problems WHERE problem_id < ? AND problem_type = ? ORDER BY problem_id DESC LIMIT 1;";
    var insert = [req.query.id, req.query.type, req.query.id, req.query.type];
    sql = mysql.format(sql, insert);

    var connection = mysql.createConnection(mysql_config);
    connection.connect();
    connection.query(sql, function (err, results) {
        var previous = 0, next = 0;
        if (results[0] != null && results[0][0] != null)
            next = results[0][0].problem_id;
        if (results[1] != null && results[1][0] != null)
            previous = results[1][0].problem_id;

        if (next == 0 && previous == 0)
            res.status(404).send('Sorry, we cannot find that problem!');
        else {
            res.json({
                previous: previous,
                next: next
            });
        }
    });
    connection.end();
});

app.post('/putSolution', ensureAuthenticated, function (req, res) {
    var sql = "UPDATE users_problems SET solution = ?, solution_state = ? WHERE user_id = ? AND problem_id = ?;";
    var insert = [req.body.solution, req.body.solution_state, req.user.user_id, req.query.id];
    sql = mysql.format(sql, insert);

    console.log(sql);
    var connection = mysql.createConnection(mysql_config);
    connection.connect();
    connection.query(sql, function (err, results) {
        if (results[0] != null)
            res.json(results[0]);
        else
            res.json({});
    });
    connection.end();
});

app.post('/putProblem', ensureAuthenticated, function (req, res) {
    var sql = "INSERT IGNORE INTO users_problems (user_id, problem_id, solution_state, solution) VALUES (?, ?, 'In Progress', '');";
    var insert = [req.user.user_id, req.query.id];
    sql = mysql.format(sql, insert);

    var connection = mysql.createConnection(mysql_config);
    connection.connect();
    connection.query(sql, function (err, results) {
        if (results != null)
            res.json(results[0]);
        else
            res.status(404).send('Sorry, we cannot find that problem!');
    });
    connection.end();
});


app.get('/create', ensureAdmin, function (req, res) {
    fs.readFile(__dirname + '/creation.sql', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        console.log('Creating database: ' + data);

        var connection = mysql.createConnection(mysql_config);
        connection.connect();
        connection.query(data, function (err, results) {
            res.json(results);
        });
        connection.end();
    });
});

app.get('/init', ensureAdmin, function (req, res) {
    fs.readFile(__dirname + '/init.sql', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        console.log('Initializing database: ' + data);

        var connection = mysql.createConnection(mysql_config);
        connection.connect();
        connection.query(data, function (err, results) {
            res.json(results);
        });
        connection.end();
    });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login.html');
}

function ensureAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.user_type == 'admin') {
        return next();
    }
    res.redirect('/admin.html');
}

app.use('/', express.static(__dirname + '/site'));

var server = app.listen(3000, 'localhost', function () {
    console.log('Listening on port %d', server.address().port);
});