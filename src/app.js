const ClockController = require('./model/SimpleClockController')
const getDateTime = require('./util/getTime')

const express = require('express')


//lets create some clocks
let ctrl = new ClockController()

// time of day clock
let clk1 = ctrl.createClock("ToD")
ctrl.start(clk1)

let vclock = ctrl.createClock("Video")

//heroku or default port
//const port = process.env.PORT ||  3010
const port = 3010

const app = express()

app.listen(port, () => {
    console.log('Server has started on port ' + port)
})

//render inline - json
app.get('/', (req, res) => {
    if (!req.query.address) {
        return res.send(
            ctrl.viewClockData()
        )
    }
})