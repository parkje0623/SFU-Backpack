const express = require("express")
const session = require("express-session")
const bodyParser = require("body-parser")
const path = require("path")
const ejs = require("ejs")
const multer = require("multer")
const multerS3 = require("multer-s3")
const nodemailer = require("nodemailer")
const fs = require("fs")
const AWS = require("aws-sdk")
const bcrypt = require('bcrypt')
const Crypto = require('crypto')
require('dotenv').config()
// const AWS_ID = process.env.AWS_ACCESS_KEY_ID
// const AWS_SECRET = process.env.AWS_SECRET_ACCESS_KEY
const EMAIL_ACCESS = process.env.EMAIL_PASS
const saltRounds = 10;
const PORT = process.env.PORT || 5000
const Psession = require("connect-pg-simple")(session)
const { Pool } = require("pg")
var cors = require('cors')
var pool

var NodeGeocoder = require('node-geocoder');   // map

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: AIzaSyCtOdXVisgfJwqevIlmYAHcH8I9EZ5wzRE,
  formatter: null
};

var geocoder = NodeGeocoder(options); /// google map geocoding

//user database access
pool = new Pool({
  //connectionString:'postgres://postgres:SFU716!!qusrlgus@localhost/users' //-for keenan
  // connectionString:'postgres://postgres:@localhost/postgres' //- for Jieung
  // connectionString: "postgres://postgres:khoakhung@localhost/sfupb",
  //connectionString: "postgres://postgres:cmpt276@localhost/postgres"
  connectionString: process.env.DATABASE_URL,

})

//login session access
var app = express()
app.use(
  session({
    store: new Psession({
      //conString:'postgres://postgres:SFU716!!qusrlgus@localhost/postgres'
      conString: process.env.DATABASE_URL,
      //conString:'postgres://postgres:cmpt276@localhost/postgres'
      // conString: "postgres://postgres:khoakhung@localhost/postgres",
      // conString: "postgres://postgres:@localhost/postgres", //kai
    }),
    secret: "!@SDF$@#SDF",
    resave: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    saveUninitialized: true,
  })
)

// generating random password for forgot password and forgot id
function randomString(size = 15) {
  return Crypto
    .randomBytes(size)
    .toString('base64')
    .slice(0, size)
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use("/", cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, "public")))
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.get("/", (req, res) => res.render("pages/index"))


//check whether a user did log-in or not before accessing the mainpage to show different contents
app.get("/mainpage", (req, res) => {
  if (isLogedin(req, res)) {
    if (req.session.ID.trim() == "admin") {
      res.render("pages/mainpage", {
        uname: req.session.displayName,
        admin: true,
      })
    } else {
      res.render("pages/mainpage", {
        uname: req.session.displayName,
        admin: false,
      })
    }
  } else {
    res.render("pages/mainpage", { uname: false, admin: false })
  }
})

//path to sign-up page
app.get("/signUp", (req, res) => {
  res.render("pages/signUp")
})


//path to find pw page
app.get("/find_pw", (req, res) => {
  res.render("pages/find_pw")
})

//path to database page(shows every user information excerp for passwords)
app.get(
  "/fpowefmopverldioqwvyuwedvyuqwgvuycsdbjhxcyuqwdyuqwbjhcxyuhgqweyu",
  (req, res) => {
    var getUsersQuery = "SELECT * FROM backpack"
    pool.query(getUsersQuery, (error, result) => {
      if (error) res.end(error)
      var results = { rows: result.rows }
      res.render("pages/db", results)
    })
  }
)

//allowing the Admin to delete a user from backpack database
app.post("/admin_deleteUser", (req, res) => {
  var id = req.body.uid
  var checking = [id];
  /*For Testing admin deleting user's account
  var admin = req.body.admin;
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    if (id === '123') {
      var after = '';
    } else {
      var after = '123';
    }
    ob = {'Admin':admin, 'Deleting_User':id, 'After_Delete_User':after};
    us.push(ob);
    res.json(us);
  }); */

  // delete this user id from the backpack database
  var insertUsersQuery = `DELETE FROM backpack WHERE uid=$1`
  pool.query(insertUsersQuery, checking, (error, result) => {
    if (error) res.end(error)
    pool.query(`DELETE FROM review WHERE written_user=$1 OR about_user=$1`, checking, (error, result) => {
      if (error) res.end(error)
      pool.query(`DELETE FROM cart WHERE uid=$1`, checking, (error, result) => {
        if (error) res.end(error)
        pool.query(`DELETE FROM chatlist WHERE receiver=$1 OR SENDER=$1`, checking, (error, result)=> {
          if (error) res.end(error)
          pool.query(`DELETE FROM img WHERE uid=$1`, checking, (error, result) => {
            if (error) res.end(error)
            else {
              //If succesfully deleted, the user is logged-out, deleted account then taken back to the mainpage
              res.redirect(
                "/fpowefmopverldioqwvyuwedvyuqwgvuycsdbjhxcyuqwdyuqwbjhcxyuhgqweyu"
              )
            }
          })
        })
      })
    })
  })
})

//Allows admin to delete improper posts
app.post("/admin_deletePost", (req, res) => {
  var uid = req.body.uid
  var bookname = req.body.bookname
  var coursename = req.body.coursename
  var values = [uid, bookname]
  var postid = req.body.postid
  /*For Testing admin deleting user's post
  var admin = req.body.admin;
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    if (uid === '123' && bookname === 'CMPT') {
      var after = '';
    } else {
      var after = '123';
    }
    ob = {'Admin':admin, 'Deleting_Post_User':uid, 'Deleting_Post_Bookname':bookname, 'After_Delete_User':after};
    us.push(ob);
    res.json(us);
  }); */

  if (uid && bookname) {
    //Delete the post that has this user id and bookname from the img database.
    pool.query(
      `DELETE FROM img WHERE postid=$1`,[postid], (error, result) => {
        if (error)
        { res.end(error) }
        //After deleting, redirects user to the most recent course section from buying page.
        pool.query(`DELETE FROM cart WHERE postid=$1`,[postid],(error, result) => {
          if (error){
            res.end(error)
          }
          var redirect_to = "post/"
          res.redirect(redirect_to + coursename)
        })
      }
    )
  }
})

