const express = require("express");
const fetchuser = require("../middleware/fetchuser");
const router = express.Router()
const Note = require('../models/Notes')
const { body, validationResult } = require('express-validator');
const nodemon = require("nodemon");

// receiving a note using post of a user "/api/notes/fetchallnote". 
router.get('/fetchallnotes', fetchuser, async (req,res)=>{
   try {
      const notes = await Note.find({user: req.user.id})
      res.json(notes)
   } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
   }
})

// adding a note using post "/api/notes/addnote". 
router.post('/addnote',fetchuser,[
   body('title','enter a title').isLength({min:3}),
   body('description','enter a decription with min 5 letters').isLength({min:5}),
], async (req,res)=>{
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
   try {
      const {title, description, tag} =req.body;
      const note = new Note({
         title, description, tag, user:req.user.id
      })
      const savednote = await note.save()
      res.json(savednote)
   } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
   }   
})

// update an existing node using put "/api/notes/updatenote/:id". Login required

router.put('/updatenote/:id', fetchuser ,async (req, res)=>{
   const {title, description, tag} =req.body;
   // create newNote object
   try {
      const newNote = {};
      if(title){newNote.title = title};
      if(description){newNote.description = description};
      if(tag){newNote.tag = tag};
      
      // find the note to be updated 
      let note = await Note.findById(req.params.id);
      if(!note){return res.status(404).send("not found")}
   
      if(note.user.toString()!== req.user.id){
         return res.status(401).send("not allowed")
      }  
      note = await Note.findByIdAndUpdate(req.params.id,{$set: newNote}, {new:true})
      res.json({note})
   } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
   }
})

// delete an node using delete "/api/notes/deletenote/:id". Login required
router.delete('/deletenote/:id', fetchuser ,async (req, res)=>{
   try {
      // find the note to be deleted
      let note = await Note.findById(req.params.id);
      if(!note){return res.status(404).send("not found")}
   
      // delete if user owns this node
      if(note.user.toString()!== req.user.id){
         return res.status(401).send("not allowed")
      }  
      note = await Note.findByIdAndDelete(req.params.id)
      res.json({"success":"note has been deleted", note: note});
      
   } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
   }
})

module.exports = router
