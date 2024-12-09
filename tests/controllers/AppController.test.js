/* eslint-disable import/no-named-as-default */
import sinon from 'sinon';
import { expect } from 'chai';
import request from 'supertest';
import dbClient from '../../utils/db';
import app from '../../app'; // Assuming your app is exported from this module

/**
 * + AppController Tests
 *
 * This suite contains tests for the AppController that ensure the correct behavior of
 * the `/status` and `/stats` endpoints. The database interactions are mocked using
 * Sinon to avoid the need for a real database connection.
 */
describe('+ AppController', () => {
  let mockUsersCollection;
  let mockFilesCollection;

  /**
   * Setup function to prepare the test environment.
   *
   * The before hook mocks the database collections (`usersCollection` and `filesCollection`)
   * and stubs their methods to simulate interactions with the database.
   */
  before(function (done) {
    this.timeout(10000); // Set a longer timeout to accommodate async operations

    // Create mock collections with stubbed methods
    mockUsersCollection = {
      deleteMany: sinon.stub().resolves(), // Mock the deleteMany method to resolve without error
      insertMany: sinon.stub().resolves(), // Mock insertMany to resolve without error
      find: sinon.stub().returns([]), // Mock find to return an empty array
    };

    mockFilesCollection = {
      deleteMany: sinon.stub().resolves(), // Same as above for filesCollection
      insertMany: sinon.stub().resolves(),
      find: sinon.stub().returns([]),
    };

    // Stub dbClient methods to return the mocked collections
    sinon.stub(dbClient, 'usersCollection').returns(mockUsersCollection);
    sinon.stub(dbClient, 'filesCollection').returns(mockFilesCollection);

    done();
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
   * Test the `/status` endpoint.
   *
   * This test ensures that the `/status` endpoint returns a 200 status code and
   * the correct response indicating the status of services like Redis and the database.
   */
  describe('+ GET: /status', () => {
    it('+ Services are online', () => new Promise((done) => {
      // Make a GET request to the /status endpoint
      request(app)
        .get('/status')
        .expect(200) // Expect a 200 OK status
        .end((err, res) => {
          if (err) {
            return done(err); // Pass any errors to the done callback
          }
          // Check that the response body matches the expected object
          expect(res.body).to.deep.eql({ redis: true, db: true });
          done(); // Mark the test as complete
        });
    }));
  });

  /**
   * Test the `/stats` endpoint.
   *
   * This test ensures that the `/stats` endpoint returns the correct statistics
   * about the number of users and files in the database.
   */
  describe('+ GET: /stats', () => {
    /**
     * Test when no records exist in the database.
     *
     * This scenario tests that the `/stats` endpoint returns the correct statistics
     * when there are no users or files in the database (empty collections).
     */
    it('+ Correct statistics about db collections', () => new Promise((done) => {
      // Make a GET request to the /stats endpoint
      request(app)
        .get('/stats')
        .expect(200) // Expect a 200 OK status
        .end((err, res) => {
          if (err) {
            return done(err); // Pass any errors to the done callback
          }
          // Check that the response body matches the expected statistics
          expect(res.body).to.deep.eql({ users: 0, files: 0 });
          done(); // Mark the test as complete
        });
    }));

    /**
     * Test when records are inserted into the database.
     *
     * This scenario tests that the `/stats` endpoint returns the correct statistics
     * when users and files are inserted into the mock collections.
     */
    it('+ Correct statistics about db collections [alt]', function () {
      return new Promise((done) => {
        this.timeout(10000); // Increase the timeout to handle async operations

        // Simulate database with mock data
        mockUsersCollection.insertMany.resolves([{ email: 'john@mail.com' }]);
        mockFilesCollection.insertMany.resolves([
          { name: 'foo.txt', type: 'file' },
          { name: 'pic.png', type: 'image' },
        ]);

        // Make a GET request to the /stats endpoint
        request(app)
          .get('/stats')
          .expect(200) // Expect a 200 OK status
          .end((err, res) => {
            if (err) {
              return done(err); // Pass any errors to the done callback
            }
            // Check that the response body matches the updated statistics
            expect(res.body).to.deep.eql({ users: 1, files: 2 });
            done(); // Mark the test as complete
          });
      });
    });
  });
});
