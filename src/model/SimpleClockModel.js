//const net = require('net')
const udp = require('dgram')


// an absolute timer is a timer that is set to a specific time of day
// stop time is a specific time in the future
// start time is set to the time of day, incremented by 1 sec every sec
// offset time is not used


//we could add a canDelete property
class AbsoluteTimer {
    constructor( id, targetTime=0, name="Counter Clock", behaviour="continue", type="Up"){
        this.id = id;
        this.name = name;
        this.type = type;
        this.behaviour = behaviour; // restart, hide, stop, null (continue)
        this.displayOnTimeStamp = 0

        this.clockState = "stopped" // stopped, paused, armed, running
        this.isHidden = "auto"
        this.isOverrun = false
        this.red_overrun = false

        this.targetTime = targetTime

        this.time=0
    }

    hide() {
        this.isHidden = true
        console.log("MODEL: " + this.name + " is hidden")
    }

    show(timestamp) {
        this.isHidden = false
        this.displayOnTimeStamp = timestamp
        console.log("MODEL: " + this.name + " is visible" + " TS is " + timestamp)
    }

    getHiddenState(){
        return this.isHidden
    }

    updateTime(now) {
        if (this.clockState === "running"){
            console.log("MODEL: "+ this.name +" time is " + this.time)
            this.evalOverrun(this.time)
            this.time++
        } else {
            console.log("MODEL: Model " + this.id + " is not running. State is " + this.clockState)
        }
        //console.log(this.name + " has been updated to " + this.time)
    }

    evalOverrun(now, force_check = false){
        if (now >= this.targetTime-1 && !this.isOverrun ){
            console.log("MODEL: " + this.name + " has overrun. Evaluating overrun behaviour")
            this.setOverrun()
            return
        } else if ( now < this.targetTime && force_check === true) {
            console.log("MODEL: clock updated. Reeval overrun. NOW " + now + " tt " + this.targetTime + " check " + force_check)
            this.isOverrun = false
        }
    }

    // //used for autostarting clocks
    // evalStart(now){
    //     if (this.clockState === "armed" && now === this.startTime-1){
    //         console.log("service clock starting")
    //         this.status="running"
    //     }
    // }

    setOverrun(){
        console.log("333 OR CHECK  " + this.isOverrun)
        if (this.isOverrun != true){
            if (this.behaviour === "restart"){
                console.log("MODEL: "+  this.name + " is set to restart - resetting time and state")
                this.time = this.startTime
                this.isOverrun = false
            } else if (this.behaviour === "hide"){
                console.log("MODEL: "+ this.name + " is set to hide - isHidden now set to true and clock is stopped")
                this.clockState = "stopped"
                this.isHidden = true
            } else if (this.behaviour === "stop"){
                console.log("MODEL: "+this.name + " is set to stop - status set to stop")
                this.clockState = "stopped"
            } else {
                console.log("444 OR CHECK  " + this.isOverrun)
                console.log("MODEL: "+ this.name + " is set to overrun - performing no actions")
                this.isOverrun = true
            }
        }
        console.log("555 OR CHECK  " + this.isOverrun)
    }

    setTargetTime(new_time){
        console.log("MODEL: Setting new target time")
        this.targetTime = new_time
        this.evalOverrun(this.time,true)
        return this.targetTime
    }

    setRedOverrun() {
        console.log("MODEL: Set red overrun")
        this.red_overrun = true
        return this.red_overrun
    }

    unsetRedOverrun() {
        console.log("MODEL: Unset red overrun")
        this.red_overrun = false
        return this.red_overrun
    }

    getTime(){
        let obj = {
            name: this.name,
            id: this.id,
            type: this.type,
            clockState: this.clockState,
            displayOnTimeStamp: this.displayOnTimeStamp,
            behaviour: this.behaviour,
            isHidden: this.isHidden,
            overrun: this.isOverrun,
            red_overrun: this.red_overrun,
            targetTime: this.targetTime,
            time: this.time
        }

        return obj
    }

    run(){
        this.clockState="running"
        console.log("MODEL: run has been called")
    }

    stop(){
        this.clockState="stopped"
        console.log("MODEL: paused has been called")
        //pause is not implimenented in the main object
    }

