
# Resort/Hotel Managment System

This is a management system designed specifically for hotels and resorts. It streamlines operations by providing comprehensive modules for employees, reservations, and orders.

1. **Employee Module**: We can create roles and employees. The created employees are listed and can be edited.
2. **Reservation Module**
   - User can create rooms for booking.
   - We can edit the price and condition status of the room.
   - The room status is initially set to available.
   - When a customer books available rooms, customer information is added.
   - On checking out the rooms, invoice is generated to bill the customer.
   - A customer can pay partially, in advance and after service.
   - A customer can order foods and beverages which is tapped on the account of customer.
4. **Order Module**
   - Admin creates menus available in the restaurant and tables for spot.
   - Waiter have separate page for reserving tables from the available ones.
   - Waiter are then able to place order for the reserved tables.
6. **Inventory Module**
   - The items that needs to ordered externally and stocked can be placed in category.
   - Admin is able to add inventory item, edit the number of quantity based on stock added or reduced.
   - The inventory items are also available as menu item.
   - When the inventory menu item is order, the inventory stock dwindles.
   - When the inventory item reaches below a particular number, a warning email is sent to appropriate authority. 

## Authors

- [Rohit Kawari](https://github.com/RohitY2J)
- [Samyog Adhikari]()

## Architecture Diagram

![Authentication Flow](https://github.com/RohitY2J/hotel-mgmt-system/blob/main/architecture_diagram.gif)

## Deployment

To deploy this project run

```bash
  npm install
  npm build
  npm run start-server
```
## To run locally

1. **npm install** (node version -> 20.12.2)
2. set mongodb url in **.env file**
3. **npm build**
4. **npm run start-server** -> runs nodejs and express to serve web page from npm build
5. **npm run start** -> front-end server to serve angular page.

## To run on Docker

1. npm install
2. set the environment variables for angular and node in folder env/ 
3. npm build
4. docker setup
5. docker-compose build --no-cache
6. docker-compose up -d

# After integrating with CAS application [Visit CAS repository](https://github.com/RohitY2J/Centralized-Authentication-System)

After logging into the CAS system
1. Create a user in the CAS system
2. Create an application in CAS system, with the following valid property. 
  - Application URL: For solving cors,
  - Redirect URL: For callback
3. Create a tenant in the CAS system
4. Assign tenant to application
5. Assign the user to the application and tenant
6. Create a client with clientid set to the tenant id in this application in the mongodb using query.


## Features

- Employee creation and tracking
- Employee role creation and assignment
- Employee schedule, shift and job tracking
- Room creation
- Reservation creation for customer
- Inventory creation, management and tracking
- Menu and table creation
- Order placement
- Responsive pages
- kitchen tracking
- Bill tracking and generation
- Centralized Authentication Integration

## Technologies Used

## Technologies Used

- **Angular**:
  - Component-based architecture with standalone components for modular UI development.
  - HTTP client for RESTful API communication with RxJS Observables.
  - Reactive forms for dynamic form handling and validation.
  - Angular Router for client-side navigation and routing.
  - Tailwind css for styling
  - Testing with Karma and Jasmine for unit and integration tests.

- **Node.js**:
  - Cookies-based authentication with Passport.js for secure session management.
  - Integration with centralized authentication system for authentication (enhancement)
  - Integration with MongoDB for backend data persistence.
  - Testing with Mocha, Chai, Sinon, Supertest, Mongo-Memory-Server
  - Handling file upload for profile and menu management

- **Express**:
  - RESTful API development with route handling and middleware.
  - CORS support for cross-origin requests from Angular frontend.
  
- **MongoDB**:
  - NoSQL database for flexible, schema-less data storage.
  - Mongoose ODM for schema definition, validation, and querying.
  - Aggregation pipelines for advanced data processing and reporting.

- **GitHub Workflow (CI/CD) And Docker**:
  - Automated testing with GitHub Actions for running Karma/Jasmine tests and api testing using Mocha/Chai on push/pull requests.
  - Continuous integration for linting and building Angular and Node.js applications.
  - Dockerization for containerized deployment and testing of Angular and Node.js applications along with Mongodb Integration.
  
## Users
Before integration with CAS application [Visit CAS repository](https://github.com/RohitY2J/Centralized-Authentication-System)
- Waiter = 0
- Admin = 1

After Integration with CAS application [Visit CAS repository](https://github.com/RohitY2J/Centralized-Authentication-System)
- Waiter = Role_Waiter 
- Admin = Role_Admin

## API

|API | Description |
|------|---------|
| /api/login/create | To create login user |
| /api/login | To login into user | 

