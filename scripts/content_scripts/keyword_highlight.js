chrome.runtime.onMessage.addListener((request) => {
  console.log('Received message:', request);
  if (request.action === 'pass_data') {

    const keywords = request.data
    const keywords_red = keywords.red
    const keywords_yellow = keywords.yellow
    const keywords_orange = keywords.orange
    const keywords_blue = keywords.blue

    const array_red = JSON.parse(keywords_red)
    const array_yellow = JSON.parse(keywords_yellow)
    const array_orange = JSON.parse(keywords_orange)
    const array_blue = JSON.parse(keywords_blue)
    const paragraphs = document.querySelectorAll("p");

    for (const paragraph of paragraphs) {

      const exclude_class = paragraph.querySelectorAll(".unhighlight")

      if (exclude_class.length > 0) {
        continue;
      }

      console.log(paragraph)

      //if(paragraphのclassがunhighlightだったら)continue
      let html = paragraph.innerHTML;

      // keywords1 のキーワードに対して処理
      if (array_blue.length > 0) {
        for (const keyword of array_blue) {
          const regex = new RegExp(keyword, "g");
          html = html.replace(regex, `<span class="color_blue">${keyword}</span>`);
        }
      }
      // keywords2 のキーワードに対して処理
      if (array_yellow.length > 0) {
        for (const keyword of array_yellow) {
          const regex = new RegExp(keyword, "g");
          html = html.replace(regex, `<span class="color_yellow">${keyword}</span>`);
        }
      }

      // keywords3 のキーワードに対して処理
      if (array_orange.length > 0) {
        for (const keyword of array_orange) {
          const regex = new RegExp(keyword, "g");
          html = html.replace(regex, `<span class="color_orange">${keyword}</span>`);
        }
      }

      // keywords4 のキーワードに対して処理
      if (array_red.length > 0) {
        for (const keyword of array_red) {
          const regex = new RegExp(keyword, "g");
          html = html.replace(regex, `<span class="color_red">${keyword}</span>`);
        }
      }

      paragraph.innerHTML = html; // 更新したHTMLをパラグラフに適用    
    }
  }
});




