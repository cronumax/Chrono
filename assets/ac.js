$(window).on('pywebviewready', function() {
  $('.nav-link').click(function() {
    $(this).removeClass('active')
  })

  setTimeout(function() {
    window.pywebview.api.check_app_version().then(res => {
      if (!res['status']) {
        Swal.fire({
          title: 'New Version Available',
          html: res.msg,
          icon: 'warning',
          confirmButtonText: 'Upgrade',
          allowOutsideClick: () => !Swal.isLoading()
        }).then(res => {
          if (res.isConfirmed) {
            window.pywebview.api.upgrade()
            Swal.fire({
              title: 'Upgrade in progress',
              html: 'Keep Chrono open',
              icon: 'success',
              allowOutsideClick: () => !Swal.isLoading()
            })
          }
        })
      }
    })
  }, 10)

  setTimeout(function() {
    window.pywebview.api.check_if_kept_signed_in().then(res => {
      if (res['status']) {
        window.pywebview.api.navigate_to_dashboard()
      }
    })
  }, 20)

  setTimeout(function() {
    window.pywebview.api.check_if_opened()
  }, 30)
})

$(document).ready(function() {
  $('#registerEmailVerifyLn').click(function() {
    email = $('#newEmail').val()
    if ($('#registerEmailVerifyLn').text() === 'Verify') {
      if (validateEmail(email)) {
        $('#registerEmailVerifyLn').css('color', '#df2176')
        $('#registerEmailVerifyLn').html("<img src='img/loading.gif'> Sending")
        window.pywebview.api.send_email('create_ac', email).then(res => {
          if (res['status']) {
            Swal.fire({
              title: 'Done',
              html: res.msg,
              icon: 'success',
              confirmButtonText: 'Ok',
              timer: 3000
            })
            $('#registerEmailVerifyLn').css('color', '#2bbfb4')
            $('#registerEmailVerifyLn').html("<i class='fa fa-check'></i> Sent")
          } else {
            $('#registerEmailVerifyLn').css('color', '#aaa')
            $('#registerEmailVerifyLn').html('Verify')
            if (res.msg.includes('There is an update available.')) {
              Swal.fire({
                title: 'New Version Available',
                html: res.msg,
                icon: 'warning',
                confirmButtonText: 'Upgrade',
                allowOutsideClick: () => !Swal.isLoading()
              }).then(res => {
                if (res.isConfirmed) {
                  window.pywebview.api.upgrade()
                  Swal.fire({
                    title: 'Upgrade in progress',
                    html: 'Keep Chrono open',
                    icon: 'success',
                    allowOutsideClick: () => !Swal.isLoading()
                  })
                }
              })
            } else {
              Swal.fire({
                title: 'Error',
                html: res.msg,
                icon: 'error',
                confirmButtonText: 'Ok'
              })
            }
          }
        })
      } else {
        if (email) {
          txt = email + ' is not a valid email.'
        } else {
          txt = 'Email cannot be empty.'
        }
        Swal.fire({
          title: 'Error',
          html: txt,
          icon: 'error',
          confirmButtonText: 'Ok'
        })
      }
    }
  })

  $('#newEmail').on('input', function() {
    $('#registerEmailVerifyLn').css('color', '#aaa')
    $('#registerEmailVerifyLn').html('Verify')
  })

  $('#signInForm').submit(function() {
    var inputs = $('#signInForm :input')
    var values = {}
    inputs.each(function() {
      values[this.id] = (this.type === 'checkbox') ? $(this).is(':checked') : $(this).val()
    })

    // Form validation
    if (values['email'].length === 0) {
      validateMsg = 'Email cannot be empty.'
    } else if (values['pw'].length === 0) {
      validateMsg = 'Password cannot be empty.'
    } else if (!validateEmail(values['email'])) {
      validateMsg = 'Invalid email.'
    }
    if (typeof validateMsg !== 'undefined') {
      Swal.fire({
        title: 'Error',
        html: validateMsg,
        icon: 'error',
        confirmButtonText: 'Ok'
      })
      delete validateMsg
      return false
    }

    window.pywebview.api.login(values['email'], values['pw'], values['keepMeIn']).then(res => {
      if (res['status']) {
        Swal.fire({
          title: 'Done',
          html: res.msg,
          icon: 'success',
          confirmButtonText: 'Ok',
          timer: 3000
        }).then(() => {
          $('#signInForm :input').val('')
          $('#signInForm :input[type=checkbox]').prop('checked', false)
          window.pywebview.api.set_outbox('login', values['email']).then(function() {
            window.pywebview.api.navigate_to_dashboard()
          })
        })
      } else {
        if (res.msg.includes('There is an update available.')) {
          Swal.fire({
            title: 'New Version Available',
            html: res.msg,
            icon: 'warning',
            confirmButtonText: 'Upgrade',
            allowOutsideClick: () => !Swal.isLoading()
          }).then(res => {
            if (res.isConfirmed) {
              window.pywebview.api.upgrade()
              Swal.fire({
                title: 'Upgrade in progress',
                html: 'Keep Chrono open',
                icon: 'success',
                allowOutsideClick: () => !Swal.isLoading()
              })
            }
          })
        } else {
          Swal.fire({
            title: 'Error',
            html: res.msg,
            icon: 'error',
            confirmButtonText: 'Ok'
          })
        }
      }
    })

    return false
  })

  $('#registerForm').submit(function() {
    var inputs = $('#registerForm :input')
    var values = {}
    inputs.each(function() {
      values[this.id] = (this.type === 'checkbox') ? $(this).is(':checked') : $(this).val()
    })

    // Form validation
    if (values['1stName'].length === 0) {
      validateMsg = 'First name cannot be empty.'
    } else if (values['lastName'].length === 0) {
      validateMsg = 'Last name cannot be empty.'
    } else if (values['newPw'].length === 0) {
      validateMsg = 'Password cannot be empty.'
    } else if (values['newPw'].length < 8) {
      validateMsg = 'Password too short.'
    } else if (!values['newPw'].match(/[A-z]/)) {
      validateMsg = 'Password does not contain any letter.'
    } else if (!values['newPw'].match(/[A-Z]/)) {
      validateMsg = 'Password does not contain any capital letter.'
    } else if (!values['newPw'].match(/\d/)) {
      validateMsg = 'Password does not contain any digit.'
    } else if (values['confirmPw'].length === 0) {
      validateMsg = 'Confirm password cannot be empty.'
    } else if (values['newPw'] !== values['confirmPw']) {
      validateMsg = 'Confirm password does not match.'
    } else if (!values['agreePrivacynTerms']) {
      validateMsg = 'Agreement on privacy notice and terms of use needed.'
    }
    if (typeof validateMsg !== 'undefined') {
      Swal.fire({
        title: 'Error',
        html: validateMsg,
        icon: 'error',
        confirmButtonText: 'Ok'
      })
      delete validateMsg
      return false
    }

    window.pywebview.api.register(values['1stName'], values['lastName'], values['newEmail'], values['verifyCode'], values['newPw'], values['referrer'], values['agreePrivacynTerms'], values['receiveCronumaxUpdates']).then(res => {
      if (res['status']) {
        Swal.fire({
          title: 'Done',
          html: res.msg,
          icon: 'success',
          confirmButtonText: 'Ok',
          timer: 3000
        }).then(() => {
          $('#registerForm :input').val('')
          $('#registerForm :input[type=checkbox]').prop('checked', false)
          window.pywebview.api.navigate_to_dashboard()
        })
      } else {
        $('#registerEmailVerifyLn').css('color', '#aaa')
        $('#registerEmailVerifyLn').html('Verify')
        if (res.msg.includes('There is an update available.')) {
          Swal.fire({
            title: 'New Version Available',
            html: res.msg,
            icon: 'warning',
            confirmButtonText: 'Upgrade',
            allowOutsideClick: () => !Swal.isLoading()
          }).then(res => {
            if (res.isConfirmed) {
              window.pywebview.api.upgrade()
              Swal.fire({
                title: 'Upgrade in progress',
                html: 'Keep Chrono open',
                icon: 'success',
                allowOutsideClick: () => !Swal.isLoading()
              })
            }
          })
        } else {
          Swal.fire({
            title: 'Error',
            html: res.msg,
            icon: 'error',
            confirmButtonText: 'Ok'
          })
        }
      }
    })

    return false
  })

  $('#forgotPwForm').submit(function() {
    var inputs = $('#forgotPwForm :input')
    var values = {}
    inputs.each(function() {
      values[this.id] = $(this).val()
    })

    // Form validation
    if (values['resetPwEmail'].length === 0) {
      validateMsg = 'Email cannot be empty.'
    } else if (!validateEmail(values['resetPwEmail'])) {
      validateMsg = 'Invalid email.'
    }
    if (typeof validateMsg !== 'undefined') {
      Swal.fire({
        title: 'Error',
        html: validateMsg,
        icon: 'error',
        confirmButtonText: 'Ok'
      })
      delete validateMsg
      return false
    } else {
      $('#sendEmailBtn').html("<img src='img/loading-white.gif'> SENDING")
    }

    window.pywebview.api.forgot_pw(values['resetPwEmail']).then(res => {
      if (res['status']) {
        window.pywebview.api.send_email('forgot_pw', values['resetPwEmail']).then(res => {
          if (res['status']) {
            Swal.fire({
              title: 'Done',
              html: res.msg,
              icon: 'success',
              confirmButtonText: 'Ok',
              timer: 3000
            }).then(() => {
              $('#forgotPwForm :input').val('')
              $('#sendEmailBtn').html("SEND")
              $('#forgotPwResetPwWithTokenLn').click()
            })
          } else {
            $('#sendEmailBtn').html("SEND")
            Swal.fire({
              title: 'Error',
              html: res.msg,
              icon: 'error',
              confirmButtonText: 'Ok'
            })
          }
        })
      } else {
        $('#sendEmailBtn').html("SEND")
        if (res.msg.includes('There is an update available.')) {
          Swal.fire({
            title: 'New Version Available',
            html: res.msg,
            icon: 'warning',
            confirmButtonText: 'Upgrade',
            allowOutsideClick: () => !Swal.isLoading()
          }).then(res => {
            if (res.isConfirmed) {
              window.pywebview.api.upgrade()
              Swal.fire({
                title: 'Upgrade in progress',
                html: 'Keep Chrono open',
                icon: 'success',
                allowOutsideClick: () => !Swal.isLoading()
              })
            }
          })
        } else {
          Swal.fire({
            title: 'Error',
            html: res.msg,
            icon: 'error',
            confirmButtonText: 'Ok'
          })
        }
      }
    })

    return false
  })

  $('#resetPwWithTokenForm').submit(function() {
    var inputs = $('#resetPwWithTokenForm :input')
    var values = {}
    inputs.each(function() {
      values[this.id] = $(this).val()
    })
    $('#resetPwWithTokenForm :input').val('')

    // Form validation
    if (values['resetPwWithTokenVerifyCode'].length === 0) {
      validateMsg = 'Verification code cannot be empty.'
    } else if (values['resetPwWithTokenNewPw'].length === 0) {
      validateMsg = 'New password cannot be empty.'
    } else if (values['resetPwWithTokenNewPw'].length < 8) {
      validateMsg = 'New password too short.'
    } else if (!values['resetPwWithTokenNewPw'].match(/[A-z]/)) {
      validateMsg = 'New password does not contain any letter.'
    } else if (!values['resetPwWithTokenNewPw'].match(/[A-Z]/)) {
      validateMsg = 'New password does not contain any capital letter.'
    } else if (!values['resetPwWithTokenNewPw'].match(/\d/)) {
      validateMsg = 'New password does not contain any digit.'
    } else if (values['resetPwWithTokenConfirmPw'].length === 0) {
      validateMsg = 'Confirm password cannot be empty.'
    } else if (values['resetPwWithTokenNewPw'] !== values['resetPwWithTokenConfirmPw']) {
      validateMsg = 'Confirm password does not match.'
    }
    if (typeof validateMsg !== 'undefined') {
      Swal.fire({
        title: 'Error',
        html: validateMsg,
        icon: 'error',
        confirmButtonText: 'Ok'
      })
      delete validateMsg
      return false
    }

    window.pywebview.api.reset_pw(values['resetPwWithTokenNewPw'], null, values['resetPwWithTokenVerifyCode']).then(res => {
      if (res['status']) {
        Swal.fire({
          title: 'Done',
          html: res.msg,
          icon: 'success',
          confirmButtonText: 'Ok',
          timer: 3000
        }).then(() => {
          window.pywebview.api.set_outbox('pw_updated', res.email).then(function() {
            window.pywebview.api.navigate_to_dashboard()
          })
        })
      } else {
        Swal.fire({
          title: 'Error',
          html: res.msg,
          icon: 'error',
          confirmButtonText: 'Ok'
        })
      }
    })

    return false
  })

  $('#forgotPwLn').click(function() {
    $('#signInForm :input').val('')
    $('#signInForm :input[type=checkbox]').prop('checked', false)
  })

  $('#registerLn').click(function() {
    $('#signInForm :input').val('')
    $('#signInForm :input[type=checkbox]').prop('checked', false)
  })

  $('#forgotPwSignInLn').click(function() {
    $('#forgotPwForm :input').val('')
  })

  $('#forgotPwResetPwWithTokenLn').click(function() {
    $('#forgotPwForm :input').val('')
  })

  $('#registerSignInLn').click(function() {
    $('#registerForm :input').val('')
    $('#registerForm :input[type=checkbox]').prop('checked', false)
    $('#registerEmailVerifyLn').css('color', '#aaa')
    $('#registerEmailVerifyLn').html('Verify')
  })

  pwTip('#newPw')
  pwTip('#resetPwWithTokenNewPw')
})

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}

