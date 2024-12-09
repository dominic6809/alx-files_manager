/* eslint-disable import/no-named-as-default */
import sinon from 'sinon';
import { expect } from 'chai';
import request from 'supertest';
import dbClient from '../../utils/db';
import app from '../../app'; // Assuming your app is exported from this module

/**
 * + AuthController Tests
 *
 * This suite contains tests for the AuthController that ensure correct authentication
 * behavior for endpoints `/connect` and `/disconnect`.
 * The database interactions are mocked using Sinon to avoid needing a real database.
 */
describe('+ AuthController', () => {
  const mockUser = {
    email: 'kaido@beast.com',
    password: 'hyakuju_no_kaido_wano',
  };
  let token = '';

  /**
   * Setup function to prepare the test environment.
   *
   * The `before` hook mocks the database collections and stubs their methods.
   * The mock user is created by sending a request to the `/users` endpoint.
   */
  before(function (done) {
    this.timeout(10000); // Set a longer timeout to accommodate async operations

    // Create mock collections with stubbed methods
    const mockUsersCollection = {
      deleteMany: sinon.stub().resolves(), // Mock deleteMany to resolve without error
      insertMany: sinon.stub().resolves(), // Mock insertMany to resolve without error
      findOne: sinon.stub().resolves(mockUser), // Mock findOne to return mockUser
    };

    // Stub dbClient method to return the mocked usersCollection
    sinon.stub(dbClient, 'usersCollection').returns(mockUsersCollection);

    // Simulate creating a new user by sending a POST request to the /users endpoint
    request(app)
      .post('/users')
      .send({
        email: mockUser.email,
        password: mockUser.password,
      })
      .expect(201)
      .end((requestErr, res) => {
        if (requestErr) {
          return done(requestErr);
        }
        expect(res.body.email).to.eql(mockUser.email); // Check that email matches
        expect(res.body.id.length).to.be.greaterThan(0); // Check that an ID was generated
        done();
      });
  });

  /**
   * Cleanup function after all tests.
   *
   * This restores the original methods of dbClient after the tests are complete
   * to avoid side effects in other tests.
   */
  after(() => {
    sinon.restore(); // Restore the original methods of dbClient
  });

  /**
   * Test the `/connect` endpoint.
   *
   * This test suite ensures correct authentication behavior when connecting
   * with valid or invalid credentials.
   */
  describe('+ GET: /connect', () => {
    /**
     * Test that the request fails when no "Authorization" header is provided.
     *
     * This tests the endpoint behavior when the client does not include
     * the necessary "Authorization" header.
     */
    it('+ Fails with no "Authorization" header field', function () {
      return new Promise((done) => {
        this.timeout(5000);
        request(app)
          .get('/connect')
          .expect(401) // Expect a 401 Unauthorized status
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.eql({ error: 'Unauthorized' }); // Ensure the error message is correct
            done();
          });
      });
    });

    /**
     * Test that the request fails for a non-existent user.
     *
     * This tests the endpoint behavior when the provided email does not match
     * any existing users.
     */
    it('+ Fails for a non-existent user', function () {
      return new Promise((done) => {
        this.timeout(5000);
        request(app)
          .get('/connect')
          .auth('foo@bar.com', 'raboof', { type: 'basic' }) // Use invalid credentials
          .expect(401) // Expect a 401 Unauthorized status
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.eql({ error: 'Unauthorized' }); // Ensure the error message is correct
            done();
          });
      });
    });

    /**
     * Test that the request fails when the password is incorrect.
     *
     * This tests the endpoint behavior when the provided password is incorrect
     * for an existing user.
     */
    it('+ Fails with a valid email and wrong password', function () {
      return new Promise((done) => {
        this.timeout(5000);
        request(app)
          .get('/connect')
          .auth(mockUser.email, 'raboof', { type: 'basic' }) // Correct email, wrong password
          .expect(401) // Expect a 401 Unauthorized status
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.eql({ error: 'Unauthorized' }); // Ensure the error message is correct
            done();
          });
      });
    });

    /**
     * Test that the request fails when the email is incorrect.
     *
     * This tests the endpoint behavior when the provided email does not exist
     * in the database, but the password is correct.
     */
    it('+ Fails with an invalid email and valid password', function () {
      return new Promise((done) => {
        this.timeout(5000);
        request(app)
          .get('/connect')
          .auth('zoro@strawhat.com', mockUser.password, { type: 'basic' }) // Invalid email, correct password
          .expect(401) // Expect a 401 Unauthorized status
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.eql({ error: 'Unauthorized' }); // Ensure the error message is correct
            done();
          });
      });
    });

    /**
     * Test that the request succeeds for an existing user with valid credentials.
     *
     * This tests the endpoint behavior when the provided email and password match
     * an existing user.
     */
    it('+ Succeeds for an existing user', function () {
      return new Promise((done) => {
        this.timeout(5000);
        request(app)
          .get('/connect')
          .auth(mockUser.email, mockUser.password, { type: 'basic' }) // Correct email and password
          .expect(200) // Expect a 200 OK status
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body.token).to.exist; // Ensure a token is returned
            expect(res.body.token.length).to.be.greaterThan(0); // Ensure the token is not empty
            token = res.body.token; // Store the token for later use
            done();
          });
      });
    });
  });

  /**
   * Test the `/disconnect` endpoint.
   *
   * This test suite ensures correct behavior when disconnecting
   * using a valid or invalid token.
   */
  describe('+ GET: /disconnect', () => {
    /**
     * Test that the request fails when no "X-Token" header is provided.
     *
     * This tests the behavior when the client does not provide the "X-Token"
     * header in the request.
     */
    it('+ Fails with no "X-Token" header field', function () {
      return new Promise((done) => {
        this.timeout(5000);
        request(app)
          .get('/disconnect')
          .expect(401) // Expect a 401 Unauthorized status
          .end((requestErr, res) => {
            if (requestErr) {
              return done(requestErr);
            }
            expect(res.body).to.deep.eql({ error: 'Unauthorized' }); // Ensure the error message is correct
            done();
          });
      });
    });

    /**
     * Test that the request fails for an invalid token.
     *
     * This tests the behavior when the provided token does not match any valid sessions.
     */
    it('+ Fails for a non-existent user', function () {
      return new Promise((done) => {
        this.timeout(5000);
        request(app)
          .get('/disconnect')
          .set('X-Token', 'raboof') // Invalid token
          .expect(401) // Expect a 401 Unauthorized status
          .end((requestErr, res) => {
            if (requestErr) {
              return done(requestErr);
            }
            expect(res.body).to.deep.eql({ error: 'Unauthorized' }); // Ensure the error message is correct
            done();
          });
      });
    });

    /**
     * Test that the request succeeds with a valid token.
     *
     * This tests the behavior when the client provides a valid "X-Token" header
     * to disconnect.
     */
    it('+ Succeeds with a valid "X-Token" field', () => new Promise((done) => {
      request(app)
        .get('/disconnect')
        .set('X-Token', token) // Use the valid token obtained from the /connect endpoint
        .expect(204) // Expect a 204 No Content status
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({}); // Ensure the response body is empty
          expect(res.text).to.eql(''); // Ensure no text in the response
          expect(res.headers['content-type']).to.not.exist; // Ensure no content type header
          expect(res.headers['content-length']).to.not.exist; // Ensure no content length header
          done();
        });
    }));
  });
});