function starAveragerating (reviews) {
  let ratingsTotal = 0;
  let avgRating = 0;
	if(reviews.length) {
		reviews.forEach(review => {
			ratingsTotal += review.rating;
    });
    avgRating = Math.round((ratingsTotal / reviews.length) * 10) / 10;
	} else {
		avgRating = ratingsTotal;
	}
  const floorRating = Math.floor(avgRating);
  if (floorRating) {
    var values = [floorRating, avgRating, reviews.length];
    return values;
  }
  else {
    var values = [0,0, reviews.length]
    return values;
  }
};

//Leads to the page with selected item's information, reviews, map, etc.
app.get("/select_page/:id", (req, res) => {
  var postid = parseInt(req.params.id);
            // TESTING UNIT FOR SELECT_PAGE/:ID
            //   if (postid == 1) {
            //     var ccourse = 'arch'
            //     var cuid = '123'
            //     var cost = '100'
            //     var cbookname = 'introduction to arch'
            //     var clocation = 'Vancouver'
            //     var clat = 49.2827;
            //     var clng = -123.1207;
            //     var query1 = `....`
            //     pool.query(query1, (error, result)=> {
            //       us= [];
            //       ob = {course: ccourse, bookname: cbookname, postid: postid, uid: cuid, cost: cost, location: clocation, lat: clat, lng:clng }
            //       us.push(ob);
            //       res.json(us);
            //     })
            //   } else {
            //     var ccourse = 'cmpt'
            //     var cuid = '321'
            //     var cost = '50'
            //     var cbookname = 'introduction to arch'
            //     var clocation = 'Vancouver'
            //     var clat = 49.2827;
            //     var clng = -123.1207;
            //     var query1 = `....`
            //     pool.query(query1, (error, result)=> {
            //       us= [];
            //       ob = {course: ccourse, bookname: cbookname, postid: postid, uid: cuid, cost: cost, location: clocation, lat: clat, lng:clng }
            //       us.push(ob);
            //       res.json(us);
            //   })
            // }
  if (postid) {
    //Select all data from the table img where the postid is equal to requested id
    pool.query(
      `SELECT * FROM img WHERE postid=$1`,
      [postid],
      (error, result) => {
        if (error) {
          res.end(error)
        }
        var results = result.rows;
        var uidOnly = result.rows[0].uid;
        //returns all the reviews about the seller of the page
        pool.query(`SELECT * FROM review WHERE about_user=$1`, [uidOnly], (error, result) => {
          if (error) {
            res.end(error);
          }
          var reviews = result.rows;
          var values = starAveragerating(reviews);
        if (isLogedin(req, res)) {
          // This is login and logout function
          if (req.session.ID.trim() == "admin") {
            res.render("pages/select", {
              results, reviews,values,
              uname: req.session.displayName,
              userID: req.session.ID,
              admin: true,
            })
          } else {
            res.render("pages/select", {
              results, reviews,values,
              uname: req.session.displayName,
              userID: req.session.ID,
              admin: false,
            })
          }
        } else {
          res.redirect("/login");
        }
      });
      })
  }
})


//Posts the review written by the buyer
app.post("/post_review", (req, res) => {
  var uid = req.session.ID;
  var sellerID = req.body.sellerID;
  var review = req.body.review;
  var postID = req.body.postID;
  var rating = req.body.rating;
  // current date + time
  var date_ob = new Date();
  var date = ("0" + date_ob.getDate()).slice(-2);
  var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  var year = date_ob.getFullYear();
  var hours = date_ob.getHours();
  var vancouver_time = hours - 7;
  var minutes = date_ob.getMinutes();
  var seconds = date_ob.getSeconds();
  var timestamp = year + "-" + month + "-" + date + " " + vancouver_time + ":" + minutes + ":" + seconds;

  var values = [timestamp, uid, sellerID, review, rating];

  /* For Testing the posting reveiw
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    ob = {'Written_by':'123', 'About_user':sellerID, 'Review':review, 'Date':timestamp};
    us.push(ob);
    res.json(us);
  }); */

  if (uid && sellerID && review) {
    //Inserting the review written to the database
    pool.query(`INSERT INTO review (date, written_user, about_user, description, rating) VALUES ($1, $2, $3, $4, $5)`, values, (error, result)=>{
      if (error)
        res.end(error)
      var backTo = "/select_page/" + postID;
      res.redirect(backTo);
    });
  }
})

//This is for admin to select one of the given user to see their reviews
app.post('/getSelectedReview', (req, res) => {
    var uid = req.body.uid;
    var value = [uid];

    /* For getting review testing
    var written_user = req.body.written_user;
    var data = req.body.data;
    var query1 = '...';
    pool.query(query1, (error, results)=>{
      if (data === 'exist') {
        var exist = 'Get Data';
      } else if (data === 'non-exist') {
        var exist = 'No Reviews Yet';
      }
      us = [];
      ob = {'written_user':written_user, 'date':'2020:07:31 10:44:44', 'description':'this works', 'data':data, 'msg':exist};
      us.push(ob);
      res.json(us);
    }); */

    //get all data from backpack (used to list all users in SFU-Backpack)
    pool.query(`SELECT * FROM backpack`, (error, result) => {
      if (error)
        res.end(error)
      var all_user = result.rows;
      //Finds all review written by the selected user (admin selects the user)
      pool.query(`SELECT * FROM review WHERE written_user=$1`, value, (error, result) => {
        if (error)
          res.end(error)
        var select_Review = result.rows;

        //If no written review found, return none as true so user can be notified in HTML
        if (select_Review[0] === undefined) {
          res.render("pages/adminReview", {select_Review, all_user,
            uname: req.session.displayName, none: true,
            admin: true, uid: uid})
        } else { //else return none = false
            res.render("pages/adminReview", {select_Review, all_user,
              uname: req.session.displayName, none: false,
              admin: true})
        }
      })
    })
})

//This is for user/admin to delete a selected review
app.post('/deleteReview', (req, res) => {
  var written_user = req.body.written_user;
  var date = req.body.date;
  var values = [date, written_user];

  /* For deleting review testing
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    ob = {'written_user':written_user, 'date':date};
    us.push(ob);
    res.json(us);
  }); */

  //Deletes selected review from the user
  pool.query(`DELETE FROM review WHERE date=$1 AND written_user=$2`, values, (error, result) => {
    if (error)
      res.end(error)
    res.redirect('/reviewpage')
  })
})

