const express = require('express')
const clockRouter = require('./routers/clock') 
const cors = require("cors");

//create server
const app = express()
const port = process.env.PORT || 3010

//configure server
app.use(express.json())
app.use(cors())
app.use(clockRouter)
app.use(express.static('public'))


//start server
app.listen(port, () => {
    console.log('Server listening on port ' + port)
})