// this file is legacy .. not currently in use

//const net = require('net')
const udp = require('dgram')


// an absolute timer is a timer that is set to a specific time of day
// stop time is a specific time in the future
// start time is set to the time of day, incremented by 1 sec every sec
// offset time is not used
class AbsoluteTimer {
    constructor(startTime, stopTime, offsetTime, name="clock", direction="up", behaviour="restart", type="count"){
        this.name = name;
        this.type = type;
        this.direction = direction;
        this.behaviour = behaviour;

        this.status = "stopped"
        this.isHidden = "auto"
        this.isOverrun = false

        // this.colour = "white"
        // this.priority = 0
        // this.tag = undefined
        // this.group = 'default'

        this.startTime = startTime
        this.stopTime = stopTime
        this.offsetTime = offsetTime

        this.time=startTime
    }

    hide() {
        this.isHidden = true
        console.log(this.name + " is hidden")
    }

    show() {
        this.isHidden = false
        console.log(this.name + " is visible")
    }

    updateTime(now) {
        console.log("now is " + this.time)
        this.evalOverrun(this.time)
        this.time++
        //console.log(this.name + " has been updated to " + this.time)
    }

    evalOverrun(now){
        if (now >= this.stopTime-1 && !this.isOverrun){
            console.log(this.name + " has overrun")
            this.setOverrun()
            return
        }
    }

    evalStart(now){
        if (this.status === "armed" && now === this.startTime-1){
            console.log("service clock starting")
            this.status="running"
        }
    }

    setOverrun(){
        if (this.isOverrun != true){
            if (this.behaviour === "restart"){
                console.log(this.name + " is set to restart - resetting time and state")
                this.time = this.startTime
                this.isOverrun = false
            } else if (this.behaviour === "hide"){
                console.log(this.name + " is set to hide - isHidden now set to true and clock is stopped")
                this.status = "stopped"
                this.isHidden = true
            } else if (this.behaviour === "stop"){
                console.log(this.name + " is set to stop - status set to stop")
                this.status = "stopped"
            } else {
                console.log(this.name + " is set to overrun - performing no actions")
                this.isOverrun = true
            }
        }
    }

    getTime(){
        let obj = {
            name: this.name,
            direction: this.direction,
            type: this.type,
            status: this.status,
            behaviour: this.behaviour,
            hidden: this.isHidden,
            overrun: this.isOverrun,
            start: this.startTime,
            stop: this.stopTime,
            offset: this.offsetTime,
            time: this.time
        }
        return obj
    }

    run(){
        this.status="running"
        console.log("run has been called")
    }

    pause(){
        this.status="paused"
        console.log("paused has been called")
        //pause is not implimenented in the main object
    }
}

//start time is start of day (0 seconds), end time is end of day (23:59:59), offset time is now
class TimeOfDay extends AbsoluteTimer{
    constructor(startTime=0, stopTime=86400, offsetTime, name){
        super()

        this.name = name;
        this.type = "TOD";
        this.direction = "up";
        this.behaviour = "restart";

        this.status = "running"
        this.isHidden = false
        this.isOverrun = false

        this.startTime = startTime
        this.stopTime = stopTime
        this.offsetTime = offsetTime
        
        
        this.time=offsetTime
    }

    updateTime(now) {
        this.time = now
    }
}

class AMPCtrlClock extends AbsoluteTimer{
    constructor(port){
        super()

        this.name = "Video Clock"
        this.type = "AMPCtrlClock"
        this.direction = "down"
        this.behaviour = "hide"

        this.status = "stopped"
        this.isHidden = true
        this.isOverrun = false
        this.time = 0
        this.duration = undefined
        this.startTime = 0

        this.server = []
        this.port = port

        this.server = udp.createSocket('udp4')
        this.createServer(this)
        
        //PVS Remote time - seconds and some resemblance of frames
        this.rawTime = 0
        //Previous PVS time - used for comparison
        this.lastTime = undefined
    }

    
    updateTime(){
        //we'll need to figure this out  
        //console.log("Video time is " + this.time)
        let secOnly = Math.floor(this.rawTime)
        this.time = secOnly
    }

    //If the current PVS time and the previous PVS match
    //Assume that we have stopped
    setStatus(now){
        let time = now
        if (now == this.lastTime && this.status != "stopped"){
            console.log("Stopped")
            this.status = "stopped"
        } else if (this.status != "running" && now != this.lastTime && this.lastTime != undefined && (now - this.lastTime) < 1) {
            console.log("Playing")
            this.status = "running"
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

            that.setStatus(that.rawTime)

        })

        this.server.on('listening', function() {
            console.log('server is up')
            // let address = this.server.address
            // let port = address.port
            // let family = address.family
            // let ipaddr = address.address
            // console.log('server is ' + family + " " + ip + ":" + port)
            that.status = "listening"
        })

        this.server.on('close', function() {
            console.log('connection closed')
        })

        this.server.bind(this.port)
    }
}

// I think event timer uses the start time as now
// with the stop time as a relative time in seconds to start time
// offset is not used

class EventTimer extends AbsoluteTimer{
    constructor(startTime=0, stopTime=86400, offsetTime, name, direction="up", behaviour="overrun"){
        super()

        this.name = name;
        this.type = "event";
        this.direction = direction;
        this.behaviour = behaviour;

        this.status = "armed"
        this.isHidden = false
        this.isOverrun = false

        this.duration = stopTime

        this.startTime = startTime
        // stop time should be the durartion relative to the start time
        this.stopTime = startTime+this.duration
        this.offsetTime = 0

        this.time=0
        
        console.log("Event timer created with start time of " + this.startTime + " and stop time of " + this.stopTime + " for duration of " + this.duration)
        
    }

    updateTime(now) {
        console.log(now)
        if (this.status === "running"){
            this.evalOverrun(this.time+this.startTime)
            this.time++
        } else {
            this.evalStart(now)
        }
    }

    //do we need pause and resume methods? - pause and run are part of the parent object


}

module.exports = {
    AbsoluteTimer,
    TimeOfDay,
    AMPCtrlClock,
    EventTimer
}