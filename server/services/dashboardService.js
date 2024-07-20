const dbContext = require("../model");
const globalConstants = require("../constants/globalConstants");
const conversion = require("../helper/conversion");
const dayjs = require("dayjs");

exports.getDashboardData = async (req, res, next) => {
    try {
        const dashboardData = {
            billToday: 0,
            orderToday: 0,
            reservationToday: 0,
            salesToday: 0,
            reservationThisWeek: [],
            orderThisWeek: []
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

        if (result.length > 0)
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

        if (cashInHandToday.length > 0)
            dashboardData.billToday = cashInHandToday[0].totalGrandTotal;

        for (let i = 0; i < 7; i++) {
            const startOfDay = dayjs().subtract(i, 'day').startOf('day').toDate();
            const endOfDay = dayjs().subtract(i, 'day').endOf('day').toDate();

            const reservationCount = await dbContext.Reservation.countDocuments({
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                },
                clientId: conversion.ToObjectId(req.clientId) // Convert clientId to ObjectId
            });

            dashboardData.reservationThisWeek.unshift({ // Unshift to maintain ascending order
                date: dayjs(startOfDay).format('DD MMM'),
                count: reservationCount
            });
        }

        for (let i = 0; i < 7; i++) {
            const startOfDay = dayjs().subtract(i, 'day').startOf('day').toDate();
            const endOfDay = dayjs().subtract(i, 'day').endOf('day').toDate();

            const orderCount = await dbContext.Order.countDocuments({
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                },
                clientId: conversion.ToObjectId(req.clientId)
            });

            dashboardData.orderThisWeek.unshift({ // Unshift to maintain ascending order
                date: dayjs(startOfDay).format('DD MMM'),
                count: orderCount
            });
        }

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