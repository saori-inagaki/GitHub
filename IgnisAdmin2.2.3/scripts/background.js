let AdminXpaths = null;

init();

async function init(){
    chrome.runtime.onMessage.addListener(msgHandler);
}

function msgHandler(msg, sender, sendResponse){
    if(msg.type === 'log-event' || msg.type === 'log-queue'){
        logMsgHandler(msg).then(result=>{
            sendResponse(result);
        });
        return true;
    }else if(msg.type === 'oauth'){
        getIdToken().then(token=>{
            sendResponse(token);
        });
        return true;
    }else if(msg.type === 'get-xpaths'){
        getAdminXpaths().then(result=>{
            sendResponse(result);
        });
        return true;
    }
}

async function logMsgHandler(msg){
    const LOG_EVENT_URL = 'https://log-event-v2-ob6mb2gjvq-an.a.run.app';
    const LOG_QUEUE_URL = 'https://log-queue-v3-ob6mb2gjvq-an.a.run.app';
    let url;
    if(msg.type === 'log-event')url = LOG_EVENT_URL;
    else if(msg.type === 'log-queue')url = LOG_QUEUE_URL;

    let token = await getIdToken();

    let res = await fetch(url, {
        method:'POST',
        headers:{
            Authorization:'Bearer ' + token,
            'Content-Type': 'application/json',
        },
        body:JSON.stringify(msg.body)
    });
    
    let json = await res.json();
    if(json.result === 'error'){
        console.log(json);
    }
    return json;
}

async function getIdToken(){
    let getSettings = chrome.storage.local.get('idToken');
    let now = Math.floor(Date.now() / 1000);
    let bufTime = 30;
    let token;
    let idToken = (await getSettings).idToken;

    if(idToken === undefined || (idToken.expireAt - bufTime) < now){
        token = await oauth();
    }else{
        token = idToken.value;
    }

    return token;
}

async function oauth(){
    const AUTH_PARAMS = getAuthParams();
    const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?${new URLSearchParams(AUTH_PARAMS).toString()}`;
    let redirectUrl = await chrome.identity.launchWebAuthFlow({
        url:AUTH_URL,
        interactive: true
    });
    let token = redirectUrl.split('#id_token=')[1].split('&')[0];
    let parsedToken = parseJwt(token);

    if(parsedToken.nonce !== AUTH_PARAMS.nonce){
        return '';
    }

    chrome.storage.local.set({
        idToken:{
            value:token,
            expireAt:parsedToken.exp
        }
    });
    return token;
}

function getAuthParams(){
    const MANIFEST = chrome.runtime.getManifest();
    return {
        client_id:MANIFEST.oauth2.client_id,
        response_type:'id_token',
        scope:MANIFEST.oauth2.scopes.join(' '),
        nonce:generateNonce(),
        redirect_uri:chrome.identity.getRedirectURL('')
    };
}

function generateNonce(){
    const SOURCE = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const LEN = 32;
    let l = '';
    while(l.length < LEN){
        l += SOURCE[Math.floor(Math.random() * SOURCE.length)];
    }
    return l;
}

function parseJwt(token){
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

async function getAdminXpaths(){
    let isExpired= (updatedAt)=>{
        const EXPIRE_TIME = 3600000;
        let now = new Date().getTime();
        let elapsed = now - updatedAt;
        return elapsed >= EXPIRE_TIME;
    }

    if(AdminXpaths !== null){
        if(!isExpired(AdminXpaths.updatedAt)){
            return AdminXpaths.data;
        }
    }
    
    let saved = await chrome.storage.local.get('adminXpaths');

    if(saved.adminXpaths !== undefined){
        if(!isExpired(saved.adminXpaths.updatedAt)){
            return saved.adminXpaths.data;
        }
    }

    const GCF_URL  = 'https://get-admin-xpaths-v3-ob6mb2gjvq-an.a.run.app';
    let token = await getIdToken();

    let response = await fetch(GCF_URL,{
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
        }
    });
    let xpaths = await response.json();

    AdminXpaths = {
        updatedAt: new Date().getTime(),
        data: xpaths.data
    }

    chrome.storage.local.set({
        adminXpaths: AdminXpaths
    });
    return AdminXpaths.data;
}