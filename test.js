userSchema.methods.verifyCitizenship = async function () {
    const Citizenship = mongoose.model('Citizenship'); 
    const citizenship = await Citizenship.findOne({ citizenshipNo: this.citizenshipNo });
    if (citizenship) {
      this.isVerified = true;
      await this.save();
    }
  };