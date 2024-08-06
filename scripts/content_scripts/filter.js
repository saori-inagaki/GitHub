const URL_PARAM_KEY = 'adso_filter';

init();

function init(){
    let originalSelector = document.getElementById('admin_id');
    let selectorContainer = originalSelector.parentElement;
    originalSelector.removeAttribute('onchange');
    originalSelector.style.display = 'none';

    let dummySelelctor = createCopySelector(originalSelector);
    selectorContainer.appendChild(dummySelelctor);
    let label = selectorContainer.getElementsByTagName('labal')[0];
    label.innerHTML += '(機能停止)';

    createEmailBgContainer();

    let newSelector = createNewSelector(originalSelector);
    let newContainer = document.createElement('div');
    newContainer.appendChild(newSelector);

    let table = getHistoryTable();
    let emailHeader = table.getElementsByTagName('tr')[0].getElementsByTagName('th')[4];
    emailHeader.appendChild(newContainer);

    let urlParams = new URLSearchParams(window.location.href);

    if(urlParams.has(URL_PARAM_KEY)){
        newSelector.value = urlParams.get(URL_PARAM_KEY);
        newSelector.dispatchEvent(new Event('change'));
    }
}

function createCopySelector(originalSelector,targetDomain = ''){
    let newSelector = document.createElement('select');
    let options = originalSelector.getElementsByTagName('option');

    for(let i = 0;i < options.length;i++){
        let email = options[i].innerHTML;
        if(email !== '未選択' && !email.endsWith(targetDomain))continue;
        let newOption = document.createElement('option');
        newOption.value = options[i].value;
        newOption.innerHTML = email;
        newSelector.appendChild(newOption);
    }
    return newSelector;
}

function createNewSelector(originalSelector){
    let newSelector = createCopySelector(originalSelector,'@adish-opus.com');
    newSelector.style.width = '98%';

    newSelector.addEventListener('change',()=>{
        let selected = newSelector.getElementsByTagName('option')[newSelector.selectedIndex];
        filterByEmail(selected.innerHTML);
        setUrlParam(selected.value);
        if(selected.innerHTML === '未選択'){
            newSelector.style.backgroundColor = '#FFFFFF';
        }else{
            newSelector.style.backgroundColor = '#CCEEFF';
        }
    });

    return newSelector;
}

function getBsMainCol(){
    let bsContainer = document.body.getElementsByClassName('container')[0];
    let mainRow =  bsContainer.getElementsByClassName('row')[0];
    let mainCol = mainRow.getElementsByClassName('col-md-9')[0];
    return mainCol;
}

function getHistoryTable(){
    let mainCol = getBsMainCol();
    let table = mainCol.getElementsByTagName('table')[0];
    return table;
}

function createEmailBgContainer(){
    let table = getHistoryTable();
    let rows = table.getElementsByTagName('tr');

    for(let i = 1;i < rows.length;i++){
        let tds = rows[i].getElementsByTagName('td');
        let emailContainer = tds[4];
        let bgContainer = document.createElement('span');
        bgContainer.innerHTML = emailContainer.innerHTML;
        emailContainer.innerHTML = '';
        emailContainer.appendChild(bgContainer);
    }
}

function filterByEmail(email){
    let table = getHistoryTable();
    let rows = table.getElementsByTagName('tr');

    for(let i = 1;i < rows.length;i++){
        let tds = rows[i].getElementsByTagName('td');
        let emailContainer = tds[4].getElementsByTagName('span')[0];

        if(email === '未選択'){
            rows[i].style.display = '';
            emailContainer.style.backgroundColor = '';
        }else if(emailContainer.innerHTML === email){
            rows[i].style.display = '';
            emailContainer.style.backgroundColor = '#CCEEFF';
        }else{
            rows[i].style.display = 'none';
            emailContainer.style.backgroundColor = '#CCEEFF';
        }
    }
}

function setUrlParam(value){
    let mainCol = getBsMainCol();
    let pagingContainer = mainCol.getElementsByClassName('paging_bg-white')[0];
    let nextBtn = pagingContainer.getElementsByClassName('paging_next')[0];
    let a = nextBtn.getElementsByTagName('a')[0];
    let newUrl = (strUrl)=>{
        let url = new URL(strUrl);
        if(value === ''){        
            url.searchParams.delete(URL_PARAM_KEY);
        }else{
            url.searchParams.set(URL_PARAM_KEY,value);
        }
        return url;
    }

    a.href = newUrl(a.href).toString();
    history.replaceState({}, '', newUrl(window.location.href));
}