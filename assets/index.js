$(window).on('pywebviewready', function() {
  $('#recordBtn').click(function() {
    var msg = 'Record btn clicked'
    $.when(window.pywebview.api.record(msg)).done(function() {})
  })

  $('#playBtn').click(function() {
    var msg = 'Play btn clicked'
    $.when(window.pywebview.api.play(msg)).done(function() {})
  })
})

$("document").ready(function() {})