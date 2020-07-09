/* Javascript for profile.ejs START */
//Constantly watches for event such that user clicks the edit button
document.getElementById('submit_btn').addEventListener("click",
  function(event) {
    var username = document.getElementById('profname').value.trim();
    var pwd = document.getElementById('profpwd').value.trim();
    var confirm_pwd = document.getElementById('profconfirm').value.trim();
    var email = document.getElementById('profemail').value.trim();

    if (pwd != confirm_pwd) { //If passowrd mismatches confirm passowrd, alerts user then cancels the button clicked
      alert("Password must match with confirm password, please try again!")
      event.preventDefault();
    }
    if (username === "" || pwd === "" || confirm_pwd === "" || email === "") {
      //If user gives blank for any of the inputs, alerts user then cancels the button clicked
      alert("Must fill in all information, please try again!")
      event.preventDefault();
    }
  }
);

//Asks user to confirm that he/she wants to remove account
document.getElementById('delete_btn').addEventListener("click",
  function(event) {
    //Pop-up message that confirms user that the account will be delted.
    var confirmation = confirm("Are you sure you want to delete your account?");
    if (confirmation === true) {
      //If user clicked OK, notifies the user and account deletion is processed
      alert("Pressed Yes, Account Will Now Be Deleted");
    }
    else {
      //If user clicked No, cancels the button clicked and notifies the user.
      alert("Pressed No, Account Will Not Be Deleted!");
      event.preventDefault();
    }
  }
);
//Get image stored in public folder then changes the value into selected image name and type
function getImage(event) {
  var changeImg = document.getElementById('image');
  changeImg.value = document.getElementById('pics').value;
}

function pop_up_condition() {
  var popup = document.getElementById("popup");
  popup.classList.toggle("show");
}
/* Javascript for profile.ejs FINISHED */
