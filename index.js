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
                res.redirect('/login');
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

app.get('/sign_up', (req, res)=>{
    res.redirect('/sign_up.html');
});






app.post('/adduser', (req, res) => {
    var uid = req.body.uid;
    var uname = req.body.uname;
    var uemail = req.body.uemail;
    var upassword = req.body.upassword;
    var upasswordcon=req.body.upasswordcon;
    var checking = [uid, uemail];
    var values=[uid, uname, uemail, upassword];
    if(uid && uname && uemail && upassword){
        pool.query('SELECT * FROM backpack WHERE uid=$1 OR uemail=$2', checking , (error,result)=>{
            if(error){
                res.end(error);
            }
            else if(result&&result.rows[0]){
                res.send(`USER ID or EMAIL is already taken!`);
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

});

app.post('/deleteuser', (req, res) => {
    var uid = req.body.uid;
    var upassword = req.body.upassword;
    var checking =[uid, upassword]
    if(uid && upassword){
        pool.query('SELECT * FROM backpack WHERE uid=$1 AND password=$2', checking, (error,result)=>{
            if(error)
                res.end(error);
            else if(!result||!result.rows[0]){
                res.send(`USER ID or PASSWORD is not correct!`);
            }
            else{

                var insertUsersQuery=`DELETE FROM backpack WHERE uid=$1`;
                pool.query(insertUsersQuery, [uid], (error,result)=>{
                    if(error)
                        res.end(error);
                    else{
                        res.send(`USER ID: ${uid} HAS BEEN DELETED!`);
                    }
                })
            }
        })
    }
});

app.post('/edituser', (req, res) => {
    if(!isLogedin(req,res)){
        res.redirect('/login');
        return false;
    }
    var uid = req.body.uid;
    var uname = req.body.uname;
    var uemail = req.body.uemail;
    var upassword = req.body.upassword;
    var confirm_pwd = req.body.confirm;
    var values=[uid, uname, uemail, upassword];
    if(uname && uemail && upassword && confirm_pwd){ //edited Jieung
      //MUST CHECK IF password = confirm password -> NOT DONE YET
      if (confirm_pwd === upassword) {
        pool.query(`UPDATE backpack SET uname=$2, uemail=$3, upassword=$4 WHERE uid=$1`, values, (error,result)=>{
            if(error)
                res.end(error);
            else{
                res.send(`USER ID: ${uid} HAS BEEN EDITED!`);
            }
        });
      } else {
        res.send("Password do not match");
      }
    }
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

app.get('/mypage', (req, res) => { //Edit Jieung, new feature for profile.ejs
  if(!isLogedin(req,res)){
      res.redirect('/login');
      return false;
  }
  var uid = req.session.ID;
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

app.post('/changeImage', (req, res) => {
  var uimage = req.body.uimage;
  var uid = req.body.uid;
  var values = [uimage, uid];
  var uidOnly = [uid];
  if (uimage && uid) {
    pool.query(`UPDATE backpack SET uimage=$1 WHERE uid=$2`, values, (error, result) => {
      if (error)
        res.end(error);
      pool.query(`SELECT * FROM backpack WHERE uid=$1`, uidOnly, (error, result)=>{
        if(error)
          res.end(error);
        var results = {'rows':result.rows};
        res.render('pages/profile', results);
      });
    });
  }
});

// SETTING UP AMAZON STORAGE
AWS.config.update({
  accessKeyId:  AWS_ID,
  secretAccessKey: AWS_SECRET,
  region: 'us-west-2'
})

const S3 = new AWS.S3();

var upload = multer({
    // CREATE MULTER-S3 FUNCTION FOR STORAGE
    storage: multerS3({
        s3: S3,
        acl: 'public-read',
        bucket: BUCKET_NAME,

        // SET / MODIFY ORIGINAL FILE NAME. ///// to be done shiva
        key: function (req, file, cb) {
            cb(null, file.originalname); //set unique file name if you wise using Date.toISOString()
            // EXAMPLE 1
            // cb(null, Date.now() + '-' + file.originalname);
            // EXAMPLE 2
            // cb(null, new Date().toISOString() + '-' + file.originalname);

        }
    }),
    // SET DEFAULT FILE SIZE UPLOAD LIMIT
    limits: { fileSize: 1024 * 1024 * 50 }, // 50MB
    // FILTER OPTIONS LIKE VALIDATING FILE EXTENSION
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb("Error: Allow images only of extensions jpeg|jpg|png !");
        }
    }
});
app.post('/upload', upload.single('myImage'), function (req, res, next) {
    res.send(`Done`)
});
app.get('/upload',(req, res) =>{

<<<<<<< HEAD

const image_upload = upload.single('myImage');
app.post('/upload', function (req, res){
	image_upload(req, res, function(err){
		if(err){
      		res.render('pages/imageUpload', {
        	msg: err
      		});
    	}
    	else {
      		if(req.file == undefined){
        		res.render('pages/imageUpload', {
          		msg: 'Error: No File Selected!'
        		});
      		}
     		else {
        		var path = req.file.location;
         		var course = req.body.course;
         		var bookName = req.body.title;
         		var uid = req.body.uid; ///////////// change before submit // shiva
            //var uid =  req.session.ID;
        		var getImageQuery="INSERT INTO img (course, path, bookname, uid) VALUES('" + course + "','" + path + "','" + bookName + "','"  + uid + "')"
                pool.query(getImageQuery, (error,result)=>{
          			if(error){
              			res.end(error);
          			}
              		else {
           				res.render('pages/imageUpload', {
          				msg: 'File Uploaded!',

        				});
           			}
         		});

     		}

      	}
	});
});

=======
      res.render('pages/imageUpload')
});
>>>>>>> 459cdada1c9f0e76eb756a669dcffa882b6348a3


//  BUYINGPAGE WORK HERE - ASK ME IF THERE IS ANY PROBLEMS
app.get("/buy", (req, res) => {
  var getUsersQuery = `SELECT * FROM img`
  pool.query(getUsersQuery, (error, result) => {
    if (error) res.end(error)
    var results = { rows: result.rows }
    res.render("pages/buyingpage", results)
  })
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
app.get('/header', (req, res) => {
    if(isLogedin(req,res)){
        if(req.session.ID.trim()=='admin'){
            res.render('pages/mainpage', {uname:req.session.displayName, uid:true});
        }
        else{
            res.render('pages/mainpage', {uname:req.session.displayName, uid:false});
        }
    }
    else{
        res.render('pages/mainpage', {uname: false, uid: false});
    }
});
///////////////////////////////


app.listen(PORT, () => console.log(`Listening on ${ PORT }`));