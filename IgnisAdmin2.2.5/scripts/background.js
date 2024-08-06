let AdminXpaths = null;

init();

// async function init() {
//     chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//         msgHandler(msg, sender, sendResponse).catch(error => {
//             console.error('Error in message handler:', error.message, error);
//             sendResponse({ error: error.message });
//         });
//         return true; // indicates you want to send a response asynchronously
//     });
// }

// async function msgHandler(msg, sender, sendResponse) {
//     try {
//         if (msg.type === 'log-event' || msg.type === 'log-queue') {
//             const result = await logMsgHandler(msg);
//             sendResponse(result);
//         } else if (msg.type === 'oauth') {
//             const token = await getIdToken();
//             sendResponse(token);
//         } else if (msg.type === 'get-xpaths') {
//             const result = await getAdminXpaths();
//             sendResponse(result);
//         } else if (msg.action === 'getSpreadsheetData') {
//             const data = await handleSpreadsheetRequest();
//             sendResponse({ data });
//         } else {
//             sendResponse({ error: 'Unknown message type' });
//         }
//     } catch (error) {
//         console.error(`Error processing message of type ${msg.type || msg.action}:`, error.message, error);
//         sendResponse({ error: error.message });
//     }
//     return true;
// }


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
    } else if (msg.action === 'getSpreadsheetData') {
        handleSpreadsheetRequest().then(data => {
            sendResponse(data);
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






// const SPREADSHEET_ID = '1lVieMcfQge-smzPKRYBo9j8Pw6VKamnw8n6wq4pnmBU';

// async function fetchSpreadsheetData(spreadsheetId) {
//     try {
//         const response = await fetch(
//             `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:B`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${await getAuthToken()}`
//                 }
//             }
//         );
//         if (!response.ok) {
//             const errorResponse = await response.json();
//             console.error('Google API error response:', errorResponse);
//             throw new Error(`Error fetching data: ${response.status} ${response.statusText} - ${JSON.stringify(errorResponse)}`);
//         }
//         const data = await response.json();
//         return data.values;
//     } catch (error) {
//         console.error('Error in fetchSpreadsheetData:', error.message, error);
//         if (error.response) {
//             console.error('Response:', error.response);
//             console.error('Response data:', error.response.data);
//         }
//         throw error;
//     }
// }

// async function getAuthToken() {
//     return new Promise((resolve, reject) => {
//         chrome.identity.getAuthToken({ interactive: true }, token => {
//             if (chrome.runtime.lastError || !token) {
//                 console.error('Error getting auth token:', chrome.runtime.lastError);
//                 reject(new Error(chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Failed to get auth token'));
//                 return;
//             }
//             resolve(token);
//         });
//     });
// }

// async function handleSpreadsheetRequest() {
//     try {
//         const data = await fetchSpreadsheetData(SPREADSHEET_ID);
//         return data;
//     } catch (error) {
//         console.error('Error in handleSpreadsheetRequest:', error.message, error);
//         throw error;
//     }
// }






// let lastCheck = 0;
// const CHECK_INTERVAL = 60000; // 1 minute

// async function fetchSpreadsheetData() {
//     const csvUrl = 'https://docs.google.com/spreadsheets/d/1lVieMcfQge-smzPKRYBo9j8Pw6VKamnw8n6wq4pnmBU//gviz/tq?tqx=out:csv'; // Replace with your actual URL

//     try {
//         const response = await fetch(csvUrl);
//         const csvText = await response.text();
//         const data = csvText.split('\n').map(row => {
//             const columns = row.split(',');
//             return [columns[0], columns[1]]; // A列とB列のみを取得
//         });
//         console.log('Fetched data from spreadsheet:', data); // スプレッドシートから取得したデータをログに出力
//         return data;
//     } catch (error) {
//         console.error('Error fetching spreadsheet data:', error);
//         return null;
//     }
// }


// async function updateBoxDisplay() {
//     const currentTime = Date.now();
//     if (currentTime - lastCheck < CHECK_INTERVAL) return;
//     lastCheck = currentTime;

//     const data = await fetchSpreadsheetData();
//     if (data) {
//         chrome.storage.local.set({ members: data });
//         console.log('Data saved to local storage:', data); // ローカルストレージに保存したデータをログに出力
//     }
// }

// setInterval(updateBoxDisplay, CHECK_INTERVAL);

// chrome.runtime.onInstalled.addListener(() => {
//     updateBoxDisplay();
// });







async function fetchSpreadsheetData() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1lVieMcfQge-smzPKRYBo9j8Pw6VKamnw8n6wq4pnmBU//gviz/tq?tqx=out:csv';

    try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} (${response.statusText})`);
        }
        const csvText = await response.text();
        console.log('Fetched CSV Text:', csvText); // 生のCSVテキストを出力

        // CSVテキストをパースしてデータに変換
        const rows = csvText.trim().split('\n').map(row => row.split(','));
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            let rowData = {};
            row.forEach((cell, index) => {
                rowData[headers[index]] = cell;
            });
            return rowData;
        });

        console.log('Fetched data from spreadsheet:', data); // スプレッドシートから取得したデータをログに出力
        return data;
    } catch (error) {
        console.error('Error fetching spreadsheet data:', error);
        return null;
    }
}


async function checkAndToggleBoxDisplay(email) {
    const data = await fetchSpreadsheetData();
    if (!data || data.length === 0) {
        console.error('Spreadsheet data is empty or not available.');
        return;
    }

    const member = data.find(row => row["メールアドレス"] === email);
    if (!member) {
        console.error('Member not found for email:', email);
        return;
    }

    const displayBox = member["チェックボックスON/OFF"] === 'ON';
    const box = $('.your-box-selector'); // 実際のボックスのセレクタに置き換えてください
    if (box.length) {
        box.css('display', displayBox ? 'block' : 'none');
        console.log('Box display updated:', displayBox ? 'block' : 'none'); // ボックスの表示状態をログに出力
    }
}

// 定期的にボックスの表示を更新する
setInterval(() => {
    const email = 'saori.inagaki@uhero.co.jp'; // ユーザーのメールアドレス
    checkAndToggleBoxDisplay(email);
}, 60000); // 1分ごとに更新
