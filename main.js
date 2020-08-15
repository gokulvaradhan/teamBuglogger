const path = require('path')
const url = require('url')
const Log = require('./models/Log')
const connectDb = require('./connectDb')
const { app, BrowserWindow, ipcMain, Menu } = require('electron')

connectDb()

let mainWindow

let isDev = false

let isMac = process.platform === 'darwin' ? true : false

if (
  process.env.NODE_ENV !== undefined &&
  process.env.NODE_ENV === 'development'
) {
  isDev = true
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: isDev ? 1400 : 1100,
    height: 800,
    show: false,
    resizable: false,
    backgroundColor: 'white',
    icon: `${__dirname}/assets/icon.png`,
    webPreferences: {
      nodeIntegration: true,
    },
  })

  let indexPath

  if (isDev && process.argv.indexOf('--noDevServer') === -1) {
    indexPath = url.format({
      protocol: 'http:',
      host: 'localhost:8080',
      pathname: 'index.html',
      slashes: true,
    })
  } else {
    indexPath = url.format({
      protocol: 'file:',
      pathname: path.join(__dirname, 'dist', 'index.html'),
      slashes: true,
    })
  }

  mainWindow.loadURL(indexPath)

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // Open devtools if dev
    if (isDev) {
      const {
        default: installExtension,
        REACT_DEVELOPER_TOOLS,
      } = require('electron-devtools-installer')

      installExtension(REACT_DEVELOPER_TOOLS).catch((err) =>
        console.log('Error loading React DevTools: ', err)
      )
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.on('closed', () => (mainWindow = null))
}

app.on('ready', () => {
  createMainWindow()

  const mainMenu = Menu.buildFromTemplate(menu)
  Menu.setApplicationMenu(mainMenu)
})

const menu = [
  ...(isMac ? [{role: "appMenu"}] : []),
  {
    role: 'fileMenu'
  },
  {
    label: "Logs",
    submenu: [
      {
        label: "Clear Logs",
        click: () => clearLogs()
      }
    ]
  },
  ...(isDev ? [
    {
      label: "Developer",
      submenu: [
        { role: "reload"},
        {role: "forcereload"},
        {type: "separator"},
        {role: "toggledevtools"}
  ]
    }] : []) 
]

ipcMain.on("logs:load", sendLogs)

async function sendLogs() {
  try{
    const logs = await Log.find().sort( {created: 1})
    mainWindow.webContents.send("logs:get", JSON.stringify(logs))
  }catch(e){
    console.log(e)
  }
}

ipcMain.on("logs:add", async (e, item) => {
  try{
    await Log.create(item)
    sendLogs()
  }catch(e){
    console.log(e)
  }
})

ipcMain.on("logs:delete", async (e, item) => {
  try{
    console.log(item)
    await Log.findOneAndDelete({_id: item})
    sendLogs()
  }catch(e){
    console.log(e)
  }
})

async function clearLogs(){
  try{
    await Log.deleteMany({})
    mainWindow.webContents.send("logs:clear")
  }catch(e){
    console.log(e)
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow()
  }
})


app.allowRendererProcessReuse = true
