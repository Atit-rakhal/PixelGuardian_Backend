const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String,
     required: true },


  email: { type: String,
     required: true, 
     unique: true },
  
     password: { 
        type: String,
         required: true },
  
         citizenshipNo: {
             type: String,
             required: true },

  photo: 
  { 
    type: String,
    required:true
},

isVerified:{
   type: Boolean,
   default: false
},
isAdmin:
{
type:Boolean,
default: false

}
});

const User = mongoose.model('User', userSchema);

module.exports = User;
