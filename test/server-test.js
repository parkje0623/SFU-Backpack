var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index');
var should = chai.should();

chai.use(chaiHttp);

describe('Select page', function() {
  it('Proving params id for /select_page/:id', function(done){
      chai.request(server).get('/select_page/1')
        .end(function(error,res) {
          res.should.have.status(200);
          res.body[0].should.have.property('course');
          res.body[0].should.have.property('postid');
          res.body[0].course.should.equal('arch')
          res.body[0].bookname.should.equal('introduction to arch')
          res.body[0].postid.should.equal(1)
          res.body[0].uid.should.equal('123')
          res.body[0].cost.should.equal('100')
          res.body[0].location.should.equal('Vancouver')
          res.body[0].lng.should.equal(-123.1207)
          res.body[0].lat.should.equal(49.2827)
          done();
        });
    })
});

describe('Reviews', function() {

  //Test Associated With Reviews
  it('should add a review with date, written user and receiving user associated on a successful POST request for /post_review', function(done) {
    chai.request(server).get('/reviewpage').end(function(error, res) {
      var num_review_written_0 = res.body.length;
      chai.request(server).post('/post_review').send({'sellerID':'123', 'review':'Good Book'})
        .end(function(error, res) {
          var num_review_written_1 = res.body.length;
          res.should.have.status(200);
          res.body[0].Written_by.should.equal('123');
          res.body[0].About_user.should.equal('123');
          res.body[0].Review.should.equal('Good Book');
          (num_review_written_1 - num_review_written_0).should.equal(1);
         });
    });
    done();
  })

  it('If writing user have same ID as the seller should fail a request for /post_review', function(done) {
    chai.request(server).get('/reviewpage').end(function(error, res) {
      var num_review_written_0 = res.body.length;
      chai.request(server).post('/post_review').send({'sellerID':'123', 'review':'Good Book'})
        .end(function(error, res) {
          var num_review_written_1 = res.body.length;
          res.should.have.status(200);
          res.body[0].Written_by.should.equal('123');
          res.body[0].About_user.should.not.equal('123');
          res.body[0].Review.should.equal('Good Book');
         });
    });
  })

  it('If values passed by clicking usernames in review page exist in the review Databse, successfully gets the data in /getSelectedReview', function(done) {
    chai.request(server).post('/getSelectedReview').send({'written_user':'123', 'data':'exist'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].written_user.should.equal('123');
        res.body[0].date.should.equal('2020:07:31 10:44:44');
        res.body[0].description.should.equal('this works');
        res.body[0].data.should.equal('exist');
        res.body[0].msg.should.equal('Get Data');
      })
      done();
  })

  it('If values passed by clicking usernames in review page have no reviews yet, successfully return message No Reviews Yet in /getSelectedReview', function(done) {
    chai.request(server).post('/getSelectedReview').send({'written_user':'123', 'data':'non-exist'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].written_user.should.equal('123');
        res.body[0].date.should.equal('2020:07:31 10:44:44');
        res.body[0].description.should.equal('this works');
        res.body[0].data.should.equal('non-exist');
        res.body[0].msg.should.equal('No Reviews Yet');
      })
      done();
  })

  it('If values passed by clicking Delete button in review page exist in the review Databse, successfully deletes requested data for /deleteReview', function(done) {
    chai.request(server).post('/deleteReview').send({'written_user':'123', 'date':'2020:07:31 10:44:44'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].written_user.should.equal('123');
        res.body[0].date.should.equal('2020:07:31 10:44:44');
      })
      done();
  })

  it('If values passed by clicking Delete button in review page does not exist in the review Databse, returns error for /deleteReview', function(done) {
    chai.request(server).post('/deleteReview').send({'written_user':'1234', 'date':'2020:07:31 10:44:44'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].written_user.should.equal('123');
        res.body[0].date.should.equal('2020:07:31 10:44:44');
      })
  })
});

