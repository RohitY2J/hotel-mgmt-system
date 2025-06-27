process.env.NODE_ENV = 'test';
const {app,server,mongoose} = require('../index');


describe('User APIs', () => {
  let mongoServer;
  let request;
  let chai;
  // Mock user for authentication
  const mockUser = { id: '123', username: 'JohnDoe' };

  // Setup before all tests
  before(async () => {
    
    chai = await import('chai');
    expect = chai.expect;
    request = (await import('supertest')).default;

    const { MongoMemoryServer } = await import('mongodb-memory-server');

    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create({
      instance: { dbName: 'hotel-mgmt-test' } // Optional: specify database name
    });
    
    const mongoUri = mongoServer.getUri();

    // Close any existing Mongoose connection
    if (mongoose.connection.readyState !== 0) {
        console.log("Already existing connection!!");
        await mongoose.connection.close();
    }
    else{
        console.log("No existing connection!!");    
    }

    // Connect Mongoose to in-memory database
    await mongoose.connect(mongoUri);
  });

  // Cleanup after all tests
  after(async () => {
    server.close(); // Close Express server
    if (mongoose.connection.readyState !== 0) { // Check if mongoose connection is open
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop(); // Stop in-memory MongoDB
    }
  });

  describe('GET /api/getUserDetails', () => {
    
    beforeEach(async () => {
    });

    afterEach(() => {
      //sinon.default.restore();
    });

    it('should return user details for authenticated user', async () => {
      const res = await request(server).get('/api/getUserDetails').expect(200);
    });
  });
});