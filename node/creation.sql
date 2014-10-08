DROP DATABASE IF EXISTS node;

CREATE DATABASE node;

USE node;

CREATE TABLE users
(
user_id int NOT NULL AUTO_INCREMENT,
first_name varchar(32) NOT NULL,
last_name varchar(32) NOT NULL,
email varchar(128) NOT NULL,
password varchar(128) NOT NULL,
PRIMARY KEY (user_id)
);

CREATE TABLE problems
(
problem_id int NOT NULL AUTO_INCREMENT,
problem_name varchar(32) NOT NULL,
problem_text varchar(2048),
problem_points int NOT NULL,
PRIMARY KEY (problem_id)
);

CREATE TABLE users_problems
(
user_id int NOT NULL,
problem_id int NOT NULL,
solution_state int NOT NULL,
solution text,
PRIMARY KEY (user_id, problem_id),
FOREIGN KEY (user_id) REFERENCES users(user_id),
FOREIGN KEY (problem_id) REFERENCES problems(problem_id)
);