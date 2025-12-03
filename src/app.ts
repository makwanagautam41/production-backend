import express from "express"
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express()

//routes
app.get("/",(req,res,next)=>{
    res.json({message:"this is server root route"})
})


app.use(globalErrorHandler);


export default app;