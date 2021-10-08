const { default: axios } = require('axios')
const io = require("socket.io-client");
const socket = io("https://wss.gasless.info");
const nativeImage = require('electron').nativeImage
const { app, Menu, Tray, BrowserWindow } = require('electron')
app.tray = null
app._gasSelect = true
app._gasData = {}

app._coinSelect = null
app._priceData = {}



var contextMenu = null
const _update = () => {
    let gasTxt = ""
    let priceTxt = ""
    let logoTxt = ""
    if (app._gasSelect && app._gasData)
        gasTxt = `${app._gasData.suggest} | ${app._gasData.low} | ${app._gasData.safe}`
    if (app._priceData && app._priceData[app._coinSelect]) {
        let coin = app._priceData[app._coinSelect]
        priceTxt = ` $${coin.current_price} | `
    }


    if (!app._gasSelect && !app._coinSelect) logoTxt = "GasLess"

    app.tray.setTitle(logoTxt + priceTxt + gasTxt)
}

const forceUpdate = () => {
    socket.emit("init", {}, (res) => {
        console.log(res.gasprice)
        app._gasData = res.gasprice
        app._priceData = res.coinprice
    })
}


const setConfig = (event) => {
    if (event.id == "gasprice") {
        if (!event.checked) {
            app._gasSelect = false
            app._gasData = {}
        }
        _update()

    }
    else if (event.groupId === 1) {
        app._coinSelect = event.id === "none" ? null : event.id
        let image = nativeImage.createFromPath(`assets/clear.png`)
        if (app._coinSelect) {
            image = nativeImage.createFromPath(`assets/${app._coinSelect}.png`)
        }
        image = image.resize({ width: 16, height: 16, quality: "good" })
        app.tray.setImage(image)
        _update()
    }

}
app.whenReady().then(async () => {
    app.tray = new Tray('assets/clear.png')

    contextMenu = Menu.buildFromTemplate([
        { id: "tips", label: 'Suggest | Low | Safe (gwei)' },
        { type: 'separator' },
        {
            id: 'gasprice', label: 'Gas Price', type: 'checkbox', checked: true, click: async (e) => {
                setConfig(e)
            }
        },
        {
            id: 'coinprice',
            label: 'Coin Price', submenu: [
                {
                    id: 'none',
                    label: '(None)', type: "radio",
                    checked: true,
                    click: async (e) => {
                        setConfig(e)
                    }
                },
                {
                    id: 'bitcoin',
                    label: 'BTC', type: "radio",
                    icon: nativeImage.createFromPath(`assets/bitcoin.png`).resize({ width: 16, height: 16, quality: "good" }),
                    click: async (e) => {
                        setConfig(e)
                    }
                },
                {
                    id: "ethereum", label: 'ETH', type: "radio",
                    icon: nativeImage.createFromPath(`assets/ethereum.png`).resize({ width: 16, height: 16, quality: "good" }),
                    click: async (e) => {
                        setConfig(e)
                    }
                }
            ],

        },
        { type: 'separator' },
        {
            label: 'Quit', click: async () => {
                app.quit()
            }
        }
    ])

    app.dock.hide()

    app.tray.setTitle("GasLess")
    app.tray.setToolTip('Suggest | Low | Safe')
    app.tray.setContextMenu(contextMenu)
    app.tray.on('click', () => {
        forceUpdate()
    });

    socket.on("gasprice", (data) => {
        app._gasData = data
        _update()
    })

    socket.on("coinprice", (data) => {
        app._coinData = data
        _update()
    })

    forceUpdate()

})
