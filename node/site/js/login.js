$(function () {
    $('.register-show').hide();

    $('.register-link').click(registering);
    $('.sign-in-link').click(logging);

    $('.register-btn').click(register);
    $('.sign-in-btn').click(signin);
});

function register(event) {
    event.preventDefault();

    var email = $('input[name="email"]').val();
    var pass = $('input[name="pass"]').val();
    var first = $('input[name="first"]').val();
    var last = $('input[name="last"]').val();

    var payload = {email: email, pass: pass, first: first, last: last};

    $.post("http://localhost:3000/register", payload)
        .done(function (data) {
            alert("Data Loaded: " + data);
        });
}

function signin(event) {
    event.preventDefault();

    var email = $('input[name="email"]').val();
    var pass = $('input[name="pass"]').val();

    var payload = {email: email, pass: pass};

    $.ajax({
        type: 'POST',
        url: '/login',
        data: payload,
        success: function (data) {
            alert("Data Loaded: " + JSON.stringify(data));
        },
        statusCode: {
            400: function () {
                alert('fill things in');
            },

            401: function () {
                alert('fill things in correctly');
            }
        }
    });
}

function registering(event) {
    $('.register-link').unbind('click');

    event.preventDefault();
    $('.register-show').slideDown();
    $('.sign-in-btn').removeClass('sign-in-btn').addClass('register-btn').html('Register');
    $('.register-link').removeClass('register-link').addClass('sign-in-link').html('Back to Sign In');
    $('h1').html('Register');

    $('.sign-in-link').click(logging);
}

function logging(event) {
    $('.sign-in-link').unbind('click');

    event.preventDefault();
    $('.register-show').slideUp();
    $('.register-btn').removeClass('register-btn').addClass('sign-in-btn').html('Sign In');
    $('.sign-in-link').removeClass('sign-in-link').addClass('register-link').html('Register');
    $('h1').html('Login');
    $('form').attr('action', 'http://localhost:3000/login');

    $('.register-link').click(registering);
}