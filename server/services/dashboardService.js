const dbContext = require("../model");
const globalConstants = require("../constants/globalConstants");
const conversion = require("../helper/conversion");

exports.getDashboardData = async (req, res, next) => {
    try {
        const dashboardData = {
            billToday: 0,
            orderToday: 0,
            reservationToday: 0,
            salesToday: 0
        };
        if (!req.clientId) {
            return res.status(422).json({
                success: false,
                msg: 'Client Id is required'
            });
        }
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const result = await dbContext.Bill.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    },
                    clientId: conversion.ToObjectId(req.clientId)
                }
            },
            {
                $group: {
                    _id: null, // Group all documents together
                    totalGrandTotal: { $sum: "$grandTotal" } // Sum the grandTotal field
                }
            }
        ]).exec(); // Convert aggregation cursor to array

        dashboardData.salesToday = result[0].totalGrandTotal;

        dashboardData.orderToday = await dbContext.Order.countDocuments({
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            },
            clientId: conversion.ToObjectId(req.clientId)
        });

        dashboardData.reservationToday = await dbContext.Reservation.countDocuments({
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            },
            clientId: conversion.ToObjectId(req.clientId)
        });

        const cashInHandToday = await dbContext.Bill.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfDay,
                        $lt: endOfDay
                    },
                    clientId: conversion.ToObjectId(req.clientId),
                    paymentType: globalConstants.PaymentType.Cash
                }
            },
            {
                $group: {
                    _id: null, // Group all documents together
                    totalGrandTotal: { $sum: "$grandTotal" } // Sum the grandTotal field
                }
            }
        ]).exec(); // Convert aggregation cursor to array

        dashboardData.billToday = cashInHandToday[0].totalGrandTotal;;


        return res.status(200).send(dashboardData);
    } catch (err) {
        let errorRes = {
            message: "Error occurred while getting item.",
            error: err,
        };
        console.error(errorRes);
        return res.status(500).send(errorRes);
    }
};