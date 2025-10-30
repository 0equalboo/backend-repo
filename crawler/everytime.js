// Import library
import puppeteer from 'puppeteer';
import { EverytimePostModel } from '../schema/everytimePost.js'; // 2단계에서 만든 스키마
import 'dotenv/config';

// 1. 코드를 재사용 가능한 함수로 감쌉니다.
export const runCrawler = async () => {
  let browser; // browser를 상위에 선언
  try {
    // Launch the browser
    browser = await puppeteer.launch({
      headless: true, // 서버 환경에서는 'new' 대신 true
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // EC2(Linux) 환경에서 실행 시 필요
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

    // Navigate the page to a URL
    await page.goto('https://account.everytime.kr/login');

    // Type into search box
    await page.waitForSelector('input[name="id"]');
    await page.type('input[name="id"]', process.env.EVERYTIME_ID, { delay: 100 + Math.random() * 150 });
    await page.type('input[name="password"]', process.env.EVERYTIME_PASSWORD, { delay: 100 + Math.random() * 150 });

    // Click login
    const searchResultSelector = 'input[type="submit"]';
    await page.waitForSelector(searchResultSelector);
    await page.click(searchResultSelector);

    const boardUrl = 'https://everytime.kr/377390';
    console.log('로그인 성공. 게시판 목록 페이지로 이동합니다...');
    await page.goto(boardUrl, { waitUntil: 'networkidle2' }); // 페이지 로드를 기다림

    // --- 2. (수정됨) 이제 '분실물 게시판' 링크를 찾아 클릭 ---
    // const boardLinkSelector = 'a[data-id="377390"]'; // 분실물 게시판
    
    // console.log(`분실물 게시판 링크(${boardLinkSelector})를 찾는 중...`);
    // await page.waitForSelector(boardLinkSelector); // 이제 이 링크를 찾을 수 있습니다.
    // await page.click(boardLinkSelector);
    
    // --- 3. 게시물 크롤링 시작 ---
    const postSelector = 'article';
    await page.waitForSelector(postSelector, { visible: true });

    // --- 2. 게시물 크롤링 시작 ---
    const MAX_PAGES_TO_CRAWL = 10;
    let currentPage = 1;

    while (currentPage <= MAX_PAGES_TO_CRAWL) {
      console.log(`현재 페이지(${currentPage}/${MAX_PAGES_TO_CRAWL}) 크롤링 중...`);
      
      const postSelector = 'article';
      await page.waitForSelector(postSelector);

      // 현재 페이지의 게시물 데이터 수집
      const postsOnPage = await page.evaluate(() => {
        const articles = document.querySelectorAll('article');
        const data = [];
        articles.forEach(article => {
          const title = article.querySelector('h2')?.innerText;
          const link = article.querySelector('a')?.href;
          const content = article.querySelector('p.medium')?.innerText;
          const time = article.querySelector('time.small')?.innerText;
          if (title && link) {
            data.push({ title, link, content, time });
          }
        });
        return data;
      });

      // 3. allPosts 배열 대신, DB에 바로 저장 (중복 방지)
      let savedCount = 0;
      for (const post of postsOnPage) {
        try {
          // findOneAndUpdate와 upsert:true를 사용해 중복을 방지합니다.
          // link가 DB에 이미 있으면 업데이트, 없으면 새로 생성(insert)합니다.
          await EverytimePostModel.findOneAndUpdate(
            { link: post.link }, // 고유한 link로 문서를 찾습니다.
            post,               // 저장할 데이터
            { upsert: true }     // 없으면 새로 생성 (Update + Insert)
          );
          savedCount++;
        } catch (dbError) {
          // unique link 제약조건 위반 등 에러 로깅
          // console.error('DB 저장 오류:', dbError.message);
        }
      }
      console.log(`페이지 ${currentPage}: ${savedCount}개 게시물 DB 저장/업데이트 완료.`);
      
      // '다음' 버튼 클릭 로직
      const nextButtonSelector = 'a.next';
      const nextButton = await page.$(nextButtonSelector);

      if (nextButton && currentPage < MAX_PAGES_TO_CRAWL) {
        await nextButton.click();
        try {
          await page.waitForSelector(postSelector, { visible: true, timeout: 10000 });
        } catch (e) {
          console.log("다음 페이지 로드 실패. 크롤링을 종료합니다.");
          break;
        }
        currentPage++;
      } else {
        console.log("마지막 페이지이거나 최대치에 도달하여 크롤링을 종료합니다.");
        break;
      }
    }
  } catch (error) {
    console.error('크롤러 실행 중 오류 발생:', error);
  } finally {
    // 4. 에러가 발생하더라도 브라우저는 항상 닫도록 finally에 배치
    if (browser) {
      await browser.close();
      console.log('크롤러 브라우저 종료.');
    }
  }
};