//This page allows user to view what reviews he/she got from other users, and what reviews user haven written to others
app.get('/reviewpage', (req, res) => {
  var uid = req.session.ID;
  var value = [uid];

  /* This is for testing
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    res.json(us);
  }); */

  // This is login and logout checking functino
  if (isLogedin(req, res)) {
    //Selects all the reviews that were written by the current user
    pool.query(`SELECT * FROM review WHERE written_user=$1`, value, (error, result) => {
      if (error)
        res.end(error)
      var my_reviews = result.rows;
      //Selects all the reviews that were written to the current user
      pool.query(`SELECT * FROM review WHERE about_user=$1`, value, (error, result) => {
        if (error)
          res.end(error)
        var other_reviews = result.rows;
        if (req.session.ID.trim() == "admin") {
          pool.query(`SELECT * FROM backpack`, (error, result) => {
            if (error)
              res.end(error)
            var all_user = result.rows;
            res.render("pages/reviews", { all_user,
              my_reviews, other_reviews,
              uname: req.session.displayName,
              admin: true,

            })
          })
        } else {
          res.render("pages/reviews", {
            my_reviews, other_reviews,
              uname: req.session.displayName,
              admin: false,
            })
          }
        });
      });
    } else {
        //Redirects to the select page
        res.redirect("/login")
      }
})

app.get("/login", (req, res) => {
  res.render("pages/login", {})
})

app.post("/login", (req, res) => {
  var uid = req.body.uid
  var upassword = req.body.upassword
  var values = [uid]

  /* For login testing
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    if (uid === '123' && upassword === '321') {
      var login = 'success';
    } else {
      var login = 'failure';
    }
    us = [];
    ob = {'uid':uid, 'upassword':upassword, 'login':login};
    us.push(ob);
    res.json(us);
  }); */

  //find database if there is a user who matches with the given information
  if (uid && upassword) {
    pool.query("SELECT * FROM backpack WHERE uid=$1",values,(error, result) => {
          if (error) res.end(error)
          else{
            // comparing
            //bcrypt.compare(upassword, result.rows[0].upassword.trim(), function(err, flag){
              if (!result || !result.rows[0]){
                res.render("pages/login", {
                  // if wrong password or ID
                  msg: "Error: Wrong USER ID!",
                })
              }
              else {
                bcrypt.compare(upassword, result.rows[0].upassword.trim(), function(err, flag){
                  if(flag){
                    //user information which was done log-in in a machine is saved
                    req.session.displayName = result.rows[0].uname
                    req.session.is_logined = true
                    req.session.ID = result.rows[0].uid
                    req.session.save(function () {
                      res.redirect("/mainpage")})
                  }
                  else{
                    res.render("pages/login", {
                      // if wrong password or ID
                      msg: "Error: Wrong PASSWORD!",})
                  }
                })
              }
          }
    })
  }
})

app.get("/auth/logout", (req, res) => {
  req.session.destroy(function (err) {
    //destroy session information of the machine
    res.redirect("/mainpage")
  })
})

//check if a user did log-in or not
function isLogedin(req, res) {
  if (req.session.is_logined) {
    return true
  } else {
    return false
  }
}

//add user to database with given information
app.post("/adduser", (req, res) => {
  var uid = req.body.uid.trim();
  var uname = req.body.uname
  var uemail = req.body.uemail
  var upassword = req.body.upassword
  var upasswordcon = req.body.upasswordcon
  var checking = [uid, uemail]


  /* For sign-up testing
  var alreadyExist = req.body.exist;
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    if (alreadyExist === 'no') {
      var duplicate = 'No';
    } else {
      var duplicate = 'Yes';
    }
    us = [];
    ob = {'uid':uid, 'upassword':upassword, 'upasswordcon':upasswordcon, 'uname':uname, 'uemail':uemail, 'duplicate':duplicate};
    us.push(ob);
    res.json(us);
  }); */

  if (upassword === upasswordcon) {
    //check given password and password for confirmation are match

    if (uid && uname && uemail && upassword) {
      pool.query(
        "SELECT * FROM backpack WHERE uid=$1 OR uemail=$2",
        checking,
        (error, result) => {
          //user ID and email are unique, so need to check it
          if (error) {
            res.end(error)
          } else if (result && result.rows[0]) {
            res.render("pages/signUp", {
              // if the ID and the email already in database
              msg: "Error: USER ID or EMAIL is already taken!",
            })
          } else {
            bcrypt.hash(upassword, saltRounds, (err, hash) => {
              if (err) res.end(err)
              var values = [uid, uname, uemail, hash]
              pool.query(
                `INSERT INTO backpack (uid, uname, uemail, upassword) VALUES ($1,$2,$3,$4)`,
                values,
                (error, result) => {
                  /*Edit Jieung*/
                  if (error) res.end(error)
                  else {
                    res.redirect("/login")
                  }
                }
              )
            })
          }
        }
      )
    }
  } else {
    res.render("pages/signUp", {
      // if the two password don't match
      msg: "Error: PASSWORD and CONFIRM PASSWORD have to match!",
    })
  }
})

//Allows user to delete their account permanently
app.post("/deleteuser", (req, res) => {
  var uid = req.body.uid //Requests values that are being modified from profile.ejs
  //var upassword = req.body.upassword;
  var checking = [uid]

  /* For sign-up testing
  var confirmation = req.body.confirmation;
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    ob = {'uid':uid, 'confirmation':confirmation};
    us.push(ob);
    res.json(us);
  });  */

  if (uid) {
    //If user id and password are given, find the user in the database table backpack
    pool.query(
      `SELECT * FROM backpack WHERE uid=$1`,
      checking,
      (error, result) => {
        if (error) res.end(error)
        else {
          //Once the data is gathered, delete the user from the database table backpack
          var insertUsersQuery = `DELETE FROM backpack WHERE uid=$1`
          pool.query(insertUsersQuery, checking, (error, result) => {
            if (error) res.end(error)
            pool.query(`DELETE FROM review WHERE written_user=$1 OR about_user=$1`, checking, (error, result) => {
              if (error) res.end(error)
              pool.query(`DELETE FROM cart WHERE uid=$1`, checking, (error, result) => {
                if (error) res.end(error)
                pool.query(`DELETE FROM chatlist WHERE receiver=$1 OR SENDER=$1`, checking, (error, result)=> {
                  if (error) res.end(error)
                  pool.query(`DELETE FROM img WHERE uid=$1`, checking, (error, result) => {
                    if (error) res.end(error)
                    else {
                      //If succesfully deleted, the user is logged-out, deleted account then taken back to the mainpage
                      req.session.destroy(function (err) {
                        res.redirect("/mainpage")
                      })
                    }
                  })
                })
              })
            })
          })
        }
      }
    )
  }
})

