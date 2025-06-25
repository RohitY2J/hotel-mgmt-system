
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

1. **npm install**
2. set mongodb url in **.env file**
3. **npm build**
4. **npm run start-server** -> runs nodejs and express to serve web page from npm build
5. **npm run start** -> front-end server to serve angular page.


## Features

- Employee creation and tracking
- Emoployee role creation and assignment
- Emoloyee schedule, shift and job tracking
- Room creation
- Reservation creation for customer
- Inventory creation, management and tracking
- Menu and table creation
- Order placement
- Responsive pages
- kitchen tracking
- Bill tracking and generation

## Technologies Used

- Angular
- TypeScript
- Node.js
- Express
- Mongodb

## Users

- Waiter
- Admin 

## API

|API | Description |
|------|---------|
| /api/login/create | To create login user |
| /api/login | To login into user | 

