// Import library
import puppeteer from 'puppeteer';
import 'dotenv/config';
(async () => {
  // Launch the browser and open a new blank page
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // page를 생성한 직후에 추가
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

  // Navigate the page to a URL

  await page.goto('https://account.everytime.kr/login');

  // Set screen size
//   await page.setViewport({width: 1080, height: 1024});

  // Type into search box
//   await page.type('input[name="id"]', process.env.EVERYTIME_ID);
//   await page.type('input[name="password"]', process.env.EVERYTIME_PASSWORD);
  await page.waitForSelector('input[name="id"]');


  await page.type('input[name="id"]', 'booooo118', { delay: 100 + Math.random() * 150 });
  await page.type('input[name="password"]', 'kore3179*', { delay: 100 + Math.random() * 150 });

  // Wait and click on first result
  const searchResultSelector = 'input[type="submit"]';
  await page.waitForSelector(searchResultSelector);
//   await page.waitForSelector(searchResultSelector);
  await page.click(searchResultSelector);

  await page.waitForNavigation();
// ... (로그인 및 waitForNavigation 까지는 동일)
console.log('로그인 후 페이지 제목:', await page.title());

// --- 1. 게시판으로 이동 ---
const boardLinkSelector = 'a[data-id="377390"]';
await page.waitForSelector(boardLinkSelector); // 링크가 나타날 때까지 기다립니다.
await page.click(boardLinkSelector); 

const postSelector = 'article'; // 실제 게시물 선택자로 변경
await page.waitForSelector(postSelector, { visible: true });

// --- 2. 게시물 크롤링 시작 ---
const allPosts = [];
const MAX_PAGES_TO_CRAWL = 10;
let currentPage = 1;

while (currentPage <= MAX_PAGES_TO_CRAWL) {
    console.log(`현재 페이지(${currentPage}/${MAX_PAGES_TO_CRAWL}) 크롤링 중...`);
    
    // 현재 페이지의 게시물 내용이 나타날 때까지 기다립니다.
    const postSelector = 'article'; // 실제 게시물 선택자로 변경
    await page.waitForSelector(postSelector);

    // 내용이 나타난 것을 확인 후 데이터 수집
    const postsOnPage = await page.evaluate(() => {
        // ... (데이터 수집 로직은 동일)
        const articles = document.querySelectorAll('article');
        const data = [];
        articles.forEach(article => {
          const title = article.querySelector('h2')?.innerText;
          const link = article.querySelector('a')?.href;
          const content = article.querySelector('p.medium')?.innerText;
          const time = article.querySelector('time.small')?.innerText;
          if (title && link) {
            data.push({
              title,
              link,
              content,
              time
            });
        }
    });

    return data;
  });
    console.log('--- 현재 페이지에서 수집된 데이터 ---');
    console.log(postsOnPage);
    console.log('-----------------------------------');
    allPosts.push(...postsOnPage);

    // '다음' 버튼 클릭 로직
    const nextButtonSelector = 'a.next'; // 실제 '다음' 버튼 선택자로 변경
    const nextButton = await page.$(nextButtonSelector);

    if (nextButton && currentPage < MAX_PAGES_TO_CRAWL) { // 마지막 페이지에서는 클릭하지 않도록 조건 추가
        await nextButton.click();
        try {
            await page.waitForSelector(postSelector, { visible: true, timeout: 10000 }); // 10초 타임아웃
        } catch(e) {
            console.log("다음 페이지의 게시물을 로드하지 못했습니다. 크롤링을 종료합니다.");
            break;
        }
        currentPage++;
    } else {
        console.log("마지막 페이지이거나 최대치에 도달하여 크롤링을 종료합니다.");
        break;
    }
}

console.log(`크롤링 완료. 총 ${allPosts.length}개의 게시물을 수집했습니다.`);
await browser.close();

})();



