const express = require('express')
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path')
const ejs = require('ejs');
const multer = require('multer');
const PORT = process.env.PORT || 5000
const Psession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
var pool;
pool = new Pool({
    //connectionString:'postgres://postgres:SFU716!!qusrlgus@localhost/users'
    connectionString:process.env.DATABASE_URL
})

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload

const upload = multer({
  storage: storage,
  limits:{fileSize: 9000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');


// Check File Type
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only please!');
  }
}  


var app = express();
app.use(session({
    store: new Psession({
        
        //conString:'postgres://postgres:SFU716!!qusrlgus@localhost/postgres'
        conString: process.env.DATABASE_URL

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

app.post('/auth/login', (req, res) =>{
    var uid = req.body.uid;
    var upassword = req.body.upassword;
    var values=[uid, upassword];
    if(uid && upassword){
        pool.query('SELECT * FROM backpack WHERE uid=$1 AND upassword=$2', values , (error,result)=>{
            if(error)
                res.end(error);
            else if(!result||!result.rows[0]){
                res.send(`Who are  you?`);
            }
            else{
                req.session.displayName = result.rows[0].uname;
                res.send(`
                    <h1>hello, ${req.session.displayName} </h1>
                    <a href="/auth/logout">logout</a>
                    `);
            }
        });
    }
});

app.get('/auth/logout', (req, res)=>{
    delete req.session.displayName;
    res.send(`log out`);
});

app.post('/adduser', (req, res) => {
    var uid = req.body.uid;
    var uname = req.body.uname;
    var uemail = req.body.uemail;
    var upassword = req.body.upassword;
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
                pool.query(`INSERT INTO backpack (uid, uname, uemail, upassword) VALUES ($1,$2,$3,$4)`,values, (error,result)=>{
                    if(error)
                        res.end(error);
                    else{
                        res.send(`USER ID: ${uid} HAS BEEN SUBMITTED!`);
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
        pool.query('SELECT * FROM backpack WHERE uid=$1 AND upassword=$2', checking, (error,result)=>{
            if(error)
                res.end(error);
            else if(!result||!result.rows[0]){
                res.send(`USER ID or PASSWORD is not correct!`);
            }
            else{

                var insertUsersQuery=`DELETE FROM backpack WHERE uid=$1`
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
    var uid = req.body.uid;
    var uname = req.body.uname;
    var uemail = req.body.uemail;
    var upassword = req.body.upassword;
    var values=[uid, uname, uemail, upassword];
    var editUsersQuery='UPDATE backpack SET name=$1, age=$2, size=$3, height=$4, type=$5 where id=$6';
    pool.query(editUsersQuery, values, (error,result)=>{
        if(error)
            res.end(error);
        else{
            res.send(`USER ID: ${uid} HAS BEEN EDITED!`);
        }
    })
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

app.get('/upload',(req, res) =>{

      res.render('pages/imageUpload')
});

app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
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
        res.render('pages/imageUpload', {
          msg: 'File Uploaded!',
          file: `uploads/${req.file.filename}`,

        });
        var course = req.body.course;
        var path = 'uploads/' + req.file.filename
        var bookName = req.body.title;
        var uid = req.body.uid;
        var values=[course, path, bookName, uid];

        var getImageQuery='INSERT INTO img (course, path, bookname, uid) VALUES ($1,$2,$3,$4)';
        pool.query(getImageQuery, values, (error,result)=>{
          if(error)
              res.end(error);
          else{
              res.send(`IMAGE ADDED TO DATABASE PATH: ${path}`);
          }
        })
      }
    }
  });
});


app.listen(PORT, () => console.log(`Listening on ${ PORT }`));