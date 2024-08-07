let AdminXpaths = null;

init();


async function init() {
    chrome.runtime.onMessage.addListener(msgHandler);
}

function msgHandler(msg, sender, sendResponse) {
    if (msg.type === 'log-event' || msg.type === 'log-queue') {
        logMsgHandler(msg).then(result => {
            sendResponse(result);
        });
        return true;
    } else if (msg.type === 'oauth') {
        getIdToken().then(token => {
            sendResponse(token);
        });
        return true;
    } else if (msg.type === 'get-xpaths') {
        getAdminXpaths().then(result => {
            sendResponse(result);
        });
        return true;
    }
}


async function logMsgHandler(msg) {
    const LOG_EVENT_URL = 'https://log-event-v2-ob6mb2gjvq-an.a.run.app';
    const LOG_QUEUE_URL = 'https://log-queue-v3-ob6mb2gjvq-an.a.run.app';
    let url;
    if (msg.type === 'log-event') url = LOG_EVENT_URL;
    else if (msg.type === 'log-queue') url = LOG_QUEUE_URL;

    let token = await getIdToken();

    let res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(msg.body)
    });

    let json = await res.json();
    if (json.result === 'error') {
        console.log(json);
    }
    return json;
}

async function getIdToken() {
    let getSettings = chrome.storage.local.get('idToken');
    let now = Math.floor(Date.now() / 1000);
    let bufTime = 30;
    let token;
    let idToken = (await getSettings).idToken;

    if (idToken === undefined || (idToken.expireAt - bufTime) < now) {
        token = await oauth();
    } else {
        token = idToken.value;
    }

    return token;
}

async function oauth() {
    const AUTH_PARAMS = getAuthParams();
    const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?${new URLSearchParams(AUTH_PARAMS).toString()}`;
    let redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: AUTH_URL,
        interactive: true
    });
    let token = redirectUrl.split('#id_token=')[1].split('&')[0];
    let parsedToken = parseJwt(token);

    if (parsedToken.nonce !== AUTH_PARAMS.nonce) {
        return '';
    }

    chrome.storage.local.set({
        idToken: {
            value: token,
            expireAt: parsedToken.exp
        }
    });
    return token;
}

function getAuthParams() {
    const MANIFEST = chrome.runtime.getManifest();
    return {
        client_id: MANIFEST.oauth2.client_id,
        response_type: 'id_token',
        scope: MANIFEST.oauth2.scopes.join(' '),
        nonce: generateNonce(),
        redirect_uri: chrome.identity.getRedirectURL('')
    };
}

function generateNonce() {
    const SOURCE = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const LEN = 32;
    let l = '';
    while (l.length < LEN) {
        l += SOURCE[Math.floor(Math.random() * SOURCE.length)];
    }
    return l;
}

function parseJwt(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

async function getAdminXpaths() {
    let isExpired = (updatedAt) => {
        const EXPIRE_TIME = 3600000;
        let now = new Date().getTime();
        let elapsed = now - updatedAt;
        return elapsed >= EXPIRE_TIME;
    }

    if (AdminXpaths !== null) {
        if (!isExpired(AdminXpaths.updatedAt)) {
            return AdminXpaths.data;
        }
    }

    let saved = await chrome.storage.local.get('adminXpaths');

    if (saved.adminXpaths !== undefined) {
        if (!isExpired(saved.adminXpaths.updatedAt)) {
            return saved.adminXpaths.data;
        }
    }

    const GCF_URL = 'https://get-admin-xpaths-v3-ob6mb2gjvq-an.a.run.app';
    let token = await getIdToken();

    let response = await fetch(GCF_URL, {
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

const TOP_URL = "https://ishtar.with.is/admin"
const SURVEY_URL = "https://ishtar.with.is/admin/"

chrome.webNavigation.onCompleted.addListener(async (details) => {
    const tabId = details.tabId;
    const url = details.url;

    if (url == TOP_URL) {
        try {
            chrome.storage.local.clear()

            const data = await id_getter();
            console.log(data);

            chrome.storage.local.set({ fetchedData: data });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    } else if (url.startsWith(SURVEY_URL)) {
        try {
            chrome.storage.local.get('fetchedData', (result) => {
                chrome.tabs.sendMessage(tabId, { action: 'pass_data', data: result.fetchedData })
            });
        } catch (error) {
            console.error(error)
        }
    }
}, { url: [{ urlPrefix: TOP_URL }, { urlPrefix: SURVEY_URL }] });


async function id_getter() {

    const API_KEY = 'ilbRFhT1cBLWKs0qCpZgRicNW191cqQHHGR5';
    const API_ENDPOINT = 'https://keywords.microcms.io/api/v1/keywords'

    // APIリクエストのオプション設定
    const options = {
        'method': 'get',
        'headers': {
            'X-API-KEY': API_KEY
        },
        'muteHttpExceptions': true
    };

    // APIリクエストの送信
    const cms_response = await fetch(API_ENDPOINT, options);
    const cms_json = await cms_response.json();
    const id = cms_json.contents[0].id

    const TARGET_ENDPOINT = `${API_ENDPOINT}/${id}`

    try {

        const response = await fetch(TARGET_ENDPOINT, options);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const keyword_json = await response.json();
        return keyword_json

    } catch (error) {
        console.log(error)
    }
}


