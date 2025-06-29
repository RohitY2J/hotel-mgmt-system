process.env.NODE_ENV = 'test';
const { app, server, mongoose } = require('../index');

describe('Admin API Tests', () => {
  let mongoServer;
  let request;
  let expect;
  let sinon;
  let dbContext;

  // Setup before all tests
  before(async () => {
    let chai = await import('chai');
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
    server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Admin Endpoints', () => {
    let clientId;
    let roleId;

    beforeEach(async () => {
       agent = request.agent(server);
      // Insert a mock Client
      let client = new dbContext.Client({ name: 'Test Client' });
      await client.save();
   
      clientId = client._id;

      user = new dbContext.User({
        email: 'test.user@example.com',
        userName: 'Test User',
        clientId: client._id,
        fullName: 'Test User',
        phNum: '1234567890',
        roleID: 1, // Admin
      });
      user.setPassword('TestPassword');
      await user.save();

      await agent
        .post('/api/login')
        .send({ email: 'test.user@example.com', password: 'TestPassword' });

      // Insert a mock Role
      let role = new dbContext.Role({ roleName: 'Manager', clientId });
      await role.save();

      roleId = role._id;

      let employee = new dbContext.Employee({
        firstName:"Test",
        lastName: "User",
        'contactInfo.email': "test.user@example.com",
        clientId: client._id,
        role: role._id
      });
      await employee.save();

      // Mock middleware to set req.clientId
      // sinon.stub(require('../routes/api'), 'middleware').callsFake((req, res, next) => {
      //   req.user = { clientId: clientId.toString() };
      //   req.clientId = clientId;
      //   console.log('Middleware stub: req.clientId =', req.clientId);
      //   next();
      // });

      // Mock FileUpload.single
      sinon.stub(require('../helper/file_upload').FileUpload, 'single').returns((req, res, next) => {
        req.file = { filename: 'profile.jpg' };
        next();
      });

      // Mock conversion.ToObjectId
      sinon.stub(require('../helper/conversion'), 'ToObjectId').callsFake((id) => {
        return new mongoose.Types.ObjectId(id);
      });

      // Mock businessLogic
      sinon.stub(require('../business-logic').EmployeeLogic, 'getEmployee').resolves([
        { firstName: 'John', lastName: 'Doe', contactInfo: { email: 'john.doe@example.com' } },
      ]);
      sinon.stub(require('../business-logic').EmployeeDailyActivityLogic, 'getEmployeeSchedules').resolves([
        { scheduleId: '123', employeeId: '456' },
      ]);
      sinon.stub(require('../business-logic').EmployeeDailyActivityLogic, 'updateEmployeeSchedule').resolves();
    });

    afterEach(async () => {
      sinon.restore();
      await dbContext.Employee.deleteMany({});
      await dbContext.Client.deleteMany({});
      await dbContext.Role.deleteMany({});
      await dbContext.User.deleteMany({});
    });

    describe('POST /api/admin/createEmployee', () => {
      it('should return 422 if required fields are missing', async () => {
        const res = await agent
          .post('/api/admin/createEmployee')
          .send({})
          .expect(422);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'validation failed');
        expect(res.body.error).to.include.members([
          'FirstName is needed',
          'LastName is needed',
          'Email is needed',
          'Phone Number is needed',
          'Role is needed'
        ]);
      });

      it('should return 422 if employee already exists', async () => {
        const res = await agent
          .post('/api/admin/createEmployee')
          .send({
            firstName: 'Test',
            lastName: 'User',
            email: 'test.user@example.com',
            phoneNumber: '1234567890',
            role: roleId.toString(),
          })
          .expect(422);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'User with that email and name already exists');
      });

      it('should create an employee successfully', async () => {
        //sinon.stub(require('../routes/api/admin'), 'checkIfEmployeeExists').resolves(null);

        const res = await agent
          .post('/api/admin/createEmployee')
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '1234567890',
            address: '123 Main St',
            role: roleId.toString(),
          })
          .expect(200);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('msg', 'success');

        const savedEmployee = await dbContext.Employee.findOne({ 'contactInfo.email': 'john.doe@example.com' });
        expect(savedEmployee).to.exist;
        expect(savedEmployee).to.have.property('firstName', 'John');
        expect(savedEmployee).to.have.property('lastName', 'Doe');
        expect(savedEmployee.contactInfo).to.have.property('email', 'john.doe@example.com');
      });

      it('should handle database errors', async () => {
        sinon.stub(dbContext.Employee.prototype, 'save').rejects(new Error('Database error'));

        const res = await agent
          .post('/api/admin/createEmployee')
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '1234567890',
            role: roleId.toString(),
          })
          .expect(500);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'Error encountered: Database error');
      });
    });

    describe('POST /api/admin/updateEmployee', () => {
      let employeeId;
      beforeEach(async () => {
        const employee = new dbContext.Employee({
          firstName: 'Jane',
          lastName: 'Smith',
          contactInfo: {
            phone: '0987654321',
            email: 'jane.smith@example.com',
          },
          role: roleId,
          clientId,
          meta: { isDeleted: false },
        });
        await employee.save();
        employeeId = employee._id;
      });

      it('should return 422 if required fields are missing', async () => {
        const res = await agent
          .post('/api/admin/updateEmployee')
          .send({})
          .expect(422);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'validation failed');
        expect(res.body.error).to.include.members([
          'Employee id is missing',
          'FirstName is needed',
          'LastName is needed',
          'Email is needed',
          'Phone Number is needed',
          'Role is needed'
        ]);
      });

      it('should update an employee successfully', async () => {
        const res = await agent
          .post('/api/admin/updateEmployee')
          .send({
            employeeId: employeeId.toString(),
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '1234567890',
            address: '456 Main St',
            role: roleId.toString(),
          })
          .expect(200);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('msg', 'success');

        const updatedEmployee = await dbContext.Employee.findById(employeeId);
        expect(updatedEmployee).to.have.property('firstName', 'John');
        expect(updatedEmployee).to.have.property('lastName', 'Doe');
        expect(updatedEmployee.contactInfo).to.have.property('email', 'john.doe@example.com');
        //expect(updatedEmployee.documents[0]).to.have.property('fileObject', 'profile.jpg');
      });

      it('should handle database errors', async () => {
        sinon.stub(dbContext.Employee.prototype, 'save').rejects(new Error('Database error'));

        const res = await agent
          .post('/api/admin/updateEmployee')
          .send({
            employeeId: employeeId.toString(),
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '1234567890',
            role: roleId.toString(),
          })
          .expect(500);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'Error encountered: Database error');
      });
    });

    // describe('POST /api/admin/deleteEmployee', () => {
    //   let employeeId;

    //   beforeEach(async () => {
    //     const employee = new dbContext.Employee({
    //       firstName: 'Jane',
    //       lastName: 'Smith',
    //       contactInfo: { email: 'jane.smith@example.com' },
    //       role: roleId,
    //       clientId,
    //       meta: { isDeleted: false },
    //     });
    //     await employee.save();
    //     employeeId = employee._id;
    //   });

    //   it('should delete an employee successfully', async () => {
    //     const res = await agent
    //       .post('/api/admin/deleteEmployee')
    //       .send({ _id: employeeId.toString() })
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('message', 'Delete successfully');

    //     const deletedEmployee = await dbContext.Employee.findById(employeeId);
    //     expect(deletedEmployee.meta).to.have.property('isDeleted', true);
    //   });

    //   it('should handle database errors', async () => {
    //     sinon.stub(dbContext.Employee.prototype, 'save').rejects(new Error('Database error'));

    //     const res = await agent
    //       .post('/api/admin/deleteEmployee')
    //       .send({ _id: employeeId.toString() })
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('message', 'Database error');
    //   });
    // });

    // describe('POST /api/admin/createEmployeeRole', () => {
    //   it('should return 422 if required fields are missing', async () => {
    //     const res = await agent
    //       .post('/api/admin/createEmployeeRole')
    //       .send({})
    //       .expect(422);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'validation failed');
    //     expect(res.body.error).to.include.members(['RoleName is needed', 'Client id is needed']);
    //   });

    //   it('should return 422 if role already exists', async () => {
    //     const res = await agent
    //       .post('/api/admin/createEmployeeRole')
    //       .send({ roleName: 'Manager' })
    //       .expect(422);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Role already exists.');
    //   });

    //   it('should create a role successfully', async () => {
    //     const res = await agent
    //       .post('/api/admin/createEmployeeRole')
    //       .send({ roleName: 'Admin' })
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('msg', 'success');

    //     const savedRole = await dbContext.Role.findOne({ roleName: 'Admin', clientId });
    //     expect(savedRole).to.exist;
    //     expect(savedRole).to.have.property('roleName', 'Admin');
    //   });

    //   it('should handle database errors', async () => {
    //     sinon.stub(dbContext.Role.prototype, 'save').rejects(new Error('Database error'));

    //     const res = await agent
    //       .post('/api/admin/createEmployeeRole')
    //       .send({ roleName: 'Admin' })
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Error encountered: Database error');
    //   });
    // });

    // describe('POST /api/admin/getEmployees', () => {
    //   it('should retrieve employees successfully', async () => {
    //     const res = await agent
    //       .post('/api/admin/getEmployees')
    //       .send({})
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('message', 'Successfully retrieved all the employees');
    //     expect(res.body.data).to.be.an('array');
    //     expect(res.body.data[0]).to.have.property('firstName', 'John');
    //   });

    //   it('should handle errors', async () => {
    //     sinon.stub(require('../../business-logic').EmployeeLogic, 'getEmployee').rejects(new Error('Database error'));

    //     const res = await agent
    //       .post('/api/admin/getEmployees')
    //       .send({})
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('message', 'Database error');
    //   });
    // });

    // describe('GET /api/admin/getRoles', () => {
    //   it('should return 422 if clientId is missing', async () => {
    //     sinon.stub(require('../index'), 'middleware').callsFake((req, res, next) => {
    //       res.status(400).send('Client ID is required');
    //     });

    //     const res = await agent
    //       .get('/api/admin/getRoles')
    //       .expect(400);

    //     console.log('Response body:', res.text);
    //     expect(res.text).to.equal('Client ID is required');
    //   });

    //   it('should retrieve roles successfully', async () => {
    //     const res = await agent
    //       .get('/api/admin/getRoles')
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('message', 'Successfully retrieved all the roles');
    //     expect(res.body.data).to.be.an('array');
    //     expect(res.body.data[0]).to.have.property('roleName', 'Manager');
    //   });

    //   it('should handle database errors', async () => {
    //     sinon.stub(dbContext.Role, 'find').rejects(new Error('Database error'));

    //     const res = await agent
    //       .get('/api/admin/getRoles')
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('message', 'Database error');
    //   });
    // });

    // describe('POST /api/admin/getEmployeeSchedule', () => {
    //   it('should retrieve schedules successfully', async () => {
    //     const res = await agent
    //       .post('/api/admin/getEmployeeSchedule')
    //       .send({})
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('message', 'Successfully retrieved schedules');
    //     expect(res.body.data).to.be.an('array');
    //     expect(res.body.data[0]).to.have.property('scheduleId', '123');
    //   });

    //   it('should handle errors', async () => {
    //     sinon.stub(require('../../business-logic').EmployeeDailyActivityLogic, 'getEmployeeSchedules').rejects(new Error('Database error'));

    //     const res = await agent
    //       .post('/api/admin/getEmployeeSchedule')
    //       .send({})
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('message', 'Database error');
    //   });
    // });

    // describe('POST /api/admin/updateEmployeeSchedule', () => {
    //   it('should update schedule successfully', async () => {
    //     const res = await agent
    //       .post('/api/admin/updateEmployeeSchedule')
    //       .send({})
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('message', 'Updated employee schedule successfully');
    //   });

    //   it('should handle errors', async () => {
    //     sinon.stub(require('../../business-logic').EmployeeDailyActivityLogic, 'updateEmployeeSchedule').rejects(new Error('Database error'));

    //     const res = await agent
    //       .post('/api/admin/updateEmployeeSchedule')
    //       .send({})
    //       .expect(200); // Note: Route doesn't handle errors properly

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true); // Bug in route: no error response
    //   });
    // });

    // describe('POST /api/admin/getEmployeeName', () => {
    //   beforeEach(async () => {
    //     await dbContext.Employee.create({
    //       firstName: 'John',
    //       lastName: 'Doe',
    //       contactInfo: { email: 'john.doe@example.com' },
    //       role: roleId,
    //       clientId,
    //       meta: { isDeleted: false },
    //     });
    //   });

    //   it('should return 422 if clientId is missing', async () => {
    //     sinon.stub(require('../routes/api'), 'middleware').callsFake((req, res, next) => {
    //       res.status(400).send('Client ID is required');
    //     });

    //     const res = await agent
    //       .post('/api/admin/getEmployeeName')
    //       .send({})
    //       .expect(400);

    //     console.log('Response body:', res.text);
    //     expect(res.text).to.equal('Client ID is required');
    //   });

    //   it('should retrieve employee names successfully', async () => {
    //     const res = await agent
    //       .post('/api/admin/getEmployeeName')
    //       .send({ filterValue: 'John' })
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('msg', 'employee names retrived successfully');
    //     expect(res.body.data).to.include('John Doe');
    //   });

    //   it('should handle database errors', async () => {
    //     sinon.stub(dbContext.Employee.find, 'exec').rejects(new Error('Database error'));

    //     const res = await agent
    //       .post('/api/admin/getEmployeeName')
    //       .send({})
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Error encountered: Database error');
    //   });
    // });
  });
});