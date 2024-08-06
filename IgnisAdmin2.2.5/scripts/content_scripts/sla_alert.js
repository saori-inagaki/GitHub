const SLA_LIMITS = {
    "https://ishtar.with.is/admin/reviews/identification?app_or_web=app": {
        time: 5,
        count: 10,
        bufferTime: 2
    },
    "https://ishtar.with.is/admin/reviews/main_photo?app_or_web=app": {
        time: 90,
        bufferTime: 30
    },
    "https://ishtar.with.is/admin/reviews/first_message?app_or_web=app": {
        time: 60,
        bufferTime: 15
    },
    "https://ishtar.with.is/admin/reviews/identification?app_or_web=web": {
        time: 5,
        count: 10,
        bufferTime: 2
    },
    "https://ishtar.with.is/admin/reviews/main_photo?app_or_web=web": {
        time: 90,
        bufferTime: 15
    },
    "https://ishtar.with.is/admin/reviews/first_message?app_or_web=web": {
        time: 60,
        bufferTime: 15
    },
    "https://ishtar.with.is/admin/reviews/like_message": {
        time: 180,
        bufferTime: 15
    },
    "https://ishtar.with.is/admin/reviews/introduction": {
        time: 180,
        bufferTime: 15
    },
    "https://ishtar.with.is/admin/reviews/nickname": {
        time: 180,
        bufferTime: 15
    },
    "https://ishtar.with.is/admin/reviews/sub_photo": {
        time: 360,
        bufferTime: 60
    },
    "https://ishtar.with.is/admin/reviews/tweet": {
        time: 360,
        bufferTime: 15
    },
    "https://ishtar.with.is/admin/reviews/occupation": {
        time: 360,
        bufferTime: 15
    },
    "https://ishtar.with.is/admin/reviews/konomi_comment": {
        time: 360,
        bufferTime: 15
    },
    "https://ishtar.with.is/admin/reviews/community_group": {
        time: 1440,
        bufferTime: 15
    }
};

checkSla();

function checkSla(){
    let sidebar = document.getElementById('sidebar');
    if(!sidebar)return;
    let rows = sidebar.getElementsByClassName('list-group-item');
    let now = new Date();

    for(let i = 0;i < rows.length;i++){
        let a = rows[i].getElementsByTagName('a')[1];
        if(!a)continue;
        let splitedText = a.innerText.split(' ');
        let task = {
            url: a.href,
            name: splitedText[0],
            receivedAt: splitedText[1] || '',
            count: Number(splitedText[2]) || 0
        }
        
        if(!(task.url in SLA_LIMITS) || task.count === 0)continue;
        let sla = SLA_LIMITS[task.url];

        task.receivedAt = strToDate(task.receivedAt, now);
        let elapsedTime = (now.getTime() - task.receivedAt.getTime()) / 1000 / 60;
        let remainingTime = sla.time - elapsedTime;

        let badge = rows[i].getElementsByClassName('time')[0];
        
        if(remainingTime <= 0){
            rows[i].style.border = '5px solid #FF0000';
            badge.innerHTML += ` (${Math.floor(-remainingTime)}分超)`
        }else if(remainingTime <= sla.bufferTime || (sla.count !== undefined && task.count >= sla.count)){
            rows[i].style.border = '5px solid #FF9600';
            badge.innerHTML += ` (残${Math.floor(remainingTime)}分)`;
        } 
    }
}

function strToDate(strTime, now){
    let date = new Date();
    let temp = strTime.split(':').map(n=>Number(n));
    date.setHours(temp[0]);
    date.setMinutes(temp[1]);
    date.setSeconds(0);
    date.setMilliseconds(0);
    if(now.getTime() < date.getTime()){
        date.setDate(date.getDate() - 1);
    }
    return date;
}