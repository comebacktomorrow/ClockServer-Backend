const getDateTime = require('../util/getTime')
const { logTime, convertToHMS, convertToSeconds} = require('../util/convertTime')
const { AbsoluteTimer, TimeOfDay, AMPCtrlClock } = require ('./SimpleClockModel')
const e = require('express')

class ClockController {
    constructor() {
       this.clocksArray = []
       this.timer = this.refresh()
       this.clockData = []
       this.incrementId = 0

        this.now = getDateTime("seconds")

        if (!ClockController._instance) {
        ClockController._instance = this;
      }
      
      return ClockController._instance;
    }

    createClock(type="Up", targetTime, name, behaviour){
        let newClock = undefined
        const new_id = this.getNextID()
        console.log("next id will be")

        if (type === "Up"){
            console.log("CTRL: Add new up counter clock")
            newClock = new AbsoluteTimer(new_id, targetTime, name, behaviour, type)
        } else if (type === "Down" ){
            console.log("CTRL: Add new down counter clock")
            newClock = new AbsoluteTimer(new_id, targetTime, name, behaviour, type)
        } else if (type == "ToD") {
            console.log("CTRL: Add new TOD Clock")
            newClock = new TimeOfDay(new_id, targetTime, name, behaviour, type)
        } else if (type == "AMP") {
            console.log("CTRL: Add new video timer clock")
            newClock = new AMPCtrlClock(new_id, 13000)
        }
        
        this.clocksArray.push(newClock)

        //console.log(newClock)
        
        const confirmation = this.setClockID(newClock.id)

        if (confirmation === true) {
            console.log("CTRL: Clock created. ID: " + newClock.id)
            return newClock
        } else {
            console.log("CTRL: Could not create clock. No ID")
            return '{"error": "clock id not set, unable to create clock"}'
        }
    }

    removeClock(specficClockID){
        console.log("CTRL: Deleting clock at index " + specficClockID)
        let thisClock = this.getClockInstance(specficClockID)

        if(!thisClock) {
            console.log("CTRL: Clock does not exist")
            return false
        }

        const clockIndex = this.clocksArray.indexOf(thisClock)
        this.clocksArray.splice(clockIndex, 1) 
        
        return true
    }

    getNextID(){
        return this.incrementId
    }

    setClockID(newClockID){
        if (newClockID === this.incrementId)
        {
            this.incrementId = this.incrementId + 1
            return true
        } else {
            return false
        }
        
    }

    getClockInstance(specficClockID) {
        console.log("CTRL: Getting clock instance ID " + specficClockID)
        let thisClock = undefined
        let specificClock = this.clocksArray.filter((clock) => {
           if (clock.id === specficClockID) {
               console.log("CTRL: Found clock instance ID " + clock.id)
               thisClock = clock
           }
        })

        //we should probably throw some error code
       if (thisClock === undefined) {
            console.log("CTRL: Error. Could not find ID " + specficClockID)
        return false
       }

       return thisClock
    }

    viewClockData(){
        //console.log('CTRL: Getting ALL clock data')
        //****  UNCOMMENT THIS TO SHOW CLOCK DATA IN CONSOLE
        //console.log(this.clockData)
        return this.clockData
    }

    //I would like to have a different endpoint for control than setting data

    updateClockData(specficClockID, clockUpdates) {
        let thisClock = []
        let specificClock = this.clocksArray.filter((clock) => {
            if (clock.id === specficClockID) {
                console.log("CTRL: Clock found. Update ID=" + clock.id)
                console.log("CTRL: Data is " + JSON.stringify(clockUpdates))
                
                //thisClock = {...thisClock, clockUpdates}

                if (clockUpdates.name) {
                    clock.name = clockUpdates.name
                }
                
                if ('isHidden' in clockUpdates) {
                    console.log("CTRL:.. Updating isHidden for ID " + specficClockID)
                    if (clockUpdates.isHidden === true){
                        console.log("CTRL:... " + specficClockID + " calling hide on parent instance")
                        this.hide(clock.id)
                    } else {
                        console.log("CTRL:... " + specficClockID + " calling show on parent instance")
                        this.show(clock.id)
                    }
                    
                }

                if ('red_overrun' in clockUpdates) {
                    console.log("CTRL:.. Updating red_overrun for ID " + specficClockID + " to " + clockUpdates.red_overrun)
                    if (clockUpdates.red_overrun === true){
                        console.log("CTRL: " + specficClockID + " is set to red")
                        this.setRedOverrun(specficClockID)
                    } else if (clockUpdates.red_overrun === false) {
                        console.log("CTRL: " + specficClockID + " is set to unred")
                        this.unsetRedOverrun(specficClockID)
                    }
                }

                if (clockUpdates.targetTime) {
                    console.log("CTRL: Updating target time for ID " + specficClockID)
                    this.updateTargetTime(specficClockID, clockUpdates.targetTime)
                    //clock.targetTime = clockUpdates.targetTime
                }

                if (clockUpdates.clockState) {
                    console.log("CTRL: Updating clockState for ID " + specficClockID)
                    // start or stop clock function
                    if (clockUpdates.clockState === "running"){
                        console.log("CTRL: " + specficClockID + " is set to run")
                        this.start(specficClockID)
                    } else if (clockUpdates.clockState === "stopped") {
                        console.log("CTRL: " + specficClockID + " is set to stop")
                        this.stop(specficClockID)
                    }
                }


                thisClock = clock
            }
        })

        //thisClock = {...thisClock, clockUpdates}

        // still need error handling
        return thisClock
    }


