const TEMPLATES = [
    {
        name: '未選択',
        title: '',
        body: ''
    },{
        name: '暇つぶし',
        title: 'withサポートセンターです',
        body: 'withサポートセンターです。\n\nお客様の投稿において、真剣な恋愛目的ではないと捉えられる文章（「暇つぶし」「友達探し」など）が確認できました。\nwithは将来を見据えた恋愛や結婚を真剣に考えている異性同士のマッチングサービスのため、誤解を招くようなご投稿はお控えください。\n\n\nなお、もしも真剣な恋愛や結婚を目的としない場合は、速やかにご退会をお願いいたします。\n今後同様の投稿が確認できましたら、利用停止となる可能性もありますので、ご注意ください。'
    },{
        name: '年齢間違い（警告）',
        title: 'withサポートセンターです',
        body: 'ご利用いただきありがとうございます。\nwithサポートセンターです。\n\nお客様のご利用におきまして、実際と異なる年齢を記載する投稿が確認できております。\nそのような投稿をするのはおやめください。\nこれを以って警告とさせていただきます。\n\n今後メッセージやつぶやき、自己紹介等で同じような投稿が確認できた場合には、\n当サイトのご利用を制限させていただきますのでその旨ご了承ください。\n\nよろしくお願いいたします。'
    },{
        name: '連絡先を交換しているお相手への送信文',
        title: '悪質ユーザーとマッチングしました',
        body: 'withサポートセンターです。\n\nお客様とマッチングされた「●● xx歳」は詐欺行為を行う悪質なユーザーであることが判明し、利用停止対応を行いました。\nもしもLINE等の連絡先を交換されていた場合、今後のご連絡はおやめください。\n\nこの度は、残念なお気持ちとさせてしまい、誠に申し訳ございません。\n\nなお、この度の対応は詐欺被害を未然に防ぐものであり、実際に詐欺行為を確認したものではございません。\nしかしながら、withのみならずマッチングサイトを利用した詐欺行為には、下記の特徴がございます。\n\n・二人の結婚資金を貯めるためなどの理由で投資や副業に誘ってくる\n・携帯が調子悪いなどの理由で他の有料サイトでの連絡を促してくる\n\nどのような理由であっても、金銭を要求する行為には応じないようご注意くださいませ。\n\n弊社でも、より安全にご利用いただけるよう監視体制の強化に努めてまいりますが、次のような会員がいましたらお相手のプロフィール右上にある「・・・」ボタンより違反報告を行っていただけますと幸いです。\n\n・不自然な日本語を使用する\n・マッチング後数日以内に連絡先を交換する\n・金銭の要求がある\n\n引き続きwithをよろしくお願いいたします。'
    }
];

init();

function init(){
    let selector = createSelector();
    let originalSelector = document.getElementById('admin_notification_form_template_id');
    let titleInput = document.getElementById('admin_notification_form_title');
    let textarea = document.getElementById('admin_notification_form_body');

    selector.onchange = ()=>{
        titleInput.value = TEMPLATES[selector.selectedIndex].title;
        textarea.value = TEMPLATES[selector.selectedIndex].body;
        originalSelector.selectedIndex = 0;
    }  
    
    originalSelector.onchange = ()=>{
        selector.selectedIndex = 0;
        titleInput.value = 'withサポートセンターです';
    }
    
    let formGroup = createFormGroup();
    formGroup.appendChild(selector);

    let form = document.getElementById('new_admin_notification_form');
    form.parentNode.insertBefore(formGroup, form);  
}

function createSelector(){
    let selector = document.createElement('select');
    selector.className = 'form-control';

    for(let template of TEMPLATES){
        let option = document.createElement('option');
        option.innerHTML = template.name;
        selector.appendChild(option);
    }

    return selector;
}

function createFormGroup(){
    let formGroup = document.createElement('div');
    formGroup.className = 'form_group';

    let label = document.createElement('label');
    label.innerHTML = 'ADSテンプレート';
    formGroup.appendChild(label);

    return formGroup;
}