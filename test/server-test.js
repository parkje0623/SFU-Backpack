// tests here
console.log("hello world");


var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index');
var should = chai.should();

chai.use(chaiHttp);

/*
//ob={'r':socket.receiver,'s':socket.sender,'m':message,'u':socket.username};
describe('User', function () {
    //tests associated with users
    it('should add a single user on a successful adding request for chatting message', function (done) {
        chai.request(server).post('/chat').send({ 'receiver': '111'})
            .end(function(error,res){
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');
            res.body[0].r.should.equal('111');
            done();
        });
    });
});
*/