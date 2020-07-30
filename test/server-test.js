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
      chai.request(server).post('/post_review').send({'sellerID':'1234', 'review':'Good Book'})
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

});



describe('User', function () {
    //tests associated with users
    it('should add a single user on a successful adding request for chatting message', function (done) {
        chai.request(server).post('/chat').send({ 'receiver': '111'})
            .end(function(error,res){
            res.should.have.status(200);
            res.should.be.json;
            res.body[0].r.should.equal('111');
            done();
        });
    });
});



it('Proving wrong ID should fail the request for /report', function(done) {
    chai.request(server).post('/report').send({'uid':'1234', 'description':'Good Book'})
      .end(function(error, res) {
          res.should.have.status(200);
          res.body[0].id.should.equal('123');
          res.body[0].description.should.equal('Good Book');
      });
})







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