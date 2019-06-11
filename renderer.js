// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer, remote} =  require('electron');
const {Menu, MenuItem, dialog} = remote;
const fs = require('fs');

let currentFilePath = null;
let isSaved = true;
let txtEditor = document.getElementById("txtEditor");

document.title = "Notepad - Untitled";

const contextMenuTemplate=[
    { role: 'undo' },       
    { role: 'redo' },       
    { type: 'separator' },  
    { role: 'cut' },        
    { role: 'copy' },       
    { role: 'paste' },      
    { role: 'delete' },     
    { type: 'separator' },  
    { role: 'selectall' }
];

const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

txtEditor.addEventListener('contextmenu',e => {
    e.preventDefault();
    contextMenu.popup(remote.getCurrentWindow());
})

txtEditor.oninput = e=>{
    if(isSaved) document.title += " *";
    isSaved = false;
}

ipcRenderer.on('action',(event,arg) => {
    switch(arg){
        case 'new':
        askSaveIfNeed();
        currentFilePath = null;
        txtEditor.value = '';
        document.title = "Notepad - Untitled";
        isSaved = true;
        break;
        case 'open':
        askSaveIfNeed();
        const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
            filters: [
                { name: "Text Files", extensions: ['txt', 'js', 'html', 'md'] }, 
                { name: 'All Files', extensions: ['*'] } ],
            properties: ['openFile']
        });
        if(files){
            currentFilePath=files[0];
            let txtRead = readText(currentFilePath);
            txtEditor.value = txtRead;
            document.title = "Notepad - " + currentFilePath;
            isSaved=true;
        }
        break;
        case 'save':
        saveCurrentDoc();
        break;
        case 'exiting':
        askSaveIfNeed();
        ipcRenderer.sendSync('reqaction', 'exit');
        break;
    }
})

function askSaveIfNeed(){
    if(isSaved) return;
    const response = dialog.showMessageBox(remote.getCurrentWindow(),{
        message: 'Do you want to save the current document?',
        type: 'question',
        buttons: ['Yes','No']
    });
    if(response == 0) saveCurrentDoc();
}

function saveCurrentDoc(){
    if(!currentFilePath){
        const file = remote.dialog.showSaveDialog(remote.getCurrentWindow(),{
            filters:[
                {name:"Text Files",extensions:['txt','js','html','md']},
                {name: "All Files",extensions:['*']}
            ]
        })
        if(file) currentFilePath = file;
    }
    if(currentFilePath){
        let txtSave = txtEditor.value;
        saveText(txtSave,currentFilePath);
        isSaved = true;
        document.title = "Notepad - "+currentFilePath;
    }
}

function saveText(text,file){
    fs.writeFileSync(file,text);
}

function readText(file){
    return fs.readFileSync(file,'utf8');
}

ipcRenderer.on('info',(event,info,detail)=>{
    switch(info){
        case "show_update":
        document.querySelector("#update-info").style.display = "block";
        document.querySelector("#mask").style.display = 'block';
        let content = JSON.parse(detail);
        document.querySelector(".update-content").innerHTML = content;
        break;
        case "start_update":
        document.querySelector(".update-btn").innerText = "";
        document.querySelector("#update-info img").style.display = 'block';
        break;
        case "update_done":
        document.querySelector("#update-info img").style.display = 'none';
        document.querySelector(".update-btn").innerText = "完成";
        setTimeout(()=>{
            ipcRenderer.send('checkUpdate','end');
        },500);
        break;
    }
    
})

window.onload = function(){
    checkUpdate();
    document.querySelector("#update-info .update-btn").addEventListener("click",startUpdate);
    document.querySelector("#update-info .ignore-btn").addEventListener("click",ignoreUpdate);
}

function checkUpdate(){
    ipcRenderer.send('checkUpdate','check');
}

function ignoreUpdate(){
    document.querySelector("#update-info").style.display = 'none';
    document.querySelector("#mask").style.display = 'none';
}
function startUpdate(){
    ipcRenderer.send('checkUpdate','start');
    document.querySelector("#update-info .update-btn").removeEventListener("click",startUpdate);
}