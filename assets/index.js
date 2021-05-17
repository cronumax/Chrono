$(window).on('pywebviewready', function() {
  $('#recordBtn').click(function() {
    var msg = 'Record btn clicked'
    $(this).addClass('running')
    $.when(window.pywebview.api.record(msg)).done(function() {
      promptForProcessName()
      $('#recordBtn').removeClass('running')
    })
  })

  $('#playBtn').click(function() {
    var msg = 'Play btn clicked'
    var processName = $('#processList tr.selected td:first').html()
    if (processName) {
      $(this).addClass('running')
      $.when(window.pywebview.api.play(msg, processName)).done(function() {
        $('#playBtn').removeClass('running')
      })
    } else {
      Swal.fire({
        title: 'Error',
        html: 'Please select a process.',
        icon: 'error',
        confirmButtonText: 'Ok'
      })
    }
  })

  $('#processList tbody').on('click', 'tr', function() {
    $(this).addClass('selected').siblings().removeClass('selected')
  })

  $('#processList tbody').on('click', '#renameBtn', function() {
    promptForProcessName(true, $(this).parent().parent().find('td:first').html())
  })

  $('#processList tbody').on('click', '#delBtn', function() {
    Swal.fire({
      title: 'Remove process ' + $(this).parent().parent().find('td:first').html() + '?',
      html: 'You will not be able to revert this.',
      icon: 'warning',
      confirmButtonText: 'Confirm',
      showCancelButton: true,
      allowOutsideClick: () => !Swal.isLoading()
    }).then(res => {
      if (res.isConfirmed) {
        delProcess($(this).parent().parent().find('td:first').html())
      }
    })
  })

  $('#touchModeBtn').change(function() {
    if ($(this).is(':checked')) {
      window.pywebview.api.enable_touch_mode().then(res => {
        if (!res['status']) {
          Swal.fire({
            title: 'Warning',
            html: res['msg'],
            icon: 'warning',
            confirmButtonText: 'Ok'
          }).then(function() {
            $(this).prop('checked', false)
          })
        }
      })
    } else {
      window.pywebview.api.disable_touch_mode().then(res => {
        if (!res['status']) {
          Swal.fire({
            title: 'Warning',
            html: res['msg'],
            icon: 'warning',
            confirmButtonText: 'Ok'
          }).then(function() {
            $(this).prop('checked', true)
          })
        }
      })
    }
  })

  $('#godSpeedBtn').change(function() {
    if ($(this).is(':checked')) {
      window.pywebview.api.enable_god_speed().then(res => {
        if (!res['status']) {
          Swal.fire({
            title: 'Warning',
            html: res['msg'],
            icon: 'warning',
            confirmButtonText: 'Ok'
          }).then(function() {
            $(this).prop('checked', false)
          })
        }
      })
    } else {
      window.pywebview.api.disable_god_speed().then(res => {
        if (!res['status']) {
          Swal.fire({
            title: 'Warning',
            html: res['msg'],
            icon: 'warning',
            confirmButtonText: 'Ok'
          }).then(function() {
            $(this).prop('checked', true)
          })
        }
      })
    }
  })

  setTimeout(function() {
    window.pywebview.api.get_touch_mode().then(res => {
      if (res['status']) {
        $('#touchModeBtn').prop('checked', res['touch_mode'])
      } else {
        Swal.fire({
          title: 'Warning',
          html: res['msg'],
          icon: 'warning',
          confirmButtonText: 'Ok'
        })
      }
    })
  }, 10)

  setTimeout(function() {
    window.pywebview.api.get_god_speed().then(res => {
      if (res['status']) {
        $('#godSpeedBtn').prop('checked', res['god_speed'])
      } else {
        Swal.fire({
          title: 'Warning',
          html: res['msg'],
          icon: 'warning',
          confirmButtonText: 'Ok'
        })
      }
    })
  }, 20)

  setTimeout(function() {
    window.pywebview.api.get_user_name().then(res => {
      if (res['status']) {
        $('#userName').html(res['user_name'])
      }
    })
  }, 30)

  setTimeout(function() {
    window.pywebview.api.get_user_email().then(res => {
      if (res['status']) {
        $('#userEmail').html(res['user_email'])
      }
    })
  }, 40)

  setTimeout(function() {
    window.pywebview.api.get_user_license().then(res => {
      if (res['status']) {
        $('#userLicenseTier').html(res['tier'])
        $('#userLicenseExpiryDate').html(res['expiry_date'])
      }
    })
  }, 50)

  setTimeout(function() {
    window.pywebview.api.get_app_info().then(res => {
      if (res['status']) {
        $('#appVer').html(res['version'])
      }
    })
  }, 60)

  refreshProcessList()
})

