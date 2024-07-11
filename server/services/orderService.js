const dbContext = require('../model');
const conversion = require('../helper/conversion');


exports.createOrder = async (req, res, next) => {
    let request = req.body;

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
        let existingOrder = await dbContext.Order.findOne({ tableNumber: request.tableNumber, status: 0 });

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
        } else {
            // Create a new order if no pending order exists
            const newOrder = new dbContext.Order({
                tableNumber: request.tableNumber,
                status: 0, // pending
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
        }

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
    tableNumber = req.body.tableNumber;
    try{
        data = await dbContext.Order.findOne({tableNumber: tableNumber, status: 0});
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
