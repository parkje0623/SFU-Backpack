//Javascript for signUp page started//
//show and hide password as clicking an icon
function eye_clicked() {
    $(".pass").toggleClass('hide');
    if ($(".pass").hasClass('hide')) {
        $('#eye').attr('class', "fa fa-eye fa-lg");
        $(".pass").attr('type', "password");
    }
    else {
        $('#eye').attr('class', "fa fa-eye-slash fa-lg");
        $(".pass").attr('type', "text");
    }
}
$(document).ready(function () {
    document.getElementById('eye').onclick = eye_clicked;
});
//Javascript for sign_up page finished//