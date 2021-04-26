$(window).on('pywebviewready', function() {
  $('.nav-link').click(function() {
    $(this).removeClass('active')
  })
})

$(document).ready(function() {
  $('#registerEmailVerifyLn').click(function() {
    email = $('#newEmail').val()
    if ($('#registerEmailVerifyLn').text() === 'Verify') {
      if (validateEmail(email)) {
        $('#registerEmailVerifyLn').css('color', '#df2176')
        $('#registerEmailVerifyLn').html("<img src='img/loading.gif'> Sending")
        window.pywebview.api.send_verify_email('create_ac', email).then(res => {
          if (res['status']) {
            Swal.fire({
              title: 'Done',
              text: res.msg,
              icon: 'success',
              confirmButtonText: 'Ok',
              timer: 3000
            })
            $('#registerEmailVerifyLn').css('color', '#2bbfb4')
            $('#registerEmailVerifyLn').html("<i class='fa fa-check'></i> Sent")
          } else {
            Swal.fire({
              title: 'Error',
              text: res.msg,
              icon: 'error',
              confirmButtonText: 'Ok'
            })
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
          text: txt,
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
    } else if (!values['agreePrivacynTerms']) {
      validateMsg = 'Agreement on privacy notice and terms of use needed.'
    }
    if (typeof validateMsg !== 'undefined') {
      Swal.fire({
        title: 'Error',
        text: validateMsg,
        icon: 'error',
        confirmButtonText: 'Ok'
      })
      delete validateMsg
      return false
    }

    window.pywebview.api.register(values['1stName'], values['lastName'], values['newEmail'], values['verifyCode'], values['newPw'], values['agreePrivacynTerms'], values['receiveCronumaxUpdates']).then(res => {
      if (res['status']) {
        Swal.fire({
          title: 'Done',
          text: res.msg,
          icon: 'success',
          confirmButtonText: 'Ok',
          timer: 3000
        }).then(() => {
          window.pywebview.api.navigate_to_dashbard()
        })
      } else {
        Swal.fire({
          title: 'Error',
          text: res.msg,
          icon: 'error',
          confirmButtonText: 'Ok'
        })
      }
    })

    return false
  })

  var pwTips = tippy(document.querySelector('#newPw'), {
    animation: 'fade',
    arrow: false,
    allowHTML: true,
    trigger: 'manual',
    content: '<div id="pswd_info"><p>Password must meet the following requirements:</p><ul><li id="letter" class="invalid">At least <strong>one letter</strong></li><li id="capital" class="invalid">At least <strong>one capital letter</strong></li><li id="number" class="invalid">At least <strong>one number</strong></li><li id="length" class="invalid">Be at least <strong>8 characters</strong></li></ul></div>'
  })

  $('#newPw').keyup(function() {
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
  });
})

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}