    //it looks like clocksArray is essentially a template 
    //we extract the data from each clock and then push it to the data array
    refresh(){
        setInterval(() => {
            this.now = getDateTime("seconds")            
            
            //update clocks
            this.clocksArray.forEach((clk) => {
                if(clk.clockState === "running" || clk.clockState === "armed"){
                    clk.updateTime(this.now)
                }
            })

            let data = []
            //display clocks
            this.clocksArray.forEach((clk) =>  {
                //uncomment to echo time
                //console.log(clk.getTime())
                let j = clk.getTime()
                data.push(j)
                //including the start time in there could screw things up - but generally the start time is zero
                j = logTime(j.time+j.start, j.stop, j.direction)
                //console.log(convertToHMS(j))

            })
            this.clockData = data
            
        }, 1000)
    }

    start(specficClockID){
        let thisClock = this.getClockInstance(specficClockID)

        thisClock.run()
        console.log("CTRL: Clock started. ID=" + thisClock.id)
    }

    stop(specficClockID){
        let thisClock = this.getClockInstance(specficClockID)
       thisClock.stop()
       console.log("CTRL: Clock stopped. ID=" + thisClock.id)
       //should we also reset and reinit?
    }

    reset(specficClockID){
        let thisClock = this.getClockInstance(specficClockID)
       thisClock.reset()
       console.log("CTRL: Clock Reset. ID=" + thisClock.id)
       //should we also reset and reinit?
    }

    show(specficClockID){
        let thisClock = this.getClockInstance(specficClockID)
        console.log("CTRL: Show called on clock " + thisClock.name)
        if (thisClock.getHiddenState() === false) {
            console.log("**NOTE** Clock is already hidden")
        }
        thisClock.show(this.now)
        if (thisClock.getHiddenState() === true){
            return true
        }
        
    }

    updateTargetTime(specficClockID, new_time){
        let thisClock = this.getClockInstance(specficClockID)
        console.log("CTRL: Update target time called on clock " + thisClock.name + " to " + new_time)
        const v = thisClock.setTargetTime(new_time)
        return v
    }

    setRedOverrun(specficClockID){
        let thisClock = this.getClockInstance(specficClockID)
        console.log("CTRL: Set Red called on clock " + thisClock.name)
        const v = thisClock.setRedOverrun()
        return v
    }

    unsetRedOverrun(specficClockID){
        let thisClock = this.getClockInstance(specficClockID)
        console.log("CTRL: Unset Red called on clock " + thisClock.name)
        const v = thisClock.unsetRedOverrun()
        return v
    }

    hide(specficClockID){
        
        let thisClock = this.getClockInstance(specficClockID)
        console.log("CTRL: Hide called on clock " + thisClock.name)
        if (thisClock.getHiddenState() === true) {
            console.log("**NOTE** Clock is already hidden")
        }
        thisClock.hide()
    }
  }

  module.exports = ClockController

//   //lets create some clocks
// let ctrl = new ClockController()

// // time of day clock
// let clk1 = ctrl.createClock("ToD", 66400)
// ctrl.start(clk1)



    // // I don't know if we can roll this into the above function with an optional ID
    // getClockByID(specficClockID){
    //     let thisClock = []
    //     let specificClock = this.clocksArray.filter((clock) => {
    //         if (clock.id === specficClockID) {
    //             console.log("CTRL: Clock found. ID=" + clock.id)
    //             thisClock = clock
    //         }
    //     })
    //     // need to enter code if there is no clocks found. Probably just return 0\ false?
    //     return thisClock
        
    // }