showVersion();

function showVersion(){
    let manifest = chrome.runtime.getManifest();
    let container = document.body.getElementsByClassName('container')[0];
    if(!container)return;
    let nav = container.getElementsByClassName('navbar')[0];
    let header = nav.getElementsByClassName('navbar-header')[0];
    let a = header.getElementsByClassName('navbar-brand')[0];
    let span = document.createElement('span');
    span.innerHTML = `${manifest.name} Ver${manifest.version}`;
    a.innerHTML += ' ';
    a.appendChild(span); 
    span.style.backgroundColor = '#ABCCAB';
    span.style.padding = '2px';
}