import { convertToHMS } from "./convertTime.js"
const tod = document.querySelector('.tod')
const group_a = document.querySelector('.group-a')

// const url = "http://localhost:3010/clocks"
// const response = fetch(url)
// //const data = response.json()


// console.log(JSON.stringify(response))


const api_url = 
      "http://localhost:3010/clocks";
  
// Defining async function
async function getapi(url) {
    
    // Storing response
    const response = await fetch(url);
    
    // Storing data in form of JSON
    var data = await response.json();
    //see the data here
    //console.log(data);
    if (response) {
        //doStuff();
    }
    //doMoreStuff(data);
    //console.log(data[0].time)
    return data

}
// Calling that async function
getapi(api_url);

function setTime(obj,time,isHidden,red_overrunState=false,targetTime, type){

    let thisTime = time
    if (type=== "Down"){
        thisTime= targetTime-time
    }
    if (type=== "ToD" && targetTime === 86400){
        if (time > 43200){
            //console.log("Convert to 12 hr time") — 43200 sec in half a day
            thisTime = time - 43200
        }
    }

    if (red_overrunState){
        obj.style.color = "red"
    } else {
        obj.style.color = ""
    }

    obj.hidden = isHidden
    obj.textContent = convertToHMS(thisTime)
}


setInterval(() => {
    var d = new Date()
    var m = d.getMinutes()
    let s = d.getSeconds()
    let h = d.getHours()    
    //clocksArray[0].counter++

    m = (m < 10 ? "0" : "") + m;
    s = (s < 10 ? "0" : "") + s;

    //console.log(h + ":" + m + ":" + s)

    getapi(api_url).then((data) => {
        console.log(convertToHMS(data[0].time))
        setTime(tod,data[0].time,data[0].isHidden, data[0].red_overrun, data[0].targetTime, data[0].type)

        // 1: the DOM element we want to attach to, 2: the time data we want, 3: the state we care about for hidden, 4: the ignored fillter: 5: red overrun flag (red_overrun + overrun state)
        
        
        // lets remove any items we dont want - those that are hidden and those that have names we want to block
        const filtData = data.filter(obj => {
            return obj.isHidden === false && obj.name !== "Timer Clock"
          })


        //then we sort the data to find the item with the most recent update time
          console.log(filtData.length)

        if (filtData.length > 0){
            const max = filtData.reduce(function(prev, current) {
                    if (prev.displayOnTimeStamp > current.displayOnTimeStamp || current.isHidden) {
                        return prev
                    } else {
                        console.log("changing to clock " + current.name)
                        return current
                    }
                }
            )

            let ovr = false

            if (max.red_overrun && max.overrun) {
                ovr = true
            }

            setTime(group_a,max.time,max.isHidden, ovr, max.targetTime, max.type)
        } else {
            // if there are no clocks, display nothing
            setTime(group_a,'',true)
        }
    })


    

    
    //console.log(data)
    //convertToHMS(data[0].time)

    //tod.textContent = h + ":" + m + ":" + s
}, 1000)


///// we need code that looks at a list of clocks and
///// finds the one with the closest end time that is visible
///// or we need to add a time stamp to see when visibillity was last changed