$(document).ready(function() {
  $(document).on('click', function(event) {
    var selectedRow = $('#processList tr.selected')
    if (selectedRow.length && !selectedRow.is(event.target) && !selectedRow.has(event.target).length) {
      selectedRow.removeClass('selected')
    }
  })

  $('#logoutBtn').click(function() {
    window.pywebview.api.logout()
    window.pywebview.api.navigate_to_login()
  })

  $('#profileChangePwLn').click(function() {
    $('#resetPwWithOldPw').siblings().removeClass('active show')
    $('#resetPwWithOldPw').addClass('active show')
  })

  $('#resetPwWithOldPwProfileLn').click(function() {
    $('#resetPwWithOldPwForm :input').val('')
    $('#resetPwWithOldPw').removeClass('active show')
    $('#profile').addClass('active show')
  })

  $('#resetPwWithOldPwForm').submit(function() {
    var inputs = $('#resetPwWithOldPwForm :input')
    var values = {}
    inputs.each(function() {
      values[this.id] = $(this).val()
    })
    $('#resetPwWithOldPwForm :input').val('')

    // Form validation
    if (values['oldPw'].length === 0) {
      validateMsg = 'Old password cannot be empty.'
    } else if (values['resetPwWithOldPwNewPw'].length === 0) {
      validateMsg = 'New password cannot be empty.'
    } else if (values['resetPwWithOldPwNewPw'].length < 8) {
      validateMsg = 'New password too short.'
    } else if (values['resetPwWithOldPwNewPw'] === values['oldPw']) {
      validateMsg = 'New password cannot be the same as old password.'
    } else if (!values['resetPwWithOldPwNewPw'].match(/[A-z]/)) {
      validateMsg = 'New password does not contain any letter.'
    } else if (!values['resetPwWithOldPwNewPw'].match(/[A-Z]/)) {
      validateMsg = 'New password does not contain any capital letter.'
    } else if (!values['resetPwWithOldPwNewPw'].match(/\d/)) {
      validateMsg = 'New password does not contain any digit.'
    } else if (values['resetPwWithOldPwConfirmPw'].length === 0) {
      validateMsg = 'Confirm password cannot be empty.'
    } else if (values['resetPwWithOldPwNewPw'] !== values['resetPwWithOldPwConfirmPw']) {
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

    window.pywebview.api.reset_pw(values['resetPwWithOldPwNewPw'], values['oldPw']).then(res => {
      if (res['status']) {
        Swal.fire({
          title: 'Done',
          html: res.msg,
          icon: 'success',
          confirmButtonText: 'Ok',
          timer: 3000
        }).then(() => {
          $('.nav-link').first().click()
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

  $('#logoutBtn').click(function() {
    $('#resetPwWithOldPwForm :input').val('')
  })

  $('.nav-item > .nav-link').click(function() {
    $('#resetPwWithOldPwForm :input').val('')
  })

  pwTip('#resetPwWithOldPwNewPw')
})

function refreshProcessList() {
  $.when(window.pywebview.api.load_process_list()).then(processList => {
    $('#processList tbody').empty()
    $.each(processList, function(i, process) {
      var row = "<tr class='table-dark'>"
      $.each(process, function(j, data) {
        row += '<td>' + data + '</td>'
      })
      row += "<td><button id='renameBtn' class='btn'><i class='fa fa-edit fa-lg'></i></button><button id='delBtn' class='btn'><i class='fa fa-trash fa-lg'></i></button></td>"
      row += '</tr>'
      $('#processList tbody').append(row)
    })
  })
}

function promptForProcessName(rename = false, oldName = null) {
  Swal.fire({
    title: rename ? 'New name?' : 'Process name?',
    icon: 'question',
    input: 'text',
    inputAttributes: {
      autocapitalize: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Confirm',
    allowOutsideClick: () => !Swal.isLoading()
  }).then(result => {
    // Frontend validation
    if (!result.value) {
      var errorTxt = 'Process name cannot be empty.'
    } else if (!(/^\w+( \w+)*$/.test(result.value))) {
      var errorTxt = 'Process name can only contain alphanumeric (a-z, A-Z, 0-9) or underscore (_), and only one space between words.'
    } else if (result.value === oldName) {
      var errorTxt = 'New process name cannot be the same as the old name.'
    }

    if (result.isConfirmed) {
      if (errorTxt) {
        Swal.fire({
          title: 'Error',
          html: errorTxt,
          icon: 'error',
          confirmButtonText: 'Ok'
        })
      } else {
        if (rename) {
          window.pywebview.api.rename_process(oldName, result.value).then(res => {
            backendValidation(res)
          })
        } else {
          window.pywebview.api.save(result.value).then(res => {
            backendValidation(res)
          })
        }
      }
    }
  })
}

function backendValidation(res) {
  if (res.status) {
    Swal.fire({
      title: 'Done',
      html: res.msg,
      icon: 'success',
      confirmButtonText: 'Ok',
      timer: 3000
    })
    refreshProcessList()
  } else {
    Swal.fire({
      title: 'Error',
      html: res.msg,
      icon: 'error',
      confirmButtonText: 'Ok'
    })
  }
}

function delProcess(process) {
  window.pywebview.api.del_process(process).then(res => {
    backendValidation(res)
  })
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