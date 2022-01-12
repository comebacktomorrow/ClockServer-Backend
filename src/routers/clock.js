const express = require('express')

const router = new express.Router()


const ClockController = require('../model/SimpleClockController')
const getDateTime = require('../util/getTime')

//lets create some clocks
let ctrl = new ClockController()

// time of day clock
let clk1 = ctrl.createClock("ToD")
console.log("My data is " + clk1.id)

let clk2 = ctrl.createClock("Up", 30)
console.log("My data is " + clk2.id)

let clk3 = ctrl.createClock("AMP")
console.log("My data is " + clk3.id)

//console.log(ctrl.getClockByID(0))
ctrl.start(clk1.id)

//let vclock = ctrl.createClock("Video")


//routes to create
// .post - create clock - basic works, no error handling
// .get:id - specific clock - basic works, no error handling
// get/ - all clocks - basic works, no handling
// delete - remove clock
// put - update clock in place
// put is also used to change clock state

router.post('/clocks/:id/hide/', (req, res) => {
    const clock_id = parseInt(req.params.id)
    const clockType = req.body.type
    console.log("REST: Display clock data id:" + clock_id + " DATA: " + JSON.stringify(req.body))

    const clock_data = ctrl.hide(clock_id)
    res.send([{isHidden: true}])

})

router.post('/clocks/:id/show/', (req, res) => {
    const clock_id = parseInt(req.params.id)
    const clockType = req.body.type
    console.log("REST: Display clock data id:" + clock_id + " DATA: " + JSON.stringify(req.body))

    const clock_data = ctrl.show(clock_id)
    res.send([{isHidden: false}])

})

router.post('/clocks/:id/reset/', (req, res) => {
    const clock_id = parseInt(req.params.id)
    const clockType = req.body.type
    console.log("REST: Reset clock data id:" + clock_id + " DATA: " + JSON.stringify(req.body))

    const clock_data = ctrl.reset(clock_id)
    res.send([{time: 0}])

})

router.post('/clocks', (req, res) => {
    const clockType = req.body.type
    console.log("REST: Create new clock " + req.body.type)
    let new_clock = ctrl.createClock(req.body.type)
    console.log(new_clock)
    res.send(JSON.stringify(new_clock))
    
})

router.get('/clocks/:id', async (req, res) => {
    const clock_id = parseInt(req.params.id)
    console.log('REST: Get data for clock id: '+ clock_id)
    //
    const clock_data = ctrl.getClockInstance(clock_id)
    

    try {
        //res.send('hello world')
        return res.send(
            JSON.stringify(clock_data)
        )
    } catch (e) {
        res.status(400).send(e)
    }
})

//we could do a get clock by name, getting only clocks that are visible, prioritised by closest end time?

//default route
router.get('/clocks', async (req, res) => {
    //console.log('REST: Getting data for ALL clocks')

    try {
        //res.send('hello world')
        return res.send(
            ctrl.viewClockData()
        )
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/clocks/:id', (req, res) => {
    const clock_id = parseInt(req.params.id)
    console.log('REST: Delete clock id: '+ clock_id)

    const clock_data = ctrl.removeClock(clock_id)
    
    if (clock_data === true) {
        console.log("REST: Clock seems deleted")
    } 

    try {
        //res.send('hello world')
        return res.send({deleted: true}
        )
    } catch (e) {
        res.status(400).send(e)
    }
    
})


router.patch('/clocks/:id', (req, res) => {
    const allowedUpdates = ['name', 'clockState', 'isHidden', 'red_overrun', 'targetTime']
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    const clock_id = parseInt(req.params.id)

    console.log("REST: Patch clock data id:" + clock_id + " DATA: " + JSON.stringify(req.body))

    if (!isValidOperation) {
        console.log("REST: Recieved invalid patch command")
        return res.status(400).send({error: 'Invalid updates'})
    }

    try {
        const update = ctrl.updateClockData(clock_id, req.body)
        res.send(JSON.stringify(update))
        console.log(update)
    } catch (e) {
         res.status(500).send()
    }
    
})

module.exports = router