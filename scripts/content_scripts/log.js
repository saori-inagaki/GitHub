let start = new Date().getTime();
let LoggedTargets = {};
let Timer = initTimer();
init();

function init(){
    chrome.runtime.sendMessage({type: 'oauth'}).then(async token=>{
        if(!token)return;

        let xpaths = await getAdminXpaths();
        let queueData = initQueueData(xpaths);
        setQueueEventListener(queueData);
    });
    log({
        type: 'load',
        target: window
    });
    setEventListeners();
}

async function getAdminXpaths(){
    let result = await chrome.runtime.sendMessage({
        type: 'get-xpaths'
    });

    return result;
}

function initQueueData(adminXpaths){
    let xpathDict = {};
    let url = window.location.href;

    for(let row of adminXpaths){ 
        if(!url.includes(row.url) || (row.url_parameter !== null && !url.includes(row.url_parameter)))continue;
        if(!(row.parent_xpath in xpathDict))xpathDict[row.parent_xpath] = {};
        if(row.type === 'conversion'){
            if(!('conversions' in xpathDict[row.parent_xpath]))xpathDict[row.parent_xpath].conversions = [];
            xpathDict[row.parent_xpath].conversions.push(row.child_xpath);
        }else{
            xpathDict[row.parent_xpath][row.type] = row.child_xpath;
        }
    }

    let queueData = {};
    let openedAt = new Date().toISOString();
    
    for(let parentXpath in xpathDict){
        let parentElements = getElementsByXPath(parentXpath);

        for(let i = 0;i < parentElements.length;i++){
            let queue = {
                id: getQueueId(xpathDict[parentXpath].queue_id, parentElements[i]),
                user_id: getUserId(xpathDict[parentXpath].user_id, parentElements[i]),
                operator_id: 'EMAIL_FROM_TOKEN',
                url: window.location.href,
                opened_at: openedAt,
                received_at: getReceivedAt(xpathDict[parentXpath].received_at, parentElements[i]),
                active_time: 0
            }

            if(!queue.id && !queue.user_id && !queue.received_at)continue

            let convParentXath = parentXpath;
            if(!('conversions' in xpathDict[convParentXath]))convParentXath = '/';

            for(let convChildXpath of xpathDict[convParentXath].conversions){
                let conversionXpath = convParentXath;
                if(!conversionXpath.endsWith('/'))conversionXpath += `[${i + 1}]/`;
                conversionXpath += convChildXpath;
                if(!(conversionXpath in queueData))queueData[conversionXpath] = [];
                queueData[conversionXpath].push(queue);
            }
        }
    }

    return queueData;
}

function initTimer(){
    let timer = {
        startedAt: new Date().getTime(),
        elapsedTime: 0,
        on: (eventType)=>{
            let now = new Date().getTime();
            if(eventType === 'blur' || eventType === 'conversion'){
                timer.elapsedTime += now - timer.startedAt;
                timer.startedAt = now;
            }else if(eventType === 'focus'){
                timer.startedAt = now;
            }
        }
    }
    return timer;
}

function getQueueId(xpath, parentElement){
    let el = getElementsByXPath(xpath, parentElement)[0];
    if(el === undefined)return null;
    
    if(el.tagName === 'SCRIPT'){
        //要マスキングのみscriptタグ内にidがある
        let match = el.innerHTML.match(/fd\.append\("queue_id", "(\d+)"\);/);
        if(match[1])return Number(match[1]);
        else return null;
    }else if(el.id === 'queue_id' || el.id === 'queues__id'){
        return Number(el.value);
    }else if(el.id.match(/reviews_\d+_.+/)){
        return Number(el.id.split('_')[1]);
    }else{
        return null;
    }
}

function getReceivedAt(xpath, parentElement){
    let el = getElementsByXPath(xpath, parentElement)[0];
    if(el === undefined)return null;
    let match = el.innerHTML.match(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
    if(!match)return null;
    return new Date(match[0]).toISOString();
}


function getUserId(xpath, parentElement){
    let el = getElementsByXPath(xpath, parentElement)[0];
    if(el === undefined)return null;
    let url = new URL(el.href);
    if(!url.searchParams.has('user_id'))return null;
    let userId = url.searchParams.get('user_id');
    return Number(userId);
}

function setEventListeners(){
    const TARGET_EVENTS = [
        'click',
        'change',
        'contextmenu',
        'blur',
        'focus',
        'unload'
    ];

    for(let event of TARGET_EVENTS){
        window.addEventListener(event, log);
    }
}

function setQueueEventListener(queueData){
    for(let xpath in queueData){
        let conversionElement = getElementsByXPath(xpath)[0];
        if(!conversionElement)continue;

        let logQueue = ()=>{
            conversionElement.removeEventListener('click', logQueue);
            Timer.on('conversion');
            let now = new Date().toISOString();
            for(let queue of queueData[xpath]){
                queue.active_time = Timer.elapsedTime;
                queue.created_at = now;
            }
            chrome.runtime.sendMessage({
                type: 'log-queue',
                body: queueData[xpath]
            });
            Timer = initTimer();
        };
        conversionElement.addEventListener('click', logQueue);
    }
}

async function log(e){
    Timer.on(e.type);
    let logData  = {
        user_id: 'EMAIL_FROM_TOKEN',
        url: window.location.href,
        type: e.type,
        target: getXpath(e.target),
    };

    logData.verbose_target = logData.target.replace(/(?<=.)(?<!\])\//g,'[1]/').replace(/(?<=.)(?<!\])$/g,'[1]');

    if(!(logData.type in LoggedTargets))LoggedTargets[logData.type] = [];
    logData.is_first = !LoggedTargets[logData.type].includes(logData.target);
    if(logData.is_first){
        LoggedTargets[logData.type].push(logData.target);
    }
    return chrome.runtime.sendMessage({
        type: 'log-event',
        body: logData
    });
}

function getXpath(element) {
    if(element && element.parentNode) {
        let xpath = getXpath(element.parentNode) + '/' + element.tagName;
        let s = [];

        for(let i = 0; i < element.parentNode.childNodes.length; i++) {
            let e = element.parentNode.childNodes[i];
            if(e.tagName == element.tagName) {
                s.push(e);
            }
        }

        if(1 < s.length) {
            for(let i = 0; i < s.length; i++) {
                if(s[i] === element) {
                    xpath += '[' + (i + 1) + ']';
                    break;
                }
            }
        }

        return xpath.toLowerCase();
    } else {
        return '';
    }
}

function getElementsByXPath(expression, parentElement = document) {
    let r = [];
    let x = document.evaluate(expression, parentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for(let i = 0, l = x.snapshotLength; i < l; i++){
        r.push(x.snapshotItem(i));
    }
    return r;
}