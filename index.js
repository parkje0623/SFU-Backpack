const express = require('express')
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path')
const ejs = require('ejs');
const multer = require('multer');
const multerS3 = require('multer-s3')
const fs = require('fs');
const AWS = require('aws-sdk');
const AWS_ID = 'AKIAJW23KIMJQF66OE2Q';
const AWS_SECRET = '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';
const BUCKET_NAME = 'cmpt276-uploads';
const PORT = process.env.PORT || 5000
const Psession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
var pool;
pool = new Pool({
    //connectionString:'postgres://postgres:SFU716!!qusrlgus@localhost/users'
    //connectionString:'postgres://postgres:cmpt276@localhost/postgres' //- for Jieung
    connectionString:process.env.DATABASE_URL
})

var app = express();
app.use(session({
    store: new Psession({

        //conString:'postgres://postgres:SFU716!!qusrlgus@localhost/postgres'
        conString: process.env.DATABASE_URL
        //conString:'postgres://postgres:cmpt276@localhost/postgres'

    }),
    secret: '!@SDF$@#SDF',
    resave: false,
    cookie:{ maxAge: 30 * 24 * 60 * 60 * 1000 },
    saveUninitialized: true
}));


app.use(bodyParser.urlencoded({extended:false}));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));

app.get('/mainpage', (req, res) => {
    if(isLogedin(req,res)){
        if(req.session.ID.trim()=='admin'){
            res.render('pages/mainpage', {uname:req.session.displayName, admin:true});
        }
        else{
            res.render('pages/mainpage', {uname:req.session.displayName, admin:false});
        }
    }
    else{
        res.render('pages/mainpage', {uname:false, admin:false});
    }
});

app.get('/sign_up', (req, res)=>{
     res.render('pages/signUp');
 });

app.get('/fpowefmopverldioqwvyuwedvyuqwgvuycsdbjhxcyuqwdyuqwbjhcxyuhgqweyu', (req, res) => {
    var getUsersQuery='SELECT * FROM backpack';
    pool.query(getUsersQuery, (error,result)=>{
        if(error)
            res.end(error);
        var results = {'rows':result.rows}
        res.render('pages/db', results);
    })
});

app.get('/login', (req, res) => {
    res.render('pages/login', {});
});

app.post('/auth/login', (req, res) =>{
    var uid = req.body.uid;
    var upassword = req.body.upassword;
    var values=[uid, upassword];
    if(uid && upassword){
        pool.query('SELECT * FROM backpack WHERE uid=$1 AND upassword=$2', values , (error,result)=>{
            if(error)
                res.end(error);
            else if(!result||!result.rows[0]){
                res.render('pages/login', { // if wrong password or ID
                  msg: 'Error: Wrong USER ID or PASSWORD!'
                });
            }
            else{
                req.session.displayName = result.rows[0].uname;
                req.session.is_logined =true;
                req.session.ID=result.rows[0].uid;
                req.session.save(function(){
                    res.redirect('/mainpage');
                });
             }
        });
    }
});

app.get('/auth/logout', (req, res)=>{
    req.session.destroy(function(err){
        res.redirect('/mainpage');
    });
});

function isLogedin(req, res){
    if(req.session.is_logined){
        return true;
    }
    else{
        return false;
    }
}

function UIstatus(req,res){
     var UI='<a href="/auth/login">login</a>'
     if(isLogedin(req,res)){
         UI='<a href="/auth/logout">logout</a>'
     }
     return UI

 }

 app.get('/dbtest.html', (req, res)=>{
     var html =template.HTML(title, list, UIstatus(req,res));
 });


app.post('/adduser', (req, res) => {
    var uid = req.body.uid;
    var uname = req.body.uname;
    var uemail = req.body.uemail;
    var upassword = req.body.upassword;
    var upasswordcon=req.body.upasswordcon;
    var checking = [uid, uemail];
    var values=[uid, uname, uemail, upassword];
    if(upassword===upasswordcon){

        if(uid && uname && uemail && upassword){
            pool.query('SELECT * FROM backpack WHERE uid=$1 OR uemail=$2', checking , (error,result)=>{
                if(error){
                    res.end(error);
                }
                else if(result&&result.rows[0]){
                    res.render('pages/signUp', { // if the ID and the email already in database
                      msg: 'Error: USER ID or EMAIL is already taken!'
                   });
                }
                else{
                    pool.query(`INSERT INTO backpack (uid, uname, uemail, upassword) VALUES ($1,$2,$3,$4)`,values, (error,result)=>{ /*Edit Jieung*/
                        if(error)
                            res.end(error);
                        else{
                            res.redirect('/login');
                        }
                    })
                }
            })
        }
    }
    else{
        res.render('pages/signUp', { // if the two password don't match
          msg: 'Error: PASSWORD and CONFIRM PASSWORD have to match!'
        });

    }

});

