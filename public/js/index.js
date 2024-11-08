$(document).ready(function () {

  $("#Formemail").blur(function () {

    var exp = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
    var email = $("#Formemail").val();

    if (exp.test(email) == true) {
      $(this).css("border", "1px solid green");
      $("#errEmail").html("Valid");
      //$("#errEmail").css("color", "green");
      //$("#errEmail").removeClass("not-ok-pic").addClass("ok-pic");
    }
    else {
      $(this).css("border", "1px solid red");
      $("#errEmail").html("Invalid Email");
      // $("#errEmail").css("color", "red");
    }
  });
  //=====================================================

  $("#Formpass").blur(function () {
    var pass = $("#Formpass").val();
    var r = /(?=^.{8,}$)(?=.*\d)(?=.*[!@#$%^&*]+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
    if (r.test(pass) == true) {
      $(this).css("border", "1px solid green");
      $("#errPass").html("ok");
    }
    else {
      $(this).css("border", "1px solid red");
      $("#errPass").html("Please Enter Strong Password");
    }
  });
  //=============================================================

  $(".fa").mousedown(function () {
    $("#Formpass").prop("type", "text");
    $(".fa").removeClass("bi-eye").addClass("bi-eye-slash");
  });

  $(".fa").mouseup(function () {
    $("#Formpass").attr("type", "password");
    $(".fa").removeClass("bi-eye-slash").addClass("bi-eye");
  });
})