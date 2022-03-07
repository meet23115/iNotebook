const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'ThisIsaSecretStringForAuthentication';

// ROUTE 1: Create a user using POST "/api/auth/createuser". No login required
router.post('/createuser', [
    body('name', "Name is required").isString(),
    body('email', "Email is required").isEmail(),
    body('password', "Password must be at least 8 characters").isLength({ min: 8 }),
], async (req, res) => {
    // If there are errors, retuern Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Check whether the user with this email exists already
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ error: "User with this email already exists" })
        }
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);

        // Create new user
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass,
        })
        const data = {
            user:{
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        // res.json(user)
        res.json({authToken})

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Something went wrong!!!");
    }
})

// ROUTE 2: Authenticate a user using POST "/api/auth/login". No login required
router.post('/login', [
    body('email', "Email is required").isEmail(),    
    body('password', "Password is required").exists(),    
], async (req, res) => {
    // If there are errors, retuern Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {email, password} = req.body;
    try {
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({error: "Please enter correct details"});
        }

        const passwordCompare = await bcrypt.compare(password, user.password);
        if(!passwordCompare){
            return res.status(400).json({error: "Please enter correct details"});
        }

        const data = {
            user:{
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        // res.json(user)
        res.json({authToken})

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Something went wrong!!!");
    }
})

// ROUTE 3: Get authenticated user details using POST "/api/auth/getuser". Login required
router.post('/getuser', fetchuser, async (req, res) => {
    try {
        userId = req.user.id;
        const user = await User.findById(userId).select("-password")
        res.send(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Something went wrong!!!");
    }
})

module.exports = router