const puppeteer = require("puppeteer");
const fs = require("fs");
const request = require("request");
const path = require("path");

const HOST="http://www.zhaogexing.com/"
const URL = `${HOST}katongtouxiang`;
const DIR = "./images2";

let index = 1; //页数
let browser;
let page;

const init = async () => {
  browser = await puppeteer.launch({
    headless: false,
  });
  page = await browser.newPage();

  crawler(); //这里执行
};
init();

async function crawler() {
  const pageResult = await page.goto(`${URL}/list_${index}.html`);
  if (pageResult.status() === 404) {
    browser.close();
    console.log('🟢 finish')
    return;
  }
  let images = await page.$$eval(
    "ul>li>a>img",
    (
      el //图片节点，API可查看官方介绍
    ) =>
      el.map((x) => {
        return x.getAttribute("src");
      }) //获取图片的src地址
  );
  mkdirSync(DIR); // 存放目录
  for (url of images) {
    await downloadImg(url, `${DIR}/page${index}_` + new Date().getTime() + ".jpg");
  }

  crawler(++index); //下一页，具体结束页可以自己限制
}

// 同步创建目录
function mkdirSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
  return false;
}

// 下载文件 保存图片
async function downloadImg(url, path) {
  return new Promise(async function (resolve, reject) {
    let writeStream = fs.createWriteStream(path);
    let readStream = await request({
      url,
      headers: {
        Referer: HOST, // 防止403
      },
    });
    await readStream.pipe(writeStream);
    readStream.on("end", function () {
      console.log("文件下载成功");
    });
    readStream.on("error", function (err) {
      console.log("错误信息:" + err);
    });
    writeStream.on("finish", function () {
      console.log("文件写入成功");
      writeStream.end();
      resolve();
    });
  });
}