    reset(){
        this.time=0
        this.evalOverrun(this.time,true)
        console.log("MODEL: Reset has been called")
        //pause is not implimenented in the main object
    }
}

// // I dont think we need to do this because a count down clock is based on the difference between target and current time
// class CountDownTimer extends AbsoluteTimer{
//     constructor( targetTime, name="Count Down Clock", behaviour="restart", type="Down"){
//         super()
//     }

//     updateTime(now) {
//         console.log("now is " + targetTime - this.time)
//         this.evalOverrun(this.time)
//         this.time++
//         //console.log(this.name + " has been updated to " + this.time)
//     }
// }

class TimeOfDay extends AbsoluteTimer{
    constructor(id, targetTime=86400, name="Timer Clock", behaviour="stop", type="ToD"){
        super()

        this.id = id;
        this.name = name;
        this.type = "ToD";
        this.behaviour = "restart";
        this.displayOnTimeStamp = 0

        this.clockState = "running"
        this.isHidden = false
        this.isOverrun = false
        this.red_overrun = false

        this.targetTime = targetTime
        
        this.time=0

        
    }

    updateTime(now) {
        if (this.targetTime !== 86400 ) {
            const tt = now - this.targetTime
            console.log("time is " + now + " target time is " + this.targetTime + " calc " + (now - this.targetTime) + " ( H" + (tt/60/60) + " )")
            this.time = -(this.targetTime - now)
        } else {
            console.log("time is " + now + " target time is " + this.targetTime)
            this.time = now
        }
    }
}


class AMPCtrlClock extends AbsoluteTimer{
    constructor(id, port){
        super()

        this.id = id
        this.name = "Video Clock"
        this.type = "AMPCtrlClock"
        this.direction = "down"
        this.behaviour = "hide"
        this.displayOnTimeStamp = 0

        this.clockState = "stopped"
        this.isHidden = true
        this.isOverrun = false
        this.time = 0
        this.targetTime = 0

        this.server = []
        this.port = port

        this.server = udp.createSocket('udp4')
        this.createServer(this)
        
        //PVS Remote time - seconds and some resemblance of frames
        this.rawTime = 0
        //Previous PVS time - used for comparison in setClockState
        this.lastTime = undefined
    }

    
    updateTime(){
        //we'll need to figure this out  
        //console.log("Video time is " + this.time)
        let secOnly = Math.floor(this.rawTime)
        this.time = secOnly
    }

    run(){
        //this.clockState="running"
        console.log("MODEL: run has been called. This does nothing")
    }

    stop(){
        //this.clockState="stopped"
        console.log("MODEL: paused has been called. This does nothing")
        //pause is not implimenented in the main object
    }

    reset(){
        //this.time=0
        //this.evalOverrun(this.time,true)
        console.log("PVS MODEL: Reset has been called. This does nothing")
        //pause is not implimenented in the main object
    }

    //If the current PVS time and the previous PVS match
    //Assume that we have stopped
    // This function is called from the socket
    setClockState(now){
        let time = now
        if (now == this.lastTime && this.clockState != "stopped"){
            console.log("PVS Model: Stopped")
            this.clockState = "stopped"
        } else if (this.status != "running" && now != this.lastTime && this.lastTime != undefined && (now - this.lastTime) < 1) {
            console.log("PVS Model: Playing")
            this.clockState = "running"
        }

        this.lastTime = time
    }

    createServer(self){

        let that = self
        
        this.server.on('error', function(error){
            console.log('Socket error', error)
            //this.server.close()
        })

        this.server.on('message', function(message, info){
            that.rawTime = message * 1
            that.setClockState(that.rawTime)

        })

        this.server.on('listening', function() {
            console.log('AMP MODEL: Server is listening')
            // let address = this.server.address
            // let port = address.port
            // let family = address.family
            // let ipaddr = address.address
            // console.log('server is ' + family + " " + ip + ":" + port)
            that.clockState = "listening"
        })

        this.server.on('close', function() {
            console.log('AMP MODEL: Connection closed')
        })

        this.server.bind(this.port)
    }
}

module.exports = {
    AbsoluteTimer,
    TimeOfDay,
    AMPCtrlClock

}