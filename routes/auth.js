const express = require("express");
const User = require('../models/User')
const router = express.Router()
const { body, validationResult } = require('express-validator');
const { response } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");

const JWT_SECRET = "aayushsamaiyardeveloper"

// create a user using: POST "/api/auth/createuser", no login required

router.post('/createuser',[
   body('name','enter a valid name').isLength({min:5}),
   body('email','enter a valid email').isEmail(),
   body('password','password must be at least 5 characters').isLength({ min: 5 }),
],async (req,res)=>{
   let success = false;
   // if there are errors, return bad request and errors
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({success, errors: errors.array() });
   }
   // chec whether user with this email exist
   try{
      let user = await User.findOne({email: req.body.email});
      if (user){
         return res.status(400).json({success,error: "email exists"})
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

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

      const authtoken = jwt.sign(data,JWT_SECRET)
      success=true
      // res.json(user)
      res.json({success,authtoken})

   }catch(error){
      console.error(error.message);
      res.status(500).send("Internal server error");
   }
})

// authenticate a user using post "/api/auth/login". No login required

router.post('/login',[
   body('email','enter a valid email').isEmail(),
   body('password','cannot be blank').exists(),
], async (req,res) =>{
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }

   const {email, password} = req.body;
   try {
      let user =await User.findOne({email});
      if (!user){
         success = false
         return res.status(400).json({success, error: "please try to login with correct credentials"})
      }
      const passwordCompare = await bcrypt.compare(password, user.password)
      if (!passwordCompare){
         success = false
         return res.status(400).json({success,error: "please try to login with correct credentials"})
      }
      const payload = {
         user:{
            id: user.id
         }
      }
      const authtoken = jwt.sign(payload,JWT_SECRET)
      success = true;
      res.json({success, authtoken})

   }catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
   }
   
})

// get logged in user details using POST:// "/api/auth/getuser"

router.post('/getuser',fetchuser, async (req,res) =>{

   try {
      const userId = req.user.id;
      const user =  await User.findById(userId).select("-password")
      res.send(user)

   } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
   }
})


module.exports = router