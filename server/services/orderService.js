const dbContext = require('../model');
const conversion = require('../helper/conversion');
const globalConstants = require('../constants/globalConstants');


exports.createOrder = async (req, res, next) => {

    if (!req.clientId) {
        return res.status(422).json({
            success: false,
            msg: 'Client Id is required'
        });
    }

    let request = req.body;

    const io = req.app.get('socketio');

    let errors = [];
    if (!request.tableNumber) {
        errors.push("Table Number is required.");
    }

    if (errors.length > 0) {
        const errorString = errors.join('\n');
        return res.status(422).json({
            success: false,
            msg: errorString
        });
    }

    try {
        // Check if there is an existing pending order for the table number
        let existingOrder = await dbContext.Order.findOne({ tableNumber: request.tableNumber, status: 0, clientId: conversion.ToObjectId(req.clientId) });

        if (existingOrder) {
            // Update the existing pending order
            request.orders.forEach(order => {
                const existingOrderItem = existingOrder.orders.find(item => item.menuId.toString() === order.menuId);

                if (existingOrderItem) {
                    // Update the quantity and price if the item already exists in the order
                    existingOrderItem.qty += order.qty;
                    existingOrderItem.price = order.price; // Update the price if necessary
                } else {
                    // Add a new item to the existing order
                    existingOrder.orders.push({
                        menuId: conversion.ToObjectId(order.menuId),
                        qty: order.qty,
                        price: order.price,
                        name: order.name
                    });
                }
            });

            await existingOrder.save();

            io.emit('orderUpdated', existingOrder);

        } else {
            // Create a new order if no pending order exists
            const newOrder = new dbContext.Order({
                tableNumber: request.tableNumber,
                status: 0, // pending
                clientId: req.user.clientId
            });

            request.orders.forEach(order => {
                newOrder.orders.push({
                    menuId: conversion.ToObjectId(order.menuId),
                    qty: order.qty,
                    price: order.price,
                    name: order.name
                });
            });


            await newOrder.save();

            const existingTable = await dbContext.Table.findOne({ _id: conversion.ToObjectId(request.tableNumber) });
            existingTable.status = 0;

            await existingTable.save();

            io.emit('orderUpdated', newOrder);
        }

        request.orders.forEach(async (order) =>{
            console.log(order);
            if (order.inventoryId) {
                console.log(order.inventoryId);
                let inventoryDispatchRequest = {
                    inventoryItemId: order.inventoryId,
                    itemName: order.name,
                    actionType: globalConstants.InventoryActionType.Dispatch,
                    count: order.qty,
                    clientId: req.user.clientId
                  };
              
                  await dbContext.InventoryReceiveAndDispatch(inventoryDispatchRequest).save();

                  let inventoryUpdateRequest = {
                    $inc: { availableUnit: (0 - order.qty) }, //decrement item
                    lastAddedOn: Date.now(),
                };

                  let updateResult = await dbContext.Inventory.updateOne(
                    {_id: order.inventoryId},
                    inventoryUpdateRequest
                  );
                  console.log(updateResult);
            }

        });

            return res.status(200).json({
                success: true,
                msg: 'Order processed successfully!'
            });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Error encountered: " + err.message
        });
    }
};

exports.getSpecificOrder = async (req, res, next) => {
    tableNumber = conversion.ToObjectId(req.body.tableNumber);
    try {
        data = await dbContext.Order.findOne({ tableNumber: tableNumber, status: 0 });
        return res.status(200).json({
            success: true,
            msg: 'success',
            data: data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Error encountered:" + err.message
        });
    }
}

exports.getOrders = async (req, res, next) => {
    try {
        if (!req.clientId) {
            return res.status(422).json({
                success: false,
                msg: 'Client Id is required'
            });
        }

        filter = {clientId: conversion.ToObjectId(req.clientId)};

        if (req.body.hasOwnProperty('status') && (typeof req.body.status === 'number' || req.body.status != '')) {
            filter.status = conversion.convertStringToInt(req.body.status);
        }

        if (req.body.hasOwnProperty('tableNumber') && req.body.tableNumber != '') {
            filter.tableNumber = req.body.tableNumber;
        }

        if (req.body.hasOwnProperty('id')) {
            filter._id = conversion.ToObjectId(req.body.id);
        }

        // Extract pagination parameters
        const page = parseInt(req.body.pagination?.page) || 1;  // Default to page 1 if not provided
        const limit = parseInt(req.body.pagination?.pageSize) || 8;  // Default to 10 items per page if not provided
        const skip = (page - 1) * limit;

        const pipeline = [
            { $match: filter }, // Match initial filter conditions
            {
                $lookup: {
                    from: 'tables', // Name of the collection to join
                    localField: 'tableNumber', // Field from the Order collection
                    foreignField: '_id', // Field from the Database collection
                    as: 'table' // Output array field
                }
            },
            { $unwind: '$table' }, // Unwind the joined array
            { $skip: skip }, // Pagination: Skip the first 'skip' documents
            { $limit: limit } // Pagination: Limit to 'limit' documents
        ];

        const data = await dbContext.Order.aggregate(pipeline).exec();

        // data = await dbContext.Order.find(filter)
        //     .skip(skip)
        //     .limit(limit);

        data.forEach(record => {
            record.total = record.orders.reduce((total, order) => {
                return total + (order.price * order.qty);
            }, 0);
        })
        return res.status(200).json({
            success: true,
            msg: 'success',
            data: data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Error encountered:" + err.message
        });
    }
}