//Allows user to delete their account permanently
app.post('/deleteuser', (req, res) => {
    var uid = req.body.uid; //Requests values that are being modified from profile.ejs
    //var upassword = req.body.upassword;
    var checking = [uid];
    if(uid) {
        //If user id and password are given, find the user in the database table backpack
        pool.query(`SELECT * FROM backpack WHERE uid=$1`, checking, (error,result)=>{
            if(error)
                res.end(error);
            else{
              //Once the data is gathered, delete the user from the database table backpack
              var insertUsersQuery=`DELETE FROM backpack WHERE uid=$1`;
              pool.query(insertUsersQuery, checking, (error,result)=>{
                if(error)
                  res.end(error);
                else{ //If succesfully deleted, the user is logged-out, deleted account then taken back to the mainpage
                  req.session.destroy(function(err){
                      res.redirect('/mainpage');
                  });
                }
              })
            }
        })
    }
});

//Edit user's profile to requested values from the user.
app.post('/edituser', (req, res) => {
    if(!isLogedin(req,res)){ //If user is not logged-in, user is directed to login page
        res.redirect('/login');
        return false;
    }
    var uid = req.body.uid; //Requests values that are being modified from profile.ejs
    var uname = req.body.uname;
    var uemail = req.body.uemail;
    var upassword = req.body.upassword;
    var confirm_pwd = req.body.confirm;
    var values=[uid, uname, uemail, upassword];
    var uidOnly = [uid];

    if(uname && uemail && upassword && confirm_pwd){
      if (confirm_pwd === upassword) { //Checks if user provided password matches the confirm password section
        //If do match, modifies the requested fields of the table with given values
        pool.query(`UPDATE backpack SET uname=$2, uemail=$3, upassword=$4 WHERE uid=$1`, values, (error,result)=>{
            if(error)
                res.end(error);
            pool.query(`SELECT * FROM backpack WHERE uid=$1`, uidOnly, (error, result)=>{
               if(error)
                   res.end(error);
               else{ //Sends all the user data towards profile.ejs file where profile page design is made
                   var results = {'rows':result.rows};
                   res.render('pages/profile', results);
               }
            });
        });
      }
    }
    //Error handling such as mismatch password or blank input given is handled in Javascript from profile.ejs
});


app.post('/showpassword', (req, res) => {
    var uid = req.body.uid;
    var uname = req.body.uname;
    var uemail = req.body.uemail;
    var values=[uid, uname, uemail];
    if(uid && uname && uemail){
        pool.query(`SELECT * from backpack where uid=$1 AND uemail=$2 AND uname=$3`, values, (error, result)=>{
            if(error)
                res.end(error);
            else if(!result||!result.rows[0]){
                res.send(`INFORMAION is not correct!`);
            }
            else{
                res.send(result.rows[0].upassword);
            }
        })
    }
});

//Profile page that shows information of logged-in user
app.get('/mypage', (req, res) => {
  if(!isLogedin(req,res)){ //If no user is logged-in, direct user to log-in page
      res.redirect('/login');
       return false;
   }

   var uid = req.session.ID; //Grabs an ID of the user signed-in
   var values=[uid];
   if(uid){ //If user id is given, take all data of user that matches the given ID
       pool.query(`SELECT * FROM backpack WHERE uid=$1`, values, (error, result)=>{
          if(error)
              res.end(error);
          else{ //Sends the data to profile.ejs
              var results = {'rows':result.rows};
              res.render('pages/profile', results);
          }
      });
  }
});

//Allows for image change in profile page
app.post('/changeImage', (req, res) => {
  var uimage = req.body.uimage; //Requests values that are being modified from profile.ejs
  var uid = req.body.uid;
  var values = [uimage, uid];
  var uidOnly = [uid];
  if (uimage && uid) {
    //Modifies database: uimage field is replaced with new image's filename and its type.
     pool.query(`UPDATE backpack SET uimage=$1 WHERE uid=$2`, values, (error, result) => {
       if (error)
        res.end(error);
      //Grab all the data (even modified image field) of uid equal to the user.
      pool.query(`SELECT * FROM backpack WHERE uid=$1`, uidOnly, (error, result)=>{
        if(error)
          res.end(error);

        //Directs user back to the profile page with the changed image.
        var results = {'rows':result.rows};
        res.render('pages/profile', results);
      });
    });
  }
});




