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

  $('#processList tbody').on('click', '#scheduleBtn', function() {
    if ($(this).hasClass('active')) {
      Swal.fire({
        title: 'Disable scheduled run?',
        icon: 'warning',
        confirmButtonText: 'Confirm',
        showCancelButton: true,
        allowOutsideClick: () => !Swal.isLoading()
      }).then(res => {
        if (res.isConfirmed) {
          $(this).removeClass('active')
          // Disable scheduled run
        }
      })
    } else {
      // Prompt to let user set date, time & recurrence for scheduling replay
      Swal.fire({
        title: 'Schedule replay',
        icon: 'question',
        html: "<p>Date & time</p><input id='datetimepicker' class='swal2-input'>",
        width: '42rem',
        didOpen: function() {
          $('#datetimepicker').datetimepicker({
            format: 'DD/MM/YYYY HH:mm',
            defaultDate: new Date(),
            inline: true,
            sideBySide: true
          })
        },
        confirmButtonText: 'Save',
        denyButtonText: 'Repeat',
        showDenyButton: true,
        showCancelButton: true,
        allowOutsideClick: () => !Swal.isLoading()
      }).then(res => {
        var datetime = $('#datetimepicker').val()
        if (res.isConfirmed) {
          // Enable scheduled run
          console.log(datetime)
          $(this).addClass('active')
        } else if (res.isDenied) {
          // Let user set predefined recurrence
          Swal.fire({
            title: 'Repeat',
            icon: 'question',
            html: "<select id='predefinedRecurrence' data-placeholder='Repeat'></select>",
            didOpen: function() {
              var predefinedRecurrences = {
                'every_min': 'Every minute',
                'every_hr': 'Every hour',
                'every_day': 'Every day',
                'every_wk': 'Every week',
                'every_mo': 'Every month',
                'every_yr': 'Every year'
              }
              var option = ''

              for (let key of Object.keys(predefinedRecurrences)) {
                option += '<option value="' + key + '">' + predefinedRecurrences[key] + '</option>'
              }
              $('#predefinedRecurrence').append(option)

              $('#predefinedRecurrence option:first').attr('selected', true)

              $('#predefinedRecurrence').awselect({
                background: "#303030",
                active_background: "#262626",
                placeholder_color: "#fff",
                placeholder_active_color: "#666",
                option_color: "#fff",
                immersive: true
              })
            },
            confirmButtonText: 'Save',
            denyButtonText: 'Custom...',
            showDenyButton: true,
            showCancelButton: true,
            allowOutsideClick: () => !Swal.isLoading()
          }).then(res2 => {
            if (res2.isConfirmed) {
              var predefinedRecurrence = $('#predefinedRecurrence').val()

              // Enable scheduled run
              console.log(datetime)
              console.log(predefinedRecurrence)
              $(this).addClass('active')
            } else if (res2.isDenied) {
              // Let user set custom recurrence
              Swal.fire({
                title: 'Custom',
                icon: 'question',
                html: "<p>Every</p><select id='minIntervalNum' data-placeholder='Interval number'></select><select id='hrIntervalNum' data-placeholder='Interval number'></select><select id='dayIntervalNum' data-placeholder='Interval number'></select><select id='wkIntervalNum' data-placeholder='Interval number'></select><select id='moIntervalNum' data-placeholder='Interval number'></select><select id='yrIntervalNum' data-placeholder='Interval number'></select><select id='intervalUnit' data-placeholder='Interval unit'></select><select id='wkSettings' data-placeholder='Repeat on'></select><select id='ends' data-placeholder='Ends'></select>",
                didOpen: function() {
                  var intervalUnits = {
                    'min': 'minute',
                    'hr': 'hour',
                    'day': 'day',
                    'wk': 'week',
                    'mo': 'month',
                    'yr': 'year'
                  }
                  var daysOfWk = {
                    'sun': 'Sunday',
                    'mon': 'Monday',
                    'tue': 'Tuesday',
                    'wed': 'Wednesday',
                    'thu': 'Thursday',
                    'fri': 'Friday',
                    'sat': 'Saturday'
                  }
                  var ends = {
                    'noEnd': "Doesn't end",
                    'date': "On a date",
                    'afterNumOfOccurences': 'After number of occurences'
                  }

                  var minNumOptions = ''
                  var hrNumOptions = ''
                  var dayNumOptions = ''
                  var wkNumOptions = ''
                  var moNumOptions = ''
                  var yrNumOptions = ''
                  var unitOptions = ''
                  var wkSettingsOptions = ''
                  var endOptions = ''

                  for (var i = 1; i < 60; i++) {
                    minNumOptions += '<option value="' + i + '">' + i + '</option>'
                  }
                  for (var i = 1; i < 24; i++) {
                    hrNumOptions += '<option value="' + i + '">' + i + '</option>'
                  }
                  for (var i = 1; i < 100; i++) {
                    dayNumOptions += '<option value="' + i + '">' + i + '</option>'
                  }
                  for (var i = 1; i < 53; i++) {
                    wkNumOptions += '<option value="' + i + '">' + i + '</option>'
                  }
                  for (var i = 1; i < 37; i++) {
                    moNumOptions += '<option value="' + i + '">' + i + '</option>'
                  }
                  for (var i = 1; i < 31; i++) {
                    yrNumOptions += '<option value="' + i + '">' + i + '</option>'
                  }
                  for (let key of Object.keys(intervalUnits)) {
                    unitOptions += '<option value="' + key + '">' + intervalUnits[key] + '</option>'
                  }
                  for (let key of Object.keys(daysOfWk)) {
                    wkSettingsOptions += '<option value="' + key + '">' + daysOfWk[key] + '</option>'
                  }
                  for (let key of Object.keys(ends)) {
                    endOptions += '<option value="' + key + '">' + ends[key] + '</option>'
                  }

                  $('#minIntervalNum').append(minNumOptions)
                  $('#hrIntervalNum').append(hrNumOptions)
                  $('#dayIntervalNum').append(dayNumOptions)
                  $('#wkIntervalNum').append(wkNumOptions)
                  $('#moIntervalNum').append(moNumOptions)
                  $('#yrIntervalNum').append(yrNumOptions)
                  $('#intervalUnit').append(unitOptions)
                  $('#wkSettings').append(wkSettingsOptions)
                  $('#ends').append(endOptions)

                  $('#minIntervalNum option:first').attr('selected', true)
                  $('#hrIntervalNum option:first').attr('selected', true)
                  $('#dayIntervalNum option:first').attr('selected', true)
                  $('#wkIntervalNum option:first').attr('selected', true)
                  $('#moIntervalNum option:first').attr('selected', true)
                  $('#yrIntervalNum option:first').attr('selected', true)
                  $('#intervalUnit option:first').attr('selected', true)
                  $('#wkSettings option:first').attr('selected', true)
                  var d = $('#wkSettings option:eq(' + new Date().getDay().toString() + ')').text()
                  $('#ends option:first').attr('selected', true)

                  $('#minIntervalNum').awselect({
                    background: "#303030",
                    active_background: "#262626",
                    placeholder_color: "#fff",
                    placeholder_active_color: "#666",
                    option_color: "#fff",
                    immersive: true
                  })
                  $('#hrIntervalNum').awselect({
                    background: "#303030",
                    active_background: "#262626",
                    placeholder_color: "#fff",
                    placeholder_active_color: "#666",
                    option_color: "#fff",
                    immersive: true
                  })
                  $('#dayIntervalNum').awselect({
                    background: "#303030",
                    active_background: "#262626",
                    placeholder_color: "#fff",
                    placeholder_active_color: "#666",
                    option_color: "#fff",
                    immersive: true
                  })
                  $('#wkIntervalNum').awselect({
                    background: "#303030",
                    active_background: "#262626",
                    placeholder_color: "#fff",
                    placeholder_active_color: "#666",
                    option_color: "#fff",
                    immersive: true
                  })
                  $('#moIntervalNum').awselect({
                    background: "#303030",
                    active_background: "#262626",
                    placeholder_color: "#fff",
                    placeholder_active_color: "#666",
                    option_color: "#fff",
                    immersive: true
                  })
                  $('#yrIntervalNum').awselect({
                    background: "#303030",
                    active_background: "#262626",
                    placeholder_color: "#fff",
                    placeholder_active_color: "#666",
                    option_color: "#fff",
                    immersive: true
                  })
                  $('#intervalUnit').awselect({
                    background: "#303030",
                    active_background: "#262626",
                    placeholder_color: "#fff",
                    placeholder_active_color: "#666",
                    option_color: "#fff",
                    immersive: true
                  })
                  $('#wkSettings').awselect({
                    background: "#303030",
                    active_background: "#262626",
                    placeholder_color: "#fff",
                    placeholder_active_color: "#666",
                    option_color: "#fff",
                    immersive: true
                  })
                  $('#awselect_wkSettings a:contains("' + d + '")').css('color', '#df2176')
                  $('#awselect_wkSettings .current_value').text('On ' + d)
                  $('#ends').awselect({
                    background: "#303030",
                    active_background: "#262626",
                    placeholder_color: "#fff",
                    placeholder_active_color: "#666",
                    option_color: "#fff",
                    immersive: true
                  })

                  $('#awselect_hrIntervalNum').hide()
                  $('#awselect_dayIntervalNum').hide()
                  $('#awselect_wkIntervalNum').hide()
                  $('#awselect_moIntervalNum').hide()
                  $('#awselect_yrIntervalNum').hide()
                  $('#awselect_wkSettings').hide()

                  $('#minIntervalNum').change(function() {
                    if ($('#minIntervalNum').val() === '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) === 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text().slice(0, -1))
                    } else if ($('#minIntervalNum').val() !== '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) !== 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text() + 's')
                    }
                  })
                  $('#hrIntervalNum').change(function() {
                    if ($('#hrIntervalNum').val() === '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) === 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text().slice(0, -1))
                    } else if ($('#hrIntervalNum').val() !== '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) !== 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text() + 's')
                    }
                  })
                  $('#dayIntervalNum').change(function() {
                    if ($('#dayIntervalNum').val() === '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) === 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text().slice(0, -1))
                    } else if ($('#dayIntervalNum').val() !== '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) !== 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text() + 's')
                    }
                  })
                  $('#wkIntervalNum').change(function() {
                    if ($('#wkIntervalNum').val() === '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) === 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text().slice(0, -1))
                    } else if ($('#wkIntervalNum').val() !== '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) !== 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text() + 's')
                    }
                  })
                  $('#moIntervalNum').change(function() {
                    if ($('#moIntervalNum').val() === '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) === 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text().slice(0, -1))
                    } else if ($('#moIntervalNum').val() !== '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) !== 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text() + 's')
                    }
                  })
                  $('#yrIntervalNum').change(function() {
                    if ($('#yrIntervalNum').val() === '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) === 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text().slice(0, -1))
                    } else if ($('#yrIntervalNum').val() !== '1' && $('#awselect_intervalUnit .current_value').text().slice(-1) !== 's') {
                      $('#awselect_intervalUnit .current_value').text($('#awselect_intervalUnit .current_value').text() + 's')
                    }
                  })
                  $('#intervalUnit').change(function() {
                    switch ($(this).val()) {
                      case 'min':
                        $('#awselect_minIntervalNum').show()
                        $('#awselect_hrIntervalNum').hide()
                        $('#awselect_dayIntervalNum').hide()
                        $('#awselect_wkIntervalNum').hide()
                        $('#awselect_wkSettings').hide()
                        $('#awselect_moIntervalNum').hide()
                        $('#awselect_yrIntervalNum').hide()
                        break
                      case 'hr':
                        $('#awselect_minIntervalNum').hide()
                        $('#awselect_hrIntervalNum').show()
                        $('#awselect_dayIntervalNum').hide()
                        $('#awselect_wkIntervalNum').hide()
                        $('#awselect_wkSettings').hide()
                        $('#awselect_moIntervalNum').hide()
                        $('#awselect_yrIntervalNum').hide()
                        break
                      case 'day':
                        $('#awselect_minIntervalNum').hide()
                        $('#awselect_hrIntervalNum').hide()
                        $('#awselect_dayIntervalNum').show()
                        $('#awselect_wkIntervalNum').hide()
                        $('#awselect_wkSettings').hide()
                        $('#awselect_moIntervalNum').hide()
                        $('#awselect_yrIntervalNum').hide()
                        break
                      case 'wk':
                        $('#awselect_minIntervalNum').hide()
                        $('#awselect_hrIntervalNum').hide()
                        $('#awselect_dayIntervalNum').hide()
                        $('#awselect_wkIntervalNum').show()
                        $('#awselect_wkSettings').show()
                        $('#awselect_moIntervalNum').hide()
                        $('#awselect_yrIntervalNum').hide()
                        break
                      case 'mo':
                        $('#awselect_minIntervalNum').hide()
                        $('#awselect_hrIntervalNum').hide()
                        $('#awselect_dayIntervalNum').hide()
                        $('#awselect_wkIntervalNum').hide()
                        $('#awselect_wkSettings').hide()
                        $('#awselect_moIntervalNum').show()
                        $('#awselect_yrIntervalNum').hide()
                        break
                      case 'yr':
                        $('#awselect_minIntervalNum').hide()
                        $('#awselect_hrIntervalNum').hide()
                        $('#awselect_dayIntervalNum').hide()
                        $('#awselect_wkIntervalNum').hide()
                        $('#awselect_wkSettings').hide()
                        $('#awselect_moIntervalNum').hide()
                        $('#awselect_yrIntervalNum').show()
                    }
                  })
                  $('#wkSettings').change(function() {
                    var pressed = $('#awselect_wkSettings a:contains("' + $('#wkSettings option:selected').text() + '")')
                    var lastSelected = $('#awselect_wkSettings a').filter(function() {
                      return $(this).css('color') === 'rgb(223, 33, 118)'
                    })
                    var amtSelected = lastSelected.length

                    if (pressed.css('color') === 'rgb(255, 255, 255)') {
                      pressed.css('color', '#df2176')
                      amtSelected += 1
                    } else {
                      pressed.css('color', '#fff')
                      amtSelected -= 1
                    }

                    // If no selection, prompt error, else if only 1 selection, show full name, else show 1st 3 chars
                    if (amtSelected === 0) {
                      // Revert
                      $('#awselect_wkSettings a:contains("' + d + '")').css('color', '#df2176')
                      $('#awselect_wkSettings .current_value').text('On ' + d)
                    } else if (amtSelected === 1) {
                      lastSelected.each(function() {
                        if ($(this).not(':contains("' + pressed.text() + '")').length > 0) {
                          $('#awselect_wkSettings .current_value').text('On ' + $(this).text())
                        }
                      })
                    } else {
                      var t = []
                      if (pressed.css('color') === 'rgb(223, 33, 118)') {
                        // Deselect
                        lastSelected.each(function() {
                          if ($(this).not(':contains("' + pressed.text() + '")').length > 0) {
                            t.push($(this).text().substring(0, 3))
                          }
                        })
                        $('#awselect_wkSettings .current_value').text('On ' + t.join(', '))
                      } else {
                        // Select
                        for (let val of Object.values(daysOfWk)) {
                          lastSelected.each(function() {
                            if ($(this).text() === val) {
                              t.push($(this).text().substring(0, 3))
                            }
                          })
                          if (pressed.text() === val) {
                            t.push(pressed.text().substring(0, 3))
                          }
                        }
                        $('#awselect_wkSettings .current_value').text('On ' + t.join(', '))
                      }
                    }
                  })
                },
                confirmButtonText: 'Save',
                showCancelButton: true,
                allowOutsideClick: () => !Swal.isLoading()
              }).then(res3 => {
                if (res3.isConfirmed) {
                  var intervalNum = $('#intervalNum').val()
                  var intervalUnit = $('#intervalUnit').val()
                  var ends = $('#ends').val()

                  console.log(datetime)
                  console.log(intervalNum)
                  console.log(intervalUnit)
                  console.log(ends)
                  $(this).addClass('active')
                }
              })
            }
          })
        }
      })
    }
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

  $('#timezoneSelection').change(function() {
    var timezone = $(this).children('option:selected').text()

    window.pywebview.api.set_timezone(timezone).then(res => {
      if (!res['status']) {
        Swal.fire({
          title: 'Warning',
          html: res['msg'],
          icon: 'warning',
          confirmButtonText: 'Ok'
        }).then(function() {
          window.pywebview.api.get_timezone().then(originalTimezone => {
            $('#timezoneSelection').val(originalTimezone).attr('selected', 'selected')
          })
        })
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

  setTimeout(function() {
    window.pywebview.api.get_timezone_list().then(timezoneList => {
      $('#timezoneSelection').empty()
      $.each(timezoneList, function(i, timezone) {
        var row = '<option>' + timezone + '</option>'
        $('#timezoneSelection').append(row)
      })
    })
  }, 70)

  setTimeout(function() {
    window.pywebview.api.get_timezone().then(timezone => {
      $('#timezoneSelection').val(timezone).attr('selected', 'selected')
    })
  }, 80)

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
      row += "<td><button id='scheduleBtn' class='btn'><i class='far fa-clock fa-lg'></i></button><button id='renameBtn' class='btn'><i class='far fa-edit fa-lg'></i></button><button id='delBtn' class='btn'><i class='far fa-trash-alt fa-lg'></i></button></td>"
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