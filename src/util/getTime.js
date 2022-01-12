//gets time as either HMS o
function getDateTime(type= "string") {

    var style = type
    var date = new Date();

    var hour = date.getHours();
    var min  = date.getMinutes();
    var sec  = date.getSeconds();

    if (style === "string"){
        //hour = (hour < 10 ? "0" : "") + hour;
        // if hour is less than 10, add leading 0? otherwise, if hour is > 12\24hr time, converter to 12 hour time
        hour = (hour < 10 ? "0" + hour : (hour > 12 ? hour-12 : hour))
        min = (min < 10 ? "0" : "") + min;
        sec = (sec < 10 ? "0" : "") + sec;
        
        return hour + ":" + min + ":" + sec;

    } else if (style === "seconds") {
        return (hour * 3600) + (min * 60) + sec
    } else if (style === "object") {
        return [hour, min, sec]
    }
}

module.exports = getDateTime