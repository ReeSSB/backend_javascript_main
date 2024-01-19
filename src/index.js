// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import connectDB from "./db/db.js";

dotenv.config({
  path: "./env",
});

connectDB();

/*

// Fisrt Approach

(async()=>{try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

    app.on('error', () => {
        console.log('Error: refer app.on in index.js:', error)
        throw err;
    })

    app.listen(process.env.PORT, (error) => {
        if (error) { console.log('Error in listening',error); return error; }
        else { console.log(`Server is listening on PORT :${process.env.PORT}`) }

    })

} catch (error) {
    console.log(`Error:${error}`)
    throw err
    }
})()
*/