app.post('/showid', (req, res) => {
    var uname = req.body.uname;
    var uemail = req.body.uemail;
    var values=[uname, uemail];
    if(uname && uemail){
        pool.query(`SELECT * from backpack where uemail=$1 AND uname=$2`, values, (error, result)=>{
            if(error)
                res.end(error);
            else if(!result||!result.rows[0]){
                res.send(`INFORMAION is not correct!`);
            }
            else{
                res.send(result.rows[0].uid);
            }
        })
    }
});


app.post('/mypage', (req, res) => { //Edit Jieung, new feature for profile.ejs
  var uid = req.body.uid;
  var values=[uid];
  if(uid){
      pool.query(`SELECT * FROM backpack WHERE uid=$1`, values, (error, result)=>{
          if(error)
              res.end(error);
          else{
              var results = {'rows':result.rows};
              res.render('pages/profile', results);
          }
      });
  } else {

    res.send("Must log-in first");
  }
});

// Setting up Amazon Storage
AWS.config.update({
  accessKeyId:  AWS_ID,
  secretAccessKey: AWS_SECRET,
  region: 'us-west-2'
})

const S3 = new AWS.S3();

const upload = multer({
    // Create Multer-S3 Function for Storage
    storage: multerS3({
        s3: S3,
        acl: 'public-read',
        bucket: BUCKET_NAME,

        // Changing the file name to be unique
        key: function (req, file, cb) {
            cb(null, new Date().toISOString() + path.extname(file.originalname));
        }
    }),
    // Set default file size upload limit
    limits: { fileSize: 1024 * 1024 * 50 }, // 50MB

    // validation of the file extention
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|gif|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Only jpeg/jpg/png images allowed')
        }
    }
});

app.get('/upload',(req, res) =>{
    if(!isLogedin(req,res)){ //if user is not login direct them to login page
      res.redirect('/login');
      return false;
    }
    else{
      res.render('pages/imageUpload')// else to upload page
    }
});


const image_upload = upload.single('myImage');
app.post('/upload', function (req, res){
  image_upload(req, res, function(err){
    if(err){
          res.render('pages/imageUpload', { // if the file is not an image
          msg: err
          });
      }
      else {
          if(req.file == undefined){
            res.render('pages/imageUpload', { // if no file was selected
              msg: 'Error: No File Selected!'
            });
          }
        else {
            var path = req.file.location;
            var course = req.body.course.toLowerCase();
            var bookName = req.body.title;
            var uid =  req.session.ID;
            var cost = req.body.cost
            var condition = req.body.condition
            var description = req.body.description
            var getImageQuery="INSERT INTO img (course, path, bookname, uid, cost, condition, description) VALUES('" + course + "','" + path + "','" + bookName + "','"  + uid + "','" + cost + "','" + condition + "','"  + description + "')"
                pool.query(getImageQuery, (error,result)=>{
                if(error){
                    res.end(error);
                }
                  else {
                  res.render('pages/imageUpload', {
                  msg: 'File Uploaded!', // Sending the path to the database and the image to AWS Storage
                });
                }
            });

        }

      }
  });
});



//  BUYINGPAGE WORK HERE - ASK ME IF THERE IS ANY PROBLEMS
// app.get("/buy", (req, res) => {
//   var getUsersQuery = `SELECT * FROM img`
//   pool.query(getUsersQuery, (error, result) => {
//     if (error) res.end(error)
//     var results = { rows: result.rows }
//     res.render("pages/buyingpage", results)
//   })
// })
app.get("/buy", (req, res) => {
  var getUsersQuery = `SELECT * FROM img`
  pool.query(getUsersQuery, (error, result) => {
    if (error) { res.end(error) }
    var results = { rows: result.rows }
  })
  if(isLogedin(req,res)){
      if(req.session.ID.trim()=='admin'){
          res.render('pages/buyingpage', {results, uname:req.session.displayName, admin:true});
      }
      else{
          res.render('pages/buyingpage', {results,uname:req.session.displayName, admin:false});
      }
  }
  else{
        res.render('pages/buyingpage', {results, uname:false, admin:false});
  }
})
// app.get("/post", (req, res) => {
//   var getUsersQuery = `SELECT * FROM img`
//   pool.query(getUsersQuery, (error, result) => {
//     if (error) res.end(error)
//     var results = { rows: result.rows }
//     res.render("pages/buyingpage", results)
//   })
// })
app.get("/post/:id", (req, res) => {
  console.log(req.params.id)
  var cname = req.params.id
  pool.query(`SELECT * FROM img WHERE course=$1`, [cname], (error, result) => {
    if (error) res.end(error)
    var results = { rows: result.rows }
    res.render("pages/buyingPageReload", results)
  })
})
///////////////////////////////



app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
