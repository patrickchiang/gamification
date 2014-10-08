var express = require('express');
var mysql = require('mysql');
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var app = express();

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'pass'
    },
    function (username, password, done) {
        var sql = "SELECT * FROM users WHERE email = ?";
        var insert = [username];
        sql = mysql.format(sql, insert);

        var connection = mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'root',
            database: 'node'
        });

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

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});


var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', express.static(__dirname + '/site'));

app.post('/login', passport.authenticate('local'), function (req, res) {
    res.jsonp(req.user);
});

app.get('/logout', function (req, res) {
    req.logout();
});

app.get('/user/:id', function (req, res) {
    var sql = "SELECT user_id, first_name, last_name, email FROM users WHERE user_id = ?";
    var insert = [req.params.id];
    sql = mysql.format(sql, insert);

    mysql_query(sql, res, false);
});

app.get('/users', function (req, res) {
    var sql = "SELECT user_id, first_name, last_name, email FROM users";
    var insert = [req.params.id];
    sql = mysql.format(sql, insert);

    mysql_query(sql, res, false);
});

app.post('/users', function (req, res) {
    var sql = "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?);";
    var password = req.param('password');
    var hash = bcrypt.hashSync(password);
    var insert = [req.param('first_name'), req.param('last_name'), req.param('email'), hash];
    sql = mysql.format(sql, insert);

    mysql_query(sql, res, false);
});

app.get('/create', function (req, res) {
    fs.readFile('creation.sql', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        console.log('Creating database: ' + data);

        mysql_query(data, res, true);
    });
});

app.get('/init', function (req, res) {
    fs.readFile('init.sql', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        console.log('Initializing database: ' + data);

        mysql_query(data, res, true);
    });
});

function mysql_query(sql, res, unsafe) {
    var connection = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'root',
        database: 'node',
        multipleStatements: unsafe
    });

    connection.connect(function (err) {
        if (err) {
            console.log(err);
        }
    });

    connection.query(sql, function (err, results) {
        if (err) {
            console.log(err);
        } else if (res != null) {
            res.json(results);
        }
    });

    connection.end(function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('SQL query successful.');
        }
    });
}

var server = app.listen(3000, 'localhost', function () {
    console.log('Listening on port %d', server.address().port);
});