describe('User-report', function(done) {
  it('Proving correct ID should pass the request for /report', function(done) {
    chai.request(server).post('/report').send({'uid':'123', 'description':'Good Book'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].id.should.equal('123');
        res.body[0].description.should.equal('Good Book');
      });
      done();
  })

  it('Proving wrong ID should fail the request for /report', function(done) {
    chai.request(server).post('/report').send({'uid':'1234777', 'description':'Good Book'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].id.should.equal('123');
        res.body[0].description.should.equal('Good Book');
      });
  })

  it('should take you to the page report user on a successful GET request for /reportUser',function(done){
		chai.request(server).get('/reportUser').end(function(error,res){
			res.should.have.status(200);
			//done();
		})
		done();
	})
})

describe('Chatting', function () {
    //tests associated with users
    it('should enter chatting room for given receiver', function (done) {
        chai.request(server).post('/chat').send({ 'receiver': '111'})
            .end(function (error, res) {
            res.should.have.status(200);
            res.body[0].r.should.equal('111');
            });
        done();
    });
});




describe('Forgot-ID',function(){
  it('Proving correct Email should allow user to get their forgotten ID succesfully from the request for /sendEmail', function(done) {
     chai.request(server).post('/sendEmail').send({'uemail':'ss@ab.com', 'correct':'yes'})
       .end(function(error, res) {
         res.should.have.status(200);
         res.body[0].uemail.should.equal('ss@ab.com');
         res.body[0].findID.should.equal('123');
       });
       done();
   })

   it('Proving wrong Email should fail the request to show forgotten ID to user for /sendEmail', function(done) {
      chai.request(server).post('/sendEmail').send({'uemail':'ss12@ab.com', 'correct':'no'})
        .end(function(error, res) {
          res.should.have.status(200);
          res.body[0].uemail.should.equal('ss@ab.com');
          res.body[0].findID.should.equal('');
        });
    })

  it('should take you to the page find ID on a successful GET request for /find_id',function(done){
    chai.request(server).get('/find_id').end(function(error,res){
      res.should.have.status(200);
    })
    done();
  })

 });


describe('Forgot-Password',function(){
  it('If correct ID, Name and Email are given user should successfully get their password for /showpassword', function(done) {
     chai.request(server).post('/showpassword').send({'uemail':'ss@ab.com','uid':'123','uname':'sara', 'correct':'yes'})
       .end(function(error, res) {
         res.should.have.status(200);
         res.body[0].uemail.should.equal('ss@ab.com');
         res.body[0].uid.should.equal('123');
         res.body[0].uname.should.equal('sara');
         res.body[0].password.should.equal('321');
       });
       done();
   })

   it('If wrong ID, Name or Email are given user should fail to get their password for /showpassword', function(done) {
      chai.request(server).post('/showpassword').send({'uemail':'ss@ab.com','uid':'','uname':'sara', 'correct':'no'})
        .end(function(error, res) {
          res.should.have.status(200);
          res.body[0].uemail.should.equal('ss@ab.com');
          res.body[0].uid.should.equal('123');
          res.body[0].uname.should.equal('sara');
          res.body[0].password.should.equal('');
        });
    })

  it('should take you to the page find Password on a successful GET request for /find_pw',function(done){
    chai.request(server).get('/find_pw').end(function(error,res){
      res.should.have.status(200);
    })
    done();
  })
 });


