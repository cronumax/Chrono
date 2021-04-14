$(window).on('pywebviewready', function() {
  refresh_process_list()

  $('#recordBtn').click(function() {
    var msg = 'Record btn clicked'
    $.when(window.pywebview.api.record(msg)).done(function() {
      Swal.fire({
        title: 'Process name?',
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
        } else if (/[^a-zA-Z0-9\-]/.test(result.value)) {
          var errorTxt = 'Process name can only contain alphanumeric (a-z, A-Z, 0-9) or hyphen (-).'
        }

        if (result.isConfirmed) {
          if (errorTxt) {
            Swal.fire({
              title: 'Error',
              text: errorTxt,
              icon: 'error',
              confirmButtonText: 'Ok'
            })
          } else {
            window.pywebview.api.save(result.value).then(res => {
              // Backend validation
              if (!res.saved) {
                Swal.fire({
                  title: 'Error',
                  text: res.txt,
                  icon: 'error',
                  confirmButtonText: 'Ok'
                })
              } else {
                refresh_process_list()
              }
            })
          }
        }
      })
    })
  })

  $('#playBtn').click(function() {
    var msg = 'Play btn clicked'
    var processName = $('#processList tr.selected td:first').html()
    if (processName) {
      $.when(window.pywebview.api.play(msg, processName)).done(function() {})
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Please select a process.',
        icon: 'error',
        confirmButtonText: 'Ok'
      })
    }
  })

  $('#processList tbody').on('click', 'tr', function() {
    $(this).addClass('selected').siblings().removeClass('selected')
  })
})

function refresh_process_list() {
  $.when(window.pywebview.api.load_process_list()).then(processList => {
    $('#processList tbody').empty()
    $.each(processList, function(i, process) {
      var row = "<tr class='table-dark'>"
      $.each(process, function(j, data) {
        row += '<td>' + data + '</td>'
      })
      row += '<td>To do: actions</td>'
      row += '</tr>'
      $('#processList tbody').append(row)
    })
  })
}

$(document).ready(function() {
  $(document).on('click', function(event) {
    var selectedRow = $('#processList tr.selected')
    if (selectedRow.length && !selectedRow.is(event.target) && !selectedRow.has(event.target).length) {
      selectedRow.removeClass('selected')
    }
  })
})