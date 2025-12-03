import app from "./src/app.ts";

const startServer = ()=>{
    const port = process.env.PORT || 3000;

    app.listen(port,()=>{
        console.log("Listning on server:",port)
    })
}

startServer()