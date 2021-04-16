$(window).on('pywebviewready', function() {
  refreshProcessList()

  $('#recordBtn').click(function() {
    var msg = 'Record btn clicked'
    $.when(window.pywebview.api.record(msg)).done(function() {
      promptForProcessName()
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

  $('#processList tbody').on('click', '#renameBtn', function() {
    promptForProcessName(true, $(this).parent().parent().find('td:first').html())
  })

  $('#processList tbody').on('click', '#delBtn', function() {
    Swal.fire({
      title: 'Remove process ' + $(this).parent().parent().find('td:first').html() + '?',
      text: 'You will not be able to revert this.',
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
})

$(document).ready(function() {
  $(document).on('click', function(event) {
    var selectedRow = $('#processList tr.selected')
    if (selectedRow.length && !selectedRow.is(event.target) && !selectedRow.has(event.target).length) {
      selectedRow.removeClass('selected')
    }
  })
})

function refreshProcessList() {
  $.when(window.pywebview.api.load_process_list()).then(processList => {
    $('#processList tbody').empty()
    $.each(processList, function(i, process) {
      var row = "<tr class='table-dark'>"
      $.each(process, function(j, data) {
        row += '<td>' + data + '</td>'
      })
      row += "<td><button id='renameBtn' class='btn'><i class='fa fa-edit'></i></button><button id='delBtn' class='btn'><i class='fa fa-trash'></i></button></td>"
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
      text: res.txt,
      icon: 'success',
      confirmButtonText: 'Ok',
      timer: 3000
    })
    refreshProcessList()
  } else {
    Swal.fire({
      title: 'Error',
      text: res.txt,
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