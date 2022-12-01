const canvas = document.querySelector(".chart")
const width = canvas.width
const height = canvas.height
const ctx = canvas.getContext("2d")
ctx.fillStyle = "black"
document.getElementById("symbolInput").focus()
let graphInfo = {
    timeArray: [],
    highest : 0,
    lowest : 0,
    get diff() {
        return(this.highest - this.lowest)
    }
}

async function drawGraph(symbol, interval) {
    let timeStamp = []
    const priceOpen = []
    const priceClose = []
    const priceHigh = []
    const priceLow = []
    let posXline = 12
    let posYline
    let heightLine
    const response =  await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=PKS369HG6LAKHCVO`)
    const data = await response.json()
    try {
        timeStamp = Object.keys(data[`Time Series (${interval})`])
        safeSymbol("set", symbol)
    } catch (error) {
        alert("5 API calls per minute Exceeded\nor Symbol not avalaible")
        safeSymbol("get")
        return 0
    }
    ctx.clearRect(0, 0, width, height)
    graphInfo.timeArray = timeStamp
    setTimeInfo(timeStamp)
    for (let index = 0; index < 45; ++index) {
    priceOpen.unshift(data[`Time Series (${interval})`][`${timeStamp[index]}`]["1. open"])
    priceHigh.unshift(data[`Time Series (${interval})`][`${timeStamp[index]}`]["2. high"])
    priceLow.unshift(data[`Time Series (${interval})`][`${timeStamp[index]}`]["3. low"])
    priceClose.unshift(data[`Time Series (${interval})`][`${timeStamp[index]}`]["4. close"])
    }
    let high = graphInfo.highest = getMax(priceHigh)
    let low = graphInfo.lowest = getMin(priceLow)
    let maxDiff = high - low
    drawLines()
    setPriceInfo(high, low)
    for (let i = 0; i < 45; ++i) {
        posYline = 3 * ((high - priceHigh[i]) * 100 / maxDiff) + 15
        heightLine = 3 * ((high - priceLow[i]) * 100 / maxDiff) + 15 - posYline
        if (priceHigh[i] == priceLow[i]) {
            drawX(posXline, posYline)
        } else {
            ctx.fillRect(posXline, posYline, 1, heightLine)
        }
        posXline += 12
    }
    posXline = 8
    for (let i = 0; i < 45; ++i) {
        highValue = priceOpen[i]
        lowValue = priceClose[i]
        ctx.fillStyle = "#dc3232"
        if (priceOpen[i] < priceClose[i]) {
            lowValue = priceOpen[i]
            highValue = priceClose[i]
            ctx.fillStyle = "#4CAF50"
        }
        posYline = 3 * ((high - highValue) * 100 / maxDiff) + 15
        heightLine = 3 * ((high - lowValue) * 100 / maxDiff) + 15 - posYline
        if (heightLine == 0) {
            ctx.fillStyle = "black"
            ++heightLine
        }
        ctx.fillRect(posXline, posYline, 10, heightLine)
        posXline += 12
    }
    console.log(graphInfo);
}

function getMax(array) {
    return Math.max(...array)
}

function getMin(array) {
    return Math.min(...array)
}

function drawX(posX, posY) {
    ctx.fillRect(posX, posY - 2.5, 1, 5)
    ctx.fillRect(posX - 2.5, posY, 5, 1)
}

window.addEventListener("click", (event) => {
    if (event.target.id != "symbolInput") {
        document.getElementById("dropdownMenuList").innerHTML = ""
        if (document.getElementById("symbolInput").getAttribute("workingSymbol") != "") {
            safeSymbol("get")
        }
    }
})

document.getElementById("chartArea").addEventListener("mousemove", (event) => {
    if (event.offsetX > 5 && event.offsetX < 545) {
        document.getElementById("priceSidebar").innerText = 
        ((graphInfo.highest - (graphInfo.diff * ((event.offsetY - 15) / 300))).toFixed(2))
        document.getElementById("timeSidebar").innerText = 
        graphInfo.timeArray[45 - Math.round(event.offsetX / 12)]
        if (document.getElementById("symbolInput").getAttribute("workingSymbol") != "") {
            document.querySelector(".rightSidebar").style.visibility = "visible"
        }
    }
})

document.getElementById("chartArea").addEventListener("mouseleave", (event) => {
    document.querySelector(".rightSidebar").style.visibility = "hidden"
})

document.getElementById("symbolInput").addEventListener("keyup", function () {
    if (document.getElementById("apisearchToggle").checked == true)
    symbolSearch(document.getElementById("symbolInput").value)
})

function setSymbol() {
    let symbol = document.getElementById("symbolInput").value
    let interval = getInterval()
    drawGraph(symbol, interval)
}

function toggleBtns(id) {
    if (document.getElementById(id).className == "intervalBtnActive") {
    return
    }
    let activeBtn = document.querySelector(".intervalBtnActive")
    activeBtn.className = "intervalBtn"
    document.getElementById(id).className = "intervalBtnActive"
}

function getInterval() {
    let activeBtn = document.querySelector(".intervalBtnActive")
    return activeBtn.innerText
}

function drawLines() {
    let posY = [15, 90, 165, 240, 315]
    ctx.strokeStyle = "#e6e6e6c7"
    for (let value in posY) {
    ctx.beginPath()
    ctx.moveTo(0, posY[value])
    ctx.lineTo(550, posY[value])
    ctx.stroke()
    }
}

function setPriceInfo (high, low) {
    let diff = high - low
    document.querySelector(".price5").innerText = high.toFixed(2)
    document.querySelector(".price4").innerText = (high - (diff * 0.25)).toFixed(2)
    document.querySelector(".price3").innerText = (high - (diff * 0.5)).toFixed(2)
    document.querySelector(".price2").innerText = (high - (diff * 0.75)).toFixed(2)
    document.querySelector(".price1").innerText = low.toFixed(2)
}

function setTimeInfo (timeStamp) {
    let timeId = 0
    for (let i = 0; i < 5; ++i) {
        document.getElementById(i + "t").innerText = timeStamp[timeId]
        timeId += 11
    }
}

async function symbolSearch(chars) {
    if (chars == "") {
        document.getElementById("dropdownMenuList").innerHTML = ""
        return
    }
    const response = await fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${chars}&apikey=PKS369HG6LAKHCVO`)
    const data = await response.json()
    let listElements = ""
    try {
        for (let i = 0; i < data.bestMatches.length; ++i) {
            listElements += '\
            <li onclick= copySymbol("'+ data.bestMatches[i]["1. symbol"] +'")>\
                Symbol: <strong>' + data.bestMatches[i]["1. symbol"] + '</strong><br>\
                Name: ' + data.bestMatches[i]["2. name"] + '<br>\
                Region: ' + data.bestMatches[i]["4. region"] +'\
            </li>' 
        }
    } catch (error) {
        alert("Autofill form\nAPI calls exceeded")
    }
    document.getElementById("dropdownMenuList").className = "dropdownMenuActive"
    document.getElementById("dropdownMenuList").innerHTML = listElements
}

function copySymbol(symbol) {
    document.getElementById("symbolInput").value = symbol
    document.getElementById("dropdownMenuList").className = "dropdownMenu"
}

function safeSymbol(command, symbol) {
    let inputBox = document.getElementById("symbolInput")
    if (command == "set") {
        inputBox.setAttribute("workingSymbol", symbol)
    } else {
        inputBox.value = inputBox.getAttribute("workingSymbol")
    }
}
