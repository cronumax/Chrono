$('#record').click(function() {
  window.postMessage({
    myTypeField: 'my-custom-message',
    data: 'Record btn clicked'
  })
})