//Edit user's profile to requested values from the user.
app.post("/edituser", (req, res) => {
  if (!isLogedin(req, res)) {
    //If user is not logged-in, user is directed to login page
    res.redirect("/login")
    return false
  }
  var uid = req.body.uid //Requests values that are being modified from profile.ejs
  var uname = req.body.uname
  var uemail = req.body.uemail
  var upassword = req.body.upassword
  var confirm_pwd = req.body.confirm
  var uidOnly = [uid]

  /* For sign-up testing
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    ob = {'uid':uid, 'uname':uname, 'uemail':uemail, 'upassword':upassword, 'confirm_pwd':confirm_pwd};
    us.push(ob);
    res.json(us);
  }); */

  if (uname && uemail && upassword && confirm_pwd) {
    if (confirm_pwd === upassword) {
      //Checks if user provided password matches the confirm password section
      //If do match, modifies the requested fields of the table with given values
      bcrypt.hash(upassword, saltRounds, (err, hash) => {
        if (err) res.end(err)
        var values = [uid, uname, uemail, hash]
        pool.query(
          `UPDATE backpack SET uname=$2, uemail=$3, upassword=$4 WHERE uid=$1`,
          values,
          (error, result) => {
            if (error) res.end(error)
            //Directs user back to the profile page.
            res.redirect("/mypage")
          }
        )
      })
    }
  }
  //Error handling such as mismatch password or blank input given is handled in Javascript from profile.ejs
})

//function for who forgot his/her password. Shows password to user if given information is correct
app.post("/showpassword", (req, res) => {
  var uid = req.body.uid
  var uname = req.body.uname
  var uemail = req.body.uemail
  var values = [uid, uname, uemail]

  /* For finding password testing
  var confirm = req.body.correct;
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    if (confirm === 'yes') {
      var password = '321';
    } else {
      var password = '';
    }
    us = [];
    ob = {'uid':uid, 'uname':uname, 'uemail':uemail, 'password':password};
    us.push(ob);
    res.json(us);
  }); */

  if (uid && uname && uemail) {
    pool.query(
      `SELECT * from backpack where uid=$1 AND uname=$2 AND uemail=$3`,
      values,
      (error, result) => {
        if (error) res.end(error)
        else if (!result || !result.rows[0]) {
          res.render("pages/find_pw", {
            // all the input enter have to be true to send the email
            msg: "INFORMATION is not correct!",
          })
        } else {
            var lock = randomString()
            bcrypt.hash(lock, saltRounds, (err, hash) => {
              if (err) res.end(err)
              var value = [hash,uid]
              pool.query(
                `UPDATE backpack SET upassword=$1 WHERE uid=$2`,value,(error, result) => {
                  if (error) res.end(error)
                  // the email content showing the password
                  const output = `
                      <p>Dear User</p>
                      <p>You have a lost Password request from backpack</p>
                      <ul>
                        <li> User temporary Password: ${lock} </li>
                      </ul>
                      <p> After logging in, please change your temporary password by going to my page: https://sfu-backpack.herokuapp.com/mypage </p>
                      <br>
                      <p>best,</p>
                      <p> Backpack Team </p>
                    `
                  // nodemail gmail transporter
                  var transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                      user: "parkje0623@gmail.com",
                      pass: EMAIL_ACCESS,
                    },
                  })

                  // setup email data with unicode symbols
                  let mailOptions = {
                    from: '"backpack Website" <cmpt276backpack@gmail.com>', // sender address
                    to: uemail, // list of receivers
                    subject: "PASSWORD Request", // Subject line
                    html: output, // html body
                  }

                  // send mail with defined transport object
                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      return console.log(error)
                    }
                    res.render("pages/find_pw", { msg: "Email has been sent" })
                  })
                })
              })
          }
        })
  } else { // if one of the inputs are left empty
    res.render("pages/find_pw", {
      msg: "Entre your ID, Name and Email Address Please!",
    })
  }
})

//Profile page that shows information of logged-in user
app.get("/mypage", (req, res) => {
  if (!isLogedin(req, res)) {
    //If no user is logged-in, direct user to log-in page
    res.redirect("/login")
    return false
  }

  var uid = req.session.ID //Grabs an ID of the user signed-in
  var values = [uid]

  if (uid) {
    //If user id is given, take all data of user that matches the given ID
    pool.query(
      `SELECT * FROM backpack WHERE uid=$1`,
      values,
      (error, result) => {
        if (error) res.end(error)
        pool.query(
          `SELECT * FROM img WHERE uid=$1`,
          values,
          (error, img_result) => {
            if (error) res.end(error)
            else {
              //Sends the data to profile.ejs
              var results = { rows: result.rows, field: img_result.rows }
              res.render("pages/profile", results)
            }
          }
        )
      }
    )
  }
})

//Allows for image change in profile page
app.post("/changeImage", (req, res) => {
  var uimage = req.body.uimage //Requests values that are being modified from profile.ejs
  var uid = req.body.uid
  var values = [uimage, uid]
  var uidOnly = [uid]

  /* For changing img testing
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    ob = {'uid':uid, 'uimage':uimage};
    us.push(ob);
    res.json(us);
  });  */


  if (uimage && uid) {
    //Modifies database: uimage field is replaced with new image's filename and its type.
    pool.query(
      `UPDATE backpack SET uimage=$1 WHERE uid=$2`,
      values,
      (error, result) => {
        if (error) res.end(error)
        //Directs user back to the profile page with the changed image.
        res.redirect("/mypage")
      }
    )
  }
})

//function for who forgot his/her ID. Shows ID to user if given information is correct
app.post("/showid", (req, res) => {
  var uname = req.body.uname
  var uemail = req.body.uemail
  var values = [uname, uemail]

  if (uname && uemail) {
    pool.query(
      `SELECT * from backpack where uemail=$1 AND uname=$2`,
      values,
      (error, result) => {
        if (error) res.end(error)
        else if (!result || !result.rows[0]) {
          res.send(`INFORMAION is not correct!`)
        } else {
          res.send(result.rows[0].uid)
        }
      }
    )
  }
})

app.post("/mypage", (req, res) => {
  //Edit Jieung, new feature for profile.ejs
  var uid = req.body.uid
  var values = [uid]
  if (uid) {
    pool.query(
      `SELECT * FROM backpack WHERE uid=$1`,
      values,
      (error, result) => {
        if (error) res.end(error)
        else {
          var results = { rows: result.rows }
          res.render("pages/profile", results)
        }
      }
    )
  } else {
    res.send("Must log-in first")
  }
})

