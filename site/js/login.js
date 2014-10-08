$(function () {
    $('.register-show').hide();

    $('.register-link').click(registering);
    $('.sign-in-link').click(logging);
});

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

    $('.register-link').click(registering);
}