describe('Admin Feature', function() {
  //Test Associated With Admin features
  it('should remove the user successfully if correct userID is passed through /reviewpage', function(done) {
    chai.request(server).post('/admin_deleteUser').send({'admin':'admin', 'uid':'123'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].Admin.should.equal('admin');
        res.body[0].Deleting_User.should.equal('123');
        res.body[0].After_Delete_User.should.equal('');
    });
    done();
  })

  it('should fail to remove the user if wrong userID is passed through /admin_deleteUser', function(done) {
    chai.request(server).post('/admin_deleteUser').send({'admin':'admin', 'uid':'123456'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].Admin.should.equal('admin');
        res.body[0].Deleting_User.should.equal('123');
        res.body[0].After_Delete_User.should.equal('123');
    });
  })

  it('should remove the post successfully if correct userID and bookname is passed through /admin_deletePost', function(done) {
    chai.request(server).post('/admin_deletePost').send({'admin':'admin', 'uid':'123', 'bookname':'CMPT'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].Admin.should.equal('admin');
        res.body[0].Deleting_Post_User.should.equal('123');
        res.body[0].Deleting_Post_Bookname.should.equal('CMPT');
        res.body[0].After_Delete_User.should.equal('');
    });
    done();
  })

  it('should fail to remove the user if wrong userID is passed through /admin_deletePost', function(done) {
    chai.request(server).post('/admin_deletePost').send({'admin':'admin', 'uid':'12345', 'bookname':'CMPT'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].Admin.should.equal('admin');
        res.body[0].Deleting_Post_User.should.equal('123');
        res.body[0].Deleting_Post_Bookname.should.equal('CMPT');
        res.body[0].After_Delete_User.should.equal('123');
    });
  })

  it('should fail to remove the user if wrong bookname is passed through /admin_deletePost', function(done) {
    chai.request(server).post('/admin_deletePost').send({'admin':'admin', 'uid':'123', 'bookname':'MATH'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].Admin.should.equal('admin');
        res.body[0].Deleting_Post_User.should.equal('123');
        res.body[0].Deleting_Post_Bookname.should.equal('CMPT');
        res.body[0].After_Delete_User.should.equal('123');
    })
  })
});

describe('Log-in Feature', function() {
  //Test Associated With Log-in Features
  it('Should allow a person to log-in if correct ID and pwd are given in /auth/login', function(done) {
    chai.request(server).post('/auth/login').send({'uid':'123', 'upassword':'321'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].upassword.should.equal('321');
        res.body[0].login.should.equal('success');
    });
    done();
  })

  it('Should fail a person to log-in if incorrect ID or pwd are given in /auth/login', function(done) {
    chai.request(server).post('/auth/login').send({'uid':'123', 'upassword':'321456'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].upassword.should.equal('321');
        res.body[0].login.should.equal('failure');
    });
  })

  it('should successfully log-out when user clicks log-out for /auth/logout',function(done){
    chai.request(server).get('/auth/logout').end(function(error,res){
      res.should.have.status(200);
    })
    done();
  })
});

describe('Sign-Up Feature', function() {
  //Test Associated With Log-in Features
  it('Should allow a person to sign-up succesfully if all information given in /adduser', function(done) {
    chai.request(server).post('/adduser').send({'uid':'123', 'upassword':'321', 'upasswordcon':'321', 'uname':'Bobby', 'uemail':'Bobby@sfu.ca', 'exist':'no'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].upassword.should.equal('321');
        res.body[0].upasswordcon.should.equal(res.body[0].upassword);
        res.body[0].uname.should.equal('Bobby');
        res.body[0].uemail.should.equal('Bobby@sfu.ca');
        res.body[0].duplicate.should.equal('No');
    });
    done();
  })

  it('Should fail a person to sign-up if given user id already exists in the backpack database when /adduser', function(done) {
    chai.request(server).post('/adduser').send({'uid':'123', 'upassword':'321', 'upasswordcon':'321', 'uname':'Bobby', 'uemail':'Bobby@sfu.ca', 'exist':'yes'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].upassword.should.equal('321');
        res.body[0].upasswordcon.should.equal(res.body[0].upassword);
        res.body[0].uname.should.equal('Bobby');
        res.body[0].uemail.should.equal('Bobby@sfu.ca');
        res.body[0].duplicate.should.not.equal('Yes');
    });
  })

  it('Should fail a person to sign-up if any of the information is left empty or not given in /adduser', function(done) {
    chai.request(server).post('/adduser').send({'uid':'123', 'upassword':'321', 'upasswordcon':'', 'uname':'Bobby', 'uemail':'Bobby@sfu.ca', 'exist':'no'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].upassword.should.equal('321');
        res.body[0].upasswordcon.should.equal(res.body[0].upassword);
        res.body[0].uname.should.equal('Bobby');
        res.body[0].uemail.should.equal('Bobby@sfu.ca');
        res.body[0].duplicate.should.equal('No');
    });
  })
});