// Setting up Amazon Storage
AWS.config.update({
  accessKeyId: "AKIAI44EZNSIFUGUUODA",
  secretAccessKey: "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",
  region: "us-west-2",
})
// initiate the storage
const S3 = new AWS.S3()

const upload = multer({
  // Create Multer-S3 Function for Storage
  storage: multerS3({
    s3: S3,
    acl: "public-read",
    bucket: "backpacksfu",

    // Changing the file name to be unique (put the time and date instead of filename)
    key: function (req, file, cb) {
      cb(null, new Date().toISOString() + path.extname(file.originalname))
    },
  }),
  // Set default file size upload limit
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB

  // validation of the file extention
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|gif|png/
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    )
    const mimetype = filetypes.test(file.mimetype)
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb("Only jpeg/jpg/png images allowed")
    }
  },
})



app.get("/upload", (req, res) => {
  if (!isLogedin(req, res)) {
    //if user is not login direct them to login page
    res.redirect("/login")
    return false
  } else {
    res.render("pages/imageUpload") // else to upload page
  }
})


const image_upload = upload.single("myImage")
app.post("/upload", function (req, res) { // async function here

  /* For Upload testing
  var path = req.body.path
  var course = req.body.course
  var bookName = req.body.bookName
  var uid = req.body.uid
  var cost = req.body.cost
  var condition = req.body.condition
  var description = req.body.description
  var location = req.body.location
  var duplicate = req.body.duplicate
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    if (duplicate != 'yes') {
      ob = {'path':path, 'course':course, 'bookName':bookName, 'uid':uid, 'cost':cost, 'condition':condition, 'description':description, 'location':location};
      us.push(ob);
    }
    if (duplicate === 'no') {
      db = {'path':path, 'course':course, 'bookName':bookName, 'uid':uid, 'cost':cost, 'condition':condition, 'description':description, 'location':location};
      us.push(db);
    }
    res.json(us);
  });  */

  image_upload(req, res, function (err) {
    if (err) {
      res.render("pages/imageUpload", {
        // if the file is not an image
        msg: err,
      })
    } else {
      if (req.file == undefined) {
        res.render("pages/imageUpload", {
          // if no file was selected
          msg: "Error: No File Selected!",
        })
      } else {
        geocoder.geocode(req.body.location.toLowerCase(), (err, data) => {
          if (err || !data.length) {
            return res.render("pages/imageUpload", {
              // if no file was selected
              msg: "Error: Invalid address",
            })
          }

        var path = req.file.location
        var course = req.body.course.toLowerCase()
        var bookName = req.body.title
        var uid = req.session.ID
        var cost = req.body.cost
        var condition = req.body.condition
        var description = req.body.description
        var checking = [uid, bookName]
        var location = data[0].formattedAddress;  // location
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        /// Get time
        var date_ob = new Date();
        var date = ("0" + date_ob.getDate()).slice(-2);
        var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        var year = date_ob.getFullYear();
        var hours = date_ob.getHours();
        var vancouver_time = hours - 7;
        var minutes = date_ob.getMinutes();
        var seconds = date_ob.getSeconds();
        var timestamp = year + "-" + month + "-" + date + " " + vancouver_time + ":" + minutes + ":" + seconds;

        //Checks if user wanting to post already have the post with the same title
        //Different user can post with same title, but same user cannot post the same title
        pool.query(
          `SELECT * FROM img WHERE uid=$1 AND bookname=$2`,
          checking,
          (error, result) => {
            if (error) {
              res.end(error)
            }
            if (result && result.rows[0]) {
              res.render("pages/imageUpload", {
                //If same title exist for this user, return to selling page
                msg: "Error: User Already Posted Item with Same Title",
              })
            } else {
              // insert the user info into the img database (the image in AWS and the path of image in img database)
              var getImageQuery = `INSERT INTO img (course, path, bookname, uid, cost, condition, description, location, lat, lng, timepost) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`
              // khoa comment out for testing
              // var getImageQuery =
              //   "INSERT INTO img (course, path, bookname, uid, cost, condition, description, location, lat, lng) VALUES('" +
              //   course +
              //   "','" +
              //   path +
              //   "','" +
              //   bookName +
              //   "','" +
              //   uid +
              //   "','" +
              //   cost +
              //   "','" +
              //   condition +
              //   "','" +
              //   description +
              //   "','" +
              //   location + "','" +lat +  "'',''" + lng +
              //   "')"

                ////////////////

              pool.query(getImageQuery, [course, path, bookName, uid, cost, condition, description, location, lat, lng, timestamp], (error, result) => {
                if (error) {
                  res.end(error)
                } else {
                  var updatefts = `UPDATE img SET fts=to_tsvector('english', coalesce(course,'') || ' ' || coalesce(bookname,''));`
                  pool.query(updatefts, (error, result) => {
                    if (error) {
                      res.end(error)
                    }
                  })
                  res.render("pages/imageUpload", {
                    msg: "File Uploaded!", // Sending the path to the database and the image to AWS Storage
                  })
                }
              })
            }
          }
        ) // end query
      })
      }
    }
  })
})

app.get("/reportUser", (req, res) => {
  if (!isLogedin(req, res)) {
    //if user is not login direct them to login page
    res.redirect("/login")
    return false
  } else {
  res.render("pages/reportUser")
  }
})


app.post("/report", (req, res) => {
  //getting the reporting user id and reported user id
  // plus the report --> description of the event
  var id = req.body.uid
  var description = req.body.description
  var uid = req.session.ID

  /* Testing for reporting
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    ob = {'id':id, 'description':description};
    us.push(ob);
    res.json(us);
  }); */

    var getEmailQuery = "SELECT * FROM backpack WHERE uid='" + id + "'" // the reported user id should exist in database
    pool.query(getEmailQuery, (error, result) => {
      if (error) {
        res.end(error)
      }
      else if (!result || !result.rows[0]) {
        res.render("pages/reportUser", {
          msg: "INFORMATION about the User ID is not correct!", //reported user ID is not correct
        })
      }
    })
    var getEmailQuery = "SELECT * FROM backpack WHERE uid='" + uid + "'" //find the reporting user for email
    pool.query(getEmailQuery, (error, result) => {
      if (error) {
        res.end(error)
      }
      else{
        // email content
        const output = `
          <p> REPORT of USER: </p>
          <p>The User: ${uid} and email:${result.rows[0].uemail} has made a report against ${id} </p>
          <p> Report: ${description}</p>
        `
        // nodemail gmail transporter
        var transporter = nodemailer.createTransport({
          service: "gmail",
            auth: {
              user: "parkje0623@gmail.com",
              pass: EMAIL_ACCESS,
            },
        })

        // setup email data with unicode symbols
        let mailOptions = {
          from: '"backpack Website" <cmpt276backpack@gmail.com>', // sender address
          to: 'cmpt276backpack@gmail.com', // list of receivers
          subject: "Reporting A User", // Subject line
          html: output, // html body
        }

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error)
          }
          res.render("pages/reportUser", { msg: "Report has been sent" })
        })
      }
    })
});

