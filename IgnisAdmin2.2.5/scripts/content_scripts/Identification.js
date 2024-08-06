'use strict';

console.log('ignis-identification読み込み完了');

// 審査対象がある時だけ動作するようにします。
if ($('.btn-success').text()) {
  console.log('審査対象を確認しました');
  //承認ボタンを非アクティブにします
  $('.btn-success').prop("disabled", true);


  const unvisibleBox_emails = [
    'megumi.sawasato@op.adish.co.jp',
    'ryo.sato@op.adish.co.jp'
  ];

  const user_email = getEmail();

  // メールアドレスが配列内に存在するかをチェック
  if (unvisibleBox_emails.includes(user_email)) {
    // 一致した場合の処理
    console.log('メールアドレス一致：ボックス非表示');
  } else {
    // 一致しない場合の処理
    console.log('メールアドレス不一致：ボックス表示');
    displayCheckBox();
  }

} else {
  console.log('審査対象はありません');
}




function getEmail() {
  var user_email = $('ul.nav.navbar-nav.navbar-right li:first-child a').text().trim();
  console.log(user_email);
  return user_email;
}




function displayCheckBox() {
  //生年月日を取得します(例："1997(平成09)年 08月 24日生まれでない"の文字列から抽出)
  var text_birthday = $("label.checkbox-inline input[value='diff_birthday']").siblings("strong").text().replace("生まれでない", "");
  var yearYyyy = text_birthday.substr(0, 4);
  var yearYy = text_birthday.substr(4, 6);
  var monthPart = text_birthday.substr(12, 2);
  var dayPart = text_birthday.substr(16, 2);
  var birthday = yearYyyy + yearYy + "/" + monthPart + "/" + dayPart;
  var eighteenCheckBirth = yearYyyy + "/" + monthPart + "/" + dayPart;
  console.log("birthday:" + birthday);
  console.log("eighteenCheckBith:" + eighteenCheckBirth);


  //性別を取得します
  var gender;
  if ($('.review_male_bg').length > 0) {
    gender = "男性";
  } else if ($('.review_female_bg').length > 0) {
    gender = "女性";
  } else {
    gender = "Nothing";
  }
  console.log(gender);


  //チェック項目を配列として生成します
  var array = ["ブラックリストに入っていないユーザーか",
    '18歳以上であるか',
    '有効期限が切れてないユーザーか',
    '発行者・身分証名称が見えているか',
    '性別は' + gender + 'であるか',
    '生年月日は一致しているか<br>　(' + birthday + ')'
  ];


  //チェック項目を出力する場所を作っておきます。
  var adicheckElement = $('<div class="adicheck"><div class="drag-handle"></div><h3>アディッシュチェック事項</h3></div>');

  adicheckElement.find('h3').css({
    'font-size': '18px',
    'font-weight': 'bold',
    'padding-left': '8px',
    'padding-right': '8px'
  });

  adicheckElement.find('.drag-handle').css({
    'height': '30px',
    'background': '#B5B4B4',
    'width': 'calc(100% + 16px)',
    'margin-left': '-8px',
    'margin-right': '-8px',
    'box-sizing': 'border-box',
    'border-top-left-radius': '5px',
    'border-top-right-radius': '5px'
  });

  $('div.col-md-9').append(adicheckElement);

  $('div.adicheck').css({
    'background': '#E6E6E6',
    'width': '250px',
    'padding-left': '8px',
    'padding-right': '8px',
    'border-radius': '5px',
    'position': 'fixed',
    'z-index': 9999,
    'top': '50%',
    'right': '10px'
  });



  //出力する場所に対して、チェック項目を出力していきます。(同時にイベントも設定しておきます)
  for (var i in array) {
    $('div.adicheck').append('<p><label><input type="checkbox" class="adicheck" id="adicheck' + i + '">' + array[i] + '</label></p>');
    $(document).on('change', '#adicheck' + i, function () {
      // console.log($('input.adicheck:checked').length);
      if ($('input.adicheck:checked').length === array.length) {
        console.log('承認ボタンオン')
        $('.btn-success').prop("disabled", false);
        $('.btn-danger').prop("disabled", true);
      } else {
        $('.btn-success').prop("disabled", true);
        $('.btn-danger').prop("disabled", false);
      }
    });
  }


  //ユーザーが今年18歳の年だったら誕生日の文字を赤くします
  //監視日
  let dateTimeText = $('div.text-right span.bg-warning').text();
  let datePartCheck = dateTimeText.split(' ')[0];
  let today = new Date(datePartCheck);

  //監視対象ユーザーの誕生日
  let birthdate = new Date(eighteenCheckBirth);
  birthdate.setHours(0, 0, 0, 0);

  let year = 0;

  //監視日が1月1日〜4月1日の場合は、一つの前の年度にします
  if (3 - 1 >= today.getMonth() || today.getMonth() == 4 - 1 && today.getDate() == 1) {
    year = today.getFullYear() - 19;
    console.log(year);
  } else {
    year = today.getFullYear() - 18;
    console.log(year);
  }

  const start_target_date_eighteen = new Date(today);
  start_target_date_eighteen.setFullYear(year);
  start_target_date_eighteen.setMonth(4 - 1);
  start_target_date_eighteen.setDate(2);
  start_target_date_eighteen.setHours(0, 0, 0, 0);

  const end_target_date_eighteen = new Date(today);
  end_target_date_eighteen.setFullYear(start_target_date_eighteen.getFullYear() + 1);
  end_target_date_eighteen.setMonth(4 - 1);
  end_target_date_eighteen.setDate(1);
  end_target_date_eighteen.setHours(0, 0, 0, 0);

  if (birthdate >= start_target_date_eighteen && birthdate <= end_target_date_eighteen) {
    $("label:has(#adicheck1)").css("color", "red");  // 配列の2番目の要素に対応するHTML要素の色を赤にする
  } else {
    console.log("ユーザーは18歳になる年ではありません。");
  }


  // チェック項目を移動したらその座標を保存します
  $('div.adicheck').draggable({
    containment: 'window',
    handle: '.drag-handle',
    stop: function (event, ui) {
      let absolutePosition = ui.helper.position();
      let relativePosition = {
        left: absolutePosition.left / document.documentElement.clientWidth * 100 + '%',
        top: absolutePosition.top / document.documentElement.clientHeight * 100 + '%'
      };
      //ドラッグすると絶対座標で更新されるがそれだとリサイズ時に位置が変わらないので相対位置で指定しなおす。
      $('div.adicheck').css(relativePosition);
      chrome.storage.sync.set(relativePosition);
    }
  });

  // ページが更新されたら保存していた座標にチェック項目を表示します
  $(document).ready(function () {
    chrome.storage.sync.get(["left", "top"], function (position) {
      $('div.adicheck').css(position);
    });
  });


}




