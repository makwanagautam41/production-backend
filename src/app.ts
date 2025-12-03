import express from "express"
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/user.routes";

const app = express()

app.use(express.json());

//routes
app.get("/",(req,res,next)=>{
    res.json({message:"this is server root route"})
})

app.use("/api/v1/users",userRouter)


app.use(globalErrorHandler);


export default app;