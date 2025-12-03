import app from "./src/app";
import { config } from "./src/config/config";
import connectDB from "./src/config/db";

const startServer = ()=>{
    const port = config.port || 3000;

    connectDB()

    app.listen(port,()=>{
        console.log("Listning on server:",port)
    })
}

startServer()