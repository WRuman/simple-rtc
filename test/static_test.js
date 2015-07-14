var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
var supertest = require('supertest');
var api = supertest('http://localhost:8080');

describe('Static File Server', function() {
    it('should deliver index.html with a 200 response', function(done) {
        api.get('/index.html')
        .set('Accept', 'text/html')
        .expect(200, done);
    });
    it('should deliver stylesheet with a 200 response' , function(done) {
        api.get('/rtc_style.css')
        .set('Accept', 'text/css')
        .expect(200, done);
    });
});