describe('Profile Feature', function() {
  //Test Associated With Profile Features
  it('should successfully take user to profile page when user clicks profile for /mypage',function(done){
    chai.request(server).get('/mypage').end(function(error,res){
      res.should.have.status(200);
    })
    done();
  })

  it('Should allow user to delete their account succesfully if confirmed by user in /deleteuser', function(done) {
    chai.request(server).post('/deleteuser').send({'uid':'123', 'confirmation':'yes'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].confirmation.should.equal('yes');
    });
    done();
  })

  it('Should fail user to delete their account if not confirmed by user in /deleteuser', function(done) {
    chai.request(server).post('/deleteuser').send({'uid':'123', 'confirmation':'no'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].confirmation.should.equal('yes');
    });
  })

  it('Should allow user to edit their account if correct information given by user in /edituser', function(done) {
    chai.request(server).post('/edituser').send({'uid':'123', 'uname':'Bobby', 'uemail':'Bobby@sfu.ca', 'upassword':'321', 'confirm':'321'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].uname.should.equal('Bobby');
        res.body[0].uemail.should.equal('Bobby@sfu.ca');
        res.body[0].upassword.should.equal('321');
        res.body[0].confirm_pwd.should.equal('321');
    });
    done();
  })

  it('Should fail user to edit their account if any empty information given by user in /edituser', function(done) {
    chai.request(server).post('/edituser').send({'uid':'123', 'uname':'', 'uemail':'Bobby@sfu.ca', 'upassword':'321','confirm':'321'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].uname.should.equal('Bobby');
        res.body[0].uemail.should.equal('Bobby@sfu.ca');
        res.body[0].upassword.should.equal('321');
        res.body[0].confirm_pwd.should.equal(res.body[0].upassword);
    });
  })

  it('Should fail user to edit their account if password do not match confirm password given by user in /edituser', function(done) {
    chai.request(server).post('/edituser').send({'uid':'123', 'uname':'Bobby', 'uemail':'Bobby@sfu.ca', 'upassword':'321','confirm':'3214'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].uname.should.equal('Bobby');
        res.body[0].uemail.should.equal('Bobby@sfu.ca');
        res.body[0].upassword.should.equal('321');
        res.body[0].confirm_pwd.should.equal(res.body[0].upassword);
    });
  })

  it('Should allow user to edit their profile picture if given image exists within our folder in /changeImage', function(done) {
    chai.request(server).post('/changeImage').send({'uid':'123', 'uimage':'sfulogo.jpg'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].uid.should.equal('123');
        res.body[0].uimage.should.equal('sfulogo.jpg');
    });
    done();
  })
});

