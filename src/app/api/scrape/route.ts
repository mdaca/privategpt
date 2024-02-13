import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Chroma } from 'langchain/vectorstores/chroma';
import { NextRequest, NextResponse } from 'next/server'


let crawled: any[] = [];

export async function POST(request: NextRequest) {
  const body = await request.json();

  const puppeteer = require('puppeteer');
  
  
  const client = new ChromaClient({
    path: "http://localhost:8000"
  });

  const collection = await client.getCollection({
    name: body.name
  });
 
return (async () => { 
	// Initiate the browser 
	const browser = await puppeteer.launch(); 
	 
    await crawlPageAndChildren(browser, body.url, body.name, body.url, collection);
	// Closes the browser and all of its pages 
	await browser.close(); 

    return NextResponse.json({ success: true });
})();

}

async function crawlPageAndChildren(browser: any, url: any, collectionName:any, rootUrl: any, collection: any) {

    let pages = await crawlPage(browser, url, collectionName, collection);
    crawled.push(url);
    for(let i = 0; i < (pages).length; i ++) {

        if(pages[i].indexOf(rootUrl) == 0 && crawled.indexOf(pages[i]) == -1) {
            await crawlPageAndChildren(browser, pages[i], collectionName, rootUrl, collection);
        }

    }
      
}

async function crawlPage (browser:any, url:any, collectionName:any, collection: any): Promise<any[]> {
    
	// Create a new page with the default browser context 
	const page = await browser.newPage(); 
 
	// Get pages HTML content const page = (await browser.pages())[0];
    await page.goto(url);
    let extractedText: string = await page.$eval('*', (el: any) => {
        const selection: any = window.getSelection();
        const range = document.createRange();
        range.selectNode(el);
        selection.removeAllRanges();
        selection.addRange(range);
        let select = window.getSelection();

        return select ? select.toString() : '';
    });

    extractedText = extractedText.replace(/\s+/g,' ').trim();

    console.log(extractedText);

    function splitInto(str : string, len: number): any {
        var regex = new RegExp('.{' + len + '}|.{1,' + Number(len-1) + '}', 'g');
        return str.match(regex );
    }
 
    let chunks: string[] = splitInto(extractedText, 2000);

    let metadatas: any[] = [];

    for(let i = 0; i < chunks.length; i++) {
        metadatas.push({url: url, captured: new Date().toISOString(), chunk: i + 1});
    }

    await collection.delete({
    where: {"url": {"$eq": url}}
    });

    await Chroma.fromTexts(
        chunks,
        metadatas,
        new OpenAIEmbeddings({azureOpenAIApiDeploymentName: 'text-embedding-ada-002'}),
        {
          collectionName: collectionName ?? ""
        });

        
        const pageUrls = await page.evaluate(() => {
            
            function contains(arrIn: any[], v: any) {
                for (var i = 0; i < arrIn.length; i++) {
                if (arrIn[i] === v) return true;
                }
                return false;
            };

            function unique(arrIn: any[]) {
                var arr: any[] = [];
                for (var i = 0; i < arrIn.length; i++) {
                if (!contains(arr, arrIn[i])) {
                    arr.push(arrIn[i]);
                }
                }
                return arr;
            }
            const urlArray = Array.from(document.links).map((link) => {
             
             let uri = link.href;
             if(uri.indexOf('#') > 0) {
                uri = uri.split('#')[1];
             }

             if(uri.endsWith('/') == true) {
                uri = uri.substring(0, uri.length - 1);
             }

             return uri;
                
            });
            //const uniqueUrlArray = [...new Set(urlArray)];
            return unique(urlArray);
        });

    return pageUrls;
}
