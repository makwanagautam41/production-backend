import app from "./src/app.ts";
import { config } from "./src/config/config.ts";
import connectDB from "./src/config/db.ts";

const startServer = ()=>{
    const port = config.port || 3000;

    connectDB()

    app.listen(port,()=>{
        console.log("Listning on server:",port)
    })
}

startServer()