describe('Uploading Item Feature', function() { //START FROM POST UPLOAD
  //Test Associated With Upload Features
  it('Should allow user to post their item succesfully if all information are given by user in /upload', function(done) {
    chai.request(server).post('/upload')
    .send({'path':'AWS', 'course':'cmpt', 'bookName':'Intro CMPT', 'uid':'123', 'cost':'200', 'condition':'new', 'description':'Buy this book', 'location':'Burnaby', 'duplicate':'nope'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].path.should.equal('AWS');
        res.body[0].course.should.equal('cmpt');
        res.body[0].bookName.should.equal('Intro CMPT');
        res.body[0].uid.should.equal('123');
        res.body[0].cost.should.equal('200');
        res.body[0].condition.should.equal('new');
        res.body[0].description.should.equal('Buy this book');
        res.body[0].location.should.equal('Burnaby');
        res.body.length.should.equal(1);
    });
    done();
  })

  it('Should fail user to post their item if one or more information are empty or not given by user in /upload', function(done) {
    chai.request(server).post('/upload')
    .send({'path':'AWS', 'course':'', 'bookName':'Intro CMPT', 'uid':'123', 'cost':'', 'condition':'new', 'description':'Buy this book', 'location':'Burnaby', 'duplicate':'no'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].path.should.equal('AWS');
        res.body[0].course.should.equal('cmpt');
        res.body[0].bookName.should.equal('Intro CMPT');
        res.body[0].uid.should.equal('123');
        res.body[0].cost.should.equal('200');
        res.body[0].condition.should.equal('new');
        res.body[0].description.should.equal('Buy this book');
        res.body[0].location.should.equal('Burnaby');
    });
  })

  it('Should fail user to post their item if undefined location is given by user in /upload', function(done) {
    chai.request(server).post('/upload')
    .send({'path':'AWS', 'course':'cmpt', 'bookName':'Intro CMPT', 'uid':'123', 'cost':'200', 'condition':'new', 'description':'Buy this book', 'location':'123asdfafda', 'duplicate':'no'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].path.should.equal('AWS');
        res.body[0].course.should.equal('cmpt');
        res.body[0].bookName.should.equal('Intro CMPT');
        res.body[0].uid.should.equal('123');
        res.body[0].cost.should.equal('200');
        res.body[0].condition.should.equal('new');
        res.body[0].description.should.equal('Buy this book');
        res.body[0].location.should.equal('Burnaby');
    });
  })

  it('Should fail user to post their item if same user tries to post with duplicate bookname in /upload', function(done) {
    chai.request(server).post('/upload')
    .send({'path':'AWS', 'course':'cmpt', 'bookName':'Intro CMPT', 'uid':'123', 'cost':'200', 'condition':'new', 'description':'Buy this book', 'location':'Burnaby', 'duplicate':'yes'})
      .end(function(error, res) {
        res.should.have.status(200);
        var countDatabase = res.body.length;
        countDatabase.should.equal(0);
        var userTriedToAdd = res.body.length;
        userTriedToAdd.should.equal(1);
    });
  })

  it('Should allow user to post their item multiple times as long as bookname is not duplicate in /upload', function(done) {
    chai.request(server).post('/upload')
    .send({'path':'AWS', 'course':'cmpt', 'bookName':'Intro CMPT', 'uid':'123', 'cost':'200', 'condition':'new', 'description':'Buy this book', 'location':'Burnaby', 'duplicate':'no'})
      .end(function(error, res) {
        res.should.have.status(200);
        res.body[0].path.should.equal('AWS');
        res.body[0].course.should.equal('cmpt');
        res.body[0].bookName.should.equal('Intro CMPT');
        res.body[0].uid.should.equal('123');
        res.body[0].cost.should.equal('200');
        res.body[0].condition.should.equal('new');
        res.body[0].description.should.equal('Buy this book');
        res.body[0].location.should.equal('Burnaby');
        var countDatabase = res.body.length;
        countDatabase.should.equal(2);
    });
    done();
  })
});

describe('Buying Page Features', function() { //START FROM POST UPLOAD
  //Test Associated With Buying pages
  it('Should allow users to successfully access the main buying page in /buy', function(done) {
    chai.request(server).get('/buy').end(function(error, res) {
      res.should.have.status(200);
    })
    done();
  })

  it('Should allow users to successfully access the specific buying page with course names in /post/:id', function(done) {
    chai.request(server).get('/post/:id').end(function(error, res) {
      res.should.have.status(200);
    })
    done();
  })
});

describe('Chating Lists', function () {
    //tests associated with chating between users
    it('should allow users to view the chatting log between two users in /chatlist', function (done) {
      chai.request(server).get('/chatlist').send({'sendingID':'123', 'receivingID':'321', 'unrelated_user':'none', 'sender':'111', 'receiver': '111'})
      .end(function(error,res){
          res.should.have.status(200);
          res.body[0].sender.should.equal('111');
          res.body[0].receiver.should.equal('111');
          res.body[0].sendingID.should.equal('123');
          res.body[0].receivingID.should.equal('321');
          res.body.length.should.equal(1);
      })
    done();
  })

  it('users should only be able to view chat logs between two related IDs and chat logs of unrelated IDs should not be shown in /chatlist', function (done) {
    chai.request(server).get('/chatlist').send({'sendingID':'123', 'receivingID':'321', 'unrelated_user':'admin', 'sender':'111', 'receiver': '111'})
    .end(function(error,res){
        res.should.have.status(200);
        res.body[0].sender.should.equal('111');
        res.body[0].receiver.should.equal('111');
        res.body[0].sendingID.should.equal('123');
        res.body[0].receivingID.should.equal('321');
        res.body[1].sender.should.equal('admin');
        res.body[1].other_receivingID.should.equal('not 321');
        res.body.length.should.equal(2);
    })
    done();
  })
});

