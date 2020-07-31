// tests here
console.log("hello world");

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
  it('Proving correct Email should pass the request for /sendEmail', function(done) {
     chai.request(server).post('/sendEmail').send({'uemail':'ss@ab.com'})
       .end(function(error, res) {
         res.should.have.status(200);
         res.body[0].email.should.equal('ss@ab.com');
       });
       done();
   })


  it('should take you to the page find ID on a successful GET request for /find_id',function(done){
    chai.request(server).get('/find_id').end(function(error,res){
      res.should.have.status(200);
    })
    done();
  })

 });


describe('Forgot-Password',function(){
  it('Proving correct ID, Name and Email should pass the request for /showpassword', function(done) {
     chai.request(server).post('/showpassword').send({'uemail':'ss@ab.com','uid':'123','uname':'sara'})
       .end(function(error, res) {
         res.should.have.status(200);
         res.body[0].uemail.should.equal('ss@ab.com');
         res.body[0].uid.should.equal('123');
         res.body[0].uname.should.equal('sara');
       });
       done();
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


// //ob={'r':socket.receiver,'s':socket.sender,'m':message,'u':socket.username};
// describe('User', function () {
//     //tests associated with users
//     it('should add a single user on a successful adding request for chatting message', function (done) {
//         chai.request(server).post('/chat').send({ 'receiver': '111'});
//         chai.end(function(error,res){
//             res.should.have.status(200);
//             res.should.be.json;
//             res.body.should.be.a('array');
//             res.body[0].r.should.equal('111');
//             res.body[0].u.should.equal('helloworld');
//             done();
//         });
//     });
// });