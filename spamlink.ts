import * as https from 'https';
import { URL } from 'url';

// Regex patterns
const urlRegex = /https?:\/\/[^\s]+/g;
const spammyUrlRegex = /^(https?:\/\/)?(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/[0-9.:\/&]*)?$/;

// Synonyms for clickbait-related words
const clickbaitSynonyms: Record<string, string[]> = {
  limited: ['limited', 'exclusive', 'restricted', 'one-time', 'few', 'rare'],
  sale: ['sale', 'discount', 'bargain', 'deal', 'offer', 'promotion'],
  free: ['free', 'gratis', 'complimentary', 'no cost', 'freebie'],
  hurry: ['hurry', 'act now', 'rush', "don't wait", 'limited time', 'while supplies last'],
  win: ['win', 'won', 'jackpot', 'prize', 'congratulations', 'reward', 'victory'],
  money: ['bank'],
  action: ['confirm', 'confirmation', 'login', 'verify', 'verification'],
};

// Function to check if a URL has a valid SSL certificate and if it redirects
async function validateUrl(websiteUrl: string): Promise<{ valid: boolean; redirect: boolean }> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(websiteUrl);

      if (parsedUrl.protocol === 'https:') {
        // HTTPS URL, check SSL certificate and redirection
        const req = https.request(
          websiteUrl,
          { method: 'HEAD' },
          (res) => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ valid: true, redirect: false });
            } else if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
              resolve({ valid: true, redirect: true });
            } else {
              resolve({ valid: false, redirect: false });
            }
          }
        );

        req.on('error', (e) => {
          console.error(`Problem with request: ${e.message}`);
          resolve({ valid: false, redirect: false });
        });

        req.end();
      } else {
        // HTTP URL, consider as potentially insecure
        resolve({ valid: false, redirect: false });
      }
    } catch (e) {
      console.error(`Invalid URL: ${e.message}`);
      resolve({ valid: false, redirect: false });
    }
  });
}

// Function to decode URL components
function decodeUrl(urlString: string): string {
  try {
    return decodeURIComponent(urlString);
  } catch (e) {
    console.error(`Failed to decode URL: ${e.message}`);
    return urlString;
  }
}

// Function to check if content contains any clickbait keywords
function containsClickbaitKeywords(content: string): boolean {
  const lowercasedContent = content.toLowerCase();

  return Object.values(clickbaitSynonyms).some((synonymList) =>
    synonymList.some((synonym) => lowercasedContent.includes(synonym))
  );
}

async function checkSpamLink(message: { content: string; reply: (msg: string) => void }): Promise<void> {
  const urls = message.content.match(urlRegex);
  const pureSpamUrl = message.content.match(spammyUrlRegex);

  if (pureSpamUrl) {
    //pure spam ;) idk valid or not just found that
    /*
    http://192.168.0.1:8080
    https://127.0.0.1/
    http://10.0.0.1:8080/path/to/12345
    */
  }

  if (urls) {
    for (const urlString of urls) {
      const decodedUrl = decodeUrl(urlString);
      const { valid, redirect } = await validateUrl(decodedUrl);
      const isClickbait = containsClickbaitKeywords(message.content); // Check in message content

      if (!valid) {
        //also links with 404 errors 
        message.reply(`⚠️ The link **${urlString}** might not have a valid SSL certificate or could be insecure.`);
      } else if (redirect) {
        message.reply(`⚠️ The link **${urlString}** appears to redirect to another URL.`);
      }
      if (isClickbait) {
        message.reply(`⚠️ The link **${urlString}** may contain clickbait content.`);
      }
    }
  }
}

export { checkSpamLink };