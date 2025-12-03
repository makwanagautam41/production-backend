import express from "express"

const app = express()

//routes
app.get("/",(req,res,next)=>{
    res.json({message:"this is server root route"})
})

export default app;