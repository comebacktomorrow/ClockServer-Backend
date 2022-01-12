const getDateTime = require('../../util/getTime')
const { logTime, convertToHMS, convertToSeconds} = require('../../util/convertTime')
const { AbsoluteTimer, TimeOfDay, AMPCtrlClock, EventTimer } = require ('./ClockModel')

class ClockController {
    constructor() {
       this.clocksArray = []
       this.timer = this.refresh()
       this.clockData = []

        if (!ClockController._instance) {
        ClockController._instance = this;
      }
      
      return ClockController._instance;
    }

    createClock(type="count", startTime=0, endTime=86400, offsetTime=0, name="clock", direction="up", behaviour="stop"){
        let newClock = undefined
        if (type === "realtime"){
            newClock = new TimeOfDay(0,86400, getDateTime("seconds"), "Time of Day")
        } else if (type === "count"){
            newClock = new AbsoluteTimer(0,endTime, 0, name, direction, behaviour)
        } else if (type === "event"){
            newClock = new EventTimer(startTime, endTime, offsetTime, name, direction, behaviour)
        } else if (type === "ampctrl"){
            newClock = new AMPCtrlClock(13000)
        }
        
        this.clocksArray.push(newClock)

        return this.clocksArray.length -1
    }

    viewClockData(){
        console.log('getting clock data')
        console.log(this.clockData)
        return this.clockData
    }

    removeClock(id){
        //remove clock based on id
        if (id > -1 && id < this.clocksArray.length){
            this.clocksArray.splice(id, 1)
            console.log("removed clock " + id)
        }
    }

    refresh(){
        setInterval(() => {
            let now = getDateTime("seconds")            
            
            //update clocks
            this.clocksArray.forEach((clk) => {
                if(clk.status === "running" || clk.status === "armed"){
                    clk.updateTime(now)
                }
            })

            let data = []
            //display clocks
            this.clocksArray.forEach((clk) =>  {
                console.log(clk.getTime())
                let j = clk.getTime()
                data.push(j)
                //including the start time in there could screw things up - but generally the start time is zero
                j = logTime(j.time+j.start, j.stop, j.direction)
                //console.log(convertToHMS(j))

            })
            this.clockData = data
            
        }, 1000)
    }

    stop(clock){
       console.log('extneral call to stop clock ' + clock)
       this.clocksArray[clock].stop()
       //should we also reset and reinit?
    }

    pause(pause){
        //pause clock
    }

    arm(clock){
        //arm clock
    }

    start(clock){
        console.log("start the clock "+ clock)
        this.clocksArray[clock].run()
    }

    hide(clock){
        this.clocksArray[clock].hide()
    }

    show(clock){
        this.clocksArray[clock].show()
    }
  }

  module.exports = ClockController