describe('Searching Features', function () {
    //tests associated with searching
    it('should allow users to search through entire items listed in the database and find item succesfully if exists in /search', function (done) {
      chai.request(server).get('/search').send({'itemSearched':'cmpt'}) //In index.js, there's an array of items created to test this function (which contains 2 of cmpt items)
      .end(function(error,res){
        res.should.have.status(200);
        res.body[0].itemSearched.should.equal('cmpt');
        res.body[1].itemSearched.should.equal('Intro to cmpt');
        res.body[2].itemSearched.should.equal('cmpt master');
        res.body.length.should.equal(3);
      })
    done();
  })

  it('should allow users to view nothing if searching item is not found in the database in /search', function (done) {
    chai.request(server).get('/search').send({'itemSearched':'what is this?'}) //In index.js, there's array to test this
      .end(function(error,res){
        res.should.have.status(200);
        res.body.length.should.equal(0); //Nothing found, so array should be 0 as expected.
    })
    done();
  })

  it('should allow users to view nothing if searching item is empty in the database in /search', function (done) {
    chai.request(server).get('/search').send({'itemSearched':''}) //In index.js, there's array to test this
      .end(function(error,res){
        res.should.have.status(200);
        res.body.length.should.equal(0); //Nothing found, so array should be 0 as expected.
    })
    done();
  })
});

describe('Post Updating Features', function () {
    //tests associated with updating posts
    it('should take users back to select-page with user ID and post ID given after updating the post in /updatepost/:id', function (done) {
      chai.request(server).get('/updatepost/:id').send({'postid':'1', 'uid':'123'})
        .end(function(error,res){
          res.should.have.status(200);
          res.body[0].postid.should.equal('1');
          res.body[0].uid.should.equal('123');
          res.body.length.should.equal(1);
      })
      done();
    })

    it('should allow users to update their posts if all information is given in /updatepost', function (done) {
      chai.request(server).post('/updatepost')
      .send({'path':'AWS', 'course':'cmpt', 'bookName':'Intro CMPT', 'uid':'123', 'cost':'200', 'condition':'new', 'description':'Buy this book', 'location':'Burnaby', 'duplicate':'no'})
        .end(function(error,res){
          res.should.have.status(200);
          res.body[0].path.should.equal('AWS');
          res.body[0].course.should.equal('cmpt');
          res.body[0].bookName.should.equal('Intro CMPT');
          res.body[0].uid.should.equal('123');
          res.body[0].cost.should.equal('200');
          res.body[0].condition.should.equal('new');
          res.body[0].description.should.equal('Buy this book');
          res.body[0].location.should.equal('Burnaby');
      })
      done();
    })

    it('should fail users to update their posts if any information is given is empty or not given in /updatepost', function (done) {
      chai.request(server).post('/updatepost')
      .send({'path':'AWS', 'course':'', 'bookName':'Intro CMPT', 'uid':'123', 'cost':'200', 'condition':'', 'description':'Buy this book', 'location':'Burnaby', 'duplicate':'no'})
        .end(function(error,res){
          res.should.have.status(200);
          res.body[0].path.should.equal('AWS');
          res.body[0].course.should.equal('cmpt');
          res.body[0].bookName.should.equal('Intro CMPT');
          res.body[0].uid.should.equal('123');
          res.body[0].cost.should.equal('200');
          res.body[0].condition.should.equal('new');
          res.body[0].description.should.equal('Buy this book');
          res.body[0].location.should.equal('Burnaby');
      })
    })

    it('should fail users to update their posts if given location is undefined in /updatepost', function (done) {
      chai.request(server).post('/updatepost')
      .send({'path':'AWS', 'course':'cmpt', 'bookName':'Intro CMPT', 'uid':'123', 'cost':'200', 'condition':'new', 'description':'Buy this book', 'location':'sdasdasdasda', 'duplicate':'no'})
        .end(function(error,res){
          res.should.have.status(200);
          res.body[0].path.should.equal('AWS');
          res.body[0].course.should.equal('cmpt');
          res.body[0].bookName.should.equal('Intro CMPT');
          res.body[0].uid.should.equal('123');
          res.body[0].cost.should.equal('200');
          res.body[0].condition.should.equal('new');
          res.body[0].description.should.equal('Buy this book');
          res.body[0].location.should.equal('Burnaby');
      })
    })

    it('should fail users to update their posts if given bookname is duplicate in /updatepost', function (done) {
      chai.request(server).post('/updatepost')
      .send({'path':'AWS', 'course':'cmpt', 'bookName':'Intro CMPT', 'uid':'123', 'cost':'200', 'condition':'new', 'description':'Buy this book', 'location':'Burnaby', 'duplicate':'yes'})
        .end(function(error,res){
          res.should.have.status(200);
          var countDatabase = res.body.length;
          countDatabase.should.equal(0);
          var userTriedToAdd = res.body.length;
          userTriedToAdd.should.equal(1);
      })
    })
});

