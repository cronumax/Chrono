$(function(){
  $("#login").submit(function(e){
    e.preventDefault();
    $(".login").addClass("init-shake");
    setTimeout(function(){
      $(".login").removeClass("init-shake");
    }, 1000);
  });
  $(".pass").on("keypress", function(){
    $(".arrow").css("opacity", "1");
  });
})