exports.getOrderBills = async (req, res, next) => {
    try {
        if (!req.clientId) {
            return res.status(422).json({
                success: false,
                msg: 'Client Id is required'
            });
        }


        filter = {clientId: conversion.ToObjectId(req.clientId)};
        
        if (req.body.hasOwnProperty('id')) {
            filter._id = conversion.ToObjectId(req.body.id);
        }
        
        // Extract pagination parameters
        //const page = parseInt(req.body.pagination?.page) || 1;  // Default to page 1 if not provided
        //const limit = parseInt(req.body.pagination?.pageSize) || 8;  // Default to 10 items per page if not provided
        //const skip = (page - 1) * limit;

        const pipeline = [
            { $match: filter }, // Match initial filter conditions
            {
                $lookup: {
                  from: 'bills', // Name of the collection to join
                  localField: '_id', // Field from the Bill collection
                  foreignField: 'orderId', // Field from the Order collection
                  as: 'bill' // Output array field
                }
            },
            { $unwind: '$bill' },
            {
                $lookup: {
                    from: 'tables', // Name of the collection to join
                    localField: 'tableNumber', // Field from the Order collection
                    foreignField: '_id', // Field from the Database collection
                    as: 'table' // Output array field
                }
            },
            { $unwind: '$table' }, // Unwind the joined array
        ];

        const data = await dbContext.Order.aggregate(pipeline).exec();

        // data = await dbContext.Order.find(filter)
        //     .skip(skip)
        //     .limit(limit);

        data.forEach(record => {
            record.total = record.orders.reduce((total, order) => {
                return total + (order.price * order.qty);
            }, 0);
        })
        return res.status(200).json({
            success: true,
            msg: 'success',
            data: data
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Error encountered:" + err.message
        });
    }
}

exports.billOrder = async (req, res, next) => {
    if (!req.body._id) {
        return res.status(422).json({
            success: false,
            msg: "Order Id is required"
        });
    }

    if (!req.clientId) {
        return res.status(422).json({
            success: false,
            msg: "Client Id is required"
        });
    }

    order = req.body;
    try {
        existingOrder = await dbContext.Order.findOne({ _id: conversion.ToObjectId(order._id) })

        existingOrder.customerName = order.customerName;
        existingOrder.status = order.status;

        bill =  new dbContext.Bill();
        bill.discountType = order.discountType;
        bill.discountAmt = order.discountAmt;
        bill.discountPercent = order.discountPercent;
        bill.taxType = order.taxType;
        bill.taxAmt = order.taxAmt ?? 0;
        bill.taxPercent = order.taxPercent ?? 0;
        bill.paymentType = order.paymentType;
        bill.grandTotal = order.totalPayable ?? 0;
        bill.orderId = conversion.ToObjectId(order._id);
        bill.clientId = conversion.ToObjectId(req.clientId);

        await existingOrder.save();
        await bill.save();

        existingTable = await dbContext.Table.findOne({ _id: conversion.ToObjectId(order.tableNumber), clientId: conversion.ToObjectId(req.clientId) })
        existingTable.status = 1;
        await existingTable.save();
        return res.status(200).json({
            success: true,
            msg: 'Status updated'
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Error encountered:" + err.message
        });
    }

}

exports.updateStatus = async (req, res, next) => {
    if (!req.body.orderId || !req.body.status) {
        return res.status(422).json({
            success: false,
            msg: "Order Id and status is required"
        });
    }

    try {
        const order = await dbContext.Order.findOne({ _id: conversion.ToObjectId(req.body.orderId) });
        order.status = req.body.status;

        await order.save();
        return res.status(200).json({
            success: true,
            msg: 'Status updated'
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Error encountered:" + err.message
        });
    }
}   
