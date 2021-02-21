$('#record').click(function() {
  window.postMessage({
    myTypeField: 'my-custom-message',
    data: 'Record btn clicked'
  })
})

$('#login-form-submit').click(function() {
  const loginForm = document.getElementById("login-form");
  window.postMessage({
    myTypeField: 'login-message',
    data: {
      email: loginForm.email.value,
      password: loginForm.password.value,
      _csrf: loginForm._csrf.value
    }
  })
})

$('#signup-form-submit').click(function() {
  const signupForm = document.getElementById("signup-form");
  window.postMessage({
    myTypeField: 'signup-message',
    data: {
      email: signupForm.email.value,
      password: signupForm.password.value,
      _csrf: signupForm._csrf.value
    }
  })
})

$('#logout').click(function() {
  window.postMessage({
    myTypeField: 'logout-message',
    data: "logout btn pressed"
  })
})

$('#switch-singin').click(function() {
  window.postMessage({
    myTypeField: 'switch-message',
    data: "signin"
  })
})

$('#switch-singup').click(function() {
  window.postMessage({
    myTypeField: 'switch-message',
    data: "signup"
  })
})


$('#resetPassword').click(function() {
  const loginForm = document.getElementById("login-form");
  window.postMessage({
    myTypeField: 'resetPassword-message',
    data:{
      email: loginForm.email.value,
      password: loginForm.password.value,
      _csrf: loginForm._csrf.value
    }
  })
})

$('#reset-form-submit').click(function() {
  const resetForm = document.getElementById("reset-form");
  window.postMessage({
    myTypeField: 'resetForm-message',
    data:{
      email: resetForm.email.value,
      password: resetForm.password.value,
      _csrf: resetForm._csrf.value
    }
  })
})

$(document).on('click', 'body *', function(event) {
  // Deselect btns
  $('.nav-button.is-selected').removeClass('is-selected')

  // Highlight clicked button and show view
  event.target.classList.add('is-selected')
})

$('.js-nav').addClass('is-shown')

$('.js-content').addClass('is-shown')

// Default active menu item
$('#button-windows').click()
