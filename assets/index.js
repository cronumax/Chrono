$("document").ready(function() {
  $('#recordBtn').click(function() {
    var msg = 'Record btn clicked'
    window.pywebview.api.record(msg)
  })

  $('#playBtn').click(function() {
    var msg = 'Play btn clicked'
    window.pywebview.api.play(msg)
  })
})