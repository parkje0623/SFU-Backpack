const express = require('express');
const path = require('path');
const ejs = require('ejs');
const multer = require('multer');

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


const PORT = process.env.PORT || 5000

var app = express()
  app.use(express.json())
  app.use(express.urlencoded({extended: false}))
  app .use(express.static(path.join(__dirname, 'public')))
  app .set('views', path.join(__dirname, 'views'))
  app .set('view engine', 'ejs')

  app .get('/', (req, res) => res.render('pages/index'))

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
          file: `uploads/${req.file.filename}`
        });
      }
    }
  });
});
  app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