function pwTip(id) {
  var pwTips = tippy(document.querySelector(id), {
    animation: 'fade',
    arrow: false,
    allowHTML: true,
    trigger: 'manual',
    content: '<div id="pswd_info"><p>Password must meet the following requirements:</p><ul><li id="letter" class="invalid">At least <strong>one letter</strong></li><li id="capital" class="invalid">At least <strong>one capital letter</strong></li><li id="number" class="invalid">At least <strong>one number</strong></li><li id="length" class="invalid">Be at least <strong>8 characters</strong></li></ul></div>'
  })

  $(id).keyup(function() {
    var pw = $(this).val();

    // Validate the length
    if (pw.length >= 8) {
      $('#length').removeClass('invalid').addClass('valid');
    } else {
      $('#length').removeClass('valid').addClass('invalid');
    }

    // Validate letter
    if (pw.match(/[A-z]/)) {
      $('#letter').removeClass('invalid').addClass('valid');
    } else {
      $('#letter').removeClass('valid').addClass('invalid');
    }

    // Validate capital letter
    if (pw.match(/[A-Z]/)) {
      $('#capital').removeClass('invalid').addClass('valid');
    } else {
      $('#capital').removeClass('valid').addClass('invalid');
    }

    // Validate number
    if (pw.match(/\d/)) {
      $('#number').removeClass('invalid').addClass('valid');
    } else {
      $('#number').removeClass('valid').addClass('invalid');
    }
  }).focus(function() {
    pwTips.show();
  }).click(function() {
    pwTips.show();
  }).blur(function() {
    pwTips.hide();
  })
}