describe('Sold Features', function () {
    //tests associated with sold posts
    it('should allow users to click sold button and delete that post in /seller_sold', function (done) {
      chai.request(server).post('/seller_sold').send({'postid':'1'})
        .end(function(error,res){
          res.body.length.should.equal(0); //length should be 0 since post is deleted after clicking sold button
      })
      done();
    })
});

describe('Cart Features', function () {
    tests associated with cart system
    it('should allow users to view their items they have added in cart feature in /cart', function (done) {
      chai.request(server).get('/cart').send({'uid':'123'})
        .end(function(error,res){
          res.should.have.status(200);
          res.body[0].uid.should.equal('123');
          res.body.length.should.equal(1);
      })
      done();
    })

    it('should allow users to add selected item to be added to the cart in /add_to_cart', function (done) {
      chai.request(server).post('/add_to_cart').send({'uid':'123', 'postid':'1', 'bookname':'Intro CMPT', 'cost':'250', 'image':'book', 'condition':'new', 'duplicate':'no'})
        .end(function(error,res){
          res.should.have.status(200);
          res.body[0].uid.should.equal('123');
          res.body[0].postid.should.equal('1');
          res.body[0].bookname.should.equal('Intro CMPT');
          res.body[0].cost.should.equal('250');
          res.body[0].image.should.equal('book');
          res.body[0].condition.should.equal('new');
          res.body[0].duplicate.should.equal('no');
          res.body.length.should.equal(1);
      })
      done();
    });

    it('should fail users to add selected item to be added to the cart if the user already has same item in the cart in /add_to_cart', function (done) {
      chai.request(server).post('/add_to_cart').send({'uid':'123', 'postid':'1', 'bookname':'Intro CMPT', 'cost':'250', 'image':'book', 'condition':'new', 'duplicate':'yes'})
        .end(function(error,res){
          res.should.have.status(200);
          res.body[0].uid.should.equal('123');
          res.body[0].postid.should.equal('1');
          res.body[0].bookname.should.equal('Intro CMPT');
          res.body[0].cost.should.equal('250');
          res.body[0].image.should.equal('book');
          res.body[0].condition.should.equal('new');
          res.body[0].duplicate.should.equal('no');
      })
    })

    it('should allow users to remove their items they have added in cart feature in /delete_cart', function (done) {
      chai.request(server).post('/delete_cart').send({'postid':'1'})
        .end(function(error,res){
          res.should.have.status(200);
          res.body.length.should.equal(0);
      })
      done();
    })
});
