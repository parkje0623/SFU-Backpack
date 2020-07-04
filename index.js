const express = require('express')
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
var pool;
pool = new Pool({
    connectionString:process.env.DATABASE_URL
})

var app = express();
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));

app.post('/auth/login', function(req, res){
    var uid = req.body.uid;
    var upassword = req.body.upassword;
    if(uid!=null && upassword!=null){
        pool.query('SELECT * FROM backpack WHERE uid=$1 OR upassword=$2', [uid], [upassword] , (error,result)=>{
            if(error)
                res.end(error);
            else if(result&&result.rows[0]){
                res.send(uid);
            }
        });
    }
});



app.post('/adduser', (req, res) => {
    var uid = req.body.uid;
    var uname = req.body.uname;
    var uemail = req.body.uemail;
    var upassword = req.body.upassword;
    var values=[uid, uname, uemail, upassword];
    if(uid && uname && uemail && upassword){
        pool.query('SELECT * FROM backpack WHERE uid=$1 OR uemail=$2', [uid], [uemail] , (error,result)=>{
            if(error)
                res.end(error);
            else if(result&&result.rows[0]){
                res.send(`USER ID or EMAIL is already taken!`);
            }
            else{
                var insertUsersQuery=`INSERT INTO backpack (uid, uname, uemail, upassword) VALUES ($1,$2,$3,$4)`
                pool.query(insertUsersQuery,values, (error,result)=>{
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
    if(uid && upassword){
        pool.query('SELECT * FROM backpack WHERE uid=$1 AND upassword=$2', [uid], [upassword], (error,result)=>{
            if(error)
                res.end(error);
            else if(result&&result.rows[0]){
                res.send(`USER ID or PASSWORD is not correct!`);
            }
            else{
                var insertUsersQuery=`DELETE FROM usr WHERE id=$1`
                pool.query(insertUsersQuery,values, (error,result)=>{
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











app.listen(PORT, () => console.log(`Listening on ${ PORT }`));