app.get("/find_id", (req, res) => {
  res.render("pages/find_id") //find id page
})

app.post("/sendEmail", (req, res) => {
  //get the email of the user from form
  var email = req.body.uemail

  /* For finding id testing
  var confirm = req.body.correct;
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    if (confirm === 'yes') {
      var findID = '123';
    } else {
      var findID = '';
    }
    us = [];
    ob = {'findID':findID, 'uemail':email};
    us.push(ob);
    res.json(us);
  });  */

  if (email) {
    var getEmailQuery = "SELECT * FROM backpack WHERE uemail='" + email + "'" // find the email in db
    pool.query(getEmailQuery, (error, result) => {
      if (error) {
        res.end(error)
      } else if (!result || !result.rows[0]) {
        res.render("pages/find_id", {
          // all the input enter have to be true to show the PASSWORD
          msg: "INFORMATION is not correct!",
        })
      } else {
        var lock = randomString()
        bcrypt.hash(lock, saltRounds, (err, hash) => {
          if (err) res.end(err)
          var values = [hash,result.rows[0].uid]
          var uid = result.rows[0].uid
          pool.query(`UPDATE backpack SET upassword=$1 WHERE uid=$2`,values,(error, result) => {
              if (error) res.end(error)
              // content of the email being send
              const output = `
                <p>Dear User</p>
                <p>You have a lost ID and Password request from backpack</p>
                <ul>
                  <li> User ID: ${uid} </li>
                  <li> new temporary Password: ${lock} </li>
                </ul>
                <p> After logging in, please change your temporary password by going to my page: https://sfu-backpack.herokuapp.com/mypage </p>
                <br>
                <p>best,</p>
                <p> Backpack Team </p>
              `
            // nodemail gmail transporter
            var transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: "parkje0623@gmail.com",
                pass: EMAIL_ACCESS,
              },
            })

            // setup email data with unicode symbols
            let mailOptions = {
              from: '"backpack Website" <cmpt276backpack@gmail.com>', // sender address
              to: email, // list of receivers
              subject: "ID and PASSWORD Request", // Subject line
              html: output, // html body
            }

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                return console.log(error)
              }
              res.render("pages/find_id", { msg: "Email has been sent" })
            })
          })
        })
      }
    })
  } else { // if the submitted with no input
    res.render("pages/find_id", { msg: "Entre your Email Address Please!" })
  }
})

//  BUYINGPAGE WORK HERE - ASK ME IF THERE IS ANY PROBLEMS - khoa
app.get("/buy", (req, res) => {
  // This will return a first buying page and have login function
  var getUsersQuery = `SELECT * FROM img`
  pool.query(getUsersQuery, (error, result) => {
    if (error) {
      res.end(error)
    }
    var results = result.rows

    if (isLogedin(req, res)) {
      // This is login and logout function
      if (req.session.ID.trim() == "admin") {
        res.render("pages/buyingpage", {
          results,
          uname: req.session.displayName,
          admin: true,
        })

      } else {
        res.render("pages/buyingpage", {
          results,
          uname: req.session.displayName,
          admin: false,
        })
      }
    } else {
      res.render("pages/buyingpage", { results, uname: false, admin: false })
    }
  })
})

app.get("/post/:id", (req, res) => {
  // This will lead to books with specific course
  var cname = req.params.id // Get data from course name
  pool.query(`SELECT * FROM img WHERE course=$1 ORDER BY postid DESC`, [cname], (error, result) => {
    if (error) {
      res.end(error)
    }
    var results = result.rows // Will return data from img table

    if (isLogedin(req, res)) {
      // This is login and logout function
      if (req.session.ID.trim() == "admin") {
        res.render("pages/buyingPageReload", {
          results,
          uname: req.session.displayName,
          admin: true,
        })
      } else {
        res.render("pages/buyingPageReload", {
          results,
          uname: req.session.displayName,
          admin: false,
        })
      }
    } else {
      res.render("pages/buyingPageReload", {
        results,
        uname: false,
        admin: false,
      })
    }
  })
})

//socket server code starts//
var socket = require("socket.io")
var http = require("http")
var server = http.createServer(app)
var io = socket(server, { path: "/socket.io" })

//move to chatting page
app.post("/chat", (req, res)=> {
    /*Testing for chatting
    var receiver=req.body.receiver;
    var query1 = `...`;
    pool.query(query1, (error, results)=>{
        us = [];
        ob = {'r':receiver};
        us.push(ob);
        res.json(us);
    });*/
    if(isLogedin(req, res)) {
        var receiver=req.body.receiver;//opponent client information
        if(!receiver){
            res.redirect("/mainpage");
        }
        else{
            pool.query(`SELECT * FROM chatlist WHERE (sender=$1 AND receiver=$2) OR (sender=$2 AND receiver=$1) ORDER BY num ASC`,[receiver, req.session.ID], (error,result)=>{ //find previous chatting logs
                if(error){
                    res.end(error);
                }
                if (req.session.ID.trim() == "admin") {
                    admin=true;
                }
                else{
                    admin=false;
                }

                if (!result || !result.rows[0]) {
                    res.render("pages/chat",{uname: req.session.displayName, db:false, receiver:receiver, sender:req.session.ID});
                }
                else{
                    pool.query(`UPDATE chatlist SET new='f' WHERE (sender=$1 AND receiver=$2)`,[receiver, req.session.ID], (error2, result2)=>{
                        if(error2){
                            res.end(error2);
                        }
                    })
                    var results = result.rows;
                    res.render("pages/chat",{uname: req.session.displayName, db:true ,results, receiver:receiver, sender:req.session.ID});
                }
            })
        }
    }
    else{
        res.redirect("/login");
    }
})

