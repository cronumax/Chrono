

$('#record').click(function() {
  window.postMessage({
    myTypeField: 'my-custom-message',
    data: 'Record btn clicked'
  })
})


$('#login-form').click(function() {
  const loginForm = document.getElementById("login-form");
  window.postMessage({
    myTypeField: 'login-message',
    data: {
      username: loginForm.username.value,
      password: loginForm.password.value,
      _csrf: loginForm._csrf.value
    }
  })

})
