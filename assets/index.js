$(window).on('pywebviewready', function() {
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
        if (/[^a-zA-Z0-9\-]/.test(result.value)) {
          Swal.fire({
            title: 'Error',
            text: 'Process name can only contain alphanumeric (a-z, A-Z, 0-9) or hyphen (-)',
            icon: 'error',
            confirmButtonText: 'Understood'
          })
        } else if (result.isConfirmed) {
          window.pywebview.api.prompt_handler(result.value)
        }
      })
    })
  })

  $('#playBtn').click(function() {
    var msg = 'Play btn clicked'
    $.when(window.pywebview.api.play(msg)).done(function() {})
  })
})

$("document").ready(function() {})