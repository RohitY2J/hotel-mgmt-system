process.env.NODE_ENV = 'test';
const {app,server,mongoose} = require('../index');


describe('User APIs', () => {
  let mongoServer;
  let request;
  let chai;
  let sinon;
  let dbContext;
  
  // Setup before all tests
  before(async () => {
    
    chai = await import('chai');
    expect = chai.expect;
    request = (await import('supertest')).default;
    sinon = (await import('sinon')).default;

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

    dbContext = require('../model');
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

  describe('isAuthenticated Middleware Tests', () => {
    let req, res, next;
    let isAuthenticated;
    beforeEach(() => {
      // Mock request, response, and next
      isAuthenticated = require('../helper/auth_middleware');
      req = {
        isAuthenticated: sinon.stub(), // a mock function that is configured in test case
        originalUrl: '/api/some-protected-route',
      };
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
      };
      next = sinon.stub();
    });

    afterEach(() => {
      sinon.restore(); // Restore all stubs and mocks
    });

    it('should call next() for authenticated user', async () => {
      // Arrange: Simulate authenticated user
      req.isAuthenticated.returns(true);

      // Act: Call the middleware
      await isAuthenticated(req, res, next);

      // Assert
      expect(next.calledOnce).to.be.true; //next function is called once
      expect(res.status.called).to.be.false;
      expect(res.send.called).to.be.false;
    });

    it('should return 401 for unauthenticated user on protected route', async () => {
      // Arrange: Simulate unauthenticated user
      req.isAuthenticated.returns(false);
      req.originalUrl = '/api/some-protected-api';

      // Act: Call the middleware
      await isAuthenticated(req, res, next);

      // Assert
      expect(next.called).to.be.false;
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.send.calledWith('Un-authorized user.')).to.be.true;
    });

    it('should call next() for /api/login even if unauthenticated', async () => {
      // Arrange: Simulate unauthenticated user on /api/login
      req.isAuthenticated.returns(false);
      req.originalUrl = '/api/login';

      // Act: Call the middleware
      await isAuthenticated(req, res, next);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
      expect(res.send.called).to.be.false;
    });

  });


  describe('POST /api/login', () => {
    let client;
    let user;
    let agent;
    
    beforeEach(async () => {
      // Insert a mock user into the in-memory MongoDB
      //isAuthenticated = require('../helper/auth_middleware');
      agent = request.agent(server);
      client = new dbContext.Client({name : "TestClient"});
      await client.save();

      user = new dbContext.User({
        email: 'john.doe@example.com',
        userName: 'John Doe',
        clientId: client._id,
        fullName: 'John Doe',
        phNum: '1234567890',
        roleID: 1, // Admin
      });
      user.setPassword('TestPassword');
      await user.save();
    });

    afterEach(() => {
      sinon.restore();
      dbContext.Client.deleteMany({});
      dbContext.User.deleteMany({});
    });

    it('should authenticate user with valid credentials', async () => {
      // Mock validatePassword to simulate correct password
      //sinon.stub(userModel.prototype, 'validatePassword').returns(true);

      const res = await request(server)
        .post('/login')
        .send({ email: 'john.doe@example.com', password: 'TestPassword' })
        .expect(302); // Assuming redirect to /admin/dashboard

      expect(res.headers.location).to.equal('/admin/dashboard');
    });

    it.skip('should insert a User into MongoDB and access /api/getUserDetails with authentication', async () => {
        // Verify User insertion
        let findUser = await dbContext.User.findOne({email: 'john.doe@example.com'});
        expect(findUser).to.have.property('userName', 'John Doe');
        expect(findUser).to.have.property('email', 'john.doe@example.com');
        expect(findUser).to.have.property('roleID', 1);
        expect(findUser).to.have.property('meta').that.has.property('isDeleted', false);

        // Arrange: Login before calling authenticated API
        const loginRes = await agent
          .post('/api/login')
          .send({ email: 'john.doe@example.com', password: 'TestPassword' })
          .expect(200);

        const res = await agent
          .get('/api/getUserDetails')
          .expect(200);

        // Assert: Verify response
        expect(res.body).to.have.property('userName', 'John Doe');
        expect(res.body).to.have.property('email', 'john.doe@example.com');
        expect(res.body).to.have.property('fullName', 'John Doe');
        expect(findUser).to.have.property('meta').that.has.property('isDeleted', false);
        expect(findUser).to.have.property('roleID', 1);

      });

      it.skip('should block unauthenticated user from /api/getUserDetails', async () => {
        const loginRes = await agent
          .post('/api/login')
          .send({ email: 'john.doe@example.com', password: 'TestPassword' })
          .expect(200);

        // Act: Make HTTP request
        const res = await request(server)
          .get('/api/getUserDetails')
          .expect(200);

        // Assert
        expect(res.body).to.deep.equal({});
      });  
  });


});