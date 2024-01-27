// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app
      .listen(process.env.PORT, () => {
        console.log(`Server is listening on PORT:${process.env.PORT}`);
      })
      .on("err", (err) => {
        if (err.errno === "EADDRINUSE") {
          console.log(`${process.env.PORT} is busy.`);
        } else {
          console.log(`Error in Express app setup:${err}`);
        }
      });
  })
  .catch((err) => {
    console.log("MongoDB Connection failed:", err);
  });

app.get("/", (req, res) => {
  res.send({ message: "Server says hello!" });
});

/*

// Fisrt Approach

(async()=>{try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

    app.on('error', (error) => {
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
