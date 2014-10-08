var express = require('express');
var mysql = require('mysql');
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/test', function (req, res) {
    mysql_query('SHOW DATABASES;', res, true);
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
    fs.readFile('creation.sql', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        console.log('Creating database: ' + data);

        mysql_query(data, res, true);
    });
});

app.get('/init', function (req, res) {
    fs.readFile('init.sql', 'utf8', function (err,data) {
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
        } else {
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
