const path = require('path');
const { app, Menu, Tray, autoUpdater, dialog, BrowserWindow } = require('electron')

const io = require("socket.io-client");

const { Manager } = require("socket.io-client");
const manager = new Manager("wss://wss.gasless.info", {
    timeout: 5000,
    // transports: ["websocket", "polling"],
});
const socket = manager.socket("/");

socket.io.on("error", (error) => {
    console.log(error)
});

const nativeImage = require('electron').nativeImage

app.tray = null
app._gasSelect = true
app._gasData = {}

app._coinSelect = null
app._coinData = {}



var contextMenu = null
const _update = () => {
    let gasTxt = ""
    let priceTxt = ""
    let logoTxt = ""
    if (app._gasSelect && app._gasData)
        gasTxt = `${app._gasData.suggest} | ${app._gasData.low} | ${app._gasData.safe}`
    if (app._coinData && app._coinData[app._coinSelect]) {
        let coin = app._coinData[app._coinSelect]
        priceTxt = ` $${coin.current_price} | `
    }


    if (!app._gasSelect && !app._coinSelect) logoTxt = "GasLess"

    app.tray.setTitle(logoTxt + priceTxt + gasTxt)
}

const forceUpdate = () => {
    socket.emit("init", {}, (res) => {
        console.log(res.gasprice)
        app._gasData = res.gasprice
        app._coinData = res.coinprice
        _update()
    })

}


const setConfig = (event) => {
    if (event.id == "gasprice") {
        if (!event.checked) {
            app._gasSelect = false
            app._gasData = {}
        }
        else {
            app._gasSelect = true
            forceUpdate()
        }
        _update()
    }
    else if (event.groupId === 1) {
        app._coinSelect = event.id === "none" ? null : event.id
        let image = nativeImage.createFromPath(path.join(__dirname, '/assets/clear.png'))
        if (app._coinSelect) {
            image = nativeImage.createFromPath(path.join(__dirname, `/assets/${app._coinSelect}.png`))
        }
        image = image.resize({ width: 16, height: 16, quality: "good" })
        app.tray.setImage(image)
        _update()
    }

}

app.whenReady().then(async () => {

    app.tray = new Tray(path.join(__dirname, '/assets/clear.png'))

    contextMenu = Menu.buildFromTemplate([
        {
            id: "tips", label: 'Suggest | Low | Safe (gwei)', click: () => {
                require('electron').shell.openExternal("https://gasless.info")
            }
        },

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
                    icon: nativeImage
                        .createFromPath(path.join(__dirname, '/assets/bitcoin.png'))
                        .resize({ width: 16, height: 16, quality: "good" }),
                    click: async (e) => {
                        setConfig(e)
                    }
                },
                {
                    id: "ethereum", label: 'ETH', type: "radio",
                    icon: nativeImage
                        .createFromPath(path.join(__dirname, '/assets/ethereum.png'))
                        .resize({ width: 16, height: 16, quality: "good" }),
                    click: async (e) => {
                        setConfig(e)
                    }
                }
            ],

        },
        { type: 'separator' },
        {
            id: "versions", label: `Check for Update (v${app.getVersion()})`, click: () => {
                const win = new BrowserWindow({
                })

                win.loadURL("https://github.com/cyhhao/gasless/releases")
            }
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
        console.log("on gasprice", app._gasData)
        _update()
    })

    socket.on("coinprice", (data) => {
        app._coinData = data
        console.log("on coinprice")
        _update()
    })

    forceUpdate()

    app.on('window-all-closed', function () {

    })




})
