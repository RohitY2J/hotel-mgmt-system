const express = require('express')
const passport = require('passport');
const router = express.Router()
const dbContext = require('../../model');


router.post('/login', function (req, res, next) {
    const user = req.body;
    if (!user.email) {
        return res.status(422).json({
            success: false,
            msg: 'email is required'
        });
    }

    if (!user.password) {
        return res.status(422).json({
            success: false,
            msg: 'password is required'
        });
    }

    passport.authenticate('local',
        async (err, passportUser, info) => {
            if (err) {
                return res.status(422).json({
                    success: false,
                    msg: err.message
                });
            }
            if (passportUser) {
                if (!passportUser.meta.isDelete) {

                    req.logout();
                    let loggedInUserData = passportUser.userSimplified();
                    req.logIn(loggedInUserData, function (err, obj) {
                        res.json({
                            success: true,
                            msg: 'Success',
                            data: obj
                        });
                    });
                }
                else {
                    return res.status(422).json({
                        success: false,
                        msg: 'Account has been blocked'
                    });
                }
            }
            else {
                return res.status(422).json({
                    success: false,
                    msg: info.message
                });
            }
        })(req, res, next);
})


router.post('/login/create', async function (req, res) {
    user = req.body;

    if (!user.userName) {
        return res.status(422).json({
            success: false,
            msg: 'user is required'
        });
    }

    if (!user.password) {
        return res.status(422).json({
            success: false,
            msg: 'password is required'
        });
    }

    if (!user.email) {
        return res.status(422).json({
            success: false,
            msg: 'email is required'
        });
    }


    try {
        // Check if user with email already exists
        const existingUser = await checkIfUserExists(user.email);
        if (existingUser) {
            res.status(422).json({
                success: false,
                msg: 'User with that email already exists'
            });
        }

        // Create new user
        const newUser = new dbContext.User({
            userName: user.userName,
            email: user.email,
            fullName: user.fullName,
            phNum: user.phNum
        });

        newUser.setPassword(user.password);

        await newUser.save();
        console.log('User created successfully:', newUser);
        return res.status(200).json({
            success: true,
            msg: 'success'
        });
    }
    catch (err) {
        res.status(422).json({
            success: false,
            msg: err.message
        });
    }
})

router.use('/admin',require('./admin'));

//reservation api
router.use("/reservation", require("./reservationController"));

router.use("/room", require("./roomController"));

router.use("/menu",require("./menuController"));

router.use("/order", require("./orderController"));

router.use("/inventory", require("./inventoryController"));

router.use("/table", require("./tableController"));
// Function to check if a user with given email exists
async function checkIfUserExists(email) {
    const user = await dbContext.User.findOne({ email: email });
    return user; // Returns null if user not found, otherwise returns the user object
}

module.exports = router;



