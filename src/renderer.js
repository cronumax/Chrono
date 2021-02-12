

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
    data:"signin"
  })
})

$('#switch-singup').click(function() {
  window.postMessage({
    myTypeField: 'switch-message',
    data:"signup"
  })
})
