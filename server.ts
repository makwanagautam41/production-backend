import app from "./src/app.ts";
import { config } from "./src/config/config.ts";

const startServer = ()=>{
    const port = config.port || 3000;

    app.listen(port,()=>{
        console.log("Listning on server:",port)
    })
}

startServer()