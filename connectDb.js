const mongoose = require("mongoose")

const connectDb = async () => {
    try{
        const conn = await mongoose.connect("mongodb+srv://gokuldesk:deskDb@desktopdb.3pv8a.mongodb.net/gokuldesk?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        })
        console.log('Connect to Mongodb', conn)
    }catch(e){
        console.log(e)
        process.exit(1)
    }
}

module.exports = connectDb