//move to chatting list page. Users can see the every chatting rooms of user involved
app.get("/chatlist", (req, res)=>{
    /*Testing for chatting
    var receiver = req.body.receiver
    var sender = req.body.sender
    var sendingID = req.body.sendingID
    var receivingID = req.body.receivingID
    var related = req.body.unrelated_user
    var query1 = `...`;
    pool.query(query1, (error, results)=>{
      us = [];
      ob = {'sender':sender, 'receiver':receiver, 'sendingID':sendingID, 'receivingID':receivingID};
      us.push(ob);
      if (related === 'admin') {
        db = {'sender':related, 'other_receivingID':'not 321'}
        us.push(db);
      }
      res.json(us);
    }); */
    var admin;
    if(isLogedin(req, res)) {
        pool.query(`SELECT * FROM chatlist WHERE (receiver=$1 OR sender=$1)`,[req.session.ID], (error,result)=>{//find chatting logs which the user involved
            if(error){
                res.end(error);
            }

            if (req.session.ID.trim() == "admin") {
                admin=true;
            }
            else{
                admin=false;
            }

            if (!result || !result.rows[0]) {
                res.render("pages/chatlist",{db:false,  uname:req.session.displayName, admin});
            }
            else{
                var results = result.rows;
                res.render("pages/chatlist",{uid:req.session.ID,db:true ,results, uname:req.session.displayName, admin});
            }
        })
    }
    else{
        res.redirect("/login");
    }
})

io.sockets.on("connection", function (socket) {
    socket.on("username", function (username) {
        socket.username = username; //user's name
    })
    socket.on("receiver", function(receiver){
        socket.receiver=receiver; //opponent
    })
    socket.on("sender", function(sender){
        socket.sender=sender; //user
    })
    socket.on("room", function(room){
        socket.join(room); //private room
        socket.room=room;
    })
    socket.on("chat_message", function(message){
        io.in(socket.room).emit("chat_message", "<strong>" + socket.username + "</strong>: " + message);
        pool.query(`Select * from chatlist WHERE (sender=$1 AND receiver=$2) OR (sender=$2 AND receiver=$1)`,[socket.receiver,socket.sender], (error2, result2)=>{ //saves chatting log
            if(error2){
                throw(error2);
            }
            var len=result2.rows.length;
            pool.query(`INSERT INTO chatlist (receiver, sender, texts, senderID, new, num) VALUES ($1, $2, $3, $4, 't', $5)`,[socket.receiver,socket.sender, message, socket.username, len], (error, result)=>{ //saves chatting log
                if(error){
                    throw(error);
                }
            })
        })
    })
    socket.on("disconnect", function(){
        pool.query(`UPDATE chatlist SET new='f' WHERE (sender=$1 AND receiver=$2)`,[socket.receiver,socket.sender], (error, result)=>{ //saves chatting log
            if(error){
                throw(error);
            }
        })
    })
})
//socket server code end//
///////////////////////////////

// SEARCH //////////
function search(search_string, func) {
  pool.query( "SELECT * FROM img WHERE fts @@ to_tsquery('english', $1)", [search_string],
  function(err, result) {
    if (err) {
      func([])
    } else {
      func(result.rows)
    }
  }
  );
}
app.get('/search', function(req, res) {

  /*Testing for chatting
  var itemSearched = req.body.itemSearched
  var listOfItems = ['cmpt', 'Intro to cmpt', 'MACM', 'MATH', 'cmpt master']
  var query1 = `...`;
  pool.query(query1, (error, results)=>{
    us = [];
    for (let i = 0; i < listOfItems.length; i++) {
      if (listOfItems[i].includes(itemSearched) && itemSearched != '') {
        ob = {'itemSearched':listOfItems[i]};
        us.push(ob);
      }
    }
    res.json(us);
  })  */

  if (typeof req.query.text !== 'undefined') {
      search(req.query.text, function(data_items) {
        var results = data_items
        if (isLogedin(req,res)){
          if (req.session.ID.trim() == "admin"){
            res.render("pages/searchReload", {
              results,
              uname: req.session.displayName,
              admin: true,
            })
          }
          else {
            res.render("pages/searchReload",{
              results,
              uname: req.session.displayName,
              admin: false,
            })
          }
        }
        else{
          res.render("pages/searchReload", {results, uname: false, admin: false})
        }
      })
  } else {
     res.redirect("pages/buyingpage")
  }
})

erro = ""
app.get("/updatepost/:id", (req, res) => {

  /*Testing for update post
  var postid = req.body.postid
  var uid = req.body.uid
  var query1 = `...`;
  pool.query(query1, (error, results)=>{
    us = [];
    ob = {'postid':postid, 'uid':uid};
    us.push(ob);
    res.json(us);
  })  */

  var postid = parseInt(req.params.id)
  var uid = req.session.ID //Grabs an ID of the user signed-in
  if (uid && postid){
    //If user id is given, take all data of user that matches the given ID
    pool.query(`SELECT * FROM backpack WHERE uid=$1`,[uid],(error, result) => {
        if (error)
          res.end(error)
        pool.query(`SELECT * FROM img WHERE postid=$1`,[postid],(error, img_result) => {
            if (error)
              res.end(error)
            else {
              //Sends the data to imageUpdate.ejs
              var results = { rows: result.rows, field: img_result.rows, msg:erro}
              res.render("pages/imageUpdate", results)
            }
        })
    })
  }
});


