highlightMenuItem();

function highlightMenuItem(){
    const LIST_ITEM_INDEXES = {
        like_message: 9,	
        introduction: 10,	
        nickname: 11,
        sub_photo: 12,
        
        tweet: 14,
        occupation:15,
        konomi_comment: 16,

        community_group: 18,
        identification_masking: 19
    };

    let path = window.location.pathname.replace('/admin/reviews/','');
    let idx = LIST_ITEM_INDEXES[path];

    if(idx === undefined)return;

    let sidebar = document.getElementById('sidebar');
    let list = sidebar.getElementsByClassName('list-group')[0];
    let item = list.getElementsByClassName('list-group-item')[idx];

    item.classList.add('active');
}
