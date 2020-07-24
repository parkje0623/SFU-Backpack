var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index');
var should = chai.should();

chai.use(chaiHttp);

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


describe('Report', function(done) {
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
})

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