const image_update = upload.single("myImage")
app.post("/updatepost", function (req, res) { // async function here

  /* For updating post testing
  var path = req.body.path
  var course = req.body.course
  var bookName = req.body.bookName
  var uid = req.body.uid
  var cost = req.body.cost
  var condition = req.body.condition
  var description = req.body.description
  var location = req.body.location
  var duplicate = req.body.duplicate
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    if (duplicate != 'yes') {
      ob = {'path':path, 'course':course, 'bookName':bookName, 'uid':uid, 'cost':cost, 'condition':condition, 'description':description, 'location':location};
      us.push(ob);
    }
    if (duplicate === 'no') {
      db = {'path':path, 'course':course, 'bookName':bookName, 'uid':uid, 'cost':cost, 'condition':condition, 'description':description, 'location':location};
      us.push(db);
    }
    res.json(us);
  }); */

  image_update(req, res, function (err) {
    var postid = req.body.postid
    if (err) {
      erro = err
      res.redirect(`/updatepost/${postid}?`)
        // if the file is not an image
        //msg: err,
    } else {
      if (req.file == undefined) {
        erro = "Error: No File Selected!"
        res.redirect(`/updatepost/${postid}?`)
          // if no file was selected
          //msg: "Error: No File Selected!",


      } else {

        geocoder.geocode(req.body.location, (err, data) => {
          if (err || !data.length) {
            erro = "Error: Invalid address"
            return res.redirect(`/updatepost/${postid}?`)
          }

        var path = req.file.location
        var course = req.body.course.toLowerCase()
        var bookName = req.body.title
        var uid = req.session.ID
        var cost = req.body.cost
        var condition = req.body.condition
        var description = req.body.description
        var checking = [uid, bookName]
        var location = data[0].formattedAddress;  // location
        var lat = data[0].latitude;
        var lng = data[0].longitude;

        //Checks if user wanting to post already have the post with the same title
        //Different user can post with same title, but same user cannot post the same title
        pool.query(
          `SELECT * FROM img WHERE uid=$1 AND bookname=$2`,
          checking,
          (error, result) => {
            if (error) {
              res.end(error)
            }
            if (result && result.rows[0]) {
                //If same title exist for this user, return to selling page
                //msg: "Error: User Already Posted Item with Same Title",
                erro = "Error: User Already Posted Item with Same Title"
                res.redirect(`/updatepost/${postid}?`)

            } else {
              // insert the user info into the img database (the image in AWS and the path of image in img database)
              var getImageQuery = `UPDATE img SET course=$1, path=$2, bookname=$3, uid=$4, cost=$5, condition=$6, description=$7, location=$8, lat=$9, lng=$10 WHERE postid=$11`

              pool.query(getImageQuery, [course, path, bookName, uid, cost, condition, description, location, lat, lng, postid], (error, result) => {
                if (error) {
                  res.end(error)
                } else {
                  var updatefts = `UPDATE img SET fts=to_tsvector('english', coalesce(course,'') || ' ' || coalesce(bookname,''));`
                  pool.query(updatefts, (error, result) => {
                    if (error) {
                      res.end(error)
                    }
                  })
                  res.redirect(`/select_page/${postid}?`)
                    //msg: "File Updated!", // Sending the path to the database and the image to AWS Storage

                }
              })
            }
          }
        ) // end query
      })
      }
    }
  })
});

// Sold button
app.post("/seller_sold", (req, res) => {
  var postid = req.body.postid

  /* For sold testing
  var query1 = '...';
  var databaseID = '1';
  pool.query(query1, (error, results)=>{
    if (databaseID === postid) {
      us = [];
      res.json(us);
    }
  }); */

  if (postid) {
    pool.query(
      `DELETE FROM img WHERE postid=$1`,
      [postid],
      (error, result) => {
        if (error){
          res.end(error)
        }
        pool.query(`DELETE FROM cart WHERE postid=$1`,[postid],(error, result) => {
            if (error){
              res.end(error)
            }
            res.redirect("/mypage")
          })
      }
    )
  }
})


app.get("/cart", (req,res) => {

  /* For cart testing
  var uid = req.body.uid
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    ob = {'uid':uid};
    us.push(ob);
    res.json(us);
  }); */

  pool.query(`SELECT postid, uid, bookname, cost, path, condition FROM img WHERE postid in (SELECT postid FROM cart WHERE uid = $1)`, [req.session.ID], (error, result) =>{
    if (error) {
      res.end(error)
    }
    var results = result.rows
    if (isLogedin(req, res)) {
    // This is login and logout function
    if (req.session.ID.trim() == "admin") {
      res.render("pages/cart", {
        results,
        uname: req.session.displayName,
        admin: true,
      })

    } else {
      res.render("pages/cart", {
        results,
        uname: req.session.displayName,
        admin: false,
      })
    }
  } else {
    res.render("pages/cart", { results, uname: false, admin: false })
  }
  })
})

app.post("/add_to_cart", (req,res) => {
  var postid = req.body.postid
  var bookname = req.body.bookname
  var cost = req.body.cost
  var image = req.body.image
  var condition = req.body.condition

  /* For adding to cart testing
  var uid = req.body.uid
  var duplicate = req.body.duplicate
  var query1 = '...';
  pool.query(query1, (error, results)=>{
    us = [];
    ob = {'uid':uid, 'postid':postid, 'bookname':bookname, 'cost':cost, 'image':image, 'condition':condition, 'duplicate':duplicate};
    us.push(ob);
    res.json(us);
  }); */

  if(isLogedin){
    var uid = req.session.ID
    if(postid){
      pool.query (`SELECT * FROM cart WHERE postid = $1 and uid = $2`, [postid, uid], (error, result) =>{
        if (error) {
          res.end (error)
        }
        else if (result && result.rows[0]) { //check duplication of items
          pool.query(`SELECT postid, uid, bookname, cost, path, condition FROM img WHERE postid in (SELECT postid FROM cart WHERE uid = $1)`, [req.session.ID], (error, result) =>{
            if (error) {
              res.end(error)
            }
            var results = result.rows
          if (req.session.ID.trim() == "admin") {
            res.render("pages/cart", {
              results,
              uname: req.session.displayName,
              admin: true,
              msg: "Item is already in the cart", //page render with error message
            })
          } else {
            res.render("pages/cart", {
              results,
              uname: req.session.displayName,
              admin: false,
              msg: "Item is already in the cart",
            })
          }
        })
        }
        else {
          pool.query(`INSERT INTO cart (uid, postid) VALUES ($1, $2)`, [uid, postid], (error, result) => {
            if(error){
              res.end(error);
              }
            res.redirect("/cart");
          })
        }
      })
    }
  }
  else{
    res.redirect("/login");
  }
})

app.post("/delete_cart", (req, res) => {
  var postid = req.body.postid;

  /* For delete from cart testing
  var query1 = '...';
  var postid_From_DB = '1';
  pool.query(query1, (error, results)=>{
    if (postid === postid_From_DB) {
      us = [];
      res.json(us);
    }
  }); */

  if(isLogedin){
      if(postid){
          pool.query(`DELETE FROM cart WHERE postid=$1 AND uid=$2`,[postid, req.session.ID], (error, result) => {
              if(error){
                  res.end(error);
              }
              res.redirect("/cart");
          })
      }
  }
  else{
      res.redirect("/login");
  }
})

server.listen(PORT, () => console.log(`Listening on ${PORT}`